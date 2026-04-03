import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/20/solid'
import type { CategoriaIngrediente } from '@/types/estoque'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  categoriaId: string
  onCategoriaChange: (v: string) => void
  apenasAbaixoMinimo: boolean
  onApenasAbaixoMinimoChange: (v: boolean) => void
  categorias: CategoriaIngrediente[]
}

export function FiltrosIngredientes({
  busca,
  onBuscaChange,
  categoriaId,
  onCategoriaChange,
  apenasAbaixoMinimo,
  onApenasAbaixoMinimoChange,
  categorias,
}: Props) {
  const temFiltroAtivo = !!busca || !!categoriaId || apenasAbaixoMinimo

  return (
    <div
      className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Ícone de filtro */}
      <FunnelIcon
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        style={{ color: temFiltroAtivo ? '#C4870A' : 'var(--ada-placeholder)' }}
      />

      {/* Busca por nome */}
      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          aria-hidden="true"
          style={{ color: 'var(--ada-placeholder)' }}
        />
        <label htmlFor="busca-ingrediente" className="sr-only">Buscar ingrediente</label>
        <input
          id="busca-ingrediente"
          type="search"
          name="busca"
          placeholder="Buscar por nome…"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: 'var(--ada-heading)',
          }}
        />
      </div>

      {/* Filtro por categoria */}
      <div className="relative min-w-[180px]">
        <label htmlFor="filtro-categoria" className="sr-only">Filtrar por categoria</label>
        <select
          id="filtro-categoria"
          name="categoria"
          value={categoriaId}
          onChange={e => onCategoriaChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm appearance-none outline-none pr-8
                     transition-all duration-200 cursor-pointer
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: categoriaId ? 'var(--ada-heading)' : 'var(--ada-muted)',
          }}
        >
          <option value="">Todas as categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5"
          style={{ color: 'var(--ada-muted)' }}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
        </svg>
      </div>

      {/* Toggle abaixo do mínimo */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            checked={apenasAbaixoMinimo}
            onChange={e => onApenasAbaixoMinimoChange(e.target.checked)}
            className="sr-only"
            id="filtro-abaixo-minimo"
          />
          <div
            className="w-8 h-4.5 rounded-full transition-all duration-200 flex items-center"
            style={{
              background: apenasAbaixoMinimo ? '#C4870A' : 'var(--ada-border)',
              padding: '2px',
            }}
            aria-hidden="true"
          >
            <div
              className="w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{
                transform: apenasAbaixoMinimo ? 'translateX(13px)' : 'translateX(0)',
              }}
            />
          </div>
        </div>
        <span
          className="text-sm transition-colors duration-150"
          style={{ color: apenasAbaixoMinimo ? '#C4870A' : 'var(--ada-muted-dim)' }}
        >
          Abaixo do mínimo
        </span>
      </label>
    </div>
  )
}
