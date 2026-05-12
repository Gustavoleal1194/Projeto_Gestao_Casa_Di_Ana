# Filtros de Busca nas Tabelas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar filtros de busca nas tabelas de Produtos, Fornecedores, Categorias e Usuários, seguindo rigorosamente o padrão visual e de código do `FiltrosIngredientes.tsx`.

**Architecture:** Cada módulo recebe seu próprio componente `Filtros<Modulo>.tsx` em `components/` (padrão existente em ingredientes). A filtragem é client-side com `useMemo` na page. A implementação anterior (`BuscaTabela.tsx`) deve ser removida e as páginas revertidas antes de reimplementar corretamente.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS v4, tokens `var(--ada-*)`, heroicons/react 20/solid.

---

## Contexto obrigatório antes de qualquer task

Leia antes de começar:
- `CasaDiAna/frontend/src/features/estoque/ingredientes/components/FiltrosIngredientes.tsx` — **referência de design e código** para todos os componentes deste plano.
- `CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredientesPage.tsx` — **referência de integração** (useMemo, handlers, reset de paginação).
- `CasaDiAna/frontend/src/index.css` linhas 41–101 — tokens `var(--ada-*)` e regras de tema.

## Padrão visual obrigatório (extraído de FiltrosIngredientes)

```tsx
// Container do painel de filtros
<div
  className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center"
  style={{
    background: 'var(--ada-surface)',
    border: '1px solid var(--ada-border)',
    boxShadow: 'var(--shadow-xs)',
  }}
>
  {/* Ícone funil — fica âmbar quando qualquer filtro está ativo */}
  <FunnelIcon
    className="h-4 w-4 shrink-0"
    aria-hidden="true"
    style={{ color: temFiltroAtivo ? '#C4870A' : 'var(--ada-placeholder)' }}
  />

  {/* Campo de busca */}
  <div className="relative flex-1 min-w-[200px]">
    <MagnifyingGlassIcon
      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
      aria-hidden="true"
      style={{ color: 'var(--ada-placeholder)' }}
    />
    <label htmlFor="busca-X" className="sr-only">Buscar X</label>
    <input
      id="busca-X"
      type="search"
      name="busca"
      placeholder="Buscar por …"
      value={busca}
      onChange={e => onBuscaChange(e.target.value)}
      className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                 focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
      style={{
        background: 'var(--ada-surface-2)',
        border: '1px solid var(--ada-border)',
        color: 'var(--ada-heading)',
      }}
    />
  </div>

  {/* Dropdown (quando houver) */}
  <div className="relative min-w-[180px]">
    <label htmlFor="filtro-X" className="sr-only">Filtrar por X</label>
    <select
      id="filtro-X"
      value={valorSelecionado}
      onChange={e => onValorChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 text-sm appearance-none outline-none pr-8
                 transition-all duration-200 cursor-pointer
                 focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
      style={{
        background: 'var(--ada-surface-2)',
        border: '1px solid var(--ada-border)',
        color: valorSelecionado ? 'var(--ada-heading)' : 'var(--ada-muted)',
      }}
    >
      <option value="">Todas …</option>
      {opcoes.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
    </select>
    {/* Chevron customizado */}
    <svg
      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5"
      style={{ color: 'var(--ada-muted)' }}
      viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
    >
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
    </svg>
  </div>
</div>
```

## Padrão de integração na page (extraído de IngredientesPage)

```tsx
// 1. Estado de filtros
const [busca, setBusca] = useState('')
const [categoriaId, setCategoriaId] = useState('')  // quando houver dropdown

// 2. Filtragem com useMemo (OBRIGATÓRIO — não filtrar inline no render)
const filtrados = useMemo(() => {
  const termo = busca.toLowerCase().trim()
  return itens.filter(item => {
    if (termo && !item.nome.toLowerCase().includes(termo)) return false
    if (categoriaId && item.categoriaNome !== categoriaId) return false
    return true
  })
}, [itens, busca, categoriaId])

// 3. Handlers com reset de página (quando houver paginação)
const handleBusca = (v: string) => { setBusca(v); setPaginaAtual(1) }

// 4. Componente de filtros
<FiltrosX
  busca={busca}
  onBuscaChange={handleBusca}
  // ... outros filtros
/>

// 5. Tabela renderiza `filtrados`, não `itens`
// 6. Mensagem de vazio quando filtrados.length === 0 e busca ativa
```

## Mensagem de resultado vazio na tabela

Quando `filtrados.length === 0` e há filtro ativo, mostrar dentro do tbody:

```tsx
<tr>
  <td
    colSpan={N_COLUNAS}
    className="table-td text-center py-10 text-sm"
    style={{ color: 'var(--ada-muted)' }}
  >
    Nenhum resultado para{' '}
    <span className="font-semibold" style={{ color: 'var(--ada-body)' }}>
      "{busca}"
    </span>
    .
  </td>
</tr>
```

---

## Estrutura de arquivos

| Ação | Arquivo |
|---|---|
| **Deletar** | `CasaDiAna/frontend/src/components/ui/BuscaTabela.tsx` |
| **Criar** | `CasaDiAna/frontend/src/features/producao/produtos/components/FiltrosProdutos.tsx` |
| **Criar** | `CasaDiAna/frontend/src/features/fornecedores/components/FiltrosFornecedores.tsx` |
| **Criar** | `CasaDiAna/frontend/src/features/estoque/categorias/components/FiltrosCategorias.tsx` |
| **Criar** | `CasaDiAna/frontend/src/features/usuarios/components/FiltrosUsuarios.tsx` |
| **Modificar** | `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutosPage.tsx` |
| **Modificar** | `CasaDiAna/frontend/src/features/fornecedores/pages/FornecedoresPage.tsx` |
| **Modificar** | `CasaDiAna/frontend/src/features/estoque/categorias/pages/CategoriasPage.tsx` |
| **Modificar** | `CasaDiAna/frontend/src/features/usuarios/pages/UsuariosPage.tsx` |

---

## Task 1: Reverter implementação anterior e deletar BuscaTabela

**Files:**
- Delete: `CasaDiAna/frontend/src/components/ui/BuscaTabela.tsx`
- Revert: `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutosPage.tsx`
- Revert: `CasaDiAna/frontend/src/features/fornecedores/pages/FornecedoresPage.tsx`
- Revert: `CasaDiAna/frontend/src/features/estoque/categorias/pages/CategoriasPage.tsx`
- Revert: `CasaDiAna/frontend/src/features/usuarios/pages/UsuariosPage.tsx`

- [ ] **Step 1: Deletar BuscaTabela.tsx**

```bash
rm "CasaDiAna/frontend/src/components/ui/BuscaTabela.tsx"
```

- [ ] **Step 2: Reverter ProdutosPage.tsx ao estado sem busca**

Remover:
- `import { BuscaTabela } from '@/components/ui/BuscaTabela'`
- `const [busca, setBusca] = useState('')`
- O bloco `produtosFiltrados = busca.trim() ? produtos.filter(...) : produtos`
- O bloco JSX `{!loading && !erro && produtos.length > 0 && (<BuscaTabela .../>)}`
- Reverter `produtosFiltrados.length === 0 ? ...` de volta para `produtos.map(p => (`
- Reverter `produtosFiltrados.map(p => (` de volta para `produtos.map(p => (`

Estado final esperado de ProdutosPage — importações:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon, DocumentTextIcon, CubeIcon } from '@heroicons/react/20/solid'
import { useProdutos } from '../hooks/useProdutos'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Toast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ProdutoResumo } from '@/types/producao'
```

tbody após reversão:
```tsx
<tbody>
  {produtos.map(p => (
    <tr key={p.id} className="table-row group">
```

- [ ] **Step 3: Reverter FornecedoresPage.tsx ao estado sem busca**

Remover:
- `import { BuscaTabela } from '@/components/ui/BuscaTabela'`
- `const [busca, setBusca] = useState('')`
- O bloco `fornecedoresFiltrados = ...`
- O bloco JSX `{!loading && !erro && fornecedores.length > 0 && (<BuscaTabela .../>)}`
- Reverter tbody: remover o `{fornecedoresFiltrados.length === 0 ? ... : fornecedoresFiltrados.map(f => (`

Estado final tbody:
```tsx
<tbody>
  {fornecedores.map(f => (
    <tr key={f.id} className="table-row group">
```

- [ ] **Step 4: Reverter CategoriasPage.tsx ao estado sem busca**

Remover:
- `import { BuscaTabela } from '@/components/ui/BuscaTabela'`
- `const [busca, setBusca] = useState('')`
- O bloco JSX `{!loading && !erro && categorias.length > 0 && (<BuscaTabela .../>)}`
- Voltar `<TabelaCategorias categorias={categorias}` (sem o filtro inline)

Estado final:
```tsx
{!loading && !erro && (
  <TabelaCategorias
    categorias={categorias}
    podeEditar={podeEditar}
    onEditar={abrirEditar}
    onDesativar={setParaDesativar}
  />
)}
```

- [ ] **Step 5: Reverter UsuariosPage.tsx ao estado sem busca**

Remover:
- `import { BuscaTabela } from '@/components/ui/BuscaTabela'`
- `const [busca, setBusca] = useState('')`
- O bloco `usuariosFiltrados = ...`
- O bloco JSX `{!loading && !erro && usuarios.length > 0 && (<BuscaTabela .../>)}`
- Reverter tbody: `{usuarios.map(u => (`

- [ ] **Step 6: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add CasaDiAna/frontend/src/components/ui/BuscaTabela.tsx \
        CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutosPage.tsx \
        CasaDiAna/frontend/src/features/fornecedores/pages/FornecedoresPage.tsx \
        CasaDiAna/frontend/src/features/estoque/categorias/pages/CategoriasPage.tsx \
        CasaDiAna/frontend/src/features/usuarios/pages/UsuariosPage.tsx
git commit -m "revert: remover BuscaTabela e reverter páginas para re-implementação correta"
```

---

## Task 2: FiltrosProdutos + integração em ProdutosPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/producao/produtos/components/FiltrosProdutos.tsx`
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutosPage.tsx`

**Contexto:** `ProdutoResumo` tem `{ id, nome, categoriaNome: string | null, precoVenda, ativo }`. O hook `useCategoriasProduto()` retorna `{ categorias: CategoriaProduto[] }` com `{ id, nome, ativo }`. A filtragem compara `item.categoriaNome` com `cat.nome` (não com id), igual ao padrão em `IngredientesPage`.

- [ ] **Step 1: Criar FiltrosProdutos.tsx**

```tsx
// CasaDiAna/frontend/src/features/producao/produtos/components/FiltrosProdutos.tsx
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/20/solid'
import type { CategoriaProduto } from '@/types/producao'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  categoriaId: string
  onCategoriaChange: (v: string) => void
  categorias: CategoriaProduto[]
}

export function FiltrosProdutos({
  busca,
  onBuscaChange,
  categoriaId,
  onCategoriaChange,
  categorias,
}: Props) {
  const temFiltroAtivo = !!busca || !!categoriaId

  return (
    <div
      className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <FunnelIcon
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        style={{ color: temFiltroAtivo ? '#C4870A' : 'var(--ada-placeholder)' }}
      />

      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          aria-hidden="true"
          style={{ color: 'var(--ada-placeholder)' }}
        />
        <label htmlFor="busca-produto" className="sr-only">Buscar produto</label>
        <input
          id="busca-produto"
          type="search"
          name="busca"
          placeholder="Buscar por nome…"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: 'var(--ada-heading)',
          }}
        />
      </div>

      <div className="relative min-w-[180px]">
        <label htmlFor="filtro-categoria-produto" className="sr-only">Filtrar por categoria</label>
        <select
          id="filtro-categoria-produto"
          value={categoriaId}
          onChange={e => onCategoriaChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm appearance-none outline-none pr-8
                     transition-all duration-200 cursor-pointer
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: categoriaId ? 'var(--ada-heading)' : 'var(--ada-muted)',
          }}
        >
          <option value="">Todas as categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5"
          style={{ color: 'var(--ada-muted)' }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
        </svg>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar ProdutosPage.tsx**

Adicionar imports:
```tsx
import { useState, useMemo } from 'react'
import { useCategoriasProduto } from '@/features/producao/categorias-produto/hooks/useCategoriasProduto'
import { FiltrosProdutos } from '../components/FiltrosProdutos'
```

Adicionar hooks e estado no corpo do componente (após as linhas existentes de `useProdutos` e `useAuthStore`):
```tsx
const { categorias } = useCategoriasProduto()

const [busca, setBusca] = useState('')
const [categoriaId, setCategoriaId] = useState('')

const filtrados = useMemo(() => {
  const termo = busca.toLowerCase().trim()
  return produtos.filter(p => {
    if (termo && !p.nome.toLowerCase().includes(termo)) return false
    if (categoriaId) {
      const cat = categorias.find(c => c.id === categoriaId)
      if (cat && p.categoriaNome !== cat.nome) return false
    }
    return true
  })
}, [produtos, busca, categoriaId, categorias])
```

Adicionar o componente de filtros no JSX (após `</PageHeader>` e antes do bloco de estados):
```tsx
{/* ── Filtros ──────────────────────────────────────────────────────── */}
<FiltrosProdutos
  busca={busca}
  onBuscaChange={setBusca}
  categoriaId={categoriaId}
  onCategoriaChange={setCategoriaId}
  categorias={categorias}
/>
```

Atualizar o tbody para usar `filtrados`:
```tsx
<tbody>
  {filtrados.length === 0 ? (
    <tr>
      <td
        colSpan={podeEditar ? 5 : 4}
        className="table-td text-center py-10 text-sm"
        style={{ color: 'var(--ada-muted)' }}
      >
        Nenhum resultado para{' '}
        <span className="font-semibold" style={{ color: 'var(--ada-body)' }}>
          "{busca || categoriaId}"
        </span>
        .
      </td>
    </tr>
  ) : filtrados.map(p => (
    <tr key={p.id} className="table-row group">
      {/* ... restante das células inalterado ... */}
    </tr>
  ))}
</tbody>
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/produtos/components/FiltrosProdutos.tsx \
        CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutosPage.tsx
git commit -m "feat(produtos): adicionar filtros de busca e categoria seguindo padrão FiltrosIngredientes"
```

---

## Task 3: FiltrosFornecedores + integração em FornecedoresPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/fornecedores/components/FiltrosFornecedores.tsx`
- Modify: `CasaDiAna/frontend/src/features/fornecedores/pages/FornecedoresPage.tsx`

**Contexto:** `Fornecedor` tem `{ razaoSocial, nomeFantasia: string | null, cnpj: string | null, telefone, email, ativo }`. Filtrar por: texto livre em razaoSocial + nomeFantasia + CNPJ.

- [ ] **Step 1: Criar FiltrosFornecedores.tsx**

```tsx
// CasaDiAna/frontend/src/features/fornecedores/components/FiltrosFornecedores.tsx
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/20/solid'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
}

export function FiltrosFornecedores({ busca, onBuscaChange }: Props) {
  const temFiltroAtivo = !!busca

  return (
    <div
      className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <FunnelIcon
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        style={{ color: temFiltroAtivo ? '#C4870A' : 'var(--ada-placeholder)' }}
      />

      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          aria-hidden="true"
          style={{ color: 'var(--ada-placeholder)' }}
        />
        <label htmlFor="busca-fornecedor" className="sr-only">Buscar fornecedor</label>
        <input
          id="busca-fornecedor"
          type="search"
          name="busca"
          placeholder="Buscar por razão social, nome fantasia ou CNPJ…"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: 'var(--ada-heading)',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar FornecedoresPage.tsx**

Adicionar imports:
```tsx
import { useState, useMemo } from 'react'
import { FiltrosFornecedores } from '../components/FiltrosFornecedores'
```

Adicionar estado e useMemo (após os existentes):
```tsx
const [busca, setBusca] = useState('')

const filtrados = useMemo(() => {
  const termo = busca.toLowerCase().trim()
  if (!termo) return fornecedores
  return fornecedores.filter(f =>
    f.razaoSocial.toLowerCase().includes(termo)
    || (f.nomeFantasia ?? '').toLowerCase().includes(termo)
    || (f.cnpj ?? '').includes(termo)
  )
}, [fornecedores, busca])
```

Adicionar o componente de filtros (após `</PageHeader>`):
```tsx
{/* ── Filtros ──────────────────────────────────────────────────────── */}
<FiltrosFornecedores
  busca={busca}
  onBuscaChange={setBusca}
/>
```

Atualizar tbody:
```tsx
<tbody>
  {filtrados.length === 0 ? (
    <tr>
      <td
        colSpan={podeEditar ? 5 : 4}
        className="table-td text-center py-10 text-sm"
        style={{ color: 'var(--ada-muted)' }}
      >
        Nenhum resultado para{' '}
        <span className="font-semibold" style={{ color: 'var(--ada-body)' }}>
          "{busca}"
        </span>
        .
      </td>
    </tr>
  ) : filtrados.map(f => (
    <tr key={f.id} className="table-row group">
      {/* ... células inalteradas ... */}
    </tr>
  ))}
</tbody>
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/fornecedores/components/FiltrosFornecedores.tsx \
        CasaDiAna/frontend/src/features/fornecedores/pages/FornecedoresPage.tsx
git commit -m "feat(fornecedores): adicionar filtro de busca seguindo padrão FiltrosIngredientes"
```

---

## Task 4: FiltrosCategorias + integração em CategoriasPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/estoque/categorias/components/FiltrosCategorias.tsx`
- Modify: `CasaDiAna/frontend/src/features/estoque/categorias/pages/CategoriasPage.tsx`

**Contexto:** `CategoriaIngrediente` tem `{ id, nome, ativo }`. A CategoriasPage passa `categorias` para `TabelaCategorias` — basta passar `filtrados` no lugar.

- [ ] **Step 1: Criar FiltrosCategorias.tsx**

```tsx
// CasaDiAna/frontend/src/features/estoque/categorias/components/FiltrosCategorias.tsx
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/20/solid'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
}

export function FiltrosCategorias({ busca, onBuscaChange }: Props) {
  const temFiltroAtivo = !!busca

  return (
    <div
      className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <FunnelIcon
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        style={{ color: temFiltroAtivo ? '#C4870A' : 'var(--ada-placeholder)' }}
      />

      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          aria-hidden="true"
          style={{ color: 'var(--ada-placeholder)' }}
        />
        <label htmlFor="busca-categoria" className="sr-only">Buscar categoria</label>
        <input
          id="busca-categoria"
          type="search"
          name="busca"
          placeholder="Buscar por nome…"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: 'var(--ada-heading)',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar CategoriasPage.tsx**

Adicionar imports:
```tsx
import { useState, useMemo } from 'react'
import { FiltrosCategorias } from '../components/FiltrosCategorias'
```

Adicionar estado e useMemo (após os existentes):
```tsx
const [busca, setBusca] = useState('')

const filtradas = useMemo(() => {
  const termo = busca.toLowerCase().trim()
  if (!termo) return categorias
  return categorias.filter(c => c.nome.toLowerCase().includes(termo))
}, [categorias, busca])
```

Adicionar filtros no JSX (após `</PageHeader>` e antes dos estados de loading):
```tsx
{/* ── Filtros ──────────────────────────────────────────────────────── */}
<FiltrosCategorias
  busca={busca}
  onBuscaChange={setBusca}
/>
```

Passar `filtradas` para `TabelaCategorias`:
```tsx
{!loading && !erro && (
  <TabelaCategorias
    categorias={filtradas}
    podeEditar={podeEditar}
    onEditar={abrirEditar}
    onDesativar={setParaDesativar}
  />
)}
```

**Nota:** `TabelaCategorias` já renderiza `EmptyState` quando `categorias.length === 0`, então não é necessário adicionar mensagem extra.

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/estoque/categorias/components/FiltrosCategorias.tsx \
        CasaDiAna/frontend/src/features/estoque/categorias/pages/CategoriasPage.tsx
git commit -m "feat(categorias): adicionar filtro de busca seguindo padrão FiltrosIngredientes"
```

---

## Task 5: FiltrosUsuarios + integração em UsuariosPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/usuarios/components/FiltrosUsuarios.tsx`
- Modify: `CasaDiAna/frontend/src/features/usuarios/pages/UsuariosPage.tsx`

**Contexto:** `UsuarioDto` tem `{ id, nome, email, papel, ativo, twoFactorHabilitado, ultimoLogin }`. Filtrar por: texto livre em nome + email; dropdown por papel.

Os papéis disponíveis (constante já existente em UsuariosPage):
```ts
const PAPEIS = ['Admin','Coordenador','OperadorCozinha','OperadorPanificacao','OperadorBar','Compras']
const PAPEL_LABEL: Record<string, string> = {
  Admin: 'Admin', Coordenador: 'Coordenador',
  OperadorCozinha: 'Op. Cozinha', OperadorPanificacao: 'Op. Panificação',
  OperadorBar: 'Op. Bar', Compras: 'Compras',
}
```

- [ ] **Step 1: Criar FiltrosUsuarios.tsx**

```tsx
// CasaDiAna/frontend/src/features/usuarios/components/FiltrosUsuarios.tsx
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/20/solid'

const PAPEIS = ['Admin','Coordenador','OperadorCozinha','OperadorPanificacao','OperadorBar','Compras']
const PAPEL_LABEL: Record<string, string> = {
  Admin: 'Admin',
  Coordenador: 'Coordenador',
  OperadorCozinha: 'Op. Cozinha',
  OperadorPanificacao: 'Op. Panificação',
  OperadorBar: 'Op. Bar',
  Compras: 'Compras',
}

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  papel: string
  onPapelChange: (v: string) => void
}

export function FiltrosUsuarios({ busca, onBuscaChange, papel, onPapelChange }: Props) {
  const temFiltroAtivo = !!busca || !!papel

  return (
    <div
      className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <FunnelIcon
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        style={{ color: temFiltroAtivo ? '#C4870A' : 'var(--ada-placeholder)' }}
      />

      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          aria-hidden="true"
          style={{ color: 'var(--ada-placeholder)' }}
        />
        <label htmlFor="busca-usuario" className="sr-only">Buscar usuário</label>
        <input
          id="busca-usuario"
          type="search"
          name="busca"
          placeholder="Buscar por nome ou e-mail…"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: 'var(--ada-heading)',
          }}
        />
      </div>

      <div className="relative min-w-[180px]">
        <label htmlFor="filtro-papel" className="sr-only">Filtrar por papel</label>
        <select
          id="filtro-papel"
          value={papel}
          onChange={e => onPapelChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm appearance-none outline-none pr-8
                     transition-all duration-200 cursor-pointer
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            background: 'var(--ada-surface-2)',
            border: '1px solid var(--ada-border)',
            color: papel ? 'var(--ada-heading)' : 'var(--ada-muted)',
          }}
        >
          <option value="">Todos os papéis</option>
          {PAPEIS.map(p => (
            <option key={p} value={p}>{PAPEL_LABEL[p] ?? p}</option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5"
          style={{ color: 'var(--ada-muted)' }}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
        </svg>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar UsuariosPage.tsx**

Mudar import de `useEffect, useState` para também incluir `useMemo`:
```tsx
import { useEffect, useState, useMemo } from 'react'
```

Adicionar import do componente:
```tsx
import { FiltrosUsuarios } from '../components/FiltrosUsuarios'
```

Adicionar estado e useMemo (após `const [usuarios, setUsuarios] = useState<UsuarioDto[]>([])`):
```tsx
const [busca, setBusca] = useState('')
const [papel, setPapel] = useState('')

const filtrados = useMemo(() => {
  const termo = busca.toLowerCase().trim()
  return usuarios.filter(u => {
    if (termo && !u.nome.toLowerCase().includes(termo) && !u.email.toLowerCase().includes(termo)) return false
    if (papel && u.papel !== papel) return false
    return true
  })
}, [usuarios, busca, papel])
```

Adicionar o componente de filtros no JSX (após `</PageHeader>` e antes do bloco de estados):
```tsx
{/* ── Filtros ──────────────────────────────────────────────────────── */}
<FiltrosUsuarios
  busca={busca}
  onBuscaChange={setBusca}
  papel={papel}
  onPapelChange={setPapel}
/>
```

Atualizar tbody para usar `filtrados`:
```tsx
<tbody>
  {filtrados.length === 0 ? (
    <tr>
      <td
        colSpan={7}
        className="table-td text-center py-10 text-sm"
        style={{ color: 'var(--ada-muted)' }}
      >
        Nenhum resultado para{' '}
        <span className="font-semibold" style={{ color: 'var(--ada-body)' }}>
          "{busca || papel}"
        </span>
        .
      </td>
    </tr>
  ) : filtrados.map(u => (
    <tr key={u.id} className="table-row group">
      {/* ... células inalteradas ... */}
    </tr>
  ))}
</tbody>
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/usuarios/components/FiltrosUsuarios.tsx \
        CasaDiAna/frontend/src/features/usuarios/pages/UsuariosPage.tsx
git commit -m "feat(usuarios): adicionar filtros de busca e papel seguindo padrão FiltrosIngredientes"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Busca em Produtos (nome + categoria)
- ✅ Busca em Fornecedores (razaoSocial + nomeFantasia + CNPJ)
- ✅ Busca em Categorias (nome)
- ✅ Busca em Usuários (nome + email + papel)
- ✅ Design system: tokens `var(--ada-*)`, FunnelIcon âmbar, focus ring âmbar
- ✅ useMemo em todas as páginas
- ✅ Mensagem de resultado vazio com destaque no termo buscado
- ✅ Implementação anterior revertida

**2. Placeholder scan:** Nenhum placeholder encontrado.

**3. Type consistency:**
- `filtrados` → `ProdutoResumo[]`, `Fornecedor[]`, `CategoriaIngrediente[]`, `UsuarioDto[]` — todos corretos.
- `categorias` em FiltrosProdutos → `CategoriaProduto[]` do `useCategoriasProduto` — correto.
- `filtradas` em CategoriasPage (feminino) para consistência com `CategoriaIngrediente` — correto.
