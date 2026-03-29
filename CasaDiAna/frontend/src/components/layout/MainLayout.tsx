import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/authStore'

export function MainLayout() {
  const estaAutenticado = useAuthStore(s => s.estaAutenticado())
  const [sidebarAberta, setSidebarAberta] = useState(false)

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      {sidebarAberta && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarAberta(false)} />}
      <Sidebar aberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} />
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden bg-stone-900 px-4 py-3 flex items-center sticky top-0 z-10">
          <button onClick={() => setSidebarAberta(true)} className="text-white text-xl leading-none">☰</button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
