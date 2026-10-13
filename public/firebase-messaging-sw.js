// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of the public directory

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Firebase config — these are safe to expose (they're public identifiers)
firebase.initializeApp({
  apiKey:            self.__FIREBASE_API_KEY__            || 'AIzaSyBhWoPBzFXmLbuBJ9AWpTu4myV6l3a79Xg',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN__        || 'jscdatabase.firebaseapp.com',
  projectId:         self.__FIREBASE_PROJECT_ID__         || 'jscdatabase',
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET__     || 'jscdatabase.firebasestorage.app',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '1021945329898',
  appId:             self.__FIREBASE_APP_ID__             || '1:1021945329898:web:113cce6bdce5e66cf1ff93',
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message received:', payload)

  const { title, body, image } = payload.notification ?? {}
  const notificationOptions = {
    body:    body    ?? 'New notification',
    icon:    image   ?? '/logo.png',
    badge:   '/badge.png',
    data:    payload.data ?? {},
    actions: [
      { action: 'open',    title: 'Open App'  },
      { action: 'dismiss', title: 'Dismiss'   },
    ],
  }

  self.registration.showNotification(title ?? 'EduAdmin Pro', notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.deepLink ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen)
    })
  )
})
