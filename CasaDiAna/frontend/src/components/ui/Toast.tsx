// CasaDiAna/frontend/src/components/ui/Toast.tsx
import { useEffect } from 'react'

interface Props {
  tipo: 'sucesso' | 'erro' | 'aviso'
  mensagem: string
  onFechar: () => void
  duracao?: number
}

const estilos: Record<Props['tipo'], { bg: string; border: string; text: string; icon: string }> = {
  sucesso: {
    bg: 'var(--ada-success-bg)',
    border: 'var(--ada-success-border)',
    text: 'var(--ada-success-text)',
    icon: '✓',
  },
  erro: {
    bg: 'var(--ada-error-bg)',
    border: 'var(--ada-error-border)',
    text: 'var(--ada-error-text)',
    icon: '✕',
  },
  aviso: {
    bg: 'var(--ada-warning-bg)',
    border: 'var(--ada-warning-border)',
    text: 'var(--ada-warning-text)',
    icon: '!',
  },
}

export function Toast({ tipo, mensagem, onFechar, duracao = 4000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onFechar, duracao)
    return () => clearTimeout(t)
  }, [onFechar, duracao])

  const s = estilos[tipo]

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        animation: 'toastIn 300ms cubic-bezier(0.34,1.56,0.64,1) both',
        maxWidth: '360px',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
          background: s.border,
        }}
        aria-hidden="true"
      >
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{mensagem}</span>
      <button
        onClick={onFechar}
        aria-label="Fechar notificação"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.6,
          fontSize: '1rem',
          lineHeight: 1,
          padding: '0 0.25rem',
        }}
      >
        ×
      </button>
    </div>
  )
}
