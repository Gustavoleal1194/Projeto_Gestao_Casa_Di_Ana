# Confirmation Modals — Venda & Produção — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar `ConfirmacaoVendaModal` e `ConfirmacaoProducaoModal` — dois modais animados exibidos após registro bem-sucedido de venda e produção, seguindo o design handoff em `confirmation_animations/`.

**Architecture:** Dois componentes self-contained em suas respectivas `components/` dentro do feature folder. Totalmente aditivos: as páginas `RegistrarVendaPage` e `RegistrarProducaoPage` já existem e só recebem o estado de confirmação + renderização do modal. Os dados do modal são derivados da resposta da API mais dados já em memória (lista de produtos, authStore). Nenhum endpoint novo.

**Tech Stack:** React 18 + TypeScript + CSS keyframes (adicionados em `index.css`) + `requestAnimationFrame` para counter. Zero novas dependências npm.

---

## Referência visual

Abrir `frontend/src/features/design_libs/confirmation_animations/confirmacoes.html` no browser e usar os botões para ver o comportamento exato antes de implementar.

---

## Mapa de Arquivos

### Criar
- `frontend/src/features/producao/vendas-diarias/components/ConfirmacaoVendaModal.tsx`
- `frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx`

### Modificar
- `frontend/src/index.css` — adicionar 9 keyframes de animação
- `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` — integrar modal
- `frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` — integrar modal

---

## Task 1: Keyframes CSS para modais de confirmação

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Verificar se os keyframes já existem**

```bash
grep -n "cardIn\|circleDraw\|checkDraw\|fadeUp\|sparkle\|float\|ripple\|overlayIn" frontend/src/index.css
```

Saída esperada: nenhuma linha (os keyframes ainda não existem).

- [ ] **Step 2: Adicionar os keyframes no final de `index.css`, após o bloco 2FA**

Ler o arquivo e confirmar que o bloco `/* ─── 2FA Animated Panel */` está no final. Adicionar imediatamente após o último `}`:

```css
/* ─── Confirmation Modals ──────────────────────────────────────────────── */
@keyframes overlayIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes cardIn     { from { opacity: 0; transform: scale(0.92) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes fadeUp     { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn     { from { opacity: 0; } to { opacity: 1; } }
@keyframes checkDraw  { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
@keyframes circleDraw { from { stroke-dashoffset: 163; } to { stroke-dashoffset: 0; } }
@keyframes sparkle    { 0% { transform: scale(0) rotate(0deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) rotate(45deg); opacity: 0; } }
@keyframes float      { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes ripple     { from { transform: scale(0.6); opacity: 0.6; } to { transform: scale(2.2); opacity: 0; } }
```

- [ ] **Step 3: Verificar TypeScript**

```powershell
Set-Location 'C:\Users\Gustavo Leal\Documents\ProjetoGestao\CasaDiAna\frontend'; npx tsc --noEmit 2>&1 | Select-Object -First 5
```

Saída esperada: nenhuma.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(css): keyframes overlayIn, cardIn, fadeUp, fadeIn, checkDraw, circleDraw, sparkle, float, ripple"
```

---

## Task 2: `ConfirmacaoVendaModal.tsx`

**Files:**
- Create: `frontend/src/features/producao/vendas-diarias/components/ConfirmacaoVendaModal.tsx`

> **Dados disponíveis:** `VendaDiaria` retorna `{ produtoNome, quantidadeVendida, criadoEm }`. O `valorUnitario` vem de `ProdutoResumo.precoVenda` (já carregado na página). O `operador` vem do `useAuthStore` (passado como prop pela página). A tabela tem sempre uma linha (o form registra um produto por vez).

- [ ] **Step 1: Criar o diretório se não existir e criar `ConfirmacaoVendaModal.tsx`**

```bash
mkdir -p frontend/src/features/producao/vendas-diarias/components
```

Criar o arquivo com o conteúdo abaixo:

```tsx
// frontend/src/features/producao/vendas-diarias/components/ConfirmacaoVendaModal.tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoVenda {
  produtoNome: string
  quantidade: number
  valorUnitario: number
  total: number
  operador: string
  horario: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerRelatorio: () => void
  dados: DadosConfirmacaoVenda
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) requestAnimationFrame(step)
      else setValue(target)
    }
    requestAnimationFrame(step)
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

export function ConfirmacaoVendaModal({ aberto, onFechar, onVerRelatorio, dados }: Props) {
  const countValue = useCountUp(dados.total, 1100, aberto)
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
          width: '100%', maxWidth: 440,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        {/* Barra âmbar topo */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #D4960C, #B87D0A)' }} />

        {/* Botão fechar */}
        <button onClick={onFechar} style={{
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

          {/* Ícone + hero */}
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
                Venda registrada
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                R$ {fmt(countValue)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ada-muted)', marginTop: 4, animation: 'fadeIn 300ms 900ms ease both' }}>
                Hoje · {dados.horario} · {dados.quantidade} {dados.quantidade === 1 ? 'unidade' : 'unidades'}
              </div>
            </div>
          </div>

          {/* Tabela produto */}
          <div style={{
            background: 'var(--ada-surface-2)', border: '1px solid var(--ada-border)',
            borderRadius: 12, padding: '4px 16px', marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0 6px',
              fontSize: 10.5, fontWeight: 600, fontFamily: 'Sora, system-ui, sans-serif',
              color: 'var(--ada-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: '1px solid var(--ada-border-sub)',
              animation: 'fadeIn 250ms 500ms ease both',
            }}>
              <span style={{ flex: 1 }}>Produto</span>
              <span style={{ width: 32, textAlign: 'right' }}>Qtd</span>
              <span style={{ width: 80, textAlign: 'right' }}>Total</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0',
              animation: 'fadeUp 280ms 650ms ease both',
            }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ada-heading)' }}>
                {dados.produtoNome}
              </span>
              <span style={{ width: 32, textAlign: 'right', fontSize: 13, color: 'var(--ada-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {dados.quantidade}
              </span>
              <span style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums', fontFamily: 'Sora, system-ui, sans-serif' }}>
                R$ {fmt(dados.total)}
              </span>
            </div>
          </div>

          {/* Resumo */}
          <div style={{
            background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
            borderRadius: 12, padding: '6px 16px', marginBottom: 20,
          }}>
            {[
              { label: 'Subtotal', value: `R$ ${fmt(dados.total)}`, delay: 900 },
              { label: 'Operador', value: dados.operador, delay: 960 },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', animation: `fadeUp 350ms ${row.delay}ms ease both`,
              }}>
                <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>{row.label}</span>
                <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--ada-border-sub)', marginTop: 4, paddingTop: 4 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', animation: 'fadeUp 350ms 1020ms ease both',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>Estoque baixado automaticamente</span>
                <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: '#D4960C' }}>✓</span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Nova Venda
            </button>
            <button onClick={onVerRelatorio} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #D4960C, #B87D0A)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,150,12,0.30)',
            }}>
              Ver Relatório de Vendas →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
Set-Location 'C:\Users\Gustavo Leal\Documents\ProjetoGestao\CasaDiAna\frontend'; npx tsc --noEmit 2>&1 | Select-Object -First 15
```

Saída esperada: nenhuma. Corrigir erros neste arquivo se houver.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/producao/vendas-diarias/components/ConfirmacaoVendaModal.tsx
git commit -m "feat(vendas): ConfirmacaoVendaModal animado com checkmark, counter e sparkles"
```

---

## Task 3: Integrar `ConfirmacaoVendaModal` em `RegistrarVendaPage`

**Files:**
- Modify: `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`

> **O que muda:** `onSubmit` deixa de navegar imediatamente e passa a setar estado `confirma`. O toast de sucesso é removido (o modal substitui esse feedback). O toast de erro permanece. Após `onFechar`, o form é resetado; após `onVerRelatorio`, navega para `/producao/vendas`.

- [ ] **Step 1: Ler o arquivo atual**

Ler `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` na íntegra.

- [ ] **Step 2: Substituir pelo conteúdo abaixo**

```tsx
// frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { vendasDiariasService } from '../services/vendasDiariasService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { useAuthStore } from '@/store/authStore'
import { ConfirmacaoVendaModal, type DadosConfirmacaoVenda } from '../components/ConfirmacaoVendaModal'
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
  const { usuario } = useAuthStore()
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [confirma, setConfirma] = useState<DadosConfirmacaoVenda | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
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
      const resultado = await vendasDiariasService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeVendida: Number(values.quantidadeVendida),
      })
      const produto = produtos.find(p => p.id === values.produtoId)
      const valorUnitario = produto?.precoVenda ?? 0
      const quantidade = Number(values.quantidadeVendida)
      setConfirma({
        produtoNome: resultado.produtoNome,
        quantidade,
        valorUnitario,
        total: quantidade * valorUnitario,
        operador: usuario?.nome ?? '—',
        horario: new Date(resultado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao registrar venda.' })
    }
  }

  return (
    <div className="ada-page max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo="Registrar Venda"
        breadcrumb={['Produção', 'Vendas Diárias']}
      />

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

      {confirma && (
        <ConfirmacaoVendaModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); reset() }}
          onVerRelatorio={() => { setConfirma(null); navigate('/producao/vendas') }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```powershell
Set-Location 'C:\Users\Gustavo Leal\Documents\ProjetoGestao\CasaDiAna\frontend'; npx tsc --noEmit 2>&1 | Select-Object -First 15
```

Saída esperada: nenhuma.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
git commit -m "feat(vendas): integrar ConfirmacaoVendaModal em RegistrarVendaPage"
```

---

## Task 4: `ConfirmacaoProducaoModal.tsx`

**Files:**
- Create: `frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx`

> **Dados disponíveis:** `ProducaoDiaria` retorna `{ produtoNome, quantidadeProduzida, custoTotal, criadoEm }`. `custoUnitario` é calculado na página como `custoTotal / quantidadeProduzida`. A seção de insumos do protótipo é omitida (dados não disponíveis na API). Os KPI chips mostram custo total e unitário em 2 colunas. A nota de ficha técnica é mantida.

- [ ] **Step 1: Criar o diretório se não existir e criar `ConfirmacaoProducaoModal.tsx`**

```bash
mkdir -p frontend/src/features/producao/producao-diaria/components
```

Criar o arquivo com o conteúdo abaixo:

```tsx
// frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoProducao {
  produtoNome: string
  quantidade: number
  custoTotal: number
  custoUnitario: number
  horario: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerRelatorio: () => void
  dados: DadosConfirmacaoProducao
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) requestAnimationFrame(step)
      else setValue(target)
    }
    requestAnimationFrame(step)
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

export function ConfirmacaoProducaoModal({ aberto, onFechar, onVerRelatorio, dados }: Props) {
  const countValue = useCountUp(dados.quantidade, 900, aberto)
  if (!aberto) return null

  const chips = [
    { label: 'Custo total',    value: `R$ ${fmt(dados.custoTotal)}` },
    { label: 'Custo unitário', value: `R$ ${fmt(dados.custoUnitario)}` },
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
        {/* Barra âmbar topo */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #D4960C, #E8A520)' }} />

        {/* Botão fechar */}
        <button onClick={onFechar} style={{
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

          {/* Ícone + hero */}
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
                Lote registrado
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

          {/* KPI chips */}
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

          {/* Nota ficha técnica */}
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
              Baixa do estoque calculada automaticamente pela ficha técnica do produto.
            </span>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Novo Lote
            </button>
            <button onClick={onVerRelatorio} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #D4960C, #B87D0A)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,150,12,0.30)',
            }}>
              Ver Relatório de Produção →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
Set-Location 'C:\Users\Gustavo Leal\Documents\ProjetoGestao\CasaDiAna\frontend'; npx tsc --noEmit 2>&1 | Select-Object -First 15
```

Saída esperada: nenhuma.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/producao/producao-diaria/components/ConfirmacaoProducaoModal.tsx
git commit -m "feat(producao): ConfirmacaoProducaoModal animado com checkmark ambar, counter e KPIs"
```

---

## Task 5: Integrar `ConfirmacaoProducaoModal` em `RegistrarProducaoPage`

**Files:**
- Modify: `frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx`

> **O que muda:** `onSubmit` passa a setar estado `confirma` em vez de exibir toast de sucesso + navegar. O toast de erro permanece. `custoUnitario = custoTotal / quantidadeProduzida`. Após `onFechar`, form é resetado; após `onVerRelatorio`, navega para `/producao/diaria`.

- [ ] **Step 1: Ler o arquivo atual**

Ler `frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` na íntegra.

- [ ] **Step 2: Substituir pelo conteúdo abaixo**

```tsx
// frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { producaoDiariaService } from '../services/producaoDiariaService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { ConfirmacaoProducaoModal, type DadosConfirmacaoProducao } from '../components/ConfirmacaoProducaoModal'
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
  const [confirma, setConfirma] = useState<DadosConfirmacaoProducao | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
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
      const resultado = await producaoDiariaService.registrar({
        produtoId: values.produtoId,
        data: values.data,
        quantidadeProduzida: Number(values.quantidadeProduzida),
        observacoes: values.observacoes || null,
      })
      const quantidade = Number(values.quantidadeProduzida)
      setConfirma({
        produtoNome: resultado.produtoNome,
        quantidade,
        custoTotal: resultado.custoTotal,
        custoUnitario: quantidade > 0 ? resultado.custoTotal / quantidade : 0,
        horario: new Date(resultado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    } catch (err: unknown) {
      const erros = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros
      setToast({ tipo: 'erro', mensagem: erros?.[0] ?? 'Erro ao registrar produção.' })
    }
  }

  return (
    <div className="ada-page max-w-lg">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo="Registrar Produção"
        breadcrumb={['Produção', 'Produção Diária']}
      />

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

      {confirma && (
        <ConfirmacaoProducaoModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); reset() }}
          onVerRelatorio={() => { setConfirma(null); navigate('/producao/diaria') }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```powershell
Set-Location 'C:\Users\Gustavo Leal\Documents\ProjetoGestao\CasaDiAna\frontend'; npx tsc --noEmit 2>&1 | Select-Object -First 15
```

Saída esperada: nenhuma.

- [ ] **Step 4: Verificar build**

```powershell
Set-Location 'C:\Users\Gustavo Leal\Documents\ProjetoGestao\CasaDiAna\frontend'; npm run build 2>&1 | Select-Object -Last 10
```

Saída esperada: `✓ built in X.XXs`.

- [ ] **Step 5: Commit e push**

```bash
git add frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx
git commit -m "feat(producao): integrar ConfirmacaoProducaoModal em RegistrarProducaoPage"
git push origin master
```

---

## Verificação Final

- [ ] TypeScript sem erros: `npx tsc --noEmit`
- [ ] Build Vite sem erros: `npm run build`
- [ ] Registrar uma venda → modal abre com checkmark verde, counter animado, tabela com produto, CTAs
- [ ] "Nova Venda" → modal fecha, form resetado, pode registrar outra
- [ ] "Ver Relatório de Vendas →" → modal fecha, navega para `/producao/vendas`
- [ ] Registrar uma produção → modal abre com checkmark âmbar, counter de unidades, chips de custo
- [ ] "Novo Lote" → modal fecha, form resetado
- [ ] "Ver Relatório de Produção →" → modal fecha, navega para `/producao/diaria`
- [ ] Clicar fora do card fecha o modal
- [ ] Botão × fecha o modal

---

## Self-Review

### Spec coverage

| Requisito do README | Implementado em |
|---|---|
| Overlay `rgba(7,16,30,0.55)` + blur(5px) | Task 2 + Task 4 — estilo do overlay |
| Card `scale(0.92)+translateY(16px)` entrada | Task 1 — `cardIn` keyframe |
| Barra âmbar 4px no topo | Task 2 + Task 4 — primeiro `<div>` no card |
| Botão × fechar | Task 2 + Task 4 — `CloseBtn` inline |
| Checkmark verde (venda) com `circleDraw` + `checkDraw` | Task 2 — `CheckMarkVerde` |
| Checkmark âmbar (produção) | Task 4 — `CheckMarkAmbar` |
| Ripple ao redor do ícone | Task 1 + Task 2/4 — `ripple` keyframe na circle exterior |
| Float loop do ícone | Task 1 + Task 2/4 — `float` keyframe |
| Sparkles ao redor do ícone | Task 2 + Task 4 — `Sparkles` + `sparkle` keyframe |
| Counter animado `easeOutCubic` | Task 2 + Task 4 — `useCountUp` hook |
| Venda: counter em R$ | Task 2 — `fmt(countValue)` |
| Produção: counter em unidades | Task 4 — `Math.round(countValue)` |
| Venda: tabela produto/qtd/total | Task 2 — tabela de uma linha |
| Venda: resumo subtotal + operador + estoque ✓ | Task 2 — linhas de resumo |
| Produção: chips custo total + unitário | Task 4 — grid 2 colunas |
| Produção: nota ficha técnica âmbar | Task 4 — `<div style={{ background: '#FFFBEB' }}>` |
| CTA "Nova Venda" / "Novo Lote" → fecha + reset | Task 3 + Task 5 — `onFechar` |
| CTA "Ver Relatório →" → fecha + navega | Task 3 + Task 5 — `onVerRelatorio` |
| Fechar clicando fora do card | Task 2 + Task 4 — `onClick={onFechar}` no overlay |
| `fadeUp` escalonado nas linhas | Task 2 + Task 4 — `animation: fadeUp Xms Yms ease both` |
| Zero dependências npm novas | ✓ — apenas CSS + RAF nativos |
| Não altera código existente além das páginas | ✓ — apenas `RegistrarVendaPage` e `RegistrarProducaoPage` modificados |

### Placeholder scan
Sem TBDs, TODOs ou "implementar depois". Todo o código está presente inline.

### Type consistency
- `DadosConfirmacaoVenda` definido em `ConfirmacaoVendaModal.tsx` e re-exportado; importado em `RegistrarVendaPage` via `type DadosConfirmacaoVenda`.
- `DadosConfirmacaoProducao` definido em `ConfirmacaoProducaoModal.tsx` e re-exportado; importado em `RegistrarProducaoPage` via `type DadosConfirmacaoProducao`.
- `VendaDiaria.criadoEm: string` → `new Date(resultado.criadoEm)` → válido.
- `ProducaoDiaria.criadoEm: string` → `new Date(resultado.criadoEm)` → válido.
- `useAuthStore().usuario?.nome` — `usuario` pode ser null antes do login; tratado com `?? '—'`.
