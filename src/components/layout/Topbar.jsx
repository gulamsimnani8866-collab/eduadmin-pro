// src/components/layout/Topbar.jsx — Enterprise Topbar with Real Firestore Sync
import { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Bell, Search, ChevronDown, User, Settings, LogOut, Menu,
  Plus, CheckCircle2, Shield, Radio, BookOpen, FileText,
  Sparkles, ExternalLink, Activity
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotifications } from '../../hooks/useFirestore'
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
  '/premium':          'Premium Hub',
  '/notifications':    'Notifications',
  '/feedback':         'Feedback',
  '/users':            'Users',
  '/analytics':        'Analytics',
  '/settings':         'Settings',
}

export default function Topbar({ onOpenCommandPalette }) {
  const { admin, logout } = useAuthStore()
  const { docs: notifications } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const { setMobileOpen } = useSidebar()

  const [ddOpen, setDdOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const currentLabel = ROUTE_LABELS[location.pathname] || 'EduAdmin Pro'

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 z-20 relative flex-shrink-0">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {currentLabel}
          </h1>
        </div>
      </div>

      {/* Middle: Command Palette Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-400 hover:text-slate-600 text-xs transition-all shadow-xs group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search size={15} className="text-slate-400 group-hover:text-accent-600 transition-colors" />
            <span className="truncate">Search students, courses, materials, or actions…</span>
          </div>
          <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500 font-semibold shadow-2xs font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick Create, System Status, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile search button */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Live sync status pill (desktop) */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Firestore Connected</span>
        </div>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCreateOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-sm shadow-accent-600/20 transition-all active:scale-[0.98]"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown size={13} className={cn('transition-transform duration-200', createOpen && 'rotate-180')} />
          </button>

          {createOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setCreateOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-1.5 modal-content-in">
                <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Actions
                </p>
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/courses?action=new')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition"
                >
                  <BookOpen size={15} className="text-accent-600" />
                  <span>New Course</span>
                </button>
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/live-classes?action=new')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition"
                >
                  <Radio size={15} className="text-rose-500" />
                  <span>Schedule Live Class</span>
                </button>
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/study-materials?action=new')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition"
                >
                  <FileText size={15} className="text-blue-500" />
                  <span>Upload Study Material</span>
                </button>
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/notifications?action=new')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition"
                >
                  <Bell size={15} className="text-amber-500" />
                  <span>Broadcast Notice</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications Flyout */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden modal-content-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Database Notices</h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-accent-100 text-accent-700 text-[10px] font-bold">
                      {notifications.length}
                    </span>
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-semibold text-accent-600 hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-slate-400">
                      No notifications in database yet.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div key={n.id} className="p-3.5 hover:bg-slate-50 transition cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.target || 'all'}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setDdOpen(o => !o)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {admin?.name?.[0]?.toUpperCase() || admin?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden lg:block text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[110px] leading-tight">
                {admin?.name || admin?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {admin?.role || 'Firebase Admin'}
              </p>
            </div>
            <ChevronDown size={13} className="text-slate-400 hidden lg:block" />
          </button>

          {ddOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDdOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-2 modal-content-in">
                <div className="p-3 bg-slate-50 rounded-xl mb-1.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{admin?.name || 'Administrator'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{admin?.email || 'Authenticated User'}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                      Firebase UID: {admin?.uid ? `${admin.uid.slice(0, 8)}…` : 'Active'}
                    </span>
                  </div>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setDdOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition"
                >
                  <User size={15} className="text-slate-400" />
                  <span>Admin Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDdOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition"
                >
                  <Settings size={15} className="text-slate-400" />
                  <span>System Settings</span>
                </Link>

                <div className="my-1.5 border-t border-slate-100" />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
