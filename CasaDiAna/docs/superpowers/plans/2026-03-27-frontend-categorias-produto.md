# Categorias de Produto — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a página `/producao/categorias-produto` que gerencia categorias de produto via `/api/categorias-produto`, seguindo o mesmo padrão visual e estrutural do módulo `src/features/estoque/categorias/`.

**Architecture:** Modal inline para criar/editar (sem página de formulário separada), tabela de listagem com ações, hook para gerenciamento de estado. Este plano também cria o arquivo `src/types/producao.ts` com todos os tipos TypeScript dos módulos de produção (usado pelos planos 2–5).

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Axios (`src/lib/api.ts`), Zustand (`useAuthStore`), React Router v6

---

### Visão Geral dos Arquivos

**Criar:**
- `frontend/src/types/producao.ts` — todos os tipos dos módulos de produção (Planos 1–5 dependem deste arquivo)
- `frontend/src/features/producao/categorias-produto/services/categoriasProdutoService.ts`
- `frontend/src/features/producao/categorias-produto/hooks/useCategoriasProduto.ts`
- `frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx`
- `frontend/src/features/producao/categorias-produto/components/TabelaCategoriasProduto.tsx`
- `frontend/src/features/producao/categorias-produto/pages/CategoriasProdutoPage.tsx`

**Modificar:**
- `frontend/src/components/layout/Sidebar.tsx` — adicionar grupo "Produção"
- `frontend/src/routes/AppRoutes.tsx` — adicionar rota `/producao/categorias-produto`

---

### Task 1: Criar `src/types/producao.ts`

Este arquivo centraliza todos os tipos TypeScript dos módulos de produção. Os planos 2–5 importarão daqui.

**Files:**
- Create: `frontend/src/types/producao.ts`

- [ ] **Step 1: Escrever o arquivo de tipos**

```typescript
// frontend/src/types/producao.ts
import type { ApiResponse } from './estoque'
export type { ApiResponse }

// ─── Categoria de Produto ─────────────────────────────────────────────────────
export interface CategoriaProduto {
  id: string
  nome: string
  ativo: boolean
  atualizadoEm: string
}

export interface CriarCategoriaProdutoInput {
  nome: string
}

export interface AtualizarCategoriaProdutoInput {
  id: string
  nome: string
}

// ─── Produto ──────────────────────────────────────────────────────────────────
export interface ProdutoResumo {
  id: string
  nome: string
  categoriaNome: string | null
  precoVenda: number
  ativo: boolean
}

export interface Produto {
  id: string
  nome: string
  categoriaProdutoId: string | null
  categoriaNome: string | null
  descricao: string | null
  precoVenda: number
  ativo: boolean
  atualizadoEm: string
}

export interface CriarProdutoInput {
  nome: string
  precoVenda: number
  categoriaProdutoId?: string | null
  descricao?: string | null
}

export interface AtualizarProdutoInput extends CriarProdutoInput {
  id: string
}

export interface ProdutoFormValues {
  nome: string
  precoVenda: string
  categoriaProdutoId: string
  descricao: string
}

// ─── Ficha Técnica ────────────────────────────────────────────────────────────
export interface ItemFichaTecnica {
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidadePorUnidade: number
  custoUnitario: number | null
  custoItem: number
}

export interface FichaTecnica {
  produtoId: string
  produtoNome: string
  precoVenda: number
  itens: ItemFichaTecnica[]
  custoTotal: number
  margemLucro: number | null
}

export interface ItemFichaTecnicaInput {
  ingredienteId: string
  quantidadePorUnidade: number
}

export interface DefinirFichaTecnicaInput {
  itens: ItemFichaTecnicaInput[]
}

// ─── Produção Diária ──────────────────────────────────────────────────────────
export interface ProducaoDiaria {
  id: string
  produtoId: string
  produtoNome: string
  data: string
  quantidadeProduzida: number
  custoTotal: number
  observacoes: string | null
  criadoEm: string
}

export interface RegistrarProducaoInput {
  produtoId: string
  data: string
  quantidadeProduzida: number
  observacoes?: string | null
}

export interface ProducaoFormValues {
  produtoId: string
  data: string
  quantidadeProduzida: string
  observacoes: string
}

// ─── Venda Diária ─────────────────────────────────────────────────────────────
export interface VendaDiaria {
  id: string
  produtoId: string
  produtoNome: string
  data: string
  quantidadeVendida: number
  criadoEm: string
}

export interface RegistrarVendaInput {
  produtoId: string
  data: string
  quantidadeVendida: number
}

export interface VendaFormValues {
  produtoId: string
  data: string
  quantidadeVendida: string
}

// ─── Relatório Produção/Vendas ────────────────────────────────────────────────
export interface RelatorioProducaoVendasItem {
  produtoId: string
  produtoNome: string
  precoVenda: number
  totalProduzido: number
  totalVendido: number
  perda: number
  custoTotalProducao: number
  custoMedioUnitario: number
  custoPerda: number
  receitaEstimada: number
  margemLucro: number | null
  margemPerda: number | null
}

export interface RelatorioProducaoVendas {
  de: string
  ate: string
  itens: RelatorioProducaoVendasItem[]
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/producao.ts
git commit -m "feat(frontend): tipos TypeScript para módulos de produção"
```

---

### Task 2: Criar service e hook

**Files:**
- Create: `frontend/src/features/producao/categorias-produto/services/categoriasProdutoService.ts`
- Create: `frontend/src/features/producao/categorias-produto/hooks/useCategoriasProduto.ts`

- [ ] **Step 1: Criar o service**

```typescript
// frontend/src/features/producao/categorias-produto/services/categoriasProdutoService.ts
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type {
  CategoriaProduto,
  CriarCategoriaProdutoInput,
  AtualizarCategoriaProdutoInput,
} from '@/types/producao'

export const categoriasProdutoService = {
  listar: async (apenasAtivos = true): Promise<CategoriaProduto[]> => {
    const resp = await api.get<ApiResponse<CategoriaProduto[]>>(
      `/categorias-produto?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  criar: async (input: CriarCategoriaProdutoInput): Promise<CategoriaProduto> => {
    const resp = await api.post<ApiResponse<CategoriaProduto>>('/categorias-produto', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarCategoriaProdutoInput): Promise<CategoriaProduto> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<CategoriaProduto>>(`/categorias-produto/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/categorias-produto/${id}`)
  },
}
```

- [ ] **Step 2: Criar o hook**

```typescript
// frontend/src/features/producao/categorias-produto/hooks/useCategoriasProduto.ts
import { useState, useEffect, useCallback } from 'react'
import { categoriasProdutoService } from '../services/categoriasProdutoService'
import type { CategoriaProduto } from '@/types/producao'

export function useCategoriasProduto() {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await categoriasProdutoService.listar()
      setCategorias(data)
    } catch {
      setErro('Erro ao carregar categorias de produto.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await categoriasProdutoService.desativar(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categorias, loading, erro, recarregar, desativar }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/producao/
git commit -m "feat(frontend): service e hook de categorias de produto"
```

---

### Task 3: Criar componentes e página

**Files:**
- Create: `frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx`
- Create: `frontend/src/features/producao/categorias-produto/components/TabelaCategoriasProduto.tsx`
- Create: `frontend/src/features/producao/categorias-produto/pages/CategoriasProdutoPage.tsx`

- [ ] **Step 1: Criar ModalCategoriaProduto**

```tsx
// frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx
import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { CategoriaProduto } from '@/types/producao'

interface Props {
  categoria: CategoriaProduto | null
  salvando: boolean
  onSalvar: (nome: string) => Promise<void>
  onFechar: () => void
}

export function ModalCategoriaProduto({ categoria, salvando, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setNome(categoria?.nome ?? '')
    setErro(null)
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nome.trim()
    if (!trimmed) { setErro('Nome é obrigatório.'); return }
    if (trimmed.length > 100) { setErro('Máximo de 100 caracteres.'); return }
    setErro(null)
    await onSalvar(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-800">
            {categoria ? 'Editar Categoria' : 'Nova Categoria de Produto'}
          </h2>
          <button onClick={onFechar} className="p-1 rounded hover:bg-stone-100 text-stone-400">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Bolos, Salgados, Bebidas..."
              maxLength={100}
              autoFocus
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm
                         text-stone-600 hover:bg-stone-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white
                         rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar TabelaCategoriasProduto**

```tsx
// frontend/src/features/producao/categorias-produto/components/TabelaCategoriasProduto.tsx
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CategoriaProduto } from '@/types/producao'

interface Props {
  categorias: CategoriaProduto[]
  podeEditar: boolean
  onEditar: (cat: CategoriaProduto) => void
  onDesativar: (cat: CategoriaProduto) => void
}

export function TabelaCategoriasProduto({ categorias, podeEditar, onEditar, onDesativar }: Props) {
  if (categorias.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm py-16 text-center">
        <p className="text-stone-500 text-sm">Nenhuma categoria de produto cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nome</th>
            <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
            {podeEditar && (
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {categorias.map(cat => (
            <tr key={cat.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-stone-800">{cat.nome}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  cat.ativo ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                }`}>
                  {cat.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              {podeEditar && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEditar(cat)}
                    title="Editar"
                    className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDesativar(cat)}
                    title="Desativar"
                    className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-red-600 ml-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Criar CategoriasProdutoPage**

```tsx
// frontend/src/features/producao/categorias-produto/pages/CategoriasProdutoPage.tsx
import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useCategoriasProduto } from '../hooks/useCategoriasProduto'
import { categoriasProdutoService } from '../services/categoriasProdutoService'
import { useAuthStore } from '@/store/authStore'
import { TabelaCategoriasProduto } from '../components/TabelaCategoriasProduto'
import { ModalCategoriaProduto } from '../components/ModalCategoriaProduto'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaProduto } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function CategoriasProdutoPage() {
  const { temPapel } = useAuthStore()
  const { categorias, loading, erro, recarregar, desativar } = useCategoriasProduto()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaProduto | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [paraDesativar, setParaDesativar] = useState<CategoriaProduto | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const abrirCriar = () => { setCategoriaEditando(null); setModalAberto(true) }
  const abrirEditar = (cat: CategoriaProduto) => { setCategoriaEditando(cat); setModalAberto(true) }
  const fecharModal = () => { setModalAberto(false); setCategoriaEditando(null) }

  const handleSalvar = async (nome: string) => {
    setSalvando(true)
    try {
      if (categoriaEditando) {
        await categoriasProdutoService.atualizar({ id: categoriaEditando.id, nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria atualizada com sucesso.' })
      } else {
        await categoriasProdutoService.criar({ nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria criada com sucesso.' })
      }
      fecharModal()
      recarregar()
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar categoria.' })
    } finally {
      setSalvando(false)
    }
  }

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Categoria desativada.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar categoria.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Categorias de Produto</h1>
        {podeEditar && (
          <button
            onClick={abrirCriar}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Nova Categoria
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && (
        <TabelaCategoriasProduto
          categorias={categorias}
          podeEditar={podeEditar}
          onEditar={abrirEditar}
          onDesativar={setParaDesativar}
        />
      )}

      {modalAberto && (
        <ModalCategoriaProduto
          categoria={categoriaEditando}
          salvando={salvando}
          onSalvar={handleSalvar}
          onFechar={fecharModal}
        />
      )}
      {paraDesativar && (
        <ModalDesativar
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/producao/
git commit -m "feat(frontend): página Categorias de Produto com modal inline"
```

---

### Task 4: Atualizar Sidebar e AppRoutes

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`

- [ ] **Step 1: Atualizar Sidebar — adicionar grupo Produção**

No arquivo `frontend/src/components/layout/Sidebar.tsx`, adicionar o import de `CubeIcon` e inserir o novo grupo após os imports existentes de ícones.

Localizar a linha com `import {` dos ícones do Heroicons e adicionar `CubeIcon`:

```typescript
import {
  BeakerIcon,
  TagIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
```

Localizar o array `grupos` e adicionar o grupo "Produção" ANTES do grupo "Movimentações":

```typescript
const grupos: NavGroup[] = [
  {
    titulo: 'Cadastros',
    itens: [
      { label: 'Ingredientes', href: '/estoque/ingredientes', icon: BeakerIcon, disponivel: true },
      { label: 'Categorias', href: '/estoque/categorias', icon: TagIcon, disponivel: true },
      { label: 'Fornecedores', href: '/fornecedores', icon: TruckIcon, disponivel: true },
    ],
  },
  {
    titulo: 'Produção',
    itens: [
      { label: 'Categorias de Produto', href: '/producao/categorias-produto', icon: TagIcon, disponivel: true },
      { label: 'Produtos', href: '/producao/produtos', icon: CubeIcon, disponivel: false },
      { label: 'Produção Diária', href: '/producao/diaria', icon: CubeIcon, disponivel: false },
      { label: 'Vendas Diárias', href: '/producao/vendas', icon: CubeIcon, disponivel: false },
    ],
  },
  {
    titulo: 'Movimentações',
    itens: [
      { label: 'Entradas', href: '/entradas', icon: ArrowDownTrayIcon, disponivel: true },
      { label: 'Inventário', href: '/inventarios', icon: ClipboardDocumentCheckIcon, disponivel: true },
    ],
  },
  {
    titulo: 'Relatórios',
    itens: [
      { label: 'Estoque Atual', href: '/relatorios/estoque-atual', icon: ChartBarIcon, disponivel: true },
      { label: 'Movimentações', href: '/relatorios/movimentacoes', icon: ChartBarIcon, disponivel: true },
      { label: 'Entradas', href: '/relatorios/entradas', icon: ChartBarIcon, disponivel: true },
      { label: 'Produção/Vendas', href: '/relatorios/producao-vendas', icon: ChartBarIcon, disponivel: false },
    ],
  },
]
```

- [ ] **Step 2: Atualizar AppRoutes — adicionar rota**

No arquivo `frontend/src/routes/AppRoutes.tsx`, adicionar o import e a rota.

Adicionar import no topo do arquivo (junto aos outros imports):

```typescript
import { CategoriasProdutoPage } from '@/features/producao/categorias-produto/pages/CategoriasProdutoPage'
```

Adicionar rota dentro do `<Route element={<MainLayout />}>`, após `/estoque/categorias`:

```tsx
{/* Produção */}
<Route path="/producao/categorias-produto" element={<CategoriasProdutoPage />} />
```

- [ ] **Step 3: Verificar que o app compila**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Saída esperada: `✓ built in` sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/routes/AppRoutes.tsx
git commit -m "feat(frontend): rota e sidebar para Categorias de Produto"
```

---

## Self-Review

**Spec coverage:**
- ✓ Listagem com nome, status, ações
- ✓ Criar/editar em modal inline (campo único: nome, max 100)
- ✓ Desativar com confirmação modal
- ✓ Controle de acesso por papel (`Admin`, `Coordenador`, `Compras`)
- ✓ Endpoint `/api/categorias-produto`

**Placeholder scan:** Nenhum placeholder encontrado — todo código está presente.

**Type consistency:** `CategoriaProduto` de `src/types/producao.ts` usado consistentemente em todos os arquivos.
