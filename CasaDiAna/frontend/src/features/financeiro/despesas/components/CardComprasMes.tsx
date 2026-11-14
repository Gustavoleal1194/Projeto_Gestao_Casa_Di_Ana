import { Link } from 'react-router-dom'
import type { ComprasMes } from '../services/despesasService'
import { formatarBRL } from '../../shared/competencia'

/** Compras do mês vindas das notas de entrada (somente leitura). */
export function CardComprasMes({ compras }: { compras: ComprasMes | null }) {
  return (
    <div className="rounded-xl border p-6 space-y-3" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ada-muted)' }}>Compras do mês (notas)</p>
        <Link to="/entradas" className="text-xs" style={{ color: 'var(--sb-accent)', textDecoration: 'underline' }}>Ver entradas</Link>
      </div>
      {!compras || compras.itens.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhuma compra registrada neste mês.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {compras.itens.map(c => (
                <tr key={c.entradaId} style={{ borderTop: '1px solid var(--ada-border)' }}>
                  <td className="py-2 pr-4" style={{ color: 'var(--ada-body)' }}>{c.fornecedor}</td>
                  <td className="py-2 pr-4" style={{ color: 'var(--ada-muted)' }}>{c.numeroNotaFiscal ?? '—'}</td>
                  <td className="py-2 pr-4" style={{ color: 'var(--ada-muted)' }}>{new Date(c.data).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
