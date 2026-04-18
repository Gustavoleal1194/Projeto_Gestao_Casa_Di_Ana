# Tela de Login Futurista com Globo 3D Interativo — Casa di Ana

**Data:** 2026-04-17
**Escopo:** Refatoração completa do painel esquerdo da `LoginPage` para uma experiência premium com globo 3D dot-matrix, partículas, scan line e microinterações. Painel direito (formulário) recebe microinterações nos inputs e botão. Zero alteração de lógica de autenticação, serviços, estado global ou rotas.

---

## 1. Objetivo

Elevar a primeira impressão do Casa di Ana ao padrão visual de produtos SaaS premium (Stripe, Linear, Vercel), substituindo o painel esquerdo decorativo atual (grid + círculo radial) por um globo 3D interativo estilo HUD, mantendo a identidade da marca (âmbar `#D4960C`) como destaque sobre base cyan fria.

O foco é **percepção de qualidade**, não gamificação — o globo é decorativo, os pings não representam dados reais.

---

## 2. Conceito Visual

- **Globo terrestre dot-matrix** em projeção esférica, cor base cyan `[0.22, 0.6, 0.8]` (≈ `#38BDF8` em hex aproximado, convertido para o range [0,1] do `cobe`), glow cyan escuro `[0.12, 0.35, 0.55]`.
- **Pin fixo em São Paulo** `[-23.5505, -46.6333]`, `size: 0.1`, cor âmbar `[0.83, 0.59, 0.05]` (≈ `#D4960C`). É o "herói" visual.
- **Pings aleatórios** — 3 a 5 marcadores secundários em coordenadas mundiais aleatórias, `size: 0.04`, alternando cyan e âmbar. Renovados a cada 2.5s para criar sensação de "atividade global".
- **Auto-rotação** contínua (~20s por volta completa).
- **Parallax de cursor** sutil — globo inclina até ±0.3 rad em phi/theta conforme o mouse se move sobre o painel, com interpolação suave.
- **Camada de partículas** flutuantes (24 em desktop) com `mix-blend-mode: screen`, drift vertical lento, opacity pulsando.
- **Scan line** horizontal fina (2px) atravessando o painel em loop de 8s, cyan semi-transparente — simula "leitura HUD".
- **Fundo** preserva o gradiente atual `linear-gradient(145deg, #0D1117 0%, #111827 100%)`.
- **Logo + título + features list** (conteúdo atual do painel esquerdo) permanecem no primeiro plano, sobre o globo.

---

## 3. Comportamento por Viewport / Capacidade

| Situação | Renderização |
|---|---|
| Desktop ≥1024px, WebGL ok, motion ok | Globo completo + parallax + partículas + scan line |
| Desktop, WebGL ok, `prefers-reduced-motion: reduce` | Globo estático (sem rotação, sem parallax), sem scan, sem partículas |
| Desktop, WebGL indisponível | `MobileHeroFallback` (órbitas SVG) ocupando o painel esquerdo |
| Mobile <1024px | Painel esquerdo oculto (comportamento atual com `hidden lg:flex` preservado) |
| Durante lazy load | `Globe3DFallback` — círculo pulsante cyan→âmbar |
| Erro em runtime no globo | `ErrorBoundary` → `Globe3DFallback` permanente |

> **Nota sobre mobile:** a opção B escolhida no brainstorming ("SVG/CSS com órbitas estilizadas no mobile") foi reavaliada — a `LoginPage` atual já esconde o painel esquerdo inteiro em <lg via `hidden lg:flex`. Manter esse comportamento evita competir com o teclado virtual e o form no mobile. A versão SVG 2D fica reservada para o caso de desktop sem WebGL, onde ainda faz sentido ocupar o espaço visual.

---

## 4. Paleta (tokens)

Adicionados em `globeConfig.ts` (não em `index.css`, pois `cobe` lê arrays RGB em [0,1]):

```ts
export const GLOBE_TOKENS = {
  baseColor:   [0.22, 0.60, 0.80],  // cyan frio, casca do globo
  glowColor:   [0.12, 0.35, 0.55],  // cyan escuro, brilho atmosférico
  markerBrand: [0.83, 0.59, 0.05],  // âmbar Casa di Ana, SP + alguns pings
  markerCool:  [0.45, 0.85, 0.95],  // cyan claro, pings alternados
  dark:        1,
  diffuse:     1.2,
  mapSamples:  16000,
  mapBrightness: 6,
}
```

Paleta DOM (partículas, scan, fallback mobile, microinterações) reutiliza tokens existentes do `index.css` onde possível; novas cores literais (apenas para efeitos HUD) ficam inline nos componentes que as usam — **não** expandem o tema global.

---

## 5. Arquitetura de Componentes

```
src/features/auth/
├── pages/
│   └── LoginPage.tsx              ← orquestra: <LoginHeroPanel/> + <LoginForm/>
├── components/
│   ├── hero/
│   │   ├── LoginHeroPanel.tsx     ← consulta useHeroMode, escolhe desktop vs fallback
│   │   ├── Globe3DScene.tsx       ← lazy; canvas cobe + parallax + pings
│   │   ├── Globe3DFallback.tsx    ← skeleton pulsante (Suspense/error boundary)
│   │   ├── MobileHeroFallback.tsx ← órbitas SVG (usado em desktop-sem-webgl)
│   │   ├── ParticleField.tsx      ← partículas Framer Motion
│   │   ├── ScanLine.tsx           ← barra horizontal varrendo o painel
│   │   └── BrandBlock.tsx         ← logo + título + features (estático, extraído do atual)
│   └── form/
│       ├── LoginForm.tsx          ← form + submit (lógica atual preservada)
│       ├── AnimatedInput.tsx      ← label flutuante, focus ring animado
│       └── AnimatedButton.tsx     ← hover/press Framer Motion
├── hooks/
│   ├── useCursorParallax.ts       ← retorna {phiOffset, thetaOffset}
│   ├── useRandomPings.ts          ← SP fixo + pings aleatórios a cada 2.5s
│   └── useHeroMode.ts             ← 'desktop-3d' | 'desktop-2d-fallback' | 'hidden' | 'reduced-motion'
└── lib/
    └── globeConfig.ts             ← GLOBE_TOKENS + coordenadas SP
```

### 5.1 Contratos

**`LoginPage.tsx`** (refatorado)
- Orquestração pura: layout 2-painéis ≥lg, 1 painel <lg.
- Delega toda decoração para `LoginHeroPanel`, toda lógica para `LoginForm`.
- Nenhuma alteração em `authService` ou `authStore`.

**`LoginHeroPanel.tsx`**
- Container do painel esquerdo.
- `mode = useHeroMode()`.
- Renderiza `<BrandBlock/>` sempre (sobre tudo, z-index alto).
- Se `mode === 'desktop-3d'`: `<ErrorBoundary fallback={<Globe3DFallback/>}><Suspense fallback={<Globe3DFallback/>}><Globe3DScene/></Suspense></ErrorBoundary>` + `<ParticleField/>` + `<ScanLine/>`.
- Se `mode === 'reduced-motion'`: globo estático (flag passada como prop `interactive={false}`), sem partículas, sem scan.
- Se `mode === 'desktop-2d-fallback'`: `<MobileHeroFallback/>`.
- Em mobile a página nem renderiza o hero panel (comportamento do layout pai).

**`Globe3DScene.tsx`** — `~120 linhas`
- Props: `interactive: boolean` (default true).
- `useEffect` cria canvas com `createGlobe(canvasRef.current, { ...GLOBE_TOKENS, markers, onRender })`.
- `onRender(state)`: incrementa `phi` se `interactive`; aplica `lerp` entre `phi/theta` atuais e alvos do `useCursorParallax`.
- Subscribe ao `visibilitychange` — pausa render em aba oculta.
- Cleanup: `globe.destroy()` no unmount.

**`Globe3DFallback.tsx`**
- Div quadrado 400×400px centrado.
- Círculo com gradient radial cyan→âmbar, `motion.div` com `animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}`, duration 2s infinito.
- Arco orbital estático (SVG) rodando com CSS `animation`.

**`MobileHeroFallback.tsx`**
- 3 anéis orbitais SVG concêntricos, rotações independentes via Framer Motion (durations 30s, 45s, 60s, algumas no sentido oposto).
- ~20 estrelas (dots pequenos) espalhados, opacity animada entre 0.2 e 0.8 em ciclos aleatórios.
- 1 "satélite" dot âmbar orbitando o anel externo.

**`ParticleField.tsx`**
- Array de 24 partículas (desktop). Cada uma: `<motion.span>` com posição inicial aleatória (percentuais), `animate={{ y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}`, duration aleatória 6–12s.
- `pointer-events: none`, `mix-blend-mode: screen`.
- Pausa quando o form recebe focus (listener em `LoginHeroPanel`).

**`ScanLine.tsx`**
- `<motion.div>` altura 2px, gradiente horizontal cyan transparente → brilhante → transparente.
- `animate={{ y: ['0%', '100%'] }}`, duration 8s, infinite, ease `easeInOut`.
- `opacity: 0.4`, `mix-blend-mode: screen`.

**`BrandBlock.tsx`**
- Conteúdo atual do painel esquerdo da `LoginPage`: logo âmbar + `CoffeeIcon` + título "Casa di Ana" + subtítulo + lista de features + rodapé de copyright.
- Zero alteração de conteúdo — apenas extração para componente isolado.
- `z-index` alto para ficar sobre o globo.

**`LoginForm.tsx`**
- Hook `useState` para email/senha/erro/carregando (como hoje).
- `handleSubmit` igual ao atual — chama `authService.login`, grava em `authStore` via `login()`, navega para `/`.
- Renderiza `<AnimatedInput/>` × 2 e `<AnimatedButton/>`.

**`AnimatedInput.tsx`**
- Props: `id`, `label`, `type`, `value`, `onChange`, `autoComplete`, `disabled`.
- Label começa dentro do input como placeholder; quando `focused || value.length > 0`, anima para cima-esquerda (`y: -22, scale: 0.85`) em 180ms.
- Focus ring: `box-shadow` anima de `0 0 0 0 transparent` para `0 0 0 3px rgba(196,135,10,0.2)` em 200ms.
- Preserva todos os atributos de acessibilidade atuais (`<label htmlFor>`, `aria-describedby`).

**`AnimatedButton.tsx`**
- Props: `type`, `loading`, `children`, `disabled`.
- `whileHover={{ scale: 1.01, y: -1 }}`, `whileTap={{ scale: 0.98 }}`, transition `{ duration: 0.15 }`.
- Mantém gradiente âmbar `linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)` e `Spinner` existente.

**`useCursorParallax.ts`**
- Props: `ref: RefObject<HTMLElement>`, `maxDelta: number = 0.3`.
- Registra `mousemove` no ref, calcula posição relativa normalizada [-1, 1], retorna `{phiOffset, thetaOffset}` em rad.
- Desliga se `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

**`useRandomPings.ts`**
- Retorna array de markers no formato do `cobe`: `[{ location: [lat, lng], size: number, color: [r,g,b] }]`.
- SP sempre presente: `{ location: [-23.5505, -46.6333], size: 0.1, color: GLOBE_TOKENS.markerBrand }`.
- Intervalo de 2500ms gera 3-5 pings extras em lat ∈ [-60, 60], lng ∈ [-180, 180], color alternando entre `markerBrand` e `markerCool`.
- Cleanup do `setInterval` no unmount.

**`useHeroMode.ts`**
- Lê `matchMedia('(min-width: 1024px)')`.
- Lê `matchMedia('(prefers-reduced-motion: reduce)')`.
- Testa WebGL: `const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')`.
- Retorna:
  - `'hidden'` — se viewport <1024px (hero panel nem monta)
  - `'reduced-motion'` — se motion reduzido
  - `'desktop-2d-fallback'` — se desktop sem WebGL
  - `'desktop-3d'` — caso padrão
- Subscribe a mudanças de ambos os `matchMedia` via `addEventListener('change')`.

---

## 6. Dependências Novas

Adicionar ao `frontend/package.json`:

```json
{
  "dependencies": {
    "cobe": "^0.6.3",
    "framer-motion": "^12.0.0"
  }
}
```

- **`cobe`**: ~4KB gzip, MIT, GPU-acelerado. Única dep de runtime pro globo.
- **`framer-motion`**: ~45KB gzip. Usado em toda a camada DOM (hero + form). Será aproveitado em outros módulos no futuro (já há intenção de usar para Toast em `src/features/estoque/ingredientes/components/Toast.tsx`).

**Não** adicionar: `three`, `@react-three/fiber`, `@react-three/drei`, `three-globe`. A escolha do `cobe` evita esse peso.

---

## 7. Budget de Performance

| Métrica | Alvo |
|---|---|
| Chunk do globo (code-split) | < 15KB gzip |
| Aumento do bundle principal (`framer-motion` em shared) | < 50KB gzip |
| Time-to-interactive desktop (rede rápida) | < 800ms após LoginPage montar |
| Frame rate desktop (Chrome, laptop i5 ~2022) | 60fps estável |
| Frame rate desktop (máquina de baixo perfil) | ≥ 30fps; se detectar queda, degradar para modo estático |
| Bateria mobile | Painel esquerdo não existe em mobile — zero custo |

`npm run build` após implementação deve mostrar chunk separado `globe-scene-[hash].js` no output do Vite — verificação manual durante o build.

---

## 8. Acessibilidade

- `ParticleField`, `ScanLine`, `MobileHeroFallback`, `Globe3DScene`, `Globe3DFallback` — todos com `aria-hidden="true"`.
- `<canvas>` do globo recebe `role="img"` e `aria-label="Globo decorativo"` (redundante com aria-hidden, mas defesa em profundidade para leitores que ignoram aria-hidden em canvas).
- **Ordem de tab:** `Tab` na carga inicial vai direto para `<input id="email">`. `Shift+Tab` não entra em nenhum elemento do painel esquerdo.
- **Contraste:** textos de `BrandBlock` preservam `#6B7280` sobre `#0D1117` (ratio AA atual).
- **Focus visible:** `AnimatedInput` e `AnimatedButton` mantêm `focus-visible:ring-2` — animações decorativas **nunca** substituem o indicador de foco.
- **`prefers-reduced-motion: reduce`:** honrado em globo, parallax, partículas, scan, microinterações de input/botão (que degradam para transições CSS de 0.15s).

---

## 9. Tratamento de Erros

- **`<ErrorBoundary>`** envolvendo apenas `<Suspense>` do globo — pequeno, próprio do feature. Se `cobe` explodir, só a ilustração cai.
- **`authService.login`** erros continuam tratados pelo bloco `{erro && (...)}` atual no `LoginForm` (`role="alert" aria-live="polite"`).
- **Sem WebGL**: já tratado via `useHeroMode` antes de tentar montar o globo.
- **Lazy chunk falha de carregar** (rede caiu): o `Suspense` fallback persiste (`Globe3DFallback`) — usuário ainda vê visual pulsante, form continua funcional.

---

## 10. Verificação

O projeto frontend **não** tem test runner configurado (confirmado: `package.json` não lista Jest, Vitest, Playwright nem RTL). Não vamos introduzir infraestrutura de teste só para esta feature — YAGNI.

Verificação é manual via `npm run dev` + build check. Checklist de aceitação:

1. **Desktop ≥1024px (Chrome, laptop padrão):**
   - [ ] Globo renderiza em <500ms após login page montar
   - [ ] Rotação automática suave (~20s/volta)
   - [ ] Pin SP sempre visível em âmbar
   - [ ] Pings secundários aparecem/somem a cada ~2.5s alternando cyan/âmbar
   - [ ] Parallax reage a movimento do mouse
   - [ ] Partículas flutuando no fundo do painel esquerdo
   - [ ] Scan line passando de cima pra baixo em loop
   - [ ] Microinterações nos inputs (label flutuante, ring animado)
   - [ ] Botão escala ao hover, diminui ao pressionar
   - [ ] Chrome DevTools Performance: sem jank (frames consistentes 16.7ms)

2. **Mobile (DevTools → iPhone 12):**
   - [ ] Painel esquerdo oculto (igual hoje)
   - [ ] Sem `<canvas>` no DOM
   - [ ] Sem `cobe` nem `Globe3DScene` nos Network requests
   - [ ] Form funcional, login normal
   - [ ] Microinterações de input/botão funcionam

3. **Tablet (768–1023px):** painel esquerdo oculto (igual hoje).

4. **`prefers-reduced-motion: reduce`** (DevTools → Rendering → Emulate CSS media):
   - [ ] Globo parado
   - [ ] Sem scan, sem partículas
   - [ ] Microinterações degradadas para transições CSS simples
   - [ ] Form funcional

5. **WebGL desabilitado** (`chrome://flags/#disable-webgl` → Disabled):
   - [ ] `MobileHeroFallback` aparece no desktop com órbitas SVG
   - [ ] Nenhum erro no console

6. **Tab navigation (teclado):**
   - [ ] `Tab` no carregamento vai pro input de email
   - [ ] `Shift+Tab` não entra no painel esquerdo
   - [ ] Focus ring visível em todos os elementos interativos

7. **Build (`npm run build`):**
   - [ ] Termina sem erros TS
   - [ ] Chunk separado para globo aparece no output
   - [ ] Bundle principal sem regressão >50KB gzip

8. **Screen reader (NVDA ou VoiceOver):**
   - [ ] Anuncia "Casa di Ana", "Bem-vindo de volta", label de email, label de senha, botão de entrar
   - [ ] Nada é anunciado sobre globo, partículas, scan

9. **Aba em background** (trocar de aba e voltar):
   - [ ] Globo não acumula "fast forward" — pausa em `document.hidden`

---

## 11. Fora de Escopo

- Pings reais representando vendas/produções/usuários logados (não é módulo de analytics).
- Arcos curvos entre pontos (estilo "rotas de voo") — requer cálculo trigonométrico adicional sobre o callback `onRender` do `cobe`; pode virar feature futura.
- Alteração visual na `MainLayout`, `Sidebar`, `TopHeader` — este escopo é apenas a tela de login.
- Testes unitários/integração — infraestrutura de teste frontend é uma decisão separada, não bloqueante.
- Internacionalização — todo conteúdo do painel esquerdo permanece em pt-BR (já está).
- Suporte a IE/Edge legado — projeto já assume navegadores modernos com Vite + React 19.

---

## 12. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| `cobe` renderiza mal em GPUs integradas antigas | `ErrorBoundary` + fallback 2D; monitorar feedback do usuário |
| `framer-motion` pesa +45KB | Dep compartilhada que já seria usada em outros módulos; tree-shaking ativo |
| Parallax desconforta o usuário | `prefers-reduced-motion` respeitado; amplitude baixa (0.3 rad max) |
| Pings aleatórios distraem do form | Pings são pequenos (size 0.04), só SP é destacado, alternam cores sem piscar agressivo |
| WebGL context lost (ex: troca de GPU no notebook) | `ErrorBoundary` captura e cai pro fallback |
| Bundle do globo carregando em mobile por engano | `useHeroMode` bloqueia `<Suspense><Globe3DScene/></Suspense>` antes de montar — lazy chunk nem é solicitado em viewport <lg |

---

## 13. Referências

- `cobe` — https://cobe.vercel.app/
- `framer-motion` — https://motion.dev/
- Inspiração visual: Stripe homepage hero globe, Linear login page, Vercel docs hero
- Arquivo atual: `src/features/auth/pages/LoginPage.tsx` (270 linhas a refatorar)
- Tokens de cor atuais: `src/index.css` (variáveis `--ada-*`)
