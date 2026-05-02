import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { TabelaAcoesLinha } from '@/components/ui/TabelaAcoesLinha'
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
      <div
        className="rounded-xl py-16 text-center"
        style={{
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
          aria-hidden="true"
        >
          <svg className="w-7 h-7 text-[var(--ada-placeholder)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
          </svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Nenhum ingrediente encontrado
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'var(--ada-muted)' }}>
          Ajuste os filtros ou cadastre um novo ingrediente.
        </p>
      </div>
    )
  }

  const thCls = 'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em]'
  const tdCls = 'px-5 py-3.5'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border-sub)' }}>
              <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Nome</th>
              <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Código</th>
              <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Categoria</th>
              <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Unid.</th>
              <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Estoque / Mínimo</th>
              <th className={`${thCls} text-right`} style={{ color: 'var(--ada-muted)' }} scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((ing, idx) => (
              <tr
                key={ing.id}
                className="group transition-colors duration-100"
                style={{
                  borderBottom: idx < ingredientes.length - 1 ? '1px solid var(--ada-hover)' : 'none',
                  background: ing.estaBaixoDoMinimo ? 'var(--ada-row-alert)' : 'var(--ada-surface)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = ing.estaBaixoDoMinimo ? 'var(--ada-row-alert-hover)' : 'var(--ada-surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = ing.estaBaixoDoMinimo ? 'var(--ada-row-alert)' : 'var(--ada-surface)')}
              >
                {/* Nome */}
                <td className={tdCls}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`accent-bar shrink-0${ing.estaBaixoDoMinimo ? ' accent-bar-alert' : ''}`}
                      aria-hidden="true"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                        {ing.nome}
                      </span>
                      {ing.estaBaixoDoMinimo && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold shrink-0"
                          style={{ background: 'var(--ada-warning-badge)', color: 'var(--ada-warning-text)', border: '1px solid var(--ada-warning-border)' }}
                        >
                          <ExclamationTriangleIcon className="h-3 w-3" aria-hidden="true" />
                          Baixo
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Código */}
                <td className={tdCls}>
                  <span
                    className="text-[12.5px] font-mono tracking-wide"
                    style={{ color: ing.codigoInterno ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}
                  >
                    {ing.codigoInterno ?? '—'}
                  </span>
                </td>

                {/* Categoria */}
                <td className={tdCls}>
                  <span className="text-sm" style={{ color: ing.categoriaNome ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                    {ing.categoriaNome ?? '—'}
                  </span>
                </td>

                {/* Unidade */}
                <td className={tdCls}>
                  <span
                    className="inline-block text-[12px] font-semibold rounded-md px-2 py-0.5"
                    style={{ background: 'var(--ada-bg)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' }}
                  >
                    {ing.unidadeMedidaCodigo}
                  </span>
                </td>

                {/* Estoque */}
                <td className={tdCls}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: ing.estaBaixoDoMinimo ? '#C4870A' : 'var(--ada-heading)' }}
                    >
                      {ing.estoqueAtual.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                    </span>
                    <span className="text-[var(--ada-placeholder)] text-xs">/</span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--ada-muted)' }}>
                      {ing.estoqueMinimo.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                    </span>
                  </div>
                </td>

                {/* Ações */}
                <td className={`${tdCls} text-right group`}>
                  <TabelaAcoesLinha
                    onEditar={podeEditar ? () => onEditar(ing.id) : undefined}
                    onDesativar={podeDesativar ? () => onDesativar(ing) : undefined}
                    labelEditar={`Editar ${ing.nome}`}
                    labelDesativar={`Desativar ${ing.nome}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
