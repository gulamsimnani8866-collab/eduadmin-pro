// src/pages/UsersPage.jsx — High-Performance Student & Faculty Directory
import { useState, useMemo } from 'react'
import {
  Search, UserCheck, Crown, Mail, Phone, BookOpen, Download,
  Filter, UserX, Shield, MoreVertical, ArrowUpDown, Check, Plus
} from 'lucide-react'
import { format } from 'date-fns'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { useUsers, useCourses } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, Toggle,
  Input, Select, TableSkeleton, EmptyState, Tabs
} from '../components/ui/index'

export default function UsersPage() {
  const { docs: users, loading, add, update } = useUsers()
  const { docs: courses } = useCourses()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedUser, setSelectedUser] = useState(null)

  // Add User Drawer state
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newTier, setNewTier] = useState('free') // 'free' | 'premium'
  const [newRole, setNewRole] = useState('student')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [savingUser, setSavingUser] = useState(false)

  // Aggregate stats
  const totalUsers = users.length
  const activeCount = users.filter(u => !u.disabled).length
  const premiumCount = users.filter(u => u.premium).length
  const disabledCount = users.filter(u => u.disabled).length

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (statusFilter === 'Active' && u.disabled) return false
      if (statusFilter === 'Premium' && !u.premium) return false
      if (statusFilter === 'Disabled' && !u.disabled) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const nameMatch = u.name?.toLowerCase().includes(q)
        const emailMatch = u.email?.toLowerCase().includes(q)
        const phoneMatch = u.phone?.toLowerCase().includes(q)
        const courseMatch = u.enrolledCourses?.some(c => c.toLowerCase().includes(q))
        if (!nameMatch && !emailMatch && !phoneMatch && !courseMatch) return false
      }

      return true
    })
  }, [users, statusFilter, search])

  async function handleToggleStatus(user) {
    const newDisabled = !user.disabled
    await update(user.id, { disabled: newDisabled })
    toast.success(newDisabled ? 'User account suspended' : 'User account reactivated')
  }

  function handleExportCSV() {
    if (users.length === 0) {
      toast.error('No users to export')
      return
    }

    const csvData = users.map(u => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Phone: u.phone || 'N/A',
      Tier: u.premium ? 'Premium Paid' : 'Free Tier',
      Status: u.disabled ? 'Disabled' : 'Active',
      EnrolledCourses: (u.enrolledCourses || []).join('; '),
      JoinedDate: u.createdAt || 'N/A',
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `students_roster_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Students directory exported to CSV!')
  }

  async function handleCreateUser(addAnother = false) {
    if (!newName.trim()) return toast.error('Student name is required')
    if (!newEmail.trim()) return toast.error('Email address is required')
    setSavingUser(true)
    try {
      const enrolledCourses = []
      if (selectedCourseId) {
        const found = courses.find(c => c.id === selectedCourseId)
        if (found) enrolledCourses.push(found.title)
      }

      await add({
        name: newName,
        email: newEmail,
        phone: newPhone || '',
        premium: newTier === 'premium',
        role: newRole,
        disabled: false,
        enrolledCourses,
        createdAt: new Date().toISOString(),
      })

      if (addAnother) {
        toast.success('Student enrolled! Ready for next.')
        setNewName('')
        setNewEmail('')
        setNewPhone('')
      } else {
        toast.success('Student enrolled successfully!')
        setCreateDrawerOpen(false)
      }
    } finally {
      setSavingUser(false)
    }
  }

  const tabsConfig = [
    { id: 'All',      label: 'All Students', count: totalUsers },
    { id: 'Active',   label: 'Active',       count: activeCount },
    { id: 'Premium',  label: 'Premium',      count: premiumCount },
    { id: 'Disabled', label: 'Suspended',    count: disabledCount },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Students & Users"
        description="Search institutional roster, audit course enrollments, and toggle access permissions"
        count={users.length}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setNewName('')
                setNewEmail('')
                setNewPhone('')
                setNewTier('free')
                setNewRole('student')
                setSelectedCourseId('')
                setCreateDrawerOpen(true)
              }}
            >
              Enroll Student
            </Button>
          </div>
        }
      />

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Enrolled Students</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalUsers}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <BookOpen size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Accounts</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{activeCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <UserCheck size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Premium Subscribers</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{premiumCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60">
            <Crown size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Suspended</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{disabledCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
            <UserX size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            tabs={tabsConfig}
            activeTab={statusFilter}
            onChange={setStatusFilter}
          />

          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, email, phone…"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredUsers.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={UserCheck}
            title="No matching students found"
            description="Adjust your search criteria or filter tabs."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Membership</th>
                  <th className="py-3 px-4">Enrolled Courses</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100 flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() ?? 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {user.phone || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {user.premium ? (
                        <Badge variant="purple" size="xs" className="font-bold">
                          ★ Premium
                        </Badge>
                      ) : (
                        <Badge variant="gray" size="xs">
                          Free
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(user.enrolledCourses || []).slice(0, 2).map((course, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium truncate max-w-[140px]"
                          >
                            {course}
                          </span>
                        ))}
                        {(user.enrolledCourses || []).length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{(user.enrolledCourses || []).length - 2} more
                          </span>
                        )}
                        {(!user.enrolledCourses || user.enrolledCourses.length === 0) && (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <Badge
                        variant={user.disabled ? 'red' : 'green'}
                        dot
                        size="xs"
                        className="font-bold"
                      >
                        {user.disabled ? 'Suspended' : 'Active'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                            user.disabled
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {user.disabled ? 'Reactivate' : 'Suspend'}
                        </button>

                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-accent-600 hover:bg-slate-100 transition"
                          title="View Profile Details"
                        >
                          <BookOpen size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* User Details SlideOver Drawer */}
      <SlideOver
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Student Profile Dossier"
        subtitle="Institutional enrollment record & permission settings"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-accent-100">
                {selectedUser.name?.[0]?.toUpperCase() ?? 'S'}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{selectedUser.name}</h3>
                <p className="text-xs text-slate-500 truncate">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={selectedUser.premium ? 'purple' : 'gray'} size="xs">
                    {selectedUser.premium ? 'Premium Tier' : 'Standard Tier'}
                  </Badge>
                  <Badge variant={selectedUser.disabled ? 'red' : 'green'} dot size="xs">
                    {selectedUser.disabled ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3 text-xs">
                <Mail size={15} className="text-slate-400" />
                <span className="text-slate-500 w-28">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedUser.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Phone size={15} className="text-slate-400" />
                <span className="text-slate-500 w-28">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedUser.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Shield size={15} className="text-slate-400" />
                <span className="text-slate-500 w-28">Role Type</span>
                <span className="font-semibold text-slate-800 uppercase text-[11px]">{selectedUser.role || 'Student'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <BookOpen size={15} className="text-slate-400" />
                <span className="text-slate-500 w-28">Enrolled Courses</span>
                <span className="font-semibold text-slate-800">{selectedUser.enrolledCourses?.length || 0} active</span>
              </div>
            </div>

            {/* Account Status Switch */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <Toggle
                checked={!selectedUser.disabled}
                onChange={() => handleToggleStatus(selectedUser)}
                label="Active Account Status"
                description="Disabling will immediately revoke student login and access to live streaming."
              />
            </div>

            {/* Enrolled Courses list */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Enrolled Curricula ({selectedUser.enrolledCourses?.length || 0})
              </h4>
              <div className="space-y-2">
                {(selectedUser.enrolledCourses || []).map((courseName, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800 truncate mr-2">{courseName}</span>
                    <Badge variant="blue" size="xs">Enrolled</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* SlideOver Drawer: Enroll New Student / User */}
      <SlideOver
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Enroll New Student / User"
        subtitle="Register user profile directly into Firebase with course enrollments and subscription tier."
        width="sm:max-w-xl"
      >
        <div
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleCreateUser(false)
            }
          }}
          className="space-y-6"
        >
          {/* Section 1: Personal Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Student Profile & Contact
              </h3>
            </div>

            <Input
              label="Full Legal Name *"
              placeholder="e.g. Rahul Sharma"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. rahul.sharma@gmail.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Access Tier & Role */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Subscription Tier & Role
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewTier('free')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  newTier === 'free'
                    ? 'border-accent-600 bg-accent-50/50 ring-2 ring-accent-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">Free Tier</span>
                  {newTier === 'free' && <Check size={14} className="text-accent-600" />}
                </div>
                <p className="text-[11px] text-slate-500">Access to free lectures and public study notes</p>
              </button>

              <button
                type="button"
                onClick={() => setNewTier('premium')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  newTier === 'premium'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-purple-900 flex items-center gap-1">
                    <Crown size={12} className="text-amber-500 fill-amber-500" /> Premium Pro
                  </span>
                  {newTier === 'premium' && <Check size={14} className="text-purple-600" />}
                </div>
                <p className="text-[11px] text-slate-500">Unlimited live stream & restricted premium materials</p>
              </button>
            </div>

            <Select
              label="Account Role Type"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              options={[
                { value: 'student', label: 'Enrolled Student' },
                { value: 'faculty', label: 'Faculty / Instructor' },
                { value: 'staff',   label: 'Institutional Staff' },
              ]}
            />
          </div>

          {/* Section 3: Course Enrollment */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Initial Course Enrollment
              </h3>
            </div>

            <Select
              label="Assign to Active Course (Optional)"
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              options={[
                { value: '', label: 'Select a course to enroll (or leave blank)' },
                ...courses.map(c => ({ value: c.id, label: `${c.title} (${c.type === 'premium' ? 'Paid' : 'Free'})` }))
              ]}
            />
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-white sticky bottom-0 -mb-6 -mx-6 px-6 py-4 shadow-lg">
            <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
                Ctrl + Enter
              </kbd>
              to enroll immediately
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                onClick={() => setCreateDrawerOpen(false)}
              >
                Cancel
              </Button>

              <Button
                variant="secondary"
                loading={savingUser}
                onClick={() => handleCreateUser(true)}
                className="text-accent-700 hover:text-accent-800 border-accent-200 hover:bg-accent-50"
              >
                Save & Enroll Another
              </Button>

              <Button
                variant="primary"
                loading={savingUser}
                onClick={() => handleCreateUser(false)}
              >
                Enroll Student
              </Button>
            </div>
          </div>
        </div>
      </SlideOver>
    </div>
  )
}
