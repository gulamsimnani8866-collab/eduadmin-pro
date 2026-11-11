// src/pages/DashboardPage.jsx — Pure Firebase Firestore Dashboard
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import {
  BookOpen, Users, DollarSign, Radio, TrendingUp, Plus,
  Bell, FileText, ArrowUpRight, Play, ExternalLink, Sparkles,
  Calendar, ShieldCheck, CheckCircle2, ChevronRight, HardDrive,
  IndianRupee, Star
} from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { useAuthStore } from '../store/authStore'
import { CLOUDINARY_CLOUD_NAME } from '../lib/cloudinary'
import {
  KpiCard, Card, Skeleton, Badge, Button, PageHeader, EmptyState
} from '../components/ui/index'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { admin } = useAuthStore()
  const {
    stats,
    loading,
    recentCourses,
    monthlyEnrollments,
    upcomingClassesList,
    courseBreakdown
  } = useDashboard()

  const [chartMetric, setChartMetric] = useState('revenue')
  const [timeRange, setTimeRange] = useState('30d')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-slate-200/80 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  const kpis = [
    {
      title: 'Total Courses in Firebase',
      value: stats.totalCourses,
      subtitle: `${stats.totalCourses} records in Firestore`,
      icon: BookOpen,
      color: 'indigo',
    },
    {
      title: 'Total Registered Students',
      value: (stats.totalStudents || 0).toLocaleString(),
      subtitle: `${stats.totalStudents} user accounts in Firestore`,
      icon: Users,
      color: 'emerald',
    },
    {
      title: 'Total Verified Revenue',
      value: `₹${(stats.revenue || 0).toLocaleString()}`,
      subtitle: `${stats.totalPurchases || 0} successful transactions`,
      icon: IndianRupee,
      color: 'blue',
    },
    {
      title: 'Live & Upcoming Classes',
      value: stats.upcomingClasses || 0,
      subtitle: `${upcomingClassesList.length} session records`,
      icon: Radio,
      color: 'rose',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-500/20 text-accent-300 border border-accent-500/30">
              Firebase Project: jscdatabase
            </span>
            <span className="text-xs text-slate-400">• Firestore Real-time</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome back, {admin?.name || admin?.email || 'Administrator'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Live database telemetry connected. Currently tracking {stats.totalCourses} courses, {stats.totalStudents} students, and {stats.upcomingClasses} scheduled lectures.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 z-10 self-start md:self-auto flex-wrap">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/courses?action=new')}
            icon={Plus}
          >
            Create Course
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/live-classes?action=new')}
            icon={Radio}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Schedule Live
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {/* Quick Operations Strip */}
      <Card className="p-4 bg-white/80 border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Operations
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              icon={Plus}
              onClick={() => navigate('/courses?action=new')}
            >
              New Course
            </Button>

            <Button
              size="sm"
              variant="secondary"
              icon={Radio}
              onClick={() => navigate('/live-classes?action=new')}
            >
              Schedule Live
            </Button>

            <Button
              size="sm"
              variant="secondary"
              icon={FileText}
              onClick={() => navigate('/study-materials?action=new')}
            >
              Upload Material
            </Button>

            <Button
              size="sm"
              variant="secondary"
              icon={Bell}
              onClick={() => navigate('/notifications?action=new')}
            >
              Send Notice
            </Button>

            <Button
              size="sm"
              variant="outline"
              icon={Users}
              onClick={() => navigate('/users')}
            >
              Manage Users
            </Button>
          </div>
        </div>
      </Card>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Area Chart */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Enrollment & Financial Growth
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated from Firestore <code className="text-indigo-600 font-mono">purchases</code> collection
                </p>
              </div>

              {monthlyEnrollments.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartMetric('revenue')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      chartMetric === 'revenue'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('enrollments')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      chartMetric === 'enrollments'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Enrollments
                  </button>
                </div>
              )}
            </div>

            {monthlyEnrollments.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <IndianRupee size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Transaction Data in Firestore Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  When student purchase transactions are logged in the <code className="font-mono text-slate-600">purchases</code> Firestore collection, monthly revenue charts will reflect here automatically.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={monthlyEnrollments}
                  margin={{ top: 10, right: 10, bottom: 0, left: chartMetric === 'revenue' ? 25 : 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorEnr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => chartMetric === 'revenue' ? `₹${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    formatter={(val) => [
                      chartMetric === 'revenue' ? `₹${val.toLocaleString()}` : val,
                      chartMetric === 'revenue' ? 'Monthly Revenue' : 'Students Enrolled'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                    }}
                    itemStyle={{ color: '#818cf8', fontWeight: 600 }}
                    labelStyle={{ color: '#cbd5e1', marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={chartMetric === 'revenue' ? '#4f46e5' : '#10b981'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={chartMetric === 'revenue' ? 'url(#colorRev)' : 'url(#colorEnr)'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Real-time Sync Active</span>
            </span>
            <button
              onClick={() => navigate('/analytics')}
              className="text-accent-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Analytics</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </Card>

        {/* Course Catalog Breakdown */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Course Inventory</h3>
                <p className="text-xs text-slate-400">Reflecting Firestore courses</p>
              </div>
              <Badge variant="indigo" size="xs">
                {stats.totalCourses} Total
              </Badge>
            </div>

            <div className="relative h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {courseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900">{stats.totalCourses}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Courses</span>
              </div>
            </div>

            {/* Legend breakdown */}
            <div className="space-y-2 mt-2">
              {courseBreakdown.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Button
              variant="outline"
              size="xs"
              className="w-full"
              onClick={() => navigate('/courses')}
            >
              Manage Course Inventory
            </Button>
          </div>
        </Card>
      </div>

      {/* Row 3: Upcoming Live Stream Schedule & Recent Courses Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Live Classes Agenda */}
        <Card className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Live & Scheduled Classes</h3>
              <p className="text-xs text-slate-400">From Firestore liveClasses</p>
            </div>
            {upcomingClassesList.some(s => s.status === 'live') && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </div>

          {upcomingClassesList.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Radio size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Live Classes in Database</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Schedule a live class to start broadcasting.</p>
              <Button
                variant="primary"
                size="xs"
                className="mt-3"
                onClick={() => navigate('/live-classes?action=new')}
              >
                Schedule Class
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingClassesList.slice(0, 3).map(session => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all bg-slate-50/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant={session.status === 'live' ? 'red' : 'blue'}
                      size="xs"
                      dot={session.status === 'live'}
                    >
                      {session.status === 'live' ? 'LIVE NOW' : 'SCHEDULED'}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500">{session.platform || 'Online'}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{session.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Faculty: {session.instructor || 'Staff'}</p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-400 font-medium">
                      {session.attendees || 0} enrolled
                    </span>
                    <button
                      onClick={() => navigate('/live-classes')}
                      className="inline-flex items-center gap-1 font-semibold text-accent-600 hover:text-accent-700"
                    >
                      <span>Manage</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate('/live-classes')}
          >
            View Live Classes Manager
          </Button>
        </Card>

        {/* Recent Courses Roster */}
        <Card className="col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Courses in Database</h3>
              <p className="text-xs text-slate-400">Directly fetched from Firestore courses</p>
            </div>
            <Button
              size="xs"
              variant="secondary"
              onClick={() => navigate('/courses')}
            >
              All Courses
            </Button>
          </div>

          {recentCourses.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BookOpen size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Courses Found in Firestore Database</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Your database courses collection is currently empty. Click below to add your first course to Firebase.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                className="mt-4"
                onClick={() => navigate('/courses?action=new')}
              >
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Faculty</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Students</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentCourses.map(course => (
                    <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {course.coverUrl ? (
                            <img
                              src={course.coverUrl}
                              alt={course.title}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                              <BookOpen size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[200px]">
                              {course.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{course.category || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                        {course.instructor || 'Staff'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={course.type === 'premium' ? 'purple' : 'green'}
                          size="xs"
                        >
                          {course.type === 'premium' ? `₹${course.price || 0}` : 'Free'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {(course.enrollments || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate('/courses')}
                          className="p-1 rounded-md text-slate-400 hover:text-accent-600 hover:bg-slate-100 transition"
                          title="Open in courses"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: Cloud Infrastructure Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-50/70 border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Firestore Database Engine</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">Connected • Real-time Active</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Reflecting live collections: <span className="font-mono text-slate-600">courses, liveClasses, users, studyMaterials, notifications, feedback</span>
          </p>
        </Card>

        <Card className="p-4 bg-slate-50/70 border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <HardDrive size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Cloud Media &amp; File Storage</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">Cloudinary ({CLOUDINARY_CLOUD_NAME})</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Images &amp; PDFs on Cloudinary • Videos on Firebase Storage
          </p>
        </Card>
      </div>
    </div>
  )
}
