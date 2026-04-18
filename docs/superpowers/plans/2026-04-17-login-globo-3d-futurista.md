# Tela de Login Futurista com Globo 3D — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o painel esquerdo da `LoginPage` em um globo 3D dot-matrix interativo com partículas, scan line e microinterações, mantendo a lógica de autenticação intacta.

**Architecture:** Decomposição da `LoginPage` atual (270 linhas monolíticas) em unidades focadas dentro de `src/features/auth/` — `hero/` para decoração, `form/` para formulário, `hooks/` para lógica de viewport/parallax/pings, `lib/globeConfig.ts` para tokens. Globo carregado via `React.lazy` (code-split). Fallbacks cascateados para reduced-motion, sem-WebGL e mobile.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 + `cobe` (~4KB gzip, WebGL) + `framer-motion` (~45KB gzip).

**Spec de referência:** `docs/superpowers/specs/2026-04-17-login-globo-3d-futurista-design.md`

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `CasaDiAna/frontend/package.json` | Modificar | adicionar `cobe` e `framer-motion` |
| `CasaDiAna/frontend/src/features/auth/lib/globeConfig.ts` | Criar | tokens RGB do globo + coord SP |
| `CasaDiAna/frontend/src/features/auth/hooks/useHeroMode.ts` | Criar | detecta viewport, reduced-motion, WebGL |
| `CasaDiAna/frontend/src/features/auth/hooks/useCursorParallax.ts` | Criar | delta phi/theta a partir do mouse |
| `CasaDiAna/frontend/src/features/auth/hooks/useRandomPings.ts` | Criar | SP fixo + pings aleatórios a cada 2.5s |
| `CasaDiAna/frontend/src/features/auth/components/hero/BrandBlock.tsx` | Criar | logo + título + features (extração) |
| `CasaDiAna/frontend/src/features/auth/components/hero/Globe3DFallback.tsx` | Criar | skeleton pulsante para Suspense/error |
| `CasaDiAna/frontend/src/features/auth/components/hero/MobileHeroFallback.tsx` | Criar | órbitas SVG (desktop sem WebGL) |
| `CasaDiAna/frontend/src/features/auth/components/hero/ParticleField.tsx` | Criar | partículas flutuantes Framer Motion |
| `CasaDiAna/frontend/src/features/auth/components/hero/ScanLine.tsx` | Criar | barra horizontal varrendo o painel |
| `CasaDiAna/frontend/src/features/auth/components/hero/Globe3DScene.tsx` | Criar | canvas cobe + parallax + pings (lazy) |
| `CasaDiAna/frontend/src/features/auth/components/hero/LoginHeroPanel.tsx` | Criar | orquestra hero (decide modo) |
| `CasaDiAna/frontend/src/features/auth/components/form/AnimatedInput.tsx` | Criar | label flutuante + focus ring animado |
| `CasaDiAna/frontend/src/features/auth/components/form/AnimatedButton.tsx` | Criar | hover/press Framer Motion |
| `CasaDiAna/frontend/src/features/auth/components/form/LoginForm.tsx` | Criar | form extraído com lógica atual |
| `CasaDiAna/frontend/src/features/auth/pages/LoginPage.tsx` | Modificar | orquestração pura (hero + form) |

> **Nota sobre testes:** o projeto frontend não tem test runner configurado (`package.json` não lista Vitest/Jest/Playwright). Conforme Seção 10 da spec, verificação é manual via `npm run dev` + build check. Este plano segue esse padrão — não há steps de escrever/rodar testes.

> **Convenção Windows:** o projeto roda em Windows (bash no Git Bash). Os comandos `cd CasaDiAna/frontend && ...` funcionam. Em caso de erro de lock de DLL com backend rodando, parar `CasaDiAna.API` antes.

---

## Task 1: Instalar dependências `cobe` e `framer-motion`

**Files:**
- Modify: `CasaDiAna/frontend/package.json`

- [ ] **Step 1: Instalar**

```bash
cd CasaDiAna/frontend && npm install cobe@^0.6.3 framer-motion@^12.0.0
```

- [ ] **Step 2: Verificar adições no package.json**

O arquivo `CasaDiAna/frontend/package.json` agora deve incluir (na seção `dependencies`):

```json
"cobe": "^0.6.3",
"framer-motion": "^12.0.0"
```

Se as versões instaladas forem maiores, aceitar o que o `npm install` escolheu (semver compatível).

- [ ] **Step 3: Verificar tipagens**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros novos. Se surgir erro de `Cannot find module 'cobe'`, rodar `npm install` de novo; se surgir erro de tipagens da `cobe`, verificar se `node_modules/cobe/dist/index.d.ts` existe — ela exporta types nativamente, sem precisar de `@types/cobe`.

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add package.json package-lock.json
git commit -m "feat(auth): instala cobe e framer-motion para globo 3D no login"
```

---

## Task 2: Criar `globeConfig.ts` com tokens do globo

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/lib/globeConfig.ts`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p "CasaDiAna/frontend/src/features/auth/lib"
```

- [ ] **Step 2: Escrever o arquivo**

Conteúdo completo de `CasaDiAna/frontend/src/features/auth/lib/globeConfig.ts`:

```ts
// Tokens de cor e configuração do globo 3D (cobe).
// Cores em formato [r, g, b] no range [0, 1] — padrão exigido pelo cobe.

export const GLOBE_TOKENS = {
  baseColor:     [0.22, 0.60, 0.80] as [number, number, number], // cyan frio (casca do globo)
  glowColor:     [0.12, 0.35, 0.55] as [number, number, number], // cyan escuro (glow atmosférico)
  markerBrand:   [0.83, 0.59, 0.05] as [number, number, number], // âmbar Casa di Ana (todos os markers)
  dark:          1,
  diffuse:       1.2,
  mapSamples:    16000,
  mapBrightness: 6,
}

// Coordenadas [lat, lng] de São Paulo — pin fixo "base da Casa di Ana".
export const SP_LOCATION: [number, number] = [-23.5505, -46.6333]

// Velocidade de auto-rotação (incremento de phi por frame).
export const AUTO_ROTATE_SPEED = 0.003

// Intervalo de renovação dos pings aleatórios.
export const PING_REFRESH_MS = 2500

// Amplitude máxima do parallax de cursor, em radianos.
export const PARALLAX_MAX_DELTA = 0.3
```

- [ ] **Step 3: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/lib/globeConfig.ts
git commit -m "feat(auth): cria globeConfig com tokens do globo (cyan base + âmbar destaque)"
```

---

## Task 3: Criar hook `useHeroMode.ts`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/hooks/useHeroMode.ts`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p "CasaDiAna/frontend/src/features/auth/hooks"
```

- [ ] **Step 2: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/hooks/useHeroMode.ts`:

```ts
import { useEffect, useState } from 'react'

export type HeroMode =
  | 'desktop-3d'            // globo 3D completo
  | 'desktop-2d-fallback'   // desktop sem WebGL — SVG
  | 'reduced-motion'        // honra prefers-reduced-motion
  | 'hidden'                // viewport < lg (painel esquerdo some)

function webglDisponivel(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return gl !== null
  } catch {
    return false
  }
}

function calcularModo(): HeroMode {
  if (typeof window === 'undefined') return 'hidden'

  const desktop = window.matchMedia('(min-width: 1024px)').matches
  if (!desktop) return 'hidden'

  const motionReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (motionReduzido) return 'reduced-motion'

  if (!webglDisponivel()) return 'desktop-2d-fallback'

  return 'desktop-3d'
}

export function useHeroMode(): HeroMode {
  const [modo, setModo] = useState<HeroMode>(() => calcularModo())

  useEffect(() => {
    const atualizar = () => setModo(calcularModo())

    const mediaDesktop = window.matchMedia('(min-width: 1024px)')
    const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    mediaDesktop.addEventListener('change', atualizar)
    mediaMotion.addEventListener('change', atualizar)

    return () => {
      mediaDesktop.removeEventListener('change', atualizar)
      mediaMotion.removeEventListener('change', atualizar)
    }
  }, [])

  return modo
}
```

- [ ] **Step 3: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/hooks/useHeroMode.ts
git commit -m "feat(auth): hook useHeroMode decide modo do hero (viewport + WebGL + motion)"
```

---

## Task 4: Criar hook `useCursorParallax.ts`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/hooks/useCursorParallax.ts`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/hooks/useCursorParallax.ts`:

```ts
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { PARALLAX_MAX_DELTA } from '../lib/globeConfig'

export interface ParallaxDelta {
  phiOffset: number
  thetaOffset: number
}

/**
 * Retorna uma ref mutável com o offset alvo de phi/theta baseado na posição
 * do cursor dentro do elemento `containerRef`. Consumidores aplicam lerp
 * para suavizar a transição ao valor alvo.
 *
 * Honra prefers-reduced-motion — quando ativo, o offset fica sempre em zero.
 */
export function useCursorParallax(
  containerRef: RefObject<HTMLElement | null>,
): RefObject<ParallaxDelta> {
  const deltaRef = useRef<ParallaxDelta>({ phiOffset: 0, thetaOffset: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const motionReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motionReduzido) {
      deltaRef.current = { phiOffset: 0, thetaOffset: 0 }
      return
    }

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width  // 0..1
      const y = (e.clientY - rect.top) / rect.height  // 0..1
      const normX = x * 2 - 1   // -1..1
      const normY = y * 2 - 1   // -1..1

      deltaRef.current = {
        phiOffset:   normX * PARALLAX_MAX_DELTA,
        thetaOffset: normY * PARALLAX_MAX_DELTA,
      }
    }

    const handleLeave = () => {
      deltaRef.current = { phiOffset: 0, thetaOffset: 0 }
    }

    container.addEventListener('mousemove', handleMove)
    container.addEventListener('mouseleave', handleLeave)

    return () => {
      container.removeEventListener('mousemove', handleMove)
      container.removeEventListener('mouseleave', handleLeave)
    }
  }, [containerRef])

  return deltaRef
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/hooks/useCursorParallax.ts
git commit -m "feat(auth): hook useCursorParallax retorna delta phi/theta do mouse"
```

---

## Task 5: Criar hook `useRandomPings.ts`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/hooks/useRandomPings.ts`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/hooks/useRandomPings.ts`:

```ts
import { useEffect, useState } from 'react'
import { PING_REFRESH_MS, SP_LOCATION } from '../lib/globeConfig'

export interface GlobeMarker {
  location: [number, number]
  size: number
}

const PIN_SP: GlobeMarker = {
  location: SP_LOCATION,
  size: 0.1,
}

function gerarPingsAleatorios(qtd: number): GlobeMarker[] {
  const pings: GlobeMarker[] = []
  for (let i = 0; i < qtd; i++) {
    const lat = Math.random() * 120 - 60       // -60..60
    const lng = Math.random() * 360 - 180      // -180..180
    pings.push({
      location: [lat, lng],
      size: 0.04,
    })
  }
  return pings
}

/**
 * Retorna array de markers para o cobe: SP sempre incluído (size 0.1, "herói"),
 * mais 3-5 pings aleatórios (size 0.04) renovados a cada PING_REFRESH_MS.
 *
 * Limitação do cobe: todos os markers usam a mesma cor (`markerColor` global).
 * A diferenciação do SP é feita pelo tamanho, não pela cor. Cor definida em
 * globeConfig.ts como âmbar (coerência de marca).
 *
 * Se `ativo` for false, retorna apenas o pin de SP (modo reduced-motion).
 */
export function useRandomPings(ativo: boolean = true): GlobeMarker[] {
  const [markers, setMarkers] = useState<GlobeMarker[]>(() => [PIN_SP])

  useEffect(() => {
    if (!ativo) {
      setMarkers([PIN_SP])
      return
    }

    const atualizar = () => {
      const qtd = 3 + Math.floor(Math.random() * 3)  // 3..5
      setMarkers([PIN_SP, ...gerarPingsAleatorios(qtd)])
    }

    atualizar()
    const id = window.setInterval(atualizar, PING_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [ativo])

  return markers
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/hooks/useRandomPings.ts
git commit -m "feat(auth): hook useRandomPings gera SP fixo + pings aleatórios"
```

---

## Task 6: Criar `BrandBlock.tsx` (extração do conteúdo atual)

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/BrandBlock.tsx`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p "CasaDiAna/frontend/src/features/auth/components/hero"
mkdir -p "CasaDiAna/frontend/src/features/auth/components/form"
```

- [ ] **Step 2: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/BrandBlock.tsx`:

```tsx
function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function BrandBlock() {
  return (
    <>
      {/* Logo */}
      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: '#D4960C' }}
        >
          <CoffeeIcon />
        </div>
      </div>

      {/* Texto central */}
      <div className="relative z-10 space-y-6">
        <div>
          <h1
            className="text-4xl font-bold text-white leading-tight tracking-tight"
            style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Casa di Ana
          </h1>
          <p
            className="mt-3 text-base leading-relaxed"
            style={{ color: '#6B7280', fontFamily: 'DM Sans, system-ui, sans-serif' }}
          >
            Sistema de Gestão Operacional para controle de estoque, produção e vendas.
          </p>
        </div>

        <div className="space-y-3">
          {[
            'Controle completo de estoque e ingredientes',
            'Produção diária com rastreamento de perdas',
            'Relatórios financeiros e de desempenho',
          ].map(feat => (
            <div key={feat} className="flex items-center gap-3">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: '#D4960C' }}
                aria-hidden="true"
              />
              <p className="text-sm" style={{ color: '#6B7280' }}>{feat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="relative z-10">
        <p className="text-xs" style={{ color: '#374151' }}>
          © {new Date().getFullYear()} Casa di Ana — Todos os direitos reservados
        </p>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/BrandBlock.tsx
git commit -m "feat(auth): extrai BrandBlock do LoginPage"
```

---

## Task 7: Criar `Globe3DFallback.tsx`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/Globe3DFallback.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/Globe3DFallback.tsx`:

```tsx
import { motion } from 'framer-motion'

/**
 * Skeleton pulsante exibido durante o lazy load do Globe3DScene
 * ou quando ele falha em runtime (ErrorBoundary).
 */
export function Globe3DFallback() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      {/* Círculo principal pulsante */}
      <motion.div
        className="w-[400px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(212,150,12,0.08) 55%, transparent 75%)',
          filter: 'blur(2px)',
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Arco orbital estático girando */}
      <motion.div
        className="absolute w-[380px] h-[380px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 380 380" className="w-full h-full">
          <circle
            cx="190"
            cy="190"
            r="180"
            fill="none"
            stroke="rgba(56,189,248,0.25)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        </svg>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/Globe3DFallback.tsx
git commit -m "feat(auth): cria Globe3DFallback skeleton pulsante"
```

---

## Task 8: Criar `MobileHeroFallback.tsx`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/MobileHeroFallback.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/MobileHeroFallback.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Estrela {
  cx: number
  cy: number
  r: number
  delay: number
  duration: number
}

function gerarEstrelas(qtd: number): Estrela[] {
  const estrelas: Estrela[] = []
  for (let i = 0; i < qtd; i++) {
    estrelas.push({
      cx: Math.random() * 400,
      cy: Math.random() * 400,
      r: Math.random() * 1.2 + 0.4,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })
  }
  return estrelas
}

/**
 * Fallback 2D (desktop sem WebGL). Órbitas SVG concêntricas + estrelas + satélite.
 */
export function MobileHeroFallback() {
  const estrelas = useMemo(() => gerarEstrelas(20), [])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative w-[400px] h-[400px]">
        {/* Estrelas */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {estrelas.map((e, i) => (
            <motion.circle
              key={i}
              cx={e.cx}
              cy={e.cy}
              r={e.r}
              fill="rgba(56,189,248,0.6)"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: e.duration,
                repeat: Infinity,
                delay: e.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </svg>

        {/* Anel externo */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle
              cx="200" cy="200" r="190"
              fill="none"
              stroke="rgba(56,189,248,0.25)"
              strokeWidth="1"
              strokeDasharray="3 8"
            />
            {/* Satélite âmbar orbitando */}
            <circle cx="390" cy="200" r="4" fill="#D4960C" />
          </svg>
        </motion.div>

        {/* Anel médio (sentido contrário) */}
        <motion.div
          className="absolute inset-[30px]"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 340 340" className="w-full h-full">
            <circle
              cx="170" cy="170" r="160"
              fill="none"
              stroke="rgba(56,189,248,0.3)"
              strokeWidth="1"
              strokeDasharray="1 4"
            />
          </svg>
        </motion.div>

        {/* Anel interno */}
        <motion.div
          className="absolute inset-[70px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 260 260" className="w-full h-full">
            <circle
              cx="130" cy="130" r="120"
              fill="none"
              stroke="rgba(212,150,12,0.35)"
              strokeWidth="1"
            />
          </svg>
        </motion.div>

        {/* Núcleo central pulsante */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(212,150,12,0.5) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/MobileHeroFallback.tsx
git commit -m "feat(auth): cria MobileHeroFallback com órbitas SVG + estrelas"
```

---

## Task 9: Criar `ParticleField.tsx`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/ParticleField.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/ParticleField.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particula {
  left: string
  top: string
  size: number
  delay: number
  duration: number
  cor: string
}

function gerarParticulas(qtd: number): Particula[] {
  const cores = ['rgba(56,189,248,0.6)', 'rgba(212,150,12,0.5)', 'rgba(115,185,210,0.4)']
  const particulas: Particula[] = []
  for (let i = 0; i < qtd; i++) {
    particulas.push({
      left:     `${Math.random() * 100}%`,
      top:      `${Math.random() * 100}%`,
      size:     1 + Math.random() * 2.5,
      delay:    Math.random() * 8,
      duration: 6 + Math.random() * 6,
      cor:      cores[Math.floor(Math.random() * cores.length)],
    })
  }
  return particulas
}

interface ParticleFieldProps {
  ativo?: boolean
}

export function ParticleField({ ativo = true }: ParticleFieldProps) {
  const particulas = useMemo(() => gerarParticulas(24), [])

  if (!ativo) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {particulas.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full block"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.cor,
            boxShadow: `0 0 ${p.size * 2}px ${p.cor}`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/ParticleField.tsx
git commit -m "feat(auth): cria ParticleField com 24 partículas flutuantes"
```

---

## Task 10: Criar `ScanLine.tsx`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/ScanLine.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/ScanLine.tsx`:

```tsx
import { motion } from 'framer-motion'

interface ScanLineProps {
  ativo?: boolean
}

/**
 * Linha horizontal fina com glow cyan que varre o painel de cima pra baixo
 * em loop. Efeito HUD sutil.
 */
export function ScanLine({ ativo = true }: ScanLineProps) {
  if (!ativo) return null

  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        height: '2px',
        background:
          'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.5) 50%, transparent 100%)',
        boxShadow: '0 0 12px rgba(56,189,248,0.4)',
        mixBlendMode: 'screen',
        opacity: 0.4,
      }}
      initial={{ top: '0%' }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/ScanLine.tsx
git commit -m "feat(auth): cria ScanLine varrendo painel com glow cyan"
```

---

## Task 11: Criar `Globe3DScene.tsx` (canvas cobe + parallax)

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/Globe3DScene.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/Globe3DScene.tsx`:

```tsx
import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import { AUTO_ROTATE_SPEED, GLOBE_TOKENS } from '../../lib/globeConfig'
import { useCursorParallax } from '../../hooks/useCursorParallax'
import { useRandomPings } from '../../hooks/useRandomPings'

interface Globe3DSceneProps {
  interactive?: boolean  // false em reduced-motion: congela rotação e parallax
}

/**
 * Renderiza o globo 3D dot-matrix (cobe) + parallax de cursor + pings aleatórios.
 *
 * cobe recebe markers apenas na criação; para animar os pings, recriamos o globo
 * a cada refresh do hook useRandomPings (2.5s) — custo de recreate é pequeno
 * porque cobe destroy() libera o canvas WebGL imediatamente.
 *
 * Export default para casar com React.lazy() do consumidor.
 */
export default function Globe3DScene({ interactive = true }: Globe3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useCursorParallax(containerRef)
  const markers = useRandomPings(interactive)

  const phiRef = useRef(0)
  const currentPhiRef = useRef(0)
  const currentThetaRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let width = container.offsetWidth

    const onResize = () => {
      if (container) width = container.offsetWidth
    }
    window.addEventListener('resize', onResize)

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width:  width * 2,
      height: width * 2,
      phi:    0,
      theta:  0.25,
      dark:          GLOBE_TOKENS.dark,
      diffuse:       GLOBE_TOKENS.diffuse,
      mapSamples:    GLOBE_TOKENS.mapSamples,
      mapBrightness: GLOBE_TOKENS.mapBrightness,
      baseColor:     GLOBE_TOKENS.baseColor,
      markerColor:   GLOBE_TOKENS.markerBrand,
      glowColor:     GLOBE_TOKENS.glowColor,
      markers,
      onRender: (state) => {
        if (interactive && !document.hidden) {
          phiRef.current += AUTO_ROTATE_SPEED
        }
        // Lerp suave entre valor atual e alvo do parallax.
        const targetPhi   = phiRef.current + parallaxRef.current.phiOffset
        const targetTheta = 0.25 + parallaxRef.current.thetaOffset
        currentPhiRef.current   += (targetPhi   - currentPhiRef.current)   * 0.08
        currentThetaRef.current += (targetTheta - currentThetaRef.current) * 0.08

        state.phi    = currentPhiRef.current
        state.theta  = currentThetaRef.current
        state.width  = width * 2
        state.height = width * 2
      },
    })

    return () => {
      window.removeEventListener('resize', onResize)
      globe.destroy()
    }
    // Recria o globo quando markers mudam (pings renovados) ou interactive muda.
  }, [markers, interactive, parallaxRef])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Globo decorativo"
        aria-hidden="true"
        style={{
          width:      '100%',
          maxWidth:   '560px',
          aspectRatio: '1',
          opacity:    0.95,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros. Se aparecer `Cannot find module 'cobe'`, confirmar `node_modules/cobe/` existe — instalação da Task 1.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/Globe3DScene.tsx
git commit -m "feat(auth): cria Globe3DScene com canvas cobe + parallax + pings"
```

---

## Task 12: Criar `LoginHeroPanel.tsx` (orquestração)

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/hero/LoginHeroPanel.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/hero/LoginHeroPanel.tsx`:

```tsx
import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useHeroMode } from '../../hooks/useHeroMode'
import { BrandBlock } from './BrandBlock'
import { Globe3DFallback } from './Globe3DFallback'
import { MobileHeroFallback } from './MobileHeroFallback'
import { ParticleField } from './ParticleField'
import { ScanLine } from './ScanLine'

const Globe3DScene = lazy(() => import('./Globe3DScene'))

interface HeroErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}
interface HeroErrorBoundaryState {
  hasError: boolean
}

class HeroErrorBoundary extends Component<HeroErrorBoundaryProps, HeroErrorBoundaryState> {
  state: HeroErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): HeroErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error('[LoginHeroPanel] falha ao renderizar globo:', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * Painel esquerdo da tela de login. Decide entre globo 3D, fallback estático
 * 2D ou versão reduzida com base em useHeroMode. Em mobile (<lg) o componente
 * pai não renderiza este painel.
 */
export function LoginHeroPanel() {
  const modo = useHeroMode()

  return (
    <div
      className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0D1117 0%, #111827 100%)' }}
    >
      {/* Camadas decorativas em background */}
      {modo === 'desktop-3d' && (
        <>
          <HeroErrorBoundary fallback={<Globe3DFallback />}>
            <Suspense fallback={<Globe3DFallback />}>
              <Globe3DScene interactive={true} />
            </Suspense>
          </HeroErrorBoundary>
          <ParticleField ativo={true} />
          <ScanLine ativo={true} />
        </>
      )}

      {modo === 'reduced-motion' && (
        <HeroErrorBoundary fallback={<Globe3DFallback />}>
          <Suspense fallback={<Globe3DFallback />}>
            <Globe3DScene interactive={false} />
          </Suspense>
        </HeroErrorBoundary>
      )}

      {modo === 'desktop-2d-fallback' && <MobileHeroFallback />}

      {/* Conteúdo de marca em primeiro plano */}
      <BrandBlock />
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/hero/LoginHeroPanel.tsx
git commit -m "feat(auth): cria LoginHeroPanel orquestrando modos de render"
```

---

## Task 13: Criar `AnimatedInput.tsx`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/form/AnimatedInput.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/form/AnimatedInput.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useState } from 'react'

interface AnimatedInputProps {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (valor: string) => void
  autoComplete?: string
  disabled?: boolean
}

export function AnimatedInput({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  disabled,
}: AnimatedInputProps) {
  const [focused, setFocused] = useState(false)
  const flutuando = focused || value.length > 0

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        className="absolute pointer-events-none select-none font-medium"
        style={{
          left: '1rem',
          color: focused ? '#C4870A' : 'var(--ada-muted)',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          background: flutuando ? 'white' : 'transparent',
          padding: flutuando ? '0 0.375rem' : '0',
          transformOrigin: 'left center',
        }}
        animate={{
          y: flutuando ? -10 : 14,
          scale: flutuando ? 0.82 : 1,
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {label}
      </motion.label>

      <input
        id={id}
        type={type}
        name={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        spellCheck={false}
        disabled={disabled}
        className="w-full rounded-xl px-4 py-3 text-sm text-[var(--ada-heading)]
                   bg-white border border-[var(--ada-border)] outline-none
                   transition-all duration-200
                   focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20
                   disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: 'var(--shadow-xs)' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/form/AnimatedInput.tsx
git commit -m "feat(auth): cria AnimatedInput com label flutuante animada"
```

---

## Task 14: Criar `AnimatedButton.tsx`

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/form/AnimatedButton.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/form/AnimatedButton.tsx`:

```tsx
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

interface AnimatedButtonProps {
  type?: 'button' | 'submit'
  carregando?: boolean
  disabled?: boolean
  children: ReactNode
}

export function AnimatedButton({
  type = 'button',
  carregando = false,
  disabled = false,
  children,
}: AnimatedButtonProps) {
  const desabilitado = disabled || carregando

  return (
    <motion.button
      type={type}
      disabled={desabilitado}
      whileHover={desabilitado ? undefined : { scale: 1.01, y: -1 }}
      whileTap={desabilitado ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold
                 text-white mt-2 outline-none
                 focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
        boxShadow: '0 4px 12px rgba(196,135,10,0.30)',
        fontFamily: 'Sora, system-ui, sans-serif',
      }}
    >
      {carregando && <Spinner />}
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/form/AnimatedButton.tsx
git commit -m "feat(auth): cria AnimatedButton com hover/press Framer Motion"
```

---

## Task 15: Criar `LoginForm.tsx` (extração da lógica de login)

**Files:**
- Create: `CasaDiAna/frontend/src/features/auth/components/form/LoginForm.tsx`

- [ ] **Step 1: Escrever o arquivo**

Conteúdo de `CasaDiAna/frontend/src/features/auth/components/form/LoginForm.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '@/store/authStore'
import { AnimatedInput } from './AnimatedInput'
import { AnimatedButton } from './AnimatedButton'

function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LoginForm() {
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
      navigate('/', { replace: true })
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo mobile */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#D4960C' }}
        >
          <CoffeeIcon />
        </div>
        <h1
          className="text-xl font-bold text-[var(--ada-heading)]"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Casa di Ana
        </h1>
      </div>

      {/* Cabeçalho */}
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[var(--ada-heading)] tracking-tight"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Bem-vindo de volta
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
          Acesse com suas credenciais para continuar.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AnimatedInput
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          disabled={carregando}
        />
        <AnimatedInput
          id="senha"
          label="Senha"
          type="password"
          value={senha}
          onChange={setSenha}
          autoComplete="current-password"
          disabled={carregando}
        />

        {erro && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--ada-error-bg)',
              border: '1px solid var(--ada-error-border)',
              color: '#DC2626',
            }}
            role="alert"
            aria-live="polite"
          >
            {erro}
          </div>
        )}

        <AnimatedButton type="submit" carregando={carregando}>
          {carregando ? 'Entrando…' : 'Entrar no Sistema'}
        </AnimatedButton>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/components/form/LoginForm.tsx
git commit -m "feat(auth): extrai LoginForm usando AnimatedInput/AnimatedButton"
```

---

## Task 16: Refatorar `LoginPage.tsx` para usar os novos componentes

**Files:**
- Modify: `CasaDiAna/frontend/src/features/auth/pages/LoginPage.tsx` (substituir conteúdo inteiro)

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Sobrescrever `CasaDiAna/frontend/src/features/auth/pages/LoginPage.tsx` com:

```tsx
import { LoginHeroPanel } from '../components/hero/LoginHeroPanel'
import { LoginForm } from '../components/form/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#0D1117' }}>
      <LoginHeroPanel />
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: 'var(--ada-bg)' }}
      >
        <LoginForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sem erros.

- [ ] **Step 3: Build completo**

```bash
cd CasaDiAna/frontend && npm run build 2>&1 | tail -40
```

Esperado: `✓ built in Xs`. No output do Vite deve aparecer um chunk separado para o globo — algo como `dist/assets/Globe3DScene-[hash].js`. Verificar que:
- O chunk do globo está separado (não no main).
- Não há erros `Cannot resolve 'cobe'` ou `'framer-motion'`.
- Tamanho do chunk do globo < ~15KB gzip.

- [ ] **Step 4: Commit**

```bash
cd CasaDiAna/frontend
git add src/features/auth/pages/LoginPage.tsx
git commit -m "refactor(auth): LoginPage orquestra LoginHeroPanel + LoginForm"
```

---

## Task 17: Verificação manual completa

**Files:**
- Nenhum — somente verificação em `npm run dev`.

- [ ] **Step 1: Subir o dev server**

```bash
cd CasaDiAna/frontend && npm run dev
```

Acessar `http://localhost:5173/login` (ou a rota de login configurada em `AppRoutes`).

- [ ] **Step 2: Checklist de aceitação — Desktop (≥1024px, Chrome)**

- [ ] Globo dot-matrix renderiza em menos de 500ms após a página montar
- [ ] Rotação automática suave (~20s por volta completa)
- [ ] Pin de São Paulo visível em âmbar, maior que os outros pontos
- [ ] Pings secundários aparecem/somem a cada ~2.5s em âmbar (menores que SP)
- [ ] Parallax: ao mover o mouse pelo painel esquerdo, o globo inclina sutilmente
- [ ] Partículas flutuam no fundo do painel esquerdo
- [ ] Scan line passa de cima pra baixo em loop
- [ ] Inputs: label flutua pra cima ao focar/digitar
- [ ] Inputs: ring animado ao focar
- [ ] Botão escala ao hover, diminui ao pressionar
- [ ] Chrome DevTools → Performance → gravar 5s: frames consistentes ~16.7ms, sem long tasks

- [ ] **Step 3: Checklist — Mobile (DevTools → iPhone 12)**

Abrir DevTools → toggle device toolbar → iPhone 12.

- [ ] Painel esquerdo oculto (só form aparece)
- [ ] DevTools → Elements: nenhum `<canvas>` presente
- [ ] DevTools → Network → filter `JS`: nenhum chunk `Globe3DScene` foi carregado
- [ ] Form funcional
- [ ] Microinterações nos inputs/botão funcionam

- [ ] **Step 4: Checklist — Tablet (768-1023px)**

DevTools → device toolbar → iPad Mini (768px).

- [ ] Painel esquerdo oculto (comportamento correto para <lg)

- [ ] **Step 5: Checklist — `prefers-reduced-motion`**

DevTools → 3 pontinhos → Rendering → Emulate CSS media `prefers-reduced-motion: reduce`.
Recarregar página.

- [ ] Globo renderiza mas **não** rotaciona
- [ ] Sem scan line
- [ ] Sem partículas
- [ ] Parallax desligado (mover mouse não afeta globo)
- [ ] Microinterações dos inputs/botão degradadas para transições sutis
- [ ] Form funcional

- [ ] **Step 6: Checklist — WebGL desabilitado**

Abrir `chrome://flags/#disable-webgl` → Disabled → Relaunch.
Voltar à tela de login.

- [ ] `MobileHeroFallback` aparece no painel esquerdo (órbitas SVG + estrelas + satélite)
- [ ] Sem erros vermelhos no console
- [ ] Form funcional

Reabilitar WebGL após terminar.

- [ ] **Step 7: Checklist — Tab navigation**

Recarregar a página. Sem clicar em nada, pressionar `Tab`.

- [ ] Primeiro foco vai pro input de email (ou barra de URL → input, dependendo do estado do browser)
- [ ] `Shift+Tab` a partir do input de email não entra em nenhum elemento do painel esquerdo
- [ ] Focus ring visível no input focado

- [ ] **Step 8: Checklist — Aba em background**

Abrir a tela de login. Trocar para outra aba do browser. Aguardar 30s. Voltar.

- [ ] Globo não "acelerou" — continua na mesma velocidade. (Validando pausa em `document.hidden`.)

- [ ] **Step 9: Se algo falhou, abrir issue/diagnóstico antes de fechar**

Se qualquer item falhou: **não** marcar a task como completa; relatar qual falhou com screenshot ou mensagem de console e tratar antes de seguir.

- [ ] **Step 10: Commit final (se houver ajustes)**

Se durante a verificação você precisou ajustar algo (ex: posicionamento, cores, tamanhos), faça commits pequenos e focados:

```bash
git add src/features/auth/
git commit -m "fix(auth): <descrição do ajuste>"
```

---

## Checklist de Cobertura da Spec

| Seção da Spec | Task |
|---|---|
| 2. Globo dot-matrix cyan + pin SP âmbar + pings alternados | Task 2, 5, 11 |
| 2. Auto-rotação + parallax de cursor | Task 4, 11 |
| 2. Partículas flutuantes | Task 9 |
| 2. Scan line | Task 10 |
| 2. BrandBlock (logo + título + features) | Task 6 |
| 3. desktop-3d | Task 12 |
| 3. desktop-2d-fallback (sem WebGL) | Task 8, 12 |
| 3. reduced-motion | Task 12 (interactive=false) |
| 3. hidden (<lg) | Task 12, 16 (hidden lg:flex) |
| 3. Globe3DFallback (Suspense/error) | Task 7, 12 |
| 4. Tokens GLOBE_TOKENS | Task 2 |
| 5. Arquitetura de componentes | Tasks 2-16 |
| 6. Dependências cobe + framer-motion | Task 1 |
| 7. Code-split via React.lazy | Task 12 |
| 8. Acessibilidade (aria-hidden, focus, contraste) | Tasks 7-12 |
| 9. ErrorBoundary em volta do globo | Task 12 |
| 10. Verificação manual | Task 17 |
| Microinterações em inputs e botão | Tasks 13, 14, 15 |
| Pausa em document.hidden | Task 11 |
