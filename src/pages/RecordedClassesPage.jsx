// src/pages/RecordedClassesPage.jsx — Professional Recorded Lectures & Video Library
import { useState, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, PlayCircle, Eye, Edit2, Trash2, Search,
  Video, Film, CheckCircle2, Clock, Upload, ExternalLink,
  BookOpen, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRecordedClasses, useCourses, useUpload } from '../hooks/useFirestore'
import { storagePaths, deleteFile } from '../lib/storage'
import {
  PageHeader, Card, Button, Badge, SlideOver, ConfirmDialog,
  Input, Textarea, Select, Toggle, TableSkeleton, EmptyState,
  Tabs
} from '../components/ui/index'
import CloudinaryFileField from '../components/ui/CloudinaryFileField'

const DURATION_PRESETS = ['15 min', '30 min', '45 min', '60 min', '90 min', '120 min']

const videoSchema = z.object({
  title:        z.string().min(3, 'Title is required (minimum 3 characters)'),
  courseId:     z.string().optional(),
  subject:      z.string().optional(),
  duration:     z.string().optional(),
  videoUrl:     z.string().optional(),
  thumbnailUrl: z.string().optional(),
  description:  z.string().optional(),
  published:    z.boolean().optional(),
})

export default function RecordedClassesPage() {
  const { docs: videos, loading, add, update, remove } = useRecordedClasses({ orderByField: 'order', orderDir: 'asc' })
  const { docs: courses } = useCourses()
  const { upload, progress, uploading } = useUpload()

  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('All')

  // Drawer & form state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [videoSourceType, setVideoSourceType] = useState('url') // 'url' | 'upload'
  const videoFileRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      courseId: '',
      subject: '',
      duration: '45 min',
      videoUrl: '',
      thumbnailUrl: '',
      description: '',
      published: true,
    },
  })

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      if (activeTab === 'Published' && !v.published) return false
      if (activeTab === 'Drafts' && v.published) return false
      if (courseFilter !== 'All' && v.courseId !== courseFilter) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const titleMatch = v.title?.toLowerCase().includes(q)
        const subMatch = v.subject?.toLowerCase().includes(q)
        if (!titleMatch && !subMatch) return false
      }
      return true
    })
  }, [videos, activeTab, courseFilter, search])

  // Aggregate stats
  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0)
  const publishedCount = videos.filter(v => v.published).length

  function openCreateDrawer() {
    setEditingVideo(null)
    reset({
      title: '',
      courseId: courses[0]?.id || '',
      subject: '',
      duration: '45 min',
      videoUrl: '',
      thumbnailUrl: '',
      description: '',
      published: true,
    })
    setVideoSourceType('url')
    setDrawerOpen(true)
  }

  function openEditDrawer(video) {
    setEditingVideo(video)
    reset({
      title: video.title || '',
      courseId: video.courseId || '',
      subject: video.subject || '',
      duration: video.duration || '45 min',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      description: video.description || '',
      published: Boolean(video.published),
    })
    setVideoSourceType(video.videoUrl?.includes('firebasestorage') ? 'upload' : 'url')
    setDrawerOpen(true)
  }

  async function handleVideoFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const path = storagePaths.video(watch('courseId') || 'general', `video_${Date.now()}`)
      const downloadUrl = await upload(file, path)
      setValue('videoUrl', downloadUrl)
      toast.success('Video uploaded to Firebase Storage!')
    } catch (err) {
      toast.error('Video upload failed: ' + err.message)
    }
  }

  async function handleFormSubmit(data, addAnother = false) {
    setSubmitting(true)
    try {
      if (editingVideo) {
        await update(editingVideo.id, data)
        setDrawerOpen(false)
      } else {
        await add({
          ...data,
          order: videos.length,
          views: 0,
        })
        if (addAnother) {
          toast.success('Lecture added! Ready for next lecture.')
          reset({
            title: '',
            courseId: data.courseId,
            subject: data.subject,
            duration: data.duration,
            videoUrl: '',
            thumbnailUrl: '',
            description: '',
            published: true,
          })
          if (videoFileRef.current) videoFileRef.current.value = ''
        } else {
          setDrawerOpen(false)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.videoUrl?.includes('firebasestorage')) {
        await deleteFile(deleteTarget.videoUrl).catch(() => {})
      }
      await remove(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const tabsConfig = [
    { id: 'All',       label: 'All Lectures', count: videos.length },
    { id: 'Published', label: 'Published',    count: publishedCount },
    { id: 'Drafts',    label: 'Drafts',       count: videos.length - publishedCount },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Recorded Lectures Library"
        description="Manage video archive, on-demand masterclasses, chapter modules, and streaming access"
        count={videos.length}
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={openCreateDrawer}
          >
            Add Recorded Lecture
          </Button>
        }
      />

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Lectures</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{videos.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Video size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Live Published</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{publishedCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Views</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalViews.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <Eye size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Courses Covered</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{courses.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60">
            <BookOpen size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="flex items-center gap-2">
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            >
              <option value="All">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative pt-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recorded lectures by title, subject, or chapter..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>

      {/* Videos Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredVideos.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Film}
              title="No recorded lectures found"
              description="Add lecture videos or class recordings to make them available on-demand."
              action={
                <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
                  Add Recorded Lecture
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lecture Info</th>
                  <th className="py-3 px-4">Course / Module</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredVideos.map(video => {
                  const courseObj = courses.find(c => c.id === video.courseId)
                  return (
                    <tr key={video.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-9 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 relative group">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40 bg-indigo-950">
                                <PlayCircle size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{video.title}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{video.subject || 'Core Lecture'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <Badge variant="indigo" size="xs">
                          {courseObj?.title || video.courseId || 'General Academy'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                          <Clock size={12} className="text-slate-400" />
                          {video.duration || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {(video.views || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={video.published ? 'green' : 'amber'} dot size="xs">
                          {video.published ? 'Published' : 'Draft'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {video.videoUrl && (
                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                              title="Preview Video Stream"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => openEditDrawer(video)}
                            className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Lecture"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(video)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Lecture"
                          >
                            <Trash2 size={14} />
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

      {/* SlideOver Drawer for Adding/Editing Lectures */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingVideo ? 'Edit Recorded Lecture' : 'Add Recorded Lecture'}
        subtitle="Upload video lecture file or configure YouTube / Cloud stream link with duration."
        width="sm:max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(data => handleFormSubmit(data, false))}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit(data => handleFormSubmit(data, false))()
            }
          }}
          className="space-y-6"
        >
          {/* Section 1: Lesson Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Lesson & Module Details
              </h3>
            </div>

            <Input
              label="Lecture Title *"
              placeholder="e.g. Chapter 4: Integration by Parts & Definite Integrals"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assign to Course *"
                options={[
                  { value: '', label: 'Select a Course' },
                  ...courses.map(c => ({ value: c.id, label: c.title }))
                ]}
                error={errors.courseId?.message}
                {...register('courseId')}
              />

              <Input
                label="Academic Subject / Topic *"
                placeholder="e.g. Advanced Calculus"
                error={errors.subject?.message}
                {...register('subject')}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Lesson Duration
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DURATION_PRESETS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue('duration', d)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                      watch('duration') === d
                        ? 'bg-accent-50 text-accent-700 border-accent-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or custom duration (e.g. 52:10)"
                error={errors.duration?.message}
                {...register('duration')}
              />
            </div>
          </div>

          {/* Section 2: Video Stream / File */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Video Stream Source
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setVideoSourceType('url')}
                  className={`px-2 py-0.5 rounded-md transition ${videoSourceType === 'url' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  YouTube / External Link
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSourceType('upload')}
                  className={`px-2 py-0.5 rounded-md transition ${videoSourceType === 'upload' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  Direct MP4 Upload
                </button>
              </div>
            </div>

            {videoSourceType === 'url' ? (
              <Input
                label="Stream URL (YouTube, Vimeo, Cloudflare, Drive) *"
                placeholder="https://www.youtube.com/watch?v=..."
                helperText="Paste unlisted YouTube link, Vimeo URL, or direct stream link"
                error={errors.videoUrl?.message}
                {...register('videoUrl')}
              />
            ) : (
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition bg-slate-50/50">
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                  id="lecture-video-upload"
                />
                <label htmlFor="lecture-video-upload" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-700 hover:underline">
                      Click to upload MP4/WebM to Firebase Storage
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">High definition video file</p>
                  </div>
                </label>
                {uploading && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-1.5 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Uploading video: {progress}%</p>
                  </div>
                )}
                {watch('videoUrl') && (
                  <p className="text-xs text-emerald-600 font-bold mt-2 truncate">
                    ✓ Video saved: {watch('videoUrl')}
                  </p>
                )}
              </div>
            )}

            <CloudinaryFileField
              label="Thumbnail Image (Optional)"
              value={watch('thumbnailUrl') || ''}
              onChange={(url) => setValue('thumbnailUrl', url, { shouldDirty: true })}
              accept="image/png,image/jpeg,image/webp"
              kind="image"
              storagePath={() => storagePaths.lectureThumb(`thumb_${Date.now()}`)}
              placeholder="https://res.cloudinary.com/... or paste image URL"
              helperText="Upload thumbnail to Cloudinary (URL saves in Firebase) or paste custom URL"
              error={errors.thumbnailUrl?.message}
            />
          </div>

          {/* Section 3: Publishing */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Publishing Status
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Toggle
                checked={watch('published')}
                onChange={v => setValue('published', v)}
                label="Make lecture accessible to enrolled students immediately"
                description="If unchecked, will be saved as an internal draft."
              />
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-white sticky bottom-0 -mb-6 -mx-6 px-6 py-4 shadow-lg">
            <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
                Ctrl + Enter
              </kbd>
              to save immediately
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>

              {!editingVideo && (
                <Button
                  type="button"
                  variant="secondary"
                  loading={submitting}
                  onClick={handleSubmit(data => handleFormSubmit(data, true))}
                  className="text-accent-700 hover:text-accent-800 border-accent-200 hover:bg-accent-50"
                >
                  Save & Add Another
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                loading={submitting || uploading}
                onClick={handleSubmit(data => handleFormSubmit(data, false))}
              >
                {editingVideo ? 'Save Changes' : 'Upload Lecture'}
              </Button>
            </div>
          </div>
        </form>
      </SlideOver>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Lecture"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}
