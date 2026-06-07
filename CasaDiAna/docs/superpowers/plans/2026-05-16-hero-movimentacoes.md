# Hero Operações — MovimentacoesPage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the full `hero_operations.html` design to the MovimentacoesPage: two-column hero layout with live clock, KPI grid (count-up + sparklines), compact auto-scrolling stream with tabs, and animated SVG bar chart by hour.

**Architecture:** Four focused files — `KpiMovimentacoes.tsx` computes stats from props and renders 4 KPI cards; `ChartMovimentacoes.tsx` groups movimentações by hour and renders an animated SVG bar chart; `StreamAutoScroll.tsx` renders a compact flat list with CSS scroll animation and tab filters; `MovimentacoesPage.tsx` wires everything into the two-column hero layout with live clock and eyebrow. `StreamMovimentacoes.tsx` (grouped-by-date view) is left untouched.

**Tech Stack:** React 18, TypeScript, `@heroicons/react/24/outline`, CSS custom properties (`--ada-*`), Sora + DM Sans fonts, SVG `<animate>` for bar chart, CSS keyframes injected via `<style>` for stream scroll.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/features/relatorios/components/KpiMovimentacoes.tsx` | Create | 4 KPI cards (total, entradas, saídas, ajustes) with count-up animation and sparklines |
| `frontend/src/features/relatorios/components/ChartMovimentacoes.tsx` | Create | Animated SVG bar chart grouping movimentações by hour |
| `frontend/src/features/relatorios/components/StreamAutoScroll.tsx` | Create | Compact auto-scroll stream: flat list + CSS keyframe scroll + tab filters |
| `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx` | Modify | Replace PageHeader with full two-column hero layout; wire all new components |

---

## Type reference (DO NOT redefine)

```ts
// frontend/src/types/estoque.ts
export interface MovimentacaoRelatorio {
  id: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  tipo: string  // 'Entrada' | 'AjustePositivo' | 'AjusteNegativo' | 'SaidaProducao'
  quantidade: number
  saldoApos: number
  referenciaTipo: string | null
  referenciaId: string | null
  criadoEm: string  // ISO datetime e.g. "2026-05-16T14:30:00"
}
```

Color constants (use as-is, do not map to tokens — these are intentional semantic colors):
```
amber: #D4960C  amber-bg: rgba(212,150,12,.12)
green: #4ADE80  green-bg: rgba(74,222,128,.12)
blue:  #60A5FA  blue-bg:  rgba(96,165,250,.12)
red:   #F87171  red-bg:   rgba(248,113,113,.12)
purple:#A78BFA
```

---

## Task 1: Create KpiMovimentacoes

**Files:**
- Create: `frontend/src/features/relatorios/components/KpiMovimentacoes.tsx`

- [ ] **Step 1: Create the file with complete implementation**

Write `frontend/src/features/relatorios/components/KpiMovimentacoes.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import type { MovimentacaoRelatorio } from '@/types/estoque'

function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    let start: number | null = null
    function step(ts: number) {
      if (!start) start = ts
      const t = Math.min((ts - start) / 1100, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = Math.round(eased * target).toLocaleString('pt-BR')
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return ref
}

const SPARKLINE: Record<string, string> = {
  amber:  'M0 22 L12 20 L24 18 L36 16 L48 17 L60 12 L72 14 L84 8 L100 5',
  green:  'M0 22 L12 18 L24 20 L36 14 L48 12 L60 10 L72 8 L84 9 L100 4',
  blue:   'M0 20 L12 18 L24 22 L36 14 L48 15 L60 10 L72 12 L84 6 L100 8',
  red:    'M0 18 L12 22 L24 17 L36 23 L48 18 L60 21 L72 15 L84 18 L100 12',
}

const COLOR: Record<string, string> = {
  amber: '#D4960C',
  green: '#4ADE80',
  blue:  '#60A5FA',
  red:   '#F87171',
}

interface CardProps {
  label: string
  value: number
  delta: string
  variante: 'amber' | 'green' | 'blue' | 'red'
}

function KpiCard({ label, value, delta, variante }: CardProps) {
  const ref = useCountUp(value)
  const color = COLOR[variante]
  return (
    <div style={{
      position: 'relative', padding: '14px 16px',
      background: 'var(--ada-surface-2)', border: '1px solid var(--ada-border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.7,
      }} />
      <div style={{
        fontSize: 9.5, fontWeight: 500, textTransform: 'uppercase' as const,
        letterSpacing: '0.14em', color: 'var(--ada-muted)',
        fontFamily: 'Sora, system-ui, sans-serif', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'var(--ada-heading)',
        fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums' as const, lineHeight: 1,
      }}>
        <span ref={ref}>0</span>
      </div>
      <div style={{
        marginTop: 6, fontSize: 10.5, color,
        fontFamily: 'Sora, system-ui, sans-serif',
      }}>
        {delta}
      </div>
      <svg
        viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, opacity: 0.35 }}
      >
        <path d={SPARKLINE[variante]} stroke={color} strokeWidth={1.5} fill="none" />
      </svg>
    </div>
  )
}

export function KpiMovimentacoes({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const total    = movimentacoes.length
  const entradas = movimentacoes.filter(m => m.tipo === 'Entrada').length
  const saidas   = movimentacoes.filter(m => m.tipo === 'SaidaProducao').length
  const ajustes  = movimentacoes.filter(m => m.tipo === 'AjustePositivo' || m.tipo === 'AjusteNegativo').length
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      <KpiCard label="Total"           value={total}    delta="no período"          variante="amber" />
      <KpiCard label="Entradas"        value={entradas} delta="ingredientes"         variante="green" />
      <KpiCard label="Saídas Produção" value={saidas}   delta="itens baixados"       variante="blue"  />
      <KpiCard label="Ajustes"         value={ajustes}  delta="positivos + negativos" variante="red"   />
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/relatorios/components/KpiMovimentacoes.tsx
git commit -m "feat(relatorios): add KpiMovimentacoes cards with count-up animation"
```

---

## Task 2: Create ChartMovimentacoes

**Files:**
- Create: `frontend/src/features/relatorios/components/ChartMovimentacoes.tsx`

- [ ] **Step 1: Create the file with complete implementation**

Write `frontend/src/features/relatorios/components/ChartMovimentacoes.tsx`:

```tsx
import type { MovimentacaoRelatorio } from '@/types/estoque'

interface HourBucket { hour: number; entradas: number; saidas: number }

function agruparPorHora(movs: MovimentacaoRelatorio[]): HourBucket[] {
  const map: Record<number, HourBucket> = {}
  for (const m of movs) {
    const h = new Date(m.criadoEm).getHours()
    if (!map[h]) map[h] = { hour: h, entradas: 0, saidas: 0 }
    if (m.tipo === 'Entrada' || m.tipo === 'AjustePositivo') map[h].entradas++
    else map[h].saidas++
  }
  return Object.values(map).sort((a, b) => a.hour - b.hour).slice(-12)
}

export function ChartMovimentacoes({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const dados = agruparPorHora(movimentacoes)
  const totalEntradas = movimentacoes.filter(m => m.tipo === 'Entrada' || m.tipo === 'AjustePositivo').length
  const totalSaidas   = movimentacoes.filter(m => m.tipo === 'SaidaProducao' || m.tipo === 'AjusteNegativo').length

  const W = 600, H = 140, PAD = 10
  const barW  = dados.length > 0 ? (W - PAD * 2) / dados.length : 40
  const innerW = barW * 0.32
  const gap    = 3
  const max    = Math.max(...dados.flatMap(d => [d.entradas, d.saidas]), 1) + 2

  return (
    <div style={{
      background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
      borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)', flex: 1,
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 30% at 50% 0%, rgba(212,150,12,.06), transparent 100%)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Movimentação por hora
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' as const }}>
            {movimentacoes.length.toLocaleString('pt-BR')}
            <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 500, marginLeft: 6 }}>movimentações</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, alignItems: 'flex-end' }}>
          {[['#D4960C', 'Entradas & Ajust.+'], ['#A78BFA', 'Saídas & Ajust.-']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {dados.length > 0 ? (
        <div style={{ position: 'relative', height: 140 }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="barInMov" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#FFC857" />
                <stop offset="1" stopColor="#D4960C" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="barOutMov" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#A78BFA" />
                <stop offset="1" stopColor="#7C3AED" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {[30, 70, 110].map(y => (
              <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--ada-border-sub)" strokeDasharray="2 4" />
            ))}
            {dados.map((d, i) => {
              const cx   = PAD + i * barW + barW / 2
              const hIn  = (d.entradas / max) * (H - 20)
              const hOut = (d.saidas   / max) * (H - 20)
              return (
                <g key={d.hour}>
                  <rect x={cx - innerW - gap / 2} y={H - 15 - hIn}  width={innerW} height={hIn}  rx={2} fill="url(#barInMov)">
                    <animate attributeName="height" from="0" to={hIn}  dur="800ms" fill="freeze" begin={`${i * 40}ms`}      calcMode="spline" keySplines="0.4 0 0.2 1" />
                    <animate attributeName="y"      from={H - 15} to={H - 15 - hIn}  dur="800ms" fill="freeze" begin={`${i * 40}ms`}      calcMode="spline" keySplines="0.4 0 0.2 1" />
                  </rect>
                  <rect x={cx + gap / 2}           y={H - 15 - hOut} width={innerW} height={hOut} rx={2} fill="url(#barOutMov)">
                    <animate attributeName="height" from="0" to={hOut} dur="800ms" fill="freeze" begin={`${i * 40 + 80}ms`} calcMode="spline" keySplines="0.4 0 0.2 1" />
                    <animate attributeName="y"      from={H - 15} to={H - 15 - hOut} dur="800ms" fill="freeze" begin={`${i * 40 + 80}ms`} calcMode="spline" keySplines="0.4 0 0.2 1" />
                  </rect>
                  <text x={cx} y={H - 2} textAnchor="middle"
                    style={{ fontSize: 9, fill: 'var(--ada-placeholder)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '0.08em' }}>
                    {String(d.hour).padStart(2, '0')}h
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      ) : (
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ada-muted)', fontSize: 13 }}>
          Sem dados no período
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ada-border-sub)' }}>
        {[
          { label: 'Entradas & Ajust.+', value: totalEntradas, color: '#D4960C' },
          { label: 'Saídas & Ajust.-',   value: totalSaidas,   color: '#A78BFA' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 9.5, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ada-placeholder)', fontFamily: 'Sora, system-ui, sans-serif', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color, fontFamily: 'Sora, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' as const }}>
              {value.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/relatorios/components/ChartMovimentacoes.tsx
git commit -m "feat(relatorios): add ChartMovimentacoes animated SVG bar chart by hour"
```

---

## Task 3: Create StreamAutoScroll

**Files:**
- Create: `frontend/src/features/relatorios/components/StreamAutoScroll.tsx`

**Design:**
- Header: pulsing green dot + "Stream de operações" + tab buttons (Todas | Entradas | Saídas | Ajustes)
- Body: flat list (most-recent-first), duplicated for seamless scroll loop
- CSS keyframe scroll injected via `<style>` tag (not module — project uses inline styles)
- Fade mask at top and bottom via `maskImage`
- Scroll pauses on hover
- Each row: `HH:MM | [icon badge] | ingredienteNome (unidade) · tipo label | +/-qty`
- Only scrolls if more than 5 items (avoids choppy animation on tiny lists)

TIPO_VIS is already defined in `StreamMovimentacoes.tsx`. DO NOT import from there (would couple files). Define a minimal local version for the row format needed here.

- [ ] **Step 1: Create the file with complete implementation**

Write `frontend/src/features/relatorios/components/StreamAutoScroll.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import type { MovimentacaoRelatorio } from '@/types/estoque'

type Tab = 'todas' | 'entradas' | 'saidas' | 'ajustes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'todas',    label: 'Todas'    },
  { id: 'entradas', label: 'Entradas' },
  { id: 'saidas',   label: 'Saídas'   },
  { id: 'ajustes',  label: 'Ajustes'  },
]

interface RowVis {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  iconColor: string
  iconBg: string
  sinal: '+' | '-'
  valorColor: string
  badgeLabel: string
  badgeBg: string
  badgeColor: string
}

const ROW_VIS: Record<string, RowVis> = {
  Entrada:        { Icon: ArrowUpIcon,   iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,.14)',   sinal: '+', valorColor: '#4ADE80', badgeLabel: 'Entrada',        badgeBg: 'rgba(74,222,128,.10)',   badgeColor: '#16A34A' },
  AjustePositivo: { Icon: ArrowUpIcon,   iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.14)',   sinal: '+', valorColor: '#D4960C', badgeLabel: 'Ajuste +',       badgeBg: 'rgba(212,150,12,.10)',  badgeColor: '#92580A' },
  AjusteNegativo: { Icon: ArrowDownIcon, iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.14)',   sinal: '-', valorColor: '#F87171', badgeLabel: 'Ajuste −',       badgeBg: 'rgba(212,150,12,.10)',  badgeColor: '#92580A' },
  SaidaProducao:  { Icon: ArrowDownIcon, iconColor: '#F87171', iconBg: 'rgba(248,113,113,.14)',  sinal: '-', valorColor: '#F87171', badgeLabel: 'Saída Produção', badgeBg: 'rgba(220,38,38,.10)',   badgeColor: '#DC2626' },
}

const FALLBACK_ROW: RowVis = {
  Icon: ArrowUpIcon, iconColor: 'var(--ada-muted)', iconBg: 'var(--ada-surface-2)',
  sinal: '+', valorColor: 'var(--ada-body)',
  badgeLabel: '—', badgeBg: 'var(--ada-surface-2)', badgeColor: 'var(--ada-muted)',
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function StreamRow({ m }: { m: MovimentacaoRelatorio }) {
  const vis = ROW_VIS[m.tipo] ?? FALLBACK_ROW
  const { Icon } = vis
  return (
    <li style={{
      display: 'grid', gridTemplateColumns: '48px 28px 1fr auto',
      gap: 12, alignItems: 'center', padding: '9px 18px',
      borderLeft: '2px solid transparent',
      transition: 'background 120ms, border-color 120ms',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLLIElement
        el.style.background = 'var(--ada-hover)'
        el.style.borderLeftColor = '#D4960C'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLLIElement
        el.style.background = 'transparent'
        el.style.borderLeftColor = 'transparent'
      }}
    >
      <span style={{ fontSize: 10.5, color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' as const, letterSpacing: '0.04em' }}>
        {formatHora(m.criadoEm)}
      </span>
      <div aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: vis.iconBg, flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color: vis.iconColor, strokeWidth: 2.5 }} />
      </div>
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <span style={{ fontSize: 13, color: 'var(--ada-heading)', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          <span style={{ color: 'var(--ada-muted)', marginRight: 4 }}>{vis.badgeLabel} ·</span>
          {m.ingredienteNome}
          <span style={{ fontSize: 11, color: 'var(--ada-placeholder)', marginLeft: 4 }}>({m.unidadeMedidaCodigo})</span>
        </span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: vis.valorColor, fontFamily: 'Sora, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' as const, flexShrink: 0 }}>
        {vis.sinal}{m.quantidade}
      </span>
    </li>
  )
}

export function StreamAutoScroll({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const [tab, setTab] = useState<Tab>('todas')

  const filtered = useMemo(() => {
    const sorted = [...movimentacoes].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    if (tab === 'todas')    return sorted
    if (tab === 'entradas') return sorted.filter(m => m.tipo === 'Entrada')
    if (tab === 'saidas')   return sorted.filter(m => m.tipo === 'SaidaProducao')
    return sorted.filter(m => m.tipo === 'AjustePositivo' || m.tipo === 'AjusteNegativo')
  }, [movimentacoes, tab])

  const shouldScroll = filtered.length > 5
  const items = shouldScroll ? [...filtered, ...filtered] : filtered

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, background: 'var(--ada-surface-2)', border: '1px solid var(--ada-border-sub)', borderRadius: 16, overflow: 'hidden', minHeight: 320 }}>
      <style>{`
        @keyframes stream-scroll-up {
          from { transform: translateY(0) }
          to   { transform: translateY(-50%) }
        }
        .stream-auto-list-scroll {
          animation: stream-scroll-up 32s linear infinite;
        }
        .stream-auto-list-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--ada-border-sub)' }}>
        <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ada-body)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-label="ao vivo" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80', display: 'inline-block', animation: 'stream-pulse 1.6s ease infinite' }} />
          Stream de operações
        </span>
        <style>{`
          @keyframes stream-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.4)} }
        `}</style>
        <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', borderRadius: 8 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 11.5, fontWeight: 500,
                background: tab === t.id ? 'var(--ada-surface-2)' : 'transparent',
                color: tab === t.id ? '#D4960C' : 'var(--ada-muted)',
                transition: 'all 150ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stream body */}
      <div style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        maskImage: 'linear-gradient(180deg, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' as const, color: 'var(--ada-muted)', fontSize: 13 }}>
            Nenhuma movimentação nesta categoria.
          </div>
        ) : (
          <ul
            className={shouldScroll ? 'stream-auto-list-scroll' : undefined}
            style={{ listStyle: 'none', padding: '8px 0', display: 'flex', flexDirection: 'column' as const }}
          >
            {items.map((m, i) => <StreamRow key={`${m.id}-${i}`} m={m} />)}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/relatorios/components/StreamAutoScroll.tsx
git commit -m "feat(relatorios): add StreamAutoScroll compact hero-style feed with tab filters"
```

---

## Task 4: Rewrite MovimentacoesPage with hero layout

**Files:**
- Modify: `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx`

**Design:**
Two-column grid (`1.35fr 1fr`):
- LEFT (ops-shell): amber glow overlay + grid pattern + eyebrow (pulsing dot) + title + live clock + KPI grid + StreamAutoScroll
- RIGHT: FiltrosMovimentacoes + ChartMovimentacoes + PDF download button

Loading/error/empty states render inside the LEFT panel where the stream would be.
The `PageHeader` component is removed — replaced by the custom hero header.
The live clock uses a `useLiveClock` hook defined in the page (local, not shared — YAGNI).

- [ ] **Step 1: Read the current file to verify imports and handlers**

Read `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx` (already done — 116 lines, structure is clear).

- [ ] **Step 2: Write the new file**

Write `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx`:

```tsx
import { useEffect, useState, useMemo } from 'react'
import { ArrowDownTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { gerarPdfMovimentacoes } from '@/lib/pdf'
import { FiltrosMovimentacoes } from '../components/FiltrosMovimentacoes'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiMovimentacoes } from '../components/KpiMovimentacoes'
import { ChartMovimentacoes } from '../components/ChartMovimentacoes'
import { StreamAutoScroll } from '../components/StreamAutoScroll'
import type { MovimentacaoRelatorio, IngredienteResumo } from '@/types/estoque'

function hoje(): string { return new Date().toISOString().split('T')[0] }
function ha30Dias(): string {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
}

function useLiveClock() {
  const [hora, setHora]   = useState('')
  const [data, setData]   = useState('')
  useEffect(() => {
    function tick() {
      const n = new Date()
      setHora(n.toLocaleTimeString('pt-BR'))
      const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      setData(`${dias[n.getDay()]} · ${String(n.getDate()).padStart(2,'0')} ${meses[n.getMonth()]} ${n.getFullYear()}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return { hora, data }
}

export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRelatorio[]>([])
  const [ingredientes, setIngredientes]   = useState<IngredienteResumo[]>([])
  const [loading, setLoading]             = useState(false)
  const [erro, setErro]                   = useState<string | null>(null)
  const [de, setDe]                       = useState(ha30Dias)
  const [ate, setAte]                     = useState(hoje)
  const [tipos, setTipos]                 = useState<string[]>([])
  const [ingredienteIds, setIngredienteIds] = useState<string[]>([])
  const [busca, setBusca]                 = useState('')
  const { hora, data } = useLiveClock()

  const carregar = async (
    filtroDe = de, filtroAte = ate,
    filtroTipos = tipos, filtroIngredienteIds = ingredienteIds
  ) => {
    setLoading(true); setErro(null)
    try {
      const d = await relatoriosService.movimentacoes(
        filtroDe, filtroAte,
        filtroTipos.length > 0 ? filtroTipos : undefined,
        filtroIngredienteIds.length > 0 ? filtroIngredienteIds : undefined
      )
      setMovimentacoes(d)
    } catch { setErro('Erro ao carregar movimentações.') }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    carregar()
  }, [])

  const handleDeChange  = (v: string)   => { setDe(v);  carregar(v,  ate, tipos, ingredienteIds) }
  const handleAteChange = (v: string)   => { setAte(v); carregar(de, v,   tipos, ingredienteIds) }
  const handleTipoChange = (vs: string[]) => { setTipos(vs);          carregar(de, ate, vs, ingredienteIds) }
  const handleIngredienteChange = (vs: string[]) => { setIngredienteIds(vs); carregar(de, ate, tipos, vs) }

  const movimentacoesFiltradas = useMemo(() => {
    if (!busca) return movimentacoes
    const t = busca.toLowerCase()
    return movimentacoes.filter(m =>
      m.ingredienteNome.toLowerCase().includes(t) ||
      (m.referenciaTipo ?? '').toLowerCase().includes(t)
    )
  }, [movimentacoes, busca])

  return (
    <div className="ada-page">
      <style>{`
        @keyframes mov-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.4)} }
        @media (max-width:1080px) { .mov-hero-grid { grid-template-columns: 1fr !important } }
      `}</style>

      <div
        className="mov-hero-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, alignItems: 'start' }}
      >
        {/* ── LEFT: ops-shell ─────────────────────────── */}
        <div style={{
          background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
          borderRadius: 24, padding: 28, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', gap: 24,
          boxShadow: 'var(--shadow-sm)', minHeight: 'calc(100vh - 140px)',
        }}>
          {/* Amber glow */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 30% at 50% 0%, rgba(212,150,12,.08), transparent 100%)',
          }} />
          {/* Grid pattern */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'linear-gradient(var(--ada-border-sub) 1px, transparent 1px), linear-gradient(90deg, var(--ada-border-sub) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            opacity: 0.4,
          }} />

          {/* Hero header */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: 'Sora, system-ui, sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#D4960C', marginBottom: 12 }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4960C', boxShadow: '0 0 10px rgba(240,176,48,.6)', animation: 'mov-pulse 1.6s ease infinite', display: 'inline-block' }} />
                Operações em tempo real
              </div>
              <h1 style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--ada-heading)' }}>
                Movimentações de <em style={{ fontStyle: 'normal', color: '#D4960C' }}>Estoque</em>
              </h1>
              <p style={{ marginTop: 8, color: 'var(--ada-muted)', fontSize: 13.5, maxWidth: 480, lineHeight: 1.55 }}>
                Cada entrada, saída e ajuste no período selecionado — rastreado em tempo real.
              </p>
            </div>
            {/* Live clock */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--ada-placeholder)' }}>
                UTC-3 · ao vivo
              </span>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 600, color: '#D4960C', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 16px rgba(212,150,12,.30)' }}>
                {hora}
              </span>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, color: 'var(--ada-muted)', letterSpacing: '0.06em' }}>
                {data}
              </span>
            </div>
          </div>

          {/* KPI grid (shown when data available) */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {!loading && !erro && movimentacoesFiltradas.length > 0 && (
              <KpiMovimentacoes movimentacoes={movimentacoesFiltradas} />
            )}
          </div>

          {/* Stream / states */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {loading && <LoadingState mensagem="Carregando movimentações…" />}
            {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
            {!loading && !erro && movimentacoesFiltradas.length === 0 && (
              <EmptyState
                icon={<ArrowsRightLeftIcon className="w-7 h-7" />}
                iconColor="neutral"
                titulo="Nenhuma movimentação no período"
                descricao="Ajuste os filtros e tente novamente."
              />
            )}
            {!loading && !erro && movimentacoesFiltradas.length > 0 && (
              <StreamAutoScroll movimentacoes={movimentacoesFiltradas} />
            )}
          </div>
        </div>

        {/* ── RIGHT: filters + chart ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 16 }}>
          <FiltrosMovimentacoes
            busca={busca}
            onBuscaChange={setBusca}
            de={de}
            onDeChange={handleDeChange}
            ate={ate}
            onAteChange={handleAteChange}
            tipos={tipos}
            onTipoChange={handleTipoChange}
            ingredienteIds={ingredienteIds}
            onIngredienteChange={handleIngredienteChange}
            ingredientes={ingredientes}
          />

          {!loading && !erro && movimentacoesFiltradas.length > 0 && (
            <ChartMovimentacoes movimentacoes={movimentacoesFiltradas} />
          )}

          {movimentacoes.length > 0 && (
            <button
              onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Baixar PDF
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors. No "PageHeader not found", no "StreamMovimentacoes" references.

- [ ] **Step 4: Verify no leftover PageHeader references**

Search for `PageHeader` in `MovimentacoesPage.tsx` — must return zero.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/relatorios/pages/MovimentacoesPage.tsx
git commit -m "feat(relatorios): redesign MovimentacoesPage with full hero_operations layout"
```

---

## Self-Review

**Spec coverage:**
- [x] Two-column hero grid (1.35fr 1fr) → Task 4
- [x] Amber radial glow + grid pattern overlay → Task 4 ops-shell
- [x] Eyebrow with pulsing dot → Task 4 hero header
- [x] Title "Movimentações de Estoque" with amber accent → Task 4
- [x] Live clock (UTC-3, hora, data) → Task 4 `useLiveClock`
- [x] KPI grid 4 cards with count-up + sparklines → Task 1 + Task 4
- [x] Stream with pulsing green dot header + tabs → Task 3
- [x] Auto-scroll animation (CSS keyframe, 32s loop, pause-on-hover) → Task 3
- [x] Duplicate items for seamless loop → Task 3
- [x] Fade mask top/bottom → Task 3
- [x] Tab filters (Todas/Entradas/Saídas/Ajustes) → Task 3
- [x] Compact row: time | icon | ingrediente | qty → Task 3
- [x] Animated SVG bar chart by hour → Task 2
- [x] Chart footer stats (entradas vs saídas) → Task 2
- [x] Filters (FiltrosMovimentacoes) in right column → Task 4
- [x] PDF download in right column → Task 4
- [x] Responsive breakpoint ≤1080px → Task 4 CSS media query
- [x] Loading/empty states preserved → Task 4

**Placeholder scan:** No TBD, no TODO, no "implement later". All code is complete.

**Type consistency:**
- `KpiMovimentacoes` props: `{ movimentacoes: MovimentacaoRelatorio[] }` — used in Task 4 ✓
- `ChartMovimentacoes` props: `{ movimentacoes: MovimentacaoRelatorio[] }` — used in Task 4 ✓
- `StreamAutoScroll` props: `{ movimentacoes: MovimentacaoRelatorio[] }` — used in Task 4 ✓
- `useLiveClock` returns `{ hora: string; data: string }` — consumed inline in Task 4 ✓
