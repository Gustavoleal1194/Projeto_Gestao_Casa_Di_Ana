# Dashboard KPI Animation + Table Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the dashboard with animated KPI counter cards and a premium table design following the Casa di Ana Claude Design system extracted from hero_operations.html.

**Architecture:** Upgrade existing `KpiCard.tsx` with counter animation and expand its variant system to replace the inline `DashboardCard`. Create a standalone `FilterButton.tsx` following the hero_operations button design. Migrate `DashboardPage.tsx` to use the shared animated `KpiCard` component and apply the premium table styling from the design system to the estoque alert table.

**Tech Stack:** React 19, TypeScript, `requestAnimationFrame` for animation, CSS custom properties (`--ada-*`), Sora + DM Sans fonts, Heroicons v2 outline.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/components/ui/KpiCard.tsx` | Modify | Animated counter, expanded variants, trend indicator with arrow |
| `frontend/src/components/ui/FilterButton.tsx` | Create | Premium filter button with default/applied states |
| `frontend/src/features/dashboard/pages/DashboardPage.tsx` | Modify | Replace inline `DashboardCard` with animated `KpiCard`; upgrade estoque table to hero_operations style |

---

## Task 1: Upgrade KpiCard with counter animation

**Files:**
- Modify: `frontend/src/components/ui/KpiCard.tsx`

### Context

The current `KpiCard.tsx` (54 lines) shows a static value. It accepts `valor: string | number`, `label`, `tendencia?`, `variante?` (`amber` | `green` | `yellow` | `blue`).

The `DashboardPage.tsx` has an inline `DashboardCard` component (lines 136–213) with variants `default | positivo | negativo | alerta`. These map to:
- `default` → `amber`
- `positivo` → `green`
- `negativo` → `red` (new variant needed)
- `alerta` → `yellow`

New `KpiCard` must accept a `raw?: number` prop (the plain number) plus `formatarValor?: (n: number) => string` (formats intermediate animation frames). When `raw` is provided, the card animates the displayed value from 0 to `raw` over 1100ms using `easeOutCubic`, displaying `formatarValor(current)` during animation. After animation completes, it shows `valor`. When `raw` is absent, displays `valor` statically (backwards-compatible).

Also add a `red` variant for `negativo`.

- [ ] **Step 1: Write the failing test**

Create `tests/frontend/KpiCard.test.tsx` — but since this is a UI animation component without a test runner configured for JSDOM animation, write a simpler structural test:

```tsx
// There is no dedicated test runner for frontend UI. 
// Validate with TypeScript type checking instead.
// Run: cd frontend && npx tsc --noEmit
```

- [ ] **Step 2: Implement the upgraded KpiCard**

Replace the entire content of `frontend/src/components/ui/KpiCard.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react'

export type KpiVariante = 'amber' | 'green' | 'yellow' | 'blue' | 'red'

interface KpiCardProps {
  valor: string
  raw?: number
  formatarValor?: (n: number) => string
  label: string
  tendencia?: string
  variante?: KpiVariante
}

const varConfig: Record<KpiVariante, { color: string; glow: string; gradient: string }> = {
  amber: { color: '#D4960C', glow: 'rgba(212,150,12,.4)',  gradient: 'rgba(212,150,12,.12)' },
  green: { color: '#4ADE80', glow: 'rgba(74,222,128,.4)',  gradient: 'rgba(74,222,128,.12)' },
  yellow:{ color: '#FCD34D', glow: 'rgba(252,211,77,.4)',  gradient: 'rgba(252,211,77,.12)' },
  blue:  { color: '#93C5FD', glow: 'rgba(147,197,253,.4)', gradient: 'rgba(147,197,253,.12)' },
  red:   { color: '#F87171', glow: 'rgba(248,113,113,.4)', gradient: 'rgba(248,113,113,.12)' },
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const DURATION = 1100

export function KpiCard({ valor, raw, formatarValor, label, tendencia, variante = 'amber' }: KpiCardProps) {
  const v = varConfig[variante]
  const [displayed, setDisplayed] = useState<string>(raw !== undefined ? (formatarValor ? formatarValor(0) : '0') : valor)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (raw === undefined) {
      setDisplayed(valor)
      return
    }
    const target = raw
    const fmt = formatarValor ?? ((n: number) => String(Math.round(n)))

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    startRef.current = null
    setDisplayed(fmt(0))

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / DURATION, 1)
      const current = easeOutCubic(progress) * target
      setDisplayed(fmt(current))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(valor)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [raw, valor])

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${v.gradient} 0%, ${v.color} 50%, ${v.gradient} 100%)` }}
        aria-hidden="true"
      />
      <p
        className="text-[11px] font-semibold uppercase tracking-[.08em] mb-3"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-[26px] font-bold tabular-nums leading-none tracking-tight"
        style={{ color: v.color, textShadow: `0 0 20px ${v.glow}`, fontFamily: 'Sora, system-ui, sans-serif' }}
        aria-live="polite"
        aria-label={`${label}: ${valor}`}
      >
        {displayed}
      </p>
      {tendencia && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ada-muted)' }}>
          {tendencia}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors related to `KpiCard.tsx`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/KpiCard.tsx
git commit -m "feat(ui): animated counter in KpiCard + red variant"
```

---

## Task 2: Create FilterButton component

**Files:**
- Create: `frontend/src/components/ui/FilterButton.tsx`

### Context

Design from hero_operations.html:
```css
/* default state */
height: 36px; padding: 0 14px; border-radius: 10px;
font-family: Sora; font-size: 13px; font-weight: 600;
background: var(--ada-surface); border: 1px solid var(--ada-border);
color: var(--ada-body); box-shadow: var(--shadow-xs);
transition: background 140ms, border-color 140ms, color 140ms, box-shadow 140ms, transform 80ms;

/* applied state */
background: rgba(212,150,12,0.1); border-color: rgba(212,150,12,0.45); color: #92580A;
box-shadow: 0 0 0 3px rgba(212,150,12,0.1), var(--shadow-xs);
```

The light theme uses `color: #92580A` for applied state. In dark theme the same amber tint reads well.

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/ui/FilterButton.tsx
import type { ReactNode } from 'react'

interface FilterButtonProps {
  label: string
  icon?: ReactNode
  count?: number
  applied?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export function FilterButton({
  label,
  icon,
  count,
  applied = false,
  onClick,
  type = 'button',
  disabled = false,
}: FilterButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 36,
        padding: '0 14px',
        borderRadius: 10,
        fontFamily: 'Sora, system-ui, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 140ms, border-color 140ms, color 140ms, box-shadow 140ms, transform 80ms',
        outline: 'none',
        ...(applied
          ? {
              background: 'rgba(212,150,12,0.1)',
              border: '1px solid rgba(212,150,12,0.45)',
              color: 'var(--ada-amber-text, #92580A)',
              boxShadow: '0 0 0 3px rgba(212,150,12,0.1), var(--shadow-xs)',
            }
          : {
              background: 'var(--ada-surface)',
              border: '1px solid var(--ada-border)',
              color: 'var(--ada-body)',
              boxShadow: 'var(--shadow-xs)',
            }),
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        if (disabled || applied) return
        const el = e.currentTarget
        el.style.background = 'var(--ada-hover)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        if (disabled || applied) return
        const el = e.currentTarget
        el.style.background = 'var(--ada-surface)'
        el.style.transform = 'translateY(0)'
      }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {icon && <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            fontSize: 11,
            fontWeight: 700,
            background: applied ? 'rgba(212,150,12,0.2)' : 'var(--ada-surface-2)',
            color: applied ? '#92580A' : 'var(--ada-muted)',
            padding: '0 5px',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/FilterButton.tsx
git commit -m "feat(ui): add FilterButton with applied/default states"
```

---

## Task 3: Migrate DashboardPage KPIs to animated KpiCard

**Files:**
- Modify: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

### Context

The `DashboardPage.tsx` (1197 lines) has an inline `DashboardCard` component (lines 136–213) with its own variant system. We will:
1. Remove the `DashboardCard` function (lines 136–213)
2. Add `import { KpiCard } from '@/components/ui/KpiCard'` at the top
3. Replace the 5 `<DashboardCard>` usages (lines ~876–911) with `<KpiCard>`, mapping variants and passing `raw`/`formatarValor` props

Variant mapping:
- `positivo` → `green`
- `negativo` → `red`
- `alerta` → `yellow`
- `default` → `amber`

The 5 cards and their mappings:
1. Receita Estimada — `green`, `raw={totais?.receita ?? 0}`, `formatarValor={brl}`
2. Lucro Estimado — `green` if ≥0 else `red`, `raw={lucroEstimado}`, `formatarValor={brl}`
3. Custo de Perdas — `red` if >0 else `amber`, `raw={totais?.custoPerda ?? 0}`, `formatarValor={brl}`
4. Estoque Baixo — `yellow` if >0 else `amber`, `raw={data.estoqueAlerta.length}`, `formatarValor={n => String(Math.round(n))}`
5. Taxa de Venda — `green`/`yellow`/`red`, `raw={sellThrough}`, `formatarValor={n => \`${n.toFixed(1)}%\`}`

The `DashboardCard` also had inline SVG icons shown in the top-right corner. **Do not add icon to `KpiCard` API** — the icons are not in the design spec from hero_operations.html. The `tendencia` prop replaces `subtexto`.

Also: `DashboardCard`'s `valor` for card 4 (Estoque Baixo) was `String(data.estoqueAlerta.length)` — a plain number as string. With `raw={data.estoqueAlerta.length}`, the animation handles this cleanly.

- [ ] **Step 1: Remove DashboardCard and add KpiCard import**

In `DashboardPage.tsx`, remove the entire `DashboardCard` function (lines 136–213 — from `// ─── DashboardCard` comment through the closing `}`).

Add to the import block at the top:
```tsx
import { KpiCard } from '@/components/ui/KpiCard'
```

- [ ] **Step 2: Replace the 5 KPI card usages**

Find the `{/* ── KPI Cards */}` block (lines ~874–912) and replace the 5 `<DashboardCard>` elements with:

```tsx
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
```

- [ ] **Step 3: Remove now-unused SVG icon components**

The inline SVG icon components `IcReceita`, `IcLucro`, `IcPerda`, `IcAlerta`, `IcEficiência` (lines ~56–84) were only used by `DashboardCard`. Remove them entirely.

- [ ] **Step 4: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors. In particular `DashboardCard`, `IcReceita`, `IcLucro`, `IcPerda`, `IcAlerta`, `IcEficiência` must not appear in any error.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/dashboard/pages/DashboardPage.tsx
git commit -m "feat(dashboard): migrate KPI cards to animated KpiCard component"
```

---

## Task 4: Upgrade estoque alert table to hero_operations design

**Files:**
- Modify: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

### Context

The estoque alert table (lines ~1080–1165) uses raw `<table>` with `<th>` and `<td>`. The hero_operations.html design uses:
- Tighter header: `text-[11px] font-semibold uppercase tracking-[0.08em]` — already matches
- Row hover: `background: var(--ada-hover)` using `onMouseEnter`/`onMouseLeave` — already present
- Status badges with `background: rgba(220,38,38,0.1); color: #DC2626` for crit — already close

The key upgrade: the current "Déficit" column uses a span with `var(--ada-error-bg)` border which is correct. The row borders use `var(--ada-warning-badge)` — this creates visual noise. We improve by:

1. Replacing per-row `borderBottom` logic with a unified `divide-y` approach via CSS (set on `<tbody>`)
2. Changing the header background from `var(--ada-warning-bg)` to `var(--ada-surface-2)` (cleaner, matches hero_operations table head)
3. Keeping the warning-tinted section header (pulsing dot + title) — that's already excellent

Find the estoque table header row `<tr>` (around line 1111) which currently has:
```jsx
style={{ background: 'var(--ada-warning-bg)', borderBottom: '1px solid var(--ada-warning-badge)' }}
```
Change to:
```jsx
style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border)' }}
```

And the `<th>` elements have `color: '#92580A'` — change to `color: 'var(--ada-muted)'`.

For the rows, the current logic is:
```jsx
style={{ borderBottom: idx < data.estoqueAlerta.length - 1 ? '1px solid var(--ada-warning-badge)' : 'none' }}
```
Change to always apply a subtle border using the standard token:
```jsx
style={{ borderBottom: '1px solid var(--ada-border-sub)' }}
```
And on `onMouseEnter`/`onMouseLeave` use `var(--ada-hover)` (already correct).

- [ ] **Step 1: Apply the three targeted edits in DashboardPage.tsx**

**Edit 1** — Table header row background and border:

Find:
```tsx
style={{ background: 'var(--ada-warning-bg)', borderBottom: '1px solid var(--ada-warning-badge)' }}
```
Replace with:
```tsx
style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border)' }}
```

**Edit 2** — `<th>` color inside that header row:

Find:
```tsx
style={{ color: '#92580A' }}
```
Replace with:
```tsx
style={{ color: 'var(--ada-muted)' }}
```

**Edit 3** — Row border logic:

Find:
```tsx
style={{ borderBottom: idx < data.estoqueAlerta.length - 1 ? '1px solid var(--ada-warning-badge)' : 'none' }}
```
Replace with:
```tsx
style={{ borderBottom: '1px solid var(--ada-border-sub)' }}
```

- [ ] **Step 2: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/dashboard/pages/DashboardPage.tsx
git commit -m "feat(dashboard): upgrade estoque table to design system tokens"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Animated KPI cards (counter from 0 to value on mount) → Task 1
- [x] `red` variant for negative values → Task 1
- [x] `FilterButton` with applied/default states → Task 2
- [x] Migrate DashboardPage to use animated KpiCard → Task 3
- [x] Table upgrade following hero_operations tokens → Task 4

**No placeholders:** All code is complete. No "TODO", "TBD", or vague instructions.

**Type consistency:**
- `KpiCard` exports `KpiVariante` type (used in import in DashboardPage)
- `raw?` prop is `number | undefined` — all usages pass `number`
- `formatarValor?: (n: number) => string` — all usages pass `(n: number) => string`
- `FilterButton` is self-contained, no external type imports needed
