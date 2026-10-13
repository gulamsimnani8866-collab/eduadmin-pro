// src/pages/NotificationsPage.jsx
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Bell, Clock, Trash2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNotifications } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, Input, Textarea, Select,
  Toggle, TableSkeleton, ConfirmDialog
} from '../components/ui/index'

const notifSchema = z.object({
  title:       z.string().min(1, 'Title required'),
  body:        z.string().min(1, 'Message required'),
  imageUrl:    z.string().trim().url('Enter a valid URL (https://...)').optional().or(z.literal('')),
  deepLink:    z.string().optional(),
  targetType:  z.enum(['all', 'course', 'individual']),
  courseId:    z.string().optional(),
  targetUser:  z.string().optional(),
  scheduledAt: z.string().optional(),
})

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

function formatNotifDate(n) {
  const raw = n?.sentAt ?? n?.scheduledAt ?? n?.createdAt ?? n?.timestamp
  const d = parseDateValue(raw)
  if (!d) return '—'
  try {
    return format(d, 'MMM d, HH:mm')
  } catch {
    return '—'
  }
}

export default function NotificationsPage() {
  const { docs: rawHistory, loading, error, add, remove } = useNotifications({ orderByField: null })
  const [scheduled, setScheduled] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const history = useMemo(() => {
    return [...rawHistory].sort((a, b) => {
      const da = parseDateValue(a?.sentAt ?? a?.createdAt ?? a?.scheduledAt)?.getTime() ?? 0
      const db = parseDateValue(b?.sentAt ?? b?.createdAt ?? b?.scheduledAt)?.getTime() ?? 0
      return db - da
    })
  }, [rawHistory])

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(notifSchema),
    defaultValues: {
      title: '',
      body: '',
      imageUrl: '',
      deepLink: '',
      targetType: 'all',
      courseId: '',
      targetUser: '',
      scheduledAt: '',
    },
  })

  const targetType = watch('targetType')

  async function onSubmit(data) {
    if (data.targetType === 'course' && !data.courseId?.trim()) {
      return toast.error('Please enter a Course ID')
    }
    if (data.targetType === 'individual' && !data.targetUser?.trim()) {
      return toast.error('Please enter a User Email / ID')
    }
    if (scheduled && !data.scheduledAt) {
      return toast.error('Please select a schedule date & time')
    }

    try {
      const nowIso = new Date().toISOString()
      await add({
        title:       data.title.trim(),
        body:        data.body.trim(),
        imageUrl:    data.imageUrl?.trim() || '',
        deepLink:    data.deepLink?.trim() || '',
        targetType:  data.targetType,
        courseId:    data.targetType === 'course' ? data.courseId?.trim() : null,
        targetUser:  data.targetType === 'individual' ? data.targetUser?.trim() : null,
        scheduledAt: scheduled ? new Date(data.scheduledAt).toISOString() : null,
        sentAt:      scheduled ? new Date(data.scheduledAt).toISOString() : nowIso,
        status:      scheduled ? 'scheduled' : 'sent',
        delivered:   0,
        opened:      0,
      })
      toast.success(scheduled ? 'Notification scheduled!' : 'Notification sent!')
      reset()
      setScheduled(false)
    } catch {
      // Error toast is already displayed by useFirestore add()
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Notification deleted')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const statusColors = { sent: 'blue', delivered: 'green', scheduled: 'yellow', failed: 'red' }

  return (
    <>
      <PageHeader title="Notifications" count={history.length} />

      {error && (
        <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Failed to load notifications: {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-blue-600" /> Compose Notification
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Title *"
              error={errors.title?.message}
              {...register('title')}
              placeholder="Notification title"
            />
            <Textarea
              label="Message *"
              error={errors.body?.message}
              {...register('body')}
              placeholder="Notification body…"
              rows={3}
            />
            <Input
              label="Image URL (optional)"
              error={errors.imageUrl?.message}
              {...register('imageUrl')}
              placeholder="https://…"
            />
            <Input
              label="Deep Link (optional)"
              error={errors.deepLink?.message}
              {...register('deepLink')}
              placeholder="eduapp://course/123"
            />
            <Select
              label="Target Audience"
              options={[
                { value: 'all',        label: 'All Students' },
                { value: 'course',     label: 'Course Subscribers' },
                { value: 'individual', label: 'Individual User' },
              ]}
              {...register('targetType')}
            />
            {targetType === 'course' && (
              <Input
                label="Course ID *"
                error={errors.courseId?.message}
                {...register('courseId')}
                placeholder="Enter course ID…"
              />
            )}
            {targetType === 'individual' && (
              <Input
                label="User Email / ID *"
                error={errors.targetUser?.message}
                {...register('targetUser')}
                placeholder="user@example.com"
              />
            )}
            <Toggle checked={scheduled} onChange={setScheduled} label="Schedule for later" />
            {scheduled && (
              <Input
                label="Schedule Date & Time *"
                type="datetime-local"
                error={errors.scheduledAt?.message}
                {...register('scheduledAt')}
              />
            )}
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              <Send size={14} /> {scheduled ? 'Schedule Notification' : 'Send Now'}
            </Button>
          </form>
        </Card>

        {/* History */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Notification History</h2>
          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : history.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400 text-center py-8">No notifications sent yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map(n => {
                const statusText = typeof n.status === 'string' ? n.status : 'sent'
                const titleText  = typeof n.title === 'string' || typeof n.title === 'number' ? String(n.title) : 'Untitled Notification'
                const bodyText   = typeof n.body === 'string' || typeof n.body === 'number'
                  ? String(n.body)
                  : typeof n.message === 'string'
                    ? n.message
                    : ''
                const deliveredCount = typeof n.delivered === 'number' ? n.delivered : Number(n.delivered) || 0
                const openedCount    = typeof n.opened === 'number' ? n.opened : Number(n.opened) || 0

                return (
                  <Card key={n.id} className="py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm text-gray-900">{titleText}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={statusColors[statusText] ?? 'gray'}>{statusText}</Badge>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(n)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{bodyText}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatNotifDate(n)}
                      </span>
                      <span>📬 {deliveredCount} delivered</span>
                      <span>👆 {openedCount} opened</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Notification"
        message={`Delete "${deleteTarget?.title ?? 'this notification'}" from history?`}
      />
    </>
  )
}

