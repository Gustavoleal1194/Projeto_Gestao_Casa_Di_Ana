# Inventários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulo de Inventários — listagem com badge de status, iniciar inventário (formulário simples), página de detalhe para lançar itens um por um e finalizar ou cancelar o inventário.

**Architecture:** Três páginas: `InventariosPage` (listagem), `InventarioFormPage` (apenas iniciar), `InventarioDetalhePage` (ponto central: lança itens com formulário inline via POST individual, e permite finalizar/cancelar). Cada adição de item chama o backend imediatamente — não é buffered. Isso é necessário porque o backend exige `POST /api/inventarios/{id}/itens` para cada item.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Zustand, Axios, React Hook Form, Zod, Heroicons.

---

## Estrutura de Arquivos

| Operação | Arquivo |
|----------|---------|
| Modify | `src/types/estoque.ts` — adicionar tipos de Inventário |
| Create | `src/features/inventarios/services/inventariosService.ts` |
| Create | `src/features/inventarios/hooks/useInventarios.ts` |
| Create | `src/features/inventarios/pages/InventariosPage.tsx` |
| Create | `src/features/inventarios/pages/InventarioFormPage.tsx` |
| Create | `src/features/inventarios/pages/InventarioDetalhePage.tsx` |
| Modify | `src/routes/AppRoutes.tsx` — adicionar rotas de inventários |
| Modify | `src/components/layout/Sidebar.tsx` — habilitar link Inventário |

---

### Task 1: Tipos + Service

**Files:**
- Modify: `src/types/estoque.ts`
- Create: `src/features/inventarios/services/inventariosService.ts`

- [ ] **Step 1: Adicionar tipos de Inventário ao estoque.ts**

Adicionar ao final de `src/types/estoque.ts`:

```typescript
// ─── Inventários ──────────────────────────────────────────────────────────────
export interface InventarioResumo {
  id: string
  dataRealizacao: string
  descricao: string | null
  status: string
  totalItens: number
  criadoEm: string
}

export interface ItemInventario {
  id: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidadeSistema: number
  quantidadeContada: number
  diferenca: number
  observacoes: string | null
}

export interface Inventario {
  id: string
  dataRealizacao: string
  descricao: string | null
  status: string
  observacoes: string | null
  finalizadoEm: string | null
  criadoEm: string
  itens: ItemInventario[]
}

export interface IniciarInventarioInput {
  dataRealizacao: string
  descricao?: string | null
  observacoes?: string | null
}

export interface AdicionarItemInventarioInput {
  ingredienteId: string
  quantidadeContada: number
  observacoes?: string | null
}
```

- [ ] **Step 2: Criar inventariosService.ts**

Criar `src/features/inventarios/services/inventariosService.ts`:

```typescript
import api from '@/lib/api'
import type {
  ApiResponse,
  Inventario,
  InventarioResumo,
  IniciarInventarioInput,
  AdicionarItemInventarioInput,
} from '@/types/estoque'

export const inventariosService = {
  listar: async (): Promise<InventarioResumo[]> => {
    const resp = await api.get<ApiResponse<InventarioResumo[]>>('/inventarios')
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Inventario> => {
    const resp = await api.get<ApiResponse<Inventario>>(`/inventarios/${id}`)
    return resp.data.dados
  },

  iniciar: async (input: IniciarInventarioInput): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>('/inventarios', input)
    return resp.data.dados
  },

  adicionarItem: async (
    inventarioId: string,
    input: AdicionarItemInventarioInput
  ): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>(
      `/inventarios/${inventarioId}/itens`,
      input
    )
    return resp.data.dados
  },

  finalizar: async (id: string): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>(`/inventarios/${id}/finalizar`)
    return resp.data.dados
  },

  cancelar: async (id: string): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>(`/inventarios/${id}/cancelar`)
    return resp.data.dados
  },
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/types/estoque.ts src/features/inventarios/services/inventariosService.ts
git commit -m "feat(inventarios): types e service"
```

---

### Task 2: Hook de Listagem

**Files:**
- Create: `src/features/inventarios/hooks/useInventarios.ts`

- [ ] **Step 1: Criar useInventarios.ts**

Criar `src/features/inventarios/hooks/useInventarios.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { inventariosService } from '../services/inventariosService'
import type { InventarioResumo } from '@/types/estoque'

export function useInventarios() {
  const [inventarios, setInventarios] = useState<InventarioResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await inventariosService.listar()
      setInventarios(data)
    } catch {
      setErro('Erro ao carregar inventários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { inventarios, loading, erro, recarregar }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/inventarios/hooks/useInventarios.ts
git commit -m "feat(inventarios): hook de listagem"
```

---

### Task 3: Página de Listagem + Formulário de Início

**Files:**
- Create: `src/features/inventarios/pages/InventariosPage.tsx`
- Create: `src/features/inventarios/pages/InventarioFormPage.tsx`

- [ ] **Step 1: Criar InventariosPage.tsx**

Criar `src/features/inventarios/pages/InventariosPage.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useInventarios } from '../hooks/useInventarios'
import { useAuthStore } from '@/store/authStore'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function badgeStatus(status: string) {
  if (status === 'EmAndamento') return 'bg-amber-100 text-amber-700'
  if (status === 'Finalizado') return 'bg-green-100 text-green-700'
  if (status === 'Cancelado') return 'bg-red-100 text-red-700'
  return 'bg-stone-100 text-stone-500'
}

function labelStatus(status: string) {
  if (status === 'EmAndamento') return 'Em Andamento'
  return status
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function InventariosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { inventarios, loading, erro } = useInventarios()

  const podeCriar = temPapel(...PAPEIS_EDICAO)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Inventários</h1>
        {podeCriar && (
          <button
            onClick={() => navigate('/inventarios/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Inventário
          </button>
        )}
      </div>

      {/* Carregando */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4
                          border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando inventários...</p>
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {inventarios.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum inventário registrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    Data
                  </th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    Descrição
                  </th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    Itens
                  </th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventarios.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/inventarios/${inv.id}`)}
                    className="border-b border-stone-100 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-stone-800">
                      {formatarData(inv.dataRealizacao)}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {inv.descricao ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">{inv.totalItens}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badgeStatus(inv.status)}`}>
                        {labelStatus(inv.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Criar InventarioFormPage.tsx**

Criar `src/features/inventarios/pages/InventarioFormPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { inventariosService } from '../services/inventariosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'

interface IniciarInventarioFormValues {
  dataRealizacao: string
  descricao: string
  observacoes: string
}

const schema = z.object({
  dataRealizacao: z.string().min(1, 'Informe a data de realização.'),
  descricao: z.string().max(200),
  observacoes: z.string(),
})

export function InventarioFormPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IniciarInventarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataRealizacao: new Date().toISOString().split('T')[0],
      descricao: '',
      observacoes: '',
    },
  })

  const onSubmit = async (values: IniciarInventarioFormValues) => {
    try {
      const inventario = await inventariosService.iniciar({
        dataRealizacao: values.dataRealizacao,
        descricao: values.descricao || null,
        observacoes: values.observacoes || null,
      })
      setToast({ tipo: 'sucesso', mensagem: 'Inventário iniciado.' })
      setTimeout(() => navigate(`/inventarios/${inventario.id}`), 800)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao iniciar inventário.' })
    }
  }

  const inputClass =
    'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

  return (
    <div className="p-6 max-w-lg">
      <button
        onClick={() => navigate('/inventarios')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Inventários
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Novo Inventário</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Data de Realização <span className="text-red-500">*</span>
            </label>
            <input type="date" className={inputClass} {...register('dataRealizacao')} />
            {errors.dataRealizacao && (
              <p className="mt-1 text-xs text-red-600">{errors.dataRealizacao.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Inventário mensal de janeiro"
              maxLength={200}
              className={inputClass}
              {...register('descricao')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
            <textarea
              rows={3}
              placeholder="Observações gerais..."
              className={`${inputClass} resize-none`}
              {...register('observacoes')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/inventarios')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm
                       text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white
                       rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Iniciando...' : 'Iniciar Inventário'}
          </button>
        </div>
      </form>

      {toast && (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/inventarios/pages/InventariosPage.tsx src/features/inventarios/pages/InventarioFormPage.tsx
git commit -m "feat(inventarios): listagem e formulário de início"
```

---

### Task 4: Página de Detalhe + Rotas + Sidebar

**Files:**
- Create: `src/features/inventarios/pages/InventarioDetalhePage.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Criar InventarioDetalhePage.tsx**

Criar `src/features/inventarios/pages/InventarioDetalhePage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { inventariosService } from '../services/inventariosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { useAuthStore } from '@/store/authStore'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { Inventario, IngredienteResumo } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

interface ItemFormValues {
  ingredienteId: string
  quantidadeContada: string
  observacoes: string
}

const itemSchema = z.object({
  ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
  quantidadeContada: z
    .string()
    .min(1)
    .refine(v => Number(v) >= 0, 'Quantidade deve ser ≥ 0.'),
  observacoes: z.string(),
})

function badgeStatus(status: string) {
  if (status === 'EmAndamento') return 'bg-amber-100 text-amber-700'
  if (status === 'Finalizado') return 'bg-green-100 text-green-700'
  if (status === 'Cancelado') return 'bg-red-100 text-red-700'
  return 'bg-stone-100 text-stone-500'
}

function labelStatus(status: string) {
  if (status === 'EmAndamento') return 'Em Andamento'
  return status
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function InventarioDetalhePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { temPapel } = useAuthStore()

  const [inventario, setInventario] = useState<Inventario | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [confirmandoFinalizar, setConfirmandoFinalizar] = useState(false)
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const [processando, setProcessando] = useState(false)

  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const emAndamento = inventario?.status === 'EmAndamento'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { ingredienteId: '', quantidadeContada: '', observacoes: '' },
  })

  useEffect(() => {
    if (!id) return
    Promise.all([
      inventariosService.obterPorId(id),
      ingredientesService.listar(),
    ])
      .then(([inv, ings]) => {
        setInventario(inv)
        setIngredientes(ings)
      })
      .catch(() => setErro('Erro ao carregar inventário.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdicionarItem = async (values: ItemFormValues) => {
    if (!id) return
    try {
      const atualizado = await inventariosService.adicionarItem(id, {
        ingredienteId: values.ingredienteId,
        quantidadeContada: Number(values.quantidadeContada),
        observacoes: values.observacoes || null,
      })
      setInventario(atualizado)
      reset({ ingredienteId: '', quantidadeContada: '', observacoes: '' })
      setToast({ tipo: 'sucesso', mensagem: 'Item adicionado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao adicionar item.' })
    }
  }

  const handleFinalizar = async () => {
    if (!id) return
    setProcessando(true)
    try {
      const atualizado = await inventariosService.finalizar(id)
      setInventario(atualizado)
      setConfirmandoFinalizar(false)
      setToast({ tipo: 'sucesso', mensagem: 'Inventário finalizado com sucesso.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao finalizar inventário.' })
    } finally {
      setProcessando(false)
    }
  }

  const handleCancelar = async () => {
    if (!id) return
    setProcessando(true)
    try {
      const atualizado = await inventariosService.cancelar(id)
      setInventario(atualizado)
      setConfirmandoCancelar(false)
      setToast({ tipo: 'sucesso', mensagem: 'Inventário cancelado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao cancelar inventário.' })
    } finally {
      setProcessando(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  if (erro || !inventario) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erro ?? 'Inventário não encontrado.'}
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={() => navigate('/inventarios')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Inventários
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">
            {inventario.descricao ?? `Inventário de ${formatarData(inventario.dataRealizacao)}`}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {formatarData(inventario.dataRealizacao)}
            {inventario.finalizadoEm && ` · Finalizado em ${formatarData(inventario.finalizadoEm)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${badgeStatus(inventario.status)}`}>
            {labelStatus(inventario.status)}
          </span>
          {podeEditar && emAndamento && (
            <>
              <button
                onClick={() => setConfirmandoCancelar(true)}
                className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50
                           rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmandoFinalizar(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white
                           rounded-lg text-sm font-medium transition-colors"
              >
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formulário inline para adicionar item (só quando em andamento) */}
      {podeEditar && emAndamento && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
            Adicionar Item
          </p>
          <form onSubmit={handleSubmit(handleAdicionarItem)}>
            <div className="grid grid-cols-[1fr_120px_180px_auto] gap-3 items-start">
              <div>
                <select className={inputClass} {...register('ingredienteId')}>
                  <option value="">Selecione o ingrediente...</option>
                  {ingredientes.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nome} ({ing.unidadeMedidaCodigo})
                    </option>
                  ))}
                </select>
                {errors.ingredienteId && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.ingredienteId.message}</p>
                )}
              </div>

              <div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Qtd. contada"
                  className={inputClass}
                  {...register('quantidadeContada')}
                />
                {errors.quantidadeContada && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.quantidadeContada.message}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Observação (opcional)"
                  className={inputClass}
                  {...register('observacoes')}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white
                           rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                <PlusIcon className="h-4 w-4" />
                {isSubmitting ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de itens */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {inventario.itens.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-stone-500 text-sm">Nenhum item lançado ainda.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                  Ingrediente
                </th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">
                  Sistema
                </th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">
                  Contado
                </th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">
                  Diferença
                </th>
                <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                  Obs.
                </th>
              </tr>
            </thead>
            <tbody>
              {inventario.itens.map(item => (
                <tr key={item.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 text-sm text-stone-800">
                    {item.ingredienteNome}
                    <span className="text-stone-400 ml-1">({item.unidadeMedidaCodigo})</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600 text-right">
                    {item.quantidadeSistema}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-800 font-medium text-right">
                    {item.quantidadeContada}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${
                      item.diferenca < 0
                        ? 'text-red-600'
                        : item.diferenca > 0
                        ? 'text-green-600'
                        : 'text-stone-500'
                    }`}>
                      {item.diferenca > 0 ? '+' : ''}{item.diferenca}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-500">
                    {item.observacoes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Finalizar */}
      {confirmandoFinalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmandoFinalizar(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-2">Finalizar inventário?</h2>
            <p className="text-sm text-stone-500 mb-5">
              O estoque dos ingredientes será ajustado conforme as diferenças contadas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmandoFinalizar(false)}
                className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizar}
                disabled={processando}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {processando ? 'Finalizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {confirmandoCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmandoCancelar(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-stone-800 mb-2">Cancelar inventário?</h2>
            <p className="text-sm text-stone-500 mb-5">
              O inventário será cancelado e nenhum ajuste de estoque será feito.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmandoCancelar(false)}
                className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={processando}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {processando ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
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
import { FornecedoresPage } from '@/features/fornecedores/pages/FornecedoresPage'
import { FornecedorFormPage } from '@/features/fornecedores/pages/FornecedorFormPage'
import { EntradasPage } from '@/features/entradas/pages/EntradasPage'
import { EntradaFormPage } from '@/features/entradas/pages/EntradaFormPage'
import { EntradaDetalhePage } from '@/features/entradas/pages/EntradaDetalhePage'
import { InventariosPage } from '@/features/inventarios/pages/InventariosPage'
import { InventarioFormPage } from '@/features/inventarios/pages/InventarioFormPage'
import { InventarioDetalhePage } from '@/features/inventarios/pages/InventarioDetalhePage'

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
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/fornecedores/novo" element={<FornecedorFormPage />} />
          <Route path="/fornecedores/:id/editar" element={<FornecedorFormPage />} />
          <Route path="/entradas" element={<EntradasPage />} />
          <Route path="/entradas/nova" element={<EntradaFormPage />} />
          <Route path="/entradas/:id" element={<EntradaDetalhePage />} />
          <Route path="/inventarios" element={<InventariosPage />} />
          <Route path="/inventarios/novo" element={<InventarioFormPage />} />
          <Route path="/inventarios/:id" element={<InventarioDetalhePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Habilitar link Inventário no Sidebar**

Em `src/components/layout/Sidebar.tsx`, alterar o item Inventário:

```typescript
// Antes:
{ label: 'Inventário', href: '/inventarios', icon: ClipboardDocumentCheckIcon, disponivel: false },

// Depois:
{ label: 'Inventário', href: '/inventarios', icon: ClipboardDocumentCheckIcon, disponivel: true },
```

- [ ] **Step 4: Testar no browser**

- Navegar para `/inventarios` → listagem vazia
- "Novo Inventário" → formulário, preencher data e salvar → redireciona para detalhe
- Status "Em Andamento" exibido
- Adicionar item: selecionar ingrediente, quantidade → "Adicionar" → item aparece na tabela imediatamente
- Diferença colorida: negativa em vermelho, positiva em verde
- Clicar "Finalizar" → modal de confirmação → status muda para "Finalizado"
- Botões de ação somem após finalizar

- [ ] **Step 5: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/inventarios/pages/ src/routes/AppRoutes.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(inventarios): detalhe com lançamento de itens, finalizar, cancelar, rotas e sidebar"
```

---

## Self-Review

**Cobertura da spec:**
- [x] `GET /api/inventarios` — useInventarios
- [x] `GET /api/inventarios/{id}` — InventarioDetalhePage
- [x] `POST /api/inventarios` — InventarioFormPage
- [x] `POST /api/inventarios/{id}/itens` — InventarioDetalhePage.handleAdicionarItem
- [x] `POST /api/inventarios/{id}/finalizar` — InventarioDetalhePage.handleFinalizar
- [x] `POST /api/inventarios/{id}/cancelar` — InventarioDetalhePage.handleCancelar
- [x] Badge de status (EmAndamento/Finalizado/Cancelado) — badgeStatus + labelStatus
- [x] Formulário inline de adição de item — form dentro do detalhe
- [x] Diferença colorida — condicional na célula
- [x] Confirmação antes de finalizar/cancelar — modais separados
- [x] Botões de ação só em andamento — `emAndamento` conditional
- [x] Controle por papel — `podeEditar`
