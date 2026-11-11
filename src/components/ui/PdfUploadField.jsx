// src/components/ui/PdfUploadField.jsx — Shared deferred PDF/file picker + URL status pill for Firestore forms
import { Upload, CheckCircle2, ExternalLink } from 'lucide-react'
import { isCloudinaryUrl } from '../../lib/cloudinary'
import { Input, Select } from './index'

export function CourseSelectField({
  label = 'Course (courseId) *',
  courseId,
  onChange,
  courses = [],
  placeholder = 'e.g. zT4gEAyGFBLQQbI8zWuO',
}) {
  if (courses.length === 0) {
    return (
      <Input
        label={label}
        placeholder={placeholder}
        value={courseId}
        onChange={e => onChange(e.target.value)}
      />
    )
  }

  return (
    <Select
      label={label}
      value={courseId}
      onChange={e => onChange(e.target.value)}
      options={[
        { value: '', label: 'Select Course...' },
        ...courses.map(c => ({ value: c.id, label: `${c.title} (${c.id})` })),
        ...(courseId && !courses.some(c => c.id === courseId)
          ? [{ value: courseId, label: courseId }]
          : []),
      ]}
    />
  )
}

export default function PdfUploadField({
  inputId,
  fileInputRef,
  accept = '.pdf',
  selectedFile,
  onFileSelect,
  uploading = false,
  progress = 0,
  pdfUrl = '',
  onPdfUrlChange,
  selectLabel = 'Click to select PDF for Cloudinary',
  helperText = 'Automatically populated on save when uploading a PDF, or paste a direct PDF URL',
}) {
  return (
    <div className="space-y-3.5">
      <div className="border-2 border-dashed border-slate-200 hover:border-accent-400 rounded-xl p-5 text-center transition bg-slate-50/50">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={onFileSelect}
          className="hidden"
          id={inputId}
        />
        <label htmlFor={inputId} className="cursor-pointer block space-y-2">
          <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mx-auto">
            <Upload size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-accent-700 hover:underline">
              {selectLabel}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              File uploads to Cloudinary; resulting URL saves as <code className="font-mono">pdfUrl</code> in Firebase
            </p>
          </div>
        </label>

        {selectedFile && (
          <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
            <span className="font-semibold truncate">✓ Selected: {selectedFile.name}</span>
            <span className="text-[11px] text-emerald-600 font-mono">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        )}

        {uploading && (
          <div className="mt-3">
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-accent-600 h-1.5 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Uploading to Cloudinary: {progress}%</p>
          </div>
        )}
      </div>

      <Input
        label="PDF URL (pdfUrl)"
        placeholder="https://res.cloudinary.com/..."
        value={pdfUrl}
        onChange={e => onPdfUrlChange(e.target.value)}
        helperText={helperText}
      />

      {!selectedFile && pdfUrl && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 truncate">
            <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
            {isCloudinaryUrl(pdfUrl) ? 'Saved Cloudinary URL in Firebase' : 'Saved PDF URL'}
          </span>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent-700 font-semibold hover:underline flex-shrink-0"
          >
            Open <ExternalLink size={11} />
          </a>
        </div>
      )}
    </div>
  )
}
