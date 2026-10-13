// src/lib/fcm.js — Firebase Cloud Messaging utilities

import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Request notification permission and obtain FCM token.
 * @returns {Promise<string|null>}
 */
export async function requestFCMToken() {
  if (!messaging) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    return await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      ),
    })
  } catch (err) {
    console.error('[FCM] Token request failed:', err)
    return null
  }
}

/**
 * Listen for foreground push messages.
 * @param {Function} handler - (payload) => void
 * @returns {Function} unsubscribe
 */
export function onForegroundMessage(handler) {
  if (!messaging) return () => {}
  return onMessage(messaging, handler)
}
