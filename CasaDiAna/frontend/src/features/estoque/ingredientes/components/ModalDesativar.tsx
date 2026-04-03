import { useEffect } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  nomeIngrediente: string
  loading: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export function ModalDesativar({ nomeIngrediente, loading, onConfirmar, onCancelar }: Props) {
  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancelar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [loading, onCancelar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      aria-describedby="modal-descricao"
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancelar() }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl"
        style={{
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          boxShadow: '0 24px 48px rgba(13,17,23,0.18), 0 8px 16px rgba(13,17,23,0.10)',
          overscrollBehavior: 'contain',
          animation: 'modalIn 200ms cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--ada-border-sub)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)' }}
            >
              <ExclamationTriangleIcon className="h-5 w-5" style={{ color: '#DC2626' }} aria-hidden="true" />
            </div>
            <h2
              id="modal-titulo"
              className="text-[15px] font-semibold"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Desativar Ingrediente
            </h2>
          </div>
          <button
            onClick={onCancelar}
            disabled={loading}
            className="p-1.5 rounded-lg transition-colors duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                       disabled:opacity-40"
            aria-label="Fechar"
            style={{ color: 'var(--ada-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p
            id="modal-descricao"
            className="text-sm leading-relaxed"
            style={{ color: 'var(--ada-body)' }}
          >
            Deseja desativar{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
              "{nomeIngrediente}"
            </span>
            ? O ingrediente não aparecerá mais nas listagens ativas. Esta ação pode ser revertida.
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2.5 px-6 py-4"
          style={{ borderTop: '1px solid var(--ada-border-sub)', background: 'var(--ada-surface-2)', borderRadius: '0 0 16px 16px' }}
        >
          <button
            onClick={onCancelar}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                       disabled:opacity-50"
            style={{
              border: '1px solid var(--ada-border)',
              color: 'var(--ada-body)',
              background: 'var(--ada-surface)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-surface)'}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                       text-white transition-all duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-red-400/40
                       disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
          >
            {loading && <Spinner />}
            {loading ? 'Desativando…' : 'Desativar'}
          </button>
        </div>

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            [role="dialog"] > div { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
