// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, Radio, PlayCircle, FileText,
  ListChecks, HelpCircle, Archive, Crown, Bell, MessageSquare,
  Users, BarChart2, Settings, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { cn } from '../ui/index'
import { useSidebar } from '../../context/SidebarContext'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',       to: '/dashboard' },
  { icon: BookOpen,        label: 'Courses',          to: '/courses' },
  { icon: Radio,           label: 'Live Classes',     to: '/live-classes' },
  { icon: PlayCircle,      label: 'Recorded',         to: '/recorded-classes' },
  { icon: FileText,        label: 'Study Materials',  to: '/study-materials' },
  { icon: ListChecks,      label: 'Syllabus',         to: '/syllabus' },
  { icon: HelpCircle,      label: 'IMP Questions',    to: '/imp-questions' },
  { icon: Archive,         label: 'Year Papers',      to: '/prev-year-papers' },
  { icon: Crown,           label: 'Premium',          to: '/premium' },
  { icon: Bell,            label: 'Notifications',    to: '/notifications' },
  { icon: MessageSquare,   label: 'Feedback',         to: '/feedback' },
  { icon: Users,           label: 'Users',            to: '/users' },
  { icon: BarChart2,       label: 'Analytics',        to: '/analytics' },
  { icon: Settings,        label: 'Settings',         to: '/settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { mobileOpen, setMobileOpen } = useSidebar()

  return (
    <aside
      className={cn(
        // Desktop: always visible, collapsible
        'flex-shrink-0 h-screen flex flex-col transition-all duration-300',
        'bg-brand-700 shadow-sidebar',
        // Mobile: fixed overlay, full-width sidebar (w-64), slide in/out
        'fixed inset-y-0 left-0 z-50 w-64',
        'lg:static lg:z-auto lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop collapsed state
        !collapsed ? 'lg:w-64' : 'lg:w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center flex-shrink-0">
          <BookOpen size={16} className="text-white" />
        </div>
        {(!collapsed || mobileOpen) && (
          <span className="font-bold text-white text-sm tracking-wide flex-1">
            EduAdmin Pro
          </span>
        )}
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto text-white/60 hover:text-white transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            title={(collapsed && !mobileOpen) ? label : undefined}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5',
                'text-sm font-medium transition-all group',
                isActive
                  ? 'bg-white/15 text-white border-l-2 border-accent-400 pl-[calc(0.75rem-2px)]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="hidden lg:flex items-center justify-center h-10 mx-3 mb-4 rounded-lg
                   text-white/50 hover:bg-white/10 hover:text-white transition"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
