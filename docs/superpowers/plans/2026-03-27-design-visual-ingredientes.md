# Design Visual – Tela de Ingredientes | Casa di Ana

> **Escopo:** Plano visual e de UX para as telas de Ingredientes (listagem + formulário).
> Não contém código de implementação — serve de referência para as etapas de desenvolvimento.

---

## 1. Direção Estética

**Tema:** *Café Rústico Refinado* — gestão operacional com calor e clareza.
Referência: quadro de pedidos de uma cafeteria bem organizada, digitalizado.

### Paleta de cores (Tailwind)

| Função | Classe Tailwind | Hex |
|--------|-----------------|-----|
| Sidebar | `bg-stone-900` | #1c1917 |
| Fundo principal | `bg-stone-50` | #fafaf9 |
| Card / painel | `bg-white` | #ffffff |
| Primário (botões, links) | `bg-amber-700` | #b45309 |
| Primário hover | `bg-amber-800` | #92400e |
| Texto principal | `text-stone-800` | #292524 |
| Texto secundário | `text-stone-500` | #78716c |
| Borda | `border-stone-200` | #e7e5e4 |
| Badge abaixo do mínimo | `bg-red-100 text-red-700` | — |
| Badge ativo | `bg-green-100 text-green-700` | — |
| Badge inativo | `bg-stone-100 text-stone-500` | — |
| Linha hover tabela | `hover:bg-amber-50` | — |

### Tipografia

- **Fonte:** `font-sans` (Inter via Google Fonts — exceção justificada: legibilidade operacional)
- Títulos de página: `text-2xl font-semibold text-stone-800`
- Subtítulos de seção: `text-sm font-medium text-stone-500 uppercase tracking-wide`
- Corpo: `text-sm text-stone-700`
- Labels de formulário: `text-sm font-medium text-stone-700`

---

## 2. Layout Global

```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR (w-64, bg-stone-900, fixo)  │  CONTEÚDO PRINCIPAL       │
│                                     │  (flex-1, bg-stone-50)    │
│  [logo Casa di Ana]                 │  ┌─────────────────────┐  │
│                                     │  │ PAGE HEADER         │  │
│  Cadastros ──────                   │  │ título + ação       │  │
│   › Ingredientes  ← ativo           │  └─────────────────────┘  │
│   › Categorias                      │  ┌─────────────────────┐  │
│   › Fornecedores                    │  │ CONTEÚDO DA PÁGINA  │  │
│                                     │  │ filtros / tabela /  │  │
│  Movimentações ──                   │  │ formulário          │  │
│   › Entradas                        │  └─────────────────────┘  │
│   › Inventário                      │                           │
│                                     │                           │
│  Relatórios ─────                   │                           │
│   › Estoque Atual                   │                           │
│   › Movimentações                   │                           │
│   › Entradas                        │                           │
│                                     │                           │
│  ─────────────────                  │                           │
│  [avatar] Maria Admin               │                           │
│  [Sair]                             │                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tela: IngredientesPage (Listagem)

### 3.1 Hierarquia visual

```
┌─────────────────────────────────────────────────────────────┐
│  Ingredientes                           [+ Novo Ingrediente] │
│  text-2xl font-semibold                 btn amber-700        │
├─────────────────────────────────────────────────────────────┤
│  BARRA DE FILTROS (bg-white, rounded-xl, shadow-sm, p-4)    │
│  ┌──────────────────────────┐ ┌────────────┐ ┌───────────┐  │
│  │ 🔍 Buscar por nome...    │ │ Categoria ▼│ │ ⚠ Abaixo  │  │
│  │ input text w-full        │ │ select     │ │ do mínimo │  │
│  └──────────────────────────┘ └────────────┘ └───────────┘  │
│                                            toggle checkbox   │
├─────────────────────────────────────────────────────────────┤
│  TABELA (bg-white, rounded-xl, shadow-sm)                   │
│  ┌────┬───────────┬──────┬────────┬───────┬───────┬──────┐  │
│  │    │ Nome      │ Cód. │Categ.  │Unid.  │Estoque│      │  │
│  │    │ font-med  │ muted│ muted  │ muted │atual/mín│ Ações│  │
│  ├────┼───────────┼──────┼────────┼───────┼───────┼──────┤  │
│  │    │ Farinha   │ FA01 │ Seco   │  KG   │ 5,0 /  │ ✏ 🗑 │  │
│  │    │ de Trigo  │      │        │       │ 10,0 ⚠ │      │  │
│  │    │           │      │        │       │[badge] │      │  │
│  ├────┼───────────┼──────┼────────┼───────┼───────┼──────┤  │
│  │    │ Leite     │ —    │ Líquido│  L    │ 20,0 / │ ✏ 🗑 │  │
│  │    │           │      │        │       │  5,0   │      │  │
│  └────┴───────────┴──────┴────────┴───────┴───────┴──────┘  │
│  Mostrando 1–10 de 47   [← Ant]  1 2 3 … 5  [Próx →]       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Especificação dos elementos

**Page Header**
```
flex items-center justify-between mb-6
h1: text-2xl font-semibold text-stone-800
button: bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg
        text-sm font-medium flex items-center gap-2
        [ícone PlusIcon 16px] "Novo Ingrediente"
```

**Barra de Filtros**
```
bg-white rounded-xl shadow-sm p-4 mb-4
flex flex-wrap gap-3 items-center

Busca: flex-1 min-w-[200px]
  input: border border-stone-200 rounded-lg px-3 py-2 text-sm
         pl-9 (com ícone MagnifyingGlass) w-full
         focus:ring-2 focus:ring-amber-500 focus:border-transparent

Select Categoria: w-48
  select: border border-stone-200 rounded-lg px-3 py-2 text-sm

Toggle: flex items-center gap-2
  checkbox: accent-amber-700
  label: text-sm text-stone-600 "Abaixo do mínimo"
```

**Tabela**
```
bg-white rounded-xl shadow-sm overflow-hidden

thead: bg-stone-50 border-b border-stone-200
  th: text-xs font-medium text-stone-500 uppercase tracking-wide
      px-4 py-3 text-left

tbody:
  tr: border-b border-stone-100 hover:bg-amber-50 transition-colors

  Coluna Nome: text-sm font-medium text-stone-800
  Coluna Código: text-sm text-stone-500 font-mono
  Coluna Categoria / Unidade: text-sm text-stone-600

  Coluna Estoque:
    valor atual: text-sm font-semibold text-stone-800
    separador " / " text-stone-400
    valor mínimo: text-xs text-stone-500
    badge abaixo mínimo: inline-flex items-center gap-1 px-2 py-0.5
                          bg-red-100 text-red-700 rounded-full text-xs font-medium
                          [ícone ExclamationTriangle 12px] "Baixo"

  Coluna Ações:
    botão editar: p-1.5 rounded hover:bg-stone-100 text-stone-500
                  hover:text-amber-700 [ícone PencilSquare 16px]
    botão desativar: p-1.5 rounded hover:bg-stone-100 text-stone-500
                     hover:text-red-600 [ícone TrashIcon 16px]
                     (só exibe para Admin/Coordenador/Compras)
```

**Paginação**
```
flex items-center justify-between px-4 py-3 border-t border-stone-100

Texto: text-sm text-stone-500
  "Mostrando {inicio}–{fim} de {total} ingredientes"

Botões:
  anterior/próximo: px-3 py-1.5 border rounded text-sm
                    disabled: opacity-40 cursor-not-allowed
  página atual: bg-amber-700 text-white px-3 py-1.5 rounded text-sm
  outras páginas: hover:bg-stone-100 px-3 py-1.5 rounded text-sm
```

**Estado vazio**
```
py-16 text-center
ícone: BeakerIcon 48px text-stone-300
texto: "Nenhum ingrediente encontrado"
       text-stone-500 mt-2
subtexto (se filtro ativo): "Tente ajustar os filtros"
```

---

## 4. Tela: IngredienteFormPage (Criar / Editar)

### 4.1 Hierarquia visual

```
┌─────────────────────────────────────────────────────────────┐
│  [← Ingredientes]   Novo Ingrediente                        │
│  link breadcrumb    text-2xl font-semibold                  │
├─────────────────────────────────────────────────────────────┤
│  CARD DO FORMULÁRIO (bg-white, rounded-xl, shadow-sm, p-6) │
│                                                             │
│  Identificação ─────────────────────────────────────────── │
│  ┌───────────────────────────┐  ┌──────────────────────┐   │
│  │ Nome *                    │  │ Código Interno        │   │
│  │ [__________________]      │  │ [______________]      │   │
│  └───────────────────────────┘  └──────────────────────┘   │
│  col-span-2                      col-span-1                 │
│                                                             │
│  Classificação ─────────────────────────────────────────── │
│  ┌──────────────────────────────┐  ┌────────────────────┐  │
│  │ Categoria                    │  │ Unidade de Medida * │  │
│  │ [Selecione a categoria  ▼]   │  │ [Selecione...    ▼] │  │
│  └──────────────────────────────┘  └────────────────────┘  │
│                                                             │
│  Controle de Estoque ───────────────────────────────────── │
│  ┌───────────────────────┐  ┌───────────────────────────┐  │
│  │ Estoque Mínimo *      │  │ Estoque Máximo            │  │
│  │ [_______] KG          │  │ [_______] KG  (opcional)  │  │
│  └───────────────────────┘  └───────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Observações                                           │  │
│  │ [textarea 3 linhas]                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│               [Cancelar]            [Salvar Ingrediente]    │
│               btn outline           btn amber-700           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Especificação dos elementos

**Breadcrumb / Voltar**
```
flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6
[ChevronLeft 16px] "Ingredientes"
link: cursor-pointer, underline-none
```

**Seções do formulário**
```
Separador de seção:
  text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4 mt-6
  com linha: after:content-[''] after:flex-1 after:border-t after:border-stone-100

Grid: grid grid-cols-3 gap-4
  Nome: col-span-2
  Código: col-span-1
  Categoria: col-span-1 (ou col-span-2 se sem código)
  Unidade: col-span-1
  Mínimo: col-span-1
  Máximo: col-span-1
  Obs: col-span-3
```

**Campo de input**
```
label: block text-sm font-medium text-stone-700 mb-1
       + span " *" text-red-500 (se obrigatório)
input: w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
       disabled: bg-stone-50 cursor-not-allowed
erro: mt-1 text-xs text-red-600 flex items-center gap-1
      [ExclamationCircle 12px] mensagem
```

**Select**
```
select: w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
        appearance-none bg-[url(chevron)] bg-no-repeat bg-right
        focus:outline-none focus:ring-2 focus:ring-amber-500
opção padrão: text-stone-400 "Selecione..."
```

**Input numérico com unidade**
```
div: relative flex items-center
input: w-full border rounded-lg px-3 py-2.5 text-sm pr-12
span unidade: absolute right-3 text-sm text-stone-400 font-medium
              (ex: "KG", "L", "UN") — lida do ingrediente selecionado
```

**Rodapé do formulário**
```
flex justify-end gap-3 pt-4 mt-6 border-t border-stone-100

Cancelar: px-4 py-2.5 border border-stone-200 rounded-lg text-sm
          text-stone-600 hover:bg-stone-50 font-medium

Salvar: px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white
        rounded-lg text-sm font-medium disabled:opacity-50
        [spinner quando carregando]
```

**Toast de feedback** (canto superior direito)
```
Sucesso: bg-green-50 border border-green-200 text-green-800
         [CheckCircle] "Ingrediente salvo com sucesso"
Erro: bg-red-50 border border-red-200 text-red-800
      [XCircle] mensagem de erro da API
Duração: 4 segundos, auto-dismiss
```

---

## 5. Usabilidade — Decisões Importantes

| Decisão | Justificativa |
|---------|---------------|
| Formulário em página separada (não modal) | Usuários com baixa proficiência — modal complexo aumenta erros |
| Inputs com tamanho `py-2.5` (não `py-1`) | Alvos de toque maiores, menos erros de clique |
| Unidade exibida ao lado do campo numérico | Evita confusão de grandeza sem abrir outro campo |
| Badge de alerta na tabela (não só cor) | Daltonismo — ícone + texto além da cor |
| "Desativar" em vez de "Excluir" | Preserva histórico; ação menos destrutiva visualmente |
| Confirmação antes de desativar | Modal simples: "Desativar Farinha de Trigo?" [Cancelar] [Desativar] |
| Paginação client-side (dados em memória) | Lista pequena (~50–200 itens) — evita loading a cada filtro |

---

## 6. Plano de Integração — Endpoints de Ingredientes

Dividido em **3 etapas independentes**, cada uma gerando um documento de implementação curto.

### Etapa 1 — Fundação: Tipos + Serviço + Hooks
**Documento:** `2026-03-27-ingredientes-etapa1-service.md`

Endpoints cobertos:
- `GET /api/ingredientes?apenasAtivos=true` (listar)
- `GET /api/ingredientes/{id}` (obter para edição)
- `GET /api/categorias` (para select de categoria)
- `GET /api/unidades-medida` (para select de unidade)

Entregável: tipos TS + `ingredientesService.ts` + `useIngredientes.ts` + `useIngredienteForm.ts`

---

### Etapa 2 — Tela de Listagem
**Documento:** `2026-03-27-ingredientes-etapa2-listagem.md`

Endpoints cobertos:
- `GET /api/ingredientes?apenasAtivos=true` ✅ (já do hook)
- `DELETE /api/ingredientes/{id}` (desativar com confirmação)

Entregável: `IngredientesPage.tsx` completa com filtros, tabela, paginação e desativação.

---

### Etapa 3 — Formulário Criar/Editar
**Documento:** `2026-03-27-ingredientes-etapa3-formulario.md`

Endpoints cobertos:
- `POST /api/ingredientes` (criar)
- `PUT /api/ingredientes/{id}` (editar)
- `GET /api/ingredientes/{id}` ✅ (pre-fill no edit — já do hook)

Entregável: `IngredienteFormPage.tsx` com validação Zod + React Hook Form + feedback toast.

---

> **Próximo passo:** Confirmar o design visual e iniciar `Etapa 1 — Fundação`.
