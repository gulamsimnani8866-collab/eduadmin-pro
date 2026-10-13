// src/pages/LiveClassesPage.jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Video, Clock, Users, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useLiveClasses } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, Modal, ConfirmDialog,
  Input, Textarea, Select, Toggle, TableSkeleton, EmptyState
} from '../components/ui/index'

const TABS = ['Upcoming', 'Past']

const liveSchema = z.object({
  title:       z.string().min(3),
  courseId:    z.string().optional(),
  scheduledAt: z.string().min(1, 'Date & Time required'),
  duration:    z.coerce.number().min(1),
  streamUrl:   z.string().url('Enter a valid stream URL').optional().or(z.literal('')),
  platform:    z.string().optional(),
  maxCapacity: z.coerce.number().optional(),
  description: z.string().optional(),
  notify:      z.boolean().optional(),
})

function ClassCard({ cls, onEdit, onCancel }) {
  const platformColors = { youtube: 'red', zoom: 'blue', meet: 'green', teams: 'purple' }
  const statusColors   = { scheduled: 'blue', live: 'green', completed: 'gray', cancelled: 'red' }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{cls.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{cls.courseName ?? 'No course linked'}</p>
        </div>
        <Badge variant={statusColors[cls.status] ?? 'gray'}>{cls.status ?? 'scheduled'}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Clock size={12} /> {cls.scheduledAt ? format(new Date(cls.scheduledAt), 'MMM d, HH:mm') : '—'}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} /> {cls.duration ?? '—'} min
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} /> {cls.maxCapacity ?? '∞'} capacity
        </div>
        <div className="flex items-center gap-1.5">
          <Video size={12} />
          <Badge variant={platformColors[cls.platform?.toLowerCase()] ?? 'gray'} className="text-[10px]">
            {cls.platform ?? 'Unknown'}
          </Badge>
        </div>
      </div>

      {cls.status === 'scheduled' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={() => onEdit(cls)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => onCancel(cls)}>
            <XCircle size={12} /> Cancel
          </Button>
        </div>
      )}
    </Card>
  )
}

function LiveClassForm({ cls, onClose, onSave }) {
  const [notify, setNotify] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(liveSchema),
    defaultValues: {
      title:       cls?.title ?? '',
      scheduledAt: cls?.scheduledAt ?? '',
      duration:    cls?.duration ?? 60,
      streamUrl:   cls?.streamUrl ?? '',
      platform:    cls?.platform ?? 'YouTube',
      maxCapacity: cls?.maxCapacity ?? 100,
      description: cls?.description ?? '',
    },
  })

  async function onSubmit(data) {
    try {
      await onSave({ ...data, notify, status: cls?.status ?? 'scheduled' })
      toast.success(cls ? 'Class updated!' : 'Class scheduled!')
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title *" error={errors.title?.message} {...register('title')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date & Time *" type="datetime-local" error={errors.scheduledAt?.message} {...register('scheduledAt')} />
        <Input label="Duration (minutes)" type="number" {...register('duration')} />
      </div>
      <Input label="Stream URL" {...register('streamUrl')} placeholder="https://youtube.com/live/..." />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Platform"
          options={['YouTube','Zoom','Google Meet','MS Teams'].map(v => ({ value: v, label: v }))}
          {...register('platform')}
        />
        <Input label="Max Capacity" type="number" {...register('maxCapacity')} />
      </div>
      <Textarea label="Description" {...register('description')} />
      <Toggle checked={notify} onChange={setNotify} label="Send push notification to students" />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{cls ? 'Update' : 'Schedule Class'}</Button>
      </div>
    </form>
  )
}

export default function LiveClassesPage() {
  const { docs: classes, loading, add, update } = useLiveClasses({ orderByField: 'scheduledAt', orderDir: 'asc' })
  const [tab, setTab]         = useState('Upcoming')
  const [formOpen, setFormOpen]  = useState(false)
  const [editCls, setEditCls]    = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  const now = new Date()
  const filtered = classes.filter(c => {
    const dt = c.scheduledAt ? new Date(c.scheduledAt) : null
    if (tab === 'Upcoming') return dt && dt >= now && c.status !== 'cancelled'
    return !dt || dt < now || c.status === 'cancelled' || c.status === 'completed'
  })

  async function handleSave(data) {
    if (editCls) await update(editCls.id, data)
    else await add(data)
  }

  async function handleCancel() {
    if (!cancelTarget) return
    await update(cancelTarget.id, { status: 'cancelled' })
    toast.success('Class cancelled')
    setCancelTarget(null)
  }

  return (
    <>
      <PageHeader
        title="Live Classes"
        count={classes.length}
        action={
          <Button onClick={() => { setEditCls(null); setFormOpen(true) }}>
            <Plus size={15} /> Schedule Class
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Video}
          title={`No ${tab.toLowerCase()} classes`}
          description={tab === 'Upcoming' ? 'Schedule your first live class' : 'No past classes yet'}
          action={tab === 'Upcoming' && (
            <Button onClick={() => { setEditCls(null); setFormOpen(true) }}>
              <Plus size={14} /> Schedule Class
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <ClassCard
              key={c.id}
              cls={c}
              onEdit={c => { setEditCls(c); setFormOpen(true) }}
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editCls ? 'Edit Class' : 'Schedule Live Class'} size="lg">
        <LiveClassForm cls={editCls} onClose={() => setFormOpen(false)} onSave={handleSave} />
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Class"
        message={`Cancel "${cancelTarget?.title}"? Students will be notified.`}
      />
    </>
  )
}
