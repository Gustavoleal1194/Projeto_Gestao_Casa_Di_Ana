import { useEffect } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  nome: string
  entidade?: string
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

export function ModalDesativar({ nome, entidade = 'ingrediente', loading, onConfirmar, onCancelar }: Props) {
  const titulo = `Desativar ${entidade.charAt(0).toUpperCase() + entidade.slice(1)}`
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
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      aria-describedby="modal-descricao"
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancelar() }}
    >
      <div className="modal-card max-w-[400px]">
        {/* Header */}
        <div className="modal-header">
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
              {titulo}
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
              "{nome}"
            </span>
            ? Este item não aparecerá mais nas listagens ativas. Esta ação pode ser revertida.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="btn-danger disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? 'Desativando…' : 'Desativar'}
          </button>
        </div>
      </div>
    </div>
  )
}
