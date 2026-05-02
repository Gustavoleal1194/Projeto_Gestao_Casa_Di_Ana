// CasaDiAna/frontend/src/components/ui/TabelaAcoesLinha.tsx
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'

interface TabelaAcoesLinhaProps {
  onEditar?: () => void
  onDesativar?: () => void
  labelEditar?: string
  labelDesativar?: string
}

export function TabelaAcoesLinha({ onEditar, onDesativar, labelEditar, labelDesativar }: TabelaAcoesLinhaProps) {
  if (!onEditar && !onDesativar) return null

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          aria-label={labelEditar ?? 'Editar'}
          className="p-1.5 rounded-lg border-none cursor-pointer outline-none transition-all duration-150"
          style={{ color: 'var(--ada-muted)', background: 'transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#D4960C'
            e.currentTarget.style.background = 'rgba(212,150,12,.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--ada-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {onDesativar && (
        <button
          type="button"
          onClick={onDesativar}
          aria-label={labelDesativar ?? 'Desativar'}
          className="p-1.5 rounded-lg border-none cursor-pointer outline-none transition-all duration-150"
          style={{ color: 'var(--ada-muted)', background: 'transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#F87171'
            e.currentTarget.style.background = 'rgba(239,68,68,.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--ada-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
