import { useEffect, useState } from 'react'
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'

interface Props {
  tipo: 'sucesso' | 'erro' | 'aviso'
  mensagem: string
  onFechar: () => void
  duracao?: number
}

const config = {
  sucesso: {
    bg:     '#F0FDF4',
    border: '#BBF7D0',
    text:   '#15803D',
    accent: '#16A34A',
    icon:   CheckCircleIcon,
  },
  erro: {
    bg:     '#FEF2F2',
    border: '#FECACA',
    text:   '#DC2626',
    accent: '#DC2626',
    icon:   XCircleIcon,
  },
  aviso: {
    bg:     '#FFFBEB',
    border: '#FDE68A',
    text:   '#B45309',
    accent: '#D97706',
    icon:   ExclamationTriangleIcon,
  },
}

export function Toast({ tipo, mensagem, onFechar, duracao = 4000 }: Props) {
  const [saindo, setSaindo] = useState(false)
  const cfg = config[tipo]
  const Icon = cfg.icon

  // Auto-fechar com animação de saída
  useEffect(() => {
    const timer = setTimeout(() => setSaindo(true), duracao - 300)
    const close = setTimeout(onFechar, duracao)
    return () => { clearTimeout(timer); clearTimeout(close) }
  }, [duracao, onFechar])

  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-start gap-3 rounded-xl px-4 py-3.5 max-w-sm shadow-lg"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        transform: saindo ? 'translateX(calc(100% + 24px))' : 'translateX(0)',
        opacity: saindo ? 0 : 1,
        transition: 'transform 280ms ease-in, opacity 280ms ease-in',
        animation: saindo ? 'none' : 'toastIn 220ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: cfg.accent }} aria-hidden="true" />
      <p className="text-sm font-medium flex-1 min-w-0" style={{ color: cfg.text }}>
        {mensagem}
      </p>
      <button
        onClick={() => { setSaindo(true); setTimeout(onFechar, 280) }}
        className="shrink-0 p-0.5 rounded-md transition-opacity duration-150 hover:opacity-70 outline-none
                   focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ color: cfg.text, '--tw-ring-color': cfg.accent } as React.CSSProperties}
        aria-label="Fechar notificação"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      <style>{`
        @keyframes toastIn {
          from { transform: translateX(calc(100% + 24px)); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] { animation: none !important; transition: opacity 0.1ms !important; }
        }
      `}</style>
    </div>
  )
}
