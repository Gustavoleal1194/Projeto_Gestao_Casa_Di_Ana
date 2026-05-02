# Design System Dark Premium — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: Use subagent-driven-development (recomendado) ou executing-plans para implementar este plano task a task. Os passos usam sintaxe checkbox (`- [ ]`) para rastrear progresso.

**Objetivo:** Transformar o frontend Casa di Ana de visual "sem sal" para Dark Premium SaaS — tokens escuros como padrão, 4 novos componentes, 4 componentes movidos para paths globais, e accent bars por módulo.

**Arquitetura:** Foundation First — tokens primeiro (impacto global imediato), depois novos componentes, depois mover componentes existentes e atualizar imports, depois aplicar em todas as pages, depois micro-detalhes. Cada fase produz resultado funcional e commitável.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS v4, CSS vars `--ada-*`, Heroicons 20/24, Sora + DM Sans fonts

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Modificar | `src/index.css` |
| Criar | `src/components/ui/FiltroPeriodo.tsx` |
| Criar | `src/components/ui/StatusBadge.tsx` |
| Criar | `src/components/ui/TabelaAcoesLinha.tsx` |
| Criar | `src/components/ui/KpiCard.tsx` |
| Mover + atualizar visual | `features/estoque/ingredientes/components/Toast.tsx` → `src/components/ui/Toast.tsx` |
| Mover + atualizar visual | `features/estoque/ingredientes/components/ModalDesativar.tsx` → `src/components/ui/ModalDesativar.tsx` |
| Mover + atualizar visual | `features/estoque/ingredientes/components/CampoTexto.tsx` → `src/components/form/CampoTexto.tsx` |
| Mover + atualizar visual | `features/estoque/ingredientes/components/SelectCampo.tsx` → `src/components/form/SelectCampo.tsx` |
| Atualizar imports | 40+ pages/components listados na Tarefa 10 |
| Aplicar FiltroPeriodo | 10 pages de filtro (Tarefas 11-15) |
| Aplicar StatusBadge | Pages com badge inline (Tarefa 16) |
| Aplicar TabelaAcoesLinha | Tables com ações (Tarefa 17) |
| Upgrade visual | `PageHeader`, `FilterBar`, `EmptyState`, `SkeletonTable`, `LoadingState` (Tarefa 18) |
| Accent bars | `TabelaIngredientes` + outras tabelas (Tarefa 19) |

---

## Tarefa 1: Atualizar tokens CSS para Dark Premium (impacto global)

**Arquivos:**
- Modificar: `CasaDiAna/frontend/src/index.css`

**Contexto:** O `:root` atual tem valores claros. Vamos substituí-los pelos valores dark premium — isso muda o visual em todo o sistema imediatamente. O bloco `[data-theme="dark"]` existente fica como override futuro para tema claro opcional.

- [ ] **Passo 1: Substituir os tokens `--ada-*` no bloco `:root`**

Localizar o bloco `:root` em `index.css` (linhas 34-92) e substituir apenas as vars `--ada-*` pelos valores dark premium. As vars `--sb-*`, `--topbar-*`, `--shadow-*` e `--header-h` permanecem inalteradas.

Novo conteúdo do `:root` (só a seção `--ada-*`):
```css
  /* ── Semantic design tokens (runtime, theme-switchable) ── */
  --ada-bg:           #080F1C;
  --ada-surface:      #0D1829;
  --ada-surface-2:    #111E35;
  --ada-border:       rgba(255,255,255,.07);
  --ada-border-sub:   rgba(255,255,255,.04);
  --ada-heading:      #F1F5F9;
  --ada-body:         #94A3B8;
  --ada-muted:        #475569;
  --ada-muted-dim:    #334155;
  --ada-placeholder:  #334155;
  --ada-hover:        rgba(255,255,255,.03);
  --ada-row-alert:       rgba(252,211,77,.04);
  --ada-row-alert-hover: rgba(252,211,77,.07);
  --ada-error-bg:        rgba(248,113,113,.1);
  --ada-error-border:    rgba(248,113,113,.2);
  --ada-warning-bg:      rgba(252,211,77,.1);
  --ada-warning-border:  rgba(252,211,77,.2);
  --ada-warning-badge:   rgba(252,211,77,.1);
  --ada-success-bg:      rgba(74,222,128,.1);
  --ada-success-border:  rgba(74,222,128,.2);
  --ada-warning-text:    #FCD34D;
  --ada-error-text:      #F87171;
  --ada-error-badge:     rgba(248,113,113,.1);
  --ada-success-text:    #4ADE80;
  --ada-danger-text:     #F87171;
```

- [ ] **Passo 2: Atualizar chips de filtro para âmbar no `:root`**

Localizar a classe `.filter-chip` (aprox. linha 487) e atualizar:
```css
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #D4960C;
  background: rgba(212,150,12,.1);
  border: 1px solid rgba(212,150,12,.2);
}
```

- [ ] **Passo 3: Adicionar classe `.accent-bar` e padrões glassmorphism**

Adicionar ao final de `index.css`, antes do `/* ─── Notification Panel ─────── */`:

```css
/* ─── Dark Premium — Accent Bar ─────────────────────────────────────────── */
.accent-bar {
  display: inline-block;
  width: 2px;
  height: 28px;
  border-radius: 1px;
  background: linear-gradient(180deg, #D4960C 0%, transparent 100%);
  opacity: .8;
  flex-shrink: 0;
}
.accent-bar-alert {
  background: linear-gradient(180deg, #FCD34D 0%, transparent 100%);
}

/* ─── Dark Premium — Inputs ──────────────────────────────────────────────── */
.filter-input:focus {
  border-color: rgba(212,150,12,.5);
  box-shadow: 0 0 0 3px rgba(212,150,12,.12);
}

/* ─── Dark Premium — Glow primário ──────────────────────────────────────── */
.btn-primary {
  box-shadow: 0 0 20px rgba(212,150,12,.35), 0 4px 12px rgba(0,0,0,.3);
}
.btn-primary:hover {
  box-shadow: 0 0 28px rgba(212,150,12,.45), 0 6px 16px rgba(0,0,0,.35);
}
```

- [ ] **Passo 4: Verificar tipos**

```powershell
cd CasaDiAna/frontend && npx tsc --noEmit
```
Esperado: sem erros de tipo (alteração é só CSS).

- [ ] **Passo 5: Iniciar dev server e verificar visualmente**

```powershell
npm run dev
```
Abrir `http://localhost:5173`. Verificar que o conteúdo principal ficou escuro (fundo `#080F1C`, cards `#0D1829`). A sidebar e topbar já eram escuras — devem continuar iguais.

- [ ] **Passo 6: Commit**

```powershell
git add CasaDiAna/frontend/src/index.css
git commit -m "feat(design): tokens dark premium como padrão global"
```

---

## Tarefa 2: Criar `FiltroPeriodo.tsx`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/ui/FiltroPeriodo.tsx`

Encapsula o par De/Até que aparece em 10 páginas. Gera chips formatados e bloqueia datas futuras.

- [ ] **Passo 1: Criar o componente**

```tsx
// CasaDiAna/frontend/src/components/ui/FiltroPeriodo.tsx
import type { FilterChipDef } from '@/components/ui/FilterBar'

interface FiltroPeriodoProps {
  de: string
  onChangeDe: (v: string) => void
  ate: string
  onChangeAte: (v: string) => void
  idDe?: string
  idAte?: string
  onChips?: (chips: FilterChipDef[]) => void
}

function formatarData(iso: string): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function FiltroPeriodo({
  de,
  onChangeDe,
  ate,
  onChangeAte,
  idDe = 'filtro-de',
  idAte = 'filtro-ate',
}: FiltroPeriodoProps) {
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <>
      <div>
        <label htmlFor={idDe} className="filter-label">De</label>
        <input
          id={idDe}
          type="date"
          className="filter-input"
          value={de}
          max={hoje}
          onChange={e => onChangeDe(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={idAte} className="filter-label">Até</label>
        <input
          id={idAte}
          type="date"
          className="filter-input"
          value={ate}
          max={hoje}
          onChange={e => onChangeAte(e.target.value)}
        />
      </div>
    </>
  )
}

export function gerarChipsPeriodo(
  de: string,
  ate: string,
  onLimparDe: () => void,
  onLimparAte: () => void,
): FilterChipDef[] {
  const chips: FilterChipDef[] = []
  if (de) chips.push({ label: `De: ${formatarData(de)}`, onRemove: onLimparDe })
  if (ate) chips.push({ label: `Até: ${formatarData(ate)}`, onRemove: onLimparAte })
  return chips
}
```

- [ ] **Passo 2: Verificar tipos**

```powershell
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Passo 3: Commit**

```powershell
git add CasaDiAna/frontend/src/components/ui/FiltroPeriodo.tsx
git commit -m "feat(components): criar FiltroPeriodo com bloqueio de datas futuras"
```

---

## Tarefa 3: Criar `StatusBadge.tsx`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/ui/StatusBadge.tsx`

Substitui todos os `<span className="badge badge-*">` e variações inline.

- [ ] **Passo 1: Criar o componente**

```tsx
// CasaDiAna/frontend/src/components/ui/StatusBadge.tsx
export type BadgeVariante = 'ativo' | 'inativo' | 'baixo' | 'critico' | 'info'

interface StatusBadgeProps {
  variante: BadgeVariante
  label?: string
}

const config: Record<BadgeVariante, { dot: string; bg: string; border: string; text: string; defaultLabel: string }> = {
  ativo:   { dot: '#4ADE80', bg: 'rgba(74,222,128,.1)',  border: 'rgba(74,222,128,.2)',  text: '#4ADE80', defaultLabel: 'Ativo' },
  inativo: { dot: '#64748B', bg: 'rgba(148,163,184,.08)', border: 'rgba(148,163,184,.12)', text: '#64748B', defaultLabel: 'Inativo' },
  baixo:   { dot: '#FCD34D', bg: 'rgba(252,211,77,.1)',  border: 'rgba(252,211,77,.2)',  text: '#FCD34D', defaultLabel: 'Baixo' },
  critico: { dot: '#F87171', bg: 'rgba(248,113,113,.1)', border: 'rgba(248,113,113,.2)', text: '#F87171', defaultLabel: 'Crítico' },
  info:    { dot: '#93C5FD', bg: 'rgba(147,197,253,.1)', border: 'rgba(147,197,253,.2)', text: '#93C5FD', defaultLabel: 'Info' },
}

export function StatusBadge({ variante, label }: StatusBadgeProps) {
  const c = config[variante]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 6, height: 6, background: c.dot }}
        aria-hidden="true"
      />
      {label ?? c.defaultLabel}
    </span>
  )
}
```

- [ ] **Passo 2: Verificar tipos**

```powershell
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Passo 3: Commit**

```powershell
git add CasaDiAna/frontend/src/components/ui/StatusBadge.tsx
git commit -m "feat(components): criar StatusBadge com variantes dark premium"
```

---

## Tarefa 4: Criar `TabelaAcoesLinha.tsx`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/ui/TabelaAcoesLinha.tsx`

Padroniza os botões editar/desativar com `opacity-0 group-hover:opacity-100`.

- [ ] **Passo 1: Criar o componente**

```tsx
// CasaDiAna/frontend/src/components/ui/TabelaAcoesLinha.tsx
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'

interface TabelaAcoesLinhaProps {
  onEditar?: () => void
  onDesativar?: () => void
  labelEditar?: string
  labelDesativar?: string
}

export function TabelaAcoesLinha({ onEditar, onDesativar, labelEditar, labelDesativar }: TabelaAcoesLinhaProps) {
  if (!onEditar && !onDesativar) return null

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {onEditar && (
        <button
          type="button"
          onClick={onEditar}
          aria-label={labelEditar ?? 'Editar'}
          className="p-1.5 rounded-lg border-none cursor-pointer outline-none transition-all duration-150"
          style={{ color: 'var(--ada-muted)', background: 'transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#D4960C'
            e.currentTarget.style.background = 'rgba(212,150,12,.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--ada-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {onDesativar && (
        <button
          type="button"
          onClick={onDesativar}
          aria-label={labelDesativar ?? 'Desativar'}
          className="p-1.5 rounded-lg border-none cursor-pointer outline-none transition-all duration-150"
          style={{ color: 'var(--ada-muted)', background: 'transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#F87171'
            e.currentTarget.style.background = 'rgba(239,68,68,.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--ada-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Verificar tipos**

```powershell
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Passo 3: Commit**

```powershell
git add CasaDiAna/frontend/src/components/ui/TabelaAcoesLinha.tsx
git commit -m "feat(components): criar TabelaAcoesLinha com hover âmbar/vermelho"
```

---

## Tarefa 5: Criar `KpiCard.tsx`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/ui/KpiCard.tsx`

Card de métrica com glow e glassmorphism para dashboard e futuras páginas de overview.

- [ ] **Passo 1: Criar o componente**

```tsx
// CasaDiAna/frontend/src/components/ui/KpiCard.tsx
export type KpiVariante = 'amber' | 'green' | 'yellow' | 'blue'

interface KpiCardProps {
  valor: string | number
  label: string
  tendencia?: string
  variante?: KpiVariante
}

const varConfig: Record<KpiVariante, { color: string; glow: string; gradient: string }> = {
  amber:  { color: '#D4960C', glow: 'rgba(212,150,12,.4)',  gradient: 'rgba(212,150,12,.12)' },
  green:  { color: '#4ADE80', glow: 'rgba(74,222,128,.4)',  gradient: 'rgba(74,222,128,.12)' },
  yellow: { color: '#FCD34D', glow: 'rgba(252,211,77,.4)',  gradient: 'rgba(252,211,77,.12)' },
  blue:   { color: '#93C5FD', glow: 'rgba(147,197,253,.4)', gradient: 'rgba(147,197,253,.12)' },
}

export function KpiCard({ valor, label, tendencia, variante = 'amber' }: KpiCardProps) {
  const v = varConfig[variante]
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,.025)',
        border: '1px solid rgba(255,255,255,.07)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Linha de gradiente no topo */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${v.gradient} 0%, ${v.color} 50%, ${v.gradient} 100%)` }}
        aria-hidden="true"
      />
      <p
        className="text-[11px] font-semibold uppercase tracking-[.08em] mb-2"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-bold tabular-nums leading-none"
        style={{ color: v.color, textShadow: `0 0 24px ${v.glow}`, fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {valor}
      </p>
      {tendencia && (
        <p className="text-xs mt-2" style={{ color: 'var(--ada-muted)' }}>
          {tendencia}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Verificar tipos**

```powershell
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Passo 3: Commit**

```powershell
git add CasaDiAna/frontend/src/components/ui/KpiCard.tsx
git commit -m "feat(components): criar KpiCard com glow e glassmorphism dark premium"
```

---

## Tarefa 6: Mover Toast para `components/ui/`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/ui/Toast.tsx` (conteúdo movido do original)
- Deletar: `CasaDiAna/frontend/src/features/estoque/ingredientes/components/Toast.tsx`

- [ ] **Passo 1: Criar `src/components/ui/Toast.tsx`**

Conteúdo idêntico ao original (nenhuma mudança de API, o visual já usa CSS vars que agora são dark):

```tsx
// CasaDiAna/frontend/src/components/ui/Toast.tsx
import { useEffect } from 'react'

interface Props {
  tipo: 'sucesso' | 'erro' | 'aviso'
  mensagem: string
  onFechar: () => void
  duracao?: number
}

const estilos: Record<Props['tipo'], { bg: string; border: string; text: string; icon: string }> = {
  sucesso: {
    bg: 'var(--ada-success-bg)',
    border: 'var(--ada-success-border)',
    text: 'var(--ada-success-text)',
    icon: '✓',
  },
  erro: {
    bg: 'var(--ada-error-bg)',
    border: 'var(--ada-error-border)',
    text: 'var(--ada-error-text)',
    icon: '✕',
  },
  aviso: {
    bg: 'var(--ada-warning-bg)',
    border: 'var(--ada-warning-border)',
    text: 'var(--ada-warning-text)',
    icon: '!',
  },
}

export function Toast({ tipo, mensagem, onFechar, duracao = 4000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onFechar, duracao)
    return () => clearTimeout(t)
  }, [onFechar, duracao])

  const s = estilos[tipo]

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        animation: 'toastIn 300ms cubic-bezier(0.34,1.56,0.64,1) both',
        maxWidth: '360px',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
          background: s.border,
        }}
        aria-hidden="true"
      >
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{mensagem}</span>
      <button
        onClick={onFechar}
        aria-label="Fechar notificação"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.6,
          fontSize: '1rem',
          lineHeight: 1,
          padding: '0 0.25rem',
        }}
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Passo 2: Deletar o arquivo original**

```powershell
Remove-Item "CasaDiAna/frontend/src/features/estoque/ingredientes/components/Toast.tsx"
```

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```
Esperado: erros de "cannot find module" nos arquivos que importam do path antigo — serão corrigidos na Tarefa 10.

- [ ] **Passo 4: Commit**

```powershell
git add CasaDiAna/frontend/src/components/ui/Toast.tsx
git add "CasaDiAna/frontend/src/features/estoque/ingredientes/components/Toast.tsx"
git commit -m "refactor(components): mover Toast para components/ui/"
```

---

## Tarefa 7: Mover ModalDesativar para `components/ui/`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/ui/ModalDesativar.tsx`
- Deletar: `CasaDiAna/frontend/src/features/estoque/ingredientes/components/ModalDesativar.tsx`

- [ ] **Passo 1: Criar `src/components/ui/ModalDesativar.tsx`**

Conteúdo idêntico ao atual (já foi atualizado com prop `entidade` na sessão anterior):

```tsx
// CasaDiAna/frontend/src/components/ui/ModalDesativar.tsx
import { useEffect } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  nome: string
  entidade?: string
  loading: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export function ModalDesativar({ nome, entidade = 'ingrediente', loading, onConfirmar, onCancelar }: Props) {
  const titulo = `Desativar ${entidade.charAt(0).toUpperCase() + entidade.slice(1)}`

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancelar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [loading, onCancelar])

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      aria-describedby="modal-descricao"
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancelar() }}
    >
      <div className="modal-card max-w-[400px]">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)' }}
            >
              <ExclamationTriangleIcon className="h-5 w-5" style={{ color: '#F87171' }} aria-hidden="true" />
            </div>
            <h2
              id="modal-titulo"
              className="text-[15px] font-semibold"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              {titulo}
            </h2>
          </div>
          <button
            onClick={onCancelar}
            disabled={loading}
            className="p-1.5 rounded-lg transition-colors duration-150 outline-none
                       focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                       disabled:opacity-40"
            aria-label="Fechar"
            style={{ color: 'var(--ada-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p
            id="modal-descricao"
            className="text-sm leading-relaxed"
            style={{ color: 'var(--ada-body)' }}
          >
            Deseja desativar{' '}
            <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
              "{nome}"
            </span>
            ? Este item não aparecerá mais nas listagens ativas. Esta ação pode ser revertida.
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancelar} disabled={loading} className="btn-secondary disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={loading} className="btn-danger disabled:opacity-60 disabled:cursor-not-allowed">
            {loading && <Spinner />}
            {loading ? 'Desativando…' : 'Desativar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Passo 2: Deletar o arquivo original**

```powershell
Remove-Item "CasaDiAna/frontend/src/features/estoque/ingredientes/components/ModalDesativar.tsx"
```

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```
Esperado: erros de "cannot find module" — serão corrigidos na Tarefa 10.

- [ ] **Passo 4: Commit**

```powershell
git add CasaDiAna/frontend/src/components/ui/ModalDesativar.tsx
git add "CasaDiAna/frontend/src/features/estoque/ingredientes/components/ModalDesativar.tsx"
git commit -m "refactor(components): mover ModalDesativar para components/ui/"
```

---

## Tarefa 8: Mover CampoTexto para `components/form/`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/form/CampoTexto.tsx`
- Deletar: `CasaDiAna/frontend/src/features/estoque/ingredientes/components/CampoTexto.tsx`

- [ ] **Passo 1: Criar `src/components/form/CampoTexto.tsx`**

```tsx
// CasaDiAna/frontend/src/components/form/CampoTexto.tsx
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
  sufixo?: string
}

export function CampoTexto({ label, erro, obrigatorio, sufixo, className, id, ...props }: Props) {
  const inputId = id ?? `campo-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}{obrigatorio && <span className="ml-0.5" style={{ color: '#F87171' }} aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-required={obrigatorio}
          aria-invalid={!!erro}
          className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 ${className ?? ''}`}
          style={{
            background: 'rgba(255,255,255,.05)',
            border: `1px solid ${erro ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)'}`,
            color: 'var(--ada-heading)',
            paddingRight: sufixo ? '2.5rem' : undefined,
          }}
          {...props}
        />
        {sufixo && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--ada-muted)' }}
          >
            {sufixo}
          </span>
        )}
      </div>
      {erro && (
        <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Deletar o arquivo original**

```powershell
Remove-Item "CasaDiAna/frontend/src/features/estoque/ingredientes/components/CampoTexto.tsx"
```

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```

- [ ] **Passo 4: Commit**

```powershell
git add CasaDiAna/frontend/src/components/form/CampoTexto.tsx
git add "CasaDiAna/frontend/src/features/estoque/ingredientes/components/CampoTexto.tsx"
git commit -m "refactor(components): mover CampoTexto para components/form/ com visual dark premium"
```

---

## Tarefa 9: Mover SelectCampo para `components/form/`

**Arquivos:**
- Criar: `CasaDiAna/frontend/src/components/form/SelectCampo.tsx`
- Deletar: `CasaDiAna/frontend/src/features/estoque/ingredientes/components/SelectCampo.tsx`

- [ ] **Passo 1: Criar `src/components/form/SelectCampo.tsx`**

```tsx
// CasaDiAna/frontend/src/components/form/SelectCampo.tsx
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

export function SelectCampo({ label, erro, obrigatorio, opcoes, placeholderOpcao, className, id, ...props }: Props) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}{obrigatorio && <span className="ml-0.5" style={{ color: '#F87171' }} aria-hidden="true">*</span>}
      </label>
      <select
        id={selectId}
        aria-required={obrigatorio}
        aria-invalid={!!erro}
        className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 appearance-none ${className ?? ''}`}
        style={{
          background: 'rgba(255,255,255,.05)',
          border: `1px solid ${erro ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)'}`,
          color: 'var(--ada-heading)',
          colorScheme: 'dark',
        }}
        {...props}
      >
        {placeholderOpcao && <option value="">{placeholderOpcao}</option>}
        {opcoes.map(o => (
          <option key={o.valor} value={o.valor}>{o.rotulo}</option>
        ))}
      </select>
      {erro && (
        <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Deletar o arquivo original**

```powershell
Remove-Item "CasaDiAna/frontend/src/features/estoque/ingredientes/components/SelectCampo.tsx"
```

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```

- [ ] **Passo 4: Commit**

```powershell
git add CasaDiAna/frontend/src/components/form/SelectCampo.tsx
git add "CasaDiAna/frontend/src/features/estoque/ingredientes/components/SelectCampo.tsx"
git commit -m "refactor(components): mover SelectCampo para components/form/ com visual dark premium"
```

---

## Tarefa 10: Atualizar todos os imports para novos paths

**Arquivos a modificar** (cada arquivo: trocar só a linha de import afetada):

### Toast → `@/components/ui/Toast`

| Arquivo | Import antigo |
|---|---|
| `features/usuarios/pages/UsuariosPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/estoque/categorias/pages/CategoriasPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/estoque/correcao/pages/CorrecaoEstoquePage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/entradas/pages/EntradaFormPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/entradas/pages/EntradaDetalhePage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/produtos/pages/ProdutosPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/produtos/pages/ProdutoFormPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/produtos/pages/FichaTecnicaPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/inventarios/pages/InventarioFormPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/inventarios/pages/InventarioDetalhePage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/categorias-produto/pages/CategoriasProdutoPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/producao/perdas/pages/PerdasPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/fornecedores/pages/FornecedorFormPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/fornecedores/pages/FornecedoresPage.tsx` | `@/features/estoque/ingredientes/components/Toast` |
| `features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | `../components/Toast` |

### ModalDesativar → `@/components/ui/ModalDesativar`

| Arquivo | Import antigo |
|---|---|
| `features/estoque/categorias/pages/CategoriasPage.tsx` | `@/features/estoque/ingredientes/components/ModalDesativar` |
| `features/producao/produtos/pages/ProdutosPage.tsx` | `@/features/estoque/ingredientes/components/ModalDesativar` |
| `features/producao/categorias-produto/pages/CategoriasProdutoPage.tsx` | `@/features/estoque/ingredientes/components/ModalDesativar` |
| `features/fornecedores/pages/FornecedoresPage.tsx` | `@/features/estoque/ingredientes/components/ModalDesativar` |
| `features/estoque/ingredientes/pages/IngredientesPage.tsx` | `../components/ModalDesativar` |

### CampoTexto → `@/components/form/CampoTexto`

| Arquivo | Import antigo |
|---|---|
| `features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/estoque/categorias/components/ModalCategoria.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/entradas/pages/EntradaFormPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/fornecedores/pages/FornecedorFormPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/producao/produtos/pages/ProdutoFormPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/producao/produtos/pages/FichaTecnicaPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/inventarios/pages/InventarioFormPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/producao/categorias-produto/components/ModalCategoriaProduto.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/inventarios/pages/InventarioDetalhePage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/producao/perdas/pages/PerdasPage.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/producao/importacao-vendas/components/QuickCreateProductModal.tsx` | `@/features/estoque/ingredientes/components/CampoTexto` |
| `features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | `../components/CampoTexto` |

### SelectCampo → `@/components/form/SelectCampo`

| Arquivo | Import antigo |
|---|---|
| `features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/entradas/pages/EntradaFormPage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/producao/produtos/pages/ProdutoFormPage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/producao/produtos/pages/FichaTecnicaPage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/inventarios/pages/InventarioDetalhePage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/producao/perdas/pages/PerdasPage.tsx` | `@/features/estoque/ingredientes/components/SelectCampo` |
| `features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | `../components/SelectCampo` |

- [ ] **Passo 1: Executar substituição global de imports**

```powershell
# Dentro de CasaDiAna/frontend/src/
# Executar cada substituição com sed ou com o Edit tool para cada arquivo
# Abordagem mais segura: editar arquivo por arquivo usando o Edit tool
# (ver passos 2-5 abaixo para os grupos principais)
```

- [ ] **Passo 2: Substituir imports de Toast**

Para cada arquivo da tabela Toast, localizar e substituir:
- `from '@/features/estoque/ingredientes/components/Toast'` → `from '@/components/ui/Toast'`
- `from '../components/Toast'` → `from '@/components/ui/Toast'` (nos arquivos dentro de `ingredientes/pages/`)

- [ ] **Passo 3: Substituir imports de ModalDesativar**

Para cada arquivo da tabela ModalDesativar, localizar e substituir:
- `from '@/features/estoque/ingredientes/components/ModalDesativar'` → `from '@/components/ui/ModalDesativar'`
- `from '../components/ModalDesativar'` → `from '@/components/ui/ModalDesativar'`

- [ ] **Passo 4: Substituir imports de CampoTexto e SelectCampo**

Para cada arquivo das tabelas CampoTexto/SelectCampo:
- `from '@/features/estoque/ingredientes/components/CampoTexto'` → `from '@/components/form/CampoTexto'`
- `from '@/features/estoque/ingredientes/components/SelectCampo'` → `from '@/components/form/SelectCampo'`
- `from '../components/CampoTexto'` → `from '@/components/form/CampoTexto'`
- `from '../components/SelectCampo'` → `from '@/components/form/SelectCampo'`

- [ ] **Passo 5: Verificar tipos — deve ser zero erros**

```powershell
npx tsc --noEmit
```
Esperado: **0 erros**. Se houver erros de "cannot find module", algum import foi esquecido — localizar com `grep -r "ingredientes/components" src/`.

- [ ] **Passo 6: Build completo**

```powershell
npm run build
```
Esperado: build sem erros.

- [ ] **Passo 7: Commit**

```powershell
git add -u
git commit -m "refactor(imports): atualizar todos os imports para novos paths de componentes globais"
```

---

## Tarefa 11: Aplicar FiltroPeriodo — EntradasPage e ProducaoDiariaPage

**Arquivos:**
- Modificar: `src/features/entradas/pages/EntradasPage.tsx`
- Modificar: `src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx`

- [ ] **Passo 1: Ler EntradasPage.tsx e identificar os inputs De/Até**

Localizar os dois `<input type="date">` com labels "De" e "Até" e o estado correspondente (`de`, `setDe`, `ate`, `setAte` ou nomes similares).

- [ ] **Passo 2: Substituir o par De/Até em EntradasPage por FiltroPeriodo**

Adicionar ao topo do arquivo:
```tsx
import { FiltroPeriodo, gerarChipsPeriodo } from '@/components/ui/FiltroPeriodo'
```

Substituir os dois `<div>` com `<input type="date">` por:
```tsx
<FiltroPeriodo
  de={de}
  onChangeDe={setDe}
  ate={ate}
  onChangeAte={setAte}
/>
```

Se a page usa `FilterChipDef` para chips de período, substituir a lógica de geração pelos chips retornados por `gerarChipsPeriodo(de, ate, () => setDe(''), () => setAte(''))` e mesclá-los com os outros chips existentes.

- [ ] **Passo 3: Repetir para ProducaoDiariaPage.tsx**

Mesma substituição: identificar inputs De/Até e substituir por `<FiltroPeriodo>`.

- [ ] **Passo 4: Verificar tipos**

```powershell
npx tsc --noEmit
```

- [ ] **Passo 5: Commit**

```powershell
git add CasaDiAna/frontend/src/features/entradas/pages/EntradasPage.tsx
git add CasaDiAna/frontend/src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx
git commit -m "feat(filtros): aplicar FiltroPeriodo em EntradasPage e ProducaoDiariaPage"
```

---

## Tarefa 12: Aplicar FiltroPeriodo — VendasDiariasPage e PerdasPage

**Arquivos:**
- Modificar: `src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx`
- Modificar: `src/features/producao/perdas/pages/PerdasPage.tsx`

- [ ] **Passo 1: Substituir inputs De/Até em VendasDiariasPage**

Seguir o mesmo padrão da Tarefa 11.

- [ ] **Passo 2: Substituir inputs De/Até em PerdasPage**

Seguir o mesmo padrão da Tarefa 11.

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```

- [ ] **Passo 4: Commit**

```powershell
git add CasaDiAna/frontend/src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx
git add CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx
git commit -m "feat(filtros): aplicar FiltroPeriodo em VendasDiariasPage e PerdasPage"
```

---

## Tarefa 13: Aplicar FiltroPeriodo — MovimentacoesPage e InsumosProducaoPage

**Arquivos:**
- Modificar: `src/features/relatorios/pages/MovimentacoesPage.tsx`
- Modificar: `src/features/relatorios/pages/InsumosProducaoPage.tsx`

- [ ] **Passo 1: Substituir inputs De/Até em MovimentacoesPage**
- [ ] **Passo 2: Substituir inputs De/Até em InsumosProducaoPage**

- [ ] **Passo 3: Verificar tipos e commitar**

```powershell
npx tsc --noEmit
git add CasaDiAna/frontend/src/features/relatorios/pages/MovimentacoesPage.tsx
git add CasaDiAna/frontend/src/features/relatorios/pages/InsumosProducaoPage.tsx
git commit -m "feat(filtros): aplicar FiltroPeriodo em MovimentacoesPage e InsumosProducaoPage"
```

---

## Tarefa 14: Aplicar FiltroPeriodo — EntradasRelatorioPage e ProducaoVendasRelatorioPage

**Arquivos:**
- Modificar: `src/features/relatorios/pages/EntradasRelatorioPage.tsx`
- Modificar: `src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx`

- [ ] **Passo 1: Substituir inputs De/Até em EntradasRelatorioPage**
- [ ] **Passo 2: Substituir inputs De/Até em ProducaoVendasRelatorioPage**

- [ ] **Passo 3: Verificar tipos e commitar**

```powershell
npx tsc --noEmit
git add CasaDiAna/frontend/src/features/relatorios/pages/EntradasRelatorioPage.tsx
git add CasaDiAna/frontend/src/features/relatorios/pages/ProducaoVendasRelatorioPage.tsx
git commit -m "feat(filtros): aplicar FiltroPeriodo em EntradasRelatorio e ProducaoVendasRelatorio"
```

---

## Tarefa 15: Aplicar FiltroPeriodo — ComparacaoPrecoPage e DashboardPage

**Arquivos:**
- Modificar: `src/features/relatorios/pages/ComparacaoPrecoPage.tsx`
- Modificar: `src/features/dashboard/pages/DashboardPage.tsx`

- [ ] **Passo 1: Substituir inputs De/Até em ComparacaoPrecoPage**
- [ ] **Passo 2: Substituir inputs De/Até em DashboardPage**

- [ ] **Passo 3: Verificar tipos e commitar**

```powershell
npx tsc --noEmit
git add CasaDiAna/frontend/src/features/relatorios/pages/ComparacaoPrecoPage.tsx
git add CasaDiAna/frontend/src/features/dashboard/pages/DashboardPage.tsx
git commit -m "feat(filtros): aplicar FiltroPeriodo em ComparacaoPrecoPage e DashboardPage"
```

---

## Tarefa 16: Aplicar StatusBadge em todas as tabelas

**Arquivos a modificar:** Qualquer page/tabela que renderize `<span className="badge badge-active">`, `<span className="badge badge-inactive">`, `<span className="badge badge-warning">` ou badges inline similares.

**Como identificar:** `grep -r "badge badge-\|badge-active\|badge-inactive" src/ --include="*.tsx"`

- [ ] **Passo 1: Grep para localizar todos os usos**

```powershell
grep -r "badge badge-\|badge-active\|badge-inactive\|badge-warning" CasaDiAna/frontend/src --include="*.tsx" -l
```

- [ ] **Passo 2: Para cada arquivo encontrado, adicionar import e substituir**

Adicionar ao topo:
```tsx
import { StatusBadge } from '@/components/ui/StatusBadge'
```

Padrão de substituição:
```tsx
// Antes:
<span className="badge badge-active">Ativo</span>
// Depois:
<StatusBadge variante="ativo" />

// Antes:
<span className="badge badge-inactive">Inativo</span>
// Depois:
<StatusBadge variante="inativo" />

// Antes:
<span className="badge badge-warning">Baixo Estoque</span>
// Depois:
<StatusBadge variante="baixo" label="Baixo Estoque" />
```

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```

- [ ] **Passo 4: Commit**

```powershell
git add -u
git commit -m "feat(design): substituir badges inline por StatusBadge dark premium"
```

---

## Tarefa 17: Aplicar TabelaAcoesLinha nas tabelas com botões editar/desativar

**Arquivos a modificar:** Tabelas que têm `opacity-0 group-hover:opacity-100` com botões editar/desativar inline.

**Como identificar:** `grep -r "row-action-btn\|opacity-0 group-hover" src/ --include="*.tsx" -l`

- [ ] **Passo 1: Grep para localizar todos os usos**

```powershell
grep -r "row-action-btn\|opacity-0 group-hover" CasaDiAna/frontend/src --include="*.tsx" -l
```

- [ ] **Passo 2: Para cada tabela encontrada, substituir o padrão inline por TabelaAcoesLinha**

Adicionar import:
```tsx
import { TabelaAcoesLinha } from '@/components/ui/TabelaAcoesLinha'
```

Substituir o padrão:
```tsx
// Antes (na <td> de ações):
<td className={`${tdCls} text-right`}>
  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
    {podeEditar && (
      <button onClick={() => onEditar(item.id)} aria-label={`Editar ${item.nome}`} className="row-action-btn">
        <PencilSquareIcon className="h-4 w-4" />
      </button>
    )}
    {podeDesativar && (
      <button onClick={() => onDesativar(item)} aria-label={`Desativar ${item.nome}`} className="row-action-btn danger">
        <TrashIcon className="h-4 w-4" />
      </button>
    )}
  </div>
</td>

// Depois:
<td className={`${tdCls} text-right group`}>
  <TabelaAcoesLinha
    onEditar={podeEditar ? () => onEditar(item.id) : undefined}
    onDesativar={podeDesativar ? () => onDesativar(item) : undefined}
    labelEditar={`Editar ${item.nome}`}
    labelDesativar={`Desativar ${item.nome}`}
  />
</td>
```

**Atenção:** O `className="group"` deve ficar na `<td>` (não no `<tr>`) para que o `group-hover` funcione corretamente com o componente.

- [ ] **Passo 3: Verificar tipos**

```powershell
npx tsc --noEmit
```

- [ ] **Passo 4: Commit**

```powershell
git add -u
git commit -m "feat(design): aplicar TabelaAcoesLinha em todas as tabelas com ações"
```

---

## Tarefa 18: Upgrade visual dos componentes existentes

**Arquivos:**
- Modificar: `src/components/ui/PageHeader.tsx`
- Modificar: `src/components/ui/FilterBar.tsx`
- Modificar: `src/components/ui/EmptyState.tsx`
- Modificar: `src/components/ui/SkeletonTable.tsx`
- Modificar: `src/components/ui/LoadingState.tsx`

Estes componentes já usam CSS vars `--ada-*`, portanto a atualização de tokens na Tarefa 1 já os melhorou automaticamente. Esta tarefa adiciona refinamentos específicos.

- [ ] **Passo 1: Atualizar PageHeader — adicionar letter-spacing e peso**

Localizar em `PageHeader.tsx` a classe `page-header-title` e adicionar em `index.css`:
```css
.page-header-title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;  /* era -0.025em */
  color: var(--ada-heading);
  font-family: 'Sora', system-ui, sans-serif;
}
```

- [ ] **Passo 2: Atualizar FilterBar — glassmorphism**

Em `index.css`, atualizar a classe `.filter-bar`:
```css
.filter-bar {
  background: rgba(255,255,255,.025);
  border-bottom: 1px solid rgba(255,255,255,.07);
  border-radius: 0;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  box-shadow: var(--shadow-xs);
  backdrop-filter: blur(8px);
}
```

- [ ] **Passo 3: Verificar tipos e commitar**

```powershell
npx tsc --noEmit
git add CasaDiAna/frontend/src/index.css
git commit -m "feat(design): upgrade visual glassmorphism em FilterBar e PageHeader"
```

---

## Tarefa 19: Accent bars e fundo de alerta em TabelaIngredientes

**Arquivo:**
- Modificar: `src/features/estoque/ingredientes/components/TabelaIngredientes.tsx`

- [ ] **Passo 1: Adicionar accent bar na coluna Nome**

Localizar a `<td>` de nome (aprox. linha 87) e envolver o nome em um flex com accent bar:

```tsx
<td className={tdCls}>
  <div className="flex items-center gap-2.5">
    <span
      className={`accent-bar shrink-0 ${ing.estaBaixoDoMinimo ? 'accent-bar-alert' : ''}`}
      aria-hidden="true"
    />
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        {ing.nome}
      </span>
      {ing.estaBaixoDoMinimo && (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold shrink-0"
          style={{ background: 'var(--ada-warning-badge)', color: 'var(--ada-warning-text)', border: '1px solid var(--ada-warning-border)' }}
        >
          <ExclamationTriangleIcon className="h-3 w-3" aria-hidden="true" />
          Baixo
        </span>
      )}
    </div>
  </div>
</td>
```

- [ ] **Passo 2: Verificar visual no browser**

```powershell
npm run dev
```
Navegar até `/ingredientes`. Verificar:
- Accent bar âmbar visível em linhas normais
- Accent bar amarela em linhas abaixo do mínimo
- Fundo levemente âmbar nas linhas de alerta

- [ ] **Passo 3: Commit**

```powershell
git add CasaDiAna/frontend/src/features/estoque/ingredientes/components/TabelaIngredientes.tsx
git commit -m "feat(design): accent bars dark premium em TabelaIngredientes"
```

---

## Tarefa 20: Commit final e push

- [ ] **Passo 1: Verificação final de tipos**

```powershell
npx tsc --noEmit
```
Esperado: 0 erros.

- [ ] **Passo 2: Build final**

```powershell
npm run build
```
Esperado: build sem erros.

- [ ] **Passo 3: Push**

```powershell
git push
```

---

## Notas de implementação

**Ordem obrigatória:**
- Tarefas 6-9 (mover componentes) **antes** da Tarefa 10 (atualizar imports)
- Tarefa 1 (tokens) pode ser feita em paralelo com as demais, mas deve ser commitada primeiro para que o resultado visual seja imediato

**Fora de escopo (não tocar):**
- `features/auth/` — visual próprio com animações elaboradas
- `type="date"` em formulários de registro com `dataValidade` — aceitam datas futuras
- Backend / API — zero mudanças

**Verificação de type-check:**
- Rodar `npx tsc --noEmit` dentro de `CasaDiAna/frontend/` (não na raiz do monorepo)
- O projeto usa React 19 + TypeScript 5.9 — sem configuração adicional necessária
