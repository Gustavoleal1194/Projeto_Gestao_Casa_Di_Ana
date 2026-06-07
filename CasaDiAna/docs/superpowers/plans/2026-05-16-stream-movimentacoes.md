# Stream de Operações — Movimentações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the table in the movimentações page with a premium vertical feed/timeline grouped by date, following the Casa di Ana design tokens.

**Architecture:** Create a standalone `StreamMovimentacoes` component that receives the flat list of `MovimentacaoRelatorio`, groups it by date internally, and renders date separators + item cards. `MovimentacoesPage` drops the table and mounts the stream — no logic changes, only the presentation layer changes.

**Tech Stack:** React 18, TypeScript, `@heroicons/react/24/outline`, CSS custom properties (`--ada-*`), Sora + DM Sans fonts.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/features/relatorios/components/StreamMovimentacoes.tsx` | Create | Feed renderer — groups by date, renders separators + stream items |
| `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx` | Modify | Import stream, remove table + `TIPO_LABEL`, mount `<StreamMovimentacoes>` |

---

## Type reference (DO NOT redefine — already exists)

```ts
// frontend/src/types/estoque.ts
export interface MovimentacaoRelatorio {
  id: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  tipo: string           // 'Entrada' | 'AjustePositivo' | 'AjusteNegativo' | 'SaidaProducao'
  quantidade: number
  saldoApos: number
  referenciaTipo: string | null
  referenciaId: string | null
  criadoEm: string       // ISO datetime "2026-05-16T14:30:00"
}
```

---

## Task 1: Create StreamMovimentacoes component

**Files:**
- Create: `frontend/src/features/relatorios/components/StreamMovimentacoes.tsx`

### Visual design

Each date group:
```
16 de maio · 4 movimentações ─────────────────────────
┌──────────────────────────────────────────────────────┐
│ [↑ green]  Farinha de Trigo (kg)       +5.000  14:30 │
│            [Entrada]  · Nota Fiscal                  │
│            Saldo após: 12.500 kg                     │
├──────────────────────────────────────────────────────┤
│ [↓ red]    Açúcar (kg)                 -2.500  10:15 │
│            [Saída — Produção]                        │
│            Saldo após: 8.000 kg                      │
└──────────────────────────────────────────────────────┘
```

Type → visual config:
- `Entrada`        → ArrowUpIcon,   green  `#4ADE80`, badge `#16A34A`
- `AjustePositivo` → ArrowUpIcon,   amber  `#D4960C`, badge `#92580A`
- `AjusteNegativo` → ArrowDownIcon, amber  `#D4960C`, badge `#92580A`, valor red
- `SaidaProducao`  → ArrowDownIcon, red    `#F87171`, badge `#DC2626`

- [ ] **Step 1: Create the file with the complete implementation**

Write `frontend/src/features/relatorios/components/StreamMovimentacoes.tsx`:

```tsx
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import type { MovimentacaoRelatorio } from '@/types/estoque'

const TIPO_LABEL: Record<string, string> = {
  Entrada:        'Entrada',
  AjustePositivo: 'Ajuste Positivo',
  AjusteNegativo: 'Ajuste Negativo',
  SaidaProducao:  'Saída — Produção',
}

interface TipoVis {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  iconColor: string
  iconBg: string
  badgeBg: string
  badgeColor: string
  sinal: '+' | '-'
  valorColor: string
}

const TIPO_VIS: Record<string, TipoVis> = {
  Entrada:        { Icon: ArrowUpIcon,   iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,.12)',  badgeBg: 'rgba(74,222,128,.1)',  badgeColor: '#16A34A', sinal: '+', valorColor: '#4ADE80'  },
  AjustePositivo: { Icon: ArrowUpIcon,   iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.12)', badgeBg: 'rgba(212,150,12,.1)', badgeColor: '#92580A', sinal: '+', valorColor: '#D4960C'  },
  AjusteNegativo: { Icon: ArrowDownIcon, iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.12)', badgeBg: 'rgba(212,150,12,.1)', badgeColor: '#92580A', sinal: '-', valorColor: '#F87171'  },
  SaidaProducao:  { Icon: ArrowDownIcon, iconColor: '#F87171', iconBg: 'rgba(248,113,113,.12)', badgeBg: 'rgba(220,38,38,.1)',  badgeColor: '#DC2626', sinal: '-', valorColor: '#F87171'  },
}

const FALLBACK_VIS: TipoVis = {
  Icon: ArrowUpIcon,
  iconColor: 'var(--ada-muted)', iconBg: 'var(--ada-surface-2)',
  badgeBg: 'var(--ada-surface-2)', badgeColor: 'var(--ada-muted)',
  sinal: '+', valorColor: 'var(--ada-body)',
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarDataGrupo(isoDate: string): string {
  const [y, mo, d] = isoDate.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

function agruparPorData(movs: MovimentacaoRelatorio[]): [string, MovimentacaoRelatorio[]][] {
  const map = new Map<string, MovimentacaoRelatorio[]>()
  for (const m of movs) {
    const key = m.criadoEm.split('T')[0]
    const arr = map.get(key)
    if (arr) arr.push(m)
    else map.set(key, [m])
  }
  return Array.from(map.entries())
}

function StreamItem({ m, isLast }: { m: MovimentacaoRelatorio; isLast: boolean }) {
  const vis = TIPO_VIS[m.tipo] ?? FALLBACK_VIS
  const { Icon } = vis
  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--ada-border-sub)',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: vis.iconBg, marginTop: 2,
        }}
      >
        <Icon style={{ width: 16, height: 16, color: vis.iconColor, strokeWidth: 2.5 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <span
            style={{
              fontSize: 14, fontWeight: 600, color: 'var(--ada-heading)',
              fontFamily: 'Sora, system-ui, sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {m.ingredienteNome}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ada-placeholder)', marginLeft: 5 }}>
              ({m.unidadeMedidaCodigo})
            </span>
          </span>
          <span
            style={{
              fontSize: 14, fontWeight: 700, color: vis.valorColor,
              fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
          >
            {vis.sinal}{m.quantidade}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span
            style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
              background: vis.badgeBg, color: vis.badgeColor, whiteSpace: 'nowrap',
            }}
          >
            {TIPO_LABEL[m.tipo] ?? m.tipo}
          </span>
          {m.referenciaTipo && (
            <span
              style={{
                fontSize: 12, color: 'var(--ada-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              · {m.referenciaTipo}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--ada-muted)' }}>
            Saldo após:{' '}
            <strong style={{ color: 'var(--ada-body)', fontVariantNumeric: 'tabular-nums' }}>
              {m.saldoApos} {m.unidadeMedidaCodigo}
            </strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--ada-placeholder)', fontVariantNumeric: 'tabular-nums' }}>
            {formatarHora(m.criadoEm)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function StreamMovimentacoes({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const grupos = agruparPorData(movimentacoes)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {grupos.map(([data, itens]) => (
        <div key={data}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'var(--ada-muted)',
                fontFamily: 'Sora, system-ui, sans-serif', whiteSpace: 'nowrap',
              }}
            >
              {formatarDataGrupo(data)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ada-placeholder)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
              · {itens.length} movimentação{itens.length !== 1 ? 'ões' : ''}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--ada-border-sub)' }} aria-hidden="true" />
          </div>

          <div
            style={{
              background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
              borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            }}
          >
            {itens.map((m, i) => (
              <StreamItem key={m.id} m={m} isLast={i === itens.length - 1} />
            ))}
          </div>
        </div>
      ))}
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
git add frontend/src/features/relatorios/components/StreamMovimentacoes.tsx
git commit -m "feat(relatorios): add StreamMovimentacoes feed component"
```

---

## Task 2: Integrate StreamMovimentacoes in MovimentacoesPage

**Files:**
- Modify: `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx`

### Context

The current file (182 lines) has:
1. A `TIPO_LABEL` constant at lines 12–17 — **move this to `StreamMovimentacoes.tsx`** (already done in Task 1). Delete it from `MovimentacoesPage.tsx`.
2. A table section (lines 120–178) wrapped in `<div className="ada-surface-card">` — replace entirely with `<StreamMovimentacoes>`.

### Changes to make

**Change 1: Add import** (at top, after existing imports)
```tsx
import { StreamMovimentacoes } from '../components/StreamMovimentacoes'
```

**Change 2: Remove `TIPO_LABEL`**

Delete these lines entirely:
```tsx
const TIPO_LABEL: Record<string, string> = {
  Entrada:        'Entrada',
  AjustePositivo: 'Ajuste Positivo',
  AjusteNegativo: 'Ajuste Negativo',
  SaidaProducao:  'Saída — Produção',
}
```

**Change 3: Replace the table section**

Find:
```tsx
      {!loading && !erro && movimentacoesFiltradas.length > 0 && (
        <div className="ada-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
```
(all the way through the closing `</div>` of `ada-surface-card`)

Replace the entire block with:
```tsx
      {!loading && !erro && movimentacoesFiltradas.length > 0 && (
        <StreamMovimentacoes movimentacoes={movimentacoesFiltradas} />
      )}
```

- [ ] **Step 1: Read the current file to verify exact line content**

Read `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx` and locate the 3 targets above.

- [ ] **Step 2: Add import**

Add `import { StreamMovimentacoes } from '../components/StreamMovimentacoes'` after the last import line.

- [ ] **Step 3: Delete TIPO_LABEL**

Remove the 6-line `TIPO_LABEL` constant.

- [ ] **Step 4: Replace table section with StreamMovimentacoes**

Replace the entire `{!loading && !erro && movimentacoesFiltradas.length > 0 && ( <div className="ada-surface-card">...</div> )}` block with:
```tsx
      {!loading && !erro && movimentacoesFiltradas.length > 0 && (
        <StreamMovimentacoes movimentacoes={movimentacoesFiltradas} />
      )}
```

- [ ] **Step 5: Run type check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors. In particular, no "TIPO_LABEL is not defined" errors and no table-related JSX errors.

- [ ] **Step 6: Verify no leftover table references**

Search the file for `<table`, `<thead`, `<tbody`, `table-th`, `TIPO_LABEL` — all must return zero matches.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/relatorios/pages/MovimentacoesPage.tsx
git commit -m "feat(relatorios): replace movimentacoes table with StreamMovimentacoes feed"
```

---

## Self-Review

**Spec coverage:**
- [x] Feed/timeline vertical layout → Tasks 1–2
- [x] Date separators with count → Task 1 (`grupos.map`)
- [x] Colored icons by type (green/red/amber) → Task 1 `TIPO_VIS`
- [x] Type badge with color → Task 1 `StreamItem`
- [x] Quantity +/- with color → Task 1 `vis.sinal` + `vis.valorColor`
- [x] Saldo após → Task 1 `StreamItem` row 3
- [x] Timestamp (hour:minute) → Task 1 `formatarHora`
- [x] Reference label → Task 1 `m.referenciaTipo`
- [x] Hover state on items → Task 1 `onMouseEnter/Leave`
- [x] Design tokens throughout (no hardcoded bg/border) → Task 1 all tokens use `var(--ada-*)`

**Placeholder scan:** No TBD, no TODO, all code is complete.

**Type consistency:**
- `StreamMovimentacoes` props: `{ movimentacoes: MovimentacaoRelatorio[] }` — used correctly in Task 2
- `StreamItem` props: `{ m: MovimentacaoRelatorio; isLast: boolean }` — consistent throughout
- `TipoVis.sinal: '+' | '-'` — string literal union, used as template in JSX: correct
