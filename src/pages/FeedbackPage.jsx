// src/pages/FeedbackPage.jsx — Professional Student Feedback & Support Center
import { useState, useMemo } from 'react'
import { MessageSquare, Star, Reply, CheckCircle2, Clock, Send, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useFeedback } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, Textarea,
  TableSkeleton, EmptyState, Tabs
} from '../components/ui/index'

const STATUS_VARIANTS = {
  pending: 'amber',
  approved: 'green',
  resolved: 'green',
  replied: 'blue',
  in_progress: 'indigo',
}

function parseDateValue(val) {
  if (!val) return null
  try {
    if (typeof val?.toDate === 'function') {
      const d = val.toDate()
      return isNaN(d.getTime()) ? null : d
    }
    if (typeof val?.seconds === 'number') {
      const d = new Date(val.seconds * 1000)
      return isNaN(d.getTime()) ? null : d
    }
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function safeFormatDate(val, fmt = 'MMM d, yyyy') {
  const d = parseDateValue(val)
  if (!d) return null
  try {
    return format(d, fmt)
  } catch {
    return null
  }
}

function StarRating({ count }) {
  const numericCount = Math.max(0, Math.min(5, Math.round(Number(count) || 5)))
  return (
    <div className="flex gap-0.5" title={`${numericCount} of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= numericCount ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const { docs: feedbacks, loading, update, remove } = useFeedback()
  const [tab, setTab] = useState('All')
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const pendingCount = feedbacks.filter(f => f.status === 'pending' || !f.status).length
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved' || f.status === 'approved' || f.status === 'replied').length

  const avgRating = useMemo(() => {
    if (feedbacks.length === 0) return '0.0'
    const sum = feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0)
    return (sum / feedbacks.length).toFixed(1)
  }, [feedbacks])

  const responseRate = useMemo(() => {
    if (feedbacks.length === 0) return 0
    return Math.round((resolvedCount / feedbacks.length) * 100)
  }, [feedbacks, resolvedCount])

  const filtered = feedbacks.filter(f => {
    if (tab === 'All') return true
    if (tab === 'Pending Review') return f.status === 'pending' || !f.status
    if (tab === 'Resolved') return f.status === 'resolved' || f.status === 'approved'
    if (tab === 'Replied') return f.status === 'replied'
    return true
  })

  async function handleAction(id, action) {
    await update(id, { status: action })
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this feedback item from database?')) {
      await remove(id)
    }
  }

  async function handleReply() {
    if (!replyText.trim()) return toast.error('Please write a reply message')
    setReplying(true)
    try {
      await update(replyTarget.id, {
        status: 'replied',
        adminReply: replyText,
        repliedAt: new Date().toISOString(),
      })
      toast.success('Reply submitted to student!')
      setReplyTarget(null)
      setReplyText('')
    } finally {
      setReplying(false)
    }
  }

  const tabsConfig = [
    { id: 'All',            label: 'All Inquiries', count: feedbacks.length },
    { id: 'Pending Review', label: 'Pending',       count: pendingCount },
    { id: 'Resolved',       label: 'Resolved',      count: resolvedCount },
    { id: 'Replied',        label: 'Replied',       count: feedbacks.filter(f => f.status === 'replied').length },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Student Feedback & Inquiries"
        description="Monitor student satisfaction ratings, review course feedback, and respond to queries"
        count={feedbacks.length}
      />

      {/* Aggregate Satisfaction Score Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Average Student Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{avgRating}</span>
              <StarRating count={Math.round(Number(avgRating))} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">From {feedbacks.length} student reviews in database</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Star size={20} className="fill-amber-500" />
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Resolution Rate</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{responseRate}%</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">{resolvedCount} of {feedbacks.length} inquiries resolved</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Inquiries</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Requiring administrative review</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Clock size={20} />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={tab}
        onChange={setTab}
      />

      {/* Feedback List Card */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState icon={MessageSquare} title="No feedback in this category" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Feedback / Inquiry</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map(item => {
                  const studentName = item.studentName || item.userName || item.name || item.displayName || 'Anonymous Student'
                  const studentEmail = item.email || item.userEmail || item.studentEmail || 'Verified Student'
                  const initial = (typeof studentName === 'string' && studentName.trim().length > 0)
                    ? studentName.trim()[0].toUpperCase()
                    : 'S'
                  const commentText = typeof item.comment === 'string'
                    ? item.comment
                    : (item.message || item.feedback || item.text || item.review || 'No comment provided.')
                  const courseTitle = item.courseName || item.courseTitle || item.course || 'General Platform'
                  const replyContent = typeof item.adminReply === 'string'
                    ? item.adminReply
                    : (item.adminReply?.text || (item.adminReply ? JSON.stringify(item.adminReply) : null))
                  const dateStr = safeFormatDate(item.createdAt || item.timestamp || item.date)

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{studentName}</p>
                            <p className="text-[11px] text-slate-400">{studentEmail}</p>
                            {dateStr && <p className="text-[10px] text-slate-400 mt-0.5">{dateStr}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StarRating count={item.rating || 5} />
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="indigo" size="xs">
                          {courseTitle}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 leading-relaxed line-clamp-2">
                          {commentText}
                        </p>
                        {replyContent && (
                          <p className="text-[11px] text-accent-700 mt-1 italic">
                            ↳ Replied: "{replyContent}"
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={STATUS_VARIANTS[item.status] || 'amber'}
                          size="xs"
                          dot
                        >
                          {item.status || 'pending'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="secondary"
                            icon={Reply}
                            onClick={() => {
                              setReplyTarget({ ...item, _resolvedName: studentName, _resolvedComment: commentText })
                              setReplyText(replyContent || '')
                            }}
                          >
                            Reply
                          </Button>
                          {item.status !== 'resolved' && (
                            <Button
                              size="xs"
                              variant="success"
                              onClick={() => handleAction(item.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          />
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

      {/* Reply SlideOver Drawer */}
      <SlideOver
        open={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title="Respond to Student Feedback"
        subtitle={`Reply will be saved directly for ${replyTarget?._resolvedName || replyTarget?.studentName || 'Student'}`}
      >
        {replyTarget && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs">
                  {replyTarget._resolvedName || replyTarget.studentName || 'Student'}
                </span>
                <StarRating count={replyTarget.rating || 5} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{replyTarget._resolvedComment || replyTarget.comment || replyTarget.message || ''}"
              </p>
            </div>

            <Textarea
              label="Official Institutional Response"
              placeholder="Write a helpful, polite reply addressing the student's question or feedback..."
              rows={5}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setReplyTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={replying}
                icon={Send}
                onClick={handleReply}
              >
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
