import { useState } from 'react'

export default function Sources({ sources, documents }) {
  const [openIndex, setOpenIndex] = useState(null)

  function filenameFor(documentId) {
    return documents.find((d) => d.id === documentId)?.filename ?? 'Source document'
  }

  return (
    <div className="mt-6 border-t border-line-soft pt-4">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <button
            key={i}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            aria-label={`Source ${i + 1}: ${filenameFor(source.document_id)}`}
            className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12.5px] text-ink-muted transition-colors hover:border-brass-dim hover:text-ink"
          >
            <span className="font-mono text-[11px] text-brass">{i + 1}</span>
            <span className="max-w-[160px] truncate">{filenameFor(source.document_id)}</span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className="mt-3 rounded-lg border border-line-soft bg-surface px-4 py-3">
          <p className="mb-1 font-mono text-[11px] text-ink-faint">
            {String(openIndex + 1).padStart(2, '0')} · {filenameFor(sources[openIndex].document_id)}
          </p>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">{sources[openIndex].content}</p>
        </div>
      )}
    </div>
  )
}
