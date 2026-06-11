import { useMemo, useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatarBRL, formatarPercentual } from '../../shared/competencia'
import {
  calcularPrecificacao, STATUS_BADGE,
  type StatusPrecificacao, type PrecificacaoResultado,
} from '../precificacaoMath'
import type { AnalisePrecificacao, ProdutoPrecificacao } from '../services/precificacaoService'

type Ordenacao = 'menorMargemLiquida' | 'maiorDiferenca' | 'maiorCmv' | 'maiorCusto' | 'maiorLucro'

interface Props {
  analise: AnalisePrecificacao
  onSimular: (produto: ProdutoPrecificacao) => void
}

interface Linha { produto: ProdutoPrecificacao; r: PrecificacaoResultado }

export function TabelaPrecificacao({ analise, onSimular }: Props) {
  const [statusFiltro, setStatusFiltro] = useState<StatusPrecificacao | ''>('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('menorMargemLiquida')

  const linhas: Linha[] = useMemo(() => analise.produtos.map(produto => ({
    produto,
    r: calcularPrecificacao(
      { precoVenda: produto.precoVenda, custoDireto: produto.custoDireto, temFicha: produto.temFicha },
      { cmvAlvo: analise.config.cmvAlvo, margemDesejada: analise.config.margemDesejada, taxas: analise.config.taxas, despesaFixaPct: analise.despesaFixaPercentual },
    ),
  })), [analise])

  const categorias = useMemo(
    () => Array.from(new Set(analise.produtos.map(p => p.categoriaNome).filter(Boolean))) as string[],
    [analise],
  )

  const filtradas = useMemo(() => {
    let arr = linhas
    if (statusFiltro) arr = arr.filter(l => l.r.status === statusFiltro)
    if (categoriaFiltro) arr = arr.filter(l => l.produto.categoriaNome === categoriaFiltro)
    const num = (v: number | null) => (v ?? Number.POSITIVE_INFINITY)
    const cmp: Record<Ordenacao, (a: Linha, b: Linha) => number> = {
      menorMargemLiquida: (a, b) => num(a.r.margemLiquidaEst) - num(b.r.margemLiquidaEst),
      maiorDiferenca: (a, b) => (b.r.diferenca ?? -Infinity) - (a.r.diferenca ?? -Infinity),
      maiorCmv: (a, b) => (b.r.cmvAtual ?? -Infinity) - (a.r.cmvAtual ?? -Infinity),
      maiorCusto: (a, b) => b.produto.custoDireto - a.produto.custoDireto,
      maiorLucro: (a, b) => b.r.lucroEstimado - a.r.lucroEstimado,
    }
    return [...arr].sort(cmp[ordenacao])
  }, [linhas, statusFiltro, categoriaFiltro, ordenacao])

  const selStyle = { background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm border outline-none" style={selStyle}>
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value as StatusPrecificacao | '')}
          className="rounded-lg px-3 py-2 text-sm border outline-none" style={selStyle}>
          <option value="">Todos os status</option>
          <option value="prejuizo">Prejuízo estimado</option>
          <option value="custoAlto">Custo alto</option>
          <option value="abaixoDoIdeal">Abaixo do ideal</option>
          <option value="atencao">Atenção</option>
          <option value="saudavel">Saudável</option>
        </select>
        <select value={ordenacao} onChange={e => setOrdenacao(e.target.value as Ordenacao)}
          className="rounded-lg px-3 py-2 text-sm border outline-none" style={selStyle}>
          <option value="menorMargemLiquida">Menor margem líquida</option>
          <option value="maiorDiferenca">Maior diferença p/ sugerido</option>
          <option value="maiorCmv">Maior CMV</option>
          <option value="maiorCusto">Maior custo direto</option>
          <option value="maiorLucro">Maior lucro estimado</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--ada-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--ada-muted)' }}>
              <th className="py-2 px-3 font-medium">Produto</th>
              <th className="py-2 px-3 font-medium">Categoria</th>
              <th className="py-2 px-3 font-medium text-right">Preço atual</th>
              <th className="py-2 px-3 font-medium text-right">Custo ficha</th>
              <th className="py-2 px-3 font-medium text-right">CMV%</th>
              <th className="py-2 px-3 font-medium text-right">Margem líq.</th>
              <th className="py-2 px-3 font-medium text-right">Preço sugerido</th>
              <th className="py-2 px-3 font-medium text-right">Diferença</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(({ produto, r }) => (
              <tr key={produto.id} style={{ borderTop: '1px solid var(--ada-border)' }}>
                <td className="py-2.5 px-3" style={{ color: 'var(--ada-body)' }}>{produto.nome}</td>
                <td className="py-2.5 px-3" style={{ color: 'var(--ada-muted)' }}>{produto.categoriaNome ?? '—'}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarBRL(produto.precoVenda)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{r.semCusto ? '—' : formatarBRL(produto.custoDireto)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarPercentual(r.cmvAtual)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{formatarPercentual(r.margemLiquidaEst)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: 'var(--ada-body)' }}>{r.semCusto || r.precoSugerido === null ? '—' : formatarBRL(r.precoSugerido)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: r.diferenca != null && r.diferenca > 0 ? '#F87171' : 'var(--ada-muted)' }}>{r.diferenca != null && !r.semCusto ? formatarBRL(r.diferenca) : '—'}</td>
                <td className="py-2.5 px-3"><StatusBadge variante={STATUS_BADGE[r.status].variante} label={STATUS_BADGE[r.status].label} /></td>
                <td className="py-2.5 px-3 text-right">
                  <button type="button" onClick={() => onSimular(produto)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'var(--ada-hover)', color: 'var(--ada-body)' }}>
                    Simular
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
