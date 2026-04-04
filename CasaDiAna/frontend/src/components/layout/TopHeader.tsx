import { useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/hooks/useTheme'

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
      style={{ color: 'var(--ada-muted)' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.color    = danger ? '#DC2626' : 'var(--ada-heading)'
        el.style.background = danger ? 'var(--ada-error-bg)' : 'var(--ada-hover)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.color      = 'var(--ada-muted)'
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
      style={{ background: 'var(--ada-border)' }}
      aria-hidden="true"
    />
  )
}

// ─── Componente principal ───────────────────────────────────────────────────
export function TopHeader({ onMobileMenuOpen }: Props) {
  const { usuario, logout } = useAuthStore()
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

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
        background: 'var(--ada-surface)',
        borderBottom: '1px solid var(--ada-border)',
      }}
    >
      {/* ── Esquerda: menu mobile ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        {/* Hamburger — só aparece em mobile (o logo fica na sidebar) */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-1.5 rounded-lg transition-colors duration-150 outline-none
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
          style={{ color: 'var(--ada-muted)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color      = 'var(--ada-heading)'
            el.style.background = 'var(--ada-hover)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color      = 'var(--ada-muted)'
            el.style.background = 'transparent'
          }}
          aria-label="Abrir menu"
        >
          <Bars3Icon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Marca — só em mobile (desktop tem a sidebar visível) */}
        <span
          className="md:hidden text-sm font-semibold tracking-[-0.01em]"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Casa di Ana
        </span>
      </div>

      {/* ── Direita: controles globais ─────────────────────────────── */}
      <div className="flex items-center gap-0.5">

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
              style={{ color: 'var(--ada-heading)' }}
            >
              {usuario?.nome ?? '—'}
            </p>
            <p
              className="text-[10.5px] mt-[3px] leading-none truncate"
              style={{ color: 'var(--ada-muted)' }}
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
