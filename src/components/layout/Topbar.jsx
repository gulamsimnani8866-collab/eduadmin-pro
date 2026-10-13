// src/components/layout/Topbar.jsx
import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Bell, Search, ChevronDown, User, Settings, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../ui/index'
import { useSidebar } from '../../context/SidebarContext'

const ROUTE_LABELS = {
  '/dashboard':        'Dashboard',
  '/courses':          'Courses',
  '/live-classes':     'Live Classes',
  '/recorded-classes': 'Recorded Classes',
  '/study-materials':  'Study Materials',
  '/syllabus':         'Syllabus',
  '/imp-questions':    'IMP Questions',
  '/prev-year-papers': 'Previous Year Papers',
  '/premium':          'Premium Courses',
  '/notifications':    'Notifications',
  '/feedback':         'Feedback',
  '/users':            'Users',
  '/analytics':        'Analytics',
  '/settings':         'Settings',
}

export default function Topbar() {
  const { admin, logout } = useAuthStore()
  const location = useLocation()
  const { setMobileOpen } = useSidebar()
  const [ddOpen, setDdOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  const label = ROUTE_LABELS[location.pathname] ?? 'EduAdmin Pro'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 z-10 relative flex-shrink-0">

      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-shrink-0">
        <p className="text-xs text-gray-400 font-medium hidden sm:block">Admin</p>
        <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-none">{label}</p>
      </div>

      {/* Global Search — hidden on mobile (collapsed to icon) */}
      <div className={cn(
        'flex-1 max-w-sm mx-auto relative',
        'hidden sm:block'
      )}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses, users, materials…"
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200
                     text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white transition"
        />
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setSearchOpen(o => !o)}
        className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        aria-label="Search"
      >
        {searchOpen ? <X size={18} /> : <Search size={18} />}
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-3 ml-auto">
        {/* Notification Bell */}
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
        </Link>

        {/* Admin Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDdOpen(o => !o)}
            className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {admin?.name?.[0]?.toUpperCase() ?? 'A'}
              </span>
            </div>
            {/* Name — hidden on mobile */}
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
              {admin?.name ?? 'Admin'}
            </span>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {ddOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDdOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-modal
                              border border-gray-100 z-20 overflow-hidden">
                <Link
                  to="/settings"
                  onClick={() => setDdOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={14} /> Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setDdOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={14} /> Settings
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-danger-500 hover:bg-red-50 w-full"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile search bar — expands below topbar */}
      {searchOpen && (
        <div className="sm:hidden absolute left-0 right-0 top-full bg-white border-b border-gray-100 px-4 py-3 z-10">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200
                         text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:bg-white transition"
            />
          </div>
        </div>
      )}
    </header>
  )
}
