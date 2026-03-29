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
        <button className="md:hidden fixed top-4 left-4 z-10 bg-stone-900 text-white p-2 rounded-lg" onClick={() => setSidebarAberta(true)}>☰</button>
        <Outlet />
      </main>
    </div>
  )
}
