import type { ReactNode } from 'react'

export interface FilterChipDef {
  label: string
  onRemove: () => void
}

interface FilterChipProps {
  label: string
  onRemove: () => void
}

interface FilterBarActionsProps {
  submitLabel?: string
  loadingLabel?: string
  loading?: boolean
  chips?: FilterChipDef[]
}

interface FilterBarProps {
  onSubmit: (e: React.FormEvent) => void
  ariaLabel?: string
  children: ReactNode
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="filter-chip">
      {label}
      <button
        type="button"
        className="filter-chip-remove"
        onClick={onRemove}
        aria-label={`Remover filtro: ${label}`}
      >
        ×
      </button>
    </span>
  )
}

export function FilterBarActions({
  submitLabel = 'Filtrar',
  loadingLabel = 'Carregando…',
  loading = false,
  chips = [],
}: FilterBarActionsProps) {
  return (
    <>
      <button type="submit" className="btn-filter" disabled={loading}>
        {loading ? loadingLabel : submitLabel}
      </button>
      {chips.length > 0 && (
        <div className="filter-chips-row">
          {chips.map(chip => (
            <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      )}
    </>
  )
}

export function FilterBar({ onSubmit, ariaLabel, children }: FilterBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="filter-bar"
      role="search"
      aria-label={ariaLabel ?? 'Filtrar'}
    >
      {children}
    </form>
  )
}
