import type { ComparacaoPrecoIngrediente } from '@/types/estoque'
import { TituloSecao } from './TituloSecao'
import { fmtData, fmtMoeda } from './formatadores'

export function HistoricoCompras({ historico }: { historico: ComparacaoPrecoIngrediente['historico'] }) {
  return (
    <div>
      <TituloSecao>Histórico de compras</TituloSecao>
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ada-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head-row">
              <th className="table-th" scope="col">Data</th>
              <th className="table-th" scope="col">Fornecedor</th>
              <th className="table-th" scope="col">NF</th>
              <th className="table-th table-th-right" scope="col">Qtd.</th>
              <th className="table-th table-th-right" scope="col">Custo Unit.</th>
            </tr>
          </thead>
          <tbody>
            {[...historico].reverse().map(h => (
              <tr key={h.entradaId} className="table-row">
                <td className="table-td tabular-nums" style={{ color: 'var(--ada-body)' }}>{fmtData(h.dataEntrada)}</td>
                <td className="table-td" style={{ color: 'var(--ada-body)' }}>{h.fornecedorNome}</td>
                <td className="table-td font-mono" style={{ color: 'var(--ada-muted)' }}>{h.numeroNotaFiscal ?? '—'}</td>
                <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-body)' }}>{h.quantidade}</td>
                <td className="table-td tabular-nums font-semibold" style={{ textAlign: 'right', color: 'var(--ada-heading)' }}>
                  {fmtMoeda(h.custoUnitario)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
