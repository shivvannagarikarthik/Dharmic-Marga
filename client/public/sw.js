self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  // Creating a simple push handler, though we trigger from client for now
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dharmic Marga', {
      body: data.body || 'New Message',
      icon: '/vite.svg',
      vibrate: [200, 100, 200]
    })
  );
});
