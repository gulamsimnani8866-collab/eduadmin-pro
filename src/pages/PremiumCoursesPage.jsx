// src/pages/PremiumCoursesPage.jsx
import { useState } from 'react'
import { Crown, DollarSign, TrendingUp } from 'lucide-react'
import { useCourses, usePurchases } from '../hooks/useFirestore'
import {
  PageHeader, Card, Badge, KpiCard, TableSkeleton, EmptyState
} from '../components/ui/index'
import { format } from 'date-fns'

const TABS = ['Premium Courses', 'Purchase History']

export default function PremiumCoursesPage() {
  const { docs: courses,   loading: cl } = useCourses({ filters: [{ field: 'type', op: '==', value: 'premium' }] })
  const { docs: purchases, loading: pl } = usePurchases({ orderByField: 'createdAt' })
  const [tab, setTab] = useState('Premium Courses')

  const revenue = purchases
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return (
    <>
      <PageHeader title="Premium" />

      {/* Revenue Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard title="Total Revenue" value={`₹${revenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <KpiCard title="Premium Courses" value={courses.length} icon={Crown} color="purple" />
        <KpiCard title="Total Sales" value={purchases.filter(p => p.status === 'success').length} icon={TrendingUp} color="blue" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === 'Premium Courses' && (
        <Card className="overflow-hidden p-0">
          {cl ? <div className="p-5"><TableSkeleton rows={4} cols={5} /></div>
          : courses.length === 0 ? <EmptyState icon={Crown} title="No premium courses" description="Mark courses as premium in the Courses section" />
          : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Course','Price','Enrolments','Revenue','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.instructor ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">₹{c.price?.toLocaleString() ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{c.enrollments ?? 0}</td>
                    <td className="py-3 px-4 text-sm font-medium text-green-700">
                      ₹{((c.enrollments ?? 0) * (c.price ?? 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.published ? 'green' : 'gray'}>{c.published ? 'Published' : 'Draft'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'Purchase History' && (
        <Card className="overflow-hidden p-0">
          {pl ? <div className="p-5"><TableSkeleton rows={6} cols={6} /></div>
          : purchases.length === 0 ? <EmptyState icon={TrendingUp} title="No purchases yet" />
          : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student','Course','Amount','Method','Transaction ID','Status','Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.studentName ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.courseName ?? '—'}</td>
                    <td className="py-3 px-4 text-sm font-semibold">₹{p.amount?.toLocaleString() ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{p.paymentMethod ?? '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">{p.transactionId ?? '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'success' ? 'green' : p.status === 'pending' ? 'yellow' : 'red'}>
                        {p.status ?? 'unknown'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {p.createdAt?.toDate ? format(p.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </>
  )
}
