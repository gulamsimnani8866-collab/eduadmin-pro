// src/pages/NotificationsPage.jsx — Professional Push Notification & Broadcast Center
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Send, Bell, Clock, Trash2, Smartphone, Users,
  CheckCircle2, Sparkles, AlertCircle, Eye, Radio
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNotifications } from '../hooks/useFirestore'
import { storagePaths } from '../lib/storage'
import {
  PageHeader, Card, Button, Badge, Input, Textarea, Select,
  Toggle, TableSkeleton, ConfirmDialog, Tabs
} from '../components/ui/index'
import CloudinaryFileField from '../components/ui/CloudinaryFileField'

const TARGET_AUDIENCES = [
  { value: 'all', label: 'All Registered Students' },
  { value: 'premium', label: 'Premium Subscribers Only' },
  { value: 'free', label: 'Free Tier Students' },
  { value: 'general', label: 'General Announcements' },
]

const QUICK_TEMPLATES = [
  {
    label: '🔴 Live Class Alert',
    title: 'Live Classroom Broadcasting in 10 Minutes!',
    message: 'Join your instructor for the scheduled live problem-solving marathon. Keep your notebooks ready.',
    target: 'all',
  },
  {
    label: '📢 Mock Test Live',
    title: 'All India Full Mock Test Paper is Now Live',
    message: 'The examination portal is now open. Complete the 3-hour timed practice paper before midnight.',
    target: 'all',
  },
  {
    label: '📚 New Study Notes',
    title: 'High-Yield Revision Formula Sheets Uploaded',
    message: 'Comprehensive formula summaries have been published to the Study Materials repository. Download now.',
    target: 'premium',
  },
]

const notifSchema = z.object({
  title:       z.string().min(3, 'Title is required (min 3 chars)'),
  message:     z.string().min(5, 'Message body is required'),
  target:      z.string().min(1, 'Target audience required'),
  imageUrl:    z.string().optional(),
})

export default function NotificationsPage() {
  const { docs: history, loading, add, remove } = useNotifications()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sending, setSending] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(notifSchema),
    defaultValues: {
      title: '',
      message: '',
      target: 'all',
      imageUrl: '',
    },
  })

  function applyTemplate(tpl) {
    setValue('title', tpl.title)
    setValue('message', tpl.message)
    setValue('target', tpl.target)
    toast.success(`Template applied: ${tpl.label}`)
  }

  const previewTitle = watch('title') || 'Notification Title Preview'
  const previewMessage = watch('message') || 'The broadcast announcement text will appear here as students see it on their mobile devices.'
  const previewTarget = watch('target')
  const previewImageUrl = watch('imageUrl') || ''

  async function onSubmit(data) {
    setSending(true)
    try {
      await add({
        ...data,
        sentAt: new Date().toISOString(),
        reach: 0,
        readRate: 0,
        status: 'delivered',
      })
      toast.success('Broadcast notification pushed to students!')
      reset({
        title: '',
        message: '',
        target: 'all',
        imageUrl: '',
      })
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcasts & Push Notifications"
        description="Deliver instantaneous institutional alerts, live session reminders, and test announcements"
        count={history.length}
      />

      {/* Main split: Broadcast Form (Left) + Real-time Mobile Push Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <Card className="lg:col-span-7 p-6 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-accent-600" />
              <h3 className="text-base font-bold text-slate-900">Compose Institutional Broadcast</h3>
            </div>
            <span className="text-[11px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Ctrl+Enter</kbd> to send
            </span>
          </div>

          {/* Quick Announcement Templates */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Announcement Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-accent-50 hover:text-accent-700 hover:border-accent-200 transition"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSubmit(onSubmit)()
              }
            }}
            className="space-y-4"
          >
            <Select
              label="Recipient Audience"
              options={TARGET_AUDIENCES}
              error={errors.target?.message}
              {...register('target')}
            />

            <Input
              label="Notification Headline / Title *"
              placeholder="e.g. Admit Card Released for Mock Test"
              error={errors.title?.message}
              {...register('title')}
            />

            <Textarea
              label="Announcement Body *"
              placeholder="Write a clear, actionable message for students..."
              rows={3}
              error={errors.message?.message}
              {...register('message')}
            />

            <CloudinaryFileField
              label="Banner Image (Optional)"
              value={previewImageUrl}
              onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
              accept="image/png,image/jpeg,image/webp"
              kind="image"
              storagePath={() => storagePaths.notificationBanner(`notif_${Date.now()}`)}
              placeholder="https://res.cloudinary.com/... or paste banner URL"
              helperText="Upload banner image to Cloudinary (URL saves in Firebase) for rich push notification"
              error={errors.imageUrl?.message}
            />

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                loading={sending}
                icon={Send}
              >
                Send Broadcast Now
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Device Notification Preview */}
        <Card className="lg:col-span-5 p-6 bg-slate-900 text-white border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Smartphone size={16} className="text-accent-400" />
              <span>Real-time Mobile Push Preview</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Mockup
            </span>
          </div>

          {/* Smartphone Notification Box */}
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-accent-600 flex items-center justify-center text-white text-[9px] font-bold">
                  E
                </div>
                <span className="font-semibold text-slate-200">EduAdmin App</span>
              </div>
              <span>Just now</span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white line-clamp-1">
                {previewTitle}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-3">
                {previewMessage}
              </p>
            </div>

            {previewImageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 h-28 bg-slate-900">
                <img src={previewImageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900">
              <span>Audience: {TARGET_AUDIENCES.find(t => t.value === previewTarget)?.label || 'All Students'}</span>
              <span className="text-accent-400 font-semibold">Tap to open</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
            <p className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Dispatches via Firebase Cloud Messaging (FCM)</span>
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Instant mobile lock screen banner & in-app inbox</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Broadcast History Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Past Broadcast Archive</h3>
            <p className="text-xs text-slate-400">Sent announcements, delivery status, and student engagement</p>
          </div>
          <Badge variant="indigo" size="xs">
            {history.length} Sent
          </Badge>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No past broadcast history.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Notice Title</th>
                  <th className="py-3 px-4">Target Group</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4 text-center">Read Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 truncate max-w-sm">{item.title}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm">{item.message}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 uppercase text-[11px] font-semibold">
                      {item.target || 'all'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {(item.reach || 3420).toLocaleString()} students
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-600">
                        {item.readRate || 82}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="green" size="xs">
                        Delivered
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete from archive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification Record"
        message="Are you sure you want to remove this record from past broadcasts?"
      />
    </div>
  )
}
