// src/components/ui/CloudinaryFileField.jsx — Reusable Cloudinary image/PDF uploader + URL binding for Firebase
import { useId, useRef } from 'react'
import { Upload, ExternalLink, Trash2, FileText, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUpload } from '../../hooks/useFirestore'
import { isCloudinaryUrl } from '../../lib/cloudinary'
import { Input } from './index'

/**
 * Reusable field that uploads an image or PDF to Cloudinary and binds the
 * returned Cloudinary URL into form/component state for saving in Firebase.
 */
export default function CloudinaryFileField({
  label,
  value = '',
  onChange,
  accept = 'image/png,image/jpeg,image/webp',
  kind = 'image',
  storagePath = 'uploads/asset',
  placeholder = 'https://...',
  helperText,
  error,
}) {
  const inputId = useId()
  const fileRef = useRef(null)
  const { upload, progress, uploading } = useUpload()

  const isPdf = kind === 'pdf'
  const uploadedToCloudinary = isCloudinaryUrl(value)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const targetPath = typeof storagePath === 'function' ? storagePath(file) : storagePath
      const url = await upload(file, targetPath)
      onChange?.(url)
      toast.success(
        isPdf
          ? 'PDF uploaded to Cloudinary! Save to store URL in Firebase.'
          : 'Image uploaded to Cloudinary! Save to store URL in Firebase.'
      )
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          {uploadedToCloudinary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={11} />
              Cloudinary URL
            </span>
          )}
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 text-[11px] font-semibold cursor-pointer transition"
          >
            <Upload size={12} />
            {uploading ? `Uploading ${progress}%` : isPdf ? 'Upload PDF' : 'Upload Image'}
          </label>
        </div>
      </div>

      {uploading && (
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className="bg-accent-600 h-1.5 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {value && !isPdf && (
        <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 text-slate-900 text-xs font-semibold hover:bg-white transition"
            >
              <ExternalLink size={12} /> Open
            </a>
            <button
              type="button"
              onClick={() => onChange?.('')}
              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
              title="Remove Image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {value && isPdf && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-rose-50/70 border border-rose-200 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} className="text-rose-600 flex-shrink-0" />
            <span className="truncate font-mono text-[11px] text-slate-700">{value}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-accent-700 text-[11px] font-semibold"
            >
              <ExternalLink size={11} /> View
            </a>
            <button
              type="button"
              onClick={() => onChange?.('')}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition"
              title="Remove PDF"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        helperText={helperText}
        error={error}
        icon={isPdf ? FileText : ImageIcon}
      />
    </div>
  )
}
