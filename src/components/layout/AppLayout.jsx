// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar  from './Sidebar'
import Topbar   from './Topbar'
import { SidebarProvider, useSidebar } from '../../context/SidebarContext'

function Layout() {
  const { mobileOpen, setMobileOpen } = useSidebar()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
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
