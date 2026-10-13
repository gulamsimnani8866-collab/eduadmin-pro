// src/pages/FeedbackPage.jsx
import { useState } from 'react'
import { MessageSquare, Star, Check, EyeOff, Reply } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useFeedback } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, Textarea,
  TableSkeleton, EmptyState
} from '../components/ui/index'

const TABS = ['All', 'Pending Approval', 'Approved', 'Replied']
const STATUS_COLORS = { pending: 'yellow', approved: 'green', hidden: 'gray', replied: 'blue' }

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const { docs: feedbacks, loading, update } = useFeedback({ orderByField: 'createdAt' })
  const [tab, setTab]         = useState('All')
  const [replyTarget, setRT]  = useState(null)
  const [replyText, setRT2]   = useState('')
  const [replying, setReplying] = useState(false)

  const filtered = feedbacks.filter(f => {
    if (tab === 'All') return true
    if (tab === 'Pending Approval') return f.status === 'pending' || !f.status
    if (tab === 'Approved') return f.status === 'approved'
    if (tab === 'Replied') return f.status === 'replied'
    return true
  })

  async function handleAction(id, action) {
    await update(id, { status: action })
    toast.success(`Feedback ${action}`)
  }

  async function handleReply() {
    if (!replyText.trim()) return toast.error('Reply is empty')
    setReplying(true)
    try {
      await update(replyTarget.id, { status: 'replied', adminReply: replyText, repliedAt: new Date().toISOString() })
      toast.success('Reply submitted!')
      setRT(null)
      setRT2('')
    } finally {
      setReplying(false)
    }
  }

  return (
    <>
      <PageHeader title="Feedback" count={feedbacks.length} />

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No feedback found" />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student','Course','Rating','Comment','Status','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{f.studentName ?? 'Anonymous'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{f.courseName ?? '—'}</td>
                  <td className="py-3 px-4"><StarRating count={f.rating ?? 0} /></td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{f.comment ?? '—'}</td>
                  <td className="py-3 px-4"><Badge variant={STATUS_COLORS[f.status] ?? 'yellow'}>{f.status ?? 'pending'}</Badge></td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {f.createdAt?.toDate ? format(f.createdAt.toDate(), 'MMM d') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {(!f.status || f.status === 'pending') && (
                        <button onClick={() => handleAction(f.id, 'approved')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                          <Check size={13} />
                        </button>
                      )}
                      <button onClick={() => handleAction(f.id, 'hidden')}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Hide">
                        <EyeOff size={13} />
                      </button>
                      <button onClick={() => { setRT(f); setRT2('') }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Reply">
                        <Reply size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <SlideOver open={!!replyTarget} onClose={() => setRT(null)} title="Reply to Feedback">
        {replyTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Original Comment</p>
              <p className="text-sm text-gray-900">{replyTarget.comment}</p>
              <StarRating count={replyTarget.rating ?? 0} />
            </div>
            <Textarea
              label="Admin Reply"
              value={replyText}
              onChange={e => setRT2(e.target.value)}
              placeholder="Write your reply…"
              rows={5}
            />
            <Button className="w-full justify-center" onClick={handleReply} loading={replying}>
              Submit Reply
            </Button>
          </div>
        )}
      </SlideOver>
    </>
  )
}
