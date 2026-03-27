# Ingredientes – Etapa 1: Setup + Serviço + Hooks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o projeto frontend e toda a camada de dados de Ingredientes (tipos, serviço axios, hooks), sem UI ainda.

**Architecture:** Projeto Vite React TS em `CasaDiAna/frontend/`. Axios com interceptor JWT. Zustand para auth. Custom hooks com useState + useEffect para busca de dados. Fundação compartilhada (`api.ts`, `authStore.ts`, tipos) usada por todos os módulos futuros.

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand + Axios + React Hook Form + Zod + React Router v6 + Heroicons

---

## Mapa de arquivos desta etapa

| Arquivo | Responsabilidade |
|---------|-----------------|
| `frontend/vite.config.ts` | Alias `@/` → `src/`, porta 5173 |
| `frontend/tailwind.config.ts` | Tema café (amber/stone) |
| `frontend/src/index.css` | Tailwind directives + fonte Inter |
| `frontend/src/lib/api.ts` | Instância axios + interceptor JWT |
| `frontend/src/store/authStore.ts` | Token + usuário em memória (Zustand) |
| `frontend/src/types/estoque.ts` | Todos os tipos TS do módulo estoque |
| `frontend/src/features/estoque/ingredientes/services/ingredientesService.ts` | Chamadas HTTP de Ingredientes |
| `frontend/src/features/estoque/categorias/services/categoriasService.ts` | GET /categorias (para select) |
| `frontend/src/features/estoque/unidades/hooks/useUnidadesMedida.ts` | GET /unidades-medida (para select) |
| `frontend/src/features/estoque/ingredientes/hooks/useIngredientes.ts` | Hook: listar + desativar |
| `frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts` | Hook: criar + editar |

---

## Task 1: Criar projeto Vite React TypeScript

**Files:**
- Create: `CasaDiAna/frontend/` (via npm create vite)

- [ ] **Step 1: Criar projeto**

```bash
cd CasaDiAna
npm create vite@latest frontend -- --template react-ts
```

Esperado: pasta `frontend/` com `src/`, `index.html`, `vite.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Instalar dependências base**

```bash
cd frontend
npm install
npm install axios zustand react-hook-form zod @hookform/resolvers
npm install react-router-dom
npm install @heroicons/react
```

- [ ] **Step 3: Instalar Tailwind**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Esperado: `tailwind.config.js` e `postcss.config.js` criados.

- [ ] **Step 4: Instalar tipos necessários**

```bash
npm install -D @types/node
```

- [ ] **Step 5: Verificar que o projeto sobe**

```bash
npm run dev
```

Esperado: Vite server em `http://localhost:5173` (página padrão do Vite).

- [ ] **Step 6: Commit**

```bash
git add CasaDiAna/frontend
git commit -m "chore: criar projeto frontend Vite React TS"
```

---

## Task 2: Configurar Tailwind + tema Casa di Ana

**Files:**
- Modify: `frontend/tailwind.config.js` → renomear para `tailwind.config.ts`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Substituir `tailwind.config.js` pelo arquivo de tema**

```bash
rm frontend/tailwind.config.js
```

Criar `frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Atualizar `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-stone-50 text-stone-800 antialiased;
  }
}
```

- [ ] **Step 3: Limpar `src/App.tsx` (remover boilerplate do Vite)**

```tsx
export default function App() {
  return <div className="p-8 text-brand-700 font-semibold">Casa di Ana</div>
}
```

- [ ] **Step 4: Verificar que o tema aplica**

```bash
npm run dev
```

Esperado: texto "Casa di Ana" em amber-700 no browser.

---

## Task 3: Configurar alias `@/` + estrutura de pastas

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`

- [ ] **Step 1: Atualizar `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
```

- [ ] **Step 2: Atualizar `tsconfig.json` — adicionar `paths`**

No arquivo existente, adicionar dentro de `"compilerOptions"`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 3: Criar estrutura de pastas**

```bash
mkdir -p frontend/src/lib
mkdir -p frontend/src/store
mkdir -p frontend/src/types
mkdir -p frontend/src/routes
mkdir -p frontend/src/shared/components
mkdir -p frontend/src/shared/hooks
mkdir -p frontend/src/features/estoque/ingredientes/services
mkdir -p frontend/src/features/estoque/ingredientes/hooks
mkdir -p frontend/src/features/estoque/ingredientes/pages
mkdir -p frontend/src/features/estoque/ingredientes/components
mkdir -p frontend/src/features/estoque/categorias/services
mkdir -p frontend/src/features/estoque/unidades/hooks
mkdir -p frontend/src/features/auth/pages
mkdir -p frontend/src/features/auth/services
```

- [ ] **Step 4: Verificar que alias funciona**

Em `src/App.tsx`, testar o import:

```tsx
import type { } from '@/types/estoque' // só para testar
export default function App() {
  return <div className="p-8 text-brand-700 font-semibold">Casa di Ana</div>
}
```

Rodar `npm run dev` — sem erros de TypeScript.

---

## Task 4: `src/lib/api.ts` — instância Axios com interceptor JWT

**Files:**
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Criar `src/lib/api.ts`**

```typescript
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: 'http://localhost:5130/api',
  withCredentials: true,
})

// Injeta token JWT em toda requisição
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redireciona para login quando token expirar
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat: adicionar instância axios com interceptor JWT"
```

---

## Task 5: `src/store/authStore.ts` — estado de autenticação

**Files:**
- Create: `frontend/src/store/authStore.ts`

- [ ] **Step 1: Criar `src/store/authStore.ts`**

```typescript
import { create } from 'zustand'

export interface UsuarioLogado {
  nome: string
  papel: string
}

interface AuthStore {
  token: string | null
  usuario: UsuarioLogado | null
  login: (token: string, usuario: UsuarioLogado) => void
  logout: () => void
  estaAutenticado: () => boolean
  temPapel: (...papeis: string[]) => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  usuario: null,

  login: (token, usuario) => set({ token, usuario }),

  logout: () => set({ token: null, usuario: null }),

  estaAutenticado: () => get().token !== null,

  temPapel: (...papeis) => {
    const papel = get().usuario?.papel
    return papel ? papeis.includes(papel) : false
  },
}))
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/store/authStore.ts
git commit -m "feat: adicionar authStore Zustand"
```

---

## Task 6: `src/types/estoque.ts` — tipos TypeScript

**Files:**
- Create: `frontend/src/types/estoque.ts`

- [ ] **Step 1: Criar `src/types/estoque.ts`**

```typescript
// ─── Wrapper de resposta da API ───────────────────────────────────────────────
export interface ApiResponse<T> {
  sucesso: boolean
  dados: T
  erros: string[]
}

// ─── Categoria de Ingrediente ─────────────────────────────────────────────────
export interface CategoriaIngrediente {
  id: string
  nome: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

// ─── Unidade de Medida ────────────────────────────────────────────────────────
export interface UnidadeMedida {
  id: number   // short no backend → number no TS
  codigo: string
  descricao: string
}

// ─── Ingrediente (listagem) ───────────────────────────────────────────────────
export interface IngredienteResumo {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estaBaixoDoMinimo: boolean
  ativo: boolean
}

// ─── Ingrediente (detalhe / edição) ──────────────────────────────────────────
export interface Ingrediente {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaId: string | null
  categoriaNome: string | null
  unidadeMedidaId: number
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo: number | null
  estaBaixoDoMinimo: boolean
  observacoes: string | null
  ativo: boolean
  atualizadoEm: string
}

// ─── Inputs para a API (o que enviamos) ──────────────────────────────────────
export interface CriarIngredienteInput {
  nome: string
  unidadeMedidaId: number
  estoqueMinimo: number
  codigoInterno?: string | null
  categoriaId?: string | null
  estoqueMaximo?: number | null
  observacoes?: string | null
}

export interface AtualizarIngredienteInput extends CriarIngredienteInput {
  id: string  // usado localmente; vai para a URL, não para o body
}

// ─── Campos do formulário React Hook Form (strings para inputs HTML) ──────────
export interface IngredienteFormValues {
  nome: string
  codigoInterno: string
  categoriaId: string
  unidadeMedidaId: string   // coerced → number antes de enviar
  estoqueMinimo: string     // coerced → number antes de enviar
  estoqueMaximo: string     // coerced → number | undefined
  observacoes: string
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/estoque.ts
git commit -m "feat: adicionar tipos TypeScript do módulo estoque"
```

---

## Task 7: `ingredientesService.ts` — chamadas HTTP

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/services/ingredientesService.ts`

- [ ] **Step 1: Criar o serviço**

```typescript
import api from '@/lib/api'
import type {
  ApiResponse,
  CriarIngredienteInput,
  AtualizarIngredienteInput,
  Ingrediente,
  IngredienteResumo,
} from '@/types/estoque'

const BASE = '/ingredientes'

export const ingredientesService = {
  listar: async (apenasAtivos = true): Promise<IngredienteResumo[]> => {
    const resp = await api.get<ApiResponse<IngredienteResumo[]>>(
      `${BASE}?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Ingrediente> => {
    const resp = await api.get<ApiResponse<Ingrediente>>(`${BASE}/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarIngredienteInput): Promise<Ingrediente> => {
    const resp = await api.post<ApiResponse<Ingrediente>>(BASE, input)
    return resp.data.dados
  },

  atualizar: async ({ id, ...body }: AtualizarIngredienteInput): Promise<Ingrediente> => {
    const resp = await api.put<ApiResponse<Ingrediente>>(`${BASE}/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/services/ingredientesService.ts
git commit -m "feat: adicionar ingredientesService"
```

---

## Task 8: `categoriasService.ts` + `useCategorias` — para o select do formulário

**Files:**
- Create: `frontend/src/features/estoque/categorias/services/categoriasService.ts`
- Create: `frontend/src/features/estoque/categorias/hooks/useCategorias.ts`

- [ ] **Step 1: Criar `categoriasService.ts`**

```typescript
import api from '@/lib/api'
import type { ApiResponse, CategoriaIngrediente } from '@/types/estoque'

export const categoriasService = {
  listar: async (): Promise<CategoriaIngrediente[]> => {
    const resp = await api.get<ApiResponse<CategoriaIngrediente[]>>('/categorias?apenasAtivos=true')
    return resp.data.dados
  },
}
```

- [ ] **Step 2: Criar pasta de hooks**

```bash
mkdir -p frontend/src/features/estoque/categorias/hooks
```

- [ ] **Step 3: Criar `useCategorias.ts`**

```typescript
import { useState, useEffect } from 'react'
import { categoriasService } from '../services/categoriasService'
import type { CategoriaIngrediente } from '@/types/estoque'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriasService
      .listar()
      .then(setCategorias)
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false))
  }, [])

  return { categorias, loading }
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/estoque/categorias/
git commit -m "feat: adicionar categoriasService e useCategorias"
```

---

## Task 9: `useUnidadesMedida` — para o select do formulário

**Files:**
- Create: `frontend/src/features/estoque/unidades/hooks/useUnidadesMedida.ts`

- [ ] **Step 1: Criar o hook**

```typescript
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { ApiResponse, UnidadeMedida } from '@/types/estoque'

export function useUnidadesMedida() {
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<ApiResponse<UnidadeMedida[]>>('/unidades-medida')
      .then(r => setUnidades(r.data.dados))
      .catch(() => setUnidades([]))
      .finally(() => setLoading(false))
  }, [])

  return { unidades, loading }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/unidades/
git commit -m "feat: adicionar useUnidadesMedida"
```

---

## Task 10: `useIngredientes` — listar + desativar

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/hooks/useIngredientes.ts`

- [ ] **Step 1: Criar o hook**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { ingredientesService } from '../services/ingredientesService'
import type { IngredienteResumo } from '@/types/estoque'

interface UseIngredientesOptions {
  apenasAtivos?: boolean
}

export function useIngredientes({ apenasAtivos = true }: UseIngredientesOptions = {}) {
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const dados = await ingredientesService.listar(apenasAtivos)
      setIngredientes(dados)
    } catch {
      setErro('Não foi possível carregar os ingredientes.')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivos])

  useEffect(() => {
    carregar()
  }, [carregar])

  const desativar = useCallback(async (id: string) => {
    await ingredientesService.desativar(id)
    await carregar()
  }, [carregar])

  return { ingredientes, loading, erro, recarregar: carregar, desativar }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/hooks/useIngredientes.ts
git commit -m "feat: adicionar useIngredientes hook"
```

---

## Task 11: `useIngredienteForm` — criar + editar com Zod

**Files:**
- Create: `frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts`

- [ ] **Step 1: Criar o hook**

```typescript
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ingredientesService } from '../services/ingredientesService'
import type { Ingrediente, IngredienteFormValues } from '@/types/estoque'

// ─── Schema de validação ──────────────────────────────────────────────────────
export const ingredienteSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  codigoInterno: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  categoriaId: z.string().uuid('Categoria inválida').optional().or(z.literal('')),
  unidadeMedidaId: z
    .string()
    .min(1, 'Unidade de medida é obrigatória')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Selecione uma unidade'),
  estoqueMinimo: z
    .string()
    .min(1, 'Estoque mínimo é obrigatório')
    .refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Deve ser ≥ 0'),
  estoqueMaximo: z
    .string()
    .refine(v => v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Deve ser ≥ 0')
    .optional()
    .or(z.literal('')),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
})

type IngredienteSchema = z.infer<typeof ingredienteSchema>

// ─── Defaults do formulário vazio ─────────────────────────────────────────────
const defaultValues: IngredienteFormValues = {
  nome: '',
  codigoInterno: '',
  categoriaId: '',
  unidadeMedidaId: '',
  estoqueMinimo: '',
  estoqueMaximo: '',
  observacoes: '',
}

// ─── Preencher formulário a partir do ingrediente existente (edição) ──────────
function ingredienteParaForm(ing: Ingrediente): IngredienteFormValues {
  return {
    nome: ing.nome,
    codigoInterno: ing.codigoInterno ?? '',
    categoriaId: ing.categoriaId ?? '',
    unidadeMedidaId: String(ing.unidadeMedidaId),
    estoqueMinimo: String(ing.estoqueMinimo),
    estoqueMaximo: ing.estoqueMaximo != null ? String(ing.estoqueMaximo) : '',
    observacoes: ing.observacoes ?? '',
  }
}

// ─── Converter formulário → input para a API ──────────────────────────────────
function formParaInput(values: IngredienteSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: Number(values.estoqueMinimo),
    codigoInterno: values.codigoInterno || null,
    categoriaId: values.categoriaId || null,
    estoqueMaximo: values.estoqueMaximo ? Number(values.estoqueMaximo) : null,
    observacoes: values.observacoes || null,
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────
interface UseIngredienteFormOptions {
  ingredienteExistente?: Ingrediente | null
  aoSalvar?: (ingrediente: Ingrediente) => void
}

export function useIngredienteForm({ ingredienteExistente, aoSalvar }: UseIngredienteFormOptions = {}) {
  const form = useForm<IngredienteFormValues>({
    resolver: zodResolver(ingredienteSchema),
    defaultValues: ingredienteExistente
      ? ingredienteParaForm(ingredienteExistente)
      : defaultValues,
  })

  const salvar = useCallback(
    async (values: IngredienteFormValues) => {
      const input = formParaInput(values as IngredienteSchema)
      let salvo: Ingrediente

      if (ingredienteExistente) {
        salvo = await ingredientesService.atualizar({ id: ingredienteExistente.id, ...input })
      } else {
        salvo = await ingredientesService.criar(input)
      }

      aoSalvar?.(salvo)
      return salvo
    },
    [ingredienteExistente, aoSalvar]
  )

  return { form, salvar }
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
cd frontend
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts
git commit -m "feat: adicionar useIngredienteForm com validação Zod"
```

---

## Verificação final da Etapa 1

- [ ] **Rodar o projeto e confirmar que não há erros**

```bash
cd frontend
npm run dev
```

Esperado: servidor sobe em `http://localhost:5173` sem erros no console.

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: 0 erros.

---

## Estrutura de pastas ao final desta etapa

```
CasaDiAna/frontend/src/
├── lib/
│   └── api.ts                              ✅
├── store/
│   └── authStore.ts                        ✅
├── types/
│   └── estoque.ts                          ✅
└── features/
    └── estoque/
        ├── categorias/
        │   ├── hooks/
        │   │   └── useCategorias.ts        ✅
        │   └── services/
        │       └── categoriasService.ts    ✅
        ├── ingredientes/
        │   ├── hooks/
        │   │   ├── useIngredientes.ts      ✅
        │   │   └── useIngredienteForm.ts   ✅
        │   ├── services/
        │   │   └── ingredientesService.ts  ✅
        │   ├── pages/                      (vazio — Etapa 2)
        │   └── components/                 (vazio — Etapas 2 e 3)
        └── unidades/
            └── hooks/
                └── useUnidadesMedida.ts    ✅
```

---

> **Próxima etapa:** `2026-03-27-ingredientes-etapa2-listagem.md`
> Constrói `IngredientesPage.tsx` com filtros, tabela, paginação e desativação.
