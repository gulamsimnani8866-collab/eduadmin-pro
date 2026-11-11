// src/components/common/CommandPalette.jsx — Fast Keyboard-First Navigation
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, BookOpen, Radio, PlayCircle,
  FileText, ListChecks, HelpCircle, Archive, Crown, Bell,
  MessageSquare, Users, BarChart2, Settings, Plus,
  ArrowRight, ShieldCheck, Zap
} from 'lucide-react'

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const commands = [
    // Navigation
    { id: 'dash',   category: 'Navigation', title: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'course', category: 'Navigation', title: 'Manage Courses', icon: BookOpen, path: '/courses' },
    { id: 'live',   category: 'Navigation', title: 'Live Classes & Schedules', icon: Radio, path: '/live-classes' },
    { id: 'record', category: 'Navigation', title: 'Recorded Classes Library', icon: PlayCircle, path: '/recorded-classes' },
    { id: 'mat',    category: 'Navigation', title: 'Study Materials & PDFs', icon: FileText, path: '/study-materials' },
    { id: 'syll',   category: 'Navigation', title: 'Curriculum & Syllabus', icon: ListChecks, path: '/syllabus' },
    { id: 'imp',    category: 'Navigation', title: 'Question Bank & IMP Questions', icon: HelpCircle, path: '/imp-questions' },
    { id: 'pyp',    category: 'Navigation', title: 'Previous Year Papers', icon: Archive, path: '/prev-year-papers' },
    { id: 'prem',   category: 'Navigation', title: 'Premium Membership Plans', icon: Crown, path: '/premium' },
    { id: 'users',  category: 'Navigation', title: 'Students & Users Directory', icon: Users, path: '/users' },
    { id: 'stats',  category: 'Navigation', title: 'Analytics & Revenue Reports', icon: BarChart2, path: '/analytics' },
    { id: 'notif',  category: 'Navigation', title: 'Notifications & Broadcasts', icon: Bell, path: '/notifications' },
    { id: 'feed',   category: 'Navigation', title: 'Student Feedback & Reviews', icon: MessageSquare, path: '/feedback' },
    { id: 'sett',   category: 'Navigation', title: 'Academy & System Settings', icon: Settings, path: '/settings' },

    // Quick Actions
    { id: 'act-new-course', category: 'Quick Action', title: 'Create New Course', icon: Plus, path: '/courses?action=new', actionTag: 'Create' },
    { id: 'act-live',       category: 'Quick Action', title: 'Schedule Live Streaming Class', icon: Radio, path: '/live-classes?action=new', actionTag: 'Broadcast' },
    { id: 'act-notif',      category: 'Quick Action', title: 'Send Push Notification to Students', icon: Bell, path: '/notifications?action=new', actionTag: 'Send' },
    { id: 'act-mat',        category: 'Quick Action', title: 'Upload Study Material', icon: FileText, path: '/study-materials?action=new', actionTag: 'Upload' },
  ]

  const filtered = commands.filter(item => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else onClose(true) // will be controlled by parent
      }
      if (!open) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].path)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filtered, selectedIndex, navigate, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in"
        onClick={onClose}
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-content-in">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command or search sections… (e.g. 'Courses', 'Schedule', 'Users')"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching pages or actions found for "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon
              const isSelected = index === selectedIndex

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.path)
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? 'bg-accent-50 text-accent-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isSelected
                          ? 'bg-accent-600 text-white border-accent-600'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="truncate">
                      <span className="truncate">{item.title}</span>
                      <span className="text-[11px] text-slate-400 ml-2 font-normal">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                        {item.badge}
                      </span>
                    )}
                    {item.actionTag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        {item.actionTag}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight size={14} className="text-accent-600" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <Zap size={12} className="text-amber-500" />
            <span>EduAdmin Fast Navigation</span>
          </div>
        </div>
      </div>
    </div>
  )
}
