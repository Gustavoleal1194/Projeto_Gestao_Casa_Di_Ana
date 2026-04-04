import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { useAuthStore } from '@/store/authStore'

export function MainLayout() {
  const estaAutenticado = useAuthStore(s => s.estaAutenticado())
  const [sidebarAberta, setSidebarAberta] = useState(false)

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ada-bg)' }}>
      {/* Sidebar — sempre fixed, ocupa toda a altura */}
      <Sidebar aberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} />

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarAberta(false)}
          aria-hidden="true"
        />
      )}

      {/* Coluna direita: header + conteúdo */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TopHeader onMobileMenuOpen={() => setSidebarAberta(true)} />

        <main
          className="flex-1 overflow-y-auto min-w-0"
          style={{ paddingTop: 'var(--header-h)' }}
          id="main-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
