const express = require("express");
const cors = require("cors");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const app = express();
app.use(express.json());

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "https://next-gen-track.web.app"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_NEXT_GEN_TRACK;
if (!serviceAccountRaw) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_NEXT_GEN_TRACK");
}

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(JSON.parse(serviceAccountRaw || "{}"))
      });

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminMessaging = getMessaging(adminApp);

const TARGET_URL = process.env.TARGET_URL || "https://next-gen-track.web.app";
const CRON_SECRET = process.env.CRON_SECRET || "";
const INTERVAL_MINUTES = Number(process.env.INTERVAL_MINUTES || "5");

let lastRunAt = null;
let lastResult = null;

const buildDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const sendDueTodayNotifications = async () => {
  const usersSnapshot = await adminDb.collection("users").get();
  const { start, end } = buildDateRange();
  const sendResults = [];

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

    if (todosSnapshot.empty) continue;

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

  return sendResults;
};

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    target: TARGET_URL,
    intervalMinutes: INTERVAL_MINUTES,
    lastRunAt,
    lastResult
  });
});

app.post("/register", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = req.body?.token;
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(idToken);

    await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("fcmTokens")
      .doc(token)
      .set(
        {
          token,
          userAgent: req.body?.userAgent ?? null,
          createdAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/send-due-today", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const results = await sendDueTodayNotifications();
    lastRunAt = new Date().toISOString();
    lastResult = { status: "ok", usersNotified: results.length };
    return res.json({ ok: true, usersNotified: results.length, results });
  } catch (error) {
    lastRunAt = new Date().toISOString();
    lastResult = { status: "error", message: String(error) };
    return res.status(500).json({ error: "Send failed" });
  }
});

const startScheduler = () => {
  const intervalMs = Math.max(INTERVAL_MINUTES, 1) * 60 * 1000;
  const run = () => {
    sendDueTodayNotifications()
      .then((results) => {
        lastRunAt = new Date().toISOString();
        lastResult = { status: "ok", usersNotified: results.length };
      })
      .catch((error) => {
        lastRunAt = new Date().toISOString();
        lastResult = { status: "error", message: String(error) };
      });
  };

  run();
  setInterval(run, intervalMs);
};

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  startScheduler();
  console.log(`Notification service listening on ${PORT}, interval ${INTERVAL_MINUTES}m`);
});
