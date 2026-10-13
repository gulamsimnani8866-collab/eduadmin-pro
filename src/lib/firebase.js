// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging'

// Your Firebase config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyBhWoPBzFXmLbuBJ9AWpTu4myV6l3a79Xg",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "jscdatabase.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "jscdatabase",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "jscdatabase.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1021945329898",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:1021945329898:web:113cce6bdce5e66cf1ff93",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-5ZRHTBBSDY"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

export let analytics = null
export let messaging = null
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then(ok => { if (ok) analytics = getAnalytics(app) }).catch(() => {})
  isMessagingSupported().then(ok => { if (ok) messaging = getMessaging(app) }).catch(() => {})
}

export default app