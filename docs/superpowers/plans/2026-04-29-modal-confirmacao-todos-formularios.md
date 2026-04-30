# Modal de Confirmação Animado — Todos os Formulários

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o padrão de modal de confirmação animado (já usado em importação de vendas, entrada de nota fiscal, produção diária e vendas diárias) a todos os outros formulários da aplicação.

**Architecture:** 8 novos componentes individuais de modal, cada um com dados específicos do seu formulário, seguindo fielmente o padrão de `ConfirmacaoProducaoModal.tsx`. As páginas trocam o toast de sucesso pelo modal animado; toasts de erro permanecem. Nenhum componente genérico é criado.

**Tech Stack:** React 18, TypeScript, inline styles com `var(--ada-*)` tokens, CSS animations globais do index.css, `useCountUp` hook local em cada modal.

---

## Padrão de referência

Todo modal segue exatamente a estrutura de `CasaDiAna/frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx`. Leia esse arquivo antes de implementar qualquer tarefa.

Padrão de integração nas páginas (baseado em `RegistrarVendaPage.tsx`):
```tsx
// 1. Adicionar estado
const [confirma, setConfirma] = useState<DadosConfirmacaoXxx | null>(null)

// 2. Após sucesso da API — substituir o setToast de sucesso por:
setConfirma({ ...dados })

// 3. Renderizar modal (antes do return da página, junto com outros modais)
{confirma && (
  <ConfirmacaoXxxModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null); /* reset form se necessário */ }}
    onVerLista={() => { setConfirma(null); navigate('/rota') }}
  />
)}
```

---

## Task 1: ConfirmacaoPerdasModal + PerdasPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/producao/perdas/components/ConfirmacaoPerdasModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar o arquivo `CasaDiAna/frontend/src/features/producao/perdas/components/ConfirmacaoPerdasModal.tsx` com o seguinte conteúdo:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoPerdas {
  produtoNome: string
  quantidade: number
  motivo: string
  horario: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerPerdas: () => void
  dados: DadosConfirmacaoPerdas
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    let rafId: number
    let cancelled = false
    const step = (ts: number) => {
      if (cancelled) return
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setValue(target)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, enabled])
  return value
}

function CheckMarkVermelho({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#DC2626" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#DC2626" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#FEF2F2"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#DC2626', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoPerdasModal({ aberto, onFechar, onVerPerdas, dados }: Props) {
  const countValue = useCountUp(dados.quantidade, 900, aberto)
  if (!aberto) return null

  const chips = [
    { label: 'Produto', value: dados.produtoNome },
    { label: 'Motivo', value: dados.motivo.length > 40 ? dados.motivo.slice(0, 40) + '…' : dados.motivo },
  ]

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #DC2626, #EF4444)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkVermelho delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#DC2626',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Perda registrada
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {Math.round(countValue).toLocaleString('pt-BR')} unidades
              </div>
              <div style={{ fontSize: 12, color: 'var(--ada-muted)', marginTop: 4, animation: 'fadeIn 300ms 900ms ease both' }}>
                {dados.produtoNome} · {dados.horario}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 20,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--ada-surface-2)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ada-muted)', marginBottom: 6 }}>
                  {chip.label}
                </div>
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--ada-heading)', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: '#FEF2F2', border: '1px solid #FECACA',
            marginBottom: 20,
            animation: 'fadeUp 280ms 1000ms ease both',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M13 16h-1v-4h-1m1-4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, color: '#7F1D1D', lineHeight: 1.45 }}>
              Estoque atualizado automaticamente.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Nova Perda
            </button>
            <button type="button" onClick={onVerPerdas} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220,38,38,0.30)',
            }}>
              Ver Perdas →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em PerdasPage.tsx**

Em `CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx`:

**Adicionar import no topo** (após os imports existentes):
```tsx
import { ConfirmacaoPerdasModal, type DadosConfirmacaoPerdas } from '../components/ConfirmacaoPerdasModal'
```

**Adicionar estado** logo após a declaração de `const [ate, setAte]` (linha ~53):
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoPerdas | null>(null)
```

**Substituir o bloco `onSubmitPerda`** (linhas 85-102) — trocar o `setToast sucesso` pelo `setConfirma`:
```tsx
const onSubmitPerda = async (values: PerdaFormValues) => {
  try {
    await perdasService.registrar({
      produtoId: values.produtoId,
      data: values.data,
      quantidade: Number(values.quantidade),
      justificativa: values.justificativa.trim(),
    })
    const produtoNome = produtos.find(p => p.id === values.produtoId)?.nome ?? '—'
    setModalAberto(false)
    resetForm({ produtoId: '', data: hoje(), quantidade: '', justificativa: '' })
    carregar(de, ate)
    setConfirma({
      produtoNome,
      quantidade: Number(values.quantidade),
      motivo: values.justificativa.trim(),
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0]
      ?? 'Erro ao registrar perda.'
    setToast({ tipo: 'erro', mensagem: msg })
  }
}
```

**Adicionar renderização do modal de confirmação** antes do `{toast && ...}` (linha ~296):
```tsx
{confirma && (
  <ConfirmacaoPerdasModal
    aberto
    dados={confirma}
    onFechar={() => setConfirma(null)}
    onVerPerdas={() => setConfirma(null)}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/perdas/components/ConfirmacaoPerdasModal.tsx
git add CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx
git commit -m "feat(perdas): adicionar modal de confirmação animado"
```

---

## Task 2: ConfirmacaoProdutoModal + ProdutoFormPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/producao/produtos/components/ConfirmacaoProdutoModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/producao/produtos/components/ConfirmacaoProdutoModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoProduto {
  produtoNome: string
  precoVenda: number
  modo: 'criado' | 'atualizado'
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerProdutos: () => void
  dados: DadosConfirmacaoProduto
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    let rafId: number
    let cancelled = false
    const step = (ts: number) => {
      if (cancelled) return
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setValue(target)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, enabled])
  return value
}

function CheckMarkAzul({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#2563EB" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#EFF6FF"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#2563EB', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ConfirmacaoProdutoModal({ aberto, onFechar, onVerProdutos, dados }: Props) {
  const countPreco = useCountUp(dados.precoVenda, 900, aberto)
  if (!aberto) return null

  const chips = [
    { label: 'Preço de venda', value: `R$ ${fmt(countPreco)}` },
    { label: 'Status', value: dados.modo === 'criado' ? 'Novo produto' : 'Atualizado' },
  ]

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #2563EB, #3B82F6)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkAzul delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2563EB',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Produto {dados.modo}
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.produtoNome}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 28,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--ada-surface-2)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ada-muted)', marginBottom: 6 }}>
                  {chip.label}
                </div>
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Fechar
            </button>
            <button type="button" onClick={onVerProdutos} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.30)',
            }}>
              Ver Produtos →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em ProdutoFormPage.tsx**

Em `CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`:

**Adicionar import** (após os imports existentes):
```tsx
import { ConfirmacaoProdutoModal, type DadosConfirmacaoProduto } from '../components/ConfirmacaoProdutoModal'
```

**Adicionar estado** logo após a declaração `const [carregando, setCarregando]`:
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoProduto | null>(null)
```

**Substituir o bloco `onSubmit`** inteiro:
```tsx
const onSubmit = async (values: ProdutoFormValues) => {
  try {
    const input = formParaInput(values)
    if (id) {
      await produtosService.atualizar({ id, ...input })
    } else {
      await produtosService.criar(input)
    }
    setConfirma({
      produtoNome: values.nome,
      precoVenda: Number(values.precoVenda),
      modo: id ? 'atualizado' : 'criado',
    })
  } catch {
    setToast({ tipo: 'erro', mensagem: 'Erro ao salvar produto.' })
  }
}
```

**Adicionar renderização do modal** antes do fechamento do `return` (logo antes do `{toast && ...}`):
```tsx
{confirma && (
  <ConfirmacaoProdutoModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null); navigate('/producao/produtos') }}
    onVerProdutos={() => { setConfirma(null); navigate('/producao/produtos') }}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/produtos/components/ConfirmacaoProdutoModal.tsx
git add CasaDiAna/frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
git commit -m "feat(produtos): adicionar modal de confirmação animado"
```

---

## Task 3: ConfirmacaoIngredienteModal + IngredienteFormPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/estoque/ingredientes/components/ConfirmacaoIngredienteModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/estoque/ingredientes/components/ConfirmacaoIngredienteModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoIngrediente {
  ingredienteNome: string
  unidade: string
  modo: 'criado' | 'atualizado'
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerIngredientes: () => void
  dados: DadosConfirmacaoIngrediente
}

function CheckMarkVerde({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#16A34A" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#16A34A" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#F0FDF4"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#16A34A', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoIngredienteModal({ aberto, onFechar, onVerIngredientes, dados }: Props) {
  if (!aberto) return null

  const chips = [
    { label: 'Unidade de medida', value: dados.unidade || '—' },
    { label: 'Status', value: dados.modo === 'criado' ? 'Novo ingrediente' : 'Atualizado' },
  ]

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #16A34A, #22C55E)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkVerde delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#16A34A',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Ingrediente {dados.modo}
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.ingredienteNome}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 28,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--ada-surface-2)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ada-muted)', marginBottom: 6 }}>
                  {chip.label}
                </div>
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--ada-heading)', letterSpacing: '-0.01em' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Fechar
            </button>
            <button type="button" onClick={onVerIngredientes} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #16A34A, #15803D)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.30)',
            }}>
              Ver Ingredientes →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em IngredienteFormPage.tsx**

Em `CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`:

**Adicionar import** (após os imports existentes):
```tsx
import { ConfirmacaoIngredienteModal, type DadosConfirmacaoIngrediente } from '../components/ConfirmacaoIngredienteModal'
```

**Adicionar estado** logo após `const [toast, setToast]`:
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoIngrediente | null>(null)
```

**Substituir o bloco `onSubmit`** — substituir as linhas que contêm `setToast sucesso` e `setTimeout navigate`:
```tsx
const onSubmit = handleSubmit(async (values: any) => {
  setSalvando(true)
  try {
    await salvar(values)
    setConfirma({
      ingredienteNome: values.nome,
      unidade: unidadeAtual,
      modo: modoEdicao ? 'atualizado' : 'criado',
    })
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
```

**Adicionar renderização do modal** no `return`, antes do `{toast && ...}`:
```tsx
{confirma && (
  <ConfirmacaoIngredienteModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null); navigate('/estoque/ingredientes') }}
    onVerIngredientes={() => { setConfirma(null); navigate('/estoque/ingredientes') }}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/estoque/ingredientes/components/ConfirmacaoIngredienteModal.tsx
git add CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx
git commit -m "feat(ingredientes): adicionar modal de confirmação animado"
```

---

## Task 4: ConfirmacaoFornecedorModal + FornecedorFormPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/fornecedores/components/ConfirmacaoFornecedorModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/fornecedores/components/ConfirmacaoFornecedorModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoFornecedor {
  fornecedorNome: string
  modo: 'criado' | 'atualizado'
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerFornecedores: () => void
  dados: DadosConfirmacaoFornecedor
}

function CheckMarkTeal({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#0891B2" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#0891B2" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#ECFEFF"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#0891B2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#0891B2', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoFornecedorModal({ aberto, onFechar, onVerFornecedores, dados }: Props) {
  if (!aberto) return null

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #0891B2, #06B6D4)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkTeal delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#0891B2',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Fornecedor {dados.modo}
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.fornecedorNome}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: '#ECFEFF', border: '1px solid #A5F3FC',
            marginBottom: 28,
            animation: 'fadeUp 280ms 750ms ease both',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#0E7490" strokeWidth="1.8" strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M13 16h-1v-4h-1m1-4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, color: '#164E63', lineHeight: 1.45 }}>
              Fornecedor disponível para novas entradas de mercadoria.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Fechar
            </button>
            <button type="button" onClick={onVerFornecedores} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #0891B2, #0E7490)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(8,145,178,0.30)',
            }}>
              Ver Fornecedores →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar se a pasta `components/` existe em fornecedores**

```bash
ls CasaDiAna/frontend/src/features/fornecedores/
```
Se não existir pasta `components`, ela será criada automaticamente ao criar o arquivo acima.

- [ ] **Step 3: Integrar em FornecedorFormPage.tsx**

Em `CasaDiAna/frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx`:

**Adicionar import**:
```tsx
import { ConfirmacaoFornecedorModal, type DadosConfirmacaoFornecedor } from '../components/ConfirmacaoFornecedorModal'
```

**Adicionar estado** após `const [carregando, setCarregando]`:
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoFornecedor | null>(null)
```

**Substituir o bloco `onSubmit`**:
```tsx
const onSubmit = async (values: FornecedorFormValues) => {
  try {
    const input = formParaInput(values)
    if (id) {
      await fornecedoresService.atualizar({ id, ...input })
    } else {
      await fornecedoresService.criar(input)
    }
    setConfirma({
      fornecedorNome: values.razaoSocial,
      modo: id ? 'atualizado' : 'criado',
    })
  } catch {
    setToast({ tipo: 'erro', mensagem: 'Erro ao salvar fornecedor.' })
  }
}
```

**Adicionar renderização do modal** antes do `{toast && ...}`:
```tsx
{confirma && (
  <ConfirmacaoFornecedorModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null); navigate('/fornecedores') }}
    onVerFornecedores={() => { setConfirma(null); navigate('/fornecedores') }}
  />
)}
```

- [ ] **Step 4: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add CasaDiAna/frontend/src/features/fornecedores/components/ConfirmacaoFornecedorModal.tsx
git add CasaDiAna/frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx
git commit -m "feat(fornecedores): adicionar modal de confirmação animado"
```

---

## Task 5: ConfirmacaoInicioInventarioModal + InventarioFormPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/inventarios/components/ConfirmacaoInicioInventarioModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/inventarios/pages/InventarioFormPage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/inventarios/components/ConfirmacaoInicioInventarioModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoInicioInventario {
  dataInicio: string
  inventarioId: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerInventario: () => void
  dados: DadosConfirmacaoInicioInventario
}

function CheckMarkRoxo({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#7C3AED" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#7C3AED" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#F5F3FF"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#7C3AED', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoInicioInventarioModal({ aberto, onFechar, onVerInventario, dados }: Props) {
  if (!aberto) return null

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #7C3AED, #8B5CF6)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkRoxo delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7C3AED',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Inventário iniciado
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.dataInicio}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: '#F5F3FF', border: '1px solid #DDD6FE',
            marginBottom: 28,
            animation: 'fadeUp 280ms 750ms ease both',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#5B21B6" strokeWidth="1.8" strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M13 16h-1v-4h-1m1-4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, color: '#4C1D95', lineHeight: 1.45 }}>
              Adicione os itens contados e finalize o inventário ao concluir.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Fechar
            </button>
            <button type="button" onClick={onVerInventario} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124,58,237,0.30)',
            }}>
              Ir para o Inventário →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em InventarioFormPage.tsx**

Em `CasaDiAna/frontend/src/features/inventarios/pages/InventarioFormPage.tsx`:

**Adicionar import** (após os imports existentes):
```tsx
import { ConfirmacaoInicioInventarioModal, type DadosConfirmacaoInicioInventario } from '../components/ConfirmacaoInicioInventarioModal'
```

**Adicionar estado** logo após `const [toast, setToast]`:
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoInicioInventario | null>(null)
```

**Substituir o bloco `onSubmit`**:
```tsx
const onSubmit = async (values: IniciarFormValues) => {
  try {
    const inventario = await inventariosService.iniciar({
      dataRealizacao: values.dataRealizacao,
      descricao: values.descricao || null,
      observacoes: values.observacoes || null,
    })
    setConfirma({
      dataInicio: new Date(values.dataRealizacao).toLocaleDateString('pt-BR'),
      inventarioId: inventario.id,
    })
  } catch {
    setToast({ tipo: 'erro', mensagem: 'Erro ao iniciar inventário.' })
  }
}
```

**Adicionar renderização do modal** antes do `{toast && ...}`:
```tsx
{confirma && (
  <ConfirmacaoInicioInventarioModal
    aberto
    dados={confirma}
    onFechar={() => { const destino = confirma.inventarioId; setConfirma(null); navigate(`/inventarios/${destino}`) }}
    onVerInventario={() => { const destino = confirma.inventarioId; setConfirma(null); navigate(`/inventarios/${destino}`) }}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/inventarios/components/ConfirmacaoInicioInventarioModal.tsx
git add CasaDiAna/frontend/src/features/inventarios/pages/InventarioFormPage.tsx
git commit -m "feat(inventarios): adicionar modal de confirmação ao iniciar inventário"
```

---

## Task 6: ConfirmacaoFinalizacaoInventarioModal + InventarioDetalhePage

**Files:**
- Create: `CasaDiAna/frontend/src/features/inventarios/components/ConfirmacaoFinalizacaoInventarioModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/inventarios/components/ConfirmacaoFinalizacaoInventarioModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoFinalizacaoInventario {
  totalItens: number
  horario: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  dados: DadosConfirmacaoFinalizacaoInventario
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    let rafId: number
    let cancelled = false
    const step = (ts: number) => {
      if (cancelled) return
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setValue(target)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, enabled])
  return value
}

function CheckMarkVerde({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#16A34A" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#16A34A" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#F0FDF4"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#16A34A', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoFinalizacaoInventarioModal({ aberto, onFechar, dados }: Props) {
  const countItens = useCountUp(dados.totalItens, 900, aberto)
  if (!aberto) return null

  const chips = [
    { label: 'Itens contados', value: `${Math.round(countItens).toLocaleString('pt-BR')}` },
    { label: 'Horário', value: dados.horario },
  ]

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #16A34A, #22C55E)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkVerde delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#16A34A',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Inventário finalizado
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {Math.round(countItens).toLocaleString('pt-BR')} itens
              </div>
              <div style={{ fontSize: 12, color: 'var(--ada-muted)', marginTop: 4, animation: 'fadeIn 300ms 900ms ease both' }}>
                contagem encerrada · {dados.horario}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 20,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--ada-surface-2)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ada-muted)', marginBottom: 6 }}>
                  {chip.label}
                </div>
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            marginBottom: 20,
            animation: 'fadeUp 280ms 1000ms ease both',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#15803D" strokeWidth="1.8" strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M13 16h-1v-4h-1m1-4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, color: '#14532D', lineHeight: 1.45 }}>
              Estoque ajustado automaticamente com base nas contagens registradas.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #16A34A, #15803D)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.30)',
            }}>
              Ver Inventário →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em InventarioDetalhePage.tsx**

Em `CasaDiAna/frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx`:

**Adicionar import** (após os imports existentes):
```tsx
import { ConfirmacaoFinalizacaoInventarioModal, type DadosConfirmacaoFinalizacaoInventario } from '../components/ConfirmacaoFinalizacaoInventarioModal'
```

**Adicionar estado** logo após `const [toast, setToast]`:
```tsx
const [confirmaFinalizado, setConfirmaFinalizado] = useState<DadosConfirmacaoFinalizacaoInventario | null>(null)
```

**Substituir o bloco `handleFinalizar`**:
```tsx
const handleFinalizar = async () => {
  if (!id) return
  setProcessando(true)
  try {
    const atualizado = await inventariosService.finalizar(id)
    setInventario(atualizado)
    setConfirmandoFinalizar(false)
    setConfirmaFinalizado({
      totalItens: atualizado.itens.length,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })
  } catch {
    setToast({ tipo: 'erro', mensagem: 'Erro ao finalizar inventário.' })
  } finally {
    setProcessando(false)
  }
}
```

**Adicionar renderização do modal** no JSX, antes do `{toast && ...}`:
```tsx
{confirmaFinalizado && (
  <ConfirmacaoFinalizacaoInventarioModal
    aberto
    dados={confirmaFinalizado}
    onFechar={() => setConfirmaFinalizado(null)}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/inventarios/components/ConfirmacaoFinalizacaoInventarioModal.tsx
git add CasaDiAna/frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx
git commit -m "feat(inventarios): adicionar modal de confirmação ao finalizar inventário"
```

---

## Task 7: ConfirmacaoFichaTecnicaModal + FichaTecnicaPage

**Files:**
- Create: `CasaDiAna/frontend/src/features/producao/produtos/components/ConfirmacaoFichaTecnicaModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/producao/produtos/components/ConfirmacaoFichaTecnicaModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoFichaTecnica {
  produtoNome: string
  totalIngredientes: number
  custoTotal: number
}

interface Props {
  aberto: boolean
  onFechar: () => void
  dados: DadosConfirmacaoFichaTecnica
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    let rafId: number
    let cancelled = false
    const step = (ts: number) => {
      if (cancelled) return
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setValue(target)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, enabled])
  return value
}

function CheckMarkAmbar({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#D4960C" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#D4960C" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#FFFBEB"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#D4960C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#D4960C', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ConfirmacaoFichaTecnicaModal({ aberto, onFechar, dados }: Props) {
  const countCusto = useCountUp(dados.custoTotal, 900, aberto)
  if (!aberto) return null

  const chips = [
    { label: 'Custo total', value: `R$ ${fmt(countCusto)}` },
    { label: 'Ingredientes', value: `${dados.totalIngredientes}` },
  ]

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #D4960C, #E8A520)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkAmbar delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D4960C',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Ficha técnica salva
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.produtoNome}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 20,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--ada-surface-2)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ada-muted)', marginBottom: 6 }}>
                  {chip.label}
                </div>
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            marginBottom: 20,
            animation: 'fadeUp 280ms 1000ms ease both',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#92580A" strokeWidth="1.8" strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M13 16h-1v-4h-1m1-4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, color: '#7A5206', lineHeight: 1.45 }}>
              Custo de produção atualizado. Próximos lotes usarão esta ficha.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #D4960C, #B87D0A)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,150,12,0.30)',
            }}>
              Fechar →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Integrar em FichaTecnicaPage.tsx**

Em `CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx`:

**Adicionar import** (após os imports existentes):
```tsx
import { ConfirmacaoFichaTecnicaModal, type DadosConfirmacaoFichaTecnica } from '../components/ConfirmacaoFichaTecnicaModal'
```

**Adicionar estado** logo após `const [toast, setToast]`:
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoFichaTecnica | null>(null)
```

**Substituir o bloco `onSubmit`** (linhas 75-92):
```tsx
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
    setConfirma({
      produtoNome: fichaAtualizada.produtoNome,
      totalIngredientes: fichaAtualizada.itens.length,
      custoTotal: fichaAtualizada.custoTotal,
    })
  } catch {
    setToast({ tipo: 'erro', mensagem: 'Erro ao salvar ficha técnica.' })
  } finally {
    setSalvando(false)
  }
}
```

**Adicionar renderização do modal** antes do `{toast && ...}` no return:
```tsx
{confirma && (
  <ConfirmacaoFichaTecnicaModal
    aberto
    dados={confirma}
    onFechar={() => setConfirma(null)}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/produtos/components/ConfirmacaoFichaTecnicaModal.tsx
git add CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx
git commit -m "feat(ficha-tecnica): adicionar modal de confirmação animado"
```

---

## Task 8: ConfirmacaoCriacaoRapidaModal + QuickCreateProductModal

**Files:**
- Create: `CasaDiAna/frontend/src/features/producao/importacao-vendas/components/ConfirmacaoCriacaoRapidaModal.tsx`
- Modify: `CasaDiAna/frontend/src/features/producao/importacao-vendas/components/QuickCreateProductModal.tsx`

- [ ] **Step 1: Criar o componente do modal**

Criar `CasaDiAna/frontend/src/features/producao/importacao-vendas/components/ConfirmacaoCriacaoRapidaModal.tsx`:

```tsx
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoCriacaoRapida {
  produtoNome: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  dados: DadosConfirmacaoCriacaoRapida
}

function CheckMarkAzul({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#2563EB" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#EFF6FF"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#2563EB', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoCriacaoRapidaModal({ aberto, onFechar, dados }: Props) {
  if (!aberto) return null

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #2563EB, #3B82F6)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkAzul delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2563EB',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Produto criado
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.produtoNome}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ada-muted)', marginTop: 4, animation: 'fadeIn 300ms 900ms ease both' }}>
                disponível para importação
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.30)',
            }}>
              Continuar Importação →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Atenção:** o `zIndex` deste modal é `300` (em vez de `200`) pois ele aparece sobre o modal do QuickCreateProductModal que usa `modal-overlay` da aplicação.

- [ ] **Step 2: Integrar em QuickCreateProductModal.tsx**

Em `CasaDiAna/frontend/src/features/producao/importacao-vendas/components/QuickCreateProductModal.tsx`:

**Adicionar import** (após os imports existentes):
```tsx
import { ConfirmacaoCriacaoRapidaModal, type DadosConfirmacaoCriacaoRapida } from './ConfirmacaoCriacaoRapidaModal'
import type { Produto } from '@/types/producao'
```
*(Se `Produto` já for importado, não duplicar o import.)*

**Adicionar estado** logo após `const [categorias, setCategorias]`:
```tsx
const [confirma, setConfirma] = useState<DadosConfirmacaoCriacaoRapida | null>(null)
const [produtoCriado, setProdutoCriado] = useState<Produto | null>(null)
```

**Substituir o bloco `onSubmit`**:
```tsx
const onSubmit = async (values: FormValues) => {
  setSalvando(true)
  setErroApi(null)
  try {
    const produto = await produtosService.criar({
      nome: values.nome,
      precoVenda: parseFloat(values.precoVenda.replace(',', '.')),
      categoriaProdutoId: values.categoriaProdutoId || null,
    })
    setProdutoCriado(produto)
    setConfirma({ produtoNome: produto.nome })
  } catch {
    setErroApi('Erro ao criar produto. Verifique os dados e tente novamente.')
    setSalvando(false)
  }
}
```

**Adicionar renderização do modal de confirmação** no `return`, antes do `<div className="modal-overlay"...>`:
```tsx
{confirma && produtoCriado && (
  <ConfirmacaoCriacaoRapidaModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null); onSalvo(produtoCriado) }}
  />
)}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/producao/importacao-vendas/components/ConfirmacaoCriacaoRapidaModal.tsx
git add CasaDiAna/frontend/src/features/producao/importacao-vendas/components/QuickCreateProductModal.tsx
git commit -m "feat(importacao-vendas): adicionar modal de confirmação na criação rápida de produto"
```
