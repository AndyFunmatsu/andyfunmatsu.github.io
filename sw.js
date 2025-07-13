self.addEventListener("install", () => {
  // Optional: skip waiting to activate right away
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  // Optional: take control of any open clients
  self.clients.claim();
});

self.addEventListener("push", event => {
  // Only used if you're pushing from a backend
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  // Optional: handle click behavior
});
