// src/components/layout/Sidebar.jsx — High-efficiency, categorized enterprise navigation
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, Radio, PlayCircle, FileText,
  ListChecks, HelpCircle, Archive, Crown, Bell, MessageSquare,
  Users, BarChart2, Settings, ChevronLeft, ChevronRight, X,
  GraduationCap, Sparkles, Command
} from 'lucide-react'
import { cn } from '../ui/index'
import { useSidebar } from '../../context/SidebarContext'
import { useAuthStore } from '../../store/authStore'

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',   to: '/dashboard' },
      { icon: BarChart2,       label: 'Analytics',   to: '/analytics' },
    ],
  },
  {
    title: 'ACADEMIC MANAGEMENT',
    items: [
      { icon: BookOpen,        label: 'Courses',          to: '/courses' },
      { icon: Radio,           label: 'Live Classes',     to: '/live-classes' },
      { icon: PlayCircle,      label: 'Recorded Library', to: '/recorded-classes' },
      { icon: FileText,        label: 'Study Materials',  to: '/study-materials' },
      { icon: ListChecks,      label: 'Syllabus',         to: '/syllabus' },
      { icon: HelpCircle,      label: 'IMP Questions',    to: '/imp-questions' },
      { icon: Archive,         label: 'Previous Papers',  to: '/prev-year-papers' },
      { icon: Crown,           label: 'Premium Hub',      to: '/premium' },
    ],
  },
  {
    title: 'COMMUNITY & NOTICES',
    items: [
      { icon: Bell,            label: 'Announcements',    to: '/notifications' },
      { icon: MessageSquare,   label: 'Student Feedback', to: '/feedback' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { icon: Users,           label: 'Students & Users', to: '/users' },
      { icon: Settings,        label: 'Settings',         to: '/settings' },
    ],
  },
]

export default function Sidebar({ onOpenCommandPalette }) {
  const [collapsed, setCollapsed] = useState(false)
  const { mobileOpen, setMobileOpen } = useSidebar()
  const { admin } = useAuthStore()

  return (
    <aside
      className={cn(
        // Modern dark slate enterprise background
        'flex-shrink-0 h-screen flex flex-col transition-all duration-300 select-none border-r border-slate-800/80',
        'bg-[#090f1d] text-slate-300',
        // Mobile behavior
        'fixed inset-y-0 left-0 z-50 w-64',
        'lg:static lg:z-auto lg:translate-x-0',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        // Desktop collapse toggle
        !collapsed ? 'lg:w-64' : 'lg:w-[72px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/70 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-accent-600/30 flex-shrink-0">
          <GraduationCap size={20} />
        </div>

        {(!collapsed || mobileOpen) && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm tracking-tight truncate">
                EduAdmin
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-accent-500/20 text-accent-400 border border-accent-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">JSC Academic Systems</p>
          </div>
        )}

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Quick Command Bar Trigger in Sidebar */}
      {(!collapsed || mobileOpen) && (
        <div className="px-3 pt-3 flex-shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800/60 text-xs transition-all group"
          >
            <div className="flex items-center gap-2">
              <Command size={14} className="text-accent-400 group-hover:scale-110 transition-transform" />
              <span>Quick Navigation…</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto scrollbar-dark space-y-5">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {(!collapsed || mobileOpen) && (
              <p className="px-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {group.title}
              </p>
            )}

            {group.items.map(({ icon: Icon, label, to, badge, badgeColor }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed && !mobileOpen ? label : undefined}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative',
                    isActive
                      ? 'bg-accent-600 text-white shadow-sm shadow-accent-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )
                }
              >
                <Icon
                  size={17}
                  className="flex-shrink-0 group-hover:scale-105 transition-transform"
                />

                {(!collapsed || mobileOpen) && (
                  <>
                    <span className="truncate flex-1">{label}</span>
                    {badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.2 rounded-full border',
                          badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom User & Collapse */}
      <div className="p-3 border-t border-slate-800/80 flex-shrink-0 bg-[#070b16]">
        {(!collapsed || mobileOpen) ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-800">
                  {admin?.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {admin?.name ?? 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {admin?.role === 'superadmin' ? 'Super Admin' : 'Academic Admin'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white text-xs font-bold">
                {admin?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
            </div>
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
