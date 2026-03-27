# Fornecedores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRUD completo de Fornecedores — listagem em tabela, formulário em página separada (criar/editar), desativar com confirmação modal.

**Architecture:** Segue o mesmo padrão de Ingredientes: service → hook → form hook (Zod + RHF) → página de listagem → página de formulário. O formulário usa `CampoTexto` e `SelectCampo` existentes. CNPJ é armazenado como 14 dígitos sem máscara.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Zustand, Axios, React Hook Form, Zod, Heroicons.

---

## Estrutura de Arquivos

| Operação | Arquivo |
|----------|---------|
| Modify | `src/types/estoque.ts` — adicionar tipos de Fornecedor |
| Create | `src/features/fornecedores/services/fornecedoresService.ts` |
| Create | `src/features/fornecedores/hooks/useFornecedores.ts` |
| Create | `src/features/fornecedores/hooks/useFornecedorForm.ts` |
| Create | `src/features/fornecedores/pages/FornecedoresPage.tsx` |
| Create | `src/features/fornecedores/pages/FornecedorFormPage.tsx` |
| Modify | `src/routes/AppRoutes.tsx` — adicionar rotas de fornecedores |
| Modify | `src/components/layout/Sidebar.tsx` — habilitar link Fornecedores |
| Modify | `src/features/dashboard/pages/DashboardPage.tsx` — habilitar card Fornecedores |

---

### Task 1: Tipos + Service + Hook de Listagem

**Files:**
- Modify: `src/types/estoque.ts`
- Create: `src/features/fornecedores/services/fornecedoresService.ts`
- Create: `src/features/fornecedores/hooks/useFornecedores.ts`

- [ ] **Step 1: Adicionar tipos de Fornecedor ao estoque.ts**

Adicionar ao final de `src/types/estoque.ts`:

```typescript
// ─── Fornecedor ───────────────────────────────────────────────────────────────
export interface Fornecedor {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string | null
  telefone: string | null
  email: string | null
  contatoNome: string | null
  observacoes: string | null
  ativo: boolean
  atualizadoEm: string
}

export interface CriarFornecedorInput {
  razaoSocial: string
  nomeFantasia?: string | null
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  contatoNome?: string | null
  observacoes?: string | null
}

export interface AtualizarFornecedorInput extends CriarFornecedorInput {
  id: string
}

export interface FornecedorFormValues {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  telefone: string
  email: string
  contatoNome: string
  observacoes: string
}
```

- [ ] **Step 2: Criar fornecedoresService.ts**

Criar `src/features/fornecedores/services/fornecedoresService.ts`:

```typescript
import api from '@/lib/api'
import type {
  ApiResponse,
  Fornecedor,
  CriarFornecedorInput,
  AtualizarFornecedorInput,
} from '@/types/estoque'

export const fornecedoresService = {
  listar: async (): Promise<Fornecedor[]> => {
    const resp = await api.get<ApiResponse<Fornecedor[]>>('/fornecedores?apenasAtivos=true')
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Fornecedor> => {
    const resp = await api.get<ApiResponse<Fornecedor>>(`/fornecedores/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarFornecedorInput): Promise<Fornecedor> => {
    const resp = await api.post<ApiResponse<Fornecedor>>('/fornecedores', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarFornecedorInput): Promise<Fornecedor> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<Fornecedor>>(`/fornecedores/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/fornecedores/${id}`)
  },
}
```

- [ ] **Step 3: Criar useFornecedores.ts**

Criar `src/features/fornecedores/hooks/useFornecedores.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { fornecedoresService } from '../services/fornecedoresService'
import type { Fornecedor } from '@/types/estoque'

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await fornecedoresService.listar()
      setFornecedores(data)
    } catch {
      setErro('Erro ao carregar fornecedores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await fornecedoresService.desativar(id)
    setFornecedores(prev => prev.filter(f => f.id !== id))
  }, [])

  return { fornecedores, loading, erro, recarregar, desativar }
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: sem erros novos.

- [ ] **Step 5: Commit**

```bash
cd CasaDiAna/frontend
git add src/types/estoque.ts src/features/fornecedores/
git commit -m "feat(fornecedores): types, service e hook de listagem"
```

---

### Task 2: Hook de Formulário (Zod + RHF)

**Files:**
- Create: `src/features/fornecedores/hooks/useFornecedorForm.ts`

- [ ] **Step 1: Criar useFornecedorForm.ts**

Criar `src/features/fornecedores/hooks/useFornecedorForm.ts`:

```typescript
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Fornecedor, FornecedorFormValues, CriarFornecedorInput } from '@/types/estoque'

export const fornecedorSchema = z.object({
  razaoSocial: z
    .string()
    .min(1, 'Razão Social é obrigatória.')
    .max(200, 'Máximo de 200 caracteres.'),
  nomeFantasia: z.string().max(200, 'Máximo de 200 caracteres.'),
  cnpj: z
    .string()
    .refine(v => !v || /^\d{14}$/.test(v), 'CNPJ deve ter exatamente 14 dígitos numéricos.'),
  telefone: z.string().max(20, 'Máximo de 20 caracteres.'),
  email: z
    .string()
    .refine(
      v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Informe um e-mail válido.'
    ),
  contatoNome: z.string(),
  observacoes: z.string(),
})

export function fornecedorParaForm(f: Fornecedor): FornecedorFormValues {
  return {
    razaoSocial: f.razaoSocial,
    nomeFantasia: f.nomeFantasia ?? '',
    cnpj: f.cnpj ?? '',
    telefone: f.telefone ?? '',
    email: f.email ?? '',
    contatoNome: f.contatoNome ?? '',
    observacoes: f.observacoes ?? '',
  }
}

export function formParaInput(values: FornecedorFormValues): CriarFornecedorInput {
  return {
    razaoSocial: values.razaoSocial,
    nomeFantasia: values.nomeFantasia || null,
    cnpj: values.cnpj || null,
    telefone: values.telefone || null,
    email: values.email || null,
    contatoNome: values.contatoNome || null,
    observacoes: values.observacoes || null,
  }
}

export function useFornecedorForm() {
  return useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      telefone: '',
      email: '',
      contatoNome: '',
      observacoes: '',
    },
  })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/fornecedores/hooks/useFornecedorForm.ts
git commit -m "feat(fornecedores): schema Zod e hook de formulário"
```

---

### Task 3: Página de Listagem

**Files:**
- Create: `src/features/fornecedores/pages/FornecedoresPage.tsx`

- [ ] **Step 1: Criar FornecedoresPage.tsx**

Criar `src/features/fornecedores/pages/FornecedoresPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useFornecedores } from '../hooks/useFornecedores'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { Fornecedor } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function FornecedoresPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { fornecedores, loading, erro, desativar } = useFornecedores()

  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [paraDesativar, setParaDesativar] = useState<Fornecedor | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Fornecedor desativado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar fornecedor.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Fornecedores</h1>
        {podeEditar && (
          <button
            onClick={() => navigate('/fornecedores/novo')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Fornecedor
          </button>
        )}
      </div>

      {/* Carregando */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4
                          border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando fornecedores...</p>
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
          {fornecedores.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum fornecedor cadastrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    Razão Social
                  </th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    CNPJ
                  </th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">
                    Telefone
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
                {fornecedores.map(f => (
                  <tr key={f.id} className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-stone-800">{f.razaoSocial}</p>
                      {f.nomeFantasia && (
                        <p className="text-xs text-stone-500 mt-0.5">{f.nomeFantasia}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 font-mono">
                      {f.cnpj ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {f.telefone ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        f.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {podeEditar && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/fornecedores/${f.id}/editar`)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-amber-700"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setParaDesativar(f)}
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
          nomeIngrediente={paraDesativar.razaoSocial}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}

      {toast && (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/fornecedores/pages/FornecedoresPage.tsx
git commit -m "feat(fornecedores): página de listagem"
```

---

### Task 4: Página de Formulário + Rotas + Sidebar

**Files:**
- Create: `src/features/fornecedores/pages/FornecedorFormPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Criar FornecedorFormPage.tsx**

Criar `src/features/fornecedores/pages/FornecedorFormPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import {
  useFornecedorForm,
  fornecedorParaForm,
  formParaInput,
} from '../hooks/useFornecedorForm'
import { fornecedoresService } from '../services/fornecedoresService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FornecedorFormValues } from '@/types/estoque'

export function FornecedorFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useFornecedorForm()

  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!id) return
    fornecedoresService
      .obterPorId(id)
      .then(f => reset(fornecedorParaForm(f)))
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar fornecedor.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: FornecedorFormValues) => {
    try {
      const input = formParaInput(values)
      if (id) {
        await fornecedoresService.atualizar({ id, ...input })
        setToast({ tipo: 'sucesso', mensagem: 'Fornecedor atualizado com sucesso.' })
      } else {
        await fornecedoresService.criar(input)
        setToast({ tipo: 'sucesso', mensagem: 'Fornecedor criado com sucesso.' })
      }
      setTimeout(() => navigate('/fornecedores'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar fornecedor.' })
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/fornecedores')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Fornecedores
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {isEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">

          {/* Identificação */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Identificação
            </p>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Razão Social"
                obrigatorio
                placeholder="Nome jurídico completo"
                erro={errors.razaoSocial?.message}
                {...register('razaoSocial')}
              />
              <CampoTexto
                label="Nome Fantasia"
                placeholder="Nome comercial (opcional)"
                erro={errors.nomeFantasia?.message}
                {...register('nomeFantasia')}
              />
            </div>
            <div className="mt-4 max-w-xs">
              <CampoTexto
                label="CNPJ"
                placeholder="14 dígitos sem pontuação"
                erro={errors.cnpj?.message}
                {...register('cnpj')}
              />
            </div>
          </div>

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Contato
            </p>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Telefone"
                placeholder="(11) 99999-9999"
                erro={errors.telefone?.message}
                {...register('telefone')}
              />
              <CampoTexto
                label="E-mail"
                placeholder="contato@empresa.com"
                erro={errors.email?.message}
                {...register('email')}
              />
              <CampoTexto
                label="Nome do Contato"
                placeholder="Responsável pelo atendimento"
                erro={errors.contatoNome?.message}
                {...register('contatoNome')}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Observações
            </label>
            <textarea
              rows={3}
              placeholder="Informações adicionais..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              {...register('observacoes')}
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/fornecedores')}
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
            {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Habilitar link Fornecedores no Sidebar**

Em `src/components/layout/Sidebar.tsx`, alterar o item Fornecedores:

```typescript
// Antes:
{ label: 'Fornecedores', href: '/fornecedores', icon: TruckIcon, disponivel: false },

// Depois:
{ label: 'Fornecedores', href: '/fornecedores', icon: TruckIcon, disponivel: true },
```

- [ ] **Step 4: Testar no browser**

- Navegar para `/fornecedores`
- Clicar em "Novo Fornecedor" → formulário abre
- Preencher só razão social → salvar → toast de sucesso → redireciona para listagem
- Clicar em editar → formulário pré-preenchido
- CNPJ com menos de 14 dígitos → erro de validação antes de enviar
- Desativar fornecedor → confirmação modal → fornecedor some

- [ ] **Step 5: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/fornecedores/pages/FornecedorFormPage.tsx src/routes/AppRoutes.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(fornecedores): formulário, rotas e sidebar"
```

---

## Self-Review

**Cobertura da spec:**
- [x] `GET /api/fornecedores` — useFornecedores
- [x] `GET /api/fornecedores/{id}` — FornecedorFormPage (modo editar)
- [x] `POST /api/fornecedores` — FornecedorFormPage (modo criar)
- [x] `PUT /api/fornecedores/{id}` — FornecedorFormPage (modo editar)
- [x] `DELETE /api/fornecedores/{id}` — FornecedoresPage.handleDesativar
- [x] Validação CNPJ 14 dígitos — fornecedorSchema
- [x] Validação e-mail — fornecedorSchema
- [x] Formulário em página separada — FornecedorFormPage
- [x] Confirmação antes de desativar — ModalDesativar
- [x] Controle por papel — `podeEditar`
