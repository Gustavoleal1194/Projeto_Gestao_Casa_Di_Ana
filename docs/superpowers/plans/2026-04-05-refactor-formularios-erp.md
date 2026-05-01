# Refatoração ERP dos Formulários — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar todos os formulários do frontend para seguir padrão ERP profissional consistente, usando o design system de CSS vars já existente e novos componentes compartilhados.

**Architecture:** Criar uma biblioteca de componentes de formulário em `src/components/form/` (FormSection, FormTextarea, FormActions, FormCard, Spinner) e aplicá-la a todos os 12 formulários do sistema, substituindo classes Tailwind hardcoded por CSS vars e eliminando padrões duplicados (`inputClass`/`selectClass`). Os formulários com estado manual (PerdasPage, ModalCategoria, ModalCategoriaProduto) são convertidos para React Hook Form + Zod.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, React Hook Form, Zod, CSS Variables (`--ada-*`), Heroicons.

**Design Direction:** "Structured Warmth" — cabeçalhos de seção com barra vertical âmbar (3px, `#C4870A`), cards brancos com `var(--ada-border)`, campos via CampoTexto/SelectCampo/FormTextarea, botões com gradiente âmbar. Compatível com dark mode via CSS vars. Referência de qualidade: `IngredienteFormPage.tsx` (já implementado corretamente).

---

## Mapa de arquivos

### Criar (novos):
- `frontend/src/components/form/Spinner.tsx` — SVG spinner reutilizável
- `frontend/src/components/form/FormSection.tsx` — cabeçalho de seção com acento âmbar
- `frontend/src/components/form/FormTextarea.tsx` — textarea com mesmo estilo que CampoTexto
- `frontend/src/components/form/FormActions.tsx` — par de botões Cancelar + Salvar
- `frontend/src/components/form/FormCard.tsx` — wrapper de card branco

### Modificar (refatorar):
- `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx` — remover Spinner/SecaoFormulario inline, importar dos shared
- `frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx` — aplicar design system completo
- `frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx` — aplicar design system
- `frontend/src/features/inventarios/pages/InventarioFormPage.tsx` — aplicar design system
- `frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx` — refatorar form inline de item
- `frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` — aplicar design system
- `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` — aplicar design system
- `frontend/src/features/producao/perdas/pages/PerdasPage.tsx` — converter modal para RHF+Zod
- `frontend/src/features/estoque/categorias/components/ModalCategoria.tsx` — upgrade visual
- `frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx` — upgrade visual
- `frontend/src/features/entradas/pages/EntradaFormPage.tsx` — refatorar campos e seções
- `frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx` — refatorar campos e seções

---

## Task 1: Componentes compartilhados de formulário

**Files:**
- Create: `frontend/src/components/form/Spinner.tsx`
- Create: `frontend/src/components/form/FormSection.tsx`
- Create: `frontend/src/components/form/FormTextarea.tsx`
- Create: `frontend/src/components/form/FormActions.tsx`
- Create: `frontend/src/components/form/FormCard.tsx`

- [ ] **Step 1: Criar Spinner.tsx**

```tsx
// frontend/src/components/form/Spinner.tsx
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
```

- [ ] **Step 2: Criar FormSection.tsx**

```tsx
// frontend/src/components/form/FormSection.tsx
interface FormSectionProps {
  titulo: string
}

export function FormSection({ titulo }: FormSectionProps) {
  return (
    <div className="flex items-center gap-3 mt-7 mb-4">
      <div
        className="w-[3px] h-3.5 rounded-full shrink-0"
        style={{ background: '#C4870A' }}
        aria-hidden="true"
      />
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.10em] whitespace-nowrap"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {titulo}
      </span>
      <div
        className="flex-1"
        style={{ borderTop: '1px solid var(--ada-border-sub)' }}
        aria-hidden="true"
      />
    </div>
  )
}
```

- [ ] **Step 3: Criar FormTextarea.tsx**

```tsx
// frontend/src/components/form/FormTextarea.tsx
import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
}

export function FormTextarea({ label, erro, obrigatorio, id, className, rows = 3, ...props }: Props) {
  const inputId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-[13px] font-medium mb-1.5"
        style={{ color: 'var(--ada-body)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
      >
        {label}
        {obrigatorio && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
        )}
        {obrigatorio && <span className="sr-only">(obrigatório)</span>}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={!!erro}
        aria-describedby={erro ? `${inputId}-erro` : undefined}
        {...props}
        className={[
          'w-full rounded-lg px-3.5 py-2.5 text-sm resize-none outline-none transition-all duration-200',
          'border focus-visible:ring-2 focus-visible:ring-[#C4870A]/25',
          erro
            ? 'border-red-300 bg-red-50/50 focus-visible:border-red-400'
            : 'border-[var(--ada-border)] bg-[var(--ada-surface)] focus-visible:border-[#C4870A]',
          'text-[var(--ada-heading)] placeholder-[var(--ada-placeholder)]',
          className ?? '',
        ].join(' ')}
        style={{ boxShadow: 'var(--shadow-xs)' }}
      />
      {erro && (
        <p id={`${inputId}-erro`} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {erro}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Criar FormActions.tsx**

```tsx
// frontend/src/components/form/FormActions.tsx
import { Spinner } from './Spinner'

interface FormActionsProps {
  salvando: boolean
  labelSalvar?: string
  onCancelar: () => void
}

export function FormActions({ salvando, labelSalvar = 'Salvar', onCancelar }: FormActionsProps) {
  return (
    <div
      className="flex justify-end gap-2.5 pt-5 mt-6"
      style={{ borderTop: '1px solid var(--ada-border-sub)' }}
    >
      <button
        type="button"
        onClick={onCancelar}
        disabled={salvando}
        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-50
                   hover:bg-[var(--ada-bg)]"
        style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={salvando}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white
                   transition-all duration-200 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                   disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
          boxShadow: '0 3px 10px rgba(196,135,10,0.28)',
          fontFamily: 'Sora, system-ui, sans-serif',
        }}
      >
        {salvando && <Spinner />}
        {salvando ? 'Salvando…' : labelSalvar}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Criar FormCard.tsx**

```tsx
// frontend/src/components/form/FormCard.tsx
interface FormCardProps {
  children: React.ReactNode
  className?: string
}

export function FormCard({ children, className = '' }: FormCardProps) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add CasaDiAna/frontend/src/components/form/
git commit -m "feat: adiciona componentes compartilhados de formulário ERP (FormSection, FormTextarea, FormActions, FormCard, Spinner)"
```

---

## Task 2: Atualizar IngredienteFormPage para usar shared components

**Files:**
- Modify: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

O `IngredienteFormPage` já tem excelente design mas declara `Spinner` e `SecaoFormulario` inline. Substituir pelas versões compartilhadas.

- [ ] **Step 1: Substituir imports e remover funções inline**

Conteúdo completo do arquivo após a refatoração:

```tsx
// frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { useIngredienteForm, ingredienteParaForm } from '../hooks/useIngredienteForm'
import { ingredientesService } from '../services/ingredientesService'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useUnidadesMedida } from '@/features/estoque/unidades/hooks/useUnidadesMedida'
import { CampoTexto } from '../components/CampoTexto'
import { SelectCampo } from '../components/SelectCampo'
import { Toast } from '../components/Toast'
import { Spinner } from '@/components/form/Spinner'
import { FormSection } from '@/components/form/FormSection'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import type { Ingrediente } from '@/types/estoque'

export function IngredienteFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const modoEdicao = !!id

  const [ingrediente, setIngrediente] = useState<Ingrediente | null>(null)
  const [carregando, setCarregando] = useState(modoEdicao)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ingredientesService
      .obterPorId(id)
      .then(setIngrediente)
      .catch(() => setErroCarregamento('Ingrediente não encontrado.'))
      .finally(() => setCarregando(false))
  }, [id])

  const { categorias } = useCategorias()
  const { unidades } = useUnidadesMedida()

  const [unidadeAtual, setUnidadeAtual] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const fecharToast = useCallback(() => setToast(null), [])

  const { form, salvar } = useIngredienteForm({ ingredienteExistente: ingrediente })
  const { register, handleSubmit, watch, reset, formState: { errors } } = form

  useEffect(() => {
    if (ingrediente) reset(ingredienteParaForm(ingrediente))
  }, [ingrediente, reset])

  const unidadeSelecionadaId = watch('unidadeMedidaId')
  useEffect(() => {
    const unidade = unidades.find(u => String(u.id) === unidadeSelecionadaId)
    setUnidadeAtual(unidade?.codigo ?? '')
  }, [unidadeSelecionadaId, unidades])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = handleSubmit(async (values: any) => {
    setSalvando(true)
    try {
      await salvar(values)
      setToast({ tipo: 'sucesso', mensagem: 'Ingrediente salvo com sucesso!' })
      setTimeout(() => navigate('/estoque/ingredientes'), 1500)
    } catch (e: unknown) {
      const erros = (e as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({
        tipo: 'erro',
        mensagem: erros?.length ? erros.join(' ') : 'Erro ao salvar ingrediente.',
      })
    } finally {
      setSalvando(false)
    }
  })

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner className="text-amber-700 h-8 w-8" />
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="p-6">
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: 'var(--ada-error-text)' }}>
          {erroCarregamento}
        </div>
        <Link to="/estoque/ingredientes" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--ada-muted)' }}>
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar para Ingredientes
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={fecharToast} />}

      <Link
        to="/estoque/ingredientes"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Ingredientes
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {modoEdicao ? `Editar: ${ingrediente?.nome ?? ''}` : 'Novo Ingrediente'}
      </h1>

      <form onSubmit={onSubmit}>
        <FormCard>
          <FormSection titulo="Identificação" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <CampoTexto
                label="Nome"
                obrigatorio
                placeholder="Ex: Farinha de Trigo Especial"
                {...register('nome')}
                erro={errors.nome?.message}
              />
            </div>
            <div className="col-span-1">
              <CampoTexto
                label="Código Interno"
                placeholder="Ex: FA-001"
                {...register('codigoInterno')}
                erro={errors.codigoInterno?.message}
              />
            </div>
          </div>

          <FormSection titulo="Classificação" />
          <div className="grid grid-cols-2 gap-4">
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              {...register('categoriaId')}
              erro={errors.categoriaId?.message}
            />
            <SelectCampo
              label="Unidade de Medida"
              obrigatorio
              placeholderOpcao="Selecione..."
              opcoes={unidades.map(u => ({ valor: u.id, rotulo: `${u.codigo} — ${u.descricao}` }))}
              {...register('unidadeMedidaId')}
              erro={errors.unidadeMedidaId?.message}
            />
          </div>

          <FormSection titulo="Controle de Estoque" />
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto
              label="Estoque Mínimo"
              obrigatorio
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              sufixo={unidadeAtual}
              {...register('estoqueMinimo')}
              erro={errors.estoqueMinimo?.message}
            />
            <CampoTexto
              label="Estoque Máximo"
              type="number"
              step="0.001"
              min="0"
              placeholder="Opcional"
              sufixo={unidadeAtual}
              {...register('estoqueMaximo')}
              erro={errors.estoqueMaximo?.message}
            />
          </div>

          <FormSection titulo="Observações" />
          <FormTextarea
            label="Observações"
            placeholder="Informações adicionais sobre este ingrediente…"
            {...register('observacoes')}
            erro={errors.observacoes?.message}
          />

          <FormActions
            salvando={salvando}
            labelSalvar="Salvar Ingrediente"
            onCancelar={() => navigate('/estoque/ingredientes')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx
git commit -m "refactor: IngredienteFormPage usa componentes form compartilhados"
```

---

## Task 3: ProdutoFormPage

**Files:**
- Modify: `frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`

**Problemas atuais:** usa `stone-200`/`amber-700` hardcoded, `<select>` raw sem SelectCampo, `<textarea>` raw sem FormTextarea, botões sem CSS vars.

- [ ] **Step 1: Reescrever ProdutoFormPage.tsx**

```tsx
// frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useProdutoForm, produtoParaForm, formParaInput } from '../hooks/useProdutoForm'
import { produtosService } from '../services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Spinner } from '@/components/form/Spinner'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaProduto, ProdutoFormValues } from '@/types/producao'

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
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" style={{ color: '#C4870A' }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/producao/produtos"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {isEdicao ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Identificação" />
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
            <CampoTexto
              label="Preço de Venda (R$)"
              obrigatorio
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              erro={errors.precoVenda?.message}
              {...register('precoVenda')}
            />
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaProdutoId?.message}
              {...register('categoriaProdutoId')}
            />
          </div>

          <FormSection titulo="Descrição" />
          <FormTextarea
            label="Descrição"
            placeholder="Descrição do produto (opcional)"
            {...register('descricao')}
            erro={errors.descricao?.message}
          />

          <FormActions
            salvando={isSubmitting}
            labelSalvar={isEdicao ? 'Salvar Alterações' : 'Criar Produto'}
            onCancelar={() => navigate('/producao/produtos')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
git commit -m "refactor: ProdutoFormPage aplica design system ERP completo"
```

---

## Task 4: FornecedorFormPage

**Files:**
- Modify: `frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx`

- [ ] **Step 1: Reescrever FornecedorFormPage.tsx**

```tsx
// frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useFornecedorForm, fornecedorParaForm, formParaInput } from '../hooks/useFornecedorForm'
import { fornecedoresService } from '../services/fornecedoresService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Spinner } from '@/components/form/Spinner'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FornecedorFormValues } from '@/types/estoque'

export function FornecedorFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useFornecedorForm()
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
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" style={{ color: '#C4870A' }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/fornecedores"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Fornecedores
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {isEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Identificação" />
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

          <FormSection titulo="Contato" />
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto
              label="Telefone"
              placeholder="(11) 99999-9999"
              erro={errors.telefone?.message}
              {...register('telefone')}
            />
            <CampoTexto
              label="E-mail"
              type="email"
              placeholder="contato@empresa.com"
              erro={errors.email?.message}
              {...register('email')}
            />
            <div className="col-span-2">
              <CampoTexto
                label="Nome do Contato"
                placeholder="Responsável pelo atendimento"
                erro={errors.contatoNome?.message}
                {...register('contatoNome')}
              />
            </div>
          </div>

          <FormSection titulo="Observações" />
          <FormTextarea
            label="Observações"
            placeholder="Informações adicionais..."
            {...register('observacoes')}
          />

          <FormActions
            salvando={isSubmitting}
            labelSalvar={isEdicao ? 'Salvar Alterações' : 'Criar Fornecedor'}
            onCancelar={() => navigate('/fornecedores')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx
git commit -m "refactor: FornecedorFormPage aplica design system ERP"
```

---

## Task 5: InventarioFormPage + InventarioDetalhePage

**Files:**
- Modify: `frontend/src/features/inventarios/pages/InventarioFormPage.tsx`
- Modify: `frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx`

- [ ] **Step 1: Reescrever InventarioFormPage.tsx**

```tsx
// frontend/src/features/inventarios/pages/InventarioFormPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { inventariosService } from '../services/inventariosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'

interface IniciarFormValues {
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<IniciarFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        dataRealizacao: new Date().toISOString().split('T')[0],
        descricao: '',
        observacoes: '',
      },
    })

  const onSubmit = async (values: IniciarFormValues) => {
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

  return (
    <div className="p-6 max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/inventarios"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Inventários
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Novo Inventário
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Dados do Inventário" />
          <div className="grid gap-4">
            <CampoTexto
              label="Data de Realização"
              obrigatorio
              type="date"
              erro={errors.dataRealizacao?.message}
              {...register('dataRealizacao')}
            />
            <CampoTexto
              label="Descrição"
              placeholder="Ex: Inventário mensal de abril"
              maxLength={200}
              {...register('descricao')}
            />
            <FormTextarea
              label="Observações"
              placeholder="Observações gerais..."
              {...register('observacoes')}
            />
          </div>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Iniciar Inventário"
            onCancelar={() => navigate('/inventarios')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Refatorar form inline de item em InventarioDetalhePage.tsx**

Localizar o bloco do formulário inline (seção "Adicionar Item") e substituir as classes hardcoded pelos componentes shared. Apenas o form de adição de item muda — a tabela e os botões de ação da página ficam como estão.

Encontrar:
```tsx
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Adicionar Item</p>
          <form onSubmit={handleSubmit(handleAdicionarItem)}>
            <div className="grid grid-cols-[1fr_120px_180px_auto] gap-3 items-start">
              <div>
                <select className={selectClass} {...register('ingredienteId')}>
```

Substituir a seção inteira da `<div className="bg-white ...">` do form inline por:

```tsx
      {podeEditar && emAndamento && (
        <div
          className="rounded-xl p-5 mb-4"
          style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-3.5 rounded-full shrink-0" style={{ background: '#C4870A' }} />
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.10em]"
              style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Adicionar Item
            </span>
          </div>
          <form onSubmit={handleSubmit(handleAdicionarItem)}>
            <div className="grid grid-cols-[1fr_120px_180px_auto] gap-3 items-start">
              <div>
                <SelectCampo
                  label="Ingrediente"
                  obrigatorio
                  opcoes={ingredientes.map(ing => ({
                    valor: ing.id,
                    rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                  }))}
                  {...register('ingredienteId')}
                  erro={errors.ingredienteId?.message}
                />
              </div>
              <div>
                <CampoTexto
                  label="Qtd. contada"
                  obrigatorio
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0"
                  {...register('quantidadeContada')}
                  erro={errors.quantidadeContada?.message}
                />
              </div>
              <div>
                <CampoTexto
                  label="Observação"
                  placeholder="Opcional"
                  {...register('observacoes')}
                />
              </div>
              <div className="pt-[22px]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
                >
                  <PlusIcon className="h-4 w-4" />
                  {isSubmitting ? '…' : 'Adicionar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
```

Adicionar imports necessários no topo do arquivo:
```tsx
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
```

Remover as constantes `inputClass` e `selectClass` do arquivo (não são mais usadas).

- [ ] **Step 3: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/inventarios/pages/
git commit -m "refactor: InventarioFormPage e InventarioDetalhePage aplicam design system ERP"
```

---

## Task 6: RegistrarProducaoPage

**Files:**
- Modify: `frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx`

- [ ] **Step 1: Reescrever RegistrarProducaoPage.tsx**

```tsx
// frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { producaoDiariaService } from '../services/producaoDiariaService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo, ProducaoFormValues } from '@/types/producao'

const producaoSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeProduzida: z
    .string()
    .min(1, 'Informe a quantidade.')
    .refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
  observacoes: z.string(),
})

export function RegistrarProducaoPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProducaoFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(producaoSchema) as any,
      defaultValues: {
        produtoId: '',
        data: new Date().toISOString().split('T')[0],
        quantidadeProduzida: '',
        observacoes: '',
      },
    })

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  const onSubmit = async (values: ProducaoFormValues) => {
    try {
      await producaoDiariaService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeProduzida: Number(values.quantidadeProduzida),
        observacoes: values.observacoes || null,
      })
      setToast({ tipo: 'sucesso', mensagem: 'Produção registrada com sucesso.' })
      setTimeout(() => navigate('/producao/diaria'), 1200)
    } catch (err: unknown) {
      const erros = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({ tipo: 'erro', mensagem: erros?.[0] ?? 'Erro ao registrar produção.' })
    }
  }

  return (
    <div className="p-6 max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/producao/diaria"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produção Diária
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Registrar Produção
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Dados da Produção" />
          <div className="grid gap-4">
            <SelectCampo
              label="Produto"
              obrigatorio
              opcoes={produtos.map(p => ({ valor: p.id, rotulo: p.nome }))}
              {...register('produtoId')}
              erro={errors.produtoId?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Data"
                obrigatorio
                type="date"
                {...register('data')}
                erro={errors.data?.message}
              />
              <CampoTexto
                label="Quantidade Produzida"
                obrigatorio
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Ex: 10"
                {...register('quantidadeProduzida')}
                erro={errors.quantidadeProduzida?.message}
              />
            </div>
            <FormTextarea
              label="Observações"
              placeholder="Observações (opcional)"
              rows={2}
              {...register('observacoes')}
            />
          </div>

          <div
            className="mt-4 rounded-lg px-4 py-3 text-xs"
            style={{ background: 'var(--ada-warning-bg)', border: '1px solid var(--ada-warning-border)', color: 'var(--ada-warning-text)' }}
          >
            O estoque dos ingredientes da ficha técnica será debitado automaticamente ao registrar a produção.
          </div>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Produção"
            onCancelar={() => navigate('/producao/diaria')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx
git commit -m "refactor: RegistrarProducaoPage aplica design system ERP"
```

---

## Task 7: RegistrarVendaPage

**Files:**
- Modify: `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`

- [ ] **Step 1: Reescrever RegistrarVendaPage.tsx**

```tsx
// frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { vendasDiariasService } from '../services/vendasDiariasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
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

export function RegistrarVendaPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<VendaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(vendaSchema) as any,
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
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/producao/vendas"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Vendas Diárias
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Registrar Venda
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Dados da Venda" />
          <div className="grid gap-4">
            <SelectCampo
              label="Produto"
              obrigatorio
              opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
              {...register('produtoId')}
              erro={errors.produtoId?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Data"
                obrigatorio
                type="date"
                {...register('data')}
                erro={errors.data?.message}
              />
              <CampoTexto
                label="Quantidade Vendida"
                obrigatorio
                type="number"
                step="1"
                min="1"
                placeholder="Ex: 5"
                {...register('quantidadeVendida')}
                erro={errors.quantidadeVendida?.message}
              />
            </div>
          </div>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Venda"
            onCancelar={() => navigate('/producao/vendas')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
git commit -m "refactor: RegistrarVendaPage aplica design system ERP"
```

---

## Task 8: PerdasPage — modal convertido para RHF+Zod

**Files:**
- Modify: `frontend/src/features/producao/perdas/pages/PerdasPage.tsx`

O modal de "Registrar Perda" usa estado manual e validação manual. Converter para RHF+Zod e aplicar CampoTexto/SelectCampo.

- [ ] **Step 1: Localizar e substituir o bloco do modal em PerdasPage.tsx**

Adicionar imports no topo do arquivo:
```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { Spinner } from '@/components/form/Spinner'
```

Remover o `interface FormState`, `const formVazio`, os estados `form`, `errosForm`, `salvando`, e a função `validar` e `handleSalvar`. Substituir pelo hook RHF:

```tsx
// Em vez do FormState manual, declare o schema e use useForm:
const perdaSchema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório.'),
  data: z.string().min(1, 'Data obrigatória.'),
  quantidade: z
    .string()
    .min(1, 'Quantidade obrigatória.')
    .refine(v => Number(v) > 0, 'Deve ser maior que zero.'),
  justificativa: z
    .string()
    .min(1, 'Justificativa obrigatória.')
    .max(500, 'Máximo 500 caracteres.'),
})

type PerdaFormValues = z.infer<typeof perdaSchema>
```

Dentro do componente `PerdasPage`, após os estados existentes (`perdas`, `produtos`, `loading`, etc.), adicionar:

```tsx
  const { register, handleSubmit, reset: resetForm, formState: { errors: formErrors, isSubmitting } } =
    useForm<PerdaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(perdaSchema) as any,
      defaultValues: { produtoId: '', data: hoje(), quantidade: '', justificativa: '' },
    })
```

Substituir `handleSalvar` pelo submit handler:

```tsx
  const onSubmitPerda = async (values: PerdaFormValues) => {
    try {
      await perdasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidade: Number(values.quantidade),
        justificativa: values.justificativa.trim(),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Perda registrada com sucesso.' })
      setModalAberto(false)
      resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' })
      carregar(de, ate)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0]
        ?? 'Erro ao registrar perda.'
      setToast({ tipo: 'erro', mensagem: msg })
    }
  }
```

Substituir o botão "Registrar Perda" que abre o modal para também resetar o form:
```tsx
        <button
          onClick={() => { resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' }); setModalAberto(true) }}
          ...
        >
```

Substituir o conteúdo do `{modalAberto && (` por:

```tsx
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <h2
              className="text-base font-bold mb-1"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Registrar Perda
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--ada-muted)' }}>
              Registre produtos perdidos, descartados ou danificados.
            </p>

            <form onSubmit={handleSubmit(onSubmitPerda)} className="space-y-4">
              <SelectCampo
                label="Produto"
                obrigatorio
                opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
                {...register('produtoId')}
                erro={formErrors.produtoId?.message}
              />
              <div className="grid grid-cols-2 gap-3">
                <CampoTexto
                  label="Data"
                  obrigatorio
                  type="date"
                  {...register('data')}
                  erro={formErrors.data?.message}
                />
                <CampoTexto
                  label="Quantidade (un.)"
                  obrigatorio
                  type="number"
                  step="1"
                  min="1"
                  placeholder="0"
                  {...register('quantidade')}
                  erro={formErrors.quantidade?.message}
                />
              </div>
              <FormTextarea
                label="Justificativa"
                obrigatorio
                placeholder="Descreva o motivo da perda..."
                rows={3}
                maxLength={500}
                {...register('justificativa')}
                erro={formErrors.justificativa?.message}
              />

              <div
                className="flex justify-end gap-2.5 pt-4"
                style={{ borderTop: '1px solid var(--ada-border-sub)' }}
              >
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 hover:bg-[var(--ada-bg)]"
                  style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? 'Salvando…' : 'Registrar Perda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
```

- [ ] **Step 2: Remover constante `inputClass` e estados manuais não usados**

Após a refatoração, remover do arquivo:
- `const inputClass = ...`
- `interface FormState`
- `const formVazio`
- `const [form, setForm] = useState<FormState>(formVazio)`
- `const [errosForm, setErrosForm] = useState<...>({})`
- `const [salvando, setSalvando] = useState(false)` (substituído por `isSubmitting`)
- `const validar = () => { ... }`
- `const handleSalvar = async () => { ... }`

- [ ] **Step 3: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx
git commit -m "refactor: PerdasPage converte modal para RHF+Zod com design system ERP"
```

---

## Task 9: ModalCategoria + ModalCategoriaProduto

**Files:**
- Modify: `frontend/src/features/estoque/categorias/components/ModalCategoria.tsx`
- Modify: `frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx`

Estes modais têm um único campo (`nome`). Não é necessário converter para RHF — mas precisam atualizar o visual para usar CSS vars.

- [ ] **Step 1: Reescrever ModalCategoria.tsx**

```tsx
// frontend/src/features/estoque/categorias/components/ModalCategoria.tsx
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Spinner } from '@/components/form/Spinner'
import type { Categoria } from '@/types/estoque'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(100, 'Máximo 100 caracteres.'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  categoria?: Categoria | null
  salvando: boolean
  onSalvar: (nome: string) => void
  onFechar: () => void
}

export function ModalCategoria({ categoria, salvando, onSalvar, onFechar }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { nome: categoria?.nome ?? '' },
  })

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    reset({ nome: categoria?.nome ?? '' })
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [categoria, reset])

  const onSubmit = (values: FormValues) => onSalvar(values.nome)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
      >
        <h2
          className="text-base font-bold mb-5"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {categoria ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CampoTexto
            label="Nome"
            obrigatorio
            placeholder="Ex: Laticínios"
            autoFocus
            {...register('nome')}
            ref={(el) => { inputRef.current = el; return undefined }}
            erro={errors.nome?.message}
          />

          <div
            className="flex justify-end gap-2.5 pt-5 mt-5"
            style={{ borderTop: '1px solid var(--ada-border-sub)' }}
          >
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--ada-bg)] transition-colors"
              style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
            >
              {salvando && <Spinner />}
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Nota:** O `CampoTexto` usa `forwardRef`? Verificar em `CampoTexto.tsx`. Se não usar `forwardRef`, remover o `ref` callback e usar apenas `autoFocus` no input.

- [ ] **Step 2: Verificar se CampoTexto usa forwardRef**

```bash
grep -n "forwardRef\|ref=" CasaDiAna/frontend/src/features/estoque/ingredientes/components/CampoTexto.tsx
```

Se não tiver `forwardRef`, remover o `ref` callback e manter apenas `autoFocus` no `ModalCategoria`.

- [ ] **Step 3: Reescrever ModalCategoriaProduto.tsx**

Idêntico ao `ModalCategoria`, mas para produto. Mesmo padrão:

```tsx
// frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Spinner } from '@/components/form/Spinner'
import type { CategoriaProduto } from '@/types/producao'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(100, 'Máximo 100 caracteres.'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  categoria?: CategoriaProduto | null
  salvando: boolean
  onSalvar: (nome: string) => void
  onFechar: () => void
}

export function ModalCategoriaProduto({ categoria, salvando, onSalvar, onFechar }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { nome: categoria?.nome ?? '' },
  })

  useEffect(() => {
    reset({ nome: categoria?.nome ?? '' })
  }, [categoria, reset])

  const onSubmit = (values: FormValues) => onSalvar(values.nome)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-xl)' }}
      >
        <h2
          className="text-base font-bold mb-5"
          style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {categoria ? 'Editar Categoria' : 'Nova Categoria de Produto'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CampoTexto
            label="Nome"
            obrigatorio
            placeholder="Ex: Bolos"
            autoFocus
            {...register('nome')}
            erro={errors.nome?.message}
          />

          <div
            className="flex justify-end gap-2.5 pt-5 mt-5"
            style={{ borderTop: '1px solid var(--ada-border-sub)' }}
          >
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--ada-bg)] transition-colors"
              style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
            >
              {salvando && <Spinner />}
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/estoque/categorias/components/ModalCategoria.tsx
git add CasaDiAna/frontend/src/features/producao/categorias-produto/components/ModalCategoriaProduto.tsx
git commit -m "refactor: modais de categoria aplicam design system ERP e RHF+Zod"
```

---

## Task 10: EntradaFormPage

**Files:**
- Modify: `frontend/src/features/entradas/pages/EntradaFormPage.tsx`

O mais complexo: `useFieldArray` para itens dinâmicos. Substituir `selectClass`/`inputClass` pelos componentes compartilhados.

- [ ] **Step 1: Reescrever EntradaFormPage.tsx**

```tsx
// frontend/src/features/entradas/pages/EntradaFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { entradasService } from '../services/entradasService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { Fornecedor, IngredienteResumo, EntradaFormValues } from '@/types/estoque'

const entradaSchema = z.object({
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  observacoes: z.string(),
  itens: z
    .array(
      z.object({
        ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
        quantidade: z.string().min(1).refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
        custoUnitario: z.string().min(1).refine(v => Number(v) >= 0, 'Custo deve ser ≥ 0.'),
      })
    )
    .min(1, 'Adicione pelo menos um item.'),
})

export function EntradaFormPage() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<EntradaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(entradaSchema) as any,
      defaultValues: {
        fornecedorId: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        numeroNotaFiscal: '',
        observacoes: '',
        itens: [{ ingredienteId: '', quantidade: '', custoUnitario: '' }],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  useEffect(() => {
    fornecedoresService.listar().then(setFornecedores).catch(() => {})
    ingredientesService.listar().then(setIngredientes).catch(() => {})
  }, [])

  const onSubmit = async (values: EntradaFormValues) => {
    try {
      await entradasService.registrar({
        fornecedorId: values.fornecedorId,
        dataEntrada: values.dataEntrada,
        numeroNotaFiscal: values.numeroNotaFiscal || null,
        observacoes: values.observacoes || null,
        itens: values.itens.map(item => ({
          ingredienteId: item.ingredienteId,
          quantidade: Number(item.quantidade),
          custoUnitario: Number(item.custoUnitario),
        })),
      })
      setToast({ tipo: 'sucesso', mensagem: 'Entrada registrada com sucesso.' })
      setTimeout(() => navigate('/entradas'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar entrada.' })
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/entradas"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Entradas
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        Nova Entrada de Mercadoria
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Dados da Entrada" />
          <div className="grid grid-cols-2 gap-4">
            <SelectCampo
              label="Fornecedor"
              obrigatorio
              opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
              {...register('fornecedorId')}
              erro={errors.fornecedorId?.message}
            />
            <CampoTexto
              label="Data da Entrada"
              obrigatorio
              type="date"
              {...register('dataEntrada')}
              erro={errors.dataEntrada?.message}
            />
            <CampoTexto
              label="Nota Fiscal"
              placeholder="Número da NF (opcional)"
              {...register('numeroNotaFiscal')}
            />
            <CampoTexto
              label="Observações"
              placeholder="Observações (opcional)"
              {...register('observacoes')}
            />
          </div>

          <FormSection titulo="Itens da Entrada" />

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {(errors.itens as { message?: string }).message}
            </p>
          )}

          {/* Cabeçalho da tabela de itens */}
          <div
            className="grid grid-cols-[1fr_110px_130px_36px] gap-2 px-1 mb-1.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Ingrediente</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Quantidade</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Unit. (R$)</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_110px_130px_36px] gap-2 items-start">
                <SelectCampo
                  label=""
                  opcoes={ingredientes.map(ing => ({
                    valor: ing.id,
                    rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                  }))}
                  {...register(`itens.${index}.ingredienteId`)}
                  erro={errors.itens?.[index]?.ingredienteId?.message}
                />
                <CampoTexto
                  label=""
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.000"
                  {...register(`itens.${index}.quantidade`)}
                  erro={errors.itens?.[index]?.quantidade?.message}
                />
                <CampoTexto
                  label=""
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register(`itens.${index}.custoUnitario`)}
                  erro={errors.itens?.[index]?.custoUnitario?.message}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  className="mt-0.5 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--ada-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                  title="Remover item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ ingredienteId: '', quantidade: '', custoUnitario: '' })}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#C4870A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar item
          </button>

          <FormActions
            salvando={isSubmitting}
            labelSalvar="Registrar Entrada"
            onCancelar={() => navigate('/entradas')}
          />
        </FormCard>
      </form>
    </div>
  )
}
```

**Nota:** Os campos de itens usam `label=""` para suprimir a label (o cabeçalho da tabela serve como label). Isso pode gerar um aviso de acessibilidade mas é aceitável para este layout tabular.

- [ ] **Step 2: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/entradas/pages/EntradaFormPage.tsx
git commit -m "refactor: EntradaFormPage aplica design system ERP com SelectCampo/CampoTexto"
```

---

## Task 11: FichaTecnicaPage

**Files:**
- Modify: `frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx`

- [ ] **Step 1: Reescrever FichaTecnicaPage.tsx**

```tsx
// frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { produtosService } from '../services/produtosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormCard } from '@/components/form/FormCard'
import { Spinner } from '@/components/form/Spinner'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FichaTecnica } from '@/types/producao'
import type { IngredienteResumo } from '@/types/estoque'

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

export function FichaTecnicaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [ficha, setFicha] = useState<FichaTecnica | null>(null)
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const { register, control, handleSubmit, reset, formState: { errors } } =
    useForm<FichaFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(fichaSchema) as any,
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
    setSalvando(true)
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
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" style={{ color: '#C4870A' }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/producao/produtos"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Ficha Técnica
          </h1>
          {ficha && (
            <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
              {ficha.produtoNome} · Preço:{' '}
              {ficha.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
        {ficha && ficha.custoTotal > 0 && (
          <div
            className="rounded-xl px-5 py-3 text-right"
            style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Custo Total</p>
            <p className="text-lg font-bold" style={{ color: 'var(--ada-heading)' }}>
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
        <FormCard>
          <FormSection titulo="Ingredientes" />

          {errors.itens && !Array.isArray(errors.itens) && (
            <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {(errors.itens as { message?: string }).message}
            </p>
          )}

          <div className="grid grid-cols-[1fr_160px_36px] gap-2 px-1 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Ingrediente</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ada-muted)' }}>Qtd. por unidade</span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_160px_36px] gap-2 items-start">
                <SelectCampo
                  label=""
                  opcoes={ingredientes.map(ing => ({
                    valor: ing.id,
                    rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                  }))}
                  {...register(`itens.${index}.ingredienteId`)}
                  erro={errors.itens?.[index]?.ingredienteId?.message}
                />
                <CampoTexto
                  label=""
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.000"
                  {...register(`itens.${index}.quantidadePorUnidade`)}
                  erro={errors.itens?.[index]?.quantidadePorUnidade?.message}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  className="mt-0.5 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--ada-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                  title="Remover ingrediente"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ ingredienteId: '', quantidadePorUnidade: '' })}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#C4870A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar ingrediente
          </button>

          <div
            className="flex justify-end gap-2.5 pt-5 mt-6"
            style={{ borderTop: '1px solid var(--ada-border-sub)' }}
          >
            <button
              type="button"
              onClick={() => navigate('/producao/produtos')}
              disabled={salvando}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 hover:bg-[var(--ada-bg)]"
              style={{ border: '1px solid var(--ada-border)', color: 'var(--ada-body)', background: 'var(--ada-surface)' }}
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)', boxShadow: '0 3px 10px rgba(196,135,10,0.28)' }}
            >
              {salvando && <Spinner />}
              {salvando ? 'Salvando…' : 'Salvar Ficha Técnica'}
            </button>
          </div>
        </FormCard>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check + Commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
git add CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx
git commit -m "refactor: FichaTecnicaPage aplica design system ERP com SelectCampo/CampoTexto"
```

---

## Task 12: Build final e push

- [ ] **Step 1: Build de produção para garantir zero erros**

```bash
cd CasaDiAna/frontend && npm run build
```
Esperado: build completo sem erros TypeScript ou de bundling.

- [ ] **Step 2: Push**

```bash
git push
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Componentes compartilhados criados (Task 1)
- ✅ Todos os 12 formulários refatorados (Tasks 2–11)
- ✅ Formulários manuais convertidos para RHF+Zod: PerdasPage (Task 8), ModalCategoria/Produto (Task 9)
- ✅ CSS vars em todos os formulários (sem `stone-200`/`amber-700` hardcoded)
- ✅ Seções com acento âmbar via `FormSection`
- ✅ Spinner, FormActions, FormCard, FormTextarea compartilhados

**2. Placeholder scan:** Nenhum TBD/TODO presente.

**3. Type consistency:**
- `FormActions` recebe `salvando: boolean` — todos os usos passam `isSubmitting` (RHF) ou state `salvando`
- `FormSection` recebe `titulo: string` — consistente em todos os usos
- `FormTextarea` aceita todas as props de `<textarea>` — compatível com `...register()`
- `SelectCampo` e `CampoTexto` já existem e são estáveis — sem alterações de assinatura
