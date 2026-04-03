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
      <div
        className="rounded-xl py-16 text-center"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4DDD3',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#F5F3EF', border: '1px solid #E4DDD3' }}
          aria-hidden="true"
        >
          <svg className="w-7 h-7 text-[#C4B8AD]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
          </svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#4B4039', fontFamily: 'Sora, system-ui, sans-serif' }}>
          Nenhum ingrediente encontrado
        </p>
        <p className="text-xs mt-1.5" style={{ color: '#8B7E73' }}>
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
        background: '#FFFFFF',
        border: '1px solid #E4DDD3',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EEEBE5' }}>
              <th className={thCls} style={{ color: '#8B7E73' }} scope="col">Nome</th>
              <th className={thCls} style={{ color: '#8B7E73' }} scope="col">Código</th>
              <th className={thCls} style={{ color: '#8B7E73' }} scope="col">Categoria</th>
              <th className={thCls} style={{ color: '#8B7E73' }} scope="col">Unid.</th>
              <th className={thCls} style={{ color: '#8B7E73' }} scope="col">Estoque / Mínimo</th>
              <th className={`${thCls} text-right`} style={{ color: '#8B7E73' }} scope="col">
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
                  borderBottom: idx < ingredientes.length - 1 ? '1px solid #F0EBE3' : 'none',
                  background: ing.estaBaixoDoMinimo ? '#FFFBEB' : '#FFFFFF',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = ing.estaBaixoDoMinimo ? '#FEF9E7' : '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = ing.estaBaixoDoMinimo ? '#FFFBEB' : '#FFFFFF')}
              >
                {/* Nome */}
                <td className={tdCls}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#18150E', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                      {ing.nome}
                    </span>
                    {ing.estaBaixoDoMinimo && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold shrink-0"
                        style={{ background: '#FEF3C7', color: '#92580A', border: '1px solid #FDE68A' }}
                      >
                        <ExclamationTriangleIcon className="h-3 w-3" aria-hidden="true" />
                        Baixo
                      </span>
                    )}
                  </div>
                </td>

                {/* Código */}
                <td className={tdCls}>
                  <span
                    className="text-[12.5px] font-mono tracking-wide"
                    style={{ color: ing.codigoInterno ? '#6B6456' : '#C4B8AD' }}
                  >
                    {ing.codigoInterno ?? '—'}
                  </span>
                </td>

                {/* Categoria */}
                <td className={tdCls}>
                  <span className="text-sm" style={{ color: ing.categoriaNome ? '#6B6456' : '#C4B8AD' }}>
                    {ing.categoriaNome ?? '—'}
                  </span>
                </td>

                {/* Unidade */}
                <td className={tdCls}>
                  <span
                    className="inline-block text-[12px] font-semibold rounded-md px-2 py-0.5"
                    style={{ background: '#F5F3EF', color: '#8B7E73', border: '1px solid #E4DDD3' }}
                  >
                    {ing.unidadeMedidaCodigo}
                  </span>
                </td>

                {/* Estoque */}
                <td className={tdCls}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: ing.estaBaixoDoMinimo ? '#C4870A' : '#18150E' }}
                    >
                      {ing.estoqueAtual.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                    </span>
                    <span className="text-[#C4B8AD] text-xs">/</span>
                    <span className="text-xs tabular-nums" style={{ color: '#8B7E73' }}>
                      {ing.estoqueMinimo.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                    </span>
                  </div>
                </td>

                {/* Ações */}
                <td className={`${tdCls} text-right`}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {podeEditar && (
                      <button
                        onClick={() => onEditar(ing.id)}
                        aria-label={`Editar ${ing.nome}`}
                        className="p-1.5 rounded-lg transition-all duration-150 outline-none
                                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
                        style={{ color: '#8B7E73' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.color = '#C4870A'
                          ;(e.currentTarget as HTMLElement).style.background = '#FEF3C7'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.color = '#8B7E73'
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                    {podeDesativar && (
                      <button
                        onClick={() => onDesativar(ing)}
                        aria-label={`Desativar ${ing.nome}`}
                        className="p-1.5 rounded-lg transition-all duration-150 outline-none
                                   focus-visible:ring-2 focus-visible:ring-red-400/40"
                        style={{ color: '#8B7E73' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.color = '#DC2626'
                          ;(e.currentTarget as HTMLElement).style.background = '#FEF2F2'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.color = '#8B7E73'
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
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
