import { NavLink, useNavigate } from 'react-router-dom'
import {
  BeakerIcon,
  TagIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disponivel: boolean
}

interface NavGroup {
  titulo: string
  itens: NavItem[]
}

const grupos: NavGroup[] = [
  {
    titulo: 'Cadastros',
    itens: [
      { label: 'Ingredientes', href: '/estoque/ingredientes', icon: BeakerIcon, disponivel: true },
      { label: 'Categorias', href: '/estoque/categorias', icon: TagIcon, disponivel: true },
      { label: 'Fornecedores', href: '/fornecedores', icon: TruckIcon, disponivel: true },
    ],
  },
  {
    titulo: 'Movimentações',
    itens: [
      { label: 'Entradas', href: '/entradas', icon: ArrowDownTrayIcon, disponivel: true },
      { label: 'Inventário', href: '/inventarios', icon: ClipboardDocumentCheckIcon, disponivel: true },
    ],
  },
  {
    titulo: 'Relatórios',
    itens: [
      { label: 'Estoque Atual', href: '/relatorios/estoque-atual', icon: ChartBarIcon, disponivel: true },
      { label: 'Movimentações', href: '/relatorios/movimentacoes', icon: ChartBarIcon, disponivel: true },
      { label: 'Entradas', href: '/relatorios/entradas', icon: ChartBarIcon, disponivel: true },
    ],
  },
]

export function Sidebar() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-64 min-h-screen bg-stone-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-700 flex items-center justify-center text-lg shrink-0">
            ☕
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Casa di Ana</p>
            <p className="text-stone-500 text-xs">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {grupos.map(grupo => (
          <div key={grupo.titulo}>
            <p className="px-3 mb-1 text-xs font-semibold text-stone-500 uppercase tracking-widest">
              {grupo.titulo}
            </p>
            <ul className="space-y-0.5">
              {grupo.itens.map(item => {
                const Icon = item.icon
                if (!item.disponivel) {
                  return (
                    <li key={item.href}>
                      <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-stone-600 text-sm cursor-not-allowed select-none">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-xs text-stone-700 font-medium">em breve</span>
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-amber-700 text-white'
                            : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé — usuário */}
      <div className="px-3 py-4 border-t border-stone-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <UserCircleIcon className="h-8 w-8 text-stone-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-stone-300 font-medium truncate">{usuario?.nome ?? '—'}</p>
            <p className="text-xs text-stone-500 truncate">{usuario?.papel ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
                     text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
