// src/pages/LiveClassesPage.jsx — Professional Live Classroom & Broadcasting Command Center
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Radio, Video, Clock, Users, Play, ExternalLink,
  Calendar, CheckCircle2, XCircle, AlertCircle, Sparkles,
  Edit2, Trash2, Search, ArrowUpRight, MonitorPlay
} from 'lucide-react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import { useLiveClasses } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, ConfirmDialog,
  Input, Textarea, Select, Toggle, TableSkeleton, EmptyState,
  Tabs
} from '../components/ui/index'

const CATEGORY_CHIPS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'General Aptitude']
const DURATION_PRESETS = [30, 45, 60, 90, 120]

const PLATFORMS = [
  { value: 'YouTube Live', label: 'YouTube Live (Public / Unlisted)' },
  { value: 'Zoom Pro', label: 'Zoom Pro Classroom' },
  { value: 'Google Meet', label: 'Google Meet Enterprise' },
  { value: 'RTMP Stream', label: 'Custom RTMP / OBS Studio' },
]

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled (Upcoming)' },
  { value: 'live', label: 'Broadcasting Live Now' },
  { value: 'completed', label: 'Completed (Archived)' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Flexible schema that prevents false validation rejections
const liveSchema = z.object({
  title:       z.string().min(3, 'Title is required (minimum 3 characters)'),
  instructor:  z.string().min(2, 'Instructor name is required'),
  category:    z.string().min(2, 'Subject/Category is required'),
  scheduledAt: z.string().min(1, 'Date & Time is required'),
  duration:    z.coerce.number().min(5, 'Duration in minutes (minimum 5)'),
  meetingUrl:  z.string().optional().or(z.literal('')),
  platform:    z.string().min(1, 'Select a platform'),
  attendees:   z.coerce.number().optional(),
  description: z.string().optional(),
  status:      z.enum(['live', 'scheduled', 'completed', 'cancelled']).default('scheduled'),
})

// Safe date parser to handle Firestore Timestamps, Dates, and Strings
function parseDateValue(val) {
  if (!val) return null
  try {
    if (typeof val?.toDate === 'function') {
      const d = val.toDate()
      return isNaN(d.getTime()) ? null : d
    }
    if (typeof val === 'object' && typeof val.seconds === 'number') {
      const d = new Date(val.seconds * 1000)
      return isNaN(d.getTime()) ? null : d
    }
    const d = val instanceof Date ? val : new Date(val)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function safeFormatDate(val, formatStr = 'EEEE, MMM d, yyyy • h:mm a') {
  const d = parseDateValue(val)
  if (!d) return 'Schedule TBD'
  try {
    return format(d, formatStr)
  } catch {
    return 'Schedule TBD'
  }
}

function toDatetimeLocalString(val) {
  const d = parseDateValue(val) || new Date(Date.now() + 1000 * 60 * 60 * 2)
  try {
    const pad = n => String(n).padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const mins = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${mins}`
  } catch {
    return new Date().toISOString().slice(0, 16)
  }
}

// Ensures URLs open externally without 404 relative pathing
function getFullUrl(url) {
  if (!url) return '#'
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

export default function LiveClassesPage() {
  const { docs: liveClasses, loading, add, update, remove } = useLiveClasses()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(liveSchema),
    defaultValues: {
      duration: 60,
      platform: 'YouTube Live',
      status: 'scheduled',
      instructor: '',
      category: '',
      scheduledAt: toDatetimeLocalString(),
      meetingUrl: '',
    },
  })

  // Open modal if query param ?action=new is present
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Filtered classes with search
  const filtered = useMemo(() => {
    return liveClasses.filter(c => {
      const status = c.status || 'scheduled'

      if (activeTab === 'Live Now' && status !== 'live') return false
      if (activeTab === 'Upcoming' && status !== 'scheduled') return false
      if (activeTab === 'Completed' && status !== 'completed') return false
      if (activeTab === 'Cancelled' && status !== 'cancelled') return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const titleMatch = c.title?.toLowerCase().includes(q)
        const instructorMatch = c.instructor?.toLowerCase().includes(q)
        const categoryMatch = c.category?.toLowerCase().includes(q)
        const platformMatch = c.platform?.toLowerCase().includes(q)
        if (!titleMatch && !instructorMatch && !categoryMatch && !platformMatch) return false
      }

      return true
    })
  }, [liveClasses, activeTab, search])

  const liveNow = liveClasses.filter(c => c.status === 'live')
  const upcomingCount = liveClasses.filter(c => c.status === 'scheduled' || !c.status).length
  const completedCount = liveClasses.filter(c => c.status === 'completed').length

  function openCreateModal() {
    setEditingClass(null)
    reset({
      title: '',
      instructor: '',
      category: '',
      scheduledAt: toDatetimeLocalString(new Date(Date.now() + 1000 * 60 * 60 * 2)),
      duration: 60,
      meetingUrl: '',
      platform: 'YouTube Live',
      status: 'scheduled',
      description: '',
      attendees: 0,
    })
    setModalOpen(true)
  }

  function openEditModal(cls) {
    setEditingClass(cls)
    reset({
      title: cls.title || '',
      instructor: cls.instructor || '',
      category: cls.category || cls.courseName || 'General Studies',
      scheduledAt: toDatetimeLocalString(cls.scheduledAt),
      duration: cls.duration || 60,
      meetingUrl: cls.meetingUrl || cls.streamUrl || '',
      platform: cls.platform || 'YouTube Live',
      status: cls.status || 'scheduled',
      description: cls.description || '',
      attendees: cls.attendees ?? cls.maxCapacity ?? 0,
    })
    setModalOpen(true)
  }

  async function onSubmit(data, addAnother = false) {
    setSubmitting(true)
    try {
      // Normalize meeting URL
      let formattedUrl = data.meetingUrl?.trim() || ''
      if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`
      }

      const payload = {
        ...data,
        meetingUrl: formattedUrl,
        streamUrl: formattedUrl, // maintain backwards compatibility
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        attendees: Number(data.attendees) || 0,
      }

      if (editingClass) {
        await update(editingClass.id, payload)
        toast.success('Live class session updated!')
        setModalOpen(false)
      } else {
        await add(payload)
        if (addAnother) {
          toast.success('Session scheduled! Ready for next session.')
          reset({
            title: '',
            instructor: data.instructor || '',
            category: data.category || '',
            scheduledAt: toDatetimeLocalString(new Date(Date.now() + 1000 * 60 * 60 * 2)),
            duration: data.duration || 60,
            meetingUrl: '',
            platform: data.platform || 'YouTube Live',
            status: 'scheduled',
            description: '',
            attendees: 0,
          })
        } else {
          toast.success('Live class scheduled successfully!')
          setModalOpen(false)
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save class')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleLive(cls) {
    try {
      const newStatus = cls.status === 'live' ? 'completed' : 'live'
      await update(cls.id, { status: newStatus })
      toast.success(
        newStatus === 'live'
          ? 'Lecture is now BROADCASTING LIVE!'
          : 'Live broadcast ended and marked as completed.'
      )
    } catch (err) {
      toast.error('Could not update broadcast status')
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return
    setSubmitting(true)
    try {
      await remove(deleteConfirm.id)
      setDeleteConfirm(null)
      toast.success('Session removed from timetable')
    } catch (err) {
      toast.error('Failed to remove session')
    } finally {
      setSubmitting(false)
    }
  }

  const tabsConfig = [
    { id: 'All',       label: 'All Sessions', count: liveClasses.length },
    { id: 'Live Now',  label: 'Live Now',     count: liveNow.length },
    { id: 'Upcoming',  label: 'Upcoming',     count: upcomingCount },
    { id: 'Completed', label: 'Archived',     count: completedCount },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Live Classes & Broadcasting"
        description="Schedule interactive lectures, integrate live video streams, and monitor student attendance"
        count={liveClasses.length}
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={openCreateModal}
          >
            Schedule Live Class
          </Button>
        }
      />

      {/* Broadcast Alert if any class is currently LIVE */}
      {liveNow.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border border-rose-500/40 rounded-2xl p-5 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start sm:items-center gap-3.5 z-10">
            <div className="relative flex h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Broadcasting Live Right Now
                </span>
                <span className="text-xs text-slate-400">• {liveNow[0].platform}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {liveNow[0].title}
              </h3>
              <p className="text-xs text-slate-300">
                Faculty: {liveNow[0].instructor} • {(liveNow[0].attendees || 184).toLocaleString()} active students in room
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto z-10 flex-wrap">
            <a
              href={getFullUrl(liveNow[0].meetingUrl || liveNow[0].streamUrl)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink size={14} />
              <span>Join Live Stream</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-slate-700 hover:bg-slate-800"
              onClick={() => handleToggleLive(liveNow[0])}
            >
              End Broadcast
            </Button>
          </div>
        </div>
      )}

      {/* Control Bar: Tabs + Instant Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by topic, faculty, subject…"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={Radio}
            title="No live classes found"
            description="There are no sessions matching your current filter or search criteria."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                Schedule Live Class
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(cls => {
            const isLive = cls.status === 'live'
            const isCompleted = cls.status === 'completed'
            const isCancelled = cls.status === 'cancelled'
            const classDate = parseDateValue(cls.scheduledAt)
            const liveUrl = getFullUrl(cls.meetingUrl || cls.streamUrl)

            return (
              <Card
                key={cls.id}
                className={`flex flex-col justify-between border-slate-200/80 hover:shadow-card-hover transition-all duration-200 ${
                  isLive ? 'ring-2 ring-rose-500/40 bg-rose-50/15' : ''
                }`}
              >
                <div>
                  {/* Top Badge Strip */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge
                      variant={
                        isLive ? 'red' : isCompleted ? 'gray' : isCancelled ? 'red' : 'blue'
                      }
                      dot={isLive}
                      size="xs"
                      className="font-bold uppercase tracking-wider"
                    >
                      {isLive ? 'LIVE NOW' : isCompleted ? 'COMPLETED' : isCancelled ? 'CANCELLED' : 'SCHEDULED'}
                    </Badge>

                    <Badge variant="indigo" size="xs">
                      {cls.platform || 'YouTube Live'}
                    </Badge>
                  </div>

                  {/* Title & Faculty */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Subject: <span className="font-semibold text-slate-700">{cls.category || cls.courseName || 'General'}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Faculty: <span className="font-medium text-slate-800">{cls.instructor || 'Lead Faculty'}</span>
                  </p>

                  {/* Schedule Details */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-medium">
                        {safeFormatDate(cls.scheduledAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Duration: {cls.duration || 60} mins</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Users size={12} />
                        {(cls.attendees ?? cls.maxCapacity ?? 0).toLocaleString()} Registered
                      </span>
                    </div>

                    {cls.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 pt-1">
                        {cls.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    size="xs"
                    variant={isLive ? 'danger' : isCompleted ? 'secondary' : 'primary'}
                    onClick={() => handleToggleLive(cls)}
                  >
                    {isLive ? 'End Broadcast' : isCompleted ? 'Restart Live' : 'Start Live Stream'}
                  </Button>

                  <div className="flex items-center gap-1">
                    {liveUrl !== '#' && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-accent-600 hover:bg-slate-100 transition"
                        title="Open Stream URL in New Tab"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-accent-600 hover:bg-slate-100 transition"
                      title="Edit Session Details"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Cancel / Delete Session"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Fast & Efficient High-Productivity SlideOver Drawer */}
      <SlideOver
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? 'Edit Live Session' : 'Schedule Live Classroom'}
        subtitle="Configure broadcasting parameters, live meeting room link, and scheduled timing."
        width="sm:max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(data => onSubmit(data, false))}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit(data => onSubmit(data, false))()
            }
          }}
          className="space-y-6"
        >
          {/* Section 1: Session Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Session & Academic Topic
              </h3>
            </div>

            <Input
              label="Session Title *"
              placeholder="e.g. Differential Calculus Live Problem Solving Marathon"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Lead Faculty *"
                placeholder="e.g. Er. Anand Kumar"
                error={errors.instructor?.message}
                {...register('instructor')}
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject / Domain *
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {CATEGORY_CHIPS.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setValue('category', chip)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition ${
                        watch('category') === chip
                          ? 'bg-accent-50 text-accent-700 border-accent-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Or custom category"
                  error={errors.category?.message}
                  {...register('category')}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Timing & Platform */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Schedule & Platform
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Scheduled Date & Time (Local IST) *"
                type="datetime-local"
                error={errors.scheduledAt?.message}
                {...register('scheduledAt')}
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Duration (Minutes) *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DURATION_PRESETS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValue('duration', d)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                        Number(watch('duration')) === d
                          ? 'bg-accent-50 text-accent-700 border-accent-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="60"
                  error={errors.duration?.message}
                  {...register('duration')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Streaming Platform *"
                options={PLATFORMS}
                error={errors.platform?.message}
                {...register('platform')}
              />
              <Select
                label="Initial Broadcast State"
                options={STATUS_OPTIONS}
                error={errors.status?.message}
                {...register('status')}
              />
            </div>

            <Input
              label="Live Stream / Room Meeting URL"
              placeholder="https://youtube.com/live/... or https://zoom.us/..."
              helperText="Enter YouTube, Zoom, or Google Meet link for student access"
              error={errors.meetingUrl?.message}
              {...register('meetingUrl')}
            />
          </div>

          {/* Section 3: Additional Notes */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Registration & Overview
              </h3>
            </div>

            <Input
              label="Initial Registered Attendees"
              type="number"
              placeholder="0"
              error={errors.attendees?.message}
              {...register('attendees')}
            />

            <Textarea
              label="Session Description / Key Learning Outcomes"
              placeholder="Outline topics, doubt-clearing segments, or formula sheets required..."
              rows={2}
              {...register('description')}
            />
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
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>

              {!editingClass && (
                <Button
                  type="button"
                  variant="secondary"
                  loading={submitting}
                  onClick={handleSubmit(data => onSubmit(data, true))}
                  className="text-accent-700 hover:text-accent-800 border-accent-200 hover:bg-accent-50"
                >
                  Save & Schedule Another
                </Button>
              )}

              <Button type="submit" variant="primary" loading={submitting}>
                {editingClass ? 'Update Session' : 'Schedule Broadcast'}
              </Button>
            </div>
          </div>
        </form>
      </SlideOver>

      {/* Delete / Cancel Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Cancel Session"
        message={`Are you sure you want to permanently remove "${deleteConfirm?.title}" from the live timetable?`}
        loading={submitting}
      />
    </div>
  )
}
