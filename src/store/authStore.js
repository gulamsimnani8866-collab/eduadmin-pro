// src/store/authStore.js — Global auth state via Zustand

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
      const snap = await getDoc(doc(db, 'admins', cred.user.uid))
      if (!snap.exists()) throw new Error('Admin record not found')
      set({ admin: { uid: cred.user.uid, ...snap.data() }, loading: false })
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  logout: async () => {
    await signOut(auth)
    set({ admin: null })
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
                admin: snap.exists() ? { uid: user.uid, ...snap.data() } : null,
                loading: false,
              })
            } catch {
              set({ admin: null, loading: false })
            }
          } else {
            set({ admin: null, loading: false })
          }
        },
        error => {
          console.error('[Auth]', error)
          set({ admin: null, loading: false, error: error.message })
        }
      )
    } catch (err) {
      set({ admin: null, loading: false, error: err.message })
    }
  },
}))
