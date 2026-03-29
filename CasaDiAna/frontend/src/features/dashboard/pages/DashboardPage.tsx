import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { relatoriosService } from '@/features/relatorios/services/relatoriosService'
import type { EstoqueAtualItem } from '@/types/estoque'
import type { RelatorioProducaoVendasItem } from '@/types/producao'

// ─── Paleta de cores ────────────────────────────────────────────────────────
const COR = {
  verde:    '#22c55e',
  vermelho: '#ef4444',
  laranja:  '#f97316',
  azul:     '#3b82f6',
  pedra:    '#e7e5e4',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function primeiroDoMes() {
  const h = new Date()
  return new Date(h.getFullYear(), h.getMonth(), 1).toISOString().split('T')[0]
}
function hoje() { return new Date().toISOString().split('T')[0] }
function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function pct(v: number) { return `${v.toFixed(1)}%` }
function nomeCurto(s: string) { return s.length > 16 ? s.slice(0, 14) + '…' : s }

const inputCls =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

// ─── DashboardCard ──────────────────────────────────────────────────────────
interface DashboardCardProps {
  titulo: string
  valor: string
  subtexto: string
  variante?: 'default' | 'positivo' | 'negativo' | 'alerta'
  icone?: string
}

function DashboardCard({ titulo, valor, subtexto, variante = 'default', icone }: DashboardCardProps) {
  const v = {
    default:  { wrap: 'bg-white border-stone-200', txt: 'text-stone-800' },
    positivo: { wrap: 'bg-green-50 border-green-200', txt: 'text-green-700' },
    negativo: { wrap: 'bg-red-50 border-red-200',   txt: 'text-red-700'   },
    alerta:   { wrap: 'bg-amber-50 border-amber-300', txt: 'text-amber-700' },
  }[variante]

  return (
    <div className={`${v.wrap} border rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest leading-tight">{titulo}</p>
        {icone && <span className="text-lg leading-none">{icone}</span>}
      </div>
      <p className={`text-2xl font-bold leading-none mb-2 ${v.txt}`}>{valor}</p>
      <p className="text-xs text-stone-400">{subtexto}</p>
    </div>
  )
}

// ─── ChartContainer ─────────────────────────────────────────────────────────
interface ChartContainerProps {
  titulo: string
  subtitulo?: string
  children?: React.ReactNode
  rodape?: React.ReactNode
  vazio?: boolean
}

function ChartContainer({ titulo, subtitulo, children, rodape, vazio }: ChartContainerProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-800">{titulo}</h2>
        {subtitulo && <p className="text-xs text-stone-400 mt-0.5">{subtitulo}</p>}
      </div>
      <div className="px-6 pb-5 pt-5">
        {vazio
          ? <div className="flex items-center justify-center h-52 text-stone-400 text-sm">Sem dados no período.</div>
          : children}
        {rodape && <div className="mt-4">{rodape}</div>}
      </div>
    </div>
  )
}

// ─── Tooltip: Produção vs Vendas ─────────────────────────────────────────────
function TooltipProdVendas({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload ?? {}
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xl p-4 text-xs min-w-[180px]">
      <p className="font-semibold text-stone-800 text-sm mb-3 pb-2 border-b border-stone-100">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-2 text-stone-500">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.fill }} />
            {p.dataKey}
          </span>
          <span className="font-semibold text-stone-800">{Number(p.value).toFixed(0)} un.</span>
        </div>
      ))}
      {row.totalProduzido != null && (
        <div className="mt-2 pt-2 border-t border-stone-100 flex justify-between text-stone-500">
          <span>Total produzido</span>
          <span className="font-semibold text-stone-700">{Number(row.totalProduzido).toFixed(0)} un.</span>
        </div>
      )}
      {row.receitaEstimada != null && (
        <div className="mt-1 flex justify-between text-stone-500">
          <span>Receita est.</span>
          <span className="font-semibold text-green-700">{brl(row.receitaEstimada)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Tooltip: Margem ────────────────────────────────────────────────────────
function TooltipMargem({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const v = Number(payload[0]?.value ?? 0)
  const cor = v >= 30 ? COR.verde : v >= 0 ? COR.laranja : COR.vermelho
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xl p-4 text-xs">
      <p className="font-semibold text-stone-700 mb-2">{payload[0]?.payload?.nome}</p>
      <p className="text-3xl font-bold leading-none" style={{ color: cor }}>{pct(v)}</p>
      <p className="text-stone-400 mt-1">margem de lucro</p>
    </div>
  )
}

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface DashboardData {
  prodVendas: RelatorioProducaoVendasItem[]
  estoqueAlerta: EstoqueAtualItem[]
}

// ─── Página ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async (filtroDe: string, filtroAte: string) => {
    setLoading(true)
    setErro(null)
    try {
      const [pvResp, estoqueResp] = await Promise.all([
        relatoriosService.producaoVendas(filtroDe, filtroAte),
        relatoriosService.estoqueAtual(true),
      ])
      setData({ prodVendas: pvResp.itens, estoqueAlerta: estoqueResp })
    } catch {
      setErro('Erro ao carregar dados do dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar(primeiroDoMes(), hoje()) }, [carregar])
  const handleFiltrar = () => carregar(de, ate)

  // ── Totais ──────────────────────────────────────────────────────────────
  const totais = data?.prodVendas.reduce(
    (acc, i) => ({
      receita:       acc.receita       + i.receitaEstimada,
      custoProducao: acc.custoProducao + i.custoTotalProducao,
      custoPerda:    acc.custoPerda    + i.custoPerda,
      perda:         acc.perda         + i.perda,
    }),
    { receita: 0, custoProducao: 0, custoPerda: 0, perda: 0 }
  )

  const lucroEstimado = (totais?.receita ?? 0) - (totais?.custoProducao ?? 0) - (totais?.custoPerda ?? 0)
  const margemGeral   = totais?.receita ? (lucroEstimado / totais.receita) * 100 : 0

  // ── Chart: Produção vs Vendas (stacked: Vendido + Perda + Restante = Produzido) ──
  const chartProdVendas = data?.prodVendas.map(i => ({
    nome:            nomeCurto(i.produtoNome),
    Vendido:         i.totalVendido,
    Perda:           i.perda,
    Restante:        Math.max(0, i.totalProduzido - i.totalVendido - i.perda),
    totalProduzido:  i.totalProduzido,
    receitaEstimada: i.receitaEstimada,
  })) ?? []

  // ── Chart: Margem (horizontal ranking) ─────────────────────────────────
  const chartMargem = data?.prodVendas
    .filter(i => i.margemLucro != null)
    .map(i => ({ nome: nomeCurto(i.produtoNome), margem: Number(i.margemLucro!.toFixed(1)) }))
    .sort((a, b) => b.margem - a.margem) ?? []

  const margemCor = (v: number) => v >= 30 ? COR.verde : v >= 0 ? COR.laranja : COR.vermelho

  return (
    <div className="p-6 space-y-6">

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-sm text-stone-400 mt-0.5">Visão geral do período selecionado</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
            <input type="date" value={de} onChange={e => setDe(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
            <input type="date" value={ate} onChange={e => setAte(e.target.value)} className={inputCls} />
          </div>
          <button
            onClick={handleFiltrar}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
        </div>
      )}

      {/* ── Erro ──────────────────────────────────────────────────────── */}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}

      {!loading && !erro && data && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              titulo="Receita Estimada"
              valor={brl(totais?.receita ?? 0)}
              subtexto="no período"
              variante="positivo"
              icone="💰"
            />
            <DashboardCard
              titulo="Lucro Estimado"
              valor={brl(lucroEstimado)}
              subtexto={`margem geral: ${pct(margemGeral)}`}
              variante={lucroEstimado >= 0 ? 'positivo' : 'negativo'}
              icone={lucroEstimado >= 0 ? '📈' : '📉'}
            />
            <DashboardCard
              titulo="Custo das Perdas"
              valor={brl(totais?.custoPerda ?? 0)}
              subtexto={`${totais?.perda.toFixed(0) ?? 0} unidades perdidas`}
              variante={(totais?.custoPerda ?? 0) > 0 ? 'negativo' : 'default'}
              icone="🗑️"
            />
            <DashboardCard
              titulo="Estoque Baixo"
              valor={String(data.estoqueAlerta.length)}
              subtexto={`ingrediente${data.estoqueAlerta.length !== 1 ? 's' : ''} abaixo do mínimo`}
              variante={data.estoqueAlerta.length > 0 ? 'alerta' : 'default'}
              icone={data.estoqueAlerta.length > 0 ? '⚠️' : '✅'}
            />
          </div>

          {/* ── Gráficos ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Produção vs Vendas — stacked bar */}
            <ChartContainer
              titulo="Produção vs Vendas por Produto"
              subtitulo="Cada barra = total produzido · Vendido + Perda + Restante"
              vazio={chartProdVendas.length === 0}
              rodape={
                <div className="flex items-center gap-5 text-xs text-stone-500 flex-wrap">
                  {[
                    { cor: COR.verde,    label: 'Vendido'  },
                    { cor: COR.vermelho, label: 'Perda'    },
                    { cor: COR.pedra,    label: 'Restante' },
                  ].map(({ cor, label }) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: cor }} />
                      {label}
                    </span>
                  ))}
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartProdVendas}
                  margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ef" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 11, fill: '#a8a29e' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipProdVendas />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="Vendido"  stackId="a" fill={COR.verde}    isAnimationActive />
                  <Bar dataKey="Perda"    stackId="a" fill={COR.vermelho} isAnimationActive />
                  <Bar dataKey="Restante" stackId="a" fill={COR.pedra}    isAnimationActive radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Margem de lucro */}
            {chartMargem.length === 0 ? (
              <ChartContainer titulo="Margem de Lucro por Produto" subtitulo="Rentabilidade no período" vazio />
            ) : chartMargem.length === 1 ? (
              // KPI card para produto único
              <ChartContainer titulo="Margem de Lucro por Produto" subtitulo="Rentabilidade no período">
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <p className="text-sm font-medium text-stone-500">{chartMargem[0].nome}</p>
                  <p className="text-7xl font-bold leading-none" style={{ color: margemCor(chartMargem[0].margem) }}>
                    {pct(chartMargem[0].margem)}
                  </p>
                  <span
                    className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: margemCor(chartMargem[0].margem) }}
                  >
                    {chartMargem[0].margem >= 30 ? '✓ Excelente' : chartMargem[0].margem >= 0 ? '~ Regular' : '✗ Negativa'}
                  </span>
                  <p className="text-xs text-stone-400 mt-1">margem de lucro estimada</p>
                </div>
              </ChartContainer>
            ) : (
              // Horizontal ranking para múltiplos produtos
              <ChartContainer
                titulo="Margem de Lucro por Produto"
                subtitulo="Ordenado do maior para o menor"
                rodape={
                  <div className="flex items-center gap-5 text-xs text-stone-500 flex-wrap">
                    {[
                      { cor: COR.verde,    label: '≥ 30% — Excelente' },
                      { cor: COR.laranja,  label: '0–30% — Regular'   },
                      { cor: COR.vermelho, label: '< 0% — Negativa'    },
                    ].map(({ cor, label }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: cor }} />
                        {label}
                      </span>
                    ))}
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height={Math.max(200, chartMargem.length * 46)}>
                  <BarChart
                    data={chartMargem}
                    layout="vertical"
                    margin={{ top: 4, right: 52, left: 8, bottom: 4 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ef" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#a8a29e' }}
                      tickFormatter={v => `${v}%`}
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<TooltipMargem />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="margem" radius={[0, 4, 4, 0]} maxBarSize={30} isAnimationActive>
                      <LabelList
                        dataKey="margem"
                        position="right"
                        formatter={(v: unknown) => pct(Number(v))}
                        style={{ fontSize: 11, fill: '#78716c', fontWeight: 600 }}
                      />
                      {chartMargem.map((entry, i) => (
                        <Cell key={i} fill={margemCor(entry.margem)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>

          {/* ── Alertas de estoque ────────────────────────────────────── */}
          {data.estoqueAlerta.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <h2 className="text-sm font-semibold text-stone-800">
                  Ingredientes com Estoque Abaixo do Mínimo
                </h2>
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {data.estoqueAlerta.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      {['Ingrediente', 'Categoria', 'Atual', 'Mínimo', 'Déficit'].map((h, i) => (
                        <th
                          key={h}
                          className={`text-xs font-semibold text-stone-500 uppercase tracking-wide px-5 py-3 ${i >= 2 ? 'text-right' : 'text-left'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.estoqueAlerta.map(item => (
                      <tr key={item.ingredienteId} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-stone-800">{item.nome}</td>
                        <td className="px-5 py-3 text-sm text-stone-400">{item.categoriaNome ?? '—'}</td>
                        <td className="px-5 py-3 text-sm text-right font-semibold text-red-600">
                          {item.estoqueAtual.toFixed(3)} {item.unidadeMedidaCodigo}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-stone-500">
                          {item.estoqueMinimo.toFixed(3)} {item.unidadeMedidaCodigo}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            −{(item.estoqueMinimo - item.estoqueAtual).toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Estado vazio ──────────────────────────────────────────── */}
          {data.prodVendas.length === 0 && data.estoqueAlerta.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl py-20 text-center shadow-md">
              <p className="text-5xl mb-3">📊</p>
              <p className="text-stone-600 text-sm font-medium">Nenhum dado encontrado no período selecionado.</p>
              <p className="text-stone-400 text-xs mt-1">Registre produções e vendas para visualizar o dashboard.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
