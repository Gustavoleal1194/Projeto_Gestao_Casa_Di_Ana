# Redesign Filter Bar — Design Spec

## Goal

Elevar o componente de filtro de todas as telas do ERP ao padrão SaaS premium: container integrado ao layout sem bordas externas, botão de ação com identidade azul, chips removíveis para filtros ativos, e botão ghost definido para ações terciárias.

## Contexto

O filtro atual usa `.filter-bar` (card com borda), `.btn-secondary` como botão de ação (neutro, sem cor), e não tem padrão para limpar filtros. O `btn-ghost` é referenciado em uma tela mas não está definido no CSS.

---

## Linguagem Visual

### Container `.filter-bar`

- **Sem borda externa** — remove o `border: 1px solid var(--ada-border)` atual
- **Separador inferior** — `border-bottom: 1px solid var(--ada-border-sub)`
- **Elevação sutil** — `box-shadow: var(--shadow-xs)`
- **Fundo** — `var(--ada-surface)` (sem mudança)
- **Padding** — `1rem 1.25rem` (era `1rem`)
- **Border-radius** — `0` — sangra nas bordas da página, integrando ao layout (estilo Vercel/Linear)
- **Layout** — `flex wrap`, `gap: 0.75rem`, `align-items: flex-end`

### Botão de ação `.btn-filter` (novo)

Substitui `btn-secondary` dentro de contextos de filtro.

- **Background** — `linear-gradient(135deg, #4080EF 0%, #2563EB 100%)`
- **Texto** — `#ffffff`
- **Sombra** — `0 3px 10px rgba(37,99,235,0.25)`
- **Hover** — sombra eleva para `0 5px 16px rgba(37,99,235,0.38)`
- **Focus** — `outline: 2px solid rgba(37,99,235,0.45)`, `outline-offset: 2px`
- **Disabled** — `opacity: 0.55; cursor: not-allowed`
- **Tipografia** — mesma dos outros botões: Sora, 0.875rem, font-weight 600
- **Padding/radius** — `0.5rem 1rem`, `border-radius: 0.75rem`

### Chips `.filter-chip` (novo)

Aparece como segunda linha dentro do `.filter-bar` quando há filtro ativo.

- **Background** — `rgba(64,128,239,0.10)`
- **Border** — `1px solid rgba(64,128,239,0.22)`
- **Texto** — `#4080EF` (light) / `#6BA3FF` (dark via `var(--ada-accent-muted)` se existir, senão hardcoded)
- **Forma** — pill: `border-radius: 999px`, `padding: 0.25rem 0.5rem 0.25rem 0.75rem`
- **Conteúdo** — label + botão `×` à direita
- **Tamanho** — `font-size: 12px`, `font-weight: 500`
- **Botão `×`** — `font-size: 14px`, `color: inherit`, `opacity: 0.6`, hover `opacity: 1`
- **Animação** — `transition: opacity 150ms, transform 150ms`; entra com `opacity: 0, transform: scale(0.9)` e vai a `opacity: 1, scale(1)`

### Botão ghost `.btn-ghost` (definido)

Para ações terciárias (ex: "ver todos", links de navegação dentro de cards).

- **Background** — transparente
- **Borda** — nenhuma
- **Texto** — `var(--ada-muted)`
- **Hover** — `background: var(--ada-surface-2)`
- **Border-radius** — `0.5rem`
- **Padding** — `0.375rem 0.75rem`
- **Cursor** — pointer

---

## Componentes React

### `<FilterBar>` — `src/components/ui/FilterBar.tsx`

```tsx
interface FilterBarProps {
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  children: React.ReactNode
  ariaLabel?: string
}
```

- Renderiza um `<form>` com `className="filter-bar"`
- Expõe `onSubmit` e `loading` via contexto interno para o botão filho
- `children` contém os campos (inputs, selects, labels) e o `<FilterBarActions>`

### `<FilterBarActions>` — sub-componente no mesmo arquivo

```tsx
interface FilterBarActionsProps {
  submitLabel?: string         // default: "Filtrar"
  loadingLabel?: string        // default: "Carregando…"
  loading?: boolean
  chips?: FilterChipDef[]      // chips a exibir
}

interface FilterChipDef {
  label: string                // ex: "De: 01/04/2026"
  onRemove: () => void
}
```

- Renderiza o `<button type="submit" className="btn-filter">`
- Renderiza os `<FilterChip>` abaixo dos inputs quando `chips` tem itens
- Linha de chips separada do row de inputs por `flex-wrap` natural

### `<FilterChip>` — sub-componente no mesmo arquivo

```tsx
interface FilterChipProps {
  label: string
  onRemove: () => void
}
```

- Pill com label e `×`
- `onRemove` chamado no click do `×`

---

## Migração das páginas

### Páginas com filtro de data (relatórios)

Padrão atual:
```tsx
<form className="filter-bar" onSubmit={handleFiltrar}>
  <div><label className="filter-label">De</label><input className="filter-input" .../></div>
  <div><label className="filter-label">Até</label><input className="filter-input" .../></div>
  <button type="submit" className="btn-secondary">Filtrar</button>
  {de && <button className="btn-ghost" onClick={...}>Limpar período</button>}
</form>
```

Padrão novo:
```tsx
<FilterBar onSubmit={handleFiltrar} loading={loading}>
  <div><label className="filter-label">De</label><input className="filter-input" .../></div>
  <div><label className="filter-label">Até</label><input className="filter-input" .../></div>
  <FilterBarActions
    submitLabel="Filtrar"
    loadingLabel="Carregando…"
    loading={loading}
    chips={[
      ...(de ? [{ label: `De: ${fmtData(de)}`, onRemove: () => setDe('') }] : []),
      ...(ate ? [{ label: `Até: ${fmtData(ate)}`, onRemove: () => setAte('') }] : []),
    ]}
  />
</FilterBar>
```

### Páginas com filtro de texto (busca)

Mesma estrutura. Chip: `{ label: `Busca: "${busca}"`, onRemove: () => setBusca('') }`.

### Páginas com filtro de select (status, fornecedor)

Chip: `{ label: `Status: Confirmada`, onRemove: () => setStatus('') }`.

### Páginas afetadas (27 arquivos com `filter-bar`)

Migrar as páginas de listagem e relatórios. Modais (`ModalCategoria`, etc.) que usam `btn-secondary` isolado **não** são migrados — o `btn-secondary` permanece para uso fora de filtros.

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `frontend/src/components/ui/FilterBar.tsx` | Criar |
| `frontend/src/index.css` | Modificar: `.filter-bar`, adicionar `.btn-filter`, `.filter-chip`, `.btn-ghost` |
| `frontend/src/features/relatorios/pages/*.tsx` (6 arquivos) | Migrar |
| `frontend/src/features/entradas/pages/EntradasPage.tsx` | Migrar |
| `frontend/src/features/inventarios/pages/InventariosPage.tsx` | Migrar |
| `frontend/src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx` | Migrar |
| `frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx` | Migrar |
| `frontend/src/features/producao/perdas/pages/PerdasPage.tsx` | Migrar |
| `frontend/src/features/producao/produtos/pages/ProdutosPage.tsx` | Migrar |
| `frontend/src/features/fornecedores/pages/FornecedoresPage.tsx` | Migrar |
| `frontend/src/features/estoque/ingredientes/pages/IngredientesPage.tsx` | Migrar |
| `frontend/src/features/usuarios/pages/UsuariosPage.tsx` | Migrar |
| `frontend/src/features/notificacoes/pages/NotificacoesPage.tsx` | Migrar |

Modais e páginas sem `filter-bar` (correcao, categorias, etc.) são deixados para depois — usam `btn-secondary` em contextos diferentes.

---

## Não está no escopo

- Redesign de botões fora de filtros (`btn-primary`, `btn-danger`, `btn-secondary` em modais)
- Novos tipos de input (search com ícone lupa, datepicker customizado)
- Filtros com estado persistido em URL/localStorage
- Animação de abertura/fechamento do painel de filtros
