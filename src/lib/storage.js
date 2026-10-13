// src/lib/storage.js — Unified upload / download / delete utilities

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a file with progress tracking.
 *
 * @param {File}     file         - The file to upload
 * @param {string}   path         - Storage path, e.g. "courses/abc/cover.jpg"
 * @param {Function} onProgress   - (percent: number) => void
 * @returns {Promise<string>}     - Download URL
 */
export function uploadFile(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    })

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        )
        onProgress?.(pct)
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

/**
 * Delete a file from Storage by its full path or download URL.
 *
 * @param {string} pathOrUrl
 */
export async function deleteFile(pathOrUrl) {
  try {
    const fileRef = pathOrUrl.startsWith('https')
      ? ref(storage, decodeURIComponent(pathOrUrl.split('/o/')[1].split('?')[0]))
      : ref(storage, pathOrUrl)
    await deleteObject(fileRef)
  } catch (err) {
    // File may not exist — silently ignore 404-style errors
    if (err.code !== 'storage/object-not-found') throw err
  }
}

/**
 * Get a download URL for an existing storage path.
 *
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function getFileUrl(path) {
  return getDownloadURL(ref(storage, path))
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

export const storagePaths = {
  courseCover:    (courseId)     => `courses/${courseId}/cover`,
  video:          (courseId, id) => `courses/${courseId}/videos/${id}`,
  material:       (courseId, id) => `courses/${courseId}/materials/${id}`,
  syllabusPdf:    (courseId)     => `documents/${courseId}/syllabus.pdf`,
  questionImage:  (qId)          => `questions/${qId}/image`,
  paperFile:      (paperId, type) => `papers/${paperId}/${type}`,
}
