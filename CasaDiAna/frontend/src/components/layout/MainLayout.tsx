import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/authStore'

export function MainLayout() {
  const estaAutenticado = useAuthStore(s => s.estaAutenticado())
  const [sidebarAberta, setSidebarAberta] = useState(false)

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-ada-bg, #F5F3EF)' }}>
      {/* Overlay mobile */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarAberta(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar aberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div
          className="md:hidden px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
          style={{ background: '#0D1117', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={() => setSidebarAberta(true)}
            className="p-1.5 rounded-lg transition-colors duration-150"
            style={{ color: '#7A8499' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7A8499'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            aria-label="Abrir menu"
          >
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>
          <span
            className="text-white text-sm font-semibold tracking-[-0.01em]"
            style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Casa di Ana
          </span>
        </div>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
