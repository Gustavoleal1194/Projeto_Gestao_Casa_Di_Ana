# Produtos — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as páginas de listagem e formulário de produtos (`/producao/produtos`) conectadas ao endpoint `/api/produtos`, mais a página de Ficha Técnica (`/producao/produtos/:id/ficha-tecnica`) conectada ao endpoint `/api/produtos/:id/ficha-tecnica`.

**Architecture:** Lista com tabela + botões de editar/desativar. Formulário em página separada (padrão do módulo Fornecedores). Ficha Técnica em página separada com lista dinâmica de itens (padrão dos Itens de Entrada). Usa tipos de `src/types/producao.ts` (criado no Plano 1).

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, React Hook Form + Zod, Axios, React Router v6

**Pré-requisito:** Plano 1 concluído (`src/types/producao.ts` existe).

---

### Visão Geral dos Arquivos

**Criar:**
- `frontend/src/features/producao/produtos/services/produtosService.ts`
- `frontend/src/features/producao/produtos/hooks/useProdutos.ts`
- `frontend/src/features/producao/produtos/hooks/useProdutoForm.ts`
- `frontend/src/features/producao/produtos/pages/ProdutosPage.tsx`
- `frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`
- `frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx`

**Modificar:**
- `frontend/src/components/layout/Sidebar.tsx` — ativar item "Produtos"
- `frontend/src/routes/AppRoutes.tsx` — adicionar rotas de produtos e ficha técnica

---

### Task 1: Criar service

**Files:**
- Create: `frontend/src/features/producao/produtos/services/produtosService.ts`

- [ ] **Step 1: Escrever o service**

```typescript
// frontend/src/features/producao/produtos/services/produtosService.ts
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type {
  Produto,
  ProdutoResumo,
  CriarProdutoInput,
  AtualizarProdutoInput,
  FichaTecnica,
  DefinirFichaTecnicaInput,
} from '@/types/producao'

export const produtosService = {
  listar: async (apenasAtivos = true): Promise<ProdutoResumo[]> => {
    const resp = await api.get<ApiResponse<ProdutoResumo[]>>(
      `/produtos?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Produto> => {
    const resp = await api.get<ApiResponse<Produto>>(`/produtos/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarProdutoInput): Promise<Produto> => {
    const resp = await api.post<ApiResponse<Produto>>('/produtos', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarProdutoInput): Promise<Produto> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<Produto>>(`/produtos/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/produtos/${id}`)
  },

  obterFichaTecnica: async (id: string): Promise<FichaTecnica> => {
    const resp = await api.get<ApiResponse<FichaTecnica>>(`/produtos/${id}/ficha-tecnica`)
    return resp.data.dados
  },

  definirFichaTecnica: async (id: string, input: DefinirFichaTecnicaInput): Promise<FichaTecnica> => {
    const resp = await api.put<ApiResponse<FichaTecnica>>(`/produtos/${id}/ficha-tecnica`, input)
    return resp.data.dados
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/producao/produtos/services/
git commit -m "feat(frontend): service de produtos"
```

---

### Task 2: Criar hooks

**Files:**
- Create: `frontend/src/features/producao/produtos/hooks/useProdutos.ts`
- Create: `frontend/src/features/producao/produtos/hooks/useProdutoForm.ts`

- [ ] **Step 1: Criar useProdutos**

```typescript
// frontend/src/features/producao/produtos/hooks/useProdutos.ts
import { useState, useEffect, useCallback } from 'react'
import { produtosService } from '../services/produtosService'
import type { ProdutoResumo } from '@/types/producao'

export function useProdutos(apenasAtivos = true) {
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await produtosService.listar(apenasAtivos)
      setProdutos(data)
    } catch {
      setErro('Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivos])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await produtosService.desativar(id)
    setProdutos(prev => prev.filter(p => p.id !== id))
  }, [])

  return { produtos, loading, erro, recarregar, desativar }
}
```

- [ ] **Step 2: Criar useProdutoForm**

```typescript
// frontend/src/features/producao/produtos/hooks/useProdutoForm.ts
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Produto, ProdutoFormValues, CriarProdutoInput } from '@/types/producao'

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(150, 'Máximo de 150 caracteres.'),
  precoVenda: z
    .string()
    .min(1, 'Preço de venda é obrigatório.')
    .refine(v => Number(v) >= 0, 'Preço deve ser ≥ 0.'),
  categoriaProdutoId: z.string(),
  descricao: z.string(),
})

export function produtoParaForm(p: Produto): ProdutoFormValues {
  return {
    nome: p.nome,
    precoVenda: String(p.precoVenda),
    categoriaProdutoId: p.categoriaProdutoId ?? '',
    descricao: p.descricao ?? '',
  }
}

export function formParaInput(values: ProdutoFormValues): CriarProdutoInput {
  return {
    nome: values.nome,
    precoVenda: Number(values.precoVenda),
    categoriaProdutoId: values.categoriaProdutoId || null,
    descricao: values.descricao || null,
  }
}

export function useProdutoForm() {
  return useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      precoVenda: '',
      categoriaProdutoId: '',
      descricao: '',
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/producao/produtos/hooks/
git commit -m "feat(frontend): hooks de produtos"
```

---

### Task 3: Criar ProdutosPage (listagem)

**Files:**
- Create: `frontend/src/features/producao/produtos/pages/ProdutosPage.tsx`

- [ ] **Step 1: Escrever a página**

```tsx
// frontend/src/features/producao/produtos/pages/ProdutosPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useProdutos } from '../hooks/useProdutos'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function ProdutosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { produtos, loading, erro, desativar } = useProdutos()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [paraDesativar, setParaDesativar] = useState<ProdutoResumo | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Produto desativado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar produto.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Produtos</h1>
        {podeEditar && (
          <button
            onClick={() => navigate('/producao/produtos/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Produto
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando produtos...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {produtos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum produto cadastrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nome</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Categoria</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Preço de Venda</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                  {podeEditar && (
                    <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{p.nome}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{p.categoriaNome ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-stone-800 text-right font-semibold">
                      {p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.ativo ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {podeEditar && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/producao/produtos/${p.id}/ficha-tecnica`)}
                          title="Ficha Técnica"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/producao/produtos/${p.id}/editar`)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700 ml-1"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setParaDesativar(p)}
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
          )}
        </div>
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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/producao/produtos/pages/ProdutosPage.tsx
git commit -m "feat(frontend): página de listagem de produtos"
```

---

### Task 4: Criar ProdutoFormPage

**Files:**
- Create: `frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`

- [ ] **Step 1: Escrever a página de formulário**

```tsx
// frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useProdutoForm, produtoParaForm, formParaInput } from '../hooks/useProdutoForm'
import { produtosService } from '../services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaProduto, ProdutoFormValues } from '@/types/producao'

const selectClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function ProdutoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useProdutoForm()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    categoriasProdutoService.listar().then(setCategorias).catch(() => {})
    if (!id) return
    produtosService
      .obterPorId(id)
      .then(p => reset(produtoParaForm(p)))
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar produto.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: ProdutoFormValues) => {
    try {
      const input = formParaInput(values)
      if (id) {
        await produtosService.atualizar({ id, ...input })
        setToast({ tipo: 'sucesso', mensagem: 'Produto atualizado com sucesso.' })
      } else {
        await produtosService.criar(input)
        setToast({ tipo: 'sucesso', mensagem: 'Produto criado com sucesso.' })
      }
      setTimeout(() => navigate('/producao/produtos'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar produto.' })
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={() => navigate('/producao/produtos')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {isEdicao ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <CampoTexto
                  label="Nome"
                  obrigatorio
                  placeholder="Nome do produto"
                  erro={errors.nome?.message}
                  {...register('nome')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Preço de Venda (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  {...register('precoVenda')}
                />
                {errors.precoVenda && (
                  <p className="mt-1 text-xs text-red-600">{errors.precoVenda.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                <select className={selectClass} {...register('categoriaProdutoId')}>
                  <option value="">Sem categoria</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              placeholder="Descrição do produto (opcional)"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              {...register('descricao')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/produtos')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
git commit -m "feat(frontend): formulário de produto"
```

---

### Task 5: Criar FichaTecnicaPage

**Files:**
- Create: `frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx`

- [ ] **Step 1: Escrever a página de ficha técnica**

```tsx
// frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { produtosService } from '../services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FichaTecnica, IngredienteResumo } from '@/types/producao'
import type { IngredienteResumo as IngResumo } from '@/types/estoque'

const fichaSchema = z.object({
  itens: z.array(
    z.object({
      ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
      quantidadePorUnidade: z
        .string()
        .min(1)
        .refine(v => Number(v) > 0, 'Quantidade deve ser > 0.'),
    })
  ).min(1, 'Adicione pelo menos um ingrediente.'),
})

type FichaFormValues = {
  itens: { ingredienteId: string; quantidadePorUnidade: string }[]
}

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

const selectClass = inputClass + ' bg-white'

export function FichaTecnicaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [ficha, setFicha] = useState<FichaTecnica | null>(null)
  const [ingredientes, setIngredientes] = useState<IngResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FichaFormValues>({
      resolver: zodResolver(fichaSchema),
      defaultValues: { itens: [{ ingredienteId: '', quantidadePorUnidade: '' }] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    if (!id) return
    Promise.all([
      produtosService.obterFichaTecnica(id).catch(() => null),
      ingredientesService.listar(),
    ])
      .then(([fichaData, ingsData]) => {
        setIngredientes(ingsData)
        if (fichaData && fichaData.itens.length > 0) {
          setFicha(fichaData)
          reset({
            itens: fichaData.itens.map(i => ({
              ingredienteId: i.ingredienteId,
              quantidadePorUnidade: String(i.quantidadePorUnidade),
            })),
          })
        }
      })
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar ficha técnica.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: FichaFormValues) => {
    if (!id) return
    try {
      const fichaAtualizada = await produtosService.definirFichaTecnica(id, {
        itens: values.itens.map(i => ({
          ingredienteId: i.ingredienteId,
          quantidadePorUnidade: Number(i.quantidadePorUnidade),
        })),
      })
      setFicha(fichaAtualizada)
      setToast({ tipo: 'sucesso', mensagem: 'Ficha técnica salva com sucesso.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar ficha técnica.' })
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate('/producao/produtos')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">
            Ficha Técnica — {ficha?.produtoNome ?? 'Produto'}
          </h1>
          {ficha && (
            <p className="text-sm text-stone-500 mt-1">
              Preço de venda: {ficha.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
        {ficha && ficha.custoTotal > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 px-5 py-3 text-right">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Custo Total</p>
            <p className="text-lg font-semibold text-stone-800">
              {ficha.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            {ficha.margemLucro != null && (
              <p className={`text-xs font-medium mt-0.5 ${ficha.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Margem: {ficha.margemLucro.toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Ingredientes</p>
            <button
              type="button"
              onClick={() => append({ ingredienteId: '', quantidadePorUnidade: '' })}
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Adicionar ingrediente
            </button>
          </div>

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-2 text-xs text-red-600">{(errors.itens as { message?: string }).message}</p>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_120px_40px] gap-2 text-xs font-medium text-stone-500 px-1">
              <span>Ingrediente</span>
              <span>Qtd por Unidade</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_120px_40px] gap-2 items-start">
                <div>
                  <select className={selectClass} {...register(`itens.${index}.ingredienteId`)}>
                    <option value="">Selecione...</option>
                    {ingredientes.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.nome} ({ing.unidadeMedidaCodigo})
                      </option>
                    ))}
                  </select>
                  {errors.itens?.[index]?.ingredienteId && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.itens[index]?.ingredienteId?.message}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    className={inputClass}
                    {...register(`itens.${index}.quantidadePorUnidade`)}
                  />
                  {errors.itens?.[index]?.quantidadePorUnidade && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.itens[index]?.quantidadePorUnidade?.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  className="p-2 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed mt-0.5"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/produtos')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Ficha Técnica'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx
git commit -m "feat(frontend): página de ficha técnica do produto"
```

---

### Task 6: Atualizar Sidebar e AppRoutes

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`

- [ ] **Step 1: Ativar item Produtos na Sidebar**

No arquivo `frontend/src/components/layout/Sidebar.tsx`, localizar o item com `href: '/producao/produtos'` e alterar `disponivel: false` para `disponivel: true`:

```typescript
{ label: 'Produtos', href: '/producao/produtos', icon: CubeIcon, disponivel: true },
```

- [ ] **Step 2: Adicionar rotas no AppRoutes**

No arquivo `frontend/src/routes/AppRoutes.tsx`, adicionar os imports:

```typescript
import { ProdutosPage } from '@/features/producao/produtos/pages/ProdutosPage'
import { ProdutoFormPage } from '@/features/producao/produtos/pages/ProdutoFormPage'
import { FichaTecnicaPage } from '@/features/producao/produtos/pages/FichaTecnicaPage'
```

Adicionar as rotas dentro do `<Route element={<MainLayout />}>`, após a rota de categorias-produto:

```tsx
<Route path="/producao/produtos" element={<ProdutosPage />} />
<Route path="/producao/produtos/novo" element={<ProdutoFormPage />} />
<Route path="/producao/produtos/:id/editar" element={<ProdutoFormPage />} />
<Route path="/producao/produtos/:id/ficha-tecnica" element={<FichaTecnicaPage />} />
```

- [ ] **Step 3: Verificar que o app compila**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Saída esperada: `✓ built in` sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/routes/AppRoutes.tsx
git commit -m "feat(frontend): rotas e sidebar para Produtos e Ficha Técnica"
```

---

## Self-Review

**Spec coverage:**
- ✓ Listagem com nome, categoria, preço, status, ações
- ✓ Formulário em página separada (criar/editar)
- ✓ Desativar com confirmação modal
- ✓ Botão de Ficha Técnica na listagem (ícone DocumentText)
- ✓ Ficha Técnica: lista dinâmica de ingredientes + quantidade, custo total e margem calculados pelo backend
- ✓ Controle de acesso por papel
- ✓ Endpoints `/api/produtos` e `/api/produtos/:id/ficha-tecnica`

**Atenção:** `FichaTecnicaPage` importa `IngredienteResumo` de `@/types/estoque` (não de `@/types/producao`) — o type alias `IngResumo` evita conflito. Verificar que o import está correto ao implementar.
