import { NavLink, useNavigate } from 'react-router-dom'
import {
  BeakerIcon,
  TagIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  CubeIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon,
  FireIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  SquaresPlusIcon,
  ChartBarIcon,
  QrCodeIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'

// ─── Logo mark SVG ─────────────────────────────────────────────────────────
function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Nav structure ──────────────────────────────────────────────────────────
interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  iconColor?: string
}

interface NavGroup {
  titulo: string
  itens: NavItem[]
}

const grupos: NavGroup[] = [
  {
    titulo: 'Cadastros',
    itens: [
      { label: 'Ingredientes',  href: '/estoque/ingredientes', icon: BeakerIcon,  iconColor: '#60A5FA' },
      { label: 'Categorias',    href: '/estoque/categorias',   icon: TagIcon,     iconColor: '#60A5FA' },
      { label: 'Fornecedores',  href: '/fornecedores',         icon: TruckIcon,   iconColor: '#60A5FA' },
    ],
  },
  {
    titulo: 'Produção',
    itens: [
      { label: 'Categorias de Produto', href: '/producao/categorias-produto', icon: SquaresPlusIcon,       iconColor: '#D4960C' },
      { label: 'Produtos',              href: '/producao/produtos',            icon: CubeIcon,              iconColor: '#D4960C' },
      { label: 'Produção Diária',       href: '/producao/diaria',              icon: FireIcon,              iconColor: '#D4960C' },
      { label: 'Vendas Diárias',        href: '/producao/vendas',              icon: BanknotesIcon,         iconColor: '#D4960C' },
      { label: 'Perdas',                href: '/producao/perdas',              icon: ExclamationCircleIcon, iconColor: '#F87171' },
      { label: 'Etiquetas',             href: '/etiquetas',                    icon: QrCodeIcon,            iconColor: '#D4960C' },
    ],
  },
  {
    titulo: 'Movimentações',
    itens: [
      { label: 'Entradas',            href: '/entradas',         icon: ArrowDownTrayIcon,          iconColor: '#34D399' },
      { label: 'Inventário',          href: '/inventarios',      icon: ClipboardDocumentCheckIcon, iconColor: '#34D399' },
      { label: 'Correção de Estoque', href: '/estoque/correcao', icon: AdjustmentsHorizontalIcon,  iconColor: '#34D399' },
    ],
  },
  {
    titulo: 'Relatórios',
    itens: [
      { label: 'Estoque Atual',        href: '/relatorios/estoque-atual',    icon: ChartBarIcon,       iconColor: '#A78BFA' },
      { label: 'Movimentações',        href: '/relatorios/movimentacoes',    icon: ChartBarSquareIcon, iconColor: '#A78BFA' },
      { label: 'Entradas',             href: '/relatorios/entradas',         icon: ArrowDownTrayIcon,  iconColor: '#A78BFA' },
      { label: 'Produção/Vendas',      href: '/relatorios/producao-vendas',  icon: ChartBarIcon,       iconColor: '#A78BFA' },
      { label: 'Insumos por Produção', href: '/relatorios/insumos-producao', icon: ChartBarSquareIcon, iconColor: '#A78BFA' },
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────
export function Sidebar({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { temPapel } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = temPapel('Admin')

  return (
    <aside
      style={{ background: 'var(--sb-bg)', top: 0, borderRight: '1px solid var(--chrome-divider)' }}
      className={[
        'w-64 flex flex-col shrink-0',
        'fixed bottom-0 left-0 z-30',
        'transition-transform duration-300 ease-out',
        aberta ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-5 cursor-pointer group"
        style={{ borderBottom: '1px solid var(--chrome-divider)' }}
        onClick={() => { navigate('/'); onFechar() }}
        title="Início"
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { navigate('/'); onFechar() } }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity duration-200 group-hover:opacity-90"
            style={{ background: 'var(--sb-accent)' }}
          >
            <CoffeeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p
              className="text-white text-[13.5px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Casa di Ana
            </p>
            <p className="text-[11px] mt-0.5 leading-none" style={{ color: 'var(--sb-text)' }}>
              Sistema de Gestão
            </p>
          </div>
        </div>
      </div>

      {/* ── Navegação ────────────────────────────────────────────────── */}
      <nav
        className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-5"
        aria-label="Navegação principal"
      >
        {/* Dashboard home item — antes dos grupos */}
        <div>
          <ul className="space-y-0.5" role="list">
            <li>
              <NavLink
                to="/"
                end
                onClick={onFechar}
                className={({ isActive }) => [
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium',
                  'transition-colors duration-150',
                  isActive ? 'text-white' : 'hover:text-white',
                ].join(' ')}
                style={({ isActive }) => isActive
                  ? {
                      color: 'var(--sb-text-active)',
                      background: 'var(--sb-active-bg)',
                      borderLeft: '2px solid var(--sb-active-bd)',
                      paddingLeft: '10px',
                    }
                  : {
                      color: 'var(--sb-text)',
                      borderLeft: '2px solid transparent',
                    }
                }
              >
                {({ isActive }) => (
                  <>
                    <Squares2X2Icon
                      className="h-4 w-4 shrink-0 transition-colors duration-150"
                      aria-hidden="true"
                      style={{
                        color: isActive ? 'var(--sb-accent)' : 'var(--sb-text)',
                        opacity: isActive ? 1 : 0.75,
                      }}
                    />
                    <span className="flex-1 leading-none">Dashboard</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>

        {grupos.map(grupo => (
          <div key={grupo.titulo}>
            <p
              className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--sb-group)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              {grupo.titulo}
            </p>
            <ul className="space-y-0.5" role="list">
              {grupo.itens.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      onClick={onFechar}
                      className={({ isActive }) => [
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium',
                        'transition-colors duration-150',
                        isActive ? 'text-white' : 'hover:text-white',
                      ].join(' ')}
                      style={({ isActive }) => isActive
                        ? {
                            color: 'var(--sb-text-active)',
                            background: 'var(--sb-active-bg)',
                            borderLeft: '2px solid var(--sb-active-bd)',
                            paddingLeft: '10px',
                          }
                        : {
                            color: 'var(--sb-text)',
                            borderLeft: '2px solid transparent',
                          }
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className="h-4 w-4 shrink-0 transition-colors duration-150"
                            aria-hidden="true"
                            style={{
                              color: isActive
                                ? 'var(--sb-accent)'
                                : item.iconColor ?? 'var(--sb-text)',
                              opacity: isActive ? 1 : 0.75,
                            }}
                          />
                          <span className="flex-1 leading-none">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Configurações — Admin only ─────────────────────────────── */}
      {isAdmin && (
        <div
          className="px-3 py-3"
          style={{ borderTop: '1px solid var(--chrome-divider)' }}
        >
          <p
            className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--sb-group)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Configurações
          </p>
          <ul className="space-y-0.5" role="list">
            <li>
              <NavLink
                to="/usuarios"
                onClick={onFechar}
                className={({ isActive }) => [
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium',
                  'transition-colors duration-150',
                  isActive ? 'text-white' : 'hover:text-white',
                ].join(' ')}
                style={({ isActive }) => isActive
                  ? {
                      color: 'var(--sb-text-active)',
                      background: 'var(--sb-active-bg)',
                      borderLeft: '2px solid var(--sb-active-bd)',
                      paddingLeft: '10px',
                    }
                  : {
                      color: 'var(--sb-text)',
                      borderLeft: '2px solid transparent',
                    }
                }
              >
                {({ isActive }) => (
                  <>
                    <UsersIcon
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                      style={{ color: isActive ? 'var(--sb-accent)' : 'var(--sb-text)' }}
                    />
                    <span className="flex-1 leading-none">Usuários</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      )}
    </aside>
  )
}
