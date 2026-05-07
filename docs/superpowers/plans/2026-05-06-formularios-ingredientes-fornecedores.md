# Formulários Ingredientes e Fornecedores — Melhorias

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar campo condicional "Quantidade por Embalagem" e auto-geração de Código Interno nos Ingredientes; e máscaras + validações de CNPJ e Telefone nos Fornecedores.

**Architecture:** Três subsistemas independentes. Ingredientes: novo campo de domínio propagado por todas as camadas (Domain → Application → Infrastructure → Frontend). Fornecedores: mudança puramente na camada de validação e apresentação (sem coluna nova). Código interno: lógica auxiliar de frontend.

**Tech Stack:** C# 13 / ASP.NET Core 8 / FluentValidation 11 / EF Core 8 / EF Migrations / React 19 / TypeScript 5.9 / React Hook Form 7 / Zod 4 / Tailwind CSS 4

---

## Mapa de arquivos

### Subsistema A — Quantidade por Embalagem (Ingredientes)

| Arquivo | Ação |
|---------|------|
| `src/CasaDiAna.Domain/Entities/Ingrediente.cs` | Modify — adicionar prop + parâmetros em Criar/Atualizar |
| `src/CasaDiAna.Application/Ingredientes/Dtos/IngredienteDto.cs` | Modify — adicionar campo |
| `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommand.cs` | Modify — adicionar parâmetro |
| `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandHandler.cs` | Modify — passar campo + ToDto |
| `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandValidator.cs` | Modify — validação max length |
| `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommand.cs` | Modify — adicionar parâmetro |
| `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandHandler.cs` | Modify — passar campo |
| `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandValidator.cs` | Modify — validação max length |
| `src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs` | Modify — mapear coluna |
| `frontend/src/types/estoque.ts` | Modify — adicionar campo em Ingrediente, IngredienteFormValues, CriarIngredienteInput |
| `frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts` | Modify — schema condicional + conversores |
| `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | Modify — campo condicional no form |

### Subsistema B — Código Interno automático

| Arquivo | Ação |
|---------|------|
| `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx` | Modify — auto-geração por useEffect no nome |

### Subsistema C — Máscaras CNPJ e Telefone (Fornecedores)

| Arquivo | Ação |
|---------|------|
| `frontend/src/features/fornecedores/hooks/useFornecedorForm.ts` | Modify — schema Zod + formParaInput com strip |
| `frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx` | Modify — Controller para CNPJ e Telefone |
| `src/CasaDiAna.Application/Fornecedores/Commands/CriarFornecedor/CriarFornecedorCommandValidator.cs` | Modify — validação telefone |
| `src/CasaDiAna.Application/Fornecedores/Commands/AtualizarFornecedor/AtualizarFornecedorCommandValidator.cs` | Modify — validação telefone |

---

## Tarefa 1: Quantidade por Embalagem — Domínio e Persistência

**Arquivos:**
- Modify: `src/CasaDiAna.Domain/Entities/Ingrediente.cs`
- Modify: `src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs`

- [ ] **Passo 1.1: Adicionar propriedade à entidade Ingrediente**

Arquivo: `src/CasaDiAna.Domain/Entities/Ingrediente.cs`

Após a linha `public string? Observacoes { get; private set; }` (linha 15), adicionar:

```csharp
public string? QuantidadeEmbalagem { get; private set; }
```

Atualizar a assinatura de `Criar()` adicionando o parâmetro opcional antes do fechamento do bloco de parâmetros (após `string? observacoes = null`):

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
    string? quantidadeEmbalagem = null)
{
    if (estoqueMinimo < 0)
        throw new DomainException("Estoque mínimo não pode ser negativo.");
    if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
        throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

    return new Ingrediente
    {
        Id = Guid.NewGuid(),
        Nome = nome,
        CodigoInterno = codigoInterno,
        CategoriaId = categoriaId,
        UnidadeMedidaId = unidadeMedidaId,
        EstoqueAtual = 0,
        EstoqueMinimo = estoqueMinimo,
        EstoqueMaximo = estoqueMaximo,
        Observacoes = observacoes,
        QuantidadeEmbalagem = quantidadeEmbalagem,
        Ativo = true,
        CriadoEm = DateTime.UtcNow,
        AtualizadoEm = DateTime.UtcNow,
        CriadoPor = criadoPor,
        AtualizadoPor = criadoPor
    };
}
```

Atualizar `Atualizar()` da mesma forma:

```csharp
public void Atualizar(
    string nome,
    short unidadeMedidaId,
    decimal estoqueMinimo,
    Guid atualizadoPor,
    string? codigoInterno = null,
    Guid? categoriaId = null,
    decimal? estoqueMaximo = null,
    string? observacoes = null,
    string? quantidadeEmbalagem = null)
{
    if (estoqueMinimo < 0)
        throw new DomainException("Estoque mínimo não pode ser negativo.");
    if (estoqueMaximo.HasValue && estoqueMaximo < estoqueMinimo)
        throw new DomainException("Estoque máximo não pode ser menor que o mínimo.");

    Nome = nome;
    CodigoInterno = codigoInterno;
    CategoriaId = categoriaId;
    UnidadeMedidaId = unidadeMedidaId;
    EstoqueMinimo = estoqueMinimo;
    EstoqueMaximo = estoqueMaximo;
    Observacoes = observacoes;
    QuantidadeEmbalagem = quantidadeEmbalagem;
    AtualizadoEm = DateTime.UtcNow;
    AtualizadoPor = atualizadoPor;
}
```

- [ ] **Passo 1.2: Mapear coluna na configuração EF Core**

Arquivo: `src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs`

Após a linha que mapeia `Observacoes` (`builder.Property(i => i.Observacoes)...`), adicionar:

```csharp
builder.Property(i => i.QuantidadeEmbalagem).HasColumnName("quantidade_embalagem").HasMaxLength(100);
```

- [ ] **Passo 1.3: Gerar e aplicar migration**

Executar na raiz do projeto:

```bash
dotnet ef migrations add AdicionarQuantidadeEmbalagem `
  --project src/CasaDiAna.Infrastructure `
  --startup-project src/CasaDiAna.API
```

Verificar que a migration gerada contém:
```csharp
migrationBuilder.AddColumn<string>(
    name: "quantidade_embalagem",
    schema: "estoque",
    table: "ingredientes",
    type: "character varying(100)",
    maxLength: 100,
    nullable: true);
```

Depois aplicar:

```bash
dotnet ef database update `
  --project src/CasaDiAna.Infrastructure `
  --startup-project src/CasaDiAna.API
```

Saída esperada: `Done.`

---

## Tarefa 2: Quantidade por Embalagem — Camada Application

**Arquivos:**
- Modify: `src/CasaDiAna.Application/Ingredientes/Dtos/IngredienteDto.cs`
- Modify: `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommand.cs`
- Modify: `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandValidator.cs`
- Modify: `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommand.cs`
- Modify: `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandHandler.cs`
- Modify: `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandValidator.cs`

- [ ] **Passo 2.1: Adicionar campo ao DTO**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Dtos/IngredienteDto.cs`

Substituir o arquivo inteiro por:

```csharp
namespace CasaDiAna.Application.Ingredientes.Dtos;

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
    string? QuantidadeEmbalagem,
    bool Ativo,
    DateTime AtualizadoEm);
```

- [ ] **Passo 2.2: Adicionar parâmetro ao Command de criação**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommand.cs`

```csharp
using CasaDiAna.Application.Ingredientes.Dtos;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.CriarIngrediente;

public record CriarIngredienteCommand(
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaId = null,
    decimal? EstoqueMaximo = null,
    string? Observacoes = null,
    string? QuantidadeEmbalagem = null) : IRequest<IngredienteDto>;
```

- [ ] **Passo 2.3: Atualizar Handler de criação (ToDto e Criar)**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandHandler.cs`

Substituir a chamada a `Ingrediente.Criar()` para incluir o novo parâmetro:

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
    request.QuantidadeEmbalagem);
```

Substituir o método `ToDto` para incluir `QuantidadeEmbalagem`:

```csharp
internal static IngredienteDto ToDto(Ingrediente i) => new(
    i.Id, i.Nome, i.CodigoInterno,
    i.CategoriaId, i.Categoria?.Nome,
    i.UnidadeMedidaId, i.UnidadeMedida?.Codigo ?? string.Empty,
    i.EstoqueAtual, i.EstoqueMinimo, i.EstoqueMaximo,
    i.EstaBaixoDoMinimo(), i.Observacoes, i.QuantidadeEmbalagem, i.Ativo, i.AtualizadoEm);
```

- [ ] **Passo 2.4: Adicionar validação ao Validator de criação**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Commands/CriarIngrediente/CriarIngredienteCommandValidator.cs`

Adicionar ao construtor, após a regra de `CodigoInterno`:

```csharp
RuleFor(x => x.QuantidadeEmbalagem)
    .MaximumLength(100).When(x => x.QuantidadeEmbalagem != null)
    .WithMessage("Quantidade por embalagem deve ter no máximo 100 caracteres.");
```

- [ ] **Passo 2.5: Adicionar parâmetro ao Command de atualização**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommand.cs`

```csharp
using CasaDiAna.Application.Ingredientes.Dtos;
using MediatR;

namespace CasaDiAna.Application.Ingredientes.Commands.AtualizarIngrediente;

public record AtualizarIngredienteCommand(
    Guid Id,
    string Nome,
    short UnidadeMedidaId,
    decimal EstoqueMinimo,
    string? CodigoInterno = null,
    Guid? CategoriaId = null,
    decimal? EstoqueMaximo = null,
    string? Observacoes = null,
    string? QuantidadeEmbalagem = null) : IRequest<IngredienteDto>;
```

- [ ] **Passo 2.6: Atualizar Handler de atualização**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandHandler.cs`

Substituir a chamada a `ingrediente.Atualizar()`:

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
    request.QuantidadeEmbalagem);
```

- [ ] **Passo 2.7: Adicionar validação ao Validator de atualização**

Arquivo: `src/CasaDiAna.Application/Ingredientes/Commands/AtualizarIngrediente/AtualizarIngredienteCommandValidator.cs`

Adicionar ao construtor, após a regra de `CodigoInterno`:

```csharp
RuleFor(x => x.QuantidadeEmbalagem)
    .MaximumLength(100).When(x => x.QuantidadeEmbalagem != null)
    .WithMessage("Quantidade por embalagem deve ter no máximo 100 caracteres.");
```

- [ ] **Passo 2.8: Build do backend**

```bash
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded.` sem warnings sobre parâmetros ausentes.

- [ ] **Passo 2.9: Commit**

```bash
git add src/CasaDiAna.Domain/Entities/Ingrediente.cs
git add src/CasaDiAna.Application/Ingredientes/
git add src/CasaDiAna.Infrastructure/Persistence/Configurations/IngredienteConfiguration.cs
git add src/CasaDiAna.Infrastructure/Migrations/
git commit -m "feat(ingredientes): adicionar campo quantidade_embalagem no domínio e application"
```

---

## Tarefa 3: Quantidade por Embalagem — Frontend

**Arquivos:**
- Modify: `frontend/src/types/estoque.ts`
- Modify: `frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts`
- Modify: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

- [ ] **Passo 3.1: Atualizar types**

Arquivo: `frontend/src/types/estoque.ts`

Na interface `Ingrediente` (após `observacoes`), adicionar:
```typescript
quantidadeEmbalagem: string | null
```

Em `CriarIngredienteInput` (após `observacoes`), adicionar:
```typescript
quantidadeEmbalagem?: string | null
```

Em `IngredienteFormValues` (após `observacoes`), adicionar:
```typescript
quantidadeEmbalagem: string
```

- [ ] **Passo 3.2: Atualizar schema e conversores em useIngredienteForm.ts**

Arquivo: `frontend/src/features/estoque/ingredientes/hooks/useIngredienteForm.ts`

No schema, adicionar após `observacoes`:
```typescript
quantidadeEmbalagem: z
  .string()
  .max(100, 'Máximo 100 caracteres')
  .optional()
  .or(z.literal('')),
```

**Atenção:** A obrigatoriedade condicional (quando unidade = Pacote) é gerenciada na **página**, não no schema, porque o schema não tem acesso à lista de unidades. O schema aceita string opcional; a validação condicional ocorre com `.superRefine()` ou como validação de campo extra. Use a abordagem mais simples: adicionar o `.superRefine()` que recebe o form inteiro.

Substituir o schema por:

```typescript
export const ingredienteSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(200, 'Nome deve ter no máximo 200 caracteres'),
    codigoInterno: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
    categoriaId: z.string().uuid('Categoria inválida').optional().or(z.literal('')),
    unidadeMedidaId: z
      .string()
      .min(1, 'Unidade de medida é obrigatória')
      .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Selecione uma unidade'),
    estoqueMinimo: z
      .string()
      .min(1, 'Estoque mínimo é obrigatório')
      .refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Deve ser ≥ 0'),
    estoqueMaximo: z
      .string()
      .refine(v => v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Deve ser ≥ 0')
      .optional()
      .or(z.literal('')),
    observacoes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
    quantidadeEmbalagem: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    _ehPacote: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data._ehPacote && !data.quantidadeEmbalagem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a quantidade por embalagem (ex: 500 gramas, 1000 ml)',
        path: ['quantidadeEmbalagem'],
      })
    }
  })
```

Atualizar `type IngredienteSchema`:
```typescript
type IngredienteSchema = z.infer<typeof ingredienteSchema>
```

Atualizar `defaultValues`:
```typescript
const defaultValues: IngredienteFormValues = {
  nome: '',
  codigoInterno: '',
  categoriaId: '',
  unidadeMedidaId: '',
  estoqueMinimo: '',
  estoqueMaximo: '',
  observacoes: '',
  quantidadeEmbalagem: '',
}
```

Atualizar `ingredienteParaForm()`:
```typescript
export function ingredienteParaForm(ing: Ingrediente): IngredienteFormValues {
  return {
    nome: ing.nome,
    codigoInterno: ing.codigoInterno ?? '',
    categoriaId: ing.categoriaId ?? '',
    unidadeMedidaId: String(ing.unidadeMedidaId),
    estoqueMinimo: String(ing.estoqueMinimo),
    estoqueMaximo: ing.estoqueMaximo != null ? String(ing.estoqueMaximo) : '',
    observacoes: ing.observacoes ?? '',
    quantidadeEmbalagem: ing.quantidadeEmbalagem ?? '',
  }
}
```

Atualizar `formParaInput()`:
```typescript
function formParaInput(values: IngredienteSchema) {
  return {
    nome: values.nome,
    unidadeMedidaId: Number(values.unidadeMedidaId),
    estoqueMinimo: Number(values.estoqueMinimo),
    codigoInterno: values.codigoInterno || null,
    categoriaId: values.categoriaId || null,
    estoqueMaximo: values.estoqueMaximo ? Number(values.estoqueMaximo) : null,
    observacoes: values.observacoes || null,
    quantidadeEmbalagem: values.quantidadeEmbalagem || null,
  }
}
```

- [ ] **Passo 3.3: Adicionar campo condicional em IngredienteFormPage.tsx**

Arquivo: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

Após o `useEffect` que atualiza `unidadeAtual` (por volta da linha 63), adicionar:

```tsx
// Determina se a unidade selecionada é "Pacote" (verifica a descrição, case-insensitive)
const ehPacote = unidades
  .find(u => String(u.id) === unidadeSelecionadaId)
  ?.descricao.toLowerCase()
  .includes('pacote') ?? false

// Sincronizar flag _ehPacote no form para que o superRefine funcione
useEffect(() => {
  form.setValue('_ehPacote', ehPacote)
  if (!ehPacote) {
    form.setValue('quantidadeEmbalagem', '')
    form.clearErrors('quantidadeEmbalagem')
  }
}, [ehPacote, form])
```

Dentro do `<FormCard>`, após a seção "Controle de Estoque" (antes da seção "Observações"), adicionar:

```tsx
{ehPacote && (
  <>
    <FormSection titulo="Embalagem" />
    <div className="max-w-xs">
      <CampoTexto
        label="Quantidade por Embalagem"
        obrigatorio
        placeholder="Ex: 500 gramas, 1000 ml, 5 kg"
        {...register('quantidadeEmbalagem')}
        erro={errors.quantidadeEmbalagem?.message}
      />
    </div>
  </>
)}
```

Adicionar `'_ehPacote'` aos campos que o `IngredienteFormValues` tem — como o type já foi atualizado no passo anterior, o TypeScript vai aceitar. Mas `_ehPacote` é um campo auxiliar de controle; **não** incluí-lo em `defaultValues` causaria erro de tipo. Adicione ao `defaultValues` em `useIngredienteForm.ts`:
```typescript
_ehPacote: false,
```
E no type `IngredienteFormValues` em `types/estoque.ts`:
```typescript
_ehPacote?: boolean
```

- [ ] **Passo 3.4: Checagem TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 3.5: Commit**

```bash
git add frontend/src/types/estoque.ts
git add frontend/src/features/estoque/ingredientes/
git commit -m "feat(ingredientes): campo quantidade_embalagem condicional para unidade Pacote"
```

---

## Tarefa 4: Código Interno — Auto-geração

**Arquivos:**
- Modify: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

- [ ] **Passo 4.1: Implementar auto-geração**

Arquivo: `frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx`

Adicionar a função utilitária antes do componente (fora do componente, antes de `export function IngredienteFormPage()`):

```tsx
function gerarCodigoInterno(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean)
  const prefixo = palavras
    .slice(0, 3)
    .map(p => p[0].toUpperCase())
    .join('')
  const sufixo = String(Math.floor(Math.random() * 900) + 100)
  return `${prefixo}-${sufixo}`
}
```

Dentro do componente, após a linha `const { register, handleSubmit, watch, reset, formState: { errors } } = form`, adicionar o watch para o nome:

```tsx
const nomeAtual = watch('nome')
const codigoAtual = watch('codigoInterno')
```

Adicionar o `useEffect` de auto-geração **após** o `useEffect` que sincroniza `_ehPacote`:

```tsx
// Auto-gerar código interno quando nome é preenchido e código ainda está vazio
// Apenas no modo criação; edição não altera código já existente
useEffect(() => {
  if (!modoEdicao && nomeAtual.trim().length >= 3 && !codigoAtual.trim()) {
    form.setValue('codigoInterno', gerarCodigoInterno(nomeAtual))
  }
}, [nomeAtual]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Decisão técnica:** O código é auto-gerado ao digitar (a partir de 3 chars). O usuário pode sobrescrevê-lo — se editar manualmente, `codigoAtual.trim()` deixará de ser vazio e a auto-geração para. Em modo de edição o bloco não dispara.

- [ ] **Passo 4.2: Checagem TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 4.3: Commit**

```bash
git add frontend/src/features/estoque/ingredientes/pages/IngredienteFormPage.tsx
git commit -m "feat(ingredientes): auto-geração de código interno ao preencher nome"
```

---

## Tarefa 5: Máscaras CNPJ e Telefone — Frontend

**Arquivos:**
- Modify: `frontend/src/features/fornecedores/hooks/useFornecedorForm.ts`
- Modify: `frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx`

- [ ] **Passo 5.1: Adicionar utilitários de máscara e atualizar schema**

Arquivo: `frontend/src/features/fornecedores/hooks/useFornecedorForm.ts`

Substituir o arquivo inteiro por:

```typescript
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Fornecedor, FornecedorFormValues, CriarFornecedorInput } from '@/types/estoque'

// ─── Utilitários de máscara ───────────────────────────────────────────────────

export function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14)
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 10) {
    return digitos
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digitos
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

// ─── Schema de validação ──────────────────────────────────────────────────────

export const fornecedorSchema = z.object({
  razaoSocial: z.string().min(1, 'Razão Social é obrigatória.').max(200, 'Máximo de 200 caracteres.'),
  nomeFantasia: z.string().max(200, 'Máximo de 200 caracteres.'),
  cnpj: z.string().refine(
    v => !v || v.replace(/\D/g, '').length === 14,
    'CNPJ deve ter exatamente 14 dígitos.'
  ),
  telefone: z.string().refine(
    v => !v || (v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 11),
    'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).'
  ),
  email: z.string().refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Informe um e-mail válido.'),
  contatoNome: z.string(),
  observacoes: z.string(),
})

// ─── Conversores ──────────────────────────────────────────────────────────────

export function fornecedorParaForm(f: Fornecedor): FornecedorFormValues {
  return {
    razaoSocial: f.razaoSocial,
    nomeFantasia: f.nomeFantasia ?? '',
    cnpj: f.cnpj ? formatarCnpj(f.cnpj) : '',
    telefone: f.telefone ? formatarTelefone(f.telefone) : '',
    email: f.email ?? '',
    contatoNome: f.contatoNome ?? '',
    observacoes: f.observacoes ?? '',
  }
}

export function formParaInput(values: FornecedorFormValues): CriarFornecedorInput {
  return {
    razaoSocial: values.razaoSocial,
    nomeFantasia: values.nomeFantasia || null,
    cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : null,
    telefone: values.telefone ? values.telefone.replace(/\D/g, '') : null,
    email: values.email || null,
    contatoNome: values.contatoNome || null,
    observacoes: values.observacoes || null,
  }
}

export function useFornecedorForm() {
  return useForm<FornecedorFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fornecedorSchema) as any,
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      telefone: '',
      email: '',
      contatoNome: '',
      observacoes: '',
    },
  })
}
```

**Por que `as any`:** Convenção do projeto — `resolver: zodResolver(schema) as any` está documentada no CLAUDE.md para evitar conflito de tipos com campos opcionais do RHF.

**Por que strip no envio:** O backend valida CNPJ como `^\d{14}$`. Se enviarmos `12.345.678/0001-95`, o regex rejeita. Para telefone, o backend aceita `varchar(20)` com MaximumLength; enviamos somente dígitos para consistência e para suportar a validação que será adicionada no Passo 6.

- [ ] **Passo 5.2: Usar Controller para CNPJ e Telefone na página**

Arquivo: `frontend/src/features/fornecedores/pages/FornecedorFormPage.tsx`

Adicionar o import de `Controller` no topo:
```tsx
import { Controller } from 'react-hook-form'
```

Atualizar a desestruturação do hook (adicionar `control`):
```tsx
const {
  register,
  handleSubmit,
  reset,
  control,
  formState: { errors, isSubmitting },
} = useFornecedorForm()
```

Substituir o bloco do campo CNPJ:

```tsx
{/* ANTES: */}
{/* <div className="mt-4 max-w-xs">
  <CampoTexto
    label="CNPJ"
    placeholder="14 dígitos sem pontuação"
    erro={errors.cnpj?.message}
    {...register('cnpj')}
  />
</div> */}

{/* DEPOIS: */}
<div className="mt-4 max-w-xs">
  <Controller
    name="cnpj"
    control={control}
    render={({ field }) => (
      <CampoTexto
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        inputMode="numeric"
        value={field.value}
        onChange={e => field.onChange(formatarCnpj(e.target.value))}
        onBlur={field.onBlur}
        erro={errors.cnpj?.message}
      />
    )}
  />
</div>
```

Substituir o campo Telefone:

```tsx
{/* ANTES: */}
{/* <CampoTexto
  label="Telefone"
  placeholder="(11) 99999-9999"
  erro={errors.telefone?.message}
  {...register('telefone')}
/> */}

{/* DEPOIS: */}
<Controller
  name="telefone"
  control={control}
  render={({ field }) => (
    <CampoTexto
      label="Telefone"
      placeholder="(11) 99999-9999"
      inputMode="numeric"
      value={field.value}
      onChange={e => field.onChange(formatarTelefone(e.target.value))}
      onBlur={field.onBlur}
      erro={errors.telefone?.message}
    />
  )}
/>
```

Adicionar o import de `formatarCnpj` e `formatarTelefone` no topo da página:
```tsx
import { useFornecedorForm, fornecedorParaForm, formParaInput, formatarCnpj, formatarTelefone } from '../hooks/useFornecedorForm'
```

- [ ] **Passo 5.3: Checagem TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Passo 5.4: Commit**

```bash
git add frontend/src/features/fornecedores/
git commit -m "feat(fornecedores): máscaras de CNPJ e Telefone com validação Zod"
```

---

## Tarefa 6: Validação de Telefone no Backend

**Arquivos:**
- Modify: `src/CasaDiAna.Application/Fornecedores/Commands/CriarFornecedor/CriarFornecedorCommandValidator.cs`
- Modify: `src/CasaDiAna.Application/Fornecedores/Commands/AtualizarFornecedor/AtualizarFornecedorCommandValidator.cs`

**Contexto:** Após o Passo 5.1, o frontend envia o telefone como somente dígitos (10 ou 11 chars). O backend deve validar isso. O CNPJ já era validado com `^\d{14}$`, apenas o Telefone precisa de atualização.

- [ ] **Passo 6.1: Atualizar validator de criação**

Arquivo: `src/CasaDiAna.Application/Fornecedores/Commands/CriarFornecedor/CriarFornecedorCommandValidator.cs`

Substituir a regra de Telefone:

```csharp
RuleFor(x => x.Telefone)
    .Matches(@"^\d{10,11}$").When(x => x.Telefone != null)
    .WithMessage("Telefone deve conter DDD + número (10 ou 11 dígitos numéricos).");
```

- [ ] **Passo 6.2: Atualizar validator de atualização**

Arquivo: `src/CasaDiAna.Application/Fornecedores/Commands/AtualizarFornecedor/AtualizarFornecedorCommandValidator.cs`

Aplicar a mesma substituição:

```csharp
RuleFor(x => x.Telefone)
    .Matches(@"^\d{10,11}$").When(x => x.Telefone != null)
    .WithMessage("Telefone deve conter DDD + número (10 ou 11 dígitos numéricos).");
```

- [ ] **Passo 6.3: Build do backend**

```bash
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded.`

- [ ] **Passo 6.4: Commit**

```bash
git add src/CasaDiAna.Application/Fornecedores/
git commit -m "feat(fornecedores): validar telefone como dígitos (10-11) no backend"
```

---

## Tarefa 7: Verificação final

- [ ] **Passo 7.1: Build completo do frontend**

```bash
cd frontend && npm run build
```

Saída esperada: `✓ built in ...s` sem erros TypeScript ou de compilação.

- [ ] **Passo 7.2: Build do backend**

```bash
dotnet build src/CasaDiAna.API
```

Saída esperada: `Build succeeded.`

- [ ] **Passo 7.3: Checar pontos críticos manualmente**

- [ ] Criar ingrediente com unidade "kg": campo "Quantidade por Embalagem" **não** aparece
- [ ] Criar ingrediente com unidade "Pacote": campo "Quantidade por Embalagem" **aparece** e é obrigatório
- [ ] Tentar salvar com Pacote sem preencher embalagem: erro de validação no campo
- [ ] Código interno é auto-sugerido ao digitar o nome (modo criação)
- [ ] Código interno não muda ao editar um ingrediente existente
- [ ] CNPJ formata automaticamente ao digitar (`00.000.000/0000-00`)
- [ ] CNPJ incompleto bloqueia envio com mensagem de erro
- [ ] Telefone formata automaticamente ao digitar (`(00) 00000-0000`)
- [ ] Telefone incompleto bloqueia envio com mensagem de erro
- [ ] Editar fornecedor existente: CNPJ e telefone carregam já formatados
- [ ] Dados chegam ao backend sem máscara (CNPJ = 14 dígitos, Telefone = 10/11 dígitos)

---

## Decisões técnicas

| Decisão | Motivo |
|---------|--------|
| `_ehPacote` como campo oculto no schema | `superRefine` precisa de contexto do form para validar condicional; injetar a flag via `setValue` é mais simples que reestruturar o hook |
| Verificar `descricao.toLowerCase().includes('pacote')` para detectar unidade | Flexível: funciona com variações de cadastro ("Pacote", "PACOTE", "pacote 500g") |
| Strip de máscara antes de enviar CNPJ e Telefone | Backend CNPJ já valida `^\d{14}$`; Telefone recebe novo regex `^\d{10,11}$` |
| `formatarCnpj` e `formatarTelefone` exportadas do hook | A página precisa importá-las para o Controller; manter no mesmo arquivo evita proliferação |
| Auto-geração de código para de atualizar quando usuário digita no campo | `codigoAtual.trim()` passa a ser não-vazio; sem loop infinito |
| Código não auto-gera em modo edição | Evita sobrescrever código já atribuído e salvo no banco |
