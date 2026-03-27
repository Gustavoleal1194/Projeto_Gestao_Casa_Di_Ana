# Ingredientes – Etapa 3: Formulário Criar/Editar + LoginPage real

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `IngredienteFormPage.tsx` (criar e editar) com React Hook Form + Zod, toast de feedback, e uma LoginPage funcional que elimina de vez o hack de token do App.tsx.

**Architecture:** A página de formulário detecta o modo (criar vs editar) pelo parâmetro `:id` na rota. No modo edição, carrega o ingrediente via `ingredientesService.obterPorId` antes de renderizar o form. O hook `useIngredienteForm` (Etapa 1) cuida da validação e do envio. A LoginPage chama `POST /api/auth/login`, salva o token no `authStore` e redireciona — sem hack, sem estado hardcoded.

**Pre-requisitos:** Etapas 1 e 2 concluídas. `App.tsx` **não deve ter nenhum `useEffect` de login de teste**.

---

## Mapa de arquivos desta etapa

| Arquivo | Responsabilidade |
|---------|-----------------|
| `ingredientes/components/CampoTexto.tsx` | Input com label, erro e asterisco |
| `ingredientes/components/SelectCampo.tsx` | Select com label e erro |
| `ingredientes/components/Toast.tsx` | Notificação flutuante sucesso/erro |
| `ingredientes/pages/IngredienteFormPage.tsx` | Página criar/editar (orquestra tudo) |
| `auth/services/authService.ts` | Chama `POST /api/auth/login` |
| `auth/pages/LoginPage.tsx` | Substitui o placeholder da Etapa 2 |
| `routes/AppRoutes.tsx` | Adiciona rotas `/novo` e `/:id/editar` |
| `App.tsx` | Verificar: apenas `<AppRoutes />`, sem hack |

---

## Task 1: Componentes locais de formulário

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/components/CampoTexto.tsx`
- Create: `frontend/src/features/estoque/ingredientes/components/SelectCampo.tsx`

- [ ] **Step 1: Criar `CampoTexto.tsx`**

```tsx
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
  sufixo?: string   // ex: "KG", "L" — exibido dentro do campo
}

export function CampoTexto({ label, erro, obrigatorio, sufixo, className, ...props }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                      ${erro ? 'border-red-300 bg-red-50' : 'border-stone-200'}
                      ${props.disabled ? 'bg-stone-50 cursor-not-allowed text-stone-400' : ''}
                      ${sufixo ? 'pr-12' : ''}
                      ${className ?? ''}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium pointer-events-none">
            {sufixo}
          </span>
        )}
      </div>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Criar `SelectCampo.tsx`**

```tsx
import type { SelectHTMLAttributes } from 'react'

interface Opcao {
  valor: string | number
  rotulo: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
  opcoes: Opcao[]
  placeholderOpcao?: string
}

export function SelectCampo({
  label,
  erro,
  obrigatorio,
  opcoes,
  placeholderOpcao = 'Selecione...',
  ...props
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        {...props}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                    ${erro ? 'border-red-300 bg-red-50' : 'border-stone-200'}
                    ${props.disabled ? 'bg-stone-50 cursor-not-allowed text-stone-400' : ''}`}
      >
        <option value="">{placeholderOpcao}</option>
        {opcoes.map(op => (
          <option key={op.valor} value={op.valor}>
            {op.rotulo}
          </option>
        ))}
      </select>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/components/CampoTexto.tsx
git add frontend/src/features/estoque/ingredientes/components/SelectCampo.tsx
git commit -m "feat: adicionar CampoTexto e SelectCampo"
```

---

## Task 2: Componente `Toast`

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/components/Toast.tsx`

- [ ] **Step 1: Criar `Toast.tsx`**

```tsx
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface Props {
  tipo: 'sucesso' | 'erro'
  mensagem: string
  onFechar: () => void
}

const estilos = {
  sucesso: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icone: <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />,
  },
  erro: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icone: <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />,
  },
}

export function Toast({ tipo, mensagem, onFechar }: Props) {
  const { container, icone } = estilos[tipo]

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 border rounded-xl
                     px-4 py-3 shadow-lg max-w-sm animate-in fade-in slide-in-from-top-2
                     ${container}`}>
      {icone}
      <p className="text-sm font-medium flex-1">{mensagem}</p>
      <button onClick={onFechar} className="text-current opacity-60 hover:opacity-100">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
```

> **Nota:** `animate-in`, `fade-in`, `slide-in-from-top-2` exigem o plugin `tailwindcss-animate`.
> Se não quiser instalar, remova essas classes — o toast funcionará sem animação.
> Para instalar: `npm install -D tailwindcss-animate` e adicionar `plugins: [require('tailwindcss-animate')]` no `tailwind.config.ts`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/components/Toast.tsx
git commit -m "feat: adicionar componente Toast"
```

---

## Task 3: `IngredienteFormPage.tsx` — página de criar e editar

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

- [ ] **Step 1: Criar a página**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { useIngredienteForm } from '../hooks/useIngredienteForm'
import { ingredientesService } from '../services/ingredientesService'
import { useCategorias } from '@/features/estoque/categorias/hooks/useCategorias'
import { useUnidadesMedida } from '@/features/estoque/unidades/hooks/useUnidadesMedida'
import { CampoTexto } from '../components/CampoTexto'
import { SelectCampo } from '../components/SelectCampo'
import { Toast } from '../components/Toast'
import type { Ingrediente, IngredienteFormValues } from '@/types/estoque'

// ─── Spinner inline ───────────────────────────────────────────────────────────
function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ─── Separador de seção ───────────────────────────────────────────────────────
function SecaoFormulario({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-4">
      <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest whitespace-nowrap">
        {titulo}
      </span>
      <div className="flex-1 border-t border-stone-100" />
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function IngredienteFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const modoEdicao = !!id

  // ─── Carregar ingrediente existente (edição) ─────────────────────────────
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

  // ─── Selects de apoio ─────────────────────────────────────────────────────
  const { categorias } = useCategorias()
  const { unidades } = useUnidadesMedida()

  // ─── Unidade selecionada (para exibir sufixo no campo de estoque) ─────────
  const [unidadeAtual, setUnidadeAtual] = useState('')

  // ─── Form + salvamento ────────────────────────────────────────────────────
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const fecharToast = useCallback(() => setToast(null), [])

  const { form, salvar } = useIngredienteForm({
    ingredienteExistente: ingrediente,
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form

  // Atualizar sufixo ao mudar unidade
  const unidadeSelecionadaId = watch('unidadeMedidaId')
  useEffect(() => {
    const unidade = unidades.find(u => String(u.id) === unidadeSelecionadaId)
    setUnidadeAtual(unidade?.codigo ?? '')
  }, [unidadeSelecionadaId, unidades])

  const onSubmit = handleSubmit(async (values: IngredienteFormValues) => {
    setSalvando(true)
    try {
      await salvar(values)
      setToast({ tipo: 'sucesso', mensagem: 'Ingrediente salvo com sucesso!' })
      setTimeout(() => navigate('/estoque/ingredientes'), 1500)
    } catch (e: any) {
      const erros: string[] | undefined = e?.response?.data?.erros
      setToast({
        tipo: 'erro',
        mensagem: erros?.length ? erros.join(' ') : 'Erro ao salvar ingrediente.',
      })
    } finally {
      setSalvando(false)
    }
  })

  // ─── Estados de carregamento / erro no modo edição ───────────────────────
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {erroCarregamento}
        </div>
        <Link to="/estoque/ingredientes" className="mt-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700">
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar para Ingredientes
        </Link>
      </div>
    )
  }

  // ─── Render do formulário ─────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl">
      {/* Toast de feedback */}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={fecharToast} />}

      {/* Breadcrumb */}
      <Link
        to="/estoque/ingredientes"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Ingredientes
      </Link>

      {/* Título */}
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {modoEdicao ? `Editar: ${ingrediente?.nome ?? ''}` : 'Novo Ingrediente'}
      </h1>

      {/* Card do formulário */}
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6">

        {/* ── Identificação ── */}
        <SecaoFormulario titulo="Identificação" />
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

        {/* ── Classificação ── */}
        <SecaoFormulario titulo="Classificação" />
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

        {/* ── Controle de Estoque ── */}
        <SecaoFormulario titulo="Controle de Estoque" />
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

        {/* ── Observações ── */}
        <SecaoFormulario titulo="Observações" />
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Observações
          </label>
          <textarea
            rows={3}
            placeholder="Informações adicionais sobre este ingrediente..."
            {...register('observacoes')}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none
                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                        ${errors.observacoes ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}
          />
          {errors.observacoes && (
            <p className="mt-1 text-xs text-red-600">{errors.observacoes.message}</p>
          )}
        </div>

        {/* ── Rodapé ── */}
        <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-stone-100">
          <button
            type="button"
            onClick={() => navigate('/estoque/ingredientes')}
            disabled={salvando}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600
                       hover:bg-stone-50 disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-700 hover:bg-amber-800
                       text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {salvando && <Spinner />}
            {salvando ? 'Salvando...' : 'Salvar Ingrediente'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx
git commit -m "feat: adicionar IngredienteFormPage com React Hook Form + Zod"
```

---

## Task 4: `LoginPage.tsx` funcional — substitui o placeholder

**Files:**
- Create: `frontend/src/features/auth/services/authService.ts`
- Modify: `frontend/src/features/auth/pages/LoginPage.tsx`

- [ ] **Step 1: Criar `authService.ts`**

```typescript
import axios from 'axios'
import type { ApiResponse } from '@/types/estoque'

interface LoginInput {
  email: string
  senha: string
}

interface TokenDto {
  token: string
  nome: string
  papel: string
}

// Chamada direta (sem interceptor — o usuário ainda não tem token)
export const authService = {
  login: async (input: LoginInput): Promise<TokenDto> => {
    const resp = await axios.post<ApiResponse<TokenDto>>(
      'http://localhost:5130/api/auth/login',
      input
    )
    if (!resp.data.sucesso) {
      throw new Error(resp.data.erros?.[0] ?? 'Credenciais inválidas.')
    }
    return resp.data.dados
  },
}
```

- [ ] **Step 2: Substituir `LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '@/store/authStore'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.login({ email, senha })
      login(dados.token, { nome: dados.nome, papel: dados.papel })
      navigate('/estoque/ingredientes', { replace: true })
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-amber-700 text-white text-2xl mb-4">
            ☕
          </div>
          <h1 className="text-2xl font-semibold text-stone-800">Casa di Ana</h1>
          <p className="text-stone-500 text-sm mt-1">Sistema de Gestão</p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800
                       text-white rounded-lg py-2.5 text-sm font-medium transition-colors
                       disabled:opacity-50 mt-2"
          >
            {carregando && <Spinner />}
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/
git commit -m "feat: adicionar LoginPage funcional com authService"
```

---

## Task 5: Atualizar `AppRoutes.tsx` com todas as rotas de ingredientes

**Files:**
- Modify: `frontend/src/routes/AppRoutes.tsx`

- [ ] **Step 1: Substituir `AppRoutes.tsx` completo**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { IngredientesPage } from '@/features/estoque/ingredientes/pages/IngredientesPage'
import { IngredienteFormPage } from '@/features/estoque/ingredientes/pages/IngredienteFormPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ingredientes */}
        <Route path="/estoque/ingredientes" element={<IngredientesPage />} />
        <Route path="/estoque/ingredientes/novo" element={<IngredienteFormPage />} />
        <Route path="/estoque/ingredientes/:id/editar" element={<IngredienteFormPage />} />

        {/* Raiz → Ingredientes */}
        <Route path="/" element={<Navigate to="/estoque/ingredientes" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/estoque/ingredientes" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/routes/AppRoutes.tsx
git commit -m "feat: adicionar rotas do formulário de ingredientes"
```

---

## Task 6: Verificar e limpar `App.tsx` — remover qualquer hack

**Files:**
- Verify/Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Garantir que `App.tsx` está limpo**

O arquivo deve ter **exatamente** este conteúdo — nenhum `useEffect`, nenhum `login`, nenhum token hardcoded:

```tsx
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return <AppRoutes />
}
```

Se houver qualquer resíduo do hack de teste (importação de `useAuthStore`, `useEffect`, `login('...')`), remova agora.

- [ ] **Step 2: Verificar TypeScript**

```bash
cd frontend
npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "chore: garantir App.tsx limpo sem hacks de teste"
```

---

## Task 7: Teste integrado completo (criar + editar + desativar)

Com o backend rodando (`dotnet run --project src/CasaDiAna.API`):

- [ ] **Step 1: Testar fluxo de login**

Acessar `http://localhost:5173/login`.
Preencher e-mail e senha de um usuário cadastrado no seed.
Esperado: redirecionar para `/estoque/ingredientes` e listar os ingredientes.

- [ ] **Step 2: Testar criar ingrediente**

Clicar em "Novo Ingrediente".
Preencher todos os campos obrigatórios.
Clicar em "Salvar Ingrediente".
Esperado: toast verde "Ingrediente salvo com sucesso!" e redirecionamento para a listagem com o novo item.

- [ ] **Step 3: Testar validação do formulário**

Clicar em "Novo Ingrediente" sem preencher nada.
Clicar em "Salvar".
Esperado: mensagens de erro embaixo dos campos obrigatórios, sem enviar para a API.

- [ ] **Step 4: Testar editar ingrediente**

Na listagem, clicar no ícone de lápis de um ingrediente.
Verificar que o formulário carrega com os dados pré-preenchidos.
Alterar o nome e salvar.
Esperado: toast verde e listagem atualizada.

- [ ] **Step 5: Testar desativar ingrediente**

Clicar no ícone de lixeira.
Verificar que o modal de confirmação aparece com o nome correto.
Clicar em "Desativar".
Esperado: modal fecha e ingrediente some da lista.

- [ ] **Step 6: Testar expiração de token**

Limpar o estado do browser (F5 força reload → token em memória é perdido).
Tentar acessar `/estoque/ingredientes`.
Esperado: API retorna 401 → interceptor redireciona para `/login`.

- [ ] **Step 7: Commit final da etapa**

```bash
git add .
git commit -m "feat: módulo Ingredientes completo — listagem, formulário e login"
```

---

## Estrutura final das três etapas

```
CasaDiAna/frontend/src/
├── App.tsx                              ✅ limpo — só <AppRoutes />
├── lib/api.ts                           ✅ Etapa 1
├── store/authStore.ts                   ✅ Etapa 1
├── types/estoque.ts                     ✅ Etapa 1
├── routes/AppRoutes.tsx                 ✅ Etapa 3
└── features/
    ├── auth/
    │   ├── pages/LoginPage.tsx          ✅ Etapa 3 (funcional)
    │   └── services/authService.ts     ✅ Etapa 3
    └── estoque/
        ├── categorias/
        │   ├── hooks/useCategorias.ts   ✅ Etapa 1
        │   └── services/               ✅ Etapa 1
        ├── unidades/
        │   └── hooks/useUnidadesMedida ✅ Etapa 1
        └── ingredientes/
            ├── components/
            │   ├── FiltrosIngredientes  ✅ Etapa 2
            │   ├── TabelaIngredientes   ✅ Etapa 2
            │   ├── ModalDesativar       ✅ Etapa 2
            │   ├── Paginacao            ✅ Etapa 2
            │   ├── CampoTexto           ✅ Etapa 3
            │   ├── SelectCampo          ✅ Etapa 3
            │   └── Toast               ✅ Etapa 3
            ├── hooks/
            │   ├── useIngredientes      ✅ Etapa 1
            │   └── useIngredienteForm   ✅ Etapa 1
            ├── pages/
            │   ├── IngredientesPage     ✅ Etapa 2
            │   └── IngredienteFormPage  ✅ Etapa 3
            └── services/
                └── ingredientesService  ✅ Etapa 1
```
