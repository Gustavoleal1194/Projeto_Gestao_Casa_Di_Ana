import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CategoriaProduto } from '@/types/producao'

interface Props {
  categorias: CategoriaProduto[]
  podeEditar: boolean
  onEditar: (cat: CategoriaProduto) => void
  onDesativar: (cat: CategoriaProduto) => void
}

export function TabelaCategoriasProduto({ categorias, podeEditar, onEditar, onDesativar }: Props) {
  if (categorias.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm py-16 text-center">
        <p className="text-stone-500 text-sm">Nenhuma categoria de produto cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nome</th>
            <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
            {podeEditar && (
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {categorias.map(cat => (
            <tr key={cat.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-stone-800">{cat.nome}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  cat.ativo ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                }`}>
                  {cat.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              {podeEditar && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEditar(cat)}
                    title="Editar"
                    className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDesativar(cat)}
                    title="Desativar"
                    className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-red-600 ml-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
