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

const formatDisplayDate = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

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

app.get("/", (_req, res) => {
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aura Pulse Service</title>
    <link rel="icon" href="${TARGET_URL}/aura-pulse.png" />
    <style>
      :root {
        color-scheme: dark;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
        background: radial-gradient(circle at 20% 20%, #1f2937 0%, #0b1120 45%, #020617 100%);
        color: #e2e8f0;
        position: relative;
        overflow: hidden;
      }
      .orb {
        position: absolute;
        width: 360px;
        height: 360px;
        border-radius: 50%;
        filter: blur(30px);
        opacity: 0.35;
        animation: float 18s ease-in-out infinite;
      }
      .orb.one {
        background: radial-gradient(circle, rgba(34, 211, 238, 0.5), transparent 70%);
        top: -120px;
        left: -60px;
      }
      .orb.two {
        background: radial-gradient(circle, rgba(16, 185, 129, 0.45), transparent 70%);
        bottom: -140px;
        right: -80px;
        animation-delay: -6s;
      }
      @keyframes float {
        0%, 100% {
          transform: translateY(0) translateX(0) scale(1);
        }
        50% {
          transform: translateY(20px) translateX(10px) scale(1.05);
        }
      }
      .card {
        width: min(560px, 90vw);
        padding: 32px;
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(148, 163, 184, 0.2);
        box-shadow: 0 20px 60px rgba(2, 6, 23, 0.6);
        backdrop-filter: blur(16px);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
        font-weight: 600;
      }
      p {
        margin: 0 0 24px;
        font-size: 14px;
        color: #94a3b8;
      }
      .meta {
        display: grid;
        gap: 8px;
        font-size: 12px;
        color: #cbd5f5;
        margin-bottom: 24px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 20px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #10b981, #22d3ee);
        color: #031a17;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 30px rgba(16, 185, 129, 0.35);
      }
    </style>
  </head>
  <body>
    <div class="orb one"></div>
    <div class="orb two"></div>
    <div class="card">
      <h1>Aura Pulse Health</h1>
      <p>Aura Pulse is running. Jump back to the main app anytime.</p>
      <div class="meta">
        <div>Interval: ${INTERVAL_MINUTES} minutes</div>
        <div>Last run: ${formatDisplayDate(lastRunAt)}</div>
        <div>Last status: ${lastResult?.status ?? "—"}</div>
      </div>
      <a class="button" href="${TARGET_URL}">
        Go to Aura Pulse
      </a>
    </div>
  </body>
</html>`);
});

app.get("/favicon.ico", (_req, res) => {
  res.redirect(`${TARGET_URL}/favicon.ico`);
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
    lastRunAt = new Date().toISOString();
    sendDueTodayNotifications()
      .then((results) => {
        lastResult = { status: "ok", usersNotified: results.length };
      })
      .catch((error) => {
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
