# Categorias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRUD completo de Categorias — listagem em tabela, criar/editar via modal inline (campo único: nome), desativar com confirmação.

**Architecture:** Categorias é um cadastro simples de campo único. Reutiliza `CategoriaIngrediente` já em `types/estoque.ts`. O service existente (`categoriasService`) recebe os métodos `criar`, `atualizar` e `desativar`. O hook existente (`useCategorias`) é expandido com `erro`, `recarregar` e `desativar`. O modal de criar/editar usa estado local simples (sem RHF) por ser um único campo.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Zustand, Axios (`src/lib/api.ts`), Heroicons.

---

## Estrutura de Arquivos

| Operação | Arquivo |
|----------|---------|
| Modify | `src/types/estoque.ts` — adicionar `CriarCategoriaInput`, `AtualizarCategoriaInput` |
| Modify | `src/features/estoque/categorias/services/categoriasService.ts` — adicionar `criar`, `atualizar`, `desativar` |
| Modify | `src/features/estoque/categorias/hooks/useCategorias.ts` — adicionar `erro`, `recarregar`, `desativar` |
| Create | `src/features/estoque/categorias/components/ModalCategoria.tsx` |
| Create | `src/features/estoque/categorias/components/TabelaCategorias.tsx` |
| Create | `src/features/estoque/categorias/pages/CategoriasPage.tsx` |
| Modify | `src/routes/AppRoutes.tsx` — adicionar rota `/estoque/categorias` |
| Modify | `src/components/layout/Sidebar.tsx` — habilitar link Categorias |

---

### Task 1: Tipos + Service + Hook

**Files:**
- Modify: `src/types/estoque.ts`
- Modify: `src/features/estoque/categorias/services/categoriasService.ts`
- Modify: `src/features/estoque/categorias/hooks/useCategorias.ts`

- [ ] **Step 1: Adicionar tipos ao estoque.ts**

Adicionar ao final de `src/types/estoque.ts` (após as linhas existentes):

```typescript
// ─── Categorias (inputs) ──────────────────────────────────────────────────────
export interface CriarCategoriaInput {
  nome: string
}

export interface AtualizarCategoriaInput {
  id: string
  nome: string
}
```

- [ ] **Step 2: Substituir categoriasService.ts**

Substituir o conteúdo completo de `src/features/estoque/categorias/services/categoriasService.ts`:

```typescript
import api from '@/lib/api'
import type {
  ApiResponse,
  CategoriaIngrediente,
  CriarCategoriaInput,
  AtualizarCategoriaInput,
} from '@/types/estoque'

export const categoriasService = {
  listar: async (apenasAtivos = true): Promise<CategoriaIngrediente[]> => {
    const resp = await api.get<ApiResponse<CategoriaIngrediente[]>>(
      `/categorias?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  criar: async (input: CriarCategoriaInput): Promise<CategoriaIngrediente> => {
    const resp = await api.post<ApiResponse<CategoriaIngrediente>>('/categorias', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarCategoriaInput): Promise<CategoriaIngrediente> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<CategoriaIngrediente>>(`/categorias/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/categorias/${id}`)
  },
}
```

- [ ] **Step 3: Substituir useCategorias.ts**

Substituir o conteúdo completo de `src/features/estoque/categorias/hooks/useCategorias.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { categoriasService } from '../services/categoriasService'
import type { CategoriaIngrediente } from '@/types/estoque'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await categoriasService.listar()
      setCategorias(data)
    } catch {
      setErro('Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await categoriasService.desativar(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categorias, loading, erro, recarregar, desativar }
}
```

- [ ] **Step 4: Verificar que o TypeScript não tem erros**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: nenhum erro (ou apenas erros preexistentes não relacionados).

- [ ] **Step 5: Commit**

```bash
cd CasaDiAna/frontend
git add src/types/estoque.ts src/features/estoque/categorias/services/categoriasService.ts src/features/estoque/categorias/hooks/useCategorias.ts
git commit -m "feat(categorias): types, service e hook com CRUD completo"
```

---

### Task 2: Componentes ModalCategoria + TabelaCategorias

**Files:**
- Create: `src/features/estoque/categorias/components/ModalCategoria.tsx`
- Create: `src/features/estoque/categorias/components/TabelaCategorias.tsx`

- [ ] **Step 1: Criar ModalCategoria.tsx**

Criar `src/features/estoque/categorias/components/ModalCategoria.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { CategoriaIngrediente } from '@/types/estoque'

interface Props {
  categoria: CategoriaIngrediente | null  // null = modo criar
  salvando: boolean
  onSalvar: (nome: string) => Promise<void>
  onFechar: () => void
}

export function ModalCategoria({ categoria, salvando, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setNome(categoria?.nome ?? '')
    setErro(null)
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nome.trim()
    if (!trimmed) {
      setErro('Nome é obrigatório.')
      return
    }
    if (trimmed.length > 100) {
      setErro('Máximo de 100 caracteres.')
      return
    }
    setErro(null)
    await onSalvar(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-800">
            {categoria ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={onFechar}
            className="p-1 rounded hover:bg-stone-100 text-stone-400"
          >
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
              placeholder="Ex: Secos, Laticínios, Bebidas..."
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

- [ ] **Step 2: Criar TabelaCategorias.tsx**

Criar `src/features/estoque/categorias/components/TabelaCategorias.tsx`:

```tsx
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CategoriaIngrediente } from '@/types/estoque'

interface Props {
  categorias: CategoriaIngrediente[]
  podeEditar: boolean
  onEditar: (cat: CategoriaIngrediente) => void
  onDesativar: (cat: CategoriaIngrediente) => void
}

export function TabelaCategorias({ categorias, podeEditar, onEditar, onDesativar }: Props) {
  if (categorias.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm py-16 text-center">
        <p className="text-stone-500 text-sm">Nenhuma categoria cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
              Nome
            </th>
            <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
              Status
            </th>
            {podeEditar && (
              <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {categorias.map(cat => (
            <tr key={cat.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-stone-800">{cat.nome}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  cat.ativo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-100 text-stone-500'
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

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros novos.

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/estoque/categorias/components/
git commit -m "feat(categorias): componentes ModalCategoria e TabelaCategorias"
```

---

### Task 3: Página + Rotas + Sidebar

**Files:**
- Create: `src/features/estoque/categorias/pages/CategoriasPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Criar CategoriasPage.tsx**

Criar `src/features/estoque/categorias/pages/CategoriasPage.tsx`:

```tsx
import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useCategorias } from '../hooks/useCategorias'
import { categoriasService } from '../services/categoriasService'
import { useAuthStore } from '@/store/authStore'
import { TabelaCategorias } from '../components/TabelaCategorias'
import { ModalCategoria } from '../components/ModalCategoria'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaIngrediente } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function CategoriasPage() {
  const { temPapel } = useAuthStore()
  const { categorias, loading, erro, recarregar, desativar } = useCategorias()

  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaIngrediente | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [paraDesativar, setParaDesativar] = useState<CategoriaIngrediente | null>(null)
  const [desativando, setDesativando] = useState(false)

  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const abrirCriar = () => {
    setCategoriaEditando(null)
    setModalAberto(true)
  }

  const abrirEditar = (cat: CategoriaIngrediente) => {
    setCategoriaEditando(cat)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setCategoriaEditando(null)
  }

  const handleSalvar = async (nome: string) => {
    setSalvando(true)
    try {
      if (categoriaEditando) {
        await categoriasService.atualizar({ id: categoriaEditando.id, nome })
        setToast({ tipo: 'sucesso', mensagem: 'Categoria atualizada com sucesso.' })
      } else {
        await categoriasService.criar({ nome })
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Categorias</h1>
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

      {/* Carregando */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4
                          border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando categorias...</p>
        </div>
      )}

      {/* Erro */}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Tabela */}
      {!loading && !erro && (
        <TabelaCategorias
          categorias={categorias}
          podeEditar={podeEditar}
          onEditar={abrirEditar}
          onDesativar={setParaDesativar}
        />
      )}

      {/* Modal criar/editar */}
      {modalAberto && (
        <ModalCategoria
          categoria={categoriaEditando}
          salvando={salvando}
          onSalvar={handleSalvar}
          onFechar={fecharModal}
        />
      )}

      {/* Modal confirmar desativação */}
      {paraDesativar && (
        <ModalDesativar
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Atualizar AppRoutes.tsx**

Substituir o conteúdo completo de `src/routes/AppRoutes.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { MainLayout } from '@/components/layout/MainLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { IngredientesPage } from '@/features/estoque/ingredientes/pages/IngredientesPage'
import { IngredienteFormPage } from '@/features/estoque/ingredientes/pages/IngredienteFormPage'
import { CategoriasPage } from '@/features/estoque/categorias/pages/CategoriasPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/estoque/ingredientes" element={<IngredientesPage />} />
          <Route path="/estoque/ingredientes/novo" element={<IngredienteFormPage />} />
          <Route path="/estoque/ingredientes/:id/editar" element={<IngredienteFormPage />} />
          <Route path="/estoque/categorias" element={<CategoriasPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Habilitar link Categorias no Sidebar**

Em `src/components/layout/Sidebar.tsx`, alterar o item Categorias de `disponivel: false` para `disponivel: true`:

```typescript
// Antes:
{ label: 'Categorias', href: '/estoque/categorias', icon: TagIcon, disponivel: false },

// Depois:
{ label: 'Categorias', href: '/estoque/categorias', icon: TagIcon, disponivel: true },
```

- [ ] **Step 4: Verificar TypeScript e testar no browser**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Testar no browser:
- Navegar para `/estoque/categorias`
- Verificar que a tabela carrega
- Criar nova categoria — modal abre, salva, toast "Categoria criada com sucesso."
- Editar categoria — modal pré-preenche com nome atual
- Desativar — modal de confirmação aparece, categoria some da lista

- [ ] **Step 5: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/estoque/categorias/pages/ src/routes/AppRoutes.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(categorias): página de listagem, rotas e sidebar"
```

---

## Self-Review

**Cobertura da spec:**
- [x] `GET /api/categorias` — useCategorias.recarregar
- [x] `POST /api/categorias` — CategoriasPage.handleSalvar (modo criar)
- [x] `PUT /api/categorias/{id}` — CategoriasPage.handleSalvar (modo editar)
- [x] `DELETE /api/categorias/{id}` — useCategorias.desativar
- [x] Modal inline (campo único) — ModalCategoria
- [x] Confirmação antes de desativar — ModalDesativar
- [x] Controle de acesso por papel — `podeEditar` com PAPEIS_EDICAO
- [x] Link no sidebar habilitado — Sidebar.tsx atualizado
