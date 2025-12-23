import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

const buildDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const usersSnapshot = await adminDb.collection("users").get();
  const { start, end } = buildDateRange();
  const sendResults: Array<{ uid: string; sent: number }> = [];

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const todosSnapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("todos")
      .where("status", "==", "pending")
      .where("scheduledDate", ">=", start)
      .where("scheduledDate", "<=", end)
      .get();

    if (todosSnapshot.empty) {
      continue;
    }

    const tokenSnapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("fcmTokens")
      .get();

    const tokens = tokenSnapshot.docs.map((doc) => doc.id).filter(Boolean);
    if (!tokens.length) continue;

    const titles = todosSnapshot.docs.slice(0, 3).map((doc) => doc.get("title"));
    const remaining = todosSnapshot.size - titles.length;
    const detail = remaining > 0 ? `${titles.join(", ")} +${remaining} more` : titles.join(", ");

    const message = {
      notification: {
        title: `Due today: ${todosSnapshot.size} task${todosSnapshot.size === 1 ? "" : "s"}`,
        body: detail || "Open Aura Pulse to review today's schedule."
      },
      data: { url: "/todos" },
      tokens
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    sendResults.push({ uid, sent: response.successCount });

    if (response.failureCount > 0) {
      response.responses.forEach((res, index) => {
        if (!res.success) {
          const token = tokens[index];
          adminDb
            .collection("users")
            .doc(uid)
            .collection("fcmTokens")
            .doc(token)
            .set({ disabledAt: FieldValue.serverTimestamp() }, { merge: true });
        }
      });
    }
  }

  return NextResponse.json({ ok: true, usersNotified: sendResults.length, results: sendResults });
}
