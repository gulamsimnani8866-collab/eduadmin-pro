// src/pages/DashboardPage.jsx
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BookOpen, Users, DollarSign, Radio, TrendingUp } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { KpiCard, Card, Skeleton, Badge } from '../components/ui/index'

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const { stats, loading, recentCourses, monthlyEnrollments } = useDashboard()

  const kpis = [
    { title: 'Total Courses',    value: stats.totalCourses,    icon: BookOpen,     color: 'blue',   delta: 8  },
    { title: 'Total Students',   value: stats.totalStudents,   icon: Users,        color: 'green',  delta: 12 },
    { title: 'Revenue (₹)',      value: stats.revenue ? `₹${stats.revenue.toLocaleString()}` : '—', icon: DollarSign, color: 'purple', delta: 5 },
    { title: 'Upcoming Classes', value: stats.upcomingClasses, icon: Radio,        color: 'orange', delta: -2 },
  ]

  const courseTypeData = [
    { name: 'Free',    value: 34 },
    { name: 'Premium', value: 18 },
    { name: 'Draft',   value: 7  },
  ]

  const weeklyData = [
    { day: 'Mon', users: 12, purchases: 3 },
    { day: 'Tue', users: 19, purchases: 7 },
    { day: 'Wed', users: 15, purchases: 5 },
    { day: 'Thu', users: 28, purchases: 9 },
    { day: 'Fri', users: 22, purchases: 6 },
    { day: 'Sat', users: 35, purchases: 14 },
    { day: 'Sun', users: 30, purchases: 11 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Trend */}
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Enrollment Trend</h2>
            <Badge variant="blue">Monthly</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyEnrollments} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Course Type Pie */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Course Types</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={courseTypeData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {courseTypeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#2563eb" radius={[4,4,0,0]} name="New Users" />
              <Bar dataKey="purchases" fill="#22c55e" radius={[4,4,0,0]} name="Purchases" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Courses */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Recent Courses</h2>
          {recentCourses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No courses yet</p>
          ) : (
            <div className="space-y-3">
              {recentCourses.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  {c.coverUrl ? (
                    <img src={c.coverUrl} alt={c.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.instructor ?? 'Unknown'}</p>
                  </div>
                  <Badge variant={c.type === 'premium' ? 'purple' : 'blue'}>
                    {c.type ?? 'free'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
