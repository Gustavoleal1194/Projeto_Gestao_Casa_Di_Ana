import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  placeholder?: string
  id?: string
}

export function BuscaTabela({ busca, onBuscaChange, placeholder = 'Buscar…', id = 'busca-tabela' }: Props) {
  return (
    <div
      className="rounded-xl px-4 py-3 mb-4"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          aria-hidden="true"
          style={{ color: busca ? '#C4870A' : 'var(--ada-placeholder)' }}
        />
        <label htmlFor={id} className="sr-only">{placeholder}</label>
        <input
          id={id}
          type="search"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: 'var(--ada-heading)',
          }}
        />
      </div>
    </div>
  )
}
