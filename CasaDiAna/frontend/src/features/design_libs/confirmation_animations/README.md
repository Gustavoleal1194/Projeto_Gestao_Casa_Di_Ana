# Handoff: Componentes de Confirmação — Venda & Produção

## Overview

Dois modais animados de feedback pós-ação para o ERP **Casa di Ana**:

1. **`ConfirmacaoVenda`** — exibido após `POST /api/vendas-diarias` com sucesso. Mostra resumo dos produtos vendidos, total em R$ com counter animado e confirmação de baixa de estoque.
2. **`ConfirmacaoProducao`** — exibido após `POST /api/producao-diaria` com sucesso. Mostra lote registrado, KPIs de custo, barras de insumos baixados animadas e nota de ficha técnica.

## Sobre os arquivos de design

Os arquivos neste pacote (`confirmacoes.html`) são **protótipos de referência criados em HTML estático** — mostram o visual e o comportamento desejado, não são código para copiar diretamente para produção.

**A tarefa é recriar esses componentes no codebase existente da Casa di Ana** (React 18 + TypeScript + Vite + Tailwind 4 + DM Sans/Sora), respeitando os padrões já estabelecidos no projeto: `useAuthStore`, serviços em `features/`, tokens CSS em `index.css`, etc.

## Fidelidade

**High-fidelity.** Os protótipos têm cores, tipografia, espaçamento e animações finais. O desenvolvedor deve recriar pixel-a-pixel usando as bibliotecas e tokens já presentes no projeto.

---

## Componentes a implementar

### 1. `ConfirmacaoVendaModal`

**Arquivo sugerido:** `src/features/producao/vendas-diarias/components/ConfirmacaoVendaModal.tsx`

**Props:**
```typescript
interface ConfirmacaoVendaModalProps {
  aberto: boolean
  onFechar: () => void
  dados: {
    total: number                          // ex: 251.70
    formaPagamento: string                 // ex: "Dinheiro"
    operador: string                       // ex: "Ana Ribeiro"
    itens: Array<{
      nome: string
      quantidade: number
      valorUnitario: number
      totalItem: number
    }>
    horario: string                        // ex: "14:32"
  }
}
```

**Layout (440px largura máxima):**
```
┌─[barra âmbar 4px]───────────────────────────┐
│ [×]                                         │
│                                             │
│  [✓ animado 64px]  Venda registrada         │
│                    R$ 251,70 (counter)      │
│                    Hoje · 14:32 · 3 itens   │
│                                             │
│  ┌─[tabela de produtos]──────────────────┐  │
│  │ Produto          | Qtd | Total        │  │
│  │ Croissant...     |  8  | R$ 103,20    │  │
│  │ Cappuccino...    |  5  | R$  82,50    │  │
│  │ Bolo de Cenoura  |  3  | R$  66,00    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─[resumo]──────────────────────────────┐  │
│  │ Subtotal           R$ 251,70          │  │
│  │ Forma pagamento    Dinheiro           │  │
│  │ Operador           Ana Ribeiro        │  │
│  │ ─────────────────────────────────     │  │
│  │ Estoque baixado    ✓ (âmbar)          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Nova Venda]  [Ver Relatório de Vendas →]  │
└─────────────────────────────────────────────┘
```

---

### 2. `ConfirmacaoProducaoModal`

**Arquivo sugerido:** `src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx`

**Props:**
```typescript
interface ConfirmacaoProducaoModalProps {
  aberto: boolean
  onFechar: () => void
  dados: {
    produto: string                         // ex: "Croissant de Manteiga"
    lote: number                            // ex: 204
    quantidade: number                      // ex: 48
    horario: string                         // ex: "14:32"
    custoTotal: number                      // ex: 186.40
    custoUnitario: number                   // ex: 3.88
    diasValidade: number                    // ex: 3
    insumos: Array<{
      nome: string
      quantidadeConsumida: string           // ex: "3,2 kg"
      percentualBarra: number              // 0-100, para animar a barra
    }>
  }
}
```

**Layout (460px largura máxima):**
```
┌─[barra âmbar 4px]──────────────────────────────┐
│ [×]                                            │
│                                                │
│  [✓ âmbar 64px]  Lote registrado               │
│                  48 unidades (counter)         │
│                  Croissant · Lote #204 · 14:32 │
│                                                │
│  ┌─[chips 3 colunas]──────────────────────┐    │
│  │ Custo total  | Custo unit. | Validade  │    │
│  │ R$ 186,40    | R$ 3,88     | 3 dias    │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  ┌─[insumos com barras]───────────────────┐    │
│  │ Insumos baixados do estoque            │    │
│  │ Farinha de Trigo  −3,2 kg  [████░░░░]  │    │
│  │ Manteiga Sem Sal  −0,8 kg  [█████░░░]  │    │
│  │ Ovos Caipira      −24 un   [██████░░]  │    │
│  │ Açúcar Demerara   −1,1 kg  [███░░░░░]  │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  [⚠ nota: baixa automática via ficha técnica]  │
│                                                │
│  [Novo Lote]  [Ver Relatório de Produção →]    │
└────────────────────────────────────────────────┘
```

---

## Animações

Todas as animações devem ser implementadas com **CSS keyframes** (já presentes no `index.css` do projeto) ou `framer-motion` se já instalado. Caso contrário, CSS puro é suficiente.

### Sequência de entrada (ambos os modais)

| Delay    | Elemento                          | Animação                              |
|----------|-----------------------------------|---------------------------------------|
| 0ms      | Overlay (`rgba(7,16,30,0.55)`)    | `opacity: 0 → 1` (200ms)             |
| 0ms      | Card                              | `scale(0.92)+translateY(16px) → scale(1)` com `cubic-bezier(0.34,1.4,0.64,1)` (350ms) |
| 100ms    | Círculo do checkmark              | `stroke-dashoffset: 163 → 0` (600ms) |
| 400ms    | Valor principal                   | `fadeUp` (300ms)                      |
| 500ms    | Thead / chips                     | `fadeIn` (250ms)                      |
| 550ms    | Início do counter                 | `requestAnimationFrame` 900–1100ms, easing `easeOutCubic` |
| 650ms+   | Linhas da tabela / insumos        | `fadeUp` escalonado a cada 80–100ms   |
| 700ms    | Sparkles ao redor do ícone        | `scale(0)+rotate(0) → scale(1)+rotate(45deg)`, escalonado |
| 700ms    | Círculo fill / checkmark path     | `stroke-dashoffset: 60 → 0` (350ms)  |
| 1000ms   | Float loop do ícone               | `translateY(0) → translateY(-4px)`, 3s infinite |

### Keyframes necessários (já existem em `index.css` como base — adicionar/verificar)

```css
@keyframes cardIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes checkDraw {
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
}
@keyframes circleDraw {
  from { stroke-dashoffset: 163; }
  to   { stroke-dashoffset: 0; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sparkle {
  0%   { transform: scale(0) rotate(0deg); opacity: 0; }
  50%  { opacity: 1; }
  100% { transform: scale(1) rotate(45deg); opacity: 0; }
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-4px); }
}
@keyframes ripple {
  from { transform: scale(0.6); opacity: 0.6; }
  to   { transform: scale(2.2); opacity: 0; }
}
```

### Counter animado

```typescript
// hook reutilizável
function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, enabled])
  return value
}
```

### Barras de insumos

```typescript
// estado da barra: começa em 0, vai para o valor após delay
const [barWidth, setBarWidth] = useState(0)
useEffect(() => {
  const id = setTimeout(() => setBarWidth(percentualBarra), delay + 500)
  return () => clearTimeout(id)
}, [])

// no JSX:
<div style={{
  width: `${barWidth}%`,
  transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'linear-gradient(90deg, #D4960C, #B87D0A)',
}}/>
```

---

## Tokens de design usados

| Token                    | Valor                                      |
|--------------------------|--------------------------------------------|
| Brand amber              | `#D4960C` / `#B87D0A`                      |
| Brand light              | `#F0B030`                                  |
| Success green            | `#16A34A` / `#F0FDF4` / `#BBF7D0`          |
| Warning amber            | `#92580A` / `#FFFBEB` / `#FDE68A`          |
| Heading                  | `#18150E`                                  |
| Body                     | `#4B4039`                                  |
| Muted                    | `#8B7E73`                                  |
| Surface                  | `#FFFFFF`                                  |
| Surface-2                | `#F1F4F8`                                  |
| Border                   | `#E4E7EC`                                  |
| Border-sub               | `#ECF1F7`                                  |
| Overlay bg               | `rgba(7,16,30,0.55)` + `blur(5px)`         |
| Card border-radius       | `20px`                                     |
| Card box-shadow          | `0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)` |
| Font display             | `Sora`                                     |
| Font body                | `DM Sans`                                  |
| Button primary shadow    | `0 4px 14px rgba(212,150,12,0.30)`          |

---

## Onde encaixar no fluxo existente

**Venda:** em `src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`, após o `await vendasDiariasService.registrar(...)` retornar com sucesso, setar `confirmaAberta = true` e passar os dados da resposta para o modal.

**Produção:** em `src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx`, após o `await producaoDiariaService.registrar(...)` retornar com sucesso, mesma lógica.

Ambos os modais podem usar o `modal-overlay` / `modal-card` / `modal-header` / `modal-footer` que já existem em `index.css` — só ajustar para o `animation: cardIn` e remover o `modal-footer` padrão (os CTAs são customizados).

---

## Arquivos de referência neste pacote

| Arquivo                  | O que é                                    |
|--------------------------|--------------------------------------------|
| `confirmacoes.html`      | Protótipo interativo completo com as duas animações. Abrir no browser para inspecionar o comportamento exato. |
| `README.md`              | Este documento                              |

## Como usar com Claude Code CLI

```bash
# Na raiz do projeto Casa di Ana
claude

# Prompt sugerido:
"Leia o arquivo design_handoff_confirmacoes/README.md e o arquivo
design_handoff_confirmacoes/confirmacoes.html como referência visual.
Implemente os dois componentes descritos (ConfirmacaoVendaModal e
ConfirmacaoProducaoModal) no codebase existente, seguindo os padrões
de TypeScript, Tailwind e estrutura de features já estabelecidos.
Use os tokens CSS do index.css e adicione os keyframes listados no README
caso ainda não existam."
```
