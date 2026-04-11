import { useEffect, useRef, useState as useLocalState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
  FireIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon as ExclCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/hooks/useTheme'
import { useNotificacoesCount } from '@/hooks/useNotificacoesCount'
import { notificacoesService, type NotificacaoEstoqueDto } from '@/lib/notificacoesService'

interface Props {
  onMobileMenuOpen: () => void
}

// ─── Botão de ícone padronizado ─────────────────────────────────────────────
function IconBtn({
  onClick,
  ariaLabel,
  title,
  danger,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  title?: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className="p-2 rounded-lg transition-colors duration-150 outline-none
                 focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
      style={{ color: 'var(--topbar-text)' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.color      = danger ? '#fda4af' : 'var(--topbar-heading)'
        el.style.background = danger ? 'rgba(244,63,94,0.12)' : 'var(--topbar-hover)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.color      = 'var(--topbar-text)'
        el.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

// ─── Divisor vertical ───────────────────────────────────────────────────────
function Divider() {
  return (
    <div
      className="h-5 w-px mx-1"
      style={{ background: 'var(--topbar-divider)' }}
      aria-hidden="true"
    />
  )
}

// ─── Dropdown de notificações ───────────────────────────────────────────────
const TIPO_CFG = {
  Zerado:  { Icon: FireIcon,               cor: 'var(--ada-error-text)',   bg: 'var(--ada-error-bg)',     border: 'var(--ada-error-border)'   },
  Critico: { Icon: ExclCircleIcon,         cor: 'var(--ada-error-text)',   bg: 'var(--ada-error-bg)',     border: 'var(--ada-error-border)'   },
  Atencao: { Icon: ExclamationTriangleIcon, cor: 'var(--ada-warning-text)', bg: 'var(--ada-warning-badge)', border: 'var(--ada-warning-border)' },
} as const

function NotificationDropdown({ count, onCountUpdate }: { count: number; onCountUpdate: () => void }) {
  const navigate = useNavigate()
  const [aberto, setAberto] = useLocalState(false)
  const [notifs, setNotifs] = useLocalState<NotificacaoEstoqueDto[]>([])
  const [carregando, setCarregando] = useLocalState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto])

  // Fechar com Escape
  useEffect(() => {
    if (!aberto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [aberto])

  const abrirDropdown = async () => {
    const novo = !aberto
    setAberto(novo)
    if (novo) {
      setCarregando(true)
      try {
        const data = await notificacoesService.listar(false)
        setNotifs(data.slice(0, 8))
      } finally {
        setCarregando(false)
      }
    }
  }

  const marcarLida = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await notificacoesService.marcarLida(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    onCountUpdate()
  }

  const naoLidasCount = notifs.filter(n => !n.lida).length

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={abrirDropdown}
        aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ''}`}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className="p-2 rounded-lg transition-colors duration-150 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
        style={{ color: 'var(--topbar-text)' }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = 'var(--topbar-heading)'
          el.style.background = 'var(--topbar-hover)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = 'var(--topbar-text)'
          el.style.background = 'transparent'
        }}
      >
        <div className="relative">
          <BellIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          {count > 0 && (
            <span
              className="absolute -top-2 -right-2 min-w-[16px] h-4 rounded-full
                         text-[9px] font-bold text-white flex items-center
                         justify-center px-1 leading-none"
              style={{ background: 'var(--ada-error-text)' }}
              aria-hidden="true"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
      </button>

      {aberto && (
        <div
          className="notification-panel"
          role="dialog"
          aria-label="Notificações de estoque"
        >
          {/* Header do panel */}
          <div className="notification-panel-header">
            <span
              className="text-[13px] font-semibold"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Notificações
              {naoLidasCount > 0 && (
                <span
                  className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}
                >
                  {naoLidasCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setAberto(false); navigate('/notificacoes') }}
                className="text-[11px] px-2 py-1 rounded transition-colors"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
              >
                Ver todas
              </button>
              <button
                onClick={() => setAberto(false)}
                className="p-1 rounded transition-colors"
                aria-label="Fechar"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Lista */}
          {carregando ? (
            <div className="py-8 flex flex-col items-center gap-2">
              <div
                className="h-6 w-6 animate-spin rounded-full"
                style={{ border: '2px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
                role="status"
              />
              <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>Carregando…</p>
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <BellIcon className="h-8 w-8" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
              <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>Nenhuma notificação</p>
            </div>
          ) : (
            <ul>
              {notifs.map(n => {
                const cfg = TIPO_CFG[n.tipo]
                const { Icon } = cfg
                return (
                  <li
                    key={n.id}
                    className={`notification-panel-item${!n.lida ? ' unread' : ''}`}
                    onClick={() => { setAberto(false); navigate('/notificacoes') }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: cfg.cor }} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold leading-snug truncate"
                         style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                        {n.titulo}
                      </p>
                      <p className="text-[11.5px] mt-0.5 line-clamp-2 leading-relaxed"
                         style={{ color: 'var(--ada-body)' }}>
                        {n.mensagem}
                      </p>
                    </div>
                    {!n.lida && (
                      <button
                        onClick={(e) => marcarLida(n.id, e)}
                        aria-label="Marcar como lida"
                        className="shrink-0 p-1 rounded transition-colors"
                        style={{ color: 'var(--ada-placeholder)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-placeholder)'}
                      >
                        <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ───────────────────────────────────────────────────
export function TopHeader({ onMobileMenuOpen }: Props) {
  const { usuario, logout } = useAuthStore()
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { count, atualizar } = useNotificacoesCount()

  const inicial = (usuario?.nome ?? 'U').charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className="fixed top-0 left-0 md:left-64 right-0 z-40 flex items-center justify-between px-4"
      style={{
        height: 'var(--header-h)',
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--chrome-divider)',
      }}
    >
      {/* ── Esquerda: menu mobile ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        {/* Hamburger — só aparece em mobile (o logo fica na sidebar) */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-1.5 rounded-lg transition-colors duration-150 outline-none
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
          style={{ color: 'var(--topbar-text)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color      = 'var(--topbar-heading)'
            el.style.background = 'var(--topbar-hover)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color      = 'var(--topbar-text)'
            el.style.background = 'transparent'
          }}
          aria-label="Abrir menu"
        >
          <Bars3Icon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Marca — só em mobile (desktop tem a sidebar visível) */}
        <span
          className="md:hidden text-sm font-semibold tracking-[-0.01em]"
          style={{ color: 'var(--topbar-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Casa di Ana
        </span>
      </div>

      {/* ── Direita: controles globais ─────────────────────────────── */}
      <div className="flex items-center gap-0.5">

        {/* Sino com dropdown inline */}
        <NotificationDropdown count={count} onCountUpdate={atualizar} />

        <Divider />

        {/* Toggle tema */}
        <IconBtn
          onClick={toggleTheme}
          ariaLabel={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          title={isDark ? 'Tema claro' : 'Tema escuro'}
        >
          {isDark
            ? <SunIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            : <MoonIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          }
        </IconBtn>

        <Divider />

        {/* Perfil do usuário */}
        <div
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg select-none"
          title={`${usuario?.nome ?? ''} · ${usuario?.papel ?? ''}`}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
            style={{ background: 'var(--sb-accent)' }}
            aria-hidden="true"
          >
            {inicial}
          </div>

          {/* Nome e papel — oculto em telas muito pequenas */}
          <div className="hidden sm:block min-w-0">
            <p
              className="text-[13px] font-medium leading-none truncate max-w-[140px]"
              style={{ color: 'var(--topbar-heading)' }}
            >
              {usuario?.nome ?? '—'}
            </p>
            <p
              className="text-[10.5px] mt-[3px] leading-none truncate"
              style={{ color: 'var(--topbar-text)' }}
            >
              {usuario?.papel ?? ''}
            </p>
          </div>
        </div>

        <Divider />

        {/* Logout */}
        <IconBtn
          onClick={handleLogout}
          ariaLabel="Sair do sistema"
          title="Sair"
          danger
        >
          <ArrowRightStartOnRectangleIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </IconBtn>
      </div>
    </header>
  )
}
