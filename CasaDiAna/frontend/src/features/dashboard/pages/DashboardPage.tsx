import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { relatoriosService } from '@/features/relatorios/services/relatoriosService'
import type { EstoqueAtualItem } from '@/types/estoque'
import type { RelatorioProducaoVendasItem } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function nomeCurto(nome: string) {
  return nome.length > 16 ? nome.slice(0, 14) + '…' : nome
}

const inputClass =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

interface DashboardData {
  prodVendas: RelatorioProducaoVendasItem[]
  estoqueAlerta: EstoqueAtualItem[]
}

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

  const totais = data?.prodVendas.reduce(
    (acc, item) => ({
      receita: acc.receita + item.receitaEstimada,
      custoProducao: acc.custoProducao + item.custoTotalProducao,
      custoPerda: acc.custoPerda + item.custoPerda,
      perda: acc.perda + item.perda,
    }),
    { receita: 0, custoProducao: 0, custoPerda: 0, perda: 0 }
  )

  const chartProdVendas = data?.prodVendas.map((i: RelatorioProducaoVendasItem) => ({
    nome: nomeCurto(i.produtoNome),
    Produzido: i.totalProduzido,
    Vendido: i.totalVendido,
    Perda: i.perda,
  })) ?? []

  const chartMargem = data?.prodVendas
    .filter((i: RelatorioProducaoVendasItem) => i.margemLucro != null)
    .map((i: RelatorioProducaoVendasItem) => ({
      nome: nomeCurto(i.produtoNome),
      margem: Number(i.margemLucro!.toFixed(1)),
    }))
    .sort((a, b) => b.margem - a.margem) ?? []

  const margemColor = (v: number) =>
    v >= 30 ? '#16a34a' : v >= 0 ? '#d97706' : '#dc2626'

  return (
    <div className="p-6 space-y-6">
      {/* Título + filtro */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <h1 className="text-2xl font-semibold text-stone-800">Dashboard</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
            <input type="date" value={de} onChange={e => setDe(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
            <input type="date" value={ate} onChange={e => setAte(e.target.value)} className={inputClass} />
          </div>
          <button
            onClick={handleFiltrar}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
        </div>
      )}

      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}

      {!loading && !erro && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Receita Estimada</p>
              <p className="text-2xl font-bold text-green-700">{brl(totais?.receita ?? 0)}</p>
              <p className="text-xs text-stone-400 mt-1">no período</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Custo de Produção</p>
              <p className="text-2xl font-bold text-stone-800">{brl(totais?.custoProducao ?? 0)}</p>
              <p className="text-xs text-stone-400 mt-1">no período</p>
            </div>
            <div className={`border rounded-xl p-5 ${(totais?.custoPerda ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200 shadow-sm'}`}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Custo das Perdas</p>
              <p className={`text-2xl font-bold ${(totais?.custoPerda ?? 0) > 0 ? 'text-red-700' : 'text-stone-800'}`}>
                {brl(totais?.custoPerda ?? 0)}
              </p>
              <p className="text-xs text-stone-400 mt-1">{totais?.perda.toFixed(0) ?? 0} unidades perdidas</p>
            </div>
            <div className={`border rounded-xl p-5 ${(data.estoqueAlerta.length) > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-stone-200 shadow-sm'}`}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Estoque Baixo</p>
              <p className={`text-2xl font-bold ${data.estoqueAlerta.length > 0 ? 'text-amber-700' : 'text-stone-800'}`}>
                {data.estoqueAlerta.length}
              </p>
              <p className="text-xs text-stone-400 mt-1">ingrediente{data.estoqueAlerta.length !== 1 ? 's' : ''} abaixo do mínimo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Gráfico: Produção vs Vendas */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-700 mb-4">Produção vs Vendas por Produto</h2>
              {chartProdVendas.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
                  Sem dados no período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartProdVendas} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [Number(v).toFixed(0), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Produzido" fill="#92400e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Vendido" fill="#d97706" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Perda" fill="#fca5a5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gráfico: Margem de lucro */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-700 mb-4">Margem de Lucro por Produto</h2>
              {chartMargem.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
                  Sem dados no período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={chartMargem}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      tickFormatter={v => `${v}%`}
                      domain={['auto', 'auto']}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Margem']}
                    />
                    <Bar dataKey="margem" radius={[0, 3, 3, 0]}>
                      {chartMargem.map((entry, i) => (
                        <Cell key={i} fill={margemColor(entry.margem)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" /> ≥ 30%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-600 inline-block" /> 0–30%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> negativa</span>
              </div>
            </div>
          </div>

          {/* Alertas de estoque */}
          {data.estoqueAlerta.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-sm font-semibold text-stone-700">
                  Ingredientes com Estoque Abaixo do Mínimo
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Ingrediente</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Categoria</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Estoque Atual</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Mínimo</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.estoqueAlerta.map(item => (
                      <tr key={item.ingredienteId} className="border-b border-stone-100 bg-amber-50 hover:bg-amber-100 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-stone-800">{item.nome}</td>
                        <td className="px-4 py-3 text-sm text-stone-500">{item.categoriaNome ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-700">
                          {item.estoqueAtual.toFixed(3)} {item.unidadeMedidaCodigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-stone-600">
                          {item.estoqueMinimo.toFixed(3)} {item.unidadeMedidaCodigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                          {`−${(item.estoqueMinimo - item.estoqueAtual).toFixed(3)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estado vazio geral */}
          {data.prodVendas.length === 0 && data.estoqueAlerta.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-xl py-20 text-center shadow-sm">
              <p className="text-stone-400 text-sm">Nenhum dado de produção ou venda encontrado no período selecionado.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
