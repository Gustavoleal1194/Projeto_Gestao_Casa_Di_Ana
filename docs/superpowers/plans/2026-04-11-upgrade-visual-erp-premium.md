# Upgrade Visual ERP Premium — Casa di Ana

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar o frontend do Casa di Ana ao padrão visual de ERPs premium (SAP Fiori / Linear), aplicando as melhorias P0 → P1 → P2 identificadas na auditoria completa das 17 páginas com dados reais de março/2026.

**Architecture:** Todas as mudanças são puramente de UI — sem alteração de lógica de negócio, rotas, serviços ou estado global. Os tokens CSS já existem em `src/index.css`; o plano os expande e aplica sistematicamente. Novos componentes compartilhados vão para `src/components/`. Páginas existentes são refatoradas para usar esses componentes.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS v4, CSS Custom Properties (design tokens em `index.css`), Heroicons, Recharts (já instalado via echarts-for-react no dashboard — não instalar nada novo).

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `src/index.css` | Modificar — novos tokens, `.page-header`, `.notification-panel`, `.skeleton`, sticky table header, density, enums PT-BR |
| `src/components/layout/TopHeader.tsx` | Modificar — adicionar `NotificationDropdown` inline |
| `src/components/layout/Sidebar.tsx` | Modificar — ícones coloridos por módulo |
| `src/components/ui/PageHeader.tsx` | Criar — cabeçalho padronizado com breadcrumb |
| `src/components/ui/EmptyState.tsx` | Criar — empty state com ícone colorido + CTA |
| `src/components/ui/SkeletonTable.tsx` | Criar — skeleton loader para tabelas |
| `src/features/dashboard/pages/DashboardPage.tsx` | Modificar — layout 3+2, DashboardCard com hover CSS, subtexto melhorado |
| `src/features/estoque/ingredientes/pages/IngredientesPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/estoque/categorias/pages/CategoriasPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/fornecedores/pages/FornecedoresPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/producao/produtos/pages/ProdutosPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/producao/producao-diaria/pages/ProducaoDiariaPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/producao/vendas-diarias/pages/VendasDiariasPage.tsx` | Modificar — usar PageHeader + EmptyState |
| `src/features/producao/perdas/pages/PerdasPage.tsx` | Modificar — usar PageHeader + EmptyState |
| `src/features/entradas/pages/EntradasPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/inventarios/pages/InventariosPage.tsx` | Modificar — usar PageHeader + EmptyState + SkeletonTable |
| `src/features/relatorios/pages/MovimentacoesPage.tsx` | Modificar — enums PT-BR, coluna Referência com truncate+title |
| `src/features/notificacoes/pages/NotificacoesPage.tsx` | Modificar — usar PageHeader, botão "marcar lida" sem inline hover |
| `src/features/usuarios/pages/UsuariosPage.tsx` | Modificar — usar PageHeader + EmptyState |

---

## Task 1: Tokens CSS e Utilitários Globais

**Arquivo:** `src/index.css`

Adicionar/atualizar: fundo cinza frio, bordas mais frias, header 60px, density das tabelas, sticky thead, skeleton animation, `.page-header` CSS, enums PT-BR no filtro de movimentações (via classe de label), `.notification-panel`.

- [ ] **Step 1: Atualizar tokens de cor e layout**

Abrir `src/index.css`. Localizar o bloco `:root {` e substituir os tokens a seguir (manter todos os outros intactos):

```css
/* dentro de :root { ... } — substituir apenas estas linhas */
--header-h: 60px;          /* era 52px */
--ada-bg:          #F7F8FA;   /* era #F5F3EF — cinza frio neutro, não bege */
--ada-surface-2:   #F0F2F5;   /* era #FAFAF8 — mais contraste */
--ada-border:      #E2E8F0;   /* era #E4DDD3 — mais frio/moderno */
--ada-border-sub:  #EDF2F7;   /* era #EEEBE5 */
```

E no bloco `[data-theme="dark"]` manter como está (já usa tokens semânticos, não muda).

- [ ] **Step 2: Adicionar classes de tabela com density correta e sticky header**

No final de `src/index.css`, antes do último comentário, adicionar:

```css
/* ─── Table density — compacto (ERP padrão) ─────────────────────────────── */
.table-th { padding: 0.625rem 1.25rem; }   /* era 0.75rem — mais compacto */
.table-td { padding: 0.625rem 1.25rem; }   /* era 0.875rem */

/* Sticky table header */
.ada-surface-card table thead {
  position: sticky;
  top: 0;
  z-index: 2;
}
.ada-surface-card table thead th {
  white-space: nowrap;   /* evita cabeçalho em 2 linhas */
}

/* Referência truncada com ellipsis */
.cell-truncate {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 3: Adicionar `.page-header` CSS**

```css
/* ─── Page Header ────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-header-left { min-width: 0; }
.page-header-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ada-heading);
  font-family: 'Sora', system-ui, sans-serif;
  margin: 0;
}
.page-header-subtitle {
  font-size: 0.8125rem;
  color: var(--ada-muted);
  margin-top: 0.125rem;
}
.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--ada-muted);
  margin-bottom: 0.25rem;
  font-family: 'Sora', system-ui, sans-serif;
}
.page-breadcrumb span { opacity: 0.5; }
.page-header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
@media (max-width: 639px) {
  .page-header { flex-direction: column; }
  .page-header-actions { width: 100%; }
}
```

- [ ] **Step 4: Adicionar skeleton animation e `.notification-panel`**

```css
/* ─── Skeleton loader ────────────────────────────────────────────────────── */
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.skeleton {
  border-radius: 0.375rem;
  background: linear-gradient(
    90deg,
    var(--ada-border-sub) 25%,
    var(--ada-hover) 50%,
    var(--ada-border-sub) 75%
  );
  background-size: 600px 100%;
  animation: shimmer 1.4s ease infinite;
}
[data-theme="dark"] .skeleton {
  background: linear-gradient(
    90deg,
    var(--ada-border) 25%,
    var(--ada-hover) 50%,
    var(--ada-border) 75%
  );
  background-size: 600px 100%;
}

/* ─── Notification Panel ─────────────────────────────────────────────────── */
.notification-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 440px;
  overflow-y: auto;
  background: var(--ada-surface);
  border: 1px solid var(--ada-border);
  border-radius: 0.875rem;
  box-shadow: var(--shadow-lg);
  z-index: 60;
}
.notification-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--ada-border-sub);
  position: sticky;
  top: 0;
  background: var(--ada-surface);
  z-index: 1;
}
.notification-panel-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ada-border-sub);
  transition: background 100ms;
  cursor: pointer;
}
.notification-panel-item:last-child { border-bottom: none; }
.notification-panel-item:hover { background: var(--ada-hover); }
.notification-panel-item.unread { background: var(--ada-warning-badge); }
.notification-panel-item.unread:hover { background: var(--ada-warning-bg); }
[data-theme="dark"] .notification-panel-item.unread { background: rgba(212,150,12,0.09); }
```

- [ ] **Step 5: Sobrescrever DashboardCard hover com CSS puro**

```css
/* ─── Dashboard Card hover via CSS (remove onMouseEnter/Leave do JSX) ─── */
.dashboard-card {
  background: var(--ada-surface);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.dashboard-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

- [ ] **Step 6: Commit**

```bash
cd CasaDiAna/frontend
git add src/index.css
git commit -m "style: atualiza tokens CSS — fundo cinza frio, density de tabela, sticky thead, skeleton, notification-panel"
```

---

## Task 2: Componente `<PageHeader>`

**Arquivo:** `src/components/ui/PageHeader.tsx` (criar)

- [ ] **Step 1: Criar o arquivo**

```tsx
import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  subtitulo?: string
  breadcrumb?: string[]   // ex: ['Produção', 'Vendas Diárias']
  actions?: ReactNode
}

export function PageHeader({ titulo, subtitulo, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="page-breadcrumb" aria-label="Localização atual">
            {breadcrumb.map((item, i) => (
              <span key={i}>
                {item}
                {i < breadcrumb.length - 1 && <span aria-hidden="true"> /</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="page-header-title">{titulo}</h1>
        {subtitulo && (
          <p className="page-header-subtitle">{subtitulo}</p>
        )}
      </div>
      {actions && (
        <div className="page-header-actions">{actions}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/PageHeader.tsx
git commit -m "feat: cria componente PageHeader com breadcrumb e actions"
```

---

## Task 3: Componente `<EmptyState>`

**Arquivo:** `src/components/ui/EmptyState.tsx` (criar)

- [ ] **Step 1: Criar o arquivo**

```tsx
import type { ReactNode } from 'react'

type IconColor = 'amber' | 'green' | 'red' | 'blue' | 'neutral'

interface EmptyStateProps {
  icon: ReactNode
  iconColor?: IconColor
  titulo: string
  descricao?: string
  action?: ReactNode
}

const colorMap: Record<IconColor, { bg: string; color: string }> = {
  amber:   { bg: 'var(--ada-warning-badge)',  color: 'var(--ada-warning-text)' },
  green:   { bg: 'var(--ada-success-bg)',     color: 'var(--ada-success-text)' },
  red:     { bg: 'var(--ada-error-bg)',       color: 'var(--ada-error-text)' },
  blue:    { bg: '#EFF6FF',                   color: '#2563EB' },
  neutral: { bg: 'var(--ada-bg)',             color: 'var(--ada-muted)' },
}

export function EmptyState({ icon, iconColor = 'neutral', titulo, descricao, action }: EmptyStateProps) {
  const { bg, color } = colorMap[iconColor]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: bg, border: '1px solid var(--ada-border)' }}
        aria-hidden="true"
      >
        <span style={{ color }} className="w-7 h-7 flex items-center justify-center">
          {icon}
        </span>
      </div>
      <div className="space-y-1">
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {titulo}
        </p>
        {descricao && (
          <p className="text-xs max-w-xs" style={{ color: 'var(--ada-muted)' }}>
            {descricao}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/EmptyState.tsx
git commit -m "feat: cria componente EmptyState com ícone colorido e CTA"
```

---

## Task 4: Componente `<SkeletonTable>`

**Arquivo:** `src/components/ui/SkeletonTable.tsx` (criar)

- [ ] **Step 1: Criar o arquivo**

```tsx
interface SkeletonTableProps {
  colunas?: number
  linhas?: number
}

export function SkeletonTable({ colunas = 4, linhas = 5 }: SkeletonTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-busy="true"
      aria-label="Carregando dados…"
    >
      {/* Cabeçalho */}
      <div
        className="flex gap-4 px-5 py-3"
        style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border-sub)' }}
      >
        {Array.from({ length: colunas }).map((_, i) => (
          <div key={i} className="skeleton h-3 rounded flex-1" style={{ maxWidth: i === 0 ? '180px' : '120px' }} />
        ))}
      </div>
      {/* Linhas */}
      {Array.from({ length: linhas }).map((_, row) => (
        <div
          key={row}
          className="flex gap-4 px-5 py-3.5"
          style={{ borderBottom: row < linhas - 1 ? '1px solid var(--ada-hover)' : 'none' }}
        >
          {Array.from({ length: colunas }).map((_, col) => (
            <div
              key={col}
              className="skeleton h-3.5 rounded flex-1"
              style={{
                maxWidth: col === 0 ? '200px' : '100px',
                opacity: 1 - row * 0.12,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/SkeletonTable.tsx
git commit -m "feat: cria SkeletonTable com animação shimmer para estados de carregamento"
```

---

## Task 5: Sidebar — Ícones Coloridos por Módulo

**Arquivo:** `src/components/layout/Sidebar.tsx`

Adicionar prop `data-module` nos grupos e colorir ícones por categoria via `iconColor` no objeto de nav.

- [ ] **Step 1: Adicionar `iconColor` à interface `NavItem` e aos grupos**

Localizar a interface `NavItem` e adicionar o campo:

```tsx
interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  iconColor?: string   // ← ADICIONAR
}
```

- [ ] **Step 2: Atualizar o array `grupos` com as cores por módulo**

Substituir o array `grupos` completo:

```tsx
const grupos: NavGroup[] = [
  {
    titulo: 'Cadastros',
    itens: [
      { label: 'Ingredientes',  href: '/estoque/ingredientes', icon: BeakerIcon,  iconColor: '#60A5FA' },
      { label: 'Categorias',    href: '/estoque/categorias',   icon: TagIcon,     iconColor: '#60A5FA' },
      { label: 'Fornecedores',  href: '/fornecedores',         icon: TruckIcon,   iconColor: '#60A5FA' },
    ],
  },
  {
    titulo: 'Produção',
    itens: [
      { label: 'Categorias de Produto', href: '/producao/categorias-produto', icon: SquaresPlusIcon,       iconColor: '#D4960C' },
      { label: 'Produtos',              href: '/producao/produtos',            icon: CubeIcon,              iconColor: '#D4960C' },
      { label: 'Produção Diária',       href: '/producao/diaria',              icon: FireIcon,              iconColor: '#D4960C' },
      { label: 'Vendas Diárias',        href: '/producao/vendas',              icon: BanknotesIcon,         iconColor: '#D4960C' },
      { label: 'Perdas',                href: '/producao/perdas',              icon: ExclamationCircleIcon, iconColor: '#F87171' },
      { label: 'Etiquetas',             href: '/etiquetas',                    icon: QrCodeIcon,            iconColor: '#D4960C' },
    ],
  },
  {
    titulo: 'Movimentações',
    itens: [
      { label: 'Entradas',            href: '/entradas',         icon: ArrowDownTrayIcon,          iconColor: '#34D399' },
      { label: 'Inventário',          href: '/inventarios',      icon: ClipboardDocumentCheckIcon, iconColor: '#34D399' },
      { label: 'Correção de Estoque', href: '/estoque/correcao', icon: AdjustmentsHorizontalIcon,  iconColor: '#34D399' },
    ],
  },
  {
    titulo: 'Relatórios',
    itens: [
      { label: 'Estoque Atual',        href: '/relatorios/estoque-atual',    icon: ChartBarIcon,       iconColor: '#A78BFA' },
      { label: 'Movimentações',        href: '/relatorios/movimentacoes',    icon: ChartBarSquareIcon, iconColor: '#A78BFA' },
      { label: 'Entradas',             href: '/relatorios/entradas',         icon: ArrowDownTrayIcon,  iconColor: '#A78BFA' },
      { label: 'Produção/Vendas',      href: '/relatorios/producao-vendas',  icon: ChartBarIcon,       iconColor: '#A78BFA' },
      { label: 'Insumos por Produção', href: '/relatorios/insumos-producao', icon: ChartBarSquareIcon, iconColor: '#A78BFA' },
    ],
  },
]
```

- [ ] **Step 3: Usar `iconColor` no render do ícone**

Localizar o trecho que renderiza `<Icon ... style={{ color: isActive ? 'var(--sb-accent)' : 'var(--sb-text)' }} />` dentro do NavLink e substituir por:

```tsx
<Icon
  className="h-4 w-4 shrink-0 transition-colors duration-150"
  aria-hidden="true"
  style={{
    color: isActive
      ? 'var(--sb-accent)'
      : item.iconColor ?? 'var(--sb-text)',
    opacity: isActive ? 1 : 0.75,
  }}
/>
```

- [ ] **Step 4: Aplicar a mesma lógica no item de Usuários (Configurações)**

No trecho que renderiza `<UsersIcon ... style={{ color: isActive ? 'var(--sb-accent)' : 'var(--sb-text)' }} />`, substituir por:

```tsx
<UsersIcon
  className="h-4 w-4 shrink-0"
  aria-hidden="true"
  style={{ color: isActive ? 'var(--sb-accent)' : '#94A3B8', opacity: isActive ? 1 : 0.75 }}
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "style: ícones da sidebar coloridos por módulo (azul/âmbar/verde/roxo/cinza)"
```

---

## Task 6: TopHeader — Notification Dropdown

**Arquivo:** `src/components/layout/TopHeader.tsx`

Converter o clique no sino de navegação para `/notificacoes` para um dropdown panel inline.

- [ ] **Step 1: Adicionar imports necessários**

No topo do arquivo, adicionar após os imports existentes:

```tsx
import { useEffect, useRef, useState as useLocalState } from 'react'
import { notificacoesService, type NotificacaoEstoqueDto } from '@/lib/notificacoesService'
import { CheckIcon, XMarkIcon, FireIcon, ExclamationTriangleIcon, ExclamationCircleIcon as ExclCircleIcon } from '@heroicons/react/24/outline'
```

> Atenção: o arquivo já importa `useNavigate` e `useAuthStore`. Não duplicar. O `useState` já existe importado como `useState` de 'react' — mas para o estado local do dropdown usar `useLocalState` via alias para não conflitar.

- [ ] **Step 2: Substituir o bloco do botão de sino existente**

Localizar o trecho completo do sino (da `<IconBtn onClick={() => navigate('/notificacoes')}` até o fechamento `</IconBtn>`) e substituir por um novo componente inline `NotificationDropdown`:

```tsx
{/* ── Sino com dropdown inline ──────────────────────────────── */}
<NotificationDropdown count={count} onCountUpdate={atualizar} />
```

Onde `atualizar` vem do `useNotificacoesCount()` — já desestruturado acima como `const { count, atualizar } = useNotificacoesCount()`.

- [ ] **Step 3: Adicionar o componente `NotificationDropdown` antes do `TopHeader`**

Inserir o componente antes da função `TopHeader` (após `Divider`):

```tsx
// ─── Dropdown de notificações ───────────────────────────────────────────────
const TIPO_CFG = {
  Zerado:  { Icon: FireIcon,          cor: 'var(--ada-error-text)',   bg: 'var(--ada-error-bg)',   border: 'var(--ada-error-border)'   },
  Critico: { Icon: ExclCircleIcon,    cor: 'var(--ada-error-text)',   bg: 'var(--ada-error-bg)',   border: 'var(--ada-error-border)'   },
  Atencao: { Icon: ExclamationTriangleIcon, cor: 'var(--ada-warning-text)', bg: 'var(--ada-warning-badge)', border: 'var(--ada-warning-border)' },
} as const

function NotificationDropdown({ count, onCountUpdate }: { count: number; onCountUpdate: () => void }) {
  const navigate = useNavigate()
  const [aberto, setAberto] = useLocalState(false)
  const [notifs, setNotifs] = useLocalState<NotificacaoEstoqueDto[]>([])
  const [carregando, setCarregando] = useLocalState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto])

  // Fechar com Escape
  useEffect(() => {
    if (!aberto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [aberto])

  const abrirDropdown = async () => {
    const novo = !aberto
    setAberto(novo)
    if (novo) {
      setCarregando(true)
      try {
        const data = await notificacoesService.listar(false)
        setNotifs(data.slice(0, 8))  // máx 8 no dropdown
      } finally {
        setCarregando(false)
      }
    }
  }

  const marcarLida = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await notificacoesService.marcarLida(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    onCountUpdate()
  }

  const naoLidasCount = notifs.filter(n => !n.lida).length

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={abrirDropdown}
        aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ''}`}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className="p-2 rounded-lg transition-colors duration-150 outline-none
                   focus-visible:ring-2 focus-visible:ring-[#C4870A]/40"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = 'var(--ada-heading)'
          el.style.background = 'var(--ada-hover)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = 'var(--ada-muted)'
          el.style.background = 'transparent'
        }}
      >
        <div className="relative">
          <BellIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          {count > 0 && (
            <span
              className="absolute -top-2 -right-2 min-w-[16px] h-4 rounded-full
                         text-[9px] font-bold text-white flex items-center
                         justify-center px-1 leading-none"
              style={{ background: 'var(--ada-error-text)' }}
              aria-hidden="true"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
      </button>

      {aberto && (
        <div
          className="notification-panel"
          role="dialog"
          aria-label="Notificações de estoque"
        >
          {/* Header do panel */}
          <div className="notification-panel-header">
            <span
              className="text-[13px] font-semibold"
              style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Notificações
              {naoLidasCount > 0 && (
                <span
                  className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)' }}
                >
                  {naoLidasCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setAberto(false); navigate('/notificacoes') }}
                className="text-[11px] px-2 py-1 rounded transition-colors"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
              >
                Ver todas
              </button>
              <button
                onClick={() => setAberto(false)}
                className="p-1 rounded transition-colors"
                aria-label="Fechar"
                style={{ color: 'var(--ada-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Lista */}
          {carregando ? (
            <div className="py-8 flex flex-col items-center gap-2">
              <div
                className="h-6 w-6 animate-spin rounded-full"
                style={{ border: '2px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
                role="status"
              />
              <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>Carregando…</p>
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <BellIcon className="h-8 w-8" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
              <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>Nenhuma notificação</p>
            </div>
          ) : (
            <ul>
              {notifs.map(n => {
                const cfg = TIPO_CFG[n.tipo]
                const { Icon } = cfg
                return (
                  <li
                    key={n.id}
                    className={`notification-panel-item${!n.lida ? ' unread' : ''}`}
                    onClick={() => { setAberto(false); navigate('/notificacoes') }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: cfg.cor }} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold leading-snug truncate"
                         style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                        {n.titulo}
                      </p>
                      <p className="text-[11.5px] mt-0.5 line-clamp-2 leading-relaxed"
                         style={{ color: 'var(--ada-body)' }}>
                        {n.mensagem}
                      </p>
                    </div>
                    {!n.lida && (
                      <button
                        onClick={(e) => marcarLida(n.id, e)}
                        aria-label="Marcar como lida"
                        className="shrink-0 p-1 rounded transition-colors"
                        style={{ color: 'var(--ada-placeholder)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-placeholder)'}
                      >
                        <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros (ou apenas warnings não relacionados).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/TopHeader.tsx
git commit -m "feat: converte notificações de página para dropdown panel no header"
```

---

## Task 7: Aplicar `PageHeader` + `EmptyState` + `SkeletonTable` nas páginas de listagem

**Arquivos:** as 8 páginas de listagem identificadas no mapa.

Padrão de substituição para cada página:

**Antes (padrão atual):**
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
  <div>
    <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}>
      Título
    </h1>
    <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>subtítulo</p>
  </div>
  {podeEditar && <button ...>Ação</button>}
</div>
{loading && (
  <div className="state-loading">
    <div className="inline-block h-9 w-9 animate-spin rounded-full mb-4" ... />
    <p ...>Carregando…</p>
  </div>
)}
```

**Depois:**
```tsx
<PageHeader
  titulo="Título"
  subtitulo={loading ? 'Carregando…' : 'X itens cadastrados'}
  actions={podeEditar && <button className="btn-primary">...</button>}
/>
{loading && <SkeletonTable colunas={N} linhas={5} />}
```

E nos empty states dentro das tabelas, substituir o `<div className="ada-surface-card"><div className="state-empty">...` por `<EmptyState ... />` dentro do card.

- [ ] **Step 1: `IngredientesPage.tsx`**

Adicionar imports:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
```

Substituir o cabeçalho e o loading state:
```tsx
<PageHeader
  titulo="Ingredientes"
  breadcrumb={['Cadastros', 'Ingredientes']}
  subtitulo={loading ? 'Carregando…' : `${ingredientes.length} ingrediente${ingredientes.length !== 1 ? 's' : ''} cadastrado${ingredientes.length !== 1 ? 's' : ''}`}
  actions={podeEditar && (
    <button onClick={() => navigate('/estoque/ingredientes/novo')} className="btn-primary">
      <PlusIcon className="h-4 w-4" aria-hidden="true" />
      Novo Ingrediente
    </button>
  )}
/>
```

Substituir o bloco `{loading && <div className="rounded-xl py-20...">`:
```tsx
{loading && <SkeletonTable colunas={6} linhas={5} />}
```

- [ ] **Step 2: `CategoriasPage.tsx`**

Adicionar imports:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
```

Substituir cabeçalho:
```tsx
<PageHeader
  titulo="Categorias"
  breadcrumb={['Cadastros', 'Categorias']}
  subtitulo={loading ? 'Carregando…' : `${categorias.length} categoria${categorias.length !== 1 ? 's' : ''}`}
  actions={podeEditar && (
    <button onClick={abrirCriar} className="btn-primary">
      <PlusIcon className="h-4 w-4" aria-hidden="true" />
      Nova Categoria
    </button>
  )}
/>
```

Substituir `{loading && (<div className="state-loading">`:
```tsx
{loading && <SkeletonTable colunas={3} linhas={4} />}
```

- [ ] **Step 3: `FornecedoresPage.tsx`**

Adicionar imports:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
```

Substituir cabeçalho:
```tsx
<PageHeader
  titulo="Fornecedores"
  breadcrumb={['Cadastros', 'Fornecedores']}
  subtitulo={loading ? 'Carregando…' : `${fornecedores.length} fornecedor${fornecedores.length !== 1 ? 'es' : ''}`}
  actions={podeEditar && (
    <button onClick={() => navigate('/fornecedores/novo')} className="btn-primary">
      <PlusIcon className="h-4 w-4" aria-hidden="true" />
      Novo Fornecedor
    </button>
  )}
/>
```

Substituir loading:
```tsx
{loading && <SkeletonTable colunas={5} linhas={5} />}
```

- [ ] **Step 4: `ProdutosPage.tsx`**

Adicionar imports:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
```

Substituir cabeçalho e loading com o mesmo padrão, `breadcrumb={['Produção', 'Produtos']}`, `colunas={5}`.

- [ ] **Step 5: `EntradasPage.tsx`, `InventariosPage.tsx`, `ProducaoDiariaPage.tsx`, `VendasDiariasPage.tsx`**

Aplicar o mesmo padrão para cada uma:

- `EntradasPage`: `breadcrumb={['Movimentações', 'Entradas']}`, `colunas={5}`
- `InventariosPage`: `breadcrumb={['Movimentações', 'Inventários']}`, `colunas={4}`
- `ProducaoDiariaPage`: `breadcrumb={['Produção', 'Produção Diária']}`, `colunas={5}`
- `VendasDiariasPage`: `breadcrumb={['Produção', 'Vendas Diárias']}`, `colunas={4}`

- [ ] **Step 6: `UsuariosPage.tsx`**

Adicionar imports e substituir cabeçalho:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
// ...
<PageHeader
  titulo="Usuários"
  breadcrumb={['Configurações', 'Usuários']}
  subtitulo={loading ? 'Carregando…' : `${usuarios.length} usuário${usuarios.length !== 1 ? 's' : ''}`}
  actions={isAdmin && (
    <button onClick={abrirCriar} className="btn-primary">
      <PlusIcon className="h-4 w-4" aria-hidden="true" />
      Novo Usuário
    </button>
  )}
/>
```

- [ ] **Step 7: `PerdasPage.tsx`**

```tsx
import { PageHeader } from '@/components/ui/PageHeader'
// ...
<PageHeader
  titulo="Perdas de Produto"
  breadcrumb={['Produção', 'Perdas']}
  subtitulo={`${perdas.length} registro${perdas.length !== 1 ? 's' : ''} no período`}
  actions={
    <button onClick={() => setModalAberto(true)} className="btn-primary">
      <PlusIcon className="h-4 w-4" aria-hidden="true" />
      Registrar Perda
    </button>
  }
/>
```

- [ ] **Step 8: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 9: Commit**

```bash
git add src/features/
git commit -m "refactor: aplica PageHeader, SkeletonTable e padrão de cabeçalho em todas as páginas de listagem"
```

---

## Task 8: EmptyState com CTA nas Tabelas

**Arquivos:** `TabelaCategorias.tsx`, `TabelaIngredientes.tsx`, `FornecedoresPage.tsx`, `ProdutosPage.tsx`, tabelas inline das páginas de produção.

Padrão: substituir o bloco de estado vazio genérico (ícone cinza + texto solto) pelo componente `<EmptyState>`.

- [ ] **Step 1: `TabelaCategorias.tsx`**

Adicionar import:
```tsx
import { EmptyState } from '@/components/ui/EmptyState'
import { TagIcon } from '@heroicons/react/24/outline'
```

Substituir o bloco `if (categorias.length === 0) { return (<div className="ada-surface-card"><div className="state-empty">` por:

```tsx
if (categorias.length === 0) {
  return (
    <div className="ada-surface-card">
      <EmptyState
        icon={<TagIcon className="w-7 h-7" />}
        iconColor="blue"
        titulo="Nenhuma categoria cadastrada"
        descricao="Crie uma categoria para organizar os ingredientes."
        action={podeEditar && (
          <button onClick={onNovaCategoria} className="btn-primary">
            + Nova Categoria
          </button>
        )}
      />
    </div>
  )
}
```

> Nota: `TabelaCategorias` não recebe `onNovaCategoria` hoje. Se a prop não for adicionada, omitir o `action` por ora — o empty state sem CTA já é uma melhoria.

Versão sem CTA (mais simples, sem alterar props):
```tsx
if (categorias.length === 0) {
  return (
    <div className="ada-surface-card">
      <EmptyState
        icon={<TagIcon className="w-7 h-7" />}
        iconColor="blue"
        titulo="Nenhuma categoria cadastrada"
        descricao="Crie uma categoria para organizar os ingredientes."
      />
    </div>
  )
}
```

- [ ] **Step 2: `TabelaIngredientes.tsx`**

Adicionar import:
```tsx
import { EmptyState } from '@/components/ui/EmptyState'
import { BeakerIcon } from '@heroicons/react/24/outline'
```

Substituir o bloco de empty state existente:
```tsx
if (ingredientes.length === 0) {
  return (
    <EmptyState
      icon={<BeakerIcon className="w-7 h-7" />}
      iconColor="amber"
      titulo="Nenhum ingrediente encontrado"
      descricao="Ajuste os filtros ou cadastre um novo ingrediente."
    />
  )
}
```

- [ ] **Step 3: `FornecedoresPage.tsx` — empty state dentro da tabela**

Localizar o bloco `fornecedores.length === 0 ? (<div className="state-empty">` e substituir por:

```tsx
fornecedores.length === 0 ? (
  <EmptyState
    icon={<TruckIcon className="w-7 h-7" />}
    iconColor="green"
    titulo="Nenhum fornecedor cadastrado"
    descricao="Cadastre um fornecedor para registrar entradas de mercadoria."
    action={podeEditar && (
      <button onClick={() => navigate('/fornecedores/novo')} className="btn-primary">
        + Novo Fornecedor
      </button>
    )}
  />
) : (
```

Adicionar import `TruckIcon` do `@heroicons/react/24/outline` e `EmptyState`.

- [ ] **Step 4: Commit**

```bash
git add src/features/ src/components/ui/
git commit -m "style: substitui empty states genéricos por EmptyState com ícone colorido"
```

---

## Task 9: Movimentações — Enums PT-BR e Truncate na Referência

**Arquivo:** `src/features/relatorios/pages/MovimentacoesPage.tsx`

- [ ] **Step 1: Traduzir labels dos tipos de movimentação**

Localizar:
```tsx
const TIPOS = ['', 'Entrada', 'AjustePositivo', 'AjusteNegativo', 'SaidaProducao']
```

Substituir por mapa valor → rótulo:
```tsx
const TIPOS: { valor: string; rotulo: string }[] = [
  { valor: '',              rotulo: 'Todos' },
  { valor: 'Entrada',       rotulo: 'Entrada' },
  { valor: 'AjustePositivo', rotulo: 'Ajuste Positivo' },
  { valor: 'AjusteNegativo', rotulo: 'Ajuste Negativo' },
  { valor: 'SaidaProducao',  rotulo: 'Saída — Produção' },
]
```

Atualizar o `<select>`:
```tsx
<select value={tipo} onChange={e => setTipo(e.target.value)} className="filter-input">
  {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
</select>
```

- [ ] **Step 2: Adicionar função de tradução de tipo para exibição na coluna**

```tsx
const TIPO_LABEL: Record<string, string> = {
  Entrada:        'Entrada',
  AjustePositivo: 'Ajuste Positivo',
  AjusteNegativo: 'Ajuste Negativo',
  SaidaProducao:  'Saída — Produção',
}
```

Na célula da coluna Tipo, substituir `{m.tipo}` por `{TIPO_LABEL[m.tipo] ?? m.tipo}`.

- [ ] **Step 3: Corrigir overflow da coluna Referência com truncate + title**

Localizar a `<td>` da coluna Referência:
```tsx
<td className="table-td">
  <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>{m.referenciaTipo ?? '—'}</span>
</td>
```

Substituir por:
```tsx
<td className="table-td" style={{ maxWidth: '140px' }}>
  <span
    className="text-xs cell-truncate block"
    style={{ color: 'var(--ada-muted)' }}
    title={m.referenciaTipo ?? ''}
  >
    {m.referenciaTipo ?? '—'}
  </span>
</td>
```

- [ ] **Step 4: Aplicar `PageHeader` nesta página**

Adicionar import e substituir cabeçalho:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
// ...
<PageHeader
  titulo="Movimentações de Estoque"
  breadcrumb={['Relatórios', 'Movimentações']}
  subtitulo={loading ? 'Carregando…' : `${movimentacoes.length} movimentação(ões) no período`}
  actions={movimentacoes.length > 0 && (
    <button onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)} className="btn-secondary">
      <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
      Baixar PDF
    </button>
  )}
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/features/relatorios/pages/MovimentacoesPage.tsx
git commit -m "fix: traduz enums camelCase para PT-BR na coluna Tipo e corrige overflow de Referência"
```

---

## Task 10: Dashboard — Layout e DashboardCard com CSS

**Arquivo:** `src/features/dashboard/pages/DashboardPage.tsx`

Remover `onMouseEnter`/`onMouseLeave` inline do `DashboardCard` e usar a classe `.dashboard-card` (definida na Task 1).

- [ ] **Step 1: Atualizar `DashboardCard` para usar classe CSS**

Localizar o `<div className="rounded-2xl p-5 transition-all duration-200" style={...} onMouseEnter={...} onMouseLeave={...}>` e substituir por:

```tsx
return (
  <div
    className="dashboard-card"
    style={{ border: `1px solid ${v.border}` }}
  >
    {/* ... conteúdo interno sem alteração ... */}
  </div>
)
```

- [ ] **Step 2: Adicionar `PageHeader` no Dashboard**

Adicionar import e substituir o cabeçalho de filtro de data atual pelo `PageHeader`:

```tsx
import { PageHeader } from '@/components/ui/PageHeader'
```

Localizar o bloco de filtro de datas e inserir o `PageHeader` antes dele:

```tsx
<PageHeader
  titulo="Dashboard"
  subtitulo="Resumo operacional do período"
/>
```

O filtro de datas permanece como está logo abaixo.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/pages/DashboardPage.tsx
git commit -m "style: DashboardCard usa classe CSS para hover, adiciona PageHeader no dashboard"
```

---

## Task 11: NotificacoesPage — Usar PageHeader e corrigir botão inline

**Arquivo:** `src/features/notificacoes/pages/NotificacoesPage.tsx`

- [ ] **Step 1: Substituir cabeçalho por PageHeader**

```tsx
import { PageHeader } from '@/components/ui/PageHeader'
// ...
<PageHeader
  titulo="Notificações de Estoque"
  subtitulo={loading ? 'Carregando…' : `${naoLidasCount} não lida${naoLidasCount !== 1 ? 's' : ''}`}
  actions={
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={apenasNaoLidas}
          onChange={handleToggle}
          className="h-4 w-4 accent-amber-700"
        />
        <span className="text-sm" style={{ color: 'var(--ada-body)' }}>Apenas não lidas</span>
      </label>
      {naoLidasCount > 0 && (
        <button onClick={handleMarcarTodasLidas} className="btn-secondary">
          <CheckIcon className="h-4 w-4" aria-hidden="true" />
          Marcar todas lidas
        </button>
      )}
    </div>
  }
/>
```

- [ ] **Step 2: Corrigir botão "Marcar como lida" na lista**

Localizar o botão individual com `onMouseEnter`/`onMouseLeave` inline e substituir pela classe `row-action-btn`:

```tsx
<button
  onClick={() => handleMarcarLida(n.id)}
  aria-label="Marcar como lida"
  title="Marcar como lida"
  className="row-action-btn shrink-0"
>
  <BellIcon className="h-4 w-4" aria-hidden="true" />
</button>
```

- [ ] **Step 3: Commit**

```bash
git add src/features/notificacoes/pages/NotificacoesPage.tsx
git commit -m "refactor: NotificacoesPage usa PageHeader e row-action-btn padronizado"
```

---

## Task 12: Demais Páginas de Relatório — PageHeader

**Arquivos:** `EstoqueAtualPage.tsx`, `EntradasRelatorioPage.tsx`, `ProducaoVendasRelatorioPage.tsx`, `InsumosProducaoPage.tsx`

- [ ] **Step 1: Aplicar PageHeader em cada relatório**

Para cada arquivo, adicionar:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
```

E substituir o bloco `<div className="flex flex-col gap-3 sm:flex-row ...">` pelo `PageHeader` correspondente:

- **EstoqueAtualPage:**
  ```tsx
  <PageHeader titulo="Estoque Atual" breadcrumb={['Relatórios', 'Estoque Atual']} subtitulo={...} actions={<button className="btn-secondary">Baixar PDF</button>} />
  ```
- **EntradasRelatorioPage:**
  ```tsx
  <PageHeader titulo="Relatório de Entradas" breadcrumb={['Relatórios', 'Entradas']} subtitulo={...} actions={...} />
  ```
- **ProducaoVendasRelatorioPage:**
  ```tsx
  <PageHeader titulo="Produção e Vendas" breadcrumb={['Relatórios', 'Produção / Vendas']} subtitulo={...} />
  ```
- **InsumosProducaoPage:**
  ```tsx
  <PageHeader titulo="Insumos por Produção" breadcrumb={['Relatórios', 'Insumos']} subtitulo={...} />
  ```

- [ ] **Step 2: Commit**

```bash
git add src/features/relatorios/
git commit -m "refactor: aplica PageHeader em todos os relatórios"
```

---

## Task 13: Páginas de Formulário — PageHeader nos Forms

**Arquivos:** as 6 páginas de form (`IngredienteFormPage`, `FornecedorFormPage`, `ProdutoFormPage`, `RegistrarProducaoPage`, `RegistrarVendaPage`, `InventarioFormPage`)

Substituir o padrão `<h1>` solto + breadcrumb `<Link>` pelo componente `PageHeader` com `breadcrumb`.

- [ ] **Step 1: Padrão a aplicar em cada form page**

```tsx
import { PageHeader } from '@/components/ui/PageHeader'
// remover o import de ChevronLeftIcon e Link se não usados em outro lugar
```

Substituir:
```tsx
<Link to="/..." className="inline-flex items-center ...">
  <ChevronLeftIcon /> Voltar
</Link>
<h1 className="text-xl font-bold ...">Título</h1>
```

Por:
```tsx
<PageHeader
  titulo={modoEdicao ? `Editar: ${ingrediente?.nome ?? ''}` : 'Novo Ingrediente'}
  breadcrumb={['Cadastros', 'Ingredientes']}
/>
```

Aplicar para cada form com breadcrumb correto:
- `IngredienteFormPage`: `['Cadastros', 'Ingredientes']`
- `FornecedorFormPage`: `['Cadastros', 'Fornecedores']`
- `ProdutoFormPage`: `['Produção', 'Produtos']`
- `RegistrarProducaoPage`: `['Produção', 'Produção Diária']`
- `RegistrarVendaPage`: `['Produção', 'Vendas Diárias']`
- `InventarioFormPage`: `['Movimentações', 'Inventários']`

> **Atenção:** Se o `ChevronLeftIcon` ou o `Link` não forem mais usados no arquivo após esta substituição, remover o import para evitar erro TS6133.

- [ ] **Step 2: Verificar TypeScript**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add src/features/
git commit -m "refactor: páginas de formulário usam PageHeader com breadcrumb — remove Link+h1 redundantes"
```

---

## Task 14: Push Final e Verificação

- [ ] **Step 1: Build completo**

```bash
cd CasaDiAna/frontend && npm run build 2>&1 | tail -20
```

Esperado: `✓ built in Xs` sem erros TS.

- [ ] **Step 2: Push**

```bash
cd CasaDiAna  # raiz do repo
git push origin master
```

- [ ] **Step 3: Verificar deploy no Render**

Aguardar o pipeline do Render (`casadiana-frontend`) concluir sem erros de build. O log deve terminar com `Successfully built` no step `npm run build`.

---

## Checklist de Cobertura da Spec

| Item da spec | Task |
|---|---|
| `--ada-bg` → cinza frio `#F7F8FA` | Task 1 |
| `--header-h` → 60px | Task 1 |
| Sticky thead + `white-space: nowrap` | Task 1 |
| Density de tabelas (44px row height) | Task 1 |
| `.dashboard-card` hover via CSS | Task 1 + 10 |
| Skeleton loader | Task 1 + 4 |
| `<PageHeader>` reutilizável com breadcrumb | Task 2 + 7 + 11 + 12 + 13 |
| `<EmptyState>` com ícone colorido + CTA | Task 3 + 8 |
| `<SkeletonTable>` | Task 4 + 7 |
| Ícones da sidebar coloridos por módulo | Task 5 |
| Dropdown de notificações no header | Task 6 |
| `PageHeader` em todas as listagens | Task 7 |
| `EmptyState` em tabelas | Task 8 |
| Enums PT-BR em Movimentações | Task 9 |
| Overflow da coluna Referência corrigido | Task 9 |
| Dashboard usa PageHeader | Task 10 |
| `DashboardCard` hover sem JS inline | Task 10 |
| Relatórios com PageHeader | Task 12 |
| Forms com PageHeader + breadcrumb | Task 13 |
