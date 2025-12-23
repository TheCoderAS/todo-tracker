import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_NEXT_GEN_TRACK;

const serviceAccount = rawServiceAccount ? JSON.parse(rawServiceAccount) : null;

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(
          serviceAccount ?? {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
          }
        )
      });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminMessaging = getMessaging(app);
