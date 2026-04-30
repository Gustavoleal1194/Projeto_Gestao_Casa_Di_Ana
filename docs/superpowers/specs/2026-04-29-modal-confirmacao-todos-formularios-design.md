# Spec: Modal de Confirmação Animado — Todos os Formulários

**Data:** 2026-04-29  
**Status:** Aprovado

---

## Contexto

A aplicação Casa di Ana já possui 4 modais de confirmação animados implementados e validados:

- `ConfirmacaoImportacaoModal` — importação de vendas
- `ConfirmacaoEntradaModal` — registro de entrada de nota fiscal
- `ConfirmacaoProducaoModal` — produção diária
- `ConfirmacaoVendaModal` — vendas diárias

O objetivo é aplicar o mesmo padrão visual a todos os demais formulários da aplicação que ainda usam apenas toast de feedback.

---

## Decisões de Design

- **Abordagem:** Componentes individuais por formulário (Opção A) — sem componente genérico, mantendo consistência exata com os 4 modais existentes.
- **Justificativa:** Cada formulário tem dados distintos; componentes individuais são explícitos, fáceis de manter e não criam prop API que cresce com o tempo.
- **Botão secundário nos CRUD forms:** "Ver [Lista]" → navega para a lista correspondente.
- **QuickCreateProductModal:** exceção — apenas botão "Fechar", pois o fluxo retorna ao modal de importação de vendas (modal sobre modal).

---

## Os 8 Novos Modais

### 1. `ConfirmacaoPerdasModal`
- **Localização:** `features/producao/perdas/components/ConfirmacaoPerdasModal.tsx`
- **Dados exibidos:** produto, quantidade perdida, motivo, horário
- **Botão secundário:** "Ver Perdas" → navega para `/producao/perdas`
- **Integração:** `PerdasPage.tsx` — após sucesso em `onSubmitPerda()`

```ts
interface DadosConfirmacaoPerdas {
  produtoNome: string
  quantidade: number
  unidade: string
  motivo: string
  horario: string
}
```

---

### 2. `ConfirmacaoProdutoModal`
- **Localização:** `features/producao/produtos/components/ConfirmacaoProdutoModal.tsx`
- **Dados exibidos:** nome do produto, categoria, preço de venda, modo (criado/atualizado)
- **Botão secundário:** "Ver Produtos" → navega para `/producao/produtos`
- **Integração:** `ProdutoFormPage.tsx` — após sucesso em `onSubmit()`

```ts
interface DadosConfirmacaoProduto {
  produtoNome: string
  categoria: string
  precoVenda: number
  modo: 'criado' | 'atualizado'
}
```

---

### 3. `ConfirmacaoIngredienteModal`
- **Localização:** `features/estoque/ingredientes/components/ConfirmacaoIngredienteModal.tsx`
- **Dados exibidos:** nome do ingrediente, unidade de medida, estoque atual, modo (criado/atualizado)
- **Botão secundário:** "Ver Ingredientes" → navega para `/estoque/ingredientes`
- **Integração:** `IngredienteFormPage.tsx` — após sucesso em `onSubmit()`

```ts
interface DadosConfirmacaoIngrediente {
  ingredienteNome: string
  unidade: string
  estoqueAtual: number
  modo: 'criado' | 'atualizado'
}
```

---

### 4. `ConfirmacaoFornecedorModal`
- **Localização:** `features/fornecedores/components/ConfirmacaoFornecedorModal.tsx`
- **Dados exibidos:** nome do fornecedor, telefone ou e-mail, modo (criado/atualizado)
- **Botão secundário:** "Ver Fornecedores" → navega para `/fornecedores`
- **Integração:** `FornecedorFormPage.tsx` — após sucesso em `onSubmit()`

```ts
interface DadosConfirmacaoFornecedor {
  fornecedorNome: string
  contato: string   // telefone ou e-mail, o que estiver disponível
  modo: 'criado' | 'atualizado'
}
```

---

### 5. `ConfirmacaoInicioInventarioModal`
- **Localização:** `features/inventarios/components/ConfirmacaoInicioInventarioModal.tsx`
- **Dados exibidos:** data de início, operador responsável
- **Botão secundário:** "Ver Inventário" → navega para `/inventarios/:id`
- **Integração:** `InventarioFormPage.tsx` — após sucesso em `onSubmit()`

```ts
interface DadosConfirmacaoInicioInventario {
  dataInicio: string
  operador: string
  inventarioId: string
}
```

---

### 6. `ConfirmacaoFinalizacaoInventarioModal`
- **Localização:** `features/inventarios/components/ConfirmacaoFinalizacaoInventarioModal.tsx`
- **Dados exibidos:** total de itens contados, valor total contado, operador, data/hora
- **Botão secundário:** "Ver Inventário" → permanece na página (scroll para topo ou recarrega dados)
- **Integração:** `InventarioDetalhePage.tsx` — após sucesso em `handleFinalizar()`

```ts
interface DadosConfirmacaoFinalizacaoInventario {
  totalItens: number
  valorTotal: number
  operador: string
  horario: string
}
```

---

### 7. `ConfirmacaoFichaTecnicaModal`
- **Localização:** `features/producao/produtos/components/ConfirmacaoFichaTecnicaModal.tsx`
- **Dados exibidos:** nome do produto, número de ingredientes, custo unitário calculado
- **Botão secundário:** "Ver Ficha" → permanece na página (fecha modal apenas)
- **Integração:** `FichaTecnicaPage.tsx` — após sucesso em `onSubmit()`

```ts
interface DadosConfirmacaoFichaTecnica {
  produtoNome: string
  totalIngredientes: number
  custoUnitario: number
}
```

---

### 8. `ConfirmacaoCriacaoRapidaModal`
- **Localização:** `features/producao/importacao-vendas/components/ConfirmacaoCriacaoRapidaModal.tsx`
- **Dados exibidos:** nome do produto criado
- **Botão secundário:** nenhum — apenas "Fechar" (retorna ao fluxo de importação)
- **Integração:** `QuickCreateProductModal.tsx` — após sucesso em `onSubmit()`

```ts
interface DadosConfirmacaoCriacaoRapida {
  produtoNome: string
}
```

---

## Padrão Visual (replicar fielmente dos 4 existentes)

Cada modal deve implementar:

- **Overlay:** fixo, `z-index: 200`, backdrop blur, fundo escuro semi-transparente, fade-in 200ms
- **Card:** centralizado, scale-in 350ms cubic-bezier, cantos arredondados, sombra elevada
- **Header colorido:** cor temática da feature (ex: vermelho para perdas, azul para ingredientes)
- **Checkmark SVG animado:** círculo desenhado (`circleDraw`) + checkmark (`checkDraw`) + ripple + sparkles escalonadas
- **Dados em lista:** itens com label + valor, números animados com `useCountUp` (hook existente)
- **Botões:** fade-up com delay ~1100ms, "Fechar" (outline) + botão secundário (filled)

---

## Integração nas Páginas

Padrão de integração idêntico ao existente:

```tsx
// 1. Estado
const [confirma, setConfirma] = useState<DadosConfirmacaoXxx | null>(null)

// 2. Após sucesso da API
setConfirma({ ...dadosDoResultado })

// 3. Renderização
{confirma && (
  <ConfirmacaoXxxModal
    aberto
    dados={confirma}
    onFechar={() => { setConfirma(null); reset() }}
    onVerLista={() => { setConfirma(null); navigate('/rota') }}
  />
)}
```

O toast de sucesso existente é **removido** e substituído pelo modal. Toasts de erro permanecem.

---

## Fora de Escopo

- Refatoração dos 4 modais existentes
- Componente genérico/reutilizável
- `InventarioDetalhePage.tsx` — ação de **adicionar item** (frequência alta, modal seria intrusivo; manter toast)
- Mudanças de rotas ou navegação além das descritas
