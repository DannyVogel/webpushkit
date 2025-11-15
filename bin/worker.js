self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const options = {
    title: data.title || "Notification",
    body: data.body || "",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-72x72.png",
    image: data.image,
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    renotify: data.renotify || false,
    timestamp: data.timestamp || Date.now(),
    vibrate: data.vibrate,
    lang: data.lang || "en",
    dir: data.dir || "auto",
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(options.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || "/";

  event.waitUntil(clients.openWindow(urlToOpen));
});

