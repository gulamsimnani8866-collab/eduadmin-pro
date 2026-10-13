// src/pages/UsersPage.jsx
import { useState } from 'react'
import { Search, UserCheck, Crown, Mail, Phone, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { useUsers } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, Toggle,
  TableSkeleton, EmptyState
} from '../components/ui/index'

// ─── User Drawer ────────────────────────────────────────────────────────────
function UserDrawer({ user, onClose, onToggleStatus }) {
  return (
    <SlideOver open={!!user} onClose={onClose} title="User Profile">
      {user && (
        <div className="space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.premium && <Badge variant="purple" className="mt-1">Premium</Badge>}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[
              { icon: Mail,     label: 'Email',           value: user.email },
              { icon: Phone,    label: 'Phone',           value: user.phone ?? '—' },
              { icon: BookOpen, label: 'Enrolled Courses', value: user.enrolledCourses?.length ?? 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-36">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Account Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Account Status</p>
            <Toggle
              checked={!user.disabled}
              onChange={v => onToggleStatus(user, !v)}
              label={user.disabled ? 'Account Disabled' : 'Account Active'}
            />
          </div>

          {/* Enrolled Courses */}
          {user.enrolledCourses?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Enrolled Courses</p>
              <div className="space-y-2">
                {user.enrolledCourses.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{c}</span>
                    <button className="text-xs text-red-500 hover:text-red-700">Unenroll</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SlideOver>
  )
}

// ─── Mobile Card ────────────────────────────────────────────────────────────
function UserMobileCard({ user, onClick }) {
  return (
    <div
      className="flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
        {user.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 text-sm truncate">{user.name ?? '—'}</p>
          {user.premium && <Crown size={12} className="text-yellow-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>
      <span className="text-xs text-blue-600 font-medium flex-shrink-0">View</span>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { docs: users, loading, update } = useUsers({ orderByField: 'createdAt' })
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [selectedUser, setSelectedUser] = useState(null)

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'All'     ? true :
      filter === 'Premium' ? u.premium :
      !u.premium
    return matchSearch && matchFilter
  })

  async function handleToggleStatus(user, disable) {
    await update(user.id, { disabled: disable })
    setSelectedUser(u => ({ ...u, disabled: disable }))
  }

  return (
    <>
      <PageHeader title="Users" count={users.length} />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start sm:self-auto">
          {['All', 'Premium', 'Free'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table — sm+ */}
      <Card className="overflow-hidden p-0 hidden sm:block">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={8} cols={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UserCheck} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { label: 'Avatar',  cls: '' },
                    { label: 'Name',    cls: '' },
                    { label: 'Email',   cls: 'hidden md:table-cell' },
                    { label: 'Phone',   cls: 'hidden lg:table-cell' },
                    { label: 'Courses', cls: 'hidden lg:table-cell' },
                    { label: 'Premium', cls: '' },
                    { label: 'Joined',  cls: 'hidden md:table-cell' },
                    { label: 'Actions', cls: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${h.cls}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {u.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{u.name ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">{u.phone ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">{u.enrolledCourses?.length ?? 0}</td>
                    <td className="py-3 px-4">
                      {u.premium ? <Crown size={15} className="text-yellow-500" /> : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400 hidden md:table-cell">
                      {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Mobile card list — xs only */}
      <Card className="overflow-hidden p-0 sm:hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} cols={2} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UserCheck} title="No users found" />
        ) : (
          <div>
            {filtered.map(u => (
              <UserMobileCard key={u.id} user={u} onClick={() => setSelectedUser(u)} />
            ))}
          </div>
        )}
      </Card>

      <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} onToggleStatus={handleToggleStatus} />
    </>
  )
}
