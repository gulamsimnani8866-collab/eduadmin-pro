// src/pages/StudyMaterialsPage.jsx
import { useState } from 'react'
import { Plus, FileText, Music, Image, File, Download, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStudyMaterials, useUpload } from '../hooks/useFirestore'
import { storagePaths, deleteFile } from '../lib/storage'
import {
  PageHeader, Card, Button, Badge, Modal, ConfirmDialog,
  Input, Select, Toggle, FileUpload, TableSkeleton, EmptyState
} from '../components/ui/index'

const FILTER_CHIPS = ['All', 'PDF', 'Audio', 'Image', 'Premium']

const FILE_ICONS = {
  pdf:   { icon: FileText, color: 'text-red-500',    bg: 'bg-red-50'    },
  audio: { icon: Music,    color: 'text-purple-500', bg: 'bg-purple-50' },
  image: { icon: Image,    color: 'text-blue-500',   bg: 'bg-blue-50'   },
  other: { icon: File,     color: 'text-gray-500',   bg: 'bg-gray-50'   },
}

function detectType(mime) {
  if (!mime) return 'other'
  if (mime.includes('pdf'))   return 'pdf'
  if (mime.includes('audio')) return 'audio'
  if (mime.includes('image')) return 'image'
  return 'other'
}

export default function StudyMaterialsPage() {
  const { docs: materials, loading, add, remove } = useStudyMaterials({ orderByField: 'createdAt' })
  const { upload, progress, uploading } = useUpload()
  const [filter, setFilter]   = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [matFile, setMatFile] = useState(null)
  const [title, setTitle]     = useState('')
  const [courseId, setCourseId] = useState('')
  const [premium, setPremium] = useState(false)
  const [saving, setSaving]   = useState(false)

  const filtered = materials.filter(m => {
    if (filter === 'All')     return true
    if (filter === 'Premium') return m.premium
    return detectType(m.mimeType) === filter.toLowerCase()
  })

  async function handleUpload() {
    if (!matFile || !title) return toast.error('Title and file required')
    setSaving(true)
    try {
      const id = Date.now().toString()
      const path = storagePaths.material(courseId || 'general', id)
      const url = await upload(matFile, path)
      await add({
        title,
        courseId: courseId || null,
        fileUrl: url,
        mimeType: matFile.type,
        size: matFile.size,
        premium,
        downloads: 0,
      })
      toast.success('Material uploaded!')
      setFormOpen(false)
      setMatFile(null)
      setTitle('')
      setCourseId('')
      setPremium(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.fileUrl) await deleteFile(deleteTarget.fileUrl).catch(() => {})
      await remove(deleteTarget.id)
      toast.success('Material deleted')
    } finally {
      setDeleteTarget(null)
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1024/1024).toFixed(1)} MB`
  }

  return (
    <>
      <PageHeader
        title="Study Materials"
        count={materials.length}
        action={<Button onClick={() => setFormOpen(true)}><Plus size={15} /> Upload Material</Button>}
      />

      {/* Filter Chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_CHIPS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={7} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No materials found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { label: 'Type',      cls: '' },
                    { label: 'Name',      cls: '' },
                    { label: 'Course',    cls: 'hidden md:table-cell' },
                    { label: 'Size',      cls: 'hidden sm:table-cell' },
                    { label: 'Premium',   cls: 'hidden sm:table-cell' },
                    { label: 'Downloads', cls: 'hidden lg:table-cell' },
                    { label: 'Actions',   cls: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${h.cls}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const ft = detectType(m.mimeType)
                  const { icon: Icon, color, bg } = FILE_ICONS[ft]
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                          <Icon size={14} className={color} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{m.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 hidden md:table-cell">{m.courseId ?? '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 hidden sm:table-cell">{formatSize(m.size)}</td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {m.premium && <Badge variant="purple">Premium</Badge>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">
                        <span className="flex items-center gap-1"><Download size={12} /> {m.downloads ?? 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {m.fileUrl && (
                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                               className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                              <Download size={13} />
                            </a>
                          )}
                          <button onClick={() => setDeleteTarget(m)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Upload Study Material" size="lg">
        <div className="space-y-4">
          <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Material name" />
          <FileUpload
            label="File (PDF, MP3/WAV, JPEG/PNG)"
            accept=".pdf,.mp3,.wav,.aac,.jpg,.jpeg,.png,.webp"
            onFile={setMatFile}
            progress={uploading ? progress : undefined}
          />
          <Input label="Course ID (optional)" value={courseId} onChange={e => setCourseId(e.target.value)} />
          <Toggle checked={premium} onChange={setPremium} label="Premium content" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} loading={saving || uploading}>Upload</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </>
  )
}
