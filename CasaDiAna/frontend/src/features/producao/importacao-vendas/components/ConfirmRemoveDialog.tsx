import { useEffect } from 'react'
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  nomeItem: string
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmRemoveDialog({ nomeItem, onConfirmar, onCancelar }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancelar])

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-remover-titulo"
      onClick={e => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <div className="modal-card max-w-[400px]">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)' }}
            >
              <TrashIcon className="h-5 w-5" style={{ color: '#DC2626' }} aria-hidden="true" />
            </div>
            <h2
              id="dialog-remover-titulo"
              className="text-[15px] font-semibold"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Remover da lista
            </h2>
          </div>
          <button
            onClick={onCancelar}
            className="p-1.5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
            aria-label="Fechar"
            style={{ color: 'var(--ada-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ada-body)' }}>
            Deseja remover{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
              "{nomeItem}"
            </span>{' '}
            da lista desta importação? Nenhum dado será apagado do banco.
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={onCancelar} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="btn-danger">
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}
