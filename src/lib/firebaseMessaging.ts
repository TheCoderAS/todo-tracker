import { getMessaging, isSupported } from "firebase/messaging";

import { app } from "@/lib/firebase";

export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};
