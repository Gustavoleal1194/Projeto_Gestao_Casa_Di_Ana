# 2FA Animated Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o input simples de TOTP na `LoginForm` por um painel premium animado com 6 digit boxes individuais, anel SVG de progresso, scan-line, particle burst em canvas e state machine `idle → verifying → success | failure`.

**Architecture:** `TwoFactorPanel.tsx` é um componente self-contained que recebe `tokenTemporario`, `onSuccess` e `onVoltar` como props, gerencia sua própria state machine e dois utilitários sem React: `animateValue.ts` (RAF + easeOutCubic) e `particleSystem.ts` (canvas 2D com física). A `LoginForm` substitui o seu bloco OTP atual pelo componente, passando `authService.verificarOtp` como callback. O canvas de partículas é `position: fixed z-50 pointer-events-none` para aparecer por cima de tudo.

**Tech Stack:** React 18 + TypeScript + CSS keyframes + Canvas API + requestAnimationFrame. Zero novas dependências npm.

---

## Referência visual

Antes de implementar, abrir `frontend/src/features/design_libs/design_handoff_auth2fa/auth_2fa.html` no browser e clicar nos botões "Código correto" e "Código incorreto" para ver o comportamento exato que deve ser replicado.

---

## Mapa de Arquivos

### Criar
- `frontend/src/features/auth/lib/animateValue.ts` — RAF animator puro (sem React)
- `frontend/src/features/auth/lib/particleSystem.ts` — canvas particle engine
- `frontend/src/features/auth/components/form/TwoFactorPanel.tsx` — componente principal

### Modificar
- `frontend/src/index.css` — adicionar 4 keyframes: `shake`, `scanLoop`, `dotPulse`, `pulseRing`
- `frontend/src/features/auth/components/form/LoginForm.tsx` — substituir bloco OTP por `<TwoFactorPanel>`

---

## Task 1: Keyframes CSS

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Ler o final do `index.css` para encontrar onde inserir**

```bash
powershell.exe -Command "Get-Content 'frontend/src/index.css' | Select-Object -Last 20"
```

- [ ] **Step 2: Adicionar os 4 keyframes no final de `index.css`**

Adicionar exatamente após o último `}` do arquivo:

```css
/* ─── 2FA Animated Panel ────────────────────────────────────────────────── */
@keyframes shake {
  0%,100% { transform: translateX(0); }
  10%,50%,90% { transform: translateX(-8px) rotate(-0.3deg); }
  30%,70%     { transform: translateX(8px)  rotate(0.3deg); }
}

@keyframes scanLoop {
  0%   { top: 8px;  opacity: 0; }
  5%   { opacity: 1; }
  90%  { top: 60px; opacity: 1; }
  95%  { opacity: 0; }
  100% { top: 60px; opacity: 0; }
}

@keyframes dotPulse {
  from { transform: scale(1);   opacity: 1; }
  to   { transform: scale(1.4); opacity: 0.8; }
}

@keyframes pulseRing {
  0%   { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(2.4); opacity: 0; }
}
```

- [ ] **Step 3: Verificar TypeScript (não muda TS, mas confirmar que tudo compila)**

```bash
powershell.exe -Command "Set-Location 'frontend'; npx tsc --noEmit 2>&1" | Select-Object -First 5
```

Saída esperada: nenhuma.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(css): keyframes shake, scanLoop, dotPulse, pulseRing para painel 2FA"
```

---

## Task 2: Utilitários `animateValue.ts` e `particleSystem.ts`

**Files:**
- Create: `frontend/src/features/auth/lib/animateValue.ts`
- Create: `frontend/src/features/auth/lib/particleSystem.ts`

Estes são módulos TypeScript puros — sem React, sem hooks.

- [ ] **Step 1: Criar `animateValue.ts`**

```typescript
// frontend/src/features/auth/lib/animateValue.ts
export function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void
): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      onUpdate(from + (to - from) * eased)
      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}
```

- [ ] **Step 2: Criar `particleSystem.ts`**

```typescript
// frontend/src/features/auth/lib/particleSystem.ts
interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number
  life: number
  decay: number
  color: string
  type: 'circle' | 'spark' | 'diamond'
  rot: number
  rotV: number
  gravity: number
  glow: boolean
}

export interface BurstOpts {
  colors: string[]
  speed?: number
  minR?: number
  maxR?: number
  gravity?: number
  glow?: boolean
  fastDecay?: boolean
  type?: Particle['type']
}

export interface ParticleSystem {
  burst(x: number, y: number, count: number, opts: BurstOpts): void
  startAmbient(color: string): void
  stopAmbient(): void
  destroy(): void
}

export function createParticleSystem(canvas: HTMLCanvasElement): ParticleSystem {
  const ctx = canvas.getContext('2d')!
  let parts: Particle[] = []
  let rafId = 0
  let ambientId: ReturnType<typeof setInterval> | null = null

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    parts = parts.filter(p => p.life > 0)
    for (const p of parts) {
      p.vx *= 0.96
      p.vy *= 0.96
      p.vy += p.gravity
      p.x += p.vx
      p.y += p.vy
      p.rot += p.rotV
      p.life -= p.decay

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      if (p.glow) { ctx.shadowBlur = 8; ctx.shadowColor = p.color }
      ctx.fillStyle = p.color
      ctx.strokeStyle = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)

      if (p.type === 'diamond') {
        ctx.beginPath()
        ctx.moveTo(0, -p.r * 1.4)
        ctx.lineTo(p.r * 0.8, 0)
        ctx.lineTo(0, p.r * 1.4)
        ctx.lineTo(-p.r * 0.8, 0)
        ctx.closePath()
        ctx.fill()
      } else if (p.type === 'spark') {
        ctx.lineWidth = p.r * 0.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(-p.r * 2, 0)
        ctx.lineTo(p.r * 2, 0)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)

  function spawnParticle(x: number, y: number, opts: BurstOpts, upward = false): Particle {
    const speed = opts.speed ?? 6
    return {
      x, y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed - (upward ? 1.5 : 0),
      r: Math.random() * ((opts.maxR ?? 4) - (opts.minR ?? 1.5)) + (opts.minR ?? 1.5),
      life: 1,
      decay: Math.random() * 0.018 + (opts.fastDecay ? 0.022 : 0.010),
      color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
      type: opts.type ?? 'circle',
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      gravity: opts.gravity ?? 0.08,
      glow: opts.glow ?? false,
    }
  }

  return {
    burst(x, y, count, opts) {
      for (let i = 0; i < count; i++) parts.push(spawnParticle(x, y, opts))
    },
    startAmbient(color) {
      ambientId = setInterval(() => {
        const x = Math.random() * canvas.width
        parts.push(spawnParticle(x, canvas.height, {
          colors: [color], speed: 1.5, minR: 1, maxR: 2.5,
          gravity: -0.02, glow: true,
        }, true))
      }, 120)
    },
    stopAmbient() {
      if (ambientId) { clearInterval(ambientId); ambientId = null }
    },
    destroy() {
      cancelAnimationFrame(rafId)
      if (ambientId) clearInterval(ambientId)
      parts = []
    },
  }
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
powershell.exe -Command "Set-Location 'frontend'; npx tsc --noEmit 2>&1" | Select-Object -First 10
```

Saída esperada: nenhuma.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/auth/lib/animateValue.ts frontend/src/features/auth/lib/particleSystem.ts
git commit -m "feat(auth): utilitários animateValue e particleSystem para painel 2FA"
```

---

## Task 3: `TwoFactorPanel.tsx`

**Files:**
- Create: `frontend/src/features/auth/components/form/TwoFactorPanel.tsx`

Este é o coração da feature — ~300 linhas. Leia o protótipo `auth_2fa.html` no browser antes de implementar para ter o comportamento visual em mente.

**State machine:**
```
idle → verifying → success → (onSuccess chamado após 3.2s)
idle → verifying → failure → (auto-reset para idle após 3s)
```

**Fluxo do verifying:**
1. Scan-line + progress dots iniciam imediatamente
2. Ring preenche 0→0.85 em 1200ms (concorrente com chamada API)
3. Aguarda a API retornar (se > 1200ms, ring fica em 0.85 esperando)
4. Se sucesso: ring continua 0.85→1 em 600ms, depois sequência verde
5. Se falha: ring recua 0.85→0.62 em 200ms + recolore vermelho, depois sequência vermelha

- [ ] **Step 1: Criar `TwoFactorPanel.tsx`**

```tsx
// frontend/src/features/auth/components/form/TwoFactorPanel.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { animateValue } from '../../lib/animateValue'
import { createParticleSystem, type ParticleSystem } from '../../lib/particleSystem'

type AuthState = 'idle' | 'verifying' | 'success' | 'failure'

const CIRC = 283

interface TokenResult { token: string; nome: string; papel: string }

interface Props {
  tokenTemporario: string
  verificarOtp: (codigo: string, token: string) => Promise<TokenResult>
  onSuccess: (token: string, nome: string, papel: string) => void
  onVoltar: () => void
}

function CoffeeIcon() {
  return (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function TwoFactorPanel({ tokenTemporario, verificarOtp, onSuccess, onVoltar }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [ringProgress, setRingProgress] = useState(0)
  const [ringColor, setRingColor] = useState('#D4960C')
  const [iconPhase, setIconPhase] = useState<'lock' | 'check' | 'x'>('lock')
  const [iconBg, setIconBg] = useState('rgba(255,255,255,0.04)')
  const [iconBorder, setIconBorder] = useState('rgba(255,255,255,0.10)')
  const [showScan, setShowScan] = useState(false)
  const [showDots, setShowDots] = useState(false)
  const [activeDot, setActiveDot] = useState(0)
  const [digitStyle, setDigitStyle] = useState<'idle' | 'success' | 'failure'>('idle')
  const [cardShake, setCardShake] = useState(false)
  const [pulseActive, setPulseActive] = useState(false)
  const [pulseColor, setPulseColor] = useState('#4ADE80')
  const [cardGlow, setCardGlow] = useState<'none' | 'success' | 'failure'>('none')
  const [statusText, setStatusText] = useState('')
  const [statusColor, setStatusColor] = useState('#4ADE80')
  const [resultOpen, setResultOpen] = useState(false)
  const [resultType, setResultType] = useState<'success' | 'failure' | null>(null)
  const [checkVisible, setCheckVisible] = useState(false)
  const [xVisible, setXVisible] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<ParticleSystem | null>(null)
  const dotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ringProgressRef = useRef(0)

  // Keep ref in sync for use inside async sequences (avoids stale closures)
  useEffect(() => { ringProgressRef.current = ringProgress }, [ringProgress])

  useEffect(() => {
    if (!canvasRef.current) return
    const ps = createParticleSystem(canvasRef.current)
    particleRef.current = ps
    return () => ps.destroy()
  }, [])

  useEffect(() => {
    if (authState === 'idle') {
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    }
  }, [authState])

  const stopDots = () => {
    if (dotIntervalRef.current) { clearInterval(dotIntervalRef.current); dotIntervalRef.current = null }
  }

  const startDots = () => {
    let idx = 0
    dotIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % 3
      setActiveDot(idx)
    }, 280)
  }

  const resetState = useCallback(() => {
    setDigits(['', '', '', '', '', ''])
    setAuthState('idle')
    setRingProgress(0)
    setRingColor('#D4960C')
    setIconPhase('lock')
    setIconBg('rgba(255,255,255,0.04)')
    setIconBorder('rgba(255,255,255,0.10)')
    setShowScan(false)
    setShowDots(false)
    stopDots()
    setActiveDot(0)
    setDigitStyle('idle')
    setCardShake(false)
    setPulseActive(false)
    setCardGlow('none')
    setStatusText('')
    setResultOpen(false)
    setResultType(null)
    setCheckVisible(false)
    setXVisible(false)
    particleRef.current?.stopAmbient()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fireParticles = useCallback((type: 'success' | 'failure') => {
    if (!iconRef.current || !particleRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const ps = particleRef.current

    if (type === 'success') {
      const colors = ['#D4960C', '#4ADE80', '#F0B030', '#ffffff']
      // 8-direction burst, staggered 40ms
      for (let i = 0; i < 8; i++) {
        setTimeout(() => ps.burst(cx, cy, 12, { colors, speed: 7, glow: true, gravity: 0.07 }), i * 40)
      }
      // Spark ring around icon
      for (let i = 0; i < 24; i++) {
        setTimeout(() => {
          const angle = (i / 24) * Math.PI * 2
          const r = 55
          ps.burst(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 3,
            { colors: ['#F0B030', '#4ADE80'], speed: 1.5, minR: 0.8, maxR: 2, gravity: 0.01 })
        }, i * 25)
      }
    } else {
      const colors = ['#EF4444', '#DC2626', '#FCA5A5']
      for (let i = 0; i < 12; i++) {
        setTimeout(() => ps.burst(cx, cy, 8, { colors, speed: 5, fastDecay: true, gravity: 0.12, glow: true }), i * 30)
      }
    }
  }, [])

  const runSuccess = useCallback(async (result: TokenResult) => {
    // Ring 0.85 → 1
    await animateValue(ringProgressRef.current, 1, 600, v => setRingProgress(v))
    setShowScan(false)
    setShowDots(false)
    stopDots()

    await new Promise(r => setTimeout(r, 120))
    setRingColor('#4ADE80')
    setPulseColor('#4ADE80')
    setPulseActive(true)
    setIconBg('rgba(22,163,74,0.15)')
    setIconBorder('rgba(74,222,128,0.35)')

    // Lock fades out (handled by CSS opacity transition on iconPhase)
    await new Promise(r => setTimeout(r, 80))
    setIconPhase('check')
    await new Promise(r => setTimeout(r, 50))
    setCheckVisible(true)

    await new Promise(r => setTimeout(r, 100))
    fireParticles('success')

    await new Promise(r => setTimeout(r, 100))
    setDigitStyle('success')
    setCardGlow('success')
    setStatusText('Identidade confirmada')
    setStatusColor('#4ADE80')
    particleRef.current?.startAmbient('#4ADE80')

    await new Promise(r => setTimeout(r, 600))
    setResultType('success')
    setResultOpen(true)

    await new Promise(r => setTimeout(r, 500))
    onSuccess(result.token, result.nome, result.papel)
  }, [fireParticles, onSuccess])

  const runFailure = useCallback(async () => {
    // Ring recua 0.85 → 0.62 + vira vermelho
    setRingColor('#EF4444')
    await animateValue(ringProgressRef.current, 0.62, 200, v => setRingProgress(v))
    setShowScan(false)
    setShowDots(false)
    stopDots()

    await new Promise(r => setTimeout(r, 200))
    setIconBg('rgba(239,68,68,0.12)')
    setIconBorder('rgba(252,165,165,0.30)')
    setCardShake(true)
    setTimeout(() => setCardShake(false), 420)
    setPulseColor('#EF4444')
    setPulseActive(true)

    await new Promise(r => setTimeout(r, 110))
    setIconPhase('x')
    await new Promise(r => setTimeout(r, 50))
    setXVisible(true)

    await new Promise(r => setTimeout(r, 90))
    fireParticles('failure')

    await new Promise(r => setTimeout(r, 100))
    setDigitStyle('failure')
    setCardGlow('failure')
    setStatusText('Código incorreto')
    setStatusColor('#EF4444')

    await new Promise(r => setTimeout(r, 500))
    setResultType('failure')
    setResultOpen(true)

    await new Promise(r => setTimeout(r, 3000))
    resetState()
  }, [fireParticles, resetState])

  const handleVerify = useCallback(async (code: string) => {
    setAuthState('verifying')
    setShowScan(true)
    setShowDots(true)
    startDots()

    // Preenche ring até 0.85 em 1200ms (concorrente com API)
    const minWait = animateValue(0, 0.85, 1200, v => setRingProgress(v))

    let result: TokenResult | null = null
    let failed = false
    const apiCall = verificarOtp(code, tokenTemporario)
      .then(r => { result = r })
      .catch(() => { failed = true })

    // Aguarda os dois: animação mínima + API
    await Promise.all([minWait, apiCall])

    if (!failed && result) {
      await runSuccess(result)
    } else {
      setAuthState('failure')
      await runFailure()
    }
  }, [tokenTemporario, verificarOtp, runSuccess, runFailure]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigitChange = (index: number, raw: string) => {
    if (authState !== 'idle') return
    const v = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) handleVerify(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      handleVerify(pasted)
    }
  }

  const isLocked = authState !== 'idle'

  const cardShadow = cardGlow === 'success'
    ? '0 0 0 1px rgba(74,222,128,0.20), 0 0 60px rgba(22,163,74,0.25), 0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
    : cardGlow === 'failure'
    ? '0 0 0 1px rgba(239,68,68,0.25), 0 0 60px rgba(239,68,68,0.20), 0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 0 0 1px rgba(212,150,12,0.08), 0 32px 64px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Canvas partículas — cobre a tela inteira */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 9999, width: '100vw', height: '100vh' }}
        width={typeof window !== 'undefined' ? window.innerWidth : 1440}
        height={typeof window !== 'undefined' ? window.innerHeight : 900}
      />

      {/* Card principal */}
      <div
        className={cardShake ? 'shake' : ''}
        style={{
          background: 'rgba(11,17,28,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '24px',
          padding: '44px 40px 40px',
          boxShadow: cardShadow,
          transition: 'box-shadow 500ms ease',
          textAlign: 'center',
        }}
      >
        {/* Logo mark */}
        <div className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #D4960C, #B87D0A)', boxShadow: '0 4px 12px rgba(212,150,12,0.35)' }}>
            <CoffeeIcon />
          </div>
          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
            Casa di Ana
          </span>
        </div>

        {/* Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 mb-4"
            style={{ background: 'rgba(212,150,12,0.08)', border: '1px solid rgba(212,150,12,0.25)', color: '#F0B030', fontFamily: 'Sora, system-ui, sans-serif', fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4960C' }} />
            Verificação em dois fatores
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.02em', transition: 'color 400ms' }}>
          Código de acesso
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.50)', lineHeight: 1.55 }}>
          Digite o código de 6 dígitos do app autenticador.
        </p>

        {/* Icon stage */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative" style={{ width: 100, height: 100 }}>
            {/* Anel SVG */}
            <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - ringProgress)}
                style={{ transition: 'stroke 600ms ease' }}
              />
            </svg>

            {/* Pulse rings */}
            {pulseActive && (
              <>
                <div className="absolute rounded-full pointer-events-none"
                  style={{ inset: -10, border: `1.5px solid ${pulseColor}`, animation: 'pulseRing 700ms ease-out forwards' }} />
                <div className="absolute rounded-full pointer-events-none"
                  style={{ inset: -10, border: `1px solid ${pulseColor}`, animation: 'pulseRing 700ms ease-out 100ms forwards' }} />
              </>
            )}

            {/* Inner circle */}
            <div ref={iconRef} className="absolute flex items-center justify-center rounded-full overflow-hidden"
              style={{
                inset: 14,
                background: iconBg,
                border: `1.5px solid ${iconBorder}`,
                transition: 'background 400ms ease, border-color 400ms ease',
              }}>
              {/* Scan line */}
              {showScan && (
                <div className="absolute left-2 right-2 h-[1.5px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #D4960C 30%, #F0B030 50%, #D4960C 70%, transparent 100%)',
                    boxShadow: '0 0 8px #D4960C',
                    top: 8,
                    animation: 'scanLoop 800ms linear 3 forwards',
                  }} />
              )}
              {/* Glass overlay */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />

              {/* Lock glyph */}
              <svg viewBox="0 0 24 24" fill="none" className="absolute"
                style={{
                  width: 28, height: 28,
                  opacity: iconPhase === 'lock' ? 1 : 0,
                  transform: iconPhase === 'x' ? 'scale(0.8) rotate(-10deg)' : iconPhase === 'check' ? 'scale(0.7)' : 'scale(1)',
                  transition: 'opacity 200ms ease, transform 200ms ease',
                  stroke: '#D4960C', zIndex: 1,
                }}>
                <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="1.5" />
                <path d="M8 11V7a4 4 0 018 0v4" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              {/* Check glyph */}
              <svg viewBox="0 0 100 100" fill="none" className="absolute"
                style={{
                  width: 28, height: 28,
                  opacity: iconPhase === 'check' ? 1 : 0,
                  transform: iconPhase === 'check' ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 200ms ease, transform 350ms cubic-bezier(0.34,1.4,0.64,1)',
                  zIndex: 1,
                }}>
                <path d="M22 52 L42 70 L78 30"
                  stroke="#4ADE80" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="80"
                  strokeDashoffset={checkVisible ? 0 : 80}
                  style={{ transition: checkVisible ? 'stroke-dashoffset 450ms ease' : 'none' }}
                />
              </svg>

              {/* X glyph */}
              <svg viewBox="0 0 100 100" fill="none" className="absolute"
                style={{
                  width: 28, height: 28,
                  opacity: iconPhase === 'x' ? 1 : 0,
                  transform: iconPhase === 'x' ? 'scale(1)' : 'scale(0.5)',
                  transition: 'opacity 150ms ease, transform 250ms cubic-bezier(0.34,1.4,0.64,1)',
                  zIndex: 1,
                }}>
                <path d="M28 28 L72 72 M72 28 L28 72"
                  stroke="#EF4444" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="80"
                  strokeDashoffset={xVisible ? 0 : 80}
                  style={{ transition: xVisible ? 'stroke-dashoffset 350ms ease' : 'none' }}
                />
              </svg>
            </div>
          </div>

          {/* Progress dots */}
          {showDots && (
            <div className="flex items-center gap-1.5 mt-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i === activeDot ? '#F0B030' : 'rgba(255,255,255,0.20)',
                    boxShadow: i === activeDot ? '0 0 8px #D4960C' : 'none',
                    animation: i === activeDot ? 'dotPulse 600ms ease infinite alternate' : 'none',
                  }} />
              ))}
            </div>
          )}
        </div>

        {/* Digit boxes */}
        <div className="flex gap-2.5 justify-center mb-7" onPaste={handlePaste}>
          {digits.map((d, i) => {
            const isFilled = d !== ''
            const isActive = !isLocked && digits.findIndex(x => !x) === i
            const borderColor = digitStyle === 'success' ? 'rgba(74,222,128,0.6)'
              : digitStyle === 'failure' ? 'rgba(252,165,165,0.6)'
              : isActive ? '#D4960C'
              : isFilled ? 'rgba(212,150,12,0.35)'
              : 'rgba(255,255,255,0.10)'
            const bg = digitStyle === 'success' ? 'rgba(22,163,74,0.12)'
              : digitStyle === 'failure' ? 'rgba(239,68,68,0.12)'
              : isFilled ? 'rgba(212,150,12,0.06)'
              : 'rgba(255,255,255,0.04)'
            const color = digitStyle === 'success' ? '#4ADE80'
              : digitStyle === 'failure' ? '#FCA5A5'
              : '#F0B030'
            return (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={isLocked}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="text-center font-bold outline-none disabled:cursor-not-allowed"
                style={{
                  width: 52, height: 60,
                  background: bg,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 12,
                  fontSize: 22,
                  fontFamily: 'Sora, monospace',
                  color,
                  boxShadow: isActive ? '0 0 0 3px rgba(212,150,12,0.15)' : 'none',
                  transition: `border-color 300ms ease, background 300ms ease, color 300ms ease`,
                  transitionDelay: `${i * 50}ms`,
                }}
              />
            )
          })}
        </div>

        {/* Status text */}
        <div style={{ height: 20, marginBottom: 24, overflow: 'hidden', position: 'relative' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{
              color: statusColor,
              fontFamily: 'Sora, system-ui, sans-serif',
              opacity: statusText ? 1 : 0,
              transform: statusText ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}>
            {statusText}
          </p>
        </div>

        {/* Result panel */}
        <div style={{
          maxHeight: resultOpen ? '200px' : 0,
          opacity: resultOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 500ms cubic-bezier(0.4,0,0.2,1), opacity 400ms ease',
        }}>
          {resultType === 'success' && (
            <div className="rounded-[14px] p-4 text-left mb-4"
              style={{ background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)' }}>
              <p className="text-[13px] font-bold mb-1" style={{ color: '#4ADE80', fontFamily: 'Sora, system-ui, sans-serif' }}>
                ✓ Acesso liberado
              </p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Redirecionando para o sistema…
              </p>
            </div>
          )}
          {resultType === 'failure' && (
            <div className="rounded-[14px] p-4 text-left mb-4"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-[13px] font-bold mb-1" style={{ color: '#FCA5A5', fontFamily: 'Sora, system-ui, sans-serif' }}>
                ✕ Acesso negado
              </p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Código incorreto. Aguarde para tentar novamente.
              </p>
            </div>
          )}
        </div>

        {/* Voltar */}
        {authState === 'idle' && (
          <div className="mt-2">
            <button onClick={onVoltar}
              className="text-xs transition-opacity hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              ← Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
powershell.exe -Command "Set-Location 'frontend'; npx tsc --noEmit 2>&1" | Select-Object -First 20
```

Saída esperada: nenhuma. Se houver erro de tipo, corrigir antes de prosseguir.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/components/form/TwoFactorPanel.tsx
git commit -m "feat(auth): TwoFactorPanel animado com state machine idle/verifying/success/failure"
```

---

## Task 4: Integração no `LoginForm.tsx`

**Files:**
- Modify: `frontend/src/features/auth/components/form/LoginForm.tsx`

A `LoginForm` gerencia `etapa: 'credenciais' | 'otp'`. Quando `etapa === 'otp'`, em vez do input simples, renderiza `<TwoFactorPanel>`. O lado visual muda completamente: o painel âmbar some, aparece o card escuro com glassmorphism.

- [ ] **Step 1: Ler o arquivo atual**

```bash
powershell.exe -Command "Get-Content 'frontend/src/features/auth/components/form/LoginForm.tsx'"
```

- [ ] **Step 2: Substituir `LoginForm.tsx` pelo conteúdo abaixo**

```tsx
// frontend/src/features/auth/components/form/LoginForm.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '@/store/authStore'
import { AnimatedInput } from './AnimatedInput'
import { AnimatedButton } from './AnimatedButton'
import { TwoFactorPanel } from './TwoFactorPanel'

function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

type Etapa = 'credenciais' | 'otp'

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [etapa, setEtapa] = useState<Etapa>('credenciais')
  const [tokenTemporario, setTokenTemporario] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  // Unused ref kept for potential future use — focus handled by TwoFactorPanel
  const _otpInputRef = useRef<HTMLInputElement>(null)
  void _otpInputRef

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await authService.login({ email, senha })
      if (dados.requer2Fa) {
        setTokenTemporario(dados.tokenTemporario)
        setEtapa('otp')
      } else {
        login(dados.token!, { nome: dados.nome!, papel: dados.papel! })
        navigate('/', { replace: true })
      }
    } catch (e: unknown) {
      setErro((e as Error)?.message ?? 'E-mail ou senha inválidos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const handleOtpSuccess = (token: string, nome: string, papel: string) => {
    login(token, { nome, papel })
    navigate('/', { replace: true })
  }

  const voltarParaCredenciais = () => {
    setEtapa('credenciais')
    setTokenTemporario(null)
    setErro(null)
  }

  if (etapa === 'otp' && tokenTemporario) {
    return (
      <TwoFactorPanel
        tokenTemporario={tokenTemporario}
        verificarOtp={authService.verificarOtp}
        onSuccess={handleOtpSuccess}
        onVoltar={voltarParaCredenciais}
      />
    )
  }

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo mobile */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D4960C' }}>
          <CoffeeIcon />
        </div>
        <h1 className="text-xl font-bold text-[var(--ada-heading)]" style={{ fontFamily: 'Sora, system-ui, sans-serif' }}>
          Casa di Ana
        </h1>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--ada-heading)] tracking-tight" style={{ fontFamily: 'Sora, system-ui, sans-serif' }}>
          Bem-vindo de volta
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
          Acesse com suas credenciais para continuar.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <AnimatedInput id="email" label="E-mail" type="email" value={email} onChange={setEmail}
          autoComplete="email" disabled={carregando} />
        <AnimatedInput id="senha" label="Senha" type="password" value={senha} onChange={setSenha}
          autoComplete="current-password" disabled={carregando} />

        {erro && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
            role="alert" aria-live="polite">
            {erro}
          </div>
        )}

        <AnimatedButton type="submit" carregando={carregando}>
          {carregando ? 'Verificando…' : 'Entrar no Sistema'}
        </AnimatedButton>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
powershell.exe -Command "Set-Location 'frontend'; npx tsc --noEmit 2>&1" | Select-Object -First 20
```

Saída esperada: nenhuma.

- [ ] **Step 4: Testar o fluxo manualmente**

1. Iniciar backend: `powershell.exe -Command "dotnet run --project src/CasaDiAna.API"`
2. Iniciar frontend: `powershell.exe -Command "Set-Location 'frontend'; npm run dev"`
3. Navegar para `http://localhost:5173`
4. Fazer login com uma conta que **tem 2FA ativado**
5. Confirmar que o painel escuro aparece com os 6 digit boxes
6. Digitar um código correto → verificar animação verde (scan → check → partículas → painel verde)
7. Testar com código errado → verificar animação vermelha (scan → shake → X → fragmentos → painel vermelho → reset)
8. Testar `Voltar ao login` → confirma que volta ao formulário de credenciais

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/components/form/LoginForm.tsx
git commit -m "feat(auth): LoginForm integra TwoFactorPanel animado no fluxo OTP"
```

- [ ] **Step 6: Push**

```bash
git push origin master
```

---

## Verificação Final

- [ ] Build Vite sem erros: `powershell.exe -Command "Set-Location 'frontend'; npm run build 2>&1" | Select-Object -Last 10`
- [ ] TypeScript sem erros: `powershell.exe -Command "Set-Location 'frontend'; npx tsc --noEmit 2>&1" | Select-Object -First 5`
- [ ] Fluxo sucesso funciona end-to-end com conta 2FA ativa
- [ ] Fluxo falha funciona e auto-reseta para idle
- [ ] Paste de 6 dígitos no primeiro digit box funciona
- [ ] Botão "Voltar ao login" funciona durante `idle`

---

## Self-Review

### Spec coverage

| Requisito do README | Implementado em |
|---|---|
| State machine `idle/verifying/success/failure` | `TwoFactorPanel` — `authState` |
| 6 digit boxes 52×60px | Task 3 — `.map((d, i) => <input ...>)` |
| Anel SVG com stroke-dashoffset | Task 3 — `CIRC * (1 - ringProgress)` |
| easeOutCubic via RAF | Task 2 — `animateValue.ts` |
| Scan-line com `scanLoop` keyframe | Task 1 + Task 3 — `showScan && <div animation scanLoop ...>` |
| Progress dots com `dotPulse` | Task 1 + Task 3 — `showDots && [0,1,2].map(...)` |
| Ring preenche 1800ms (sucesso) | Task 3 — `animateValue(0, 0.85, 1200) + animateValue(0.85, 1, 600)` |
| Ring parcial e recua (falha) | Task 3 — `runFailure: animateValue(ref, 0.62, 200)` |
| Recoloração amber→verde/vermelho | Task 3 — `setRingColor('#4ADE80'/'#EF4444')` + `transition: stroke 600ms` |
| Lock icon desaparece | Task 3 — `iconPhase === 'lock' ? opacity:1 : opacity:0` |
| Check icon com path draw | Task 3 — `checkVisible → strokeDashoffset 80→0 transition 450ms` |
| X icon com path draw | Task 3 — `xVisible → strokeDashoffset 80→0 transition 350ms` |
| Particle burst (canvas) | Task 2 — `particleSystem.ts` + Task 3 — `fireParticles()` |
| Ambient particles subindo (sucesso) | Task 3 — `startAmbient('#4ADE80')` |
| Pulse rings com `pulseRing` keyframe | Task 1 + Task 3 — `pulseActive && <div animation pulseRing ...>` |
| Card shake com `shake` keyframe | Task 1 + Task 3 — `cardShake ? 'shake' : ''` |
| Digit colors success/failure | Task 3 — `digitStyle` state → inline border/color |
| Card box-shadow verde/vermelho | Task 3 — `cardShadow` computed string |
| Status text (Identidade confirmada / Código incorreto) | Task 3 — `statusText` state |
| Result panel slide-down | Task 3 — `maxHeight: resultOpen ? '200px' : 0` |
| Paste de 6 dígitos | Task 3 — `handlePaste` |
| Auto-reset após falha (3s) | Task 3 — `await new Promise(r => setTimeout(r, 3000)); resetState()` |
| Navegação após sucesso (3.2s) | Task 3 — `onSuccess` chamado após `runSuccess` completa |
| Logo mark no card | Task 3 — `CoffeeIcon` + amber gradient box |
| Badge "Verificação em dois fatores" | Task 3 — `<span>Verificação...` |
| Voltar ao login | Task 3 — `authState === 'idle' && <button onClick={onVoltar}>` |
| Integração com `authService.verificarOtp` | Task 4 — `verificarOtp={authService.verificarOtp}` |

Cobertura: **100%**. Nenhum gap identificado.
