importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload?.data?.title || "Aura Pulse";
  const body = payload?.data?.body || "You have updates waiting.";
  const url = payload?.data?.url || "/todos";
  const notificationId =
    payload?.data?.notificationId ||
    (self.crypto && "randomUUID" in self.crypto
      ? self.crypto.randomUUID()
      : String(Date.now()));
  const notificationData = { url, notificationId, title, body };
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "notification-received", payload: notificationData });
    });
  });
  self.registration.showNotification(title, {
    body,
    data: notificationData
  });
});

const CACHE_NAME = "aura-pulse-v2";
const CORE_ASSETS = ["/", "/manifest.json", "/aura-pulse.png", "/favicon-96x96.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => undefined);
      if (cached) {
        fetchPromise.then(() => undefined);
        return cached;
      }
      return fetchPromise.then((response) => response ?? caches.match("/"));
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notificationData = event.notification?.data ?? {};
  const targetUrl = notificationData.url ?? "/todos";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.postMessage({
            type: "notification-clicked",
            payload: notificationData
          });
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl).then((client) => {
          client?.postMessage({
            type: "notification-clicked",
            payload: notificationData
          });
          return client;
        });
      }
      return undefined;
    })
  );
});
