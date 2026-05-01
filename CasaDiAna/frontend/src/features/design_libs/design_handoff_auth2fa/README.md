# Handoff: Autenticação 2FA — Animações de Sucesso & Negação

## Overview

Duas animações premium de feedback para a tela de verificação em dois fatores do ERP **Casa di Ana**:

1. **Sucesso** — código correto: scan → anel verde → checkmark → burst de partículas → painel de acesso liberado
2. **Falha** — código incorreto: scan → anel vermelho → shake → X → fragmentos → painel de tentativa bloqueada

## Sobre os arquivos de design

`auth_2fa.html` é um **protótipo interativo de alta fidelidade** — visual e comportamento finais, prontos para referenciar pixel-a-pixel. **Não é para ser copiado diretamente para produção.** A tarefa é recriar esses componentes no codebase existente da Casa di Ana (React 18 + TypeScript + Vite + Tailwind 4).

## Fidelidade

**High-fidelity.** Cores, tipografia, espaçamento, curvas de animação e timings são finais. Recriar exatamente.

---

## Componentes a implementar

### `TwoFactorAuth` — página/modal de verificação 2FA

**Arquivo sugerido:** `src/features/auth/pages/TwoFactorAuthPage.tsx`  
(ou como modal em `src/features/auth/components/TwoFactorModal.tsx`)

### Estado da máquina

```typescript
type AuthState =
  | 'idle'       // aguardando input
  | 'verifying'  // animação de scan + anel preenchendo
  | 'success'    // checkmark + partículas + painel verde
  | 'failure'    // shake + X + fragmentos + painel vermelho
```

---

## Layout (420px largura máxima, centralizado)

```
┌────────────────────────────────────────────┐
│  [logo mark 34px]  Casa di Ana             │
│                                            │
│  [BADGE] Verificação em dois fatores       │
│                                            │
│  h1: "Código de acesso"                    │
│  sub: "Digite o código de 6 dígitos…"      │
│                                            │
│         [ICON STAGE 100×100px]             │
│    ┌── ring SVG (stroke-dashoffset) ──┐    │
│    │   [inner circle 72px]           │    │
│    │     scan-line (animada)         │    │
│    │     lock / check / X (glyph)    │    │
│    └─────────────────────────────────┘    │
│                                            │
│  [progress dots · 3 pontos piscando]       │
│                                            │
│  [  4  ] [  8  ] [  2  ] [  7  ] [  0  ] [  9  ]  │
│        (6 digit boxes 52×60px)             │
│                                            │
│  [status text — Verificando… / sucesso…]   │
│                                            │
│  [result panel — slide down quando abrir]  │
└────────────────────────────────────────────┘
```

---

## Tokens de design

| Token             | Valor                                        |
|-------------------|----------------------------------------------|
| Brand amber       | `#D4960C` / `#B87D0A` / `#F0B030`            |
| Success green     | `#16A34A` / `#4ADE80`                        |
| Danger red        | `#EF4444` / `#DC2626` / `#FCA5A5`            |
| Card bg           | `rgba(11,17,28,0.80)` + `backdrop-filter: blur(24px)` |
| Card border       | `rgba(255,255,255,0.07)`                     |
| Card shadow       | `0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,150,12,0.08)` |
| Card border-radius | `24px`                                      |
| Font display      | `Sora`                                       |
| Font body         | `DM Sans`                                    |
| Ring circumference | `283` (circle r=45, `2π×45 ≈ 283`)          |
| Digit box         | `52×60px`, `border-radius: 12px`             |
| Page bg           | `#05080F` + grid âmbar `opacity: 0.04`       |

---

## Animações — sequência detalhada

### Constantes

```typescript
const RING_CIRC = 283; // stroke-dasharray do anel SVG

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

function animateValue(
  from: number, to: number, duration: number,
  onUpdate: (v: number) => void
): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now();
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1);
      onUpdate(from + (to - from) * easeOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}
```

---

### ✅ Sucesso — timings

| T      | Duração | Elemento / ação |
|--------|---------|-----------------|
| 0ms    | —       | `state = 'verifying'`, scan-line inicia (`animation: scanLoop 800ms linear 3`) |
| 0ms    | 1800ms  | Anel preenche `strokeDashoffset: 283 → 0`, cor `#D4960C`, `easeOutCubic` |
| 1800ms | —       | Scan-line para, progress dots somem |
| 1920ms | 400ms   | Anel recolore para `#4ADE80`, ring `strokeDashoffset` mantém `0` |
| 1920ms | —       | Pulse ring 1: `scale(0.8) → scale(2.2)`, `opacity: 0.6 → 0`, 700ms |
| 2000ms | —       | Pulse ring 2: `scale(0.8) → scale(2.8)`, `opacity: 0.3 → 0`, 700ms |
| 1920ms | 200ms   | `icon-inner` bg → `rgba(22,163,74,0.15)`, border → `rgba(74,222,128,0.35)` |
| 1920ms | 200ms   | Lock icon: `opacity: 1 → 0`, `scale(1) → scale(0.7)` |
| 2000ms | 400ms   | Check icon: `scale(0.5) → scale(1)` + `strokeDashoffset: 80 → 0` (450ms) |
| 2100ms | 80ms×8  | Particle burst: 8 direções × 12 partículas cada, stagger 40ms |
| 2100ms | 25ms×24 | Anel de sparks: 24 posições, stagger 25ms |
| 2200ms | —       | Dígitos: `border-color` verde, stagger 50ms × 6 |
| 2200ms | —       | Card: `box-shadow` verde, `background` ambient verde |
| 2200ms | —       | Status text: "Identidade confirmada" |
| 2800ms | 500ms   | Result panel: `max-height: 0 → 200px`, `opacity: 0 → 1` |
| 2800ms | 4000ms  | Partículas ambientes subindo continuamente |

---

### ❌ Falha — timings

| T      | Duração | Elemento / ação |
|--------|---------|-----------------|
| 0ms    | —       | `state = 'verifying'`, scan-line inicia |
| 0ms    | 1200ms  | Anel preenche `0 → 0.85` (`strokeDashoffset: 283 → 42`), cor `#D4960C` |
| 1200ms | 200ms   | Anel **recua** `0.85 → 0.62` (`42 → 107`), cor → `#EF4444` |
| 1200ms | —       | Scan para, progress dots somem |
| 1400ms | —       | `icon-inner` bg → `rgba(239,68,68,0.12)`, border → `rgba(252,165,165,0.30)` |
| 1400ms | —       | Card shake: `animation: shake 420ms cubic-bezier(0.36,0.07,0.19,0.97)` |
| 1400ms | —       | Pulse rings vermelhos: mesmos timings que sucesso |
| 1450ms | 200ms   | Lock: `opacity → 0`, `rotate(-10deg) scale(0.8)` |
| 1510ms | —       | X icon: `scale(0.5) → scale(1)` pop-in |
| 1560ms | 350ms   | X path: `strokeDashoffset: 80 → 0` |
| 1600ms | 30ms×12 | Fragmentos vermelhos: 12 ângulos × 8 partículas, stagger 30ms |
| 1600ms | —       | 16 sparks vermelhos em anel |
| 1700ms | —       | Dígitos → vermelho, stagger 50ms × 6 |
| 1700ms | —       | Card `box-shadow` vermelho, ambient vermelho |
| 1700ms | —       | Status text: "Código incorreto" |
| 2200ms | 500ms   | Result panel abre (danger variant) |

---

## Keyframes CSS a adicionar em `index.css`

```css
@keyframes shake {
  0%,100% { transform: translateX(0); }
  10%,50%,90% { transform: translateX(-8px) rotate(-0.3deg); }
  30%,70%     { transform: translateX(8px) rotate(0.3deg); }
}

@keyframes scanLoop {
  0%   { top: 8px;  opacity: 0; }
  5%   { opacity: 1; }
  90%  { top: 60px; opacity: 1; }
  95%  { opacity: 0; }
  100% { top: 60px; opacity: 0; }
}

@keyframes dotPulse {
  from { transform: scale(1); opacity: 1; }
  to   { transform: scale(1.4); opacity: 0.8; }
}
```

> Os keyframes `cardIn`, `fadeUp`, `circleDraw`, `checkDraw`, `sparkle`, `float`, `ripple` já estão em `index.css` — verificar e reaproveitar.

---

## Sistema de partículas

O protótipo usa um `<canvas>` com `requestAnimationFrame` para as partículas. Em produção, há três opções:

**Opção A (recomendada) — canvas próprio:**
```typescript
// Criar um <canvas> fixed/absolute z-index alto, pointer-events:none
// Implementar a classe Particle do protótipo diretamente
// Vantagem: zero dependências, comportamento idêntico ao protótipo
```

**Opção B — `canvas-confetti` (npm):**
```bash
npm install canvas-confetti
```
```typescript
import confetti from 'canvas-confetti';
// Sucesso:
confetti({ particleCount: 120, spread: 80, origin: { y: 0.45 }, colors: ['#D4960C','#4ADE80','#F0B030'] });
// Falha:
confetti({ particleCount: 80, spread: 60, origin: { y: 0.45 }, colors: ['#EF4444','#FCA5A5'], scalar: 0.9 });
```

**Opção C — `framer-motion` (se já instalado):**
Animar `motion.div` com `initial/animate/exit` para os elementos principais; pular partículas canvas ou usar `canvas-confetti` para o burst.

---

## Ring SVG

```tsx
// Anel de progresso usando stroke-dashoffset
const CIRC = 283; // 2π × 45

<svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
  {/* Track */}
  <circle cx="50" cy="50" r="45" fill="none"
    stroke="rgba(255,255,255,0.06)" strokeWidth="2"/>
  {/* Fill */}
  <circle cx="50" cy="50" r="45" fill="none"
    stroke={ringColor}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeDasharray={CIRC}
    strokeDashoffset={CIRC * (1 - ringProgress)}
    style={{ transition: 'stroke 300ms ease' }}
  />
</svg>
```

`ringProgress` vai de `0` a `1` via `animateValue()`.

---

## Integração no fluxo de autenticação

**Arquivo:** `src/features/auth/pages/LoginPage.tsx` (ou nova página `TwoFactorAuthPage.tsx`)

```typescript
// Após o primeiro fator (email+senha) ser validado:
// 1. Navegar para /auth/2fa (ou mostrar modal)
// 2. Usuário digita 6 dígitos
// 3. onComplete(code: string) é chamado quando o 6º dígito é preenchido
// 4. Chamar authService.verify2FA({ code })
//    → sucesso: setState('success') → setTimeout → navigate('/')
//    → falha:   setState('failure') → setTimeout → setState('idle') + limpar digits

const handleVerify = async (code: string) => {
  setState('verifying');
  try {
    await authService.verify2FA({ code });
    setState('success');
    setTimeout(() => navigate('/', { replace: true }), 3200);
  } catch {
    setState('failure');
    setTimeout(() => {
      setState('idle');
      setDigits(['','','','','','']);
    }, 3000);
  }
};
```

---

## Arquivos de referência

| Arquivo           | O que é |
|-------------------|---------|
| `auth_2fa.html`   | Protótipo interativo completo. Abrir no browser, usar os botões "Código correto" e "Código incorreto" para ver o comportamento exato. |
| `README.md`       | Este documento. |

## Prompt para Claude Code CLI

```bash
cd CasaDiAna
claude
```

```
Leia design_handoff_auth2fa/README.md e abra
design_handoff_auth2fa/auth_2fa.html como referência visual interativa.

Implemente o componente TwoFactorAuthPage (ou TwoFactorModal) no codebase
existente da Casa di Ana, seguindo os padrões de TypeScript, Tailwind e
estrutura de features já estabelecidos. Use canvas próprio para as partículas
conforme descrito no README. Adicione os keyframes listados em index.css
caso ainda não existam. Integre o estado 'verifying'/'success'/'failure'
no fluxo de authService existente.
```
