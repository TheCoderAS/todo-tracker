import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type RegisterPayload = {
  token: string;
  userAgent?: string;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.replace("Bearer ", "");
  const decoded = await adminAuth.verifyIdToken(idToken);
  const payload = (await request.json()) as RegisterPayload;

  if (!payload?.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("fcmTokens")
    .doc(payload.token)
    .set(
      {
        token: payload.token,
        userAgent: payload.userAgent ?? null,
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  return NextResponse.json({ ok: true });
}
