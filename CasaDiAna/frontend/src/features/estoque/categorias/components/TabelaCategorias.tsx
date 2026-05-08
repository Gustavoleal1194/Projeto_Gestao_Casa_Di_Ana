import { StatusBadge } from '@/components/ui/StatusBadge'
import { TabelaAcoesLinha } from '@/components/ui/TabelaAcoesLinha'
import { destacar } from '@/utils/destacar'
import type { CategoriaIngrediente } from '@/types/estoque'

interface Props {
  categorias: CategoriaIngrediente[]
  podeEditar: boolean
  onEditar: (cat: CategoriaIngrediente) => void
  onDesativar: (cat: CategoriaIngrediente) => void
  busca?: string
}

export function TabelaCategorias({ categorias, podeEditar, onEditar, onDesativar, busca }: Props) {
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
            {categorias.length === 0 ? (
              busca ? (
                <tr>
                  <td
                    colSpan={podeEditar ? 3 : 2}
                    className="table-td text-center py-10 text-sm"
                    style={{ color: 'var(--ada-muted)' }}
                  >
                    Nenhum resultado para{' '}
                    <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
                      "{busca}"
                    </span>
                    .
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={podeEditar ? 3 : 2}>
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
                  </td>
                </tr>
              )
            ) : (
              categorias.map(cat => (
                <tr key={cat.id} className="table-row group">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <span className="accent-bar shrink-0" aria-hidden="true" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                        {destacar(cat.nome, busca ?? '')}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <StatusBadge variante={cat.ativo ? 'ativo' : 'inativo'} />
                  </td>
                  {podeEditar && (
                    <td className="table-td text-right group">
                      <TabelaAcoesLinha
                        onEditar={() => onEditar(cat)}
                        onDesativar={() => onDesativar(cat)}
                        labelEditar={`Editar ${cat.nome}`}
                        labelDesativar={`Desativar ${cat.nome}`}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
