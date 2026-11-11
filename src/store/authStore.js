// src/store/authStore.js — Pure Firebase Auth & Firestore Admin Session
import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export const useAuthStore = create((set, get) => ({
  admin: null,
  loading: true,
  error: null,

  // ── Actions ──────────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ error: null })
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      
      // Fetch admin authorization record from Firestore
      const snap = await getDoc(doc(db, 'admins', cred.user.uid))
      if (!snap.exists()) {
        // Fallback: If auth succeeds in Firebase Auth, assign base admin role
        const adminData = {
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName || cred.user.email.split('@')[0],
          role: 'admin',
        }
        set({ admin: adminData, loading: false })
        return adminData
      }

      const adminData = { uid: cred.user.uid, ...snap.data() }
      set({ admin: adminData, loading: false })
      return adminData
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  logout: async () => {
    try {
      await signOut(auth)
    } catch (e) {
      console.warn('Signout warning:', e)
    }
    set({ admin: null, loading: false })
  },

  // ── Firebase auth listener (call once in App.jsx) ─────────────────────────

  init: () => {
    try {
      return onAuthStateChanged(
        auth,
        async user => {
          if (user) {
            try {
              const snap = await getDoc(doc(db, 'admins', user.uid))
              set({
                admin: snap.exists()
                  ? { uid: user.uid, ...snap.data() }
                  : { uid: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0], role: 'admin' },
                loading: false,
              })
            } catch {
              set({
                admin: { uid: user.uid, email: user.email, name: user.email.split('@')[0], role: 'admin' },
                loading: false,
              })
            }
          } else {
            set({ admin: null, loading: false })
          }
        },
        error => {
          console.error('[Firebase Auth Error]:', error)
          set({ admin: null, loading: false, error: error.message })
        }
      )
    } catch (err) {
      set({ admin: null, loading: false, error: err.message })
    }
  },
}))
