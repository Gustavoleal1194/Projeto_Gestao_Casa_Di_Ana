# Combobox com Busca para Selects de Catálogo — Design

## 1. Contexto e problema

Hoje `frontend/src/components/form/SelectCampo.tsx` é um `<select>` nativo usado em 9 arquivos de formulário. Para campos cujas opções vêm de catálogos (Fornecedor, Produto, Ingrediente, Utensílio, Categoria), a lista pode crescer a dezenas/centenas de itens, e o `<select>` nativo não oferece busca — o usuário precisa rolar e ler item por item para encontrar o que quer.

Pedido do usuário: adicionar um filtro de pesquisa aos dropdowns de seleção, especificamente onde a lista de opções vem de um cadastro/catálogo (não nos selects de opções fixas, como "Tipo do Produto" ou o seletor Ingrediente/Utensílio dentro da entrada de mercadoria).

## 2. Decisões

- **Escopo:** o filtro de busca é adicionado só aos selects que listam entidades de um cadastro (ver tabela da seção 5). Selects de opção fixa/enum continuam como `<select>` nativo via `SelectCampo`, sem mudança.
- **Abordagem técnica:** `@headlessui/react` (`Combobox`), versão `^2.2.10` — biblioteca headless (sem estilo próprio) mantida pelo time do Tailwind, compatível oficialmente com React 19 (`peerDependencies: react: "^18 || ^19"`). Resolve teclado/ARIA/foco corretamente, sem precisar reimplementar isso à mão.
- **Novo componente**, não uma reescrita do `SelectCampo`: `frontend/src/components/form/ComboboxCampo.tsx`. O `SelectCampo.tsx` existente fica intocado.
- **Integração com React Hook Form:** como o Headless UI `Combobox` não é um elemento nativo compatível com `register()`, o `ComboboxCampo` recebe `control` e `name` do formulário e faz o `useController` internamente — quem usa o componente não escreve `<Controller>` manualmente, só troca `<SelectCampo opcoes={...} {...register('x')} />` por `<ComboboxCampo control={control} name="x" opcoes={...} />`.
- **Filtro:** substring, case-insensitive, **sem considerar acentuação** (normalizar removendo diacríticos antes de comparar — ex: "acai" encontra "Açaí").
- **Sem mudança de backend.** As opções já chegam carregadas via os services existentes (`ingredientesService.listar()`, `fornecedoresService.listar()`, etc.); a filtragem é 100% client-side sobre a lista já em memória.

## 3. API do componente

```ts
interface OpcaoCombobox {
  valor: string | number
  rotulo: string
}

interface ComboboxCampoProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  opcoes: OpcaoCombobox[]
  erro?: string
  obrigatorio?: boolean
  placeholder?: string       // ex: "Buscar fornecedor…"
  disabled?: boolean
  id?: string
}
```

- `opcoes` usa o mesmo shape `{ valor, rotulo }` já usado por `SelectCampo` — zero mudança na forma como as páginas já mapeiam seus dados (`fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))` continua igual).
- `erro` é explícito (não derivado internamente de `fieldState`), igual ao padrão já usado por `CampoTexto`/`SelectCampo` — a página continua passando `errors.fornecedorId?.message`.
- Visual: mesmos tokens `var(--ada-*)` do `SelectCampo`, mesma altura/padding/borda, para não haver salto visual entre campos vizinhos de um formulário.

## 4. Comportamento de busca e UX

- Ao focar/clicar: mostra a lista completa de opções.
- Ao digitar: filtra em tempo real (substring, case-insensitive, sem acento).
- Navegação por teclado: setas para navegar, Enter para selecionar, Esc para fechar — nativo do Headless UI `Combobox`.
- Estado vazio: nenhum resultado → mostra "Nenhum resultado encontrado." dentro do dropdown, em vez de lista vazia sem feedback.
- Campo fechado mostra o **rótulo** da opção selecionada; ao focar/digitar, o texto do campo vira a busca (não o valor selecionado).
- Botão de limpar (✕) aparece apenas quando `obrigatorio` é falso e há uma opção selecionada — limpa para o estado vazio (`valor` volta a `''`/`undefined`, igual ao comportamento de `placeholderOpcao` do `SelectCampo`).
- O valor efetivamente enviado ao backend continua sendo o `valor` (id) da opção, nunca o rótulo — mesma semântica de hoje.

## 5. Arquivos migrados

| Arquivo | Select(s) que trocam para `ComboboxCampo` |
|---|---|
| `features/entradas/pages/EntradaFormPage.tsx` | Fornecedor; seletor de item (Ingrediente/Utensílio) de cada linha |
| `features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | Categoria |
| `features/estoque/utensilios/pages/UtensilioFormPage.tsx` | Categoria |
| `features/inventarios/pages/InventarioDetalhePage.tsx` | Ingrediente |
| `features/producao/produtos/pages/ProdutoFormPage.tsx` | Categoria |
| `features/producao/produtos/components/IngredientesForm.tsx` | Ingrediente (por linha da ficha técnica) |
| `features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` | Produto |
| `features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` | Produto |
| `features/producao/perdas/pages/PerdasPage.tsx` | Produto |

**Ficam com `SelectCampo` nativo (sem mudança):** "Tipo do Produto" (`TIPO_OPCOES`, fixo) em `ProdutoFormPage.tsx`; o seletor "Tipo" (Ingrediente/Utensílio) de cada linha em `EntradaFormPage.tsx`; "Unidade de Medida" em todos os formulários (lista curta, tipicamente <15 itens cadastrados).

## 6. Dependência nova

Adicionar `@headlessui/react` (`^2.2.10`) a `frontend/package.json`. Sem dependências transitivas problemáticas conhecidas; peer deps (`react`/`react-dom` `^18 || ^19`) já satisfeitas pela versão atual do projeto (React 19.2.4). Biblioteca headless — não traz CSS próprio, não conflita com os tokens `var(--ada-*)` nem com Tailwind v4 já em uso.

## 7. Testes e verificação

O frontend não tem suíte automatizada (Vitest/RTL) hoje — só `npx tsc --noEmit`. Verificação desta feature:

- `npx tsc --noEmit` limpo em todo o projeto após a migração.
- `npm run build` sem erros.
- Checklist manual por formulário migrado:
  1. Abrir o campo sem digitar → lista completa aparece.
  2. Digitar parte de um nome com acento (ex: "acai") → encontra o item acentuado ("Açaí").
  3. Navegar com teclado (seta + Enter) → seleciona corretamente.
  4. Limpar seleção via ✕ (nos campos não obrigatórios) → volta ao estado vazio.
  5. Submeter o formulário → confirmar no payload de rede (ou na tela de detalhe criada) que o `id` correto foi enviado, não o texto digitado/rótulo.
  6. Campo de busca dentro de lista dinâmica (ex: ingrediente por linha da ficha técnica, item de entrada) → abrir/filtrar/selecionar em mais de uma linha simultaneamente sem vazar estado entre linhas.

## 8. Fora de escopo

- Busca assíncrona/paginada no backend (debounce + chamada à API por tecla) — todas as listas atuais já são carregadas inteiras no front; isso só seria necessário se algum catálogo crescesse a um tamanho que tornasse carregar tudo de uma vez impraticável. Não é o caso hoje.
- Migração dos selects de opção fixa (enum) para o novo componente.
- Qualquer mudança em `SelectCampo.tsx` existente.
- Mudança de backend/DTOs — nenhuma, feature é puramente de frontend sobre dados já carregados.
