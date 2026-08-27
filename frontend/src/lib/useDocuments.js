import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'

let uploadCounter = 0

/**
 * Owns the document library's data and lifecycle: fetching the list,
 * tracking in-flight uploads (with retry), and deleting documents.
 * UI-only state (e.g. which row is showing a delete confirmation)
 * stays in the component that renders it.
 */
export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploads, setUploads] = useState([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const docs = await api.listDocuments()
      docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const runUpload = useCallback(async (uploadId, file) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === uploadId ? { ...u, status: 'uploading', error: null } : u))
    )
    try {
      const doc = await api.uploadDocument(file)
      setUploads((prev) => prev.filter((u) => u.id !== uploadId))
      setDocuments((prev) => [doc, ...prev])
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Upload failed. Check your connection and try again.'
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: message } : u))
      )
    }
  }, [])

  const uploadFiles = useCallback(
    (fileList) => {
      Array.from(fileList).forEach((file) => {
        const id = `upload-${++uploadCounter}`
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          setUploads((prev) => [
            ...prev,
            { id, filename: file.name, status: 'error', error: 'Only PDF files are supported.', retryable: false },
          ])
          return
        }
        setUploads((prev) => [
          ...prev,
          { id, filename: file.name, status: 'uploading', error: null, retryable: true, file },
        ])
        runUpload(id, file)
      })
    },
    [runUpload]
  )

  const retryUpload = useCallback(
    (uploadId) => {
      setUploads((prev) => {
        const item = prev.find((u) => u.id === uploadId)
        if (item?.file) runUpload(uploadId, item.file)
        return prev
      })
    },
    [runUpload]
  )

  const dismissUpload = useCallback((uploadId) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId))
  }, [])

  const deleteDocument = useCallback(async (id) => {
    await api.deleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return {
    documents,
    loading,
    error,
    refresh,
    uploads,
    uploadFiles,
    retryUpload,
    dismissUpload,
    deleteDocument,
  }
}
