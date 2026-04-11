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

const inputCls = [
  'border rounded-lg px-3 py-2 text-sm outline-none',
  'transition-all duration-200',
  'border-[var(--ada-border)] bg-[var(--ada-surface)] text-[var(--ada-heading)]',
  'focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20',
].join(' ')

// SVG icons para os KPI cards
const IcReceita = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.798 7.45c.512-.67 1.135-.95 1.702-.95.567 0 1.19.28 1.702.95.27.352.568.504.865.451a.75.75 0 10-.254-1.478c-.41.071-.776-.056-1.09-.46C11.04 5.48 10.121 5 9.5 5c-.621 0-1.54.48-2.223 1.363-.683.882-.927 2.075-.51 3.225.42 1.156 1.474 1.912 2.733 1.912h.75v1.75a.75.75 0 001.5 0V11.5h.25a.75.75 0 000-1.5h-3a.75.75 0 00-.702 1.013c-.23-.636-.1-1.38.25-1.563z" clipRule="evenodd"/>
  </svg>
)
const IcLucro = (up: boolean) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    {up
      ? <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.53.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd"/>
      : <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z" clipRule="evenodd"/>
    }
  </svg>
)
const IcPerda = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
  </svg>
)
const IcAlerta = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
  </svg>
)
const IcEficiência = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.78 5.47a.75.75 0 10-1.06-1.06L9.25 9.88 7.78 8.41a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.999-4z" clipRule="evenodd"/>
  </svg>
)

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

// ─── DashboardCard ──────────────────────────────────────────────────────────
interface DashboardCardProps {
  titulo: string
  valor: string
  subtexto: string
  variante?: 'default' | 'positivo' | 'negativo' | 'alerta'
  icone?: React.ReactNode
}

function DashboardCard({ titulo, valor, subtexto, variante = 'default', icone }: DashboardCardProps) {
  const vByVariant = {
    default:  { border: 'var(--ada-border)', iconBg: 'var(--ada-bg)',  iconColor: 'var(--ada-muted)',  valorColor: 'var(--ada-heading)' },
    positivo: { border: '#BBF7D0', iconBg: '#F0FDF4',  iconColor: '#16A34A',  valorColor: '#15803D' },
    negativo: { border: 'var(--ada-error-border)', iconBg: 'var(--ada-error-bg)',  iconColor: '#DC2626',  valorColor: '#DC2626' },
    alerta:   { border: 'var(--ada-warning-border)', iconBg: 'var(--ada-warning-bg)',  iconColor: '#D97706',  valorColor: '#B45309' },
  } as const
  const v = vByVariant[variante]

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: 'var(--ada-surface)',
        border: `1px solid ${v.border}`,
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}
    >
      <div className="flex items-start justify-between mb-4">
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.08em] leading-tight"
          style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {titulo}
        </p>
        {icone && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: v.iconBg, border: `1px solid ${v.border}` }}
            aria-hidden="true"
          >
            <span style={{ color: v.iconColor }}>{icone}</span>
          </div>
        )}
      </div>
      <p
        className="text-[26px] font-bold leading-none mb-2 tracking-tight"
        style={{ color: v.valorColor, fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {valor}
      </p>
      <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>{subtexto}</p>
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="px-6 py-4"
        style={{ borderBottom: '1px solid var(--ada-hover)' }}
      >
        <h2
          className="text-[13.5px] font-semibold"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {titulo}
        </h2>
        {subtitulo && (
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {subtitulo}
          </p>
        )}
      </div>
      <div className="px-6 py-5">
        {vazio ? (
          <div
            className="flex flex-col items-center justify-center h-52 gap-3"
            style={{ color: 'var(--ada-placeholder)' }}
          >
            <svg className="w-10 h-10 opacity-50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 17l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm" style={{ color: 'var(--ada-placeholder)' }}>Sem dados no período selecionado.</p>
          </div>
        ) : children}
        {rodape && <div className="mt-4">{rodape}</div>}
      </div>
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
    backgroundColor: isDark ? '#1A1814' : '#ffffff',
    borderColor:     isDark ? '#2C2620' : '#e7e5e4',
    textColor:       isDark ? '#EDE5D8' : '#292524',
  }), [isDark])
  const chartAxis = useMemo(() => ({
    axisColor:  isDark ? '#7A7068' : '#a8a29e',
    bodyColor:  isDark ? '#B5ABA0' : '#78716c',
    labelColor: isDark ? '#B5ABA0' : '#57534e',
    gridColor:  isDark ? '#2C2620' : '#f5f5f4',
  }), [isDark])

  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
    .map(i => ({ nome: nomeCurto(i.produtoNome), margem: Number(i.margemLucro!.toFixed(1)) }))
    .sort((a, b) => b.margem - a.margem) ?? []

  const margemCor = (v: number) => v >= 30 ? COR.verde : v >= 0 ? COR.laranja : COR.vermelho

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

  const optionProdVendas: EChartsOption = {
    color: [COR.verde, COR.vermelho, COR.pedra],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: chartTooltip.backgroundColor,
      borderColor: chartTooltip.borderColor,
      borderWidth: 1,
      textStyle: { color: chartTooltip.textColor },
      formatter: (params: any) => {
        const linhas = Array.isArray(params) ? params : [params]
        const row = linhas[0]?.data ?? {}
        return `
          <div style="min-width:220px;padding:2px 0;">
            <div style="font-weight:700;margin-bottom:8px;">${linhas[0]?.axisValue ?? ''}</div>
            ${linhas.map((p: any) => `
              <div style="display:flex;justify-content:space-between;gap:20px;margin:2px 0;">
                <span>${p.marker}${p.seriesName}</span>
                <strong>${Number(p.value).toFixed(0)} un.</strong>
              </div>
            `).join('')}
            <div style="border-top:1px solid #f5f5f4;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;">
              <span>Total produzido</span>
              <strong>${Number(row.totalProduzido ?? 0).toFixed(0)} un.</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span>Receita est.</span>
              <strong style="color:#15803d;">${brl(Number(row.receitaEstimada ?? 0))}</strong>
            </div>
          </div>
        `
      },
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: chartAxis.bodyColor, fontSize: 11 },
    },
    grid: { left: 24, right: 12, top: 20, bottom: 64, containLabel: true },
    xAxis: {
      type: 'category',
      data: chartProdVendas.map(i => i.nome),
      axisLabel: { rotate: 30, color: chartAxis.axisColor, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: chartAxis.axisColor, fontSize: 11 },
      splitLine: { lineStyle: { color: chartAxis.gridColor } },
    },
    series: [
      { name: 'Vendido', type: 'bar', stack: 'total', data: chartProdVendas.map(i => i.Vendido), barMaxWidth: 34, emphasis: { focus: 'series' } },
      { name: 'Perda', type: 'bar', stack: 'total', data: chartProdVendas.map(i => i.Perda), barMaxWidth: 34, emphasis: { focus: 'series' } },
      {
        name: 'Restante',
        type: 'bar',
        stack: 'total',
        data: chartProdVendas.map(i => ({ value: i.Restante, totalProduzido: i.totalProduzido, receitaEstimada: i.receitaEstimada })),
        barMaxWidth: 34,
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
    ],
  }

  const optionMargem: EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTooltip.backgroundColor,
      borderColor: chartTooltip.borderColor,
      borderWidth: 1,
      textStyle: { color: chartTooltip.textColor },
      formatter: (p: any) => `${p.name}<br/><strong style="color:${margemCor(Number(p.value))}">${pct(Number(p.value))}</strong>`,
    },
    grid: { left: 20, right: 56, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: chartAxis.axisColor, formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: chartAxis.gridColor } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: chartMargem.map(i => i.nome),
      axisLabel: { color: chartAxis.bodyColor, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Margem',
        type: 'bar',
        data: chartMargem.map(i => ({
          value: i.margem,
          itemStyle: { color: margemCor(i.margem), borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'right', formatter: `${pct(i.margem)}`, color: chartAxis.labelColor, fontWeight: 600, fontSize: 11 },
        })),
        barMaxWidth: 26,
      },
    ],
  }

  const optionPerdaProduto: EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTooltip.backgroundColor,
      borderColor: chartTooltip.borderColor,
      borderWidth: 1,
      formatter: (p: any) => `${p.name}<br/><strong>${Number(p.value).toFixed(1)}%</strong> de perda`,
    },
    grid: { left: 20, right: 24, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: chartAxis.axisColor, formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: chartAxis.gridColor } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: chartPerdaProduto.map(i => i.nome),
      axisLabel: { color: chartAxis.bodyColor, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: chartPerdaProduto.map(i => ({
          value: i.perdaPct,
          itemStyle: { color: '#ef4444', borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'right', formatter: `${i.perdaPct}%`, color: '#7f1d1d', fontWeight: 600, fontSize: 11 },
        })),
        barMaxWidth: 24,
      },
    ],
  }

  const optionMixReceita: EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTooltip.backgroundColor,
      borderColor: chartTooltip.borderColor,
      borderWidth: 1,
      formatter: (p: any) => `${p.name}<br/><strong>${brl(Number(p.value))}</strong> (${Number(p.percent).toFixed(1)}%)`,
    },
    legend: {
      bottom: 0,
      type: 'scroll',
      textStyle: { color: chartAxis.bodyColor, fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { color: chartAxis.labelColor, fontSize: 11, formatter: '{d}%' },
        data: chartMixReceita.map(i => ({ name: nomeCurto(i.nome), value: i.receita })),
      },
    ],
    color: ['#22c55e', '#16a34a', '#65a30d', '#0ea5e9', '#6366f1', '#8b5cf6', '#a8a29e'],
  }

  const optionTendenciaDiaria: EChartsOption = {
    color: [COR.verde, COR.vermelho, COR.azul],
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartTooltip.backgroundColor,
      borderColor: chartTooltip.borderColor,
      borderWidth: 1,
      formatter: (params: any) => {
        const linhas = Array.isArray(params) ? params : [params]
        return `
          <div style="min-width:200px;">
            <div style="font-weight:700;margin-bottom:8px;">${linhas[0]?.axisValue ?? ''}</div>
            ${linhas.map((p: any) => `
              <div style="display:flex;justify-content:space-between;gap:20px;margin:2px 0;">
                <span>${p.marker}${p.seriesName}</span>
                <strong>${brl(Number(p.value))}</strong>
              </div>
            `).join('')}
          </div>
        `
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: chartAxis.bodyColor, fontSize: 11 },
    },
    grid: { left: 20, right: 20, top: 44, bottom: 12, containLabel: true },
    xAxis: {
      type: 'category',
      data: (data?.tendenciaDiaria ?? []).map(i => formatarDataBr(i.data)),
      axisLabel: { color: chartAxis.axisColor, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: chartAxis.axisColor, formatter: (v: number) => brl(v).replace('R$', 'R$ ') },
      splitLine: { lineStyle: { color: chartAxis.gridColor } },
    },
    series: [
      {
        name: 'Receita',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: (data?.tendenciaDiaria ?? []).map(i => Number(i.receita.toFixed(2))),
      },
      {
        name: 'Custo',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: (data?.tendenciaDiaria ?? []).map(i => Number(i.custo.toFixed(2))),
      },
      {
        name: 'Lucro',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: (data?.tendenciaDiaria ?? []).map(i => Number(i.lucro.toFixed(2))),
        areaStyle: { opacity: 0.08 },
      },
    ],
  }

  return (
    <div className="ada-page space-y-6 max-w-[1280px] mx-auto">

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: '1.375rem', color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.025em' }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>Visão geral do período selecionado</p>
        </div>
        <div
          className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3 p-3 rounded-xl"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div>
            <label
              htmlFor="dash-de"
              className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1"
              style={{ color: 'var(--ada-muted)' }}
            >
              De
            </label>
            <input
              id="dash-de"
              type="date"
              value={de}
              onChange={e => setDe(e.target.value)}
              className={inputCls}
              name="de"
            />
          </div>
          <div>
            <label
              htmlFor="dash-ate"
              className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1"
              style={{ color: 'var(--ada-muted)' }}
            >
              Até
            </label>
            <input
              id="dash-ate"
              type="date"
              value={ate}
              onChange={e => setAte(e.target.value)}
              className={inputCls}
              name="ate"
            />
          </div>
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
            <DashboardCard
              titulo="Receita Estimada"
              valor={brl(totais?.receita ?? 0)}
              subtexto="total no período"
              variante="positivo"
              icone={<IcReceita />}
            />
            <DashboardCard
              titulo="Lucro Estimado"
              valor={brl(lucroEstimado)}
              subtexto={`Margem geral: ${pct(margemGeral)}`}
              variante={lucroEstimado >= 0 ? 'positivo' : 'negativo'}
              icone={IcLucro(lucroEstimado >= 0)}
            />
            <DashboardCard
              titulo="Custo de Perdas"
              valor={brl(totais?.custoPerda ?? 0)}
              subtexto={`${totais?.perda.toFixed(0) ?? 0} unidades perdidas`}
              variante={(totais?.custoPerda ?? 0) > 0 ? 'negativo' : 'default'}
              icone={<IcPerda />}
            />
            <DashboardCard
              titulo="Estoque Baixo"
              valor={String(data.estoqueAlerta.length)}
              subtexto={`ingrediente${data.estoqueAlerta.length !== 1 ? 's' : ''} abaixo do mínimo`}
              variante={data.estoqueAlerta.length > 0 ? 'alerta' : 'default'}
              icone={<IcAlerta />}
            />
            <DashboardCard
              titulo="Taxa de Venda da Produção"
              valor={pct(sellThrough)}
              subtexto={`${totalVendidoGeral.toFixed(0)} vendidos de ${totalProduzidoGeral.toFixed(0)} produzidos`}
              variante={sellThrough >= 80 ? 'positivo' : sellThrough >= 60 ? 'alerta' : 'negativo'}
              icone={<IcEficiência />}
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
              <ReactECharts option={optionProdVendas} style={{ height: 320 }} notMerge lazyUpdate />
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
                <ReactECharts
                  option={optionMargem}
                  style={{ height: Math.max(240, chartMargem.length * 52) }}
                  notMerge
                  lazyUpdate
                />
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
                style={{ height: Math.max(240, chartPerdaProduto.length * 48) }}
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
