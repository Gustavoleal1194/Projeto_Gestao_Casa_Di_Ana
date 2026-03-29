import { PencilSquareIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import type { IngredienteResumo } from '@/types/estoque'

interface Props {
  ingredientes: IngredienteResumo[]
  podeEditar: boolean
  podeDesativar: boolean
  onEditar: (id: string) => void
  onDesativar: (ingrediente: IngredienteResumo) => void
}

export function TabelaIngredientes({
  ingredientes,
  podeEditar,
  podeDesativar,
  onEditar,
  onDesativar,
}: Props) {
  if (ingredientes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm py-16 text-center">
        <div className="text-stone-300 text-5xl mb-3">🧂</div>
        <p className="text-stone-500 font-medium">Nenhum ingrediente encontrado</p>
        <p className="text-stone-400 text-sm mt-1">Tente ajustar os filtros ou cadastre um novo.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            {['Nome', 'Código', 'Categoria', 'Unidade', 'Estoque Atual / Mínimo', 'Ações'].map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredientes.map((ing, idx) => (
            <tr
              key={ing.id}
              className={`hover:bg-amber-50 transition-colors
                          ${idx < ingredientes.length - 1 ? 'border-b border-stone-100' : ''}`}
            >
              <td className="px-4 py-3 text-sm font-medium text-stone-800">{ing.nome}</td>

              <td className="px-4 py-3 text-sm text-stone-500 font-mono">
                {ing.codigoInterno ?? '—'}
              </td>

              <td className="px-4 py-3 text-sm text-stone-600">
                {ing.categoriaNome ?? <span className="text-stone-300">—</span>}
              </td>

              <td className="px-4 py-3 text-sm text-stone-600">{ing.unidadeMedidaCodigo}</td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-800">
                    {ing.estoqueAtual.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                  </span>
                  <span className="text-stone-300 text-xs">/</span>
                  <span className="text-xs text-stone-500">
                    {ing.estoqueMinimo.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                  </span>
                  {ing.estaBaixoDoMinimo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100
                                     text-red-700 rounded-full text-xs font-medium">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      Baixo
                    </span>
                  )}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {podeEditar && (
                    <button
                      onClick={() => onEditar(ing.id)}
                      title="Editar"
                      className="p-1.5 rounded hover:bg-stone-100 text-stone-400
                                 hover:text-amber-700 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                  )}
                  {podeDesativar && (
                    <button
                      onClick={() => onDesativar(ing)}
                      title="Desativar"
                      className="p-1.5 rounded hover:bg-stone-100 text-stone-400
                                 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
