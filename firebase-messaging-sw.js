/* Delligen Technologies — background sync worker
   Handles push notifications while the app is closed or backgrounded.
   Notification text is intentionally generic (never shows message content). */

importScripts('vendor/firebase/firebase-app-compat.js');
importScripts('vendor/firebase/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCd_vkYV4yrr-kF-MjRaICS8zZ69ujn8_o",
  authDomain: "dilligen-technologies.firebaseapp.com",
  projectId: "dilligen-technologies",
  storageBucket: "dilligen-technologies.firebasestorage.app",
  messagingSenderId: "528145396535",
  appId: "1:528145396535:web:f069da35d1edb7141ea0b2",
  measurementId: "G-XMF47SY9DW"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const isPing = data.kind === 'ping';

  const title = 'Delligen Technologies';
  const body = isPing
    ? 'Priority flag raised on your report.'
    : 'Your worksheet was updated.';

  const options = {
    body,
    icon: 'icons/icon-192.png',
    badge: 'icons/badge-72.png',
    tag: 'delligen-sync',
    renotify: true,
    // Android honors this pattern; iOS/desktop will fall back to default
    vibrate: isPing ? [300, 150, 300, 150, 300, 150, 300, 150, 300] : [200, 100, 200],
    data: { url: self.registration.scope, kind: data.kind || 'msg' }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(self.registration.scope);
    })
  );
});
