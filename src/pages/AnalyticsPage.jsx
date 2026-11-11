// src/pages/AnalyticsPage.jsx — Pure Firebase Firestore Analytics
import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  DollarSign, TrendingUp, Users, BookOpen, Award, Download,
  Calendar, ArrowUpRight, CheckCircle2, IndianRupee, PieChart as PieIcon,
  HardDrive
} from 'lucide-react'
import { PageHeader, Card, Badge, Button, Tabs, EmptyState, TableSkeleton } from '../components/ui/index'
import { useCourses, useUsers, usePurchases } from '../hooks/useFirestore'

export default function AnalyticsPage() {
  const { docs: courses, loading: coursesLoading } = useCourses()
  const { docs: users, loading: usersLoading } = useUsers()
  const { docs: purchases, loading: purchasesLoading } = usePurchases()

  const loading = coursesLoading || usersLoading || purchasesLoading

  // Compute metrics purely from real Firestore records
  const totalRevenue = useMemo(() => {
    return purchases
      .filter(p => p.status === 'success' || !p.status)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [purchases])

  const totalStudents = users.length
  const totalCourses = courses.length

  // Monthly revenue & enrollment curves from real Firestore purchases
  const monthlyData = useMemo(() => {
    const map = {}
    purchases.forEach(p => {
      const dt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now())
      const monthLabel = dt.toLocaleString('default', { month: 'short' })
      if (!map[monthLabel]) map[monthLabel] = { month: monthLabel, revenue: 0, enrollments: 0 }
      map[monthLabel].revenue += Number(p.amount) || 0
      map[monthLabel].enrollments += 1
    })
    return Object.values(map)
  }, [purchases])

  // Top courses from real Firestore courses collection
  const topCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0))
      .slice(0, 5)
      .map(c => ({
        name: c.title,
        enrollments: c.enrollments || 0,
        price: c.price || 0,
      }))
  }, [courses])

  // Category breakdown from real Firestore courses collection
  const categoryData = useMemo(() => {
    const counts = {}
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
    courses.forEach(c => {
      const cat = c.category || 'General'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.keys(counts).map((cat, i) => ({
      name: cat,
      value: counts[cat],
      color: colors[i % colors.length],
    }))
  }, [courses])

  if (loading) {
    return <TableSkeleton rows={6} cols={4} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Institutional Analytics & Revenue"
        description="Directly reflecting real Firestore transactions, student accounts, and course registrations"
        action={
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => window.print()}
          >
            Export Report
          </Button>
        }
      />

      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Gross Verified Revenue</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <IndianRupee size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
            <span>{purchases.length} total purchase records</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Students</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {totalStudents.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
            <span>Firestore users collection</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Courses</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {totalCourses}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
            <span>Firestore courses collection</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Yield per Student</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{totalStudents > 0 ? Math.round(totalRevenue / totalStudents).toLocaleString() : 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
            <span>Revenue divided by student count</span>
          </div>
        </Card>
      </div>

      {/* Main Area Chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue & Enrollment Progression</h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculated from Firestore purchases</p>
          </div>
          <Badge variant="indigo" size="sm">Real-time Data</Badge>
        </div>

        {monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <IndianRupee size={32} className="text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Transaction Records in Database</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              When student purchases are logged in Firestore, the monthly analytics curve will populate here automatically.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="anEnroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
                formatter={(v, name) => [
                  name === 'Revenue (₹)' ? `₹${v.toLocaleString()}` : v,
                  name
                ]}
              />
              <Legend verticalAlign="top" height={36} />
              <Area yAxisId="left" type="monotone" dataKey="enrollments" stroke="#4f46e5" fill="url(#anEnroll)" name="Enrollments" strokeWidth={2.5} />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#anRev)" name="Revenue (₹)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Row 2: Top Courses & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Courses by Enrollment</h3>
              <p className="text-xs text-slate-400 mt-0.5">From real Firestore courses collection</p>
            </div>
            <Badge variant="blue" size="xs">Live Courses</Badge>
          </div>

          {topCourses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No courses found in database.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topCourses} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="enrollments" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Students Enrolled" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category Breakdown */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Category Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Calculated from course domains</p>
              </div>
              <Badge variant="green" size="xs">Categories</Badge>
            </div>

            {categoryData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No course categories available in database.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.map(c => (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{c.name}</span>
                      <span className="font-bold text-slate-900">{c.value} courses</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: c.color,
                          width: `${Math.round((c.value / totalCourses) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-500">
            <span>Directly mapped from Firestore courses collection</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
