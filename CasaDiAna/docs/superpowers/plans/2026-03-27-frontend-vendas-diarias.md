# Vendas Diárias — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as páginas de listagem e registro de vendas diárias (`/producao/vendas`) conectadas ao endpoint `/api/vendas-diarias`.

**Architecture:** Estrutura idêntica ao módulo de Produção Diária — lista com filtros de período/produto e formulário simples em página separada. Usa tipos de `src/types/producao.ts` (criado no Plano 1).

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, React Hook Form + Zod, Axios, React Router v6

**Pré-requisito:** Plano 1 concluído. Plano 2 recomendado (serviço de produtos compartilhado).

---

### Visão Geral dos Arquivos

**Criar:**
- `frontend/src/features/producao/vendas-diarias/services/vendasDiariasService.ts`
- `frontend/src/features/producao/vendas-diarias/hooks/useVendasDiarias.ts`
- `frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx`
- `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`

**Modificar:**
- `frontend/src/components/layout/Sidebar.tsx` — ativar item "Vendas Diárias"
- `frontend/src/routes/AppRoutes.tsx` — adicionar rotas

---

### Task 1: Criar service e hook

**Files:**
- Create: `frontend/src/features/producao/vendas-diarias/services/vendasDiariasService.ts`
- Create: `frontend/src/features/producao/vendas-diarias/hooks/useVendasDiarias.ts`

- [ ] **Step 1: Criar o service**

```typescript
// frontend/src/features/producao/vendas-diarias/services/vendasDiariasService.ts
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { VendaDiaria, RegistrarVendaInput } from '@/types/producao'

export const vendasDiariasService = {
  listar: async (de?: string, ate?: string, produtoId?: string): Promise<VendaDiaria[]> => {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    if (produtoId) params.set('produtoId', produtoId)
    const query = params.toString()
    const resp = await api.get<ApiResponse<VendaDiaria[]>>(
      `/vendas-diarias${query ? `?${query}` : ''}`
    )
    return resp.data.dados
  },

  registrar: async (input: RegistrarVendaInput): Promise<VendaDiaria> => {
    const resp = await api.post<ApiResponse<VendaDiaria>>('/vendas-diarias', input)
    return resp.data.dados
  },
}
```

- [ ] **Step 2: Criar o hook**

```typescript
// frontend/src/features/producao/vendas-diarias/hooks/useVendasDiarias.ts
import { useState, useCallback } from 'react'
import { vendasDiariasService } from '../services/vendasDiariasService'
import type { VendaDiaria } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export function useVendasDiarias() {
  const [vendas, setVendas] = useState<VendaDiaria[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())

  const carregar = useCallback(async (filtroDe?: string, filtroAte?: string, produtoId?: string) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await vendasDiariasService.listar(filtroDe ?? de, filtroAte ?? ate, produtoId)
      setVendas(data)
    } catch {
      setErro('Erro ao carregar vendas.')
    } finally {
      setLoading(false)
    }
  }, [de, ate])

  return { vendas, loading, erro, de, ate, setDe, setAte, carregar }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/producao/vendas-diarias/
git commit -m "feat(frontend): service e hook de vendas diárias"
```

---

### Task 2: Criar VendasDiariasPage (listagem)

**Files:**
- Create: `frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx`

- [ ] **Step 1: Escrever a página**

```tsx
// frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useVendasDiarias } from '../hooks/useVendasDiarias'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

const inputClass =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function VendasDiariasPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { vendas, loading, erro, de, ate, setDe, setAte, carregar } = useVendasDiarias()
  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [produtoFiltro, setProdutoFiltro] = useState('')
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar()
  }, [carregar])

  const handleFiltrar = () => carregar(de, ate, produtoFiltro || undefined)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Vendas Diárias</h1>
        {podeEditar && (
          <button
            onClick={() => navigate('/producao/vendas/nova')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Registrar Venda
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
          <input
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Produto</label>
          <select
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFiltrar}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
        >
          Filtrar
        </button>
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {vendas.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhuma venda registrada no período.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Data</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Produto</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Qtd Vendida</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Registrado em</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{v.produtoNome}</td>
                    <td className="px-4 py-3 text-sm text-stone-800 text-right font-semibold">{v.quantidadeVendida}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">
                      {new Date(v.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx
git commit -m "feat(frontend): listagem de vendas diárias"
```

---

### Task 3: Criar RegistrarVendaPage

**Files:**
- Create: `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`

- [ ] **Step 1: Escrever a página de registro**

```tsx
// frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { vendasDiariasService } from '../services/vendasDiariasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo, VendaFormValues } from '@/types/producao'

const vendaSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeVendida: z
    .string()
    .min(1, 'Informe a quantidade.')
    .refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
})

const inputClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

const selectClass = inputClass + ' bg-white'

export function RegistrarVendaPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<VendaFormValues>({
      resolver: zodResolver(vendaSchema),
      defaultValues: {
        produtoId: '',
        data: new Date().toISOString().split('T')[0],
        quantidadeVendida: '',
      },
    })

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  const onSubmit = async (values: VendaFormValues) => {
    try {
      await vendasDiariasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeVendida: Number(values.quantidadeVendida),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Venda registrada com sucesso.' })
      setTimeout(() => navigate('/producao/vendas'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar venda.' })
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <button
        onClick={() => navigate('/producao/vendas')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Vendas Diárias
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Registrar Venda</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Produto <span className="text-red-500">*</span>
            </label>
            <select className={selectClass} {...register('produtoId')}>
              <option value="">Selecione o produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            {errors.produtoId && (
              <p className="mt-1 text-xs text-red-600">{errors.produtoId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Data <span className="text-red-500">*</span>
            </label>
            <input type="date" className={inputClass} {...register('data')} />
            {errors.data && (
              <p className="mt-1 text-xs text-red-600">{errors.data.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Quantidade Vendida <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="Ex: 8"
              className={inputClass}
              {...register('quantidadeVendida')}
            />
            {errors.quantidadeVendida && (
              <p className="mt-1 text-xs text-red-600">{errors.quantidadeVendida.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/vendas')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Venda'}
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
git add frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
git commit -m "feat(frontend): formulário de registro de venda diária"
```

---

### Task 4: Atualizar Sidebar e AppRoutes

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx`

- [ ] **Step 1: Ativar item na Sidebar**

No arquivo `frontend/src/components/layout/Sidebar.tsx`, localizar o item com `href: '/producao/vendas'` e alterar `disponivel: false` para `disponivel: true`:

```typescript
{ label: 'Vendas Diárias', href: '/producao/vendas', icon: CubeIcon, disponivel: true },
```

- [ ] **Step 2: Adicionar rotas no AppRoutes**

No arquivo `frontend/src/routes/AppRoutes.tsx`, adicionar os imports:

```typescript
import { VendasDiariasPage } from '@/features/producao/vendas-diarias/pages/VendasDiariasPage'
import { RegistrarVendaPage } from '@/features/producao/vendas-diarias/pages/RegistrarVendaPage'
```

Adicionar as rotas dentro do `<Route element={<MainLayout />}>`:

```tsx
<Route path="/producao/vendas" element={<VendasDiariasPage />} />
<Route path="/producao/vendas/nova" element={<RegistrarVendaPage />} />
```

- [ ] **Step 3: Verificar que o app compila**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Saída esperada: `✓ built in` sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/routes/AppRoutes.tsx
git commit -m "feat(frontend): rotas e sidebar para Vendas Diárias"
```

---

## Self-Review

**Spec coverage:**
- ✓ Listagem com filtros de período + produto
- ✓ Formulário em página separada (produto, data, quantidade)
- ✓ Controle de acesso por papel
- ✓ Endpoint `POST /api/vendas-diarias`
- ✓ Endpoint `GET /api/vendas-diarias?de=&ate=&produtoId=`

**Nota:** Diferente do módulo de Produção Diária, o registro de venda não afeta o estoque (apenas registra a venda). Por isso não há aviso sobre débito de estoque.
