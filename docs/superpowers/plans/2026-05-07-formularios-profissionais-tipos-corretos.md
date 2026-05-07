# Formulários Profissionais — Tipos Corretos e Embalagem Estruturada

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar o padrão `z.string().refine(Number(v) > 0)` de todos os formulários substituindo por `z.preprocess + z.number()`; reestruturar o campo `quantidadeEmbalagem` de texto livre para valor numérico + dropdown (ml / g) no backend e frontend.

**Architecture:** Três frentes independentes. (A) Backend: refatorar `QuantidadeEmbalagem: string?` em `Ingrediente` para dois campos tipados — `QuantidadeEmbalagemValor: decimal?` e `UnidadeEmbalagem: string?` — propagando por Domain → Application → Infrastructure e gerando nova migration. (B) Types Frontend: atualizar `types/estoque.ts` e `types/producao.ts` para refletir campos numéricos como `number` em vez de `string`. (C) Schemas e Pages: migrar cada `z.string().refine()` numérico para o padrão `z.preprocess((v) => ..., z.number(...))`, removendo conversões manuais `Number()` nos `formParaInput()`.

**Tech Stack:** C# 13 / ASP.NET Core 8 / FluentValidation 11 / EF Core 8 migrations / React 19 / TypeScript 5.9 / React Hook Form 7 / Zod 4

---

## Mapa de arquivos

### Backend

| Arquivo | Ação |
|---------|------|
| `CasaDiAna/src/CasaDiAna.Domain/Entities/Ingrediente.cs` | Modify — substituir `QuantidadeEmbalagem: string?` por dois campos |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Dtos/IngredienteDto.cs` | Modify — substituir parâmetro no record |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommand.cs` | Modify — substituir parâmetro |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandHandler.cs` | Modify — passar novos campos + ToDto |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandValidator.cs` | Modify — validar `UnidadeEmbalagem` in {"ml","g"} |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommand.cs` | Modify — substituir parâmetro |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandHandler.cs` | Modify — passar novos campos |
| `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandValidator.cs` | Modify — mesma validação |
| `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs` | Modify — mapear duas novas colunas, remover antiga |
| Nova migration | Create — drop `quantidade_embalagem`, add `quantidade_embalagem_valor` + `unidade_embalagem` |

### Frontend — tipos

| Arquivo | Ação |
|---------|------|
| `CasaDiAna/frontend/src/types/estoque.ts` | Modify — `Ingrediente`, `CriarIngredienteInput`, `IngredienteFormValues`, `EntradaFormValues` |
| `CasaDiAna/frontend/src/types/producao.ts` | Modify — `ProdutoFormValues`, `ProducaoFormValues`, `VendaFormValues` |

### Frontend — schemas e pages

| Arquivo | Ação |
|---------|------|
| `CasaDiAna/frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts` | Modify — schema + conversores |
| `CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | Modify — campo embalagem: número + dropdown |
| `CasaDiAna/frontend/src/features/entradas/pages/EntradaFormPage.tsx` | Modify — schema itens |
| `CasaDiAna/frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx` | Modify — schema quantidadeContada |
| `CasaDiAna/frontend/src/features/producao/produtos/hooks/useProdutoForm.ts` | Modify — schema precoVenda |
| `CasaDiAna/frontend/src/features/producao/importacao-vendas/components/QuickCreateProductModal.tsx` | Modify — schema precoVenda |
| `CasaDiAna/frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx` | Modify — schema quantidadeProduzida |
| `CasaDiAna/frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx` | Modify — schema quantidadeVendida |
| `CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx` | Modify — schema quantidade |
| `CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx` | Modify — schema quantidadePorUnidade |

---

## Task 1: Backend — refatorar `QuantidadeEmbalagem` em `Ingrediente`

**Files:**
- Modify: `CasaDiAna/src/CasaDiAna.Domain/Entities/Ingrediente.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Dtos/IngredienteDto.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommand.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandHandler.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandValidator.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommand.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandHandler.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandValidator.cs`
- Modify: `CasaDiAna/src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs`

- [ ] **Step 1: Atualizar `Ingrediente.cs` — substituir `QuantidadeEmbalagem` por dois campos**

Substituir:
```csharp
public string? QuantidadeEmbalagem { get; private set; }
```
Por:
```csharp
public decimal? QuantidadeEmbalagemValor { get; private set; }
public string? UnidadeEmbalagem { get; private set; }
```

No método `Criar(...)`, substituir o parâmetro `string? quantidadeEmbalagem = null` por:
```csharp
decimal? quantidadeEmbalagemValor = null,
string? unidadeEmbalagem = null)
```

E no corpo:
```csharp
// remover:
QuantidadeEmbalagem = quantidadeEmbalagem,
// adicionar:
QuantidadeEmbalagemValor = quantidadeEmbalagemValor,
UnidadeEmbalagem = unidadeEmbalagem,
```

No método `Atualizar(...)`, mesma substituição de parâmetro e atribuição. O arquivo completo após a edição deve ficar:

```csharp
public static Ingrediente Criar(
    string nome,
    short unidadeMedidaId,
    decimal estoqueMinimo,
    Guid criadoPor,
    string? codigoInterno = null,
    Guid? categoriaId = null,
    decimal? estoqueMaximo = null,
    string? observacoes = null,
    decimal? quantidadeEmbalagemValor = null,
    string? unidadeEmbalagem = null)
{
    // validações existentes inalteradas
    ...
    return new Ingrediente
    {
        // campos existentes inalterados
        ...
        QuantidadeEmbalagemValor = quantidadeEmbalagemValor,
        UnidadeEmbalagem = unidadeEmbalagem,
        ...
    };
}

public void Atualizar(
    string nome,
    short unidadeMedidaId,
    decimal estoqueMinimo,
    Guid atualizadoPor,
    string? codigoInterno = null,
    Guid? categoriaId = null,
    decimal? estoqueMaximo = null,
    string? observacoes = null,
    decimal? quantidadeEmbalagemValor = null,
    string? unidadeEmbalagem = null)
{
    // validações existentes inalteradas
    ...
    QuantidadeEmbalagemValor = quantidadeEmbalagemValor;
    UnidadeEmbalagem = unidadeEmbalagem;
    // demais atribuições existentes inalteradas
}
```

- [ ] **Step 2: Atualizar `IngredienteDto.cs`**

Substituir o record completo:
```csharp
public record IngredienteDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    Guid? CategoriaId,
    string? CategoriaNome,
    short UnidadeMedidaId,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    decimal? EstoqueMaximo,
    bool EstaBaixoDoMinimo,
    string? Observacoes,
    decimal? QuantidadeEmbalagemValor,
    string? UnidadeEmbalagem,
    bool Ativo,
    DateTime AtualizadoEm);
```

- [ ] **Step 3: Atualizar `CriarIngredienteCommand.cs`**

```csharp
public record CriarIngredienteCommand(
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaId = null,
    decimal? EstoqueMaximo = null,
    string? Observacoes = null,
    decimal? QuantidadeEmbalagemValor = null,
    string? UnidadeEmbalagem = null) : IRequest<IngredienteDto>;
```

- [ ] **Step 4: Atualizar `CriarIngredienteCommandHandler.cs`**

Na chamada a `Ingrediente.Criar(...)` e no `ToDto(...)`:
```csharp
var ingrediente = Ingrediente.Criar(
    request.Nome,
    request.UnidadeMedidaId,
    request.EstoqueMinimo,
    _currentUser.UsuarioId,
    request.CodigoInterno,
    request.CategoriaId,
    request.EstoqueMaximo,
    request.Observacoes,
    request.QuantidadeEmbalagemValor,
    request.UnidadeEmbalagem);
```

```csharp
internal static IngredienteDto ToDto(Ingrediente i) => new(
    i.Id, i.Nome, i.CodigoInterno,
    i.CategoriaId, i.Categoria?.Nome,
    i.UnidadeMedidaId, i.UnidadeMedida?.Codigo ?? string.Empty,
    i.EstoqueAtual, i.EstoqueMinimo, i.EstoqueMaximo,
    i.EstaBaixoDoMinimo(), i.Observacoes,
    i.QuantidadeEmbalagemValor, i.UnidadeEmbalagem,
    i.Ativo, i.AtualizadoEm);
```

- [ ] **Step 5: Atualizar `CriarIngredienteCommandValidator.cs`**

Remover a rule de `QuantidadeEmbalagem` e adicionar:
```csharp
RuleFor(x => x.QuantidadeEmbalagemValor)
    .GreaterThan(0).When(x => x.QuantidadeEmbalagemValor.HasValue)
    .WithMessage("Quantidade por embalagem deve ser maior que 0.");

RuleFor(x => x.UnidadeEmbalagem)
    .Must(u => u == null || u == "ml" || u == "g")
    .WithMessage("Unidade de embalagem deve ser 'ml' ou 'g'.");
```

- [ ] **Step 6: Atualizar `AtualizarIngredienteCommand.cs`** (mesmo padrão da Task 3)

```csharp
public record AtualizarIngredienteCommand(
    Guid Id,
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaId = null,
    decimal? EstoqueMaximo = null,
    string? Observacoes = null,
    decimal? QuantidadeEmbalagemValor = null,
    string? UnidadeEmbalagem = null) : IRequest<IngredienteDto>;
```

- [ ] **Step 7: Atualizar `AtualizarIngredienteCommandHandler.cs`**

Na chamada a `ingrediente.Atualizar(...)`:
```csharp
ingrediente.Atualizar(
    request.Nome,
    request.UnidadeMedidaId,
    request.EstoqueMinimo,
    _currentUser.UsuarioId,
    request.CodigoInterno,
    request.CategoriaId,
    request.EstoqueMaximo,
    request.Observacoes,
    request.QuantidadeEmbalagemValor,
    request.UnidadeEmbalagem);
```

- [ ] **Step 8: Atualizar `AtualizarIngredienteCommandValidator.cs`** (mesmo padrão da Task 5)

```csharp
RuleFor(x => x.QuantidadeEmbalagemValor)
    .GreaterThan(0).When(x => x.QuantidadeEmbalagemValor.HasValue)
    .WithMessage("Quantidade por embalagem deve ser maior que 0.");

RuleFor(x => x.UnidadeEmbalagem)
    .Must(u => u == null || u == "ml" || u == "g")
    .WithMessage("Unidade de embalagem deve ser 'ml' ou 'g'.");
```

- [ ] **Step 9: Atualizar `IngredienteConfiguration.cs`**

Substituir a linha:
```csharp
builder.Property(i => i.QuantidadeEmbalagem).HasColumnName("quantidade_embalagem").HasMaxLength(100);
```
Por:
```csharp
builder.Property(i => i.QuantidadeEmbalagemValor).HasColumnName("quantidade_embalagem_valor").HasPrecision(15, 4);
builder.Property(i => i.UnidadeEmbalagem).HasColumnName("unidade_embalagem").HasMaxLength(10);
```

- [ ] **Step 10: Buildar para verificar sem erros de compilação**

```bash
dotnet build src/CasaDiAna.API
```

Esperado: Build succeeded, 0 Error(s).

- [ ] **Step 11: Gerar a migration**

```bash
dotnet ef migrations add RefatorarQuantidadeEmbalagem --project src/CasaDiAna.Infrastructure --startup-project src/CasaDiAna.API
```

Verificar que o arquivo gerado em `src/CasaDiAna.Infrastructure/Persistence/Migrations/` contém:
- `DropColumn("quantidade_embalagem", ...)`
- `AddColumn("quantidade_embalagem_valor", type: "numeric(15,4)", nullable: true)`
- `AddColumn("unidade_embalagem", type: "character varying(10)", nullable: true)`

- [ ] **Step 12: Commit backend**

```bash
git add src/CasaDiAna.Domain/Entities/Ingrediente.cs
git add src/CasaDiAna.Application/Ingredientes/
git add src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs
git add src/CasaDiAna.Infrastructure/Persistence/Migrations/
git commit -m "feat(ingredientes): refatorar campo embalagem para valor decimal + unidade (ml/g)"
```

---

## Task 2: Frontend types — atualizar interfaces

**Files:**
- Modify: `CasaDiAna/frontend/src/types/estoque.ts`
- Modify: `CasaDiAna/frontend/src/types/producao.ts`

- [ ] **Step 1: Atualizar `estoque.ts` — interface `Ingrediente`**

Substituir:
```typescript
quantidadeEmbalagem: string | null
```
Por:
```typescript
quantidadeEmbalagemValor: number | null
unidadeEmbalagem: string | null
```

- [ ] **Step 2: Atualizar `estoque.ts` — interface `CriarIngredienteInput`**

Substituir:
```typescript
quantidadeEmbalagem?: string | null
```
Por:
```typescript
quantidadeEmbalagemValor?: number | null
unidadeEmbalagem?: string | null
```

- [ ] **Step 3: Atualizar `estoque.ts` — interface `IngredienteFormValues`**

Resultado final:
```typescript
export interface IngredienteFormValues {
  nome: string
  codigoInterno: string
  categoriaId: string
  unidadeMedidaId: string
  estoqueMinimo: number | undefined
  estoqueMaximo: number | undefined
  observacoes: string
  quantidadeEmbalagemValor: number | undefined
  unidadeEmbalagem: string
  _ehPacote?: boolean
}
```

- [ ] **Step 4: Atualizar `estoque.ts` — interface `EntradaFormValues`**

Substituir:
```typescript
itens: { ingredienteId: string; quantidade: string; custoUnitario: string }[]
```
Por:
```typescript
itens: { ingredienteId: string; quantidade: number | undefined; custoUnitario: number | undefined }[]
```

- [ ] **Step 5: Atualizar `producao.ts` — interface `ProdutoFormValues`**

Substituir:
```typescript
precoVenda: string
```
Por:
```typescript
precoVenda: number | undefined
```

- [ ] **Step 6: Atualizar `producao.ts` — interface `ProducaoFormValues`**

Substituir:
```typescript
quantidadeProduzida: string
```
Por:
```typescript
quantidadeProduzida: number | undefined
```

- [ ] **Step 7: Atualizar `producao.ts` — interface `VendaFormValues`**

Substituir:
```typescript
quantidadeVendida: string
```
Por:
```typescript
quantidadeVendida: number | undefined
```

- [ ] **Step 8: Verificar tipagem**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | head -40
```

Esperado: erros nos arquivos que ainda não foram atualizados (useIngredienteForm, pages). Erros somente nos arquivos listados nas próximas tasks. Não deve haver erros em outros lugares.

- [ ] **Step 9: Commit types**

```bash
git add CasaDiAna/frontend/src/types/estoque.ts CasaDiAna/frontend/src/types/producao.ts
git commit -m "refactor(types): campos numéricos de formulário como number (não string)"
```

---

## Task 3: `useIngredienteForm.ts` + `IngredienteFormPage.tsx`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts`
- Modify: `CasaDiAna/frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

- [ ] **Step 1: Reescrever `useIngredienteForm.ts` — schema, defaultValues, ingredienteParaForm, formParaInput**

Conteúdo completo do arquivo após a edição:

```typescript
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ingredientesService } from '../services/ingredientesService'
import type { Ingrediente, IngredienteFormValues } from '@/types/estoque'

const numObrigatorio = (msg: string) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: msg, invalid_type_error: 'Informe um número válido.' })
  )

const numOpcional = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ invalid_type_error: 'Informe um número válido.' }).min(0, 'Deve ser ≥ 0.').optional()
  )

export const ingredienteSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Nome é obrigatório.')
      .max(200, 'Nome deve ter no máximo 200 caracteres.'),
    codigoInterno: z.string().max(30, 'Máximo 30 caracteres.').optional().or(z.literal('')),
    categoriaId: z.string().uuid('Categoria inválida.').optional().or(z.literal('')),
    unidadeMedidaId: z
      .string()
      .min(1, 'Selecione a unidade de medida.')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Selecione a unidade de medida.'),
    estoqueMinimo: numObrigatorio('Estoque mínimo é obrigatório.').min(
      0,
      'Deve ser ≥ 0.'
    ),
    estoqueMaximo: numOpcional(),
    observacoes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
    quantidadeEmbalagemValor: numOpcional(),
    unidadeEmbalagem: z.enum(['ml', 'g']).or(z.literal('')).optional(),
    _ehPacote: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data._ehPacote) {
      if (!data.quantidadeEmbalagemValor || data.quantidadeEmbalagemValor <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a quantidade por embalagem.',
          path: ['quantidadeEmbalagemValor'],
        })
      }
      if (!data.unidadeEmbalagem) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione a unidade (ml ou g).',
          path: ['unidadeEmbalagem'],
        })
      }
    }
    if (
      data.estoqueMaximo != null &&
      data.estoqueMinimo != null &&
      data.estoqueMaximo < data.estoqueMinimo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Estoque máximo não pode ser menor que o mínimo.',
        path: ['estoqueMaximo'],
      })
    }
  })

type IngredienteSchema = z.infer<typeof ingredienteSchema>

const defaultValues: IngredienteFormValues = {
  nome: '',
  codigoInterno: '',
  categoriaId: '',
  unidadeMedidaId: '',
  estoqueMinimo: undefined,
  estoqueMaximo: undefined,
  observacoes: '',
  quantidadeEmbalagemValor: undefined,
  unidadeEmbalagem: '',
  _ehPacote: false,
}

export function ingredienteParaForm(ing: Ingrediente): IngredienteFormValues {
  return {
    nome: ing.nome,
    codigoInterno: ing.codigoInterno ?? '',
    categoriaId: ing.categoriaId ?? '',
    unidadeMedidaId: String(ing.unidadeMedidaId),
    estoqueMinimo: ing.estoqueMinimo,
    estoqueMaximo: ing.estoqueMaximo ?? undefined,
    observacoes: ing.observacoes ?? '',
    quantidadeEmbalagemValor: ing.quantidadeEmbalagemValor ?? undefined,
    unidadeEmbalagem: (ing.unidadeEmbalagem as 'ml' | 'g') ?? '',
    _ehPacote: false,
  }
}

function formParaInput(values: IngredienteSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: values.estoqueMinimo ?? 0,
    codigoInterno: values.codigoInterno || null,
    categoriaId: values.categoriaId || null,
    estoqueMaximo: values.estoqueMaximo ?? null,
    observacoes: values.observacoes || null,
    quantidadeEmbalagemValor: values.quantidadeEmbalagemValor ?? null,
    unidadeEmbalagem: values.unidadeEmbalagem || null,
  }
}

interface UseIngredienteFormOptions {
  ingredienteExistente?: Ingrediente | null
}

export function useIngredienteForm({ ingredienteExistente }: UseIngredienteFormOptions = {}) {
  const form = useForm<IngredienteFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ingredienteSchema) as any,
    defaultValues: ingredienteExistente ? ingredienteParaForm(ingredienteExistente) : defaultValues,
  })

  const salvar = useCallback(
    async (values: IngredienteFormValues) => {
      const input = formParaInput(values as IngredienteSchema)
      if (ingredienteExistente) {
        return ingredientesService.atualizar({ id: ingredienteExistente.id, ...input })
      }
      return ingredientesService.criar(input)
    },
    [ingredienteExistente]
  )

  return { form, salvar }
}
```

- [ ] **Step 2: Atualizar `IngredienteFormPage.tsx` — seção Embalagem + useEffect de limpeza**

Localizar o `useEffect` que limpa o campo ao desmarcar Pacote e atualizar:
```typescript
useEffect(() => {
  setValue('_ehPacote', ehPacote)
  if (!ehPacote) {
    setValue('quantidadeEmbalagemValor', undefined)
    setValue('unidadeEmbalagem', '')
    clearErrors(['quantidadeEmbalagemValor', 'unidadeEmbalagem'])
  }
}, [ehPacote, setValue, clearErrors])
```

Localizar o bloco condicional `{ehPacote && ...}` e substituir pelo novo layout com dois campos:
```tsx
{ehPacote && (
  <>
    <FormSection titulo="Embalagem" />
    <div className="grid grid-cols-2 gap-4 max-w-sm">
      <CampoTexto
        label="Quantidade"
        obrigatorio
        type="number"
        step="0.001"
        min="0.001"
        placeholder="Ex: 500"
        {...register('quantidadeEmbalagemValor')}
        erro={errors.quantidadeEmbalagemValor?.message}
      />
      <SelectCampo
        label="Unidade"
        obrigatorio
        opcoes={[
          { valor: 'ml', rotulo: 'ml — mililitro' },
          { valor: 'g', rotulo: 'g — grama' },
        ]}
        {...register('unidadeEmbalagem')}
        erro={errors.unidadeEmbalagem?.message}
      />
    </div>
  </>
)}
```

- [ ] **Step 3: Verificar tipagem**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep "ingrediente"
```

Esperado: sem erros relacionados a ingredientes.

- [ ] **Step 4: Commit**

```bash
git add CasaDiAna/frontend/src/features/estoque/ingredientes/
git commit -m "feat(ingredientes): campo embalagem como número+unidade (ml/g) e estoques com z.preprocess"
```

---

## Task 4: `EntradaFormPage.tsx` — itens com tipos corretos

**Files:**
- Modify: `CasaDiAna/frontend/src/features/entradas/pages/EntradaFormPage.tsx`

- [ ] **Step 1: Atualizar schema `entradaSchema`**

Substituir o `z.object` dos itens:
```typescript
// Antes
itens: z.array(
  z.object({
    ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
    quantidade: z.string().min(1).refine(v => Number(v) > 0, 'Quantidade deve ser maior que 0.'),
    custoUnitario: z.string().min(1).refine(v => Number(v) >= 0, 'Custo deve ser ≥ 0.'),
  })
).min(1, 'Adicione pelo menos um item.')

// Depois
itens: z.array(
  z.object({
    ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
    quantidade: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number({ required_error: 'Informe a quantidade.', invalid_type_error: 'Número inválido.' })
        .positive('Deve ser maior que 0.')
    ),
    custoUnitario: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number({ required_error: 'Informe o custo.', invalid_type_error: 'Número inválido.' })
        .min(0, 'Deve ser ≥ 0.')
    ),
  })
).min(1, 'Adicione pelo menos um item.')
```

- [ ] **Step 2: Atualizar `defaultValues` dos itens**

```typescript
itens: [{ ingredienteId: '', quantidade: undefined, custoUnitario: undefined }],
```

- [ ] **Step 3: Atualizar `append` para usar `undefined`**

Localizar a linha do botão "Adicionar item":
```typescript
// Antes
onClick={() => append({ ingredienteId: '', quantidade: '', custoUnitario: '' })}

// Depois
onClick={() => append({ ingredienteId: '', quantidade: undefined, custoUnitario: undefined })}
```

- [ ] **Step 4: Remover conversões manuais em `onSubmit`**

Localizar em `onSubmit`:
```typescript
// Antes
itens: values.itens.map(item => ({
  ingredienteId: item.ingredienteId,
  quantidade: Number(item.quantidade),
  custoUnitario: Number(item.custoUnitario),
})),

// Depois
itens: values.itens.map(item => ({
  ingredienteId: item.ingredienteId,
  quantidade: item.quantidade ?? 0,
  custoUnitario: item.custoUnitario ?? 0,
})),
```

- [ ] **Step 5: Verificar tipagem**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep "entrada"
```

Esperado: sem erros relacionados a entradas.

- [ ] **Step 6: Commit**

```bash
git add CasaDiAna/frontend/src/features/entradas/pages/EntradaFormPage.tsx
git commit -m "refactor(entradas): campos numéricos dos itens com z.preprocess (não string)"
```

---

## Task 5: `InventarioDetalhePage.tsx` — `quantidadeContada`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx`

- [ ] **Step 1: Atualizar `ItemFormValues` e `itemSchema`**

Substituir:
```typescript
interface ItemFormValues {
  ingredienteId: string
  quantidadeContada: string
  observacoes: string
}

const itemSchema = z.object({
  ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
  quantidadeContada: z.string().min(1).refine(v => Number(v) >= 0, 'Quantidade deve ser ≥ 0.'),
  observacoes: z.string(),
})
```

Por:
```typescript
interface ItemFormValues {
  ingredienteId: string
  quantidadeContada: number | undefined
  observacoes: string
}

const itemSchema = z.object({
  ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
  quantidadeContada: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Informe a quantidade contada.', invalid_type_error: 'Número inválido.' })
      .min(0, 'Deve ser ≥ 0.')
  ),
  observacoes: z.string(),
})
```

- [ ] **Step 2: Atualizar `defaultValues` do formulário de item**

Localizar onde o formulário de item é inicializado (normalmente no `useForm`) e atualizar:
```typescript
defaultValues: { ingredienteId: '', quantidadeContada: undefined, observacoes: '' }
```

- [ ] **Step 3: Remover conversão manual em `onSubmit` do item**

Localizar onde o item é submetido. Substituir `Number(values.quantidadeContada)` por `values.quantidadeContada ?? 0`.

- [ ] **Step 4: Verificar tipagem e commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep "inventario"
git add CasaDiAna/frontend/src/features/inventarios/pages/InventarioDetalhePage.tsx
git commit -m "refactor(inventarios): quantidadeContada com z.preprocess"
```

---

## Task 6: `useProdutoForm.ts` + `QuickCreateProductModal.tsx` — `precoVenda`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/hooks/useProdutoForm.ts`
- Modify: `CasaDiAna/frontend/src/features/producao/importacao-vendas/components/QuickCreateProductModal.tsx`

- [ ] **Step 1: Reescrever `useProdutoForm.ts`**

```typescript
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Produto, ProdutoFormValues, CriarProdutoInput } from '@/types/producao'

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').max(150, 'Máximo de 150 caracteres.'),
  precoVenda: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Preço de venda é obrigatório.', invalid_type_error: 'Informe um número válido.' })
      .min(0, 'Preço deve ser ≥ 0.')
  ),
  categoriaProdutoId: z.string(),
  descricao: z.string(),
})

export function produtoParaForm(p: Produto): ProdutoFormValues {
  return {
    nome: p.nome,
    precoVenda: p.precoVenda,
    categoriaProdutoId: p.categoriaProdutoId ?? '',
    descricao: p.descricao ?? '',
  }
}

export function formParaInput(values: ProdutoFormValues): CriarProdutoInput {
  return {
    nome: values.nome,
    precoVenda: values.precoVenda ?? 0,
    categoriaProdutoId: values.categoriaProdutoId || null,
    descricao: values.descricao || null,
  }
}

export function useProdutoForm() {
  return useForm<ProdutoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: '',
      precoVenda: undefined,
      categoriaProdutoId: '',
      descricao: '',
    },
  })
}
```

- [ ] **Step 2: Atualizar schema em `QuickCreateProductModal.tsx`**

Substituir o `z.object` do `schema`:
```typescript
const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').max(100, 'Máximo 100 caracteres.'),
  precoVenda: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(String(v).replace(',', '.'))),
    z.number({ required_error: 'Preço é obrigatório.', invalid_type_error: 'Informe um número válido.' })
      .min(0, 'Preço deve ser ≥ 0.')
  ),
  categoriaProdutoId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>
```

- [ ] **Step 3: Atualizar `defaultValues` do `QuickCreateProductModal`**

```typescript
defaultValues: {
  nome: nomeInicial,
  precoVenda: precoInicial ?? undefined,
  categoriaProdutoId: '',
},
```

- [ ] **Step 4: Atualizar `onSubmit` do `QuickCreateProductModal` — remover parseFloat manual**

```typescript
const produto = await produtosService.criar({
  nome: values.nome,
  precoVenda: values.precoVenda ?? 0,
  categoriaProdutoId: values.categoriaProdutoId || null,
})
```

- [ ] **Step 5: Verificar tipagem e commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep -E "produto|importacao"
git add CasaDiAna/frontend/src/features/producao/produtos/hooks/useProdutoForm.ts
git add CasaDiAna/frontend/src/features/producao/importacao-vendas/components/QuickCreateProductModal.tsx
git commit -m "refactor(produtos): precoVenda com z.preprocess em useProdutoForm e QuickCreateModal"
```

---

## Task 7: `RegistrarProducaoPage.tsx` — `quantidadeProduzida`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx`

- [ ] **Step 1: Substituir `producaoSchema`**

```typescript
const producaoSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeProduzida: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Informe a quantidade.', invalid_type_error: 'Número inválido.' })
      .positive('Quantidade deve ser maior que 0.')
  ),
  observacoes: z.string(),
})
```

- [ ] **Step 2: Atualizar `defaultValues`**

```typescript
defaultValues: {
  produtoId: '',
  data: new Date().toISOString().split('T')[0],
  quantidadeProduzida: undefined,
  observacoes: '',
},
```

- [ ] **Step 3: Atualizar `onSubmit` — remover conversão manual**

```typescript
const resultado = await producaoDiariaService.registrar({
  produtoId: values.produtoId,
  data: values.data,
  quantidadeProduzida: values.quantidadeProduzida ?? 0,
  observacoes: values.observacoes || null,
})
const quantidade = values.quantidadeProduzida ?? 0
```

- [ ] **Step 4: Verificar tipagem e commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep "producao-diaria"
git add CasaDiAna/frontend/src/features/producao/producao-diaria/pages/RegistrarProducaoPage.tsx
git commit -m "refactor(producao-diaria): quantidadeProduzida com z.preprocess"
```

---

## Task 8: `RegistrarVendaPage.tsx` — `quantidadeVendida`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx`

- [ ] **Step 1: Substituir `vendaSchema`**

```typescript
const vendaSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto.'),
  data: z.string().min(1, 'Informe a data.'),
  quantidadeVendida: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Informe a quantidade.', invalid_type_error: 'Número inválido.' })
      .int('Quantidade deve ser um número inteiro.')
      .positive('Deve ser maior que 0.')
  ),
})
```

- [ ] **Step 2: Atualizar `defaultValues`**

```typescript
defaultValues: {
  produtoId: '',
  data: new Date().toISOString().split('T')[0],
  quantidadeVendida: undefined,
},
```

- [ ] **Step 3: Atualizar `onSubmit` — remover `Number()` manual**

```typescript
const resultado = await vendasDiariasService.registrar({
  produtoId: values.produtoId,
  data: values.data,
  quantidadeVendida: values.quantidadeVendida ?? 0,
})
const quantidade = values.quantidadeVendida ?? 0
```

- [ ] **Step 4: Verificar tipagem e commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep "vendas-diarias"
git add CasaDiAna/frontend/src/features/producao/vendas-diarias/pages/RegistrarVendaPage.tsx
git commit -m "refactor(vendas-diarias): quantidadeVendida inteiro com z.preprocess"
```

---

## Task 9: `PerdasPage.tsx` — `quantidade`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx`

- [ ] **Step 1: Substituir `perdaSchema`**

```typescript
const perdaSchema = z.object({
  produtoId: z.string().min(1, 'Produto obrigatório.'),
  data: z.string().min(1, 'Data obrigatória.'),
  quantidade: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Quantidade obrigatória.', invalid_type_error: 'Número inválido.' })
      .int('Quantidade deve ser um número inteiro.')
      .positive('Deve ser maior que zero.')
  ),
  justificativa: z.string().min(1, 'Justificativa obrigatória.').max(500, 'Máximo 500 caracteres.'),
})
```

- [ ] **Step 2: Atualizar `defaultValues` do formulário de perda**

Localizar o `useForm` do formulário de perda. Atualizar:
```typescript
defaultValues: {
  produtoId: '',
  data: hoje(),
  quantidade: undefined,
  justificativa: '',
},
```

- [ ] **Step 3: Atualizar `onSubmit` — remover `Number()` manual**

Localizar `Number(values.quantidade)` e substituir por `values.quantidade ?? 0`.

- [ ] **Step 4: Verificar tipagem e commit**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit 2>&1 | grep "perdas"
git add CasaDiAna/frontend/src/features/producao/perdas/pages/PerdasPage.tsx
git commit -m "refactor(perdas): quantidade inteira com z.preprocess"
```

---

## Task 10: `FichaTecnicaPage.tsx` — `quantidadePorUnidade`

**Files:**
- Modify: `CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx`

- [ ] **Step 1: Atualizar `fichaSchema` e `FichaFormValues`**

Substituir:
```typescript
const fichaSchema = z.object({
  itens: z.array(
    z.object({
      ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
      quantidadePorUnidade: z
        .string()
        .min(1)
        .refine(v => Number(v) > 0, 'Quantidade deve ser > 0.'),
    })
  ).min(1, 'Adicione pelo menos um ingrediente.'),
})

type FichaFormValues = {
  itens: { ingredienteId: string; quantidadePorUnidade: string }[]
}
```

Por:
```typescript
const fichaSchema = z.object({
  itens: z.array(
    z.object({
      ingredienteId: z.string().min(1, 'Selecione um ingrediente.'),
      quantidadePorUnidade: z.preprocess(
        (v) => (v === '' || v == null ? undefined : Number(v)),
        z.number({ required_error: 'Informe a quantidade.', invalid_type_error: 'Número inválido.' })
          .positive('Deve ser > 0.')
      ),
    })
  ).min(1, 'Adicione pelo menos um ingrediente.'),
})

type FichaFormValues = {
  itens: { ingredienteId: string; quantidadePorUnidade: number | undefined }[]
}
```

- [ ] **Step 2: Atualizar `defaultValues` e `append`**

```typescript
defaultValues: { itens: [{ ingredienteId: '', quantidadePorUnidade: undefined }] }
```

```typescript
// Botão "Adicionar ingrediente"
onClick={() => append({ ingredienteId: '', quantidadePorUnidade: undefined })}
```

- [ ] **Step 3: Atualizar `onSubmit` — remover `Number()` manual**

Localizar onde os itens são mapeados para o input da API:
```typescript
itens: values.itens.map(item => ({
  ingredienteId: item.ingredienteId,
  quantidadePorUnidade: item.quantidadePorUnidade ?? 0,
})),
```

- [ ] **Step 4: Verificar tipagem completa do projeto**

```bash
cd CasaDiAna/frontend && npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 5: Commit final**

```bash
git add CasaDiAna/frontend/src/features/producao/produtos/pages/FichaTecnicaPage.tsx
git commit -m "refactor(ficha-tecnica): quantidadePorUnidade com z.preprocess"
```

---

## Self-Review

### 1. Spec coverage

| Requisito | Task |
|---|---|
| `quantidadeEmbalagem` → número + dropdown ml/g | Tasks 1, 2, 3 |
| Fix `estoqueMinimo`/`estoqueMaximo` string→number | Task 3 |
| Cross-field validation estoqueMax ≥ estoqueMin | Task 3 (`superRefine`) |
| Entradas: `quantidade` e `custoUnitario` | Task 4 |
| Inventários: `quantidadeContada` | Task 5 |
| Produtos: `precoVenda` (hook + modal) | Task 6 |
| Produção: `quantidadeProduzida` | Task 7 |
| Vendas: `quantidadeVendida` (int validado) | Task 8 |
| Perdas: `quantidade` (int validado) | Task 9 |
| Ficha Técnica: `quantidadePorUnidade` | Task 10 |

### 2. Placeholder scan
Nenhum TBD, TODO ou "similar à task anterior" — cada task tem código completo.

### 3. Type consistency
- `IngredienteFormValues.quantidadeEmbalagemValor: number | undefined` — usado em Tasks 2, 3 ✓
- `IngredienteFormValues.unidadeEmbalagem: string` — usado em Tasks 2, 3 ✓
- `formParaInput` retorna `quantidadeEmbalagemValor ?? null` consistente com `CriarIngredienteInput.quantidadeEmbalagemValor?: number | null` ✓
- Todas as remoções de `Number()` manual são substituídas por `?? 0` (fallback seguro pós-validação Zod) ✓
