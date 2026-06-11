import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatarBRL, formatarPercentual } from '../../shared/competencia'
import { calcularPrecificacao, STATUS_BADGE } from '../precificacaoMath'
import type { ConfiguracaoPrecificacao, ProdutoPrecificacao } from '../services/precificacaoService'

interface Props {
  produto: ProdutoPrecificacao
  config: ConfiguracaoPrecificacao
  despesaFixaPct: number | null
  onFechar: () => void
}

const pct = (f: number) => String(Math.round(f * 1000) / 10)
const toFrac = (s: string) => Number(s.replace(',', '.')) / 100

export function ModalSimulador({ produto, config, despesaFixaPct, onFechar }: Props) {
  const [preco, setPreco] = useState(String(produto.precoVenda))
  const [cmv, setCmv] = useState(pct(config.cmvAlvo))
  const [margem, setMargem] = useState(pct(config.margemDesejada))
  const [taxas, setTaxas] = useState(pct(config.taxas))

  const r = calcularPrecificacao(
    { precoVenda: Number(preco.replace(',', '.')) || 0, custoDireto: produto.custoDireto, temFicha: produto.temFicha },
    { cmvAlvo: toFrac(cmv) || 0, margemDesejada: toFrac(margem) || 0, taxas: toFrac(taxas) || 0, despesaFixaPct },
  )

  const inputStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }
  const campo = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ada-body)' }}>{label}</label>
      <input type="text" inputMode="decimal" value={value} onChange={e => set(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none" style={inputStyle} />
    </div>
  )
  const linha = (label: string, valor: string) => (
    <div className="flex justify-between text-sm py-1">
      <span style={{ color: 'var(--ada-muted)' }}>{label}</span>
      <span className="tabular-nums font-medium" style={{ color: 'var(--ada-body)' }}>{valor}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="w-full max-w-lg rounded-xl border p-6 space-y-4" style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }} onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>Simular preço — {produto.nome}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>Custo da ficha: {produto.temFicha ? formatarBRL(produto.custoDireto) : 'ficha incompleta'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {campo('Preço simulado (R$)', preco, setPreco)}
          {campo('CMV alvo (%)', cmv, setCmv)}
          {campo('Margem desejada (%)', margem, setMargem)}
          {campo('Taxas (%)', taxas, setTaxas)}
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-bg)' }}>
          {linha('CMV resultante', formatarPercentual(r.cmvAtual))}
          {linha('Rateio fixo estimado', formatarBRL(r.rateioFixo))}
          {linha('Lucro estimado/unid.', formatarBRL(r.lucroEstimado))}
          {linha('Margem líquida estimada', formatarPercentual(r.margemLiquidaEst))}
          {linha('Preço sugerido (margem)', r.somaInvalida ? 'soma ≥ 100%' : (r.precoSugeridoPorMargem != null ? formatarBRL(r.precoSugeridoPorMargem) : '—'))}
          {linha('Preço sugerido (CMV alvo)', r.precoSugeridoPorCmv != null ? formatarBRL(r.precoSugeridoPorCmv) : '—')}
          <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--ada-border)' }}>
            <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>Status</span>
            <StatusBadge variante={STATUS_BADGE[r.status].variante} label={STATUS_BADGE[r.status].label} />
          </div>
        </div>

        {r.somaInvalida && (
          <p className="text-sm" style={{ color: 'var(--ada-error-text)' }}>
            Despesa fixa % + taxas % + margem desejada % ≥ 100% — ajuste os percentuais.
          </p>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium border" style={inputStyle}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
