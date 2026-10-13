// src/hooks/useFirestore.js — Generic real-time Firestore hook factory

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, query, orderBy, limit, startAfter,
  onSnapshot, doc, addDoc, updateDoc, deleteDoc,
  setDoc, serverTimestamp, getCountFromServer,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import toast from 'react-hot-toast'

/**
 * Generic real-time collection hook with pagination + CRUD.
 *
 * @param {string}   collectionName
 * @param {object}   options  { orderByField, orderDir, pageSize, where: [[field, op, value]] }
 */
export function useCollection(collectionName, options = {}) {
  const {
    orderByField = 'createdAt',
    orderDir     = 'desc',
    pageSize     = 25,
    filters      = [],   // [{ field, op, value }]
  } = options

  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const lastDocRef   = useRef(null)
  const unsubRef     = useRef(null)

  // Serialize filters to avoid re-subscribing when an inline array/object reference is passed
  const filtersKey = JSON.stringify(filters)

  // Build base query constraints
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
    constraints.push(limit(pageSize + 1))   // fetch 1 extra to detect hasMore
    return constraints
  }, [filtersKey, orderByField, orderDir, pageSize])

  // Initial subscription
  useEffect(() => {
    setLoading(true)
    setError(null)

    const handleSnapshot = snapshot => {
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

    const q = query(collection(db, collectionName), ...buildConstraints(null, true))

    unsubRef.current?.()
    unsubRef.current = onSnapshot(
      q,
      handleSnapshot,
      err => {
        if (orderByField) {
          // Fallback to unordered query if composite/single-field index is missing
          const fallbackQ = query(collection(db, collectionName), ...buildConstraints(null, false))
          unsubRef.current = onSnapshot(
            fallbackQ,
            handleSnapshot,
            fallbackErr => {
              setError(fallbackErr.message)
              setLoading(false)
            }
          )
        } else {
          setError(err.message)
          setLoading(false)
        }
      }
    )

    return () => unsubRef.current?.()
  }, [collectionName, buildConstraints, orderByField, pageSize])

  // ── CRUD helpers ──────────────────────────────────────────────────────────

  const add = useCallback(async (data) => {
    try {
      const ref = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return ref.id
    } catch (e) {
      toast.error(`Failed to create: ${e.message}`)
      throw e
    }
  }, [collectionName])

  const update = useCallback(async (id, data) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      toast.error(`Failed to update: ${e.message}`)
      throw e
    }
  }, [collectionName])

  const remove = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (e) {
      toast.error(`Failed to delete: ${e.message}`)
      throw e
    }
  }, [collectionName])

  const upsert = useCallback(async (id, data) => {
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (e) {
      toast.error(`Failed to save: ${e.message}`)
      throw e
    }
  }, [collectionName])

  return { docs, loading, error, hasMore, add, update, remove, upsert }
}

// ─── Specific collection hooks (thin wrappers) ────────────────────────────────

export const useCourses       = (opts) => useCollection('courses',          opts)
export const useLiveClasses   = (opts) => useCollection('liveClasses',      opts)
export const useRecordedClasses=(opts) => useCollection('recordedClasses',  opts)
export const useStudyMaterials= (opts) => useCollection('studyMaterials',   opts)
export const useSyllabus      = (opts) => useCollection('syllabus',         opts)
export const useImpQuestions  = (opts) => useCollection('impQuestions',     opts)
export const usePrevYearPapers= (opts) => useCollection('prevYearPapers',   opts)
export const useUsers         = (opts) => useCollection('users',            opts)
export const usePurchases     = (opts) => useCollection('purchases',        opts)
export const useNotifications = (opts) => useCollection('notifications',    opts)
export const useFeedback      = (opts) => useCollection('feedback',         opts)

// ─── useUpload — unified file upload hook ────────────────────────────────────

import { uploadFile } from '../lib/storage'

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
