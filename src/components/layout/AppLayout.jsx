// src/components/layout/AppLayout.jsx — High-performance shell layout with Command Palette
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '../common/CommandPalette'
import { SidebarProvider, useSidebar } from '../../context/SidebarContext'

function Layout() {
  const { mobileOpen, setMobileOpen } = useSidebar()
  const [cmdOpen, setCmdOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50/70 overflow-hidden text-slate-900 font-sans">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar with command palette trigger */}
      <Sidebar onOpenCommandPalette={() => setCmdOpen(true)} />

      {/* Main content column */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onOpenCommandPalette={() => setCmdOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <Layout />
    </SidebarProvider>
  )
}
