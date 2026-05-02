# Design System Dark Premium — Casa di Ana ERP

**Data:** 2026-05-01
**Status:** Aprovado
**Autor:** Gustavo Leal + Claude Sonnet 4.6

---

## Contexto

O frontend do Casa di Ana ERP possui uma identidade visual sólida (sidebar escura, brand âmbar, CSS vars `--ada-*`) mas o conteúdo principal é claro e sem personalidade ("sem sal"). A direção aprovada é **Dark Premium**: expandir o dark para todo o sistema, com glassmorphism, glow âmbar nos elementos-chave e micro-animações. O objetivo é que o sistema pareça um SaaS premium de mercado (referências: Linear, Vercel, PlanetScale).

A abordagem é **Foundation First**: criar e consolidar a base de componentes e tokens primeiro, depois aplicar a todas as páginas. Nenhuma migração parcial.

---

## Seção 1 — Arquitetura de Componentes

### Regra global
> Qualquer componente que apareça em 3 ou mais módulos mora em `src/components/`. Componentes de módulo único ficam no feature.

Esta regra deve ser adicionada ao `CLAUDE.md`.

### Componentes a mover (mesma API, novo path)

| Componente | De | Para |
|---|---|---|
| `Toast.tsx` | `features/estoque/ingredientes/components/` | `components/ui/` |
| `ModalDesativar.tsx` | `features/estoque/ingredientes/components/` | `components/ui/` |
| `CampoTexto.tsx` | `features/estoque/ingredientes/components/` | `components/form/` |
| `SelectCampo.tsx` | `features/estoque/ingredientes/components/` | `components/form/` |

Todos os imports nas pages afetadas devem ser atualizados após a movimentação.

### Componentes novos a criar

#### `components/ui/FiltroPeriodo.tsx`
Encapsula o par De/Até presente em 10 páginas (20 inputs no total).

```tsx
interface FiltroPeriodoProps {
  de: string
  onChangeDe: (v: string) => void
  ate: string
  onChangeAte: (v: string) => void
  idDe?: string
  idAte?: string
}
```

Responsabilidades internas:
- `max={new Date().toISOString().split('T')[0]}` em ambos os inputs
- Labels "De" e "Até" com classe `filter-label`
- Geração dos chips removíveis formatados como `dd/mm/aaaa`
- Classe `filter-input` no estilo dark

#### `components/ui/StatusBadge.tsx`
Substitui todos os badges inline com dot colorido.

```tsx
type BadgeVariante = 'ativo' | 'inativo' | 'baixo' | 'critico' | 'info'

interface StatusBadgeProps {
  variante: BadgeVariante
  label?: string  // padrão: nome da variante capitalizado
}
```

Mapeamento de variantes:
- `ativo` → dot verde `#4ADE80`, fundo `rgba(74,222,128,.1)`, borda `rgba(74,222,128,.2)`
- `inativo` → dot cinza `#64748B`, fundo `rgba(148,163,184,.08)`, borda `rgba(148,163,184,.12)`
- `baixo` → dot âmbar `#FCD34D`, fundo `rgba(252,211,77,.1)`, borda `rgba(252,211,77,.2)`
- `critico` → dot vermelho `#F87171`, fundo `rgba(248,113,113,.1)`, borda `rgba(248,113,113,.2)`
- `info` → dot azul `#93C5FD`, fundo `rgba(147,197,253,.1)`, borda `rgba(147,197,253,.2)`

#### `components/ui/TabelaAcoesLinha.tsx`
Padroniza os botões editar/desativar inline em todas as tabelas.

```tsx
interface TabelaAcoesLinhaProps {
  onEditar?: () => void
  onDesativar?: () => void
  labelEditar?: string   // para aria-label
  labelDesativar?: string
}
```

Comportamento:
- `opacity-0 group-hover:opacity-100 transition-opacity duration-150`
- Botão editar: hover âmbar (`rgba(212,150,12,.15)` + `#D4960C`)
- Botão desativar: hover vermelho (`rgba(239,68,68,.15)` + `#F87171`)
- Botões omitidos quando a prop correspondente é `undefined`
- A `<td>` pai deve ter `className="group"`

#### `components/ui/KpiCard.tsx`
Card de métrica com glow para dashboard e futuras páginas de overview.

```tsx
type KpiVariante = 'amber' | 'green' | 'yellow' | 'blue'

interface KpiCardProps {
  valor: string | number
  label: string
  tendencia?: string
  variante?: KpiVariante  // padrão: 'amber'
}
```

Visual: número grande com glow colorido, linha de gradiente no topo do card, fundo glassmorphism.

### Componentes existentes — apenas upgrade visual (sem mudança de API)

`PageHeader`, `FilterBar`, `FilterBarActions`, `FormCard`, `FormSection`, `FormActions`, `FormTextarea`, `SkeletonTable`, `LoadingState`, `EmptyState` — todos recebem o visual dark mas mantêm exatamente as mesmas props.

---

## Seção 2 — Tokens & Visual System

### Paleta de superfícies (substituição completa dos tokens `--ada-*`)

```css
/* Fundos */
--ada-bg:           #080F1C   /* Fundo da página */
--ada-surface:      #0D1829   /* Cards, modais, tabelas */
--ada-surface-2:    #111E35   /* Header de tabelas, surface secundário */
--ada-border:       rgba(255,255,255,.07)
--ada-border-sub:   rgba(255,255,255,.04)
--ada-hover:        rgba(255,255,255,.03)

/* Tipografia */
--ada-heading:      #F1F5F9
--ada-body:         #94A3B8
--ada-muted:        #475569
--ada-muted-dim:    #334155
--ada-placeholder:  #334155

/* Estados semânticos — tonais (sem saturação excessiva no dark) */
--ada-success-bg:     rgba(74,222,128,.1)
--ada-success-border: rgba(74,222,128,.2)
--ada-success-text:   #4ADE80

--ada-warning-bg:     rgba(252,211,77,.1)
--ada-warning-border: rgba(252,211,77,.2)
--ada-warning-text:   #FCD34D
--ada-warning-badge:  rgba(252,211,77,.1)

--ada-error-bg:     rgba(248,113,113,.1)
--ada-error-border: rgba(248,113,113,.2)
--ada-error-text:   #F87171
--ada-error-badge:  rgba(248,113,113,.1)

--ada-row-alert:       rgba(252,211,77,.04)
--ada-row-alert-hover: rgba(252,211,77,.07)
```

Os tokens de sidebar (`--sb-*`) e topbar (`--topbar-*`) permanecem inalterados — já são escuros.

### Tipografia

- **Headings:** Sora 700, `letter-spacing: -.02em` a `-.04em` conforme tamanho
- **Body:** Inter 400/500, `letter-spacing: normal`
- **Labels uppercase:** Inter 700, `font-size: 10px`, `letter-spacing: .08em`
- **Números:** `font-variant-numeric: tabular-nums`, Inter 500

### Padrões visuais novos

**Glassmorphism** (cards e filtros):
```css
background: rgba(255,255,255,.025);
border: 1px solid rgba(255,255,255,.07);
backdrop-filter: blur(8px);
/* Opcional: gradiente sutil no topo */
background: linear-gradient(180deg, rgba(255,255,255,.04) 0%, transparent 100%);
```

**Glow em KPIs e botão primário:**
```css
/* Número âmbar */
color: #D4960C;
text-shadow: 0 0 24px rgba(212,150,12,.4);

/* Botão primário */
box-shadow: 0 0 20px rgba(212,150,12,.35), 0 4px 12px rgba(0,0,0,.3);
```

**Accent bar em tabelas** (primeira coluna):
```css
display: inline-block;
width: 2px; height: 28px;
border-radius: 1px;
background: linear-gradient(180deg, #D4960C 0%, transparent 100%);
opacity: .8;
/* Em linhas de alerta: trocar âmbar por #FCD34D */
```

**Linha de alerta** (estoque abaixo do mínimo):
```css
background: rgba(252,211,77,.04);
/* hover: rgba(252,211,77,.07) */
```

**Inputs dark:**
```css
background: rgba(255,255,255,.05);
border: 1px solid rgba(255,255,255,.08);
color: #CBD5E1;
/* focus: */
border-color: rgba(212,150,12,.5);
box-shadow: 0 0 0 3px rgba(212,150,12,.12);
```

**Chips de filtro** (cor muda para âmbar):
```css
background: rgba(212,150,12,.1);
border: 1px solid rgba(212,150,12,.2);
color: #D4960C;
```

**Regra de ouro:**
> Nunca usar `#000` puro nem `#fff` puro em superfícies. Todo fundo tem um toque de azul marinho. O âmbar (`#D4960C`) é o único acento quente — aparece em números de KPI, botão primário, accent bars e chips.

### Botões

| Variante | Background | Borda | Texto | Extra |
|---|---|---|---|---|
| Primary | `linear-gradient(#D4960C, #B87D0A)` | — | `#fff` | `box-shadow` glow âmbar |
| Ghost | `rgba(255,255,255,.04)` | `rgba(255,255,255,.1)` | `#94A3B8` | hover: bg 7%, borda 15% |
| Danger | `rgba(239,68,68,.15)` | `rgba(239,68,68,.25)` | `#F87171` | tonal, sem gradiente |
| Filter | `rgba(64,128,239,.15)` | `rgba(64,128,239,.25)` | `#93C5FD` | botão de submit no FilterBar |

---

## Seção 3 — API dos Componentes (referência rápida)

Detalhes completos nas interfaces acima. Resumo de uso:

```tsx
// FiltroPeriodo
<FiltroPeriodo de={de} onChangeDe={setDe} ate={ate} onChangeAte={setAte} />

// StatusBadge
<StatusBadge variante="ativo" />
<StatusBadge variante="baixo" label="Estoque Baixo" />

// TabelaAcoesLinha (dentro de <tr className="group">)
<TabelaAcoesLinha
  onEditar={() => navigate(`/ingredientes/${id}/editar`)}
  onDesativar={() => setParaDesativar(item)}
  labelEditar={`Editar ${item.nome}`}
  labelDesativar={`Desativar ${item.nome}`}
/>

// KpiCard
<KpiCard valor="147" label="Ingredientes ativos" tendencia="+5 este mês" variante="amber" />

// Imports corretos após migração
import { Toast }           from '@/components/ui/Toast'
import { ModalDesativar }  from '@/components/ui/ModalDesativar'
import { CampoTexto }      from '@/components/form/CampoTexto'
import { SelectCampo }     from '@/components/form/SelectCampo'
```

---

## Seção 4 — Estratégia de Migração (Foundation First)

### Ordem de execução

**Fase 1 — Tokens (1 arquivo, impacto global)**
- Atualizar `src/index.css`: substituir todos os tokens `--ada-*` pelos valores dark premium
- Atualizar classes utilitárias: `.btn-*`, `.badge-*`, `.filter-*`, `.modal-*`, `.table-*`, `.state-*`
- Adicionar padrões novos: glassmorphism, glow, accent bar, inputs dark, chips âmbar

**Fase 2 — Criar componentes novos**
- `FiltroPeriodo.tsx`
- `StatusBadge.tsx`
- `TabelaAcoesLinha.tsx`
- `KpiCard.tsx`

**Fase 3 — Mover componentes existentes**
- Mover `Toast`, `ModalDesativar` → `components/ui/`
- Mover `CampoTexto`, `SelectCampo` → `components/form/`
- Atualizar visual de cada um para dark premium durante a movimentação

**Fase 4 — Atualizar imports em todas as pages afetadas**
- Todas as pages que importavam de `features/estoque/ingredientes/components/`
- Busca global por `@/features/estoque/ingredientes/components/` → substituir pelo novo path

**Fase 5 — Aplicar `FiltroPeriodo` nas 10 páginas de filtro**
- `EntradasPage`, `ProducaoDiariaPage`, `VendasDiariasPage`, `PerdasPage`, `MovimentacoesPage`, `EntradasRelatorioPage`, `InsumosProducaoPage`, `ProducaoVendasRelatorioPage`, `ComparacaoPrecoPage`, `DashboardPage`

**Fase 6 — Aplicar `StatusBadge` em todas as tabelas**
- Substituir todos os `<span className="badge badge-*">` e variações inline

**Fase 7 — Aplicar `TabelaAcoesLinha` em todas as tabelas com ações**
- Substituir o padrão `opacity-0 group-hover:opacity-100` inline em cada tabela

**Fase 8 — Upgrade visual dos componentes existentes**
- `PageHeader`, `FilterBar`, `FormCard`, `FormSection`, `SkeletonTable`, `EmptyState`, `LoadingState`
- Sem mudança de API — apenas CSS vars já atualizadas na Fase 1 e ajustes pontuais

**Fase 9 — Accent bars e micro-detalhes por módulo**
- Adicionar accent bar (`<span class="accent-bar">`) na primeira célula de nome em: `TabelaIngredientes`, `TabelaCategorias`, `TabelaCategoriasProduto`, tabela inline de `FornecedoresPage`, `ProdutosPage`, `ProducaoDiariaPage`, `VendasDiariasPage`, `PerdasPage`
- Adicionar fundo de alerta (`--ada-row-alert`) nas linhas de estoque abaixo do mínimo em `TabelaIngredientes`
- Accent bar âmbar em linhas normais, amarelo (`#FCD34D`) em linhas de alerta

### Convenção a adicionar no `CLAUDE.md`
```
**Componentes:** qualquer componente que apareça em 3+ módulos deve ficar em
`src/components/ui/` ou `src/components/form/`. Componentes de uso único
permanecem no feature. Imports de componentes globais nunca apontam para dentro
de `features/`.
```

---

## Fora de escopo

- Formulários de registro com `type="date"` que aceitam datas futuras (`dataValidade`, etc.) — não recebem `max`
- Módulos de autenticação (`features/auth/`) — já têm visual próprio e animações elaboradas
- Relatórios PDF — geração server-side, não impactada
- Backend / API — zero mudanças
