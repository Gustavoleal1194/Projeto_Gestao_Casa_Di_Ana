import type { ComparacaoPrecoIngrediente } from '@/types/estoque'
import { TituloSecao } from './TituloSecao'
import { fmtData, fmtMoeda } from './formatadores'

export function ComparacaoFornecedores({ fornecedores }: { fornecedores: ComparacaoPrecoIngrediente['porFornecedor'] }) {
  if (fornecedores.length < 2) return null
  const menorPreco = Math.min(...fornecedores.map(f => f.precoMinimo))

  return (
    <div>
      <TituloSecao>Comparação por fornecedor</TituloSecao>
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ada-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head-row">
              <th className="table-th" scope="col">Fornecedor</th>
              <th className="table-th table-th-right" scope="col">Menor preço</th>
              <th className="table-th table-th-right" scope="col">Maior preço</th>
              <th className="table-th table-th-right" scope="col">Preço médio</th>
              <th className="table-th table-th-right" scope="col">Último preço</th>
              <th className="table-th" scope="col">Última compra</th>
              <th className="table-th table-th-right" scope="col">Compras</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map(f => (
              <tr key={f.fornecedorId} className="table-row">
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>{f.fornecedorNome}</span>
                    {f.precoMinimo === menorPreco && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: 'var(--ada-success-bg)', color: 'var(--ada-success-text)' }}>
                        melhor preço
                      </span>
                    )}
                  </div>
                </td>
                <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-success-text)' }}>{fmtMoeda(f.precoMinimo)}</td>
                <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-error-text)' }}>{fmtMoeda(f.precoMaximo)}</td>
                <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-body)' }}>{fmtMoeda(f.precoMedio)}</td>
                <td className="table-td tabular-nums font-semibold" style={{ textAlign: 'right', color: 'var(--ada-heading)' }}>{fmtMoeda(f.ultimoPreco)}</td>
                <td className="table-td" style={{ color: 'var(--ada-body)' }}>{fmtData(f.ultimaCompra)}</td>
                <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-muted)' }}>{f.totalCompras}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
