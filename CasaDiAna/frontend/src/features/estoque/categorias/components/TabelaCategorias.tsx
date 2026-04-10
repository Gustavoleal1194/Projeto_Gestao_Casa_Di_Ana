import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'
import type { CategoriaIngrediente } from '@/types/estoque'

interface Props {
  categorias: CategoriaIngrediente[]
  podeEditar: boolean
  onEditar: (cat: CategoriaIngrediente) => void
  onDesativar: (cat: CategoriaIngrediente) => void
}

export function TabelaCategorias({ categorias, podeEditar, onEditar, onDesativar }: Props) {
  if (categorias.length === 0) {
    return (
      <div className="ada-surface-card">
        <div className="state-empty">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
            aria-hidden="true"
          >
            <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 7h10M7 12h6M7 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Nenhuma categoria cadastrada
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
            Crie uma categoria para organizar os ingredientes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ada-surface-card">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="table-head-row">
              <th className="table-th" scope="col">Nome</th>
              <th className="table-th" scope="col">Status</th>
              {podeEditar && (
                <th className="table-th table-th-right" scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {categorias.map(cat => (
              <tr key={cat.id} className="table-row group">
                <td className="table-td">
                  <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                    {cat.nome}
                  </span>
                </td>
                <td className="table-td">
                  <span className={cat.ativo ? 'badge badge-active' : 'badge badge-inactive'}>
                    {cat.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {podeEditar && (
                  <td className="table-td" style={{ textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => onEditar(cat)}
                        aria-label={`Editar ${cat.nome}`}
                        className="row-action-btn"
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => onDesativar(cat)}
                        aria-label={`Desativar ${cat.nome}`}
                        className="row-action-btn danger"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
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
