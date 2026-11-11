// src/hooks/useFirestore.js — Pure Real-time Firestore hooks (Direct Database Reflection)
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, query, orderBy, limit, startAfter,
  onSnapshot, doc, addDoc, updateDoc, deleteDoc,
  setDoc, serverTimestamp, where
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import toast from 'react-hot-toast'
import { uploadFile } from '../lib/storage'

/**
 * Generic real-time collection hook with pagination + CRUD reflecting pure Firestore data.
 *
 * @param {string} collectionName - Name of the Firestore collection
 * @param {object} options - Query configuration
 */
export function useCollection(collectionName, options = {}) {
  const {
    orderByField = 'createdAt',
    orderDir     = 'desc',
    pageSize     = 50,
    filters      = [],
  } = options

  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const lastDocRef = useRef(null)
  const unsubRef   = useRef(null)
  const filtersKey = JSON.stringify(filters)

  const buildConstraints = useCallback((cursor = null, includeOrderBy = true) => {
    const constraints = []
    const parsedFilters = JSON.parse(filtersKey || '[]')
    parsedFilters.forEach(f => {
      if (f.field && f.op && f.value !== undefined) {
        constraints.push(where(f.field, f.op, f.value))
      }
    })
    if (includeOrderBy && orderByField) {
      constraints.push(orderBy(orderByField, orderDir))
    }
    if (cursor) constraints.push(startAfter(cursor))
    constraints.push(limit(pageSize + 1))
    return constraints
  }, [filtersKey, orderByField, orderDir, pageSize])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    const handleSnapshot = snapshot => {
      if (!active) return
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      if (items.length > pageSize) {
        items.pop()
        setHasMore(true)
      } else {
        setHasMore(false)
      }
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null
      setDocs(items)
      setLoading(false)
    }

    try {
      const q = query(collection(db, collectionName), ...buildConstraints(null, true))

      unsubRef.current?.()
      unsubRef.current = onSnapshot(
        q,
        handleSnapshot,
        err => {
          // If query failed due to ordering/index requirements, try unordered query
          if (orderByField) {
            try {
              const fallbackQ = query(collection(db, collectionName), ...buildConstraints(null, false))
              unsubRef.current = onSnapshot(
                fallbackQ,
                handleSnapshot,
                fallbackErr => {
                  console.error(`[Firestore ${collectionName} error]:`, fallbackErr)
                  if (active) {
                    setError(fallbackErr.message)
                    setDocs([])
                    setLoading(false)
                  }
                }
              )
              return
            } catch (e) {
              // Ignore
            }
          }
          console.error(`[Firestore ${collectionName} error]:`, err)
          if (active) {
            setError(err.message)
            setDocs([])
            setLoading(false)
          }
        }
      )
    } catch (err) {
      console.error(`[Firestore ${collectionName} init error]:`, err)
      if (active) {
        setError(err.message)
        setDocs([])
        setLoading(false)
      }
    }

    return () => {
      active = false
      unsubRef.current?.()
    }
  }, [collectionName, buildConstraints, orderByField, pageSize])

  // ── Real Firestore CRUD helpers ───────────────────────────────────────────
  const add = useCallback(async (data) => {
    try {
      const ref = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('Document added to database!')
      return ref.id
    } catch (e) {
      toast.error(`Database write failed: ${e.message}`)
      throw e
    }
  }, [collectionName])

  const update = useCallback(async (id, data) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      })
      toast.success('Updated in database!')
    } catch (e) {
      toast.error(`Database update failed: ${e.message}`)
      throw e
    }
  }, [collectionName])

  const remove = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id))
      toast.success('Deleted from database!')
    } catch (e) {
      toast.error(`Database delete failed: ${e.message}`)
      throw e
    }
  }, [collectionName])

  const upsert = useCallback(async (id, data) => {
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      toast.success('Saved to database!')
    } catch (e) {
      toast.error(`Database save failed: ${e.message}`)
      throw e
    }
  }, [collectionName])

  return { docs, loading, error, hasMore, add, update, remove, upsert }
}

// ── Specific Collection Hooks ───────────────────────────────────────────────
export const useCourses        = (opts) => useCollection('courses',        opts)
export const useLiveClasses    = (opts) => useCollection('liveClasses',    opts)
export const useRecordedClasses= (opts) => useCollection('recordedClasses',opts)
export const useStudyMaterials = (opts) => useCollection('studyMaterials', opts)
export const useSyllabus       = (opts) => useCollection('syllabus',       opts)
export const useImpQuestions   = (opts) => useCollection('impQuestions',   opts)
export const usePrevYearPapers = (opts) => useCollection('prevYearPapers', opts)
export const useUsers          = (opts) => useCollection('users',          opts)
export const usePurchases      = (opts) => useCollection('purchases',      opts)
export const useNotifications  = (opts) => useCollection('notifications',  opts)
export const useFeedback       = (opts) => useCollection('feedback',       opts)

// ── File Upload Hook (Cloudinary for images & files, Firebase for videos) ─────
export function useUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)

  const upload = useCallback(async (file, path) => {
    setUploading(true)
    setError(null)
    setProgress(0)
    try {
      const url = await uploadFile(file, path, setProgress)
      setDownloadUrl(url)
      setUploading(false)
      return url
    } catch (e) {
      setError(e.message)
      setUploading(false)
      throw e
    }
  }, [])

  const reset = useCallback(() => {
    setProgress(0)
    setUploading(false)
    setError(null)
    setDownloadUrl(null)
  }, [])

  return { upload, uploading, progress, error, downloadUrl, reset }
}
