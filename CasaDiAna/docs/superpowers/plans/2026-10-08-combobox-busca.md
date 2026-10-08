# Combobox com Busca para Selects de Catálogo — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um novo componente `ComboboxCampo` (select com busca, baseado em `@headlessui/react`) e migrar para ele os selects cujas opções vêm de um cadastro/catálogo (Fornecedor, Produto, Ingrediente, Utensílio, Categoria), mantendo `SelectCampo` nativo para os selects de opção fixa (Tipo do Produto, Tipo de item, Unidade de Medida).

**Architecture:** `ComboboxCampo` é um novo primitivo em `components/form/`, ao lado do `SelectCampo` existente (que não é alterado). Recebe `control`/`name` do React Hook Form (igual a um `Controller` interno) em vez de `register()`, porque o Headless UI `Combobox` não é um elemento nativo. O shape de dados (`opcoes: {valor, rotulo}[]`) é idêntico ao do `SelectCampo`, então as páginas não mudam como carregam/mapeiam seus dados — só trocam o componente e a forma de conectar ao formulário.

**Tech Stack:** React 19, TypeScript, React Hook Form 7, `@headlessui/react` ^2.2.10 (nova dependência), Tailwind v4 + tokens `var(--ada-*)`.

**Spec:** `CasaDiAna/docs/superpowers/specs/2026-10-08-combobox-busca-design.md`

## Global Constraints

- Idioma: todo texto de UI (placeholder, mensagens) em português do Brasil.
- Design tokens: `var(--ada-*)`, nunca classes Tailwind de cor direta — mesmo padrão de `CampoTexto.tsx`/`SelectCampo.tsx`.
- `SelectCampo.tsx` não é modificado por este plano.
- Nenhuma mudança de backend — a busca é 100% client-side sobre listas já carregadas pelos services existentes.
- Selects de opção fixa continuam com `SelectCampo`: "Tipo do Produto" (`ProdutoFormPage.tsx`), seletor "Tipo" Ingrediente/Utensílio por linha (`EntradaFormPage.tsx`), "Unidade de Medida" em todos os formulários, e o select `unidadeEmbalagem` (ml/g) em `IngredienteFormPage.tsx`.
- Filtro de busca: substring, case-insensitive, sem considerar acentuação.
- O valor enviado ao backend/RHF continua sendo `opcao.valor` (id), nunca `opcao.rotulo`.
- O frontend não tem suíte de testes automatizados — verificação de cada task é `npx tsc --noEmit` limpo; verificação final inclui checklist manual no navegador (documentar explicitamente se não for possível executar no ambiente).

---

## Task 1 — Dependência e primitivo `ComboboxCampo`

**Files:**
- Modify: `frontend/package.json` (adicionar `@headlessui/react`)
- Create: `frontend/src/components/form/ComboboxCampo.tsx`

**Interfaces:**
- Produces: `ComboboxCampo<T extends FieldValues>({ control, name, label, opcoes, erro?, obrigatorio?, placeholder?, disabled?, id? })` — consumido pelas Tasks 2-4. `opcoes: { valor: string | number; rotulo: string }[]` (mesmo shape de `SelectCampo`).

- [ ] **Step 1: Instalar a dependência**

Run (dentro de `frontend/`):
```bash
npm install @headlessui/react@^2.2.10
```
Expected: `package.json`/`package-lock.json` atualizados, sem erro de peer-dependency (React 19 já satisfaz `^18 || ^19`).

- [ ] **Step 2: Criar `ComboboxCampo.tsx`**

```tsx
// CasaDiAna/frontend/src/components/form/ComboboxCampo.tsx
import { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { useController } from 'react-hook-form'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface OpcaoCombobox {
  valor: string | number
  rotulo: string
}

interface Props<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  opcoes: OpcaoCombobox[]
  erro?: string
  obrigatorio?: boolean
  placeholder?: string
  disabled?: boolean
  id?: string
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function ComboboxCampo<T extends FieldValues>({
  control,
  name,
  label,
  opcoes,
  erro,
  obrigatorio,
  placeholder,
  disabled,
  id,
}: Props<T>) {
  const { field } = useController({ control, name })
  const [query, setQuery] = useState('')

  const comboboxId = id ?? `combobox-${String(name).replace(/\./g, '-')}`

  const opcoesFiltradas = query === ''
    ? opcoes
    : opcoes.filter(o => normalizar(o.rotulo).includes(normalizar(query)))

  const opcaoSelecionada = opcoes.find(o => o.valor === field.value) ?? null

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={comboboxId}
        className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}{obrigatorio && <span className="ml-0.5" style={{ color: '#F87171' }} aria-hidden="true">*</span>}
      </label>

      <Combobox
        value={field.value ?? ''}
        onChange={(valor: string | number) => field.onChange(valor ?? '')}
        disabled={disabled}
      >
        <div className="relative">
          <Combobox.Input
            id={comboboxId}
            aria-required={obrigatorio}
            aria-invalid={!!erro}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 pr-16"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: `1px solid ${erro ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)'}`,
              color: 'var(--ada-heading)',
              colorScheme: 'dark',
            }}
            displayValue={() => opcaoSelecionada?.rotulo ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={field.onBlur}
            placeholder={placeholder ?? 'Buscar…'}
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {!obrigatorio && field.value && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => { field.onChange(''); setQuery('') }}
                className="p-0.5 rounded transition-colors"
                style={{ color: 'var(--ada-muted)' }}
                aria-label="Limpar seleção"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <Combobox.Button className="flex items-center">
              <ChevronUpDownIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} aria-hidden="true" />
            </Combobox.Button>
          </div>

          <Combobox.Options
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg py-1 text-sm shadow-lg outline-none"
            style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)' }}
          >
            {opcoesFiltradas.length === 0 ? (
              <div className="px-3 py-2 text-sm" style={{ color: 'var(--ada-muted)' }}>
                Nenhum resultado encontrado.
              </div>
            ) : (
              opcoesFiltradas.map(o => (
                <Combobox.Option key={o.valor} value={o.valor}>
                  {({ active, selected }) => (
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer select-none ${selected ? 'font-semibold' : 'font-normal'}`}
                      style={{
                        background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                        color: 'var(--ada-heading)',
                      }}
                    >
                      {o.rotulo}
                    </div>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>

      {erro && (
        <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros (o componente ainda não é importado por nenhuma página, então não há impacto em outros arquivos nesta task).

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/form/ComboboxCampo.tsx
git commit -m "feat(frontend): adiciona primitivo ComboboxCampo (select com busca)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2 — Migrar os 7 formulários de select único (Categoria/Produto/Ingrediente)

**Files:**
- Modify: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`
- Modify: `frontend/src/features/estoque/utensilios/pages/UtensilioFormPage.tsx`
- Modify: `frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx`
- Modify: `frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx`
- Modify: `frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx`
- Modify: `frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`
- Modify: `frontend/src/features/producao/perdas/pages/PerdasPage.tsx`

**Interfaces:**
- Consumes: `ComboboxCampo` (Task 1).

Estes 7 arquivos têm o mesmo formato de mudança: um único select de catálogo (Categoria, Produto ou Ingrediente) num formulário simples (sem field array). Cada um troca `SelectCampo` por `ComboboxCampo` nesse select específico, e garante que `control` está disponível (adicionando ao destructure do `useForm`/hook de formulário onde ainda não está). Os outros campos do arquivo (inclusive outros `SelectCampo`, como "Unidade de Medida" ou "Tipo do Produto") **não são tocados**.

- [ ] **Step 1: `IngredienteFormPage.tsx` — select "Categoria"**

`control` já está no destructure (`const { register, handleSubmit, watch, reset, setValue, clearErrors, control, formState: { errors } } = form`) — não precisa de mudança aí.

Adicionar o import, junto aos outros de `components/form`:
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```

Substituir:
```tsx
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              {...register('categoriaId')}
              erro={errors.categoriaId?.message}
            />
```
por:
```tsx
            <ComboboxCampo
              control={control}
              name="categoriaId"
              label="Categoria"
              placeholder="Buscar categoria…"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaId?.message}
            />
```

(O import de `SelectCampo` permanece — ainda é usado por "Unidade de Medida" e pelo select `unidadeEmbalagem`.)

- [ ] **Step 2: `UtensilioFormPage.tsx` — select "Categoria"**

No destructure do form (linha com `const { register, handleSubmit, watch, reset, formState: { errors } } = form`), adicionar `control`:
```tsx
  const { register, handleSubmit, watch, reset, control, formState: { errors } } = form
```

Adicionar o import:
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```

Substituir:
```tsx
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              {...register('categoriaUtensilioId')}
              erro={errors.categoriaUtensilioId?.message}
            />
```
por:
```tsx
            <ComboboxCampo
              control={control}
              name="categoriaUtensilioId"
              label="Categoria"
              placeholder="Buscar categoria…"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaUtensilioId?.message}
            />
```

(`SelectCampo` continua importado — ainda usado por "Unidade de Medida".)

- [ ] **Step 3: `ProdutoFormPage.tsx` — select "Categoria"**

No destructure (linha `const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useProdutoForm()`), adicionar `control`:
```tsx
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useProdutoForm()
```

Adicionar o import:
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```

Substituir:
```tsx
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaProdutoId?.message}
              {...register('categoriaProdutoId')}
            />
```
por:
```tsx
            <ComboboxCampo
              control={control}
              name="categoriaProdutoId"
              label="Categoria"
              placeholder="Buscar categoria…"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaProdutoId?.message}
            />
```

(`SelectCampo` continua importado — ainda usado por "Tipo do Produto", que **não muda**.)

- [ ] **Step 4: `InventarioDetalhePage.tsx` — select "Ingrediente"**

No destructure (linha `const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ItemFormValues>({...})`), adicionar `control`:
```tsx
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<ItemFormValues>({
```

Trocar o import:
```tsx
import { SelectCampo } from '@/components/form/SelectCampo'
```
por:
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```
(este arquivo só tinha esse único select, então o import de `SelectCampo` sai e é substituído, não duplicado).

Substituir:
```tsx
              <SelectCampo
                label="Ingrediente"
                obrigatorio
                opcoes={ingredientes.map(ing => ({
                  valor: ing.id,
                  rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                }))}
                {...register('ingredienteId')}
                erro={errors.ingredienteId?.message}
              />
```
por:
```tsx
              <ComboboxCampo
                control={control}
                name="ingredienteId"
                label="Ingrediente"
                obrigatorio
                placeholder="Buscar ingrediente…"
                opcoes={ingredientes.map(ing => ({
                  valor: ing.id,
                  rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                }))}
                erro={errors.ingredienteId?.message}
              />
```

- [ ] **Step 5: `RegistrarProducaoPage.tsx` — select "Produto"**

No destructure (linha `const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProducaoFormValues>({...})`), adicionar `control`:
```tsx
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm<ProducaoFormValues>({
```

Trocar o import de `SelectCampo` por `ComboboxCampo` (único select do arquivo):
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```

Substituir:
```tsx
            <SelectCampo
              label="Produto"
              obrigatorio
              opcoes={produtos.map(p => ({ valor: p.id, rotulo: p.nome }))}
              {...register('produtoId')}
              erro={errors.produtoId?.message}
            />
```
por:
```tsx
            <ComboboxCampo
              control={control}
              name="produtoId"
              label="Produto"
              obrigatorio
              placeholder="Buscar produto…"
              opcoes={produtos.map(p => ({ valor: p.id, rotulo: p.nome }))}
              erro={errors.produtoId?.message}
            />
```

- [ ] **Step 6: `RegistrarVendaPage.tsx` — select "Produto"**

No destructure (linha `const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VendaFormValues>({...})`), adicionar `control`:
```tsx
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm<VendaFormValues>({
```

Trocar o import de `SelectCampo` por `ComboboxCampo` (único select do arquivo):
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```

Substituir:
```tsx
            <SelectCampo
              label="Produto"
              obrigatorio
              opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
              {...register('produtoId')}
              erro={errors.produtoId?.message}
            />
```
por:
```tsx
            <ComboboxCampo
              control={control}
              name="produtoId"
              label="Produto"
              obrigatorio
              placeholder="Buscar produto…"
              opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
              erro={errors.produtoId?.message}
            />
```

- [ ] **Step 7: `PerdasPage.tsx` — select "Produto"**

No destructure (linha `const { register, handleSubmit, reset: resetForm, formState: { errors: formErrors, isSubmitting } } = useForm<PerdaFormValues>({...})`), adicionar `control`:
```tsx
  const { register, handleSubmit, reset: resetForm, control, formState: { errors: formErrors, isSubmitting } } =
    useForm<PerdaFormValues>({
```

Trocar o import de `SelectCampo` por `ComboboxCampo` (único select do arquivo):
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```

Substituir:
```tsx
              <SelectCampo
                label="Produto"
                obrigatorio
                opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
                {...register('produtoId')}
                erro={formErrors.produtoId?.message}
              />
```
por:
```tsx
              <ComboboxCampo
                control={control}
                name="produtoId"
                label="Produto"
                obrigatorio
                placeholder="Buscar produto…"
                opcoes={produtos.filter(p => p.ativo).map(p => ({ valor: p.id, rotulo: p.nome }))}
                erro={formErrors.produtoId?.message}
              />
```

- [ ] **Step 8: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros em todo o projeto.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx frontend/src/features/estoque/utensilios/pages/UtensilioFormPage.tsx frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx frontend/src/features/producao/perdas/pages/PerdasPage.tsx
git commit -m "feat(frontend): selects de categoria/produto/ingrediente ganham busca

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3 — Migrar `EntradaFormPage.tsx` (Fornecedor + item por linha)

**Files:**
- Modify: `frontend/src/features/entradas/pages/EntradaFormPage.tsx`

**Interfaces:**
- Consumes: `ComboboxCampo` (Task 1).

Este arquivo tem **dois** selects que migram: "Fornecedor" (select simples) e o select de "Item" dentro de cada linha da lista dinâmica de itens (`itens.${index}.itemId`, cujas opções mudam entre ingredientes/utensílios conforme o "Tipo" da linha). O select "Tipo" (Ingrediente/Utensílio) de cada linha **não muda** — continua `SelectCampo` nativo, por ser uma lista fixa de 2 opções.

`control` já está disponível no destructure deste arquivo (`const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<EntradaFormValues>({...})`) — não precisa de mudança aí.

- [ ] **Step 1: Adicionar o import**

```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```
(O import de `SelectCampo` permanece — ainda usado pelo select "Tipo" de cada linha.)

- [ ] **Step 2: Migrar o select "Fornecedor"**

Substituir:
```tsx
            <SelectCampo
              label="Fornecedor"
              obrigatorio
              opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
              {...register('fornecedorId')}
              erro={errors.fornecedorId?.message}
            />
```
por:
```tsx
            <ComboboxCampo
              control={control}
              name="fornecedorId"
              label="Fornecedor"
              obrigatorio
              placeholder="Buscar fornecedor…"
              opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
              erro={errors.fornecedorId?.message}
            />
```

- [ ] **Step 3: Migrar o select de "Item" de cada linha**

Localizar, dentro do `.map` de `fields` (linha com `const opcoesItem = tipoLinha === 'ingrediente' ? ... : ...`), o segundo `SelectCampo` da linha (o primeiro, de "Tipo", **não muda**):

Substituir:
```tsx
                  <SelectCampo
                    label=" "
                    opcoes={opcoesItem}
                    {...register(`itens.${index}.itemId`)}
                    erro={errors.itens?.[index]?.itemId?.message}
                  />
```
por:
```tsx
                  <ComboboxCampo
                    control={control}
                    name={`itens.${index}.itemId`}
                    label=" "
                    placeholder="Buscar item…"
                    opcoes={opcoesItem}
                    erro={errors.itens?.[index]?.itemId?.message}
                  />
```

**Nota:** este select não tinha `obrigatorio` no `SelectCampo` original (apesar do campo ser validado como obrigatório pelo schema) — mantenha sem `obrigatorio` aqui também, para preservar o visual idêntico (sem asterisco) que a linha já tinha. Isso significa que o botão de limpar (✕) vai aparecer quando um item estiver selecionado; isso é aceitável — limpar e deixar vazio dispara a mesma validação de "Selecione um item." que já existe.

- [ ] **Step 4: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 5: Testar manualmente no navegador (se disponível)**

Run: `npm run dev` (dentro de `frontend/`), abrir `/entradas/nova`.
- Campo Fornecedor: digitar parte do nome de um fornecedor cadastrado → filtra; selecionar; confirmar que o formulário aceita.
- Adicionar uma linha de item, trocar o "Tipo" entre Ingrediente/Utensílio → confirmar que a lista de opções do combobox de item muda de acordo, e que o valor anterior é limpo (comportamento já existente, preservado).
- Se não houver navegador disponível neste ambiente, documente isso no relatório em vez de afirmar que testou.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/entradas/pages/EntradaFormPage.tsx
git commit -m "feat(entradas): selects de fornecedor e item do formulario ganham busca

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4 — Migrar `IngredientesForm.tsx` (ficha técnica de produto)

**Files:**
- Modify: `frontend/src/features/producao/produtos/components/IngredientesForm.tsx`

**Interfaces:**
- Consumes: `ComboboxCampo` (Task 1).

Este componente é a lista dinâmica de ingredientes da ficha técnica de um produto. `control` já está no destructure (`const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FichaFormValues>({...})`) — não precisa de mudança aí.

- [ ] **Step 1: Trocar o import**

Substituir:
```tsx
import { SelectCampo } from '@/components/form/SelectCampo'
```
por:
```tsx
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
```
(este arquivo só tem esse select, então o import é substituído, não duplicado).

- [ ] **Step 2: Migrar o select de "Ingrediente" por linha**

Substituir:
```tsx
              <SelectCampo
                label=" "
                opcoes={ingredientes.map(ing => ({
                  valor: ing.id,
                  rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                }))}
                {...register(`itens.${index}.ingredienteId`)}
                erro={errors.itens?.[index]?.ingredienteId?.message}
              />
```
por:
```tsx
              <ComboboxCampo
                control={control}
                name={`itens.${index}.ingredienteId`}
                label=" "
                placeholder="Buscar ingrediente…"
                opcoes={ingredientes.map(ing => ({
                  valor: ing.id,
                  rotulo: `${ing.nome} (${ing.unidadeMedidaCodigo})`,
                }))}
                erro={errors.itens?.[index]?.ingredienteId?.message}
              />
```

(Mesma observação da Task 3: o `SelectCampo` original não tinha `obrigatorio` nesta linha — mantenha sem `obrigatorio` para preservar o visual.)

- [ ] **Step 3: Checagem de tipos**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 4: Testar manualmente no navegador (se disponível)**

Abrir o fluxo de criar/editar ficha técnica de um Produto (produzido). Adicionar 2+ linhas de ingrediente, buscar por nome em cada uma, confirmar que selecionar um ingrediente numa linha não afeta a busca/seleção de outra linha. Se não houver navegador disponível, documentar no relatório.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/producao/produtos/components/IngredientesForm.tsx
git commit -m "feat(produtos): select de ingrediente da ficha tecnica ganha busca

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5 — Verificação final e handoff

**Files:** nenhum arquivo novo — apenas verificação de ponta a ponta.

**Interfaces:** nenhuma — valida a integração de todas as tasks anteriores.

- [ ] **Step 1: Checagem de tipos completa**

Run (dentro de `frontend/`): `npx tsc --noEmit`
Expected: 0 erros em todo o projeto.

- [ ] **Step 2: Build de produção**

Run (dentro de `frontend/`): `npm run build`
Expected: build succeeded, sem erros novos (pode haver o warning pré-existente de chunk size, não relacionado a esta feature).

- [ ] **Step 3: Lint**

Run (dentro de `frontend/`): `npm run lint`
Expected: sem erros novos introduzidos pelos arquivos desta feature.

- [ ] **Step 4: Checklist manual no navegador (documentar se não for possível executar)**

Para cada um dos 9 selects migrados (Categoria ×3, Produto ×3, Ingrediente ×2, Fornecedor ×1, Item por linha ×1):
- Abrir o campo sem digitar → lista completa aparece.
- Digitar parte de um nome com acento → encontra o item corretamente (sem considerar acento).
- Navegar com teclado (seta + Enter) → seleciona.
- Limpar via ✕ (campos não obrigatórios) → volta ao estado vazio.
- Submeter o formulário → confirmar que o `id` certo foi enviado (não o texto digitado).
- Nos dois campos dentro de lista dinâmica (item de entrada, ingrediente de ficha técnica): abrir/filtrar/selecionar em mais de uma linha sem vazar estado entre elas.

Se este ambiente não tiver navegador disponível, registrar explicitamente no relatório final que a verificação foi só por leitura de código + tsc + build, e que o checklist acima fica pendente de QA manual antes de considerar a feature 100% pronta — mesmo padrão já usado na feature de múltiplos boletos.

- [ ] **Step 5: Handoff**

Reportar ao usuário: build/tsc/lint passando, checklist manual pendente ou executado (conforme Step 4), pronto para a decisão de integração via `superpowers:finishing-a-development-branch`.
