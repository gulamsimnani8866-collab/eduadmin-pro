// src/lib/date.js — Shared Firestore timestamp formatting helper
import { format } from 'date-fns'

/**
 * Format a Firestore Timestamp, Date, or date string safely.
 *
 * @param {*}      val     - Firestore Timestamp, Date, or ISO string
 * @param {string} pattern - date-fns format string
 * @returns {string}
 */
export function formatFirestoreDate(val, pattern = 'd MMM yyyy, h:mm a') {
  if (!val) return '—'
  try {
    const d = typeof val?.toDate === 'function'
      ? val.toDate()
      : typeof val?.seconds === 'number'
        ? new Date(val.seconds * 1000)
        : new Date(val)
    return isNaN(d.getTime()) ? '—' : format(d, pattern)
  } catch {
    return '—'
  }
}
