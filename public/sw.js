// Retire any legacy root-scoped service worker previously installed on this origin.
// Quick Score uses its own service worker and a narrower /live/quick-score scope.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
