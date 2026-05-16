import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import {
  FireIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { relatoriosService } from '@/features/relatorios/services/relatoriosService'
import type { EstoqueAtualItem } from '@/types/estoque'
import type { RelatorioProducaoVendasItem } from '@/types/producao'
import { useTheme } from '@/hooks/useTheme'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiltroPeriodo } from '@/components/ui/FiltroPeriodo'
import { KpiCard } from '@/components/ui/KpiCard'

// ─── Paleta de cores ────────────────────────────────────────────────────────
const COR = {
  verde:    '#10b981',  // emerald-500 — positivo / vendido
  vermelho: '#f43f5e',  // rose-500 — perda / negativo
  laranja:  '#f59e0b',  // amber-500 — produção
  azul:     '#60a5fa',  // blue-400 — neutro / tendência receita
  indigo:   '#818cf8',  // indigo-400 — tendência custo
  pedra:    '#d6d0c8',  // warm stone — restante (neutro quente, coerente com a paleta do produto)
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
function formatarDataBr(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}
function listarDiasNoIntervalo(de: string, ate: string, limite = 62) {
  const [y1, m1, d1] = de.split('-').map(Number)
  const [y2, m2, d2] = ate.split('-').map(Number)
  const inicio = new Date(y1, m1 - 1, d1)
  const fim = new Date(y2, m2 - 1, d2)
  const dias: string[] = []
  for (const dt = new Date(inicio); dt <= fim && dias.length < limite; dt.setDate(dt.getDate() + 1)) {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    dias.push(`${y}-${m}-${d}`)
  }
  return dias
}

// ─── AcoesRapidas ───────────────────────────────────────────────────────────
interface AcaoRapidaProps {
  icone: React.ReactNode
  label: string
  onClick: () => void
}

function AcaoRapida({ icone, label, onClick }: AcaoRapidaProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-xl p-4 text-left
                 transition-all duration-200 outline-none
                 focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'var(--shadow-xs)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--ada-warning-badge)', border: '1px solid var(--ada-warning-border)' }}
        aria-hidden="true"
      >
        <span style={{ color: '#D4960C' }} className="w-5 h-5 flex items-center justify-center">
          {icone}
        </span>
      </div>
      <span
        className="text-[13px] font-semibold leading-tight text-center"
        style={{ color: 'var(--ada-body)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
      >
        {label}
      </span>
    </button>
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
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3.5 shrink-0"
        style={{ borderBottom: '1px solid var(--ada-border)' }}
      >
        <h2
          className="text-[13px] font-semibold leading-snug"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {titulo}
        </h2>
        {subtitulo && (
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--ada-muted)' }}>
            {subtitulo}
          </p>
        )}
      </div>

      {/* Chart body */}
      <div className="px-5 pt-4 pb-5 flex-1">
        {vazio ? (
          <div
            className="flex flex-col items-center justify-center h-52 gap-2.5"
            style={{ color: 'var(--ada-placeholder)' }}
          >
            <svg className="w-9 h-9 opacity-40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 17l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[12px]" style={{ color: 'var(--ada-placeholder)' }}>Sem dados no período selecionado.</p>
          </div>
        ) : children}
      </div>

      {/* Rodapé com separador */}
      {rodape && (
        <div
          className="px-5 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--ada-border)' }}
        >
          {rodape}
        </div>
      )}
    </div>
  )
}

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface DashboardData {
  prodVendas: RelatorioProducaoVendasItem[]
  estoqueAlerta: EstoqueAtualItem[]
  tendenciaDiaria: Array<{ data: string; receita: number; custo: number; lucro: number }>
}

// ─── Página ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const chartTooltip = useMemo(() => ({
    backgroundColor: isDark ? '#111827' : '#ffffff',
    borderColor:     isDark ? '#1F2937' : '#e4e7ec',
    textColor:       isDark ? '#EDE5D8' : '#1e293b',
  }), [isDark])
  const chartAxis = useMemo(() => ({
    axisColor:  isDark ? '#4B5563' : '#9ca3af',
    bodyColor:  isDark ? '#9CA3AF' : '#6b7280',
    labelColor: isDark ? '#9CA3AF' : '#4b5563',
    gridColor:  isDark ? '#1F2937' : '#f1f5f9',
  }), [isDark])

  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [buscaMargem, setBuscaMargem] = useState('')

  const carregar = useCallback(async (filtroDe: string, filtroAte: string) => {
    setLoading(true)
    setErro(null)
    try {
      const dias = listarDiasNoIntervalo(filtroDe, filtroAte)
      const [pvResp, estoqueResp, tendenciaResp] = await Promise.all([
        relatoriosService.producaoVendas(filtroDe, filtroAte),
        relatoriosService.estoqueAtual(true),
        Promise.all(
          dias.map(async dia => {
            const r = await relatoriosService.producaoVendas(dia, dia)
            const receita = r.itens.reduce((acc, i) => acc + i.receitaEstimada, 0)
            const custo = r.itens.reduce((acc, i) => acc + i.custoTotalProducao + i.custoPerda, 0)
            return { data: dia, receita, custo, lucro: receita - custo }
          })
        ),
      ])
      setData({ prodVendas: pvResp.itens, estoqueAlerta: estoqueResp, tendenciaDiaria: tendenciaResp })
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
  const totalProduzidoGeral = data?.prodVendas.reduce((acc, i) => acc + i.totalProduzido, 0) ?? 0
  const totalVendidoGeral = data?.prodVendas.reduce((acc, i) => acc + i.totalVendido, 0) ?? 0
  const sellThrough = totalProduzidoGeral > 0 ? (totalVendidoGeral / totalProduzidoGeral) * 100 : 0

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
    .map(i => ({ nome: nomeCurto(i.produtoNome), nomeCompleto: i.produtoNome, margem: Number(i.margemLucro!.toFixed(1)) }))
    .sort((a, b) => b.margem - a.margem) ?? []

  const chartMargemFiltrado = useMemo(() => {
    if (!buscaMargem.trim()) return chartMargem.slice(0, 10)
    const termo = buscaMargem.toLowerCase()
    return chartMargem.filter(i => i.nomeCompleto.toLowerCase().includes(termo))
  }, [data, buscaMargem])

  const margemCor = (v: number) => v >= 30 ? '#10b981' : v >= 0 ? '#f59e0b' : '#f43f5e'

  const chartPerdaProduto = data?.prodVendas
    .filter(i => i.totalProduzido > 0)
    .map(i => ({
      nome: nomeCurto(i.produtoNome),
      perdaPct: Number(((i.perda / i.totalProduzido) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.perdaPct - a.perdaPct)
    .slice(0, 8) ?? []

  const receitasOrdenadas = [...(data?.prodVendas ?? [])]
    .map(i => ({ nome: i.produtoNome, receita: i.receitaEstimada }))
    .filter(i => i.receita > 0)
    .sort((a, b) => b.receita - a.receita)
  const topReceitas = receitasOrdenadas.slice(0, 6)
  const outrasReceitas = receitasOrdenadas.slice(6).reduce((acc, i) => acc + i.receita, 0)
  const chartMixReceita = outrasReceitas > 0
    ? [...topReceitas, { nome: 'Outros', receita: outrasReceitas }]
    : topReceitas

  // tooltip base — compartilhado por todos os charts
  const tooltipBase = useMemo(() => ({
    backgroundColor: chartTooltip.backgroundColor,
    borderColor: chartTooltip.borderColor,
    borderWidth: 1,
    padding: [10, 14] as [number, number],
    textStyle: { color: chartTooltip.textColor, fontSize: 12, fontFamily: 'DM Sans, system-ui, sans-serif' },
    confine: true,
    extraCssText: 'border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,0.13);',
  }), [chartTooltip])

  const tooltipDivider = isDark
    ? '<div style="height:1px;background:#1F2937;margin:7px 0;"></div>'
    : '<div style="height:1px;background:#e4e7ec;margin:7px 0;"></div>'

  const optionProdVendas: EChartsOption = {
    color: [COR.verde, COR.vermelho, COR.pedra],
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)' } },
      formatter: (params: any) => {
        const linhas = Array.isArray(params) ? params : [params]
        const row = linhas[0]?.data ?? {}
        return `
          <div style="min-width:210px;font-family:DM Sans,system-ui,sans-serif;">
            <div style="font-weight:600;font-size:12.5px;margin-bottom:9px;color:${chartTooltip.textColor};">${linhas[0]?.axisValue ?? ''}</div>
            ${linhas.map((p: any) => `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:18px;margin:3px 0;">
                <span style="display:flex;align-items:center;gap:6px;color:${chartAxis.bodyColor};">${p.marker}${p.seriesName}</span>
                <strong style="font-variant-numeric:tabular-nums;color:${chartTooltip.textColor};">${Number(p.value).toFixed(0)} un.</strong>
              </div>
            `).join('')}
            ${tooltipDivider}
            <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0;color:${chartAxis.bodyColor};">
              <span>Total produzido</span>
              <strong style="font-variant-numeric:tabular-nums;color:${chartTooltip.textColor};">${Number(row.totalProduzido ?? 0).toFixed(0)} un.</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0;color:${chartAxis.bodyColor};">
              <span>Receita est.</span>
              <strong style="font-variant-numeric:tabular-nums;color:#10b981;">${brl(Number(row.receitaEstimada ?? 0))}</strong>
            </div>
          </div>
        `
      },
    },
    legend: { show: false },
    grid: { left: 16, right: 8, top: 12, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: chartProdVendas.map(i => i.nome),
      axisLabel: { rotate: 28, color: chartAxis.axisColor, fontSize: 11, margin: 8 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: chartAxis.axisColor, fontSize: 11 },
      splitLine: { lineStyle: { color: chartAxis.gridColor } },
      splitNumber: 4,
    },
    series: [
      {
        name: 'Vendido',
        type: 'bar',
        stack: 'total',
        data: chartProdVendas.map(i => i.Vendido),
        barMaxWidth: 36,
        barMinWidth: 8,
        emphasis: { focus: 'series', itemStyle: { opacity: 0.9 } },
      },
      {
        name: 'Perda',
        type: 'bar',
        stack: 'total',
        data: chartProdVendas.map(i => i.Perda),
        barMaxWidth: 36,
        barMinWidth: 8,
        emphasis: { focus: 'series', itemStyle: { opacity: 0.9 } },
      },
      {
        name: 'Restante',
        type: 'bar',
        stack: 'total',
        data: chartProdVendas.map(i => ({ value: i.Restante, totalProduzido: i.totalProduzido, receitaEstimada: i.receitaEstimada })),
        barMaxWidth: 36,
        barMinWidth: 8,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
        emphasis: { focus: 'series', itemStyle: { opacity: 0.9 } },
      },
    ],
  }

  const optionMargem: EChartsOption = {
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: any) => {
        const v = Number(p.value)
        const label = v >= 30 ? 'Excelente' : v >= 0 ? 'Regular' : 'Negativa'
        return `<div style="min-width:150px;font-family:DM Sans,system-ui,sans-serif;">
          <div style="font-weight:600;font-size:12.5px;margin-bottom:8px;color:${chartTooltip.textColor};">${p.name}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;color:${chartAxis.bodyColor};">
            <span>Margem</span>
            <strong style="color:${margemCor(v)};font-variant-numeric:tabular-nums;font-size:14px;">${pct(v)}</strong>
          </div>
          <div style="font-size:11px;color:${chartAxis.bodyColor};margin-top:5px;opacity:0.8;">${label}</div>
        </div>`
      },
    },
    grid: { left: 12, right: 72, top: 6, bottom: 6, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: chartMargemFiltrado.map(i => i.nome),
      axisLabel: { color: chartAxis.bodyColor, fontSize: 11, fontFamily: 'DM Sans, system-ui, sans-serif' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Margem',
        type: 'bar',
        showBackground: true,
        backgroundStyle: {
          color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: [0, 4, 4, 0],
        },
        data: chartMargemFiltrado.map(i => ({
          value: i.margem,
          itemStyle: { color: margemCor(i.margem), borderRadius: [0, 4, 4, 0], opacity: 0.88 },
          label: {
            show: true,
            position: 'right',
            formatter: `${pct(i.margem)}`,
            color: margemCor(i.margem),
            fontWeight: 700,
            fontSize: 11,
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        })),
        barMaxWidth: 20,
        barMinHeight: 4,
        emphasis: { focus: 'self', itemStyle: { opacity: 1 } },
      },
    ],
  }

  const optionPerdaProduto: EChartsOption = {
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: any) => `<div style="min-width:150px;font-family:DM Sans,system-ui,sans-serif;">
        <div style="font-weight:600;font-size:12.5px;margin-bottom:8px;color:${chartTooltip.textColor};">${p.name}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;color:${chartAxis.bodyColor};">
          <span>Taxa de perda</span>
          <strong style="color:${COR.vermelho};font-variant-numeric:tabular-nums;font-size:14px;">${Number(p.value).toFixed(1)}%</strong>
        </div>
      </div>`,
    },
    grid: { left: 12, right: 72, top: 6, bottom: 6, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: chartPerdaProduto.map(i => i.nome),
      axisLabel: { color: chartAxis.bodyColor, fontSize: 11, fontFamily: 'DM Sans, system-ui, sans-serif' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        showBackground: true,
        backgroundStyle: {
          color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: [0, 4, 4, 0],
        },
        data: chartPerdaProduto.map(i => ({
          value: i.perdaPct,
          itemStyle: { color: COR.vermelho, borderRadius: [0, 4, 4, 0], opacity: 0.82 },
          label: {
            show: true,
            position: 'right',
            formatter: `${i.perdaPct}%`,
            color: COR.vermelho,
            fontWeight: 700,
            fontSize: 11,
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        })),
        barMaxWidth: 20,
        barMinHeight: 4,
        emphasis: { focus: 'self', itemStyle: { opacity: 1 } },
      },
    ],
  }

  const optionMixReceita: EChartsOption = {
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    // Paleta coerente com o produto: inicia no amber (tom do produto), depois teal, azul, indigo, rose
    color: ['#f59e0b', '#10b981', '#60a5fa', '#818cf8', '#2dd4bf', '#f87171', '#94a3b8'],
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: any) => `<div style="min-width:170px;font-family:DM Sans,system-ui,sans-serif;">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block;flex-shrink:0;"></span>
          <span style="font-weight:600;font-size:12.5px;color:${chartTooltip.textColor};">${p.name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;color:${chartAxis.bodyColor};">
          <span>Receita</span>
          <strong style="font-variant-numeric:tabular-nums;color:${chartTooltip.textColor};">${brl(Number(p.value))}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:3px;color:${chartAxis.bodyColor};">
          <span>Participação</span>
          <strong style="font-variant-numeric:tabular-nums;color:${chartTooltip.textColor};">${Number(p.percent).toFixed(1)}%</strong>
        </div>
      </div>`,
    },
    legend: {
      bottom: 2,
      type: 'scroll',
      icon: 'circle',
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 14,
      textStyle: { color: chartAxis.bodyColor, fontSize: 11, fontFamily: 'DM Sans, system-ui, sans-serif' },
      pageTextStyle: { color: chartAxis.bodyColor },
      pageIconColor: chartAxis.bodyColor,
      pageIconInactiveColor: chartAxis.gridColor,
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '44%'],
        itemStyle: {
          borderColor: isDark ? '#111827' : '#f8fafc',
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 4,
          itemStyle: { shadowBlur: 14, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.18)' },
        },
        data: chartMixReceita.map(i => ({ name: nomeCurto(i.nome), value: i.receita })),
      },
    ],
  }

  const optionTendenciaDiaria: EChartsOption = {
    color: [COR.azul, COR.indigo, COR.verde],
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: isDark ? '#3C3530' : '#e2ddd8', type: 'solid', width: 1 },
      },
      formatter: (params: any) => {
        const linhas = Array.isArray(params) ? params : [params]
        return `
          <div style="min-width:210px;font-family:DM Sans,system-ui,sans-serif;">
            <div style="font-weight:600;font-size:12.5px;margin-bottom:9px;color:${chartTooltip.textColor};">${linhas[0]?.axisValue ?? ''}</div>
            ${linhas.map((p: any) => `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:18px;margin:4px 0;">
                <span style="display:flex;align-items:center;gap:6px;color:${chartAxis.bodyColor};">${p.marker}${p.seriesName}</span>
                <strong style="font-variant-numeric:tabular-nums;color:${chartTooltip.textColor};">${brl(Number(p.value))}</strong>
              </div>
            `).join('')}
          </div>
        `
      },
    },
    legend: {
      top: 2,
      right: 4,
      icon: 'circle',
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 16,
      textStyle: { color: chartAxis.bodyColor, fontSize: 11, fontFamily: 'DM Sans, system-ui, sans-serif' },
    },
    grid: { left: 12, right: 12, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: (data?.tendenciaDiaria ?? []).map(i => formatarDataBr(i.data)),
      axisLabel: { color: chartAxis.axisColor, fontSize: 11, hideOverlap: true },
      axisLine: { show: false },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: chartAxis.axisColor,
        fontSize: 10,
        // formato compacto: "1,2k" em vez de "R$ 1.234,00" para não competir com o gráfico
        formatter: (v: number) => {
          if (v === 0) return '0'
          if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}k`
          return String(v)
        },
      },
      splitLine: { lineStyle: { color: chartAxis.gridColor } },
      splitNumber: 4,
    },
    series: [
      {
        name: 'Receita',
        type: 'line',
        smooth: 0.5,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        data: (data?.tendenciaDiaria ?? []).map(i => Number(i.receita.toFixed(2))),
        emphasis: { focus: 'series' },
      },
      {
        name: 'Custo',
        type: 'line',
        smooth: 0.5,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        data: (data?.tendenciaDiaria ?? []).map(i => Number(i.custo.toFixed(2))),
        emphasis: { focus: 'series' },
      },
      {
        name: 'Lucro',
        type: 'line',
        smooth: 0.5,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        data: (data?.tendenciaDiaria ?? []).map(i => Number(i.lucro.toFixed(2))),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)' },
              { offset: 1, color: 'rgba(16,185,129,0)' },
            ],
          },
        },
        emphasis: { focus: 'series' },
      },
    ],
  }

  return (
    <div className="ada-page space-y-6 max-w-[1280px] mx-auto">

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <PageHeader
        titulo="Dashboard"
        subtitulo="Resumo operacional do período"
      />
      <div
          className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3 p-3 rounded-xl"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-xs)' }}
        >
          <FiltroPeriodo
            de={de}
            onChangeDe={setDe}
            ate={ate}
            onChangeAte={setAte}
            idDe="dash-de"
            idAte="dash-ate"
          />
          <button
            onClick={handleFiltrar}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
              boxShadow: '0 2px 8px rgba(196,135,10,0.25)',
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
          >
            Atualizar
          </button>
        </div>

      {/* ── Ações Rápidas ─────────────────────────────────────────────── */}
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-3"
          style={{ color: 'var(--ada-muted)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
        >
          Ações Rápidas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AcaoRapida
            icone={<FireIcon className="w-5 h-5" />}
            label="Nova Produção"
            onClick={() => navigate('/producao/diaria/nova')}
          />
          <AcaoRapida
            icone={<BanknotesIcon className="w-5 h-5" />}
            label="Nova Venda"
            onClick={() => navigate('/producao/vendas/nova')}
          />
          <AcaoRapida
            icone={<ArrowDownTrayIcon className="w-5 h-5" />}
            label="Registrar Entrada"
            onClick={() => navigate('/entradas/nova')}
          />
          <AcaoRapida
            icone={<ExclamationTriangleIcon className="w-5 h-5" />}
            label="Ver Estoque Baixo"
            onClick={() => navigate('/estoque/ingredientes')}
          />
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center py-24">
          <div
            className="h-10 w-10 animate-spin rounded-full"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando dados do dashboard…"
          />
        </div>
      )}

      {/* ── Erro ──────────────────────────────────────────────────────── */}
      {!loading && erro && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
          role="alert"
        >
          {erro}
        </div>
      )}

      {!loading && !erro && data && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <KpiCard
              label="Receita Estimada"
              valor={brl(totais?.receita ?? 0)}
              raw={totais?.receita ?? 0}
              formatarValor={brl}
              tendencia="total no período"
              variante="green"
            />
            <KpiCard
              label="Lucro Estimado"
              valor={brl(lucroEstimado)}
              raw={lucroEstimado}
              formatarValor={brl}
              tendencia={`Margem geral: ${pct(margemGeral)}`}
              variante={lucroEstimado >= 0 ? 'green' : 'red'}
            />
            <KpiCard
              label="Custo de Perdas"
              valor={brl(totais?.custoPerda ?? 0)}
              raw={totais?.custoPerda ?? 0}
              formatarValor={brl}
              tendencia={`${totais?.perda.toFixed(0) ?? 0} unidades perdidas`}
              variante={(totais?.custoPerda ?? 0) > 0 ? 'red' : 'amber'}
            />
            <KpiCard
              label="Estoque Baixo"
              valor={String(data.estoqueAlerta.length)}
              raw={data.estoqueAlerta.length}
              formatarValor={n => String(Math.round(n))}
              tendencia={`ingrediente${data.estoqueAlerta.length !== 1 ? 's' : ''} abaixo do mínimo`}
              variante={data.estoqueAlerta.length > 0 ? 'yellow' : 'amber'}
            />
            <KpiCard
              label="Taxa de Venda da Produção"
              valor={pct(sellThrough)}
              raw={sellThrough}
              formatarValor={n => `${n.toFixed(1)}%`}
              tendencia={`${totalVendidoGeral.toFixed(0)} vendidos de ${totalProduzidoGeral.toFixed(0)} produzidos`}
              variante={sellThrough >= 80 ? 'green' : sellThrough >= 60 ? 'yellow' : 'red'}
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
                <div className="flex items-center gap-5 flex-wrap">
                  {([
                    { cor: COR.verde,    label: 'Vendido'  },
                    { cor: COR.vermelho, label: 'Perda'    },
                    { cor: COR.pedra,    label: 'Restante' },
                  ] as const).map(({ cor, label }) => (
                    <span key={label} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--ada-muted)' }}>
                      <span className="inline-block w-[14px] h-[6px] rounded-[2px] shrink-0" style={{ background: cor }} />
                      {label}
                    </span>
                  ))}
                </div>
              }
            >
              <ReactECharts option={optionProdVendas} style={{ height: 300 }} notMerge lazyUpdate />
            </ChartContainer>

            {/* Margem de lucro */}
            {chartMargem.length === 0 ? (
              <ChartContainer titulo="Margem de Lucro por Produto" subtitulo="Rentabilidade no período" vazio />
            ) : chartMargem.length === 1 ? (
              // KPI card para produto único
              <ChartContainer titulo="Margem de Lucro por Produto" subtitulo="Rentabilidade no período">
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--ada-muted)' }}>{chartMargem[0].nome}</p>
                  <p className="text-7xl font-bold leading-none" style={{ color: margemCor(chartMargem[0].margem) }}>
                    {pct(chartMargem[0].margem)}
                  </p>
                  <span
                    className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: margemCor(chartMargem[0].margem) }}
                  >
                    {chartMargem[0].margem >= 30 ? '✓ Excelente' : chartMargem[0].margem >= 0 ? '~ Regular' : '✗ Negativa'}
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>margem de lucro estimada</p>
                </div>
              </ChartContainer>
            ) : (
              // Horizontal ranking com busca e top 10 padrão
              <ChartContainer
                titulo="Margem de Lucro por Produto"
                subtitulo={
                  buscaMargem.trim()
                    ? `${chartMargemFiltrado.length} produto${chartMargemFiltrado.length !== 1 ? 's' : ''} encontrado${chartMargemFiltrado.length !== 1 ? 's' : ''}`
                    : `Top 10 de ${chartMargem.length} — ordenado do maior para o menor`
                }
                rodape={
                  <div className="flex items-center gap-5 flex-wrap">
                    {([
                      { cor: '#10b981', label: '≥ 30% — Excelente' },
                      { cor: '#f59e0b', label: '0–30% — Regular'   },
                      { cor: '#f43f5e', label: '< 0% — Negativa'   },
                    ] as const).map(({ cor, label }) => (
                      <span key={label} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--ada-muted)' }}>
                        <span className="inline-block w-[14px] h-[6px] rounded-[2px] shrink-0" style={{ background: cor }} />
                        {label}
                      </span>
                    ))}
                  </div>
                }
              >
                {/* Busca inline */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                    padding: '7px 12px',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--ada-border)',
                    borderRadius: 9,
                  }}
                >
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, color: 'var(--ada-muted)' }}
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    type="text"
                    placeholder={`Buscar entre ${chartMargem.length} produtos…`}
                    value={buscaMargem}
                    onChange={e => setBuscaMargem(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      fontSize: 12.5,
                      color: 'var(--ada-heading)',
                      fontFamily: 'DM Sans, system-ui, sans-serif',
                    }}
                  />
                  {buscaMargem && (
                    <button
                      type="button"
                      onClick={() => setBuscaMargem('')}
                      aria-label="Limpar busca"
                      style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ada-muted)', padding: 0, flexShrink: 0 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {chartMargemFiltrado.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-1.5" style={{ color: 'var(--ada-placeholder)' }}>
                    <p className="text-[12px]">Nenhum produto para "{buscaMargem}".</p>
                  </div>
                ) : (
                  <ReactECharts
                    option={optionMargem}
                    style={{ height: Math.max(200, chartMargemFiltrado.length * 44) }}
                    notMerge
                    lazyUpdate
                  />
                )}
              </ChartContainer>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartContainer
              titulo="Tendência Diária Financeira"
              subtitulo="Receita, custo e lucro por dia no período selecionado"
              vazio={(data.tendenciaDiaria?.length ?? 0) === 0}
            >
              <ReactECharts option={optionTendenciaDiaria} style={{ height: 320 }} notMerge lazyUpdate />
            </ChartContainer>

            <ChartContainer
              titulo="Taxa de Perda por Produto"
              subtitulo="Top produtos com maior percentual de perda no período"
              vazio={chartPerdaProduto.length === 0}
            >
              <ReactECharts
                option={optionPerdaProduto}
                style={{ height: Math.max(200, chartPerdaProduto.length * 44) }}
                notMerge
                lazyUpdate
              />
            </ChartContainer>

            <ChartContainer
              titulo="Mix de Receita por Produto"
              subtitulo="Participação de cada produto na receita estimada"
              vazio={chartMixReceita.length === 0}
            >
              <ReactECharts option={optionMixReceita} style={{ height: 320 }} notMerge lazyUpdate />
            </ChartContainer>
          </div>

          {/* ── Alertas de estoque ────────────────────────────────────── */}
          {data.estoqueAlerta.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-warning-border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: '1px solid var(--ada-warning-badge)', background: 'var(--ada-warning-bg)' }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                  style={{ background: '#D97706' }}
                  aria-hidden="true"
                />
                <h2
                  className="text-[13.5px] font-semibold flex-1"
                  style={{ color: '#92400E', fontFamily: 'Sora, system-ui, sans-serif' }}
                >
                  Ingredientes com Estoque Abaixo do Mínimo
                </h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--ada-warning-badge)', color: '#B45309', border: '1px solid var(--ada-warning-border)' }}
                >
                  {data.estoqueAlerta.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr style={{ background: 'var(--ada-warning-bg)', borderBottom: '1px solid var(--ada-warning-badge)' }}>
                      {[
                        { label: 'Ingrediente', right: false },
                        { label: 'Categoria',   right: false },
                        { label: 'Atual',        right: true  },
                        { label: 'Mínimo',       right: true  },
                        { label: 'Déficit',      right: true  },
                      ].map(({ label, right }) => (
                        <th
                          key={label}
                          scope="col"
                          className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-5 py-3 ${right ? 'text-right' : 'text-left'}`}
                          style={{ color: '#92580A' }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.estoqueAlerta.map((item, idx) => (
                      <tr
                        key={item.ingredienteId}
                        className="transition-colors duration-100"
                        style={{ borderBottom: idx < data.estoqueAlerta.length - 1 ? '1px solid var(--ada-warning-badge)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--ada-warning-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {item.nome}
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
                          {item.categoriaNome ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-right font-bold tabular-nums" style={{ color: '#DC2626' }}>
                          {item.estoqueAtual.toFixed(3)} {item.unidadeMedidaCodigo}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-right tabular-nums" style={{ color: 'var(--ada-muted)' }}>
                          {item.estoqueMinimo.toFixed(3)} {item.unidadeMedidaCodigo}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
                            style={{ background: 'var(--ada-error-bg)', color: '#DC2626', border: '1px solid var(--ada-error-border)' }}
                          >
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
            <div
              className="rounded-2xl py-20 text-center"
              style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-8 h-8" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}
              >
                Nenhum dado no período selecionado
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--ada-muted)' }}>
                Registre produções e vendas para visualizar o dashboard.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
