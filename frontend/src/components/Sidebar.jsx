import { useRef, useState } from 'react'
import { AlertCircle, FileText, Loader2, LogOut, Plus, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from '../lib/auth'

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Sidebar({
  documents,
  documentsLoading,
  documentsError,
  onRefreshDocuments,
  uploads,
  onUploadFiles,
  onRetryUpload,
  onDismissUpload,
  onDeleteDocument,
  onNewQuestion,
  isOpen,
  onClose,
}) {
  const { email, logout } = useAuth()
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e) {
    if (e.target.files?.length) onUploadFiles(e.target.files)
    e.target.value = ''
  }

  function handleDragEnter(e) {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDrop(e) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (e.dataTransfer.files?.length) onUploadFiles(e.dataTransfer.files)
  }

  const isEmpty = !documentsLoading && !documentsError && documents.length === 0 && uploads.length === 0

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[272px] shrink-0 flex-col border-r border-line-soft bg-surface transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-[13px] text-brass"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ¶
        </span>
        <span className="font-display text-[15px] tracking-tight text-ink">Ask Your Docs</span>
        <button
          onClick={onClose}
          aria-label="Close library"
          className="ml-auto text-ink-faint transition-colors hover:text-ink md:hidden"
        >
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>

      <div className="px-3">
        <button
          onClick={() => {
            onNewQuestion()
            onClose?.()
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13.5px] text-ink-muted transition-colors hover:border-brass-dim hover:text-ink"
        >
          <Plus size={15} strokeWidth={1.75} />
          New question
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        className="relative mt-7 flex min-h-0 flex-1 flex-col px-3"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between px-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Library</span>
          <button
            onClick={openFilePicker}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint transition-colors hover:text-brass"
          >
            + Upload
          </button>
        </div>

        <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto pb-4">
          {uploads.map((upload) => (
            <UploadRow key={upload.id} upload={upload} onRetry={onRetryUpload} onDismiss={onDismissUpload} />
          ))}

          {documentsLoading && <SkeletonRows />}

          {documentsError && !documentsLoading && (
            <div className="px-2 py-3">
              <p className="mb-2 flex items-start gap-1.5 text-[13px] leading-relaxed text-[#e0a495]">
                <AlertCircle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                {documentsError}
              </p>
              <button
                onClick={onRefreshDocuments}
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted transition-colors hover:text-brass"
              >
                Try again
              </button>
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center px-3 py-8 text-center">
              <span
                aria-hidden
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-line-soft text-ink-faint"
              >
                <FileText size={16} strokeWidth={1.5} />
              </span>
              <p className="text-[13px] text-ink-muted">No documents yet</p>
              <p className="mt-1 mb-4 text-[12.5px] leading-relaxed text-ink-faint">
                Upload a PDF to start asking questions about it.
              </p>
              <button
                onClick={openFilePicker}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:border-brass-dim hover:text-ink"
              >
                <Upload size={13} strokeWidth={1.75} />
                Upload a PDF
              </button>
            </div>
          )}

          {!documentsLoading &&
            !documentsError &&
            documents.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} onDelete={onDeleteDocument} />
            ))}
        </div>

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-brass-dim bg-bg/90">
            <p className="flex items-center gap-2 text-[13px] text-brass">
              <Upload size={15} strokeWidth={1.75} />
              Drop PDF to upload
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line-soft px-4 py-3.5">
        <span className="truncate text-[13px] text-ink-muted">{email || 'Your account'}</span>
        <button onClick={logout} aria-label="Sign out" className="text-ink-faint transition-colors hover:text-brass">
          <LogOut size={15} strokeWidth={1.75} />
        </button>
      </div>
      </aside>
    </>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2 px-2 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2.5 py-1.5">
          <span className="h-[15px] w-[15px] shrink-0 animate-pulse rounded-sm bg-surface-hover" />
          <span
            className="h-3 animate-pulse rounded-sm bg-surface-hover"
            style={{ width: `${60 - i * 10}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function UploadRow({ upload, onRetry, onDismiss }) {
  const isError = upload.status === 'error'

  return (
    <div className="rounded-lg px-2 py-2">
      <div className="flex items-start gap-2.5">
        {isError ? (
          <AlertCircle size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#e0a495]" />
        ) : (
          <Loader2 size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 animate-spin text-brass" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] text-ink-muted">{upload.filename}</span>
          <span className={`font-mono text-[11px] ${isError ? 'text-[#e0a495]' : 'text-ink-faint'}`}>
            {isError ? upload.error : 'Uploading…'}
          </span>
        </span>
      </div>

      {isError && (
        <div className="mt-1.5 flex gap-3 pl-[25px]">
          {upload.retryable && (
            <button
              onClick={() => onRetry(upload.id)}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted transition-colors hover:text-brass"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onDismiss(upload.id)}
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint transition-colors hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

function DocumentRow({ doc, onDelete }) {
  const [state, setState] = useState('idle') // idle | confirming | deleting | error
  const [error, setError] = useState(null)

  async function handleConfirmDelete() {
    setState('deleting')
    setError(null)
    try {
      await onDelete(doc.id)
      // row will unmount once parent state updates
    } catch (err) {
      setState('error')
      setError(err?.message || 'Could not delete this document.')
    }
  }

  if (state === 'confirming' || state === 'deleting' || state === 'error') {
    return (
      <div className="rounded-lg bg-surface-hover px-2 py-2">
        <div className="flex items-start gap-2.5">
          <FileText size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-faint" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] text-ink-muted">{doc.filename}</span>
            {state === 'error' ? (
              <span className="font-mono text-[11px] text-[#e0a495]">{error}</span>
            ) : (
              <span className="font-mono text-[11px] text-ink-faint">
                {state === 'deleting' ? 'Deleting…' : 'Delete this document?'}
              </span>
            )}
          </div>
        </div>
        <div className="mt-1.5 flex gap-3 pl-[25px]">
          {state === 'confirming' && (
            <>
              <button
                onClick={handleConfirmDelete}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#e0a495] transition-colors hover:text-[#eeb3a3]"
              >
                Delete
              </button>
              <button
                onClick={() => setState('idle')}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </>
          )}
          {state === 'deleting' && (
            <Loader2 size={13} strokeWidth={1.75} className="animate-spin text-ink-faint" />
          )}
          {state === 'error' && (
            <>
              <button
                onClick={handleConfirmDelete}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted transition-colors hover:text-brass"
              >
                Try again
              </button>
              <button
                onClick={() => setState('idle')}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover">
      <FileText size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-faint group-hover:text-brass" />
      <span className="min-w-0 flex-1">
        <span title={doc.filename} className="block truncate text-[13.5px] text-ink-muted group-hover:text-ink">
          {doc.filename}
        </span>
        <span className="font-mono text-[11px] text-ink-faint">{timeAgo(doc.created_at)}</span>
      </span>
      <button
        onClick={() => setState('confirming')}
        aria-label={`Delete ${doc.filename}`}
        className="mt-0.5 shrink-0 text-ink-faint opacity-0 transition-opacity hover:text-[#e0a495] group-hover:opacity-100"
      >
        <Trash2 size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
