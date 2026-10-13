// src/pages/AnalyticsPage.jsx
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { PageHeader, Card, Badge } from '../components/ui/index'

const enrollmentData = [
  { month: 'Jan', enrollments: 42, revenue: 18900, users: 38 },
  { month: 'Feb', enrollments: 65, revenue: 29250, users: 54 },
  { month: 'Mar', enrollments: 58, revenue: 26100, users: 47 },
  { month: 'Apr', enrollments: 89, revenue: 40050, users: 72 },
  { month: 'May', enrollments: 112, revenue: 50400, users: 98 },
  { month: 'Jun', enrollments: 94, revenue: 42300, users: 81 },
  { month: 'Jul', enrollments: 130, revenue: 58500, users: 114 },
]

const topCourses = [
  { name: 'JEE Maths', enrollments: 340, revenue: 153000 },
  { name: 'Physics Pro', enrollments: 289, revenue: 130050 },
  { name: 'Chemistry Crash', enrollments: 201, revenue: 0 },
  { name: 'English Grammar', enrollments: 178, revenue: 80100 },
  { name: 'Biology NEET', enrollments: 156, revenue: 70200 },
]

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" />

      <div className="grid grid-cols-1 gap-6">
        {/* Enrollment + Revenue trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Enrollment & Revenue Trend</h2>
            <Badge variant="blue">Last 7 Months</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={enrollmentData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="cEnroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="cRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="enrollments" stroke="#2563eb" fill="url(#cEnroll)" name="Enrollments" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#cRevenue)" name="Revenue (₹)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Courses */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Top Courses by Enrollment</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCourses} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#2563eb" radius={[0, 4, 4, 0]} name="Enrollments" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* User Growth */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">User Growth</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={enrollmentData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </>
  )
}
