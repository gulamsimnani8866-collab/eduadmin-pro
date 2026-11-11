// src/lib/storage.js — Unified upload / download / delete utilities
// Images and files (PDF, DOCX, XLSX, ZIP, etc.) → Cloudinary
// Video files (MP4, WebM, MOV) → Firebase Cloud Storage

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage } from './firebase'
import { uploadToCloudinary, isCloudinaryUrl } from './cloudinary'

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|mkv|avi|m4v)$/i

function isVideoUpload(file, path = '') {
  if (file?.type?.startsWith('video/')) return true
  if (VIDEO_EXTENSIONS.test(file?.name || '')) return true
  if (typeof path === 'string' && path.includes('/videos/')) return true
  return false
}

function getFolderFromPath(path = '') {
  if (typeof path !== 'string' || !path.trim()) return ''
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 1) return parts[0] || ''
  return parts.slice(0, -1).join('/')
}

/**
 * Upload a file with progress tracking.
 * Routes images and documents (PDF, DOCX, etc.) to Cloudinary, while keeping
 * video uploads on Firebase Cloud Storage.
 *
 * @param {File}     file         - The file to upload
 * @param {string}   path         - Storage path, e.g. "courses/abc/cover"
 * @param {Function} onProgress   - (percent: number) => void
 * @returns {Promise<string>}     - Download URL
 */
export function uploadFile(file, path, onProgress) {
  if (!isVideoUpload(file, path)) {
    const folder = getFolderFromPath(path)
    return uploadToCloudinary(file, folder, onProgress)
  }

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
 * Delete a file from Firebase Storage by its full path or download URL.
 * Cloudinary URLs are skipped because unsigned browser clients cannot delete assets.
 *
 * @param {string} pathOrUrl
 */
export async function deleteFile(pathOrUrl) {
  if (!pathOrUrl || isCloudinaryUrl(pathOrUrl)) return

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
 * Get a download URL for an existing Firebase Storage path.
 *
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function getFileUrl(path) {
  return getDownloadURL(ref(storage, path))
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

export const storagePaths = {
  courseCover:        (courseId)      => `courses/${courseId}/cover`,
  video:              (courseId, id)  => `courses/${courseId}/videos/${id}`,
  material:           (courseId, id)  => `courses/${courseId}/materials/${id}`,
  syllabusPdf:        (courseId)      => `documents/${courseId}/syllabus.pdf`,
  questionImage:      (qId)           => `questions/${qId}/image`,
  questionPdf:        (qId)           => `questions/${qId}/pdf`,
  paperFile:          (paperId, type) => `papers/${paperId}/${type}`,
  lectureThumb:       (id)            => `thumbnails/${id}`,
  notificationBanner: (id)            => `notifications/${id}`,
}
