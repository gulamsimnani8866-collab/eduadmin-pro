// src/pages/RecordedClassesPage.jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, PlayCircle, GripVertical, Eye, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRecordedClasses, useUpload } from '../hooks/useFirestore'
import { storagePaths, deleteFile } from '../lib/storage'
import {
  PageHeader, Card, Button, Badge, Modal, ConfirmDialog,
  Input, Select, Toggle, FileUpload, TableSkeleton, EmptyState
} from '../components/ui/index'

function VideoRow({ video, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition group">
      <td className="py-3 px-3 text-gray-300 cursor-grab w-8">
        <GripVertical size={16} />
      </td>
      <td className="py-3 px-4">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} className="w-16 h-10 rounded object-cover" />
        ) : (
          <div className="w-16 h-10 rounded bg-blue-100 flex items-center justify-center">
            <PlayCircle size={14} className="text-blue-500" />
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-gray-900">{video.title}</p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 hidden sm:table-cell">{video.duration ?? '—'}</td>
      <td className="py-3 px-4 text-sm text-gray-500 hidden md:table-cell">
        <span className="flex items-center gap-1"><Eye size={12} /> {video.views ?? 0}</span>
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <Badge variant={video.published ? 'green' : 'gray'}>{video.published ? 'Published' : 'Draft'}</Badge>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          <button onClick={() => onEdit(video)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(video)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function VideoUploadForm({ video, onClose, onSave }) {
  const { upload, progress, uploading } = useUpload()
  const [videoFile, setVideoFile] = useState(null)
  const [published, setPublished] = useState(video?.published ?? false)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title:    video?.title ?? '',
      duration: video?.duration ?? '',
      courseId: video?.courseId ?? '',
    },
  })

  async function onSubmit(data) {
    try {
      let videoUrl = video?.videoUrl
      if (videoFile) {
        const id = video?.id ?? Date.now().toString()
        videoUrl = await upload(videoFile, storagePaths.video(data.courseId || 'general', id))
      }
      await onSave({ ...data, videoUrl, published })
      toast.success(video ? 'Video updated!' : 'Video uploaded!')
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title *" {...register('title', { required: true })} placeholder="Video title" />
      <FileUpload
        label="Video File (MP4, MOV)"
        accept="video/mp4,video/quicktime"
        onFile={setVideoFile}
        progress={uploading ? progress : undefined}
      />
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Duration (e.g. 12:30)" {...register('duration')} placeholder="mm:ss" />
        <Input label="Course ID" {...register('courseId')} placeholder="optional" />
      </div>
      <Toggle checked={published} onChange={setPublished} label="Published" />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting || uploading}>
          {video ? 'Update' : 'Upload Video'}
        </Button>
      </div>
    </form>
  )
}

export default function RecordedClassesPage() {
  const { docs: videos, loading, add, update, remove } = useRecordedClasses({ orderByField: 'order', orderDir: 'asc' })
  const [formOpen, setFormOpen]     = useState(false)
  const [editVideo, setEditVideo]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  async function handleSave(data) {
    if (editVideo) await update(editVideo.id, data)
    else await add({ ...data, order: videos.length, views: 0 })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.videoUrl) await deleteFile(deleteTarget.videoUrl).catch(() => {})
      await remove(deleteTarget.id)
      toast.success('Video deleted')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Recorded Classes"
        count={videos.length}
        action={
          <Button onClick={() => { setEditVideo(null); setFormOpen(true) }}>
            <Plus size={15} /> Upload Video
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={6} /></div>
        ) : videos.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="No videos yet"
            description="Upload your first recorded class"
            action={
              <Button onClick={() => { setEditVideo(null); setFormOpen(true) }}>
                <Plus size={14} /> Upload Video
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { label: '',          cls: 'w-8' },
                    { label: 'Thumb',     cls: '' },
                    { label: 'Title',     cls: '' },
                    { label: 'Duration',  cls: 'hidden sm:table-cell' },
                    { label: 'Views',     cls: 'hidden md:table-cell' },
                    { label: 'Published', cls: 'hidden sm:table-cell' },
                    { label: 'Actions',   cls: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${h.cls}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {videos.map(v => (
                  <VideoRow
                    key={v.id}
                    video={v}
                    onEdit={v => { setEditVideo(v); setFormOpen(true) }}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editVideo ? 'Edit Video' : 'Upload Video'} size="lg">
        <VideoUploadForm video={editVideo} onClose={() => setFormOpen(false)} onSave={handleSave} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Video"
        message={`Delete "${deleteTarget?.title}"? The video file will also be removed.`}
      />
    </>
  )
}
