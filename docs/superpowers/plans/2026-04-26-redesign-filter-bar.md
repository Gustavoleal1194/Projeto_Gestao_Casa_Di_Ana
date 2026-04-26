# Redesign Filter Bar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar o filtro de todas as telas ao padrão SaaS premium — container integrado sem bordas externas, botão azul `.btn-filter`, chips removíveis para filtros ativos, e `.btn-ghost` definido.

**Architecture:** CSS atualizado em `index.css`; componente `<FilterBar>` + `<FilterBarActions>` + `<FilterChip>` em `src/components/ui/FilterBar.tsx`; 9 páginas migradas para o novo componente.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4 (somente tokens `var(--ada-*)`), sem bibliotecas adicionais.

---

## Contexto para o implementador

O projeto é um ERP para cafeteria (Casa di Ana). Frontend em `CasaDiAna/frontend/`. Comandos:
```bash
cd CasaDiAna/frontend
npx tsc --noEmit   # verificar tipos
npm run dev        # porta 5173
```

Design tokens em `src/index.css`. **Nunca usar classes Tailwind de cor direta** (`bg-white`, `text-blue-500` etc.) — usar somente `var(--ada-*)`.

As 9 páginas com `filter-bar` são:
- `src/features/entradas/pages/EntradasPage.tsx`
- `src/features/relatorios/pages/EntradasRelatorioPage.tsx`
- `src/features/relatorios/pages/MovimentacoesPage.tsx`
- `src/features/relatorios/pages/ComparacaoPrecoPage.tsx`
- `src/features/relatorios/pages/InsumosProducaoPage.tsx`
- `src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx`
- `src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx`
- `src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx`
- `src/features/producao/perdas/pages/PerdasPage.tsx`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `frontend/src/index.css` | Modificar linhas 392–427 + inserir novas classes |
| `frontend/src/components/ui/FilterBar.tsx` | Criar |
| `frontend/src/features/entradas/pages/EntradasPage.tsx` | Migrar |
| `frontend/src/features/relatorios/pages/EntradasRelatorioPage.tsx` | Migrar |
| `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx` | Migrar |
| `frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx` | Migrar |
| `frontend/src/features/relatorios/pages/InsumosProducaoPage.tsx` | Migrar |
| `frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx` | Migrar |
| `frontend/src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx` | Migrar |
| `frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx` | Migrar |
| `frontend/src/features/producao/perdas/pages/PerdasPage.tsx` | Migrar |

---

## Task 1: CSS — redesign `.filter-bar`, adicionar `.btn-filter`, `.filter-chip`, `.btn-ghost`

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Substituir o bloco `.filter-bar`**

Localizar (linhas 392–404):
```css
/* Filter bar */
.filter-bar {
  background: var(--ada-surface);
  border: 1px solid var(--ada-border);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  box-shadow: var(--shadow-xs);
}
```

Substituir por:
```css
/* Filter bar */
.filter-bar {
  background: var(--ada-surface);
  border-bottom: 1px solid var(--ada-border-sub);
  border-radius: 0;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  box-shadow: var(--shadow-xs);
}
```

- [ ] **Step 2: Inserir `.btn-filter` e `.btn-ghost` após `.btn-secondary:disabled` (linha 390)**

Após a linha `.btn-secondary:disabled { opacity: 0.50; cursor: not-allowed; }`, inserir:

```css

/* Filter action button — blue */
.btn-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #4080EF 0%, #2563EB 100%);
  box-shadow: 0 3px 10px rgba(37,99,235,0.25);
  transition: box-shadow 200ms, opacity 200ms;
  outline: none;
  white-space: nowrap;
  font-family: 'Sora', system-ui, sans-serif;
  cursor: pointer;
  border: none;
}
.btn-filter:hover { box-shadow: 0 5px 16px rgba(37,99,235,0.38); }
.btn-filter:focus-visible { outline: 2px solid rgba(37,99,235,0.45); outline-offset: 2px; }
.btn-filter:disabled { opacity: 0.55; cursor: not-allowed; }

/* Ghost button — ações terciárias */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ada-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 150ms, color 150ms;
}
.btn-ghost:hover { background: var(--ada-surface-2); color: var(--ada-body); }
.btn-ghost:focus-visible { outline: 2px solid rgba(196,135,10,0.40); outline-offset: 2px; }
```

- [ ] **Step 3: Inserir `.filter-chips-row`, `.filter-chip`, `.filter-chip-remove` após `.filter-input:focus` (linha 427)**

Após o bloco `.filter-input:focus { ... }`, inserir:

```css

.filter-chips-row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding-top: 0.125rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: #4080EF;
  background: rgba(64,128,239,0.10);
  border: 1px solid rgba(64,128,239,0.22);
}

.filter-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
  cursor: pointer;
  padding: 0;
  transition: opacity 150ms;
}
.filter-chip-remove:hover { opacity: 1; }
```

- [ ] **Step 4: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add CasaDiAna/frontend/src/index.css
git commit -m "style(filter-bar): redesign CSS — container integrado, btn-filter azul, chips, btn-ghost"
```

---

## Task 2: Componente `<FilterBar>`

**Files:**
- Create: `frontend/src/components/ui/FilterBar.tsx`

- [ ] **Step 1: Criar o arquivo**

Criar `CasaDiAna/frontend/src/components/ui/FilterBar.tsx` com o conteúdo completo:

```tsx
import type { ReactNode } from 'react'

export interface FilterChipDef {
  label: string
  onRemove: () => void
}

interface FilterChipProps {
  label: string
  onRemove: () => void
}

interface FilterBarActionsProps {
  submitLabel?: string
  loadingLabel?: string
  loading?: boolean
  chips?: FilterChipDef[]
}

interface FilterBarProps {
  onSubmit: (e: React.FormEvent) => void
  ariaLabel?: string
  children: ReactNode
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="filter-chip">
      {label}
      <button
        type="button"
        className="filter-chip-remove"
        onClick={onRemove}
        aria-label={`Remover filtro: ${label}`}
      >
        ×
      </button>
    </span>
  )
}

export function FilterBarActions({
  submitLabel = 'Filtrar',
  loadingLabel = 'Carregando…',
  loading = false,
  chips = [],
}: FilterBarActionsProps) {
  return (
    <>
      <button type="submit" className="btn-filter" disabled={loading}>
        {loading ? loadingLabel : submitLabel}
      </button>
      {chips.length > 0 && (
        <div className="filter-chips-row">
          {chips.map((chip, i) => (
            <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      )}
    </>
  )
}

export function FilterBar({ onSubmit, ariaLabel, children }: FilterBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="filter-bar"
      role="search"
      aria-label={ariaLabel ?? 'Filtrar'}
    >
      {children}
    </form>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add CasaDiAna/frontend/src/components/ui/FilterBar.tsx
git commit -m "feat(ui): criar componente FilterBar com FilterBarActions e FilterChip"
```

---

## Task 3: Migrar `EntradasRelatorioPage` e `ComparacaoPrecoPage`

**Files:**
- Modify: `frontend/src/features/relatorios/pages/EntradasRelatorioPage.tsx`
- Modify: `frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx`

Ambas as páginas têm filtros De/Até apenas e usam `form.filter-bar` com `handleFiltrar = (e) => { e.preventDefault(); carregar() }`.

Helper de formatação de data de input (`YYYY-MM-DD` → `DD/MM/AAAA`) que cada página deve usar na label dos chips:
```ts
const fmtChip = (s: string) => s.split('-').reverse().join('/')
```

### `EntradasRelatorioPage.tsx`

- [ ] **Step 1: Adicionar import**

Adicionar no topo do arquivo (junto aos outros imports de components):
```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 2: Substituir o bloco do filtro**

Localizar:
```tsx
      <form onSubmit={handleFiltrar} className="filter-bar" role="search" aria-label="Filtrar entradas">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <button type="submit" className="btn-secondary">Gerar Relatório</button>
      </form>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar entradas">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <FilterBarActions
          submitLabel="Gerar Relatório"
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
          ]}
        />
      </FilterBar>
```

### `ComparacaoPrecoPage.tsx`

- [ ] **Step 3: Adicionar import**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 4: Substituir o bloco do filtro**

Localizar (o bloco `<form onSubmit={handleFiltrar} className="filter-bar" ...>` até `</form>`):
```tsx
      <form onSubmit={handleFiltrar} className="filter-bar" role="search" aria-label="Filtrar comparação">
        <div>
          <label className="filter-label">De</label>
          <input
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <button type="submit" className="btn-secondary" disabled={loading}>
          {loading ? 'Carregando…' : 'Gerar Comparação'}
        </button>
        {(de || ate) && (
          <button
            type="button"
            className="btn-ghost text-sm"
            style={{ color: 'var(--ada-muted)' }}
            onClick={() => { setDe(''); setAte(''); }}
          >
            Limpar período
          </button>
        )}
      </form>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar comparação">
        <div>
          <label className="filter-label">De</label>
          <input
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <FilterBarActions
          submitLabel="Gerar Comparação"
          loadingLabel="Carregando…"
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
          ]}
        />
      </FilterBar>
```

- [ ] **Step 5: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add CasaDiAna/frontend/src/features/relatorios/pages/EntradasRelatorioPage.tsx
git add CasaDiAna/frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx
git commit -m "feat(relatorios): migrar EntradasRelatorioPage e ComparacaoPrecoPage para FilterBar"
```

---

## Task 4: Migrar `MovimentacoesPage`, `InsumosProducaoPage`, `ProducaoVendasRelatorioPage`

**Files:**
- Modify: `frontend/src/features/relatorios/pages/MovimentacoesPage.tsx`
- Modify: `frontend/src/features/relatorios/pages/InsumosProducaoPage.tsx`
- Modify: `frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx`

Essas páginas têm filtros adicionais (selects). As duas últimas usam `div.filter-bar` com button type="button" — será preciso ajustar `handleFiltrar` para aceitar o evento.

### `MovimentacoesPage.tsx`

Já usa `form.filter-bar` com `handleFiltrar = (e) => { e.preventDefault(); carregar() }`. Tem selects de Tipo e Ingrediente.

- [ ] **Step 1: Adicionar import**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 2: Substituir o bloco do filtro**

Localizar:
```tsx
      <form onSubmit={handleFiltrar} className="filter-bar" role="search" aria-label="Filtrar movimentações">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="filter-input">
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>
        <div>
          <label className="filter-label">Ingrediente</label>
          <select value={ingredienteId} onChange={e => setIngredienteId(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Filtrar</button>
      </form>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar movimentações">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="filter-input">
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>
        <div>
          <label className="filter-label">Ingrediente</label>
          <select value={ingredienteId} onChange={e => setIngredienteId(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
            ...(tipo ? [{ label: `Tipo: ${TIPOS.find(t => t.valor === tipo)?.rotulo ?? tipo}`, onRemove: () => setTipo('') }] : []),
            ...(ingredienteId ? [{ label: `Ingrediente: ${ingredientes.find(i => i.id === ingredienteId)?.nome ?? ingredienteId}`, onRemove: () => setIngredienteId('') }] : []),
          ]}
        />
      </FilterBar>
```

### `InsumosProducaoPage.tsx`

Usa `div.filter-bar` com button type="button". Tem selects de Ingrediente e Produto.

- [ ] **Step 3: Adicionar import e ajustar handleFiltrar**

Adicionar:
```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

Localizar a função `handleFiltrar` (algo como `const handleFiltrar = () => carregar(...)` ou `const handleFiltrar = useCallback(() => carregar(...))`) e adicionar o parâmetro de evento:

Se a função for simples:
```tsx
const handleFiltrar = (e?: React.FormEvent) => {
  e?.preventDefault()
  carregar(de, ate, ingredienteFiltro || undefined, produtoFiltro || undefined)
}
```

Se usar `useCallback`, manter `useCallback` e ajustar a assinatura da mesma forma.

- [ ] **Step 4: Substituir o bloco do filtro**

Localizar:
```tsx
      <div className="filter-bar" role="search" aria-label="Filtrar insumos">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Ingrediente</label>
          <select value={ingredienteFiltro} onChange={e => setIngredienteFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="filter-label">Produto</label>
          <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">Filtrar</button>
      </div>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar insumos">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Ingrediente</label>
          <select value={ingredienteFiltro} onChange={e => setIngredienteFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="filter-label">Produto</label>
          <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
            ...(ingredienteFiltro ? [{ label: `Ingrediente: ${ingredientes.find(i => i.id === ingredienteFiltro)?.nome ?? ingredienteFiltro}`, onRemove: () => setIngredienteFiltro('') }] : []),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>
```

### `ProducaoVendasRelatorioPage.tsx`

Usa `div.filter-bar`, tem select de Produto.

- [ ] **Step 5: Adicionar import e ajustar handleFiltrar**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

Ajustar `handleFiltrar`:
```tsx
const handleFiltrar = (e?: React.FormEvent) => {
  e?.preventDefault()
  carregar(de, ate, produtoFiltro || undefined)
}
```

- [ ] **Step 6: Substituir o bloco do filtro**

Localizar:
```tsx
      <div className="filter-bar" role="search" aria-label="Filtrar relatório">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Produto</label>
          <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">Filtrar</button>
      </div>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar relatório">
        <div>
          <label className="filter-label">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label className="filter-label">Produto</label>
          <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>
```

- [ ] **Step 7: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add CasaDiAna/frontend/src/features/relatorios/pages/MovimentacoesPage.tsx
git add CasaDiAna/frontend/src/features/relatorios/pages/InsumosProducaoPage.tsx
git add CasaDiAna/frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx
git commit -m "feat(relatorios): migrar Movimentacoes, Insumos e ProducaoVendas para FilterBar"
```

---

## Task 5: Migrar `ProducaoDiariaPage`, `VendasDiariasPage`, `PerdasPage`, `EntradasPage`

**Files:**
- Modify: `frontend/src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx`
- Modify: `frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx`
- Modify: `frontend/src/features/producao/perdas/pages/PerdasPage.tsx`
- Modify: `frontend/src/features/entradas/pages/EntradasPage.tsx`

### `ProducaoDiariaPage.tsx`

Usa `div.filter-bar`, `handleFiltrar = () => carregar(de, ate, produtoFiltro || undefined)`.

- [ ] **Step 1: Adicionar import**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 2: Ajustar `handleFiltrar`**

Localizar:
```tsx
  const handleFiltrar = () => carregar(de, ate, produtoFiltro || undefined)
```

Substituir por:
```tsx
  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate, produtoFiltro || undefined)
  }
```

- [ ] **Step 3: Substituir o bloco do filtro**

Localizar:
```tsx
      <div className="filter-bar" role="search" aria-label="Filtrar produção">
        <div>
          <label htmlFor="prod-de" className="filter-label">De</label>
          <input id="prod-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="prod-ate" className="filter-label">Até</label>
          <input id="prod-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="prod-produto" className="filter-label">Produto</label>
          <select
            id="prod-produto"
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">
          Filtrar
        </button>
      </div>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar produção">
        <div>
          <label htmlFor="prod-de" className="filter-label">De</label>
          <input id="prod-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="prod-ate" className="filter-label">Até</label>
          <input id="prod-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="prod-produto" className="filter-label">Produto</label>
          <select
            id="prod-produto"
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>
```

### `VendasDiariasPage.tsx`

Padrão idêntico ao `ProducaoDiariaPage.tsx` — mesmo número de filtros, mesma estrutura. IDs dos campos: `venda-de`, `venda-ate`, `venda-produto`.

- [ ] **Step 4: Adicionar import**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 5: Ajustar `handleFiltrar`**

```tsx
  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate, produtoFiltro || undefined)
  }
```

- [ ] **Step 6: Substituir o bloco do filtro**

Localizar:
```tsx
      <div className="filter-bar" role="search" aria-label="Filtrar vendas">
        <div>
          <label htmlFor="venda-de" className="filter-label">De</label>
          <input id="venda-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="venda-ate" className="filter-label">Até</label>
          <input id="venda-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="venda-produto" className="filter-label">Produto</label>
          <select
            id="venda-produto"
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">
          Filtrar
        </button>
      </div>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar vendas">
        <div>
          <label htmlFor="venda-de" className="filter-label">De</label>
          <input id="venda-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="venda-ate" className="filter-label">Até</label>
          <input id="venda-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="venda-produto" className="filter-label">Produto</label>
          <select
            id="venda-produto"
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>
```

### `PerdasPage.tsx`

Usa `div.filter-bar`, apenas De/Até. Atenção: após o `btn-secondary` há um `<span>` de resumo que deve ser mantido dentro do `FilterBar` (como filho extra).

- [ ] **Step 7: Adicionar import**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 8: Ajustar `handleFiltrar`**

Localizar:
```tsx
  const handleFiltrar = () => carregar(de, ate)
```

Substituir por:
```tsx
  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate)
  }
```

- [ ] **Step 9: Substituir o bloco do filtro**

Localizar:
```tsx
      <div className="filter-bar" role="search" aria-label="Filtrar perdas">
        <div>
          <label htmlFor="perdas-de" className="filter-label">De</label>
          <input id="perdas-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="perdas-ate" className="filter-label">Até</label>
          <input id="perdas-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">
          Filtrar
        </button>
        {perdas.length > 0 && (
          <span className="ml-auto text-sm" style={{ color: 'var(--ada-muted)' }}>
            {perdas.length} registro(s) — total de{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-error-text)' }}>
              {totalPerdas.toFixed(0)} un.
            </span>
          </span>
        )}
      </div>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar perdas">
        <div>
          <label htmlFor="perdas-de" className="filter-label">De</label>
          <input id="perdas-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="perdas-ate" className="filter-label">Até</label>
          <input id="perdas-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => setDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => setAte('') }] : []),
          ]}
        />
        {perdas.length > 0 && (
          <span className="ml-auto text-sm" style={{ color: 'var(--ada-muted)' }}>
            {perdas.length} registro(s) — total de{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-error-text)' }}>
              {totalPerdas.toFixed(0)} un.
            </span>
          </span>
        )}
      </FilterBar>
```

### `EntradasPage.tsx`

Usa `form.filter-bar` com `handleFiltrar = (e) => { e.preventDefault(); carregar() }`. Tem um `<CalendarIcon>` como primeiro filho dentro do filtro.

- [ ] **Step 10: Adicionar import**

```tsx
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
```

- [ ] **Step 11: Substituir o bloco do filtro**

Localizar:
```tsx
      <form onSubmit={handleFiltrar} className="filter-bar" aria-label="Filtrar entradas">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <div>
          <label htmlFor="entrada-de" className="filter-label">De</label>
          <input
            id="entrada-de"
            type="date"
            value={de}
            onChange={e => atualizarDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label htmlFor="entrada-ate" className="filter-label">Até</label>
          <input
            id="entrada-ate"
            type="date"
            value={ate}
            onChange={e => atualizarAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
      </form>
```

Substituir por:
```tsx
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar entradas">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <div>
          <label htmlFor="entrada-de" className="filter-label">De</label>
          <input
            id="entrada-de"
            type="date"
            value={de}
            onChange={e => atualizarDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label htmlFor="entrada-ate" className="filter-label">Até</label>
          <input
            id="entrada-ate"
            type="date"
            value={ate}
            onChange={e => atualizarAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <FilterBarActions
          chips={[
            ...(de ? [{ label: `De: ${de.split('-').reverse().join('/')}`, onRemove: () => atualizarDe('') }] : []),
            ...(ate ? [{ label: `Até: ${ate.split('-').reverse().join('/')}`, onRemove: () => atualizarAte('') }] : []),
          ]}
        />
      </FilterBar>
```

- [ ] **Step 12: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 13: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx
git add CasaDiAna/frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx
git add CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx
git add CasaDiAna/frontend/src/features/entradas/pages/EntradasPage.tsx
git commit -m "feat(filtros): migrar ProducaoDiaria, VendasDiarias, Perdas e Entradas para FilterBar"
```
