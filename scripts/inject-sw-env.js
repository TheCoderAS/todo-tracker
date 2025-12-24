const fs = require("fs");
const path = require("path");

const swPath = path.join(process.cwd(), "public", "sw.js");

const replacements = {
  __FIREBASE_API_KEY__: process.env.VITE_FIREBASE_API_KEY,
  __FIREBASE_AUTH_DOMAIN__: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  __FIREBASE_PROJECT_ID__: process.env.VITE_FIREBASE_PROJECT_ID,
  __FIREBASE_STORAGE_BUCKET__: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  __FIREBASE_MESSAGING_SENDER_ID__: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  __FIREBASE_APP_ID__: process.env.VITE_FIREBASE_APP_ID
};

const missing = Object.entries(replacements)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.warn(
    `[inject-sw-env] Missing env vars for: ${missing.join(", ")}. Leaving placeholders.`
  );
  process.exit(0);
}

let swContent = fs.readFileSync(swPath, "utf8");
Object.entries(replacements).forEach(([placeholder, value]) => {
  swContent = swContent.replaceAll(placeholder, value);
});

fs.writeFileSync(swPath, swContent);
console.log("[inject-sw-env] Service worker config injected.");
