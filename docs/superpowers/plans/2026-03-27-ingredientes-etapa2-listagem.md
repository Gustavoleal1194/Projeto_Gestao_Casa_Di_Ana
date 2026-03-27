# Ingredientes – Etapa 2: Tela de Listagem

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `IngredientesPage.tsx` completa — filtros, tabela, paginação client-side e desativação com confirmação.

**Architecture:** Página estática React que consome `useIngredientes`, `useCategorias` e `useAuthStore`. Paginação e filtros são client-side (dados já carregados em memória). Modal de confirmação simples sem biblioteca externa. Componentes locais da feature (não reutilizáveis ainda) para manter o escopo.

**Pre-requisitos:** Etapa 1 concluída (`api.ts`, `authStore.ts`, `types/estoque.ts`, `useIngredientes`, `useCategorias`).

---

## Mapa de arquivos desta etapa

| Arquivo | Responsabilidade |
|---------|-----------------|
| `ingredientes/pages/IngredientesPage.tsx` | Página principal com filtros + tabela + paginação |
| `ingredientes/components/TabelaIngredientes.tsx` | Tabela com linhas, badges e ações |
| `ingredientes/components/FiltrosIngredientes.tsx` | Barra de filtros (busca + categoria + toggle) |
| `ingredientes/components/ModalDesativar.tsx` | Modal de confirmação de desativação |
| `routes/AppRoutes.tsx` | Rotas da aplicação (rota `/estoque/ingredientes`) |
| `src/App.tsx` | Monta o router |

---

## Task 1: Componente `FiltrosIngredientes`

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/components/FiltrosIngredientes.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import type { CategoriaIngrediente } from '@/types/estoque'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  categoriaId: string
  onCategoriaChange: (v: string) => void
  apenasAbaixoMinimo: boolean
  onApenasAbaixoMinimoChange: (v: boolean) => void
  categorias: CategoriaIngrediente[]
}

export function FiltrosIngredientes({
  busca,
  onBuscaChange,
  categoriaId,
  onCategoriaChange,
  apenasAbaixoMinimo,
  onApenasAbaixoMinimoChange,
  categorias,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
      {/* Busca por nome */}
      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Filtro por categoria */}
      <select
        value={categoriaId}
        onChange={e => onCategoriaChange(e.target.value)}
        className="w-48 border border-stone-200 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      >
        <option value="">Todas as categorias</option>
        {categorias.map(c => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>

      {/* Toggle abaixo do mínimo */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={apenasAbaixoMinimo}
          onChange={e => onApenasAbaixoMinimoChange(e.target.checked)}
          className="h-4 w-4 rounded accent-amber-700"
        />
        <span className="text-sm text-stone-600">Abaixo do mínimo</span>
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/components/FiltrosIngredientes.tsx
git commit -m "feat: adicionar FiltrosIngredientes"
```

---

## Task 2: Componente `ModalDesativar`

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/components/ModalDesativar.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  nomeIngrediente: string
  loading: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalDesativar({ nomeIngrediente, loading, onConfirmar, onCancelar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-800">Desativar ingrediente</h2>
            <p className="text-sm text-stone-500 mt-0.5">Esta ação pode ser revertida depois.</p>
          </div>
        </div>

        <p className="text-sm text-stone-700 mb-6">
          Deseja desativar <span className="font-semibold">"{nomeIngrediente}"</span>?
          Ele não aparecerá mais nas listagens ativas.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="px-4 py-2 border border-stone-200 rounded-lg text-sm text-stone-600
                       hover:bg-stone-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                       text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            Desativar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/components/ModalDesativar.tsx
git commit -m "feat: adicionar ModalDesativar"
```

---

## Task 3: Componente `TabelaIngredientes`

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/components/TabelaIngredientes.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import { PencilSquareIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import type { IngredienteResumo } from '@/types/estoque'

interface Props {
  ingredientes: IngredienteResumo[]
  podeEditar: boolean
  podeDesativar: boolean
  onEditar: (id: string) => void
  onDesativar: (ingrediente: IngredienteResumo) => void
}

export function TabelaIngredientes({
  ingredientes,
  podeEditar,
  podeDesativar,
  onEditar,
  onDesativar,
}: Props) {
  if (ingredientes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm py-16 text-center">
        <div className="text-stone-300 text-5xl mb-3">🧂</div>
        <p className="text-stone-500 font-medium">Nenhum ingrediente encontrado</p>
        <p className="text-stone-400 text-sm mt-1">Tente ajustar os filtros ou cadastre um novo.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            {['Nome', 'Código', 'Categoria', 'Unidade', 'Estoque Atual / Mínimo', 'Ações'].map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredientes.map((ing, idx) => (
            <tr
              key={ing.id}
              className={`border-b border-stone-100 hover:bg-amber-50 transition-colors
                          ${idx === ingredientes.length - 1 ? 'border-b-0' : ''}`}
            >
              {/* Nome */}
              <td className="px-4 py-3 text-sm font-medium text-stone-800">
                {ing.nome}
              </td>

              {/* Código interno */}
              <td className="px-4 py-3 text-sm text-stone-500 font-mono">
                {ing.codigoInterno ?? '—'}
              </td>

              {/* Categoria */}
              <td className="px-4 py-3 text-sm text-stone-600">
                {ing.categoriaNome ?? <span className="text-stone-300">—</span>}
              </td>

              {/* Unidade */}
              <td className="px-4 py-3 text-sm text-stone-600">
                {ing.unidadeMedidaCodigo}
              </td>

              {/* Estoque */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-800">
                    {ing.estoqueAtual.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                  </span>
                  <span className="text-stone-300 text-xs">/</span>
                  <span className="text-xs text-stone-500">
                    {ing.estoqueMinimo.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                  </span>
                  {ing.estaBaixoDoMinimo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100
                                     text-red-700 rounded-full text-xs font-medium">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      Baixo
                    </span>
                  )}
                </div>
              </td>

              {/* Ações */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {podeEditar && (
                    <button
                      onClick={() => onEditar(ing.id)}
                      title="Editar"
                      className="p-1.5 rounded hover:bg-stone-100 text-stone-400
                                 hover:text-amber-700 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                  )}
                  {podeDesativar && (
                    <button
                      onClick={() => onDesativar(ing)}
                      title="Desativar"
                      className="p-1.5 rounded hover:bg-stone-100 text-stone-400
                                 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/components/TabelaIngredientes.tsx
git commit -m "feat: adicionar TabelaIngredientes"
```

---

## Task 4: Componente `Paginacao` (local, reutilizado na Etapa 3)

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/components/Paginacao.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface Props {
  paginaAtual: number
  totalPaginas: number
  totalItens: number
  itensPorPagina: number
  onPaginaChange: (pagina: number) => void
}

export function Paginacao({ paginaAtual, totalPaginas, totalItens, itensPorPagina, onPaginaChange }: Props) {
  if (totalPaginas <= 1) return null

  const inicio = (paginaAtual - 1) * itensPorPagina + 1
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens)

  // Gera lista de páginas visíveis: sempre mostra primeira, última e as 2 ao redor da atual
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1
  )

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-white rounded-b-xl">
      <span className="text-sm text-stone-500">
        Mostrando {inicio}–{fim} de {totalItens} ingredientes
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPaginaChange(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 text-stone-600" />
        </button>

        {paginas.map((p, idx) => {
          const anterior = paginas[idx - 1]
          const mostraReticencias = anterior && p - anterior > 1
          return (
            <span key={p} className="flex items-center gap-1">
              {mostraReticencias && <span className="text-stone-400 text-sm px-1">…</span>}
              <button
                onClick={() => onPaginaChange(p)}
                className={`min-w-[32px] h-8 rounded text-sm px-2
                  ${p === paginaAtual
                    ? 'bg-amber-700 text-white font-medium'
                    : 'hover:bg-stone-100 text-stone-600'
                  }`}
              >
                {p}
              </button>
            </span>
          )
        })}

        <button
          onClick={() => onPaginaChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-4 w-4 text-stone-600" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/components/Paginacao.tsx
git commit -m "feat: adicionar componente Paginacao"
```

---

## Task 5: `IngredientesPage.tsx` — página principal

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/pages/IngredientesPage.tsx`

- [ ] **Step 1: Criar a página**

```tsx
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useIngredientes } from '../hooks/useIngredientes'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useAuthStore } from '@/store/authStore'
import { TabelaIngredientes } from '../components/TabelaIngredientes'
import { FiltrosIngredientes } from '../components/FiltrosIngredientes'
import { ModalDesativar } from '../components/ModalDesativar'
import { Paginacao } from '../components/Paginacao'
import type { IngredienteResumo } from '@/types/estoque'

const ITENS_POR_PAGINA = 10

// Papéis que podem editar/desativar ingredientes
const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function IngredientesPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { ingredientes, loading, erro, desativar } = useIngredientes()
  const { categorias } = useCategorias()

  // ─── Filtros ───────────────────────────────────────────────────────────────
  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [apenasAbaixoMinimo, setApenasAbaixoMinimo] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)

  // ─── Modal de desativação ─────────────────────────────────────────────────
  const [paraDesativar, setParaDesativar] = useState<IngredienteResumo | null>(null)
  const [desativando, setDesativando] = useState(false)

  // ─── Permissões ───────────────────────────────────────────────────────────
  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const podeDesativar = temPapel(...PAPEIS_EDICAO)

  // ─── Filtragem client-side ────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return ingredientes.filter(ing => {
      if (termo && !ing.nome.toLowerCase().includes(termo)) return false
      if (categoriaId) {
        // filtramos pelo nome da categoria (não temos o id na lista resumo)
        // precisamos buscar a categoria pelo nome
        const cat = categorias.find(c => c.id === categoriaId)
        if (cat && ing.categoriaNome !== cat.nome) return false
      }
      if (apenasAbaixoMinimo && !ing.estaBaixoDoMinimo) return false
      return true
    })
  }, [ingredientes, busca, categoriaId, apenasAbaixoMinimo, categorias])

  // ─── Reset paginação ao filtrar ───────────────────────────────────────────
  const handleBusca = (v: string) => { setBusca(v); setPaginaAtual(1) }
  const handleCategoria = (v: string) => { setCategoriaId(v); setPaginaAtual(1) }
  const handleAbaixoMinimo = (v: boolean) => { setApenasAbaixoMinimo(v); setPaginaAtual(1) }

  // ─── Paginação ────────────────────────────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = filtrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  // ─── Desativação ─────────────────────────────────────────────────────────
  const confirmarDesativacao = useCallback(async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
    } finally {
      setDesativando(false)
    }
  }, [paraDesativar, desativar])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Ingredientes</h1>
        {podeEditar && (
          <button
            onClick={() => navigate('/estoque/ingredientes/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Ingrediente
          </button>
        )}
      </div>

      {/* Filtros */}
      <FiltrosIngredientes
        busca={busca}
        onBuscaChange={handleBusca}
        categoriaId={categoriaId}
        onCategoriaChange={handleCategoria}
        apenasAbaixoMinimo={apenasAbaixoMinimo}
        onApenasAbaixoMinimoChange={handleAbaixoMinimo}
        categorias={categorias}
      />

      {/* Estado de carregamento */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4
                          border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando ingredientes...</p>
        </div>
      )}

      {/* Estado de erro */}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Tabela */}
      {!loading && !erro && (
        <>
          <TabelaIngredientes
            ingredientes={paginados}
            podeEditar={podeEditar}
            podeDesativar={podeDesativar}
            onEditar={id => navigate(`/estoque/ingredientes/${id}/editar`)}
            onDesativar={setParaDesativar}
          />
          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalItens={filtrados.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onPaginaChange={setPaginaAtual}
          />
        </>
      )}

      {/* Modal de confirmação de desativação */}
      {paraDesativar && (
        <ModalDesativar
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={confirmarDesativacao}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/pages/IngredientesPage.tsx
git commit -m "feat: adicionar IngredientesPage"
```

---

## Task 6: Rotas da aplicação + LoginPage mínimo

**Files:**
- Create: `frontend/src/routes/AppRoutes.tsx`
- Create: `frontend/src/features/auth/pages/LoginPage.tsx` (placeholder para não quebrar o router)
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Criar `LoginPage.tsx` placeholder**

```tsx
// Placeholder — será substituído na Etapa de Auth
export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-stone-500">Tela de login — em desenvolvimento</p>
    </div>
  )
}
```

- [ ] **Step 2: Criar `AppRoutes.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { IngredientesPage } from '@/features/estoque/ingredientes/pages/IngredientesPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/estoque/ingredientes" element={<IngredientesPage />} />
        <Route path="/" element={<Navigate to="/estoque/ingredientes" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Atualizar `App.tsx`**

```tsx
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return <AppRoutes />
}
```

- [ ] **Step 4: Verificar a página no browser**

```bash
npm run dev
```

Acessar `http://localhost:5173/estoque/ingredientes`.

Esperado: página renderiza com header "Ingredientes", barra de filtros e estado de carregamento (ou erro de rede se o backend não estiver rodando — é esperado).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/ frontend/src/features/auth/ frontend/src/App.tsx
git commit -m "feat: adicionar rotas e IngredientesPage integrada"
```

---

## Task 7: Verificação final com o backend

- [ ] **Step 1: Garantir que o backend está rodando**

```bash
# Em outro terminal, dentro de CasaDiAna/
dotnet run --project src/CasaDiAna.API
```

Esperado: API em `http://localhost:5130`.

- [ ] **Step 2: Ajustar o `authStore` para simular um usuário logado (teste rápido)**

Em `src/App.tsx`, adicionar temporariamente antes do `return`:

```tsx
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const { login } = useAuthStore()
  useEffect(() => {
    // Token de teste — substitua por um token real gerado pelo POST /api/auth/login
    login('SEU_TOKEN_AQUI', { nome: 'Admin Teste', papel: 'Admin' })
  }, [login])
  return <AppRoutes />
}
```

- [ ] **Step 3: Testar com token real**

Usar curl ou Insomnia para obter um token:

```bash
curl -X POST http://localhost:5130/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@casadiana.com","senha":"senha123"}'
```

Copiar o campo `dados.token` e colar no `App.tsx` acima.

Acessar `http://localhost:5173/estoque/ingredientes` — tabela deve mostrar os dados do banco.

- [ ] **Step 4: Remover o hack de login do `App.tsx`**

Reverter `App.tsx` para:

```tsx
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return <AppRoutes />
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "chore: remover token de teste do App.tsx"
```

---

## Estrutura ao final desta etapa

```
src/features/estoque/ingredientes/
├── components/
│   ├── FiltrosIngredientes.tsx   ✅
│   ├── TabelaIngredientes.tsx    ✅
│   ├── ModalDesativar.tsx        ✅
│   └── Paginacao.tsx             ✅
├── hooks/
│   ├── useIngredientes.ts        ✅ (Etapa 1)
│   └── useIngredienteForm.ts     ✅ (Etapa 1)
├── pages/
│   └── IngredientesPage.tsx      ✅
└── services/
    └── ingredientesService.ts    ✅ (Etapa 1)
```

---

> **Próxima etapa:** `2026-03-27-ingredientes-etapa3-formulario.md`
> Constrói `IngredienteFormPage.tsx` — criação e edição com React Hook Form + Zod + toast de feedback.
