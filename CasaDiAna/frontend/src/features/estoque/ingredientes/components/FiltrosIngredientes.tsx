import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
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
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
      {/* Busca por nome */}
      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Filtro por categoria */}
      <select
        value={categoriaId}
        onChange={e => onCategoriaChange(e.target.value)}
        className="w-48 border border-stone-200 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      >
        <option value="">Todas as categorias</option>
        {categorias.map(c => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>

      {/* Toggle abaixo do mínimo */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={apenasAbaixoMinimo}
          onChange={e => onApenasAbaixoMinimoChange(e.target.checked)}
          className="h-4 w-4 rounded accent-amber-700"
        />
        <span className="text-sm text-stone-600">Abaixo do mínimo</span>
      </label>
    </div>
  )
}
