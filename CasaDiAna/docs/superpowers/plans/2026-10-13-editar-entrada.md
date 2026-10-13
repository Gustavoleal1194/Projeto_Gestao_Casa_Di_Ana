# Editar Entrada de Mercadoria — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir editar cabeçalho, boletos e custo unitário dos itens de uma entrada confirmada, sem tocar no estoque, propagando o custo para o cadastro só quando a entrada é a compra mais recente do item.

**Architecture:** Métodos de domínio novos em `EntradaMercadoria`, com guardas reaproveitadas. `EditarEntradaCommand` (CQRS/MediatR) compartilha as regras de cabeçalho com o registro via `ICabecalhoEntrada` + `CabecalhoEntradaValidator`. O repositório responde "quais itens têm entrada posterior" em uma consulta por tipo e insere/remove boletos explicitamente (erro E1). Endpoint `PUT /api/entradas/{id}`. No frontend, os campos de cabeçalho e boletos são extraídos do `EntradaFormPage` para componentes compartilhados via `FormProvider`, e a nova `EntradaEdicaoPage` reaproveita esses componentes junto com uma tabela de custos.

**Tech Stack:** ASP.NET Core 8, EF Core (Npgsql), MediatR, FluentValidation, xUnit + Moq + FluentAssertions; React 18 + TypeScript, react-hook-form 7, Zod 4, axios, Tailwind v4 com tokens `--ada-*`.

**Spec:** `CasaDiAna/docs/superpowers/specs/2026-10-13-editar-entrada-design.md`

## Global Constraints

- Todo texto (código, mensagens, commits) em **português do Brasil**.
- A edição **nunca** altera `EstoqueAtual` nem cria `Movimentacao`/`MovimentacaoUtensilio`.
- Só entradas com status `Confirmada` podem ser editadas.
- Permissão backend: autor (`CriadoPor`) ou papel `"Admin"`. Caso contrário, `UnauthorizedAccessException("Acesso negado.")`, igual ao cancelamento.
- Permissão frontend: papéis `['Admin', 'Coordenador', 'Compras']`.
- Mensagem de boleto: `"A data de vencimento do boleto deve ser hoje ou no futuro."`.
- Filhos de coleção `private readonly List<T>` são inseridos/removidos **pelo repositório** (`DbSet<TFilho>`), nunca via `_db.Update(parent)` (erro E1 do BrainOS).
- Build backend sempre por `dotnet build src/CasaDiAna.API`. Type-check frontend: `npx tsc -b --noEmit` (com `-b`).
- Frontend: cores só via tokens `var(--ada-*)`; `zodResolver(schema) as any`; `handleSubmit(onSubmit as any)` (E8); Zod 4 sem `required_error` (E9); `!` no payload para campos `number | undefined` (E10).
- Componentes de feature com ≤ ~80–100 linhas; sem JSX/lógica duplicada entre o form de registro e o de edição.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Fornecedor da entrada desativado depois do registro.** Editar só a NF não pode falhar. O backend valida o fornecedor apenas quando ele muda (teste no Task 3), e o combobox do frontend inclui o fornecedor atual mesmo se inativo (`opcoesFornecedorEdicao`, Task 6).
2. **Boleto já vencido mantido.** Salvar a entrada sem mexer no boleto antigo deve funcionar. A comparação é por `.Date`, para não falhar com hora/fuso (teste no Task 1 e no Task 3).
3. **Desmarcar "Pagamento via boleto" na edição.** Deve remover todos os boletos. O front envia `datasVencimentoBoleto: []` (Task 6) e o domínio remove todos (teste no Task 1).
4. **Salvar sem nenhuma alteração.** Não deve dar erro nem mudar estoque. O payload só envia custos alterados (teste de `montarEdicaoInput` não existe por falta de runner; verificação manual no Task 7). O handler sincroniza o custo do cadastro de forma idempotente (teste no Task 3).
5. **Duas entradas na mesma data.** O desempate por `CriadoEm` decide qual é "a mais recente". A consulta do repositório usa `DataEntrada > x OR (DataEntrada == x AND CriadoEm > y)` (Task 3, verificação manual no Task 7).

## Estrutura de arquivos

**Backend (raiz `CasaDiAna/`)**

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/CasaDiAna.Domain/Entities/ItemEntradaMercadoria.cs` | Modificar | `AlterarCustoUnitario` |
| `src/CasaDiAna.Domain/Entities/ItemEntradaUtensilio.cs` | Modificar | `AlterarCustoUnitario` |
| `src/CasaDiAna.Domain/Entities/AlteracaoBoletos.cs` | Criar | Resultado de `SubstituirBoletos` (removidos/adicionados) |
| `src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs` | Modificar | Guardas privadas + `AtualizarCabecalho`, `SubstituirBoletos`, `AlterarCustoItem`, `AlterarCustoItemUtensilio` |
| `src/CasaDiAna.Application/Entradas/Common/ICabecalhoEntrada.cs` | Criar | Contrato do cabeçalho comum a registrar/editar |
| `src/CasaDiAna.Application/Entradas/Common/CabecalhoEntradaValidator.cs` | Criar | Regras de cabeçalho (internal, incluído pelos validators) |
| `src/CasaDiAna.Application/Entradas/Common/EntradaPermissao.cs` | Criar | Regra autor/Admin |
| `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommand.cs` | Modificar | Implementa `ICabecalhoEntrada` |
| `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandValidator.cs` | Modificar | `Include(new CabecalhoEntradaValidator())` |
| `src/CasaDiAna.Application/Entradas/Commands/CancelarEntrada/CancelarEntradaCommandHandler.cs` | Modificar | Usa `EntradaPermissao` |
| `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/CustoItemInputDto.cs` | Criar | `(ItemId, CustoUnitario)` |
| `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommand.cs` | Criar | Command |
| `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommandValidator.cs` | Criar | Validação |
| `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommandHandler.cs` | Criar | Orquestração + regra do custo |
| `src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs` | Modificar | 4 métodos novos |
| `src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs` | Modificar | Implementação |
| `src/CasaDiAna.API/Controllers/EntradasController.cs` | Modificar | `PUT {id}` |
| `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaEdicaoTests.cs` | Criar | Domínio |
| `tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandValidatorTests.cs` | Criar | Validator |
| `tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandHandlerTests.cs` | Criar | Handler |

**Frontend (raiz `CasaDiAna/frontend/src/`)**

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `lib/erros.ts` | Criar | `extrairMensagemErro(erro, padrao)` |
| `features/entradas/permissoes.ts` | Criar | `PAPEIS_EDICAO_ENTRADA` (hoje duplicado em 2 páginas) |
| `features/entradas/schemas/entradaSchemas.ts` | Criar | Shape do cabeçalho, `campoNumerico`, regra de boleto, schemas de registro e edição |
| `features/entradas/components/CamposCabecalhoEntrada.tsx` | Criar | Campos do cabeçalho (via `useFormContext`) |
| `features/entradas/components/SecaoBoletos.tsx` | Criar | Toggle + lista de boletos (via `useFormContext`) |
| `features/entradas/pages/EntradaFormPage.tsx` | Modificar | Usa `FormProvider` + componentes acima (comportamento igual) |
| `types/estoque.ts` | Modificar | `CabecalhoEntradaValues`, `EntradaEdicaoFormValues`, `CustoItemInput`, `EditarEntradaInput` |
| `features/entradas/services/entradasService.ts` | Modificar | `editar` |
| `features/entradas/utils/edicaoEntrada.ts` | Criar | Funções puras: valores iniciais, payload, totais, opções de fornecedor |
| `features/entradas/hooks/useEntradaEdicao.ts` | Criar | Carrega entrada + fornecedores |
| `features/entradas/components/TabelaCustosEdicao.tsx` | Criar | Itens somente leitura + custo editável + total antes → depois |
| `features/entradas/components/FormularioEdicaoEntrada.tsx` | Criar | Form de edição (submit, toast) |
| `features/entradas/pages/EntradaEdicaoPage.tsx` | Criar | Página fina: loading/erro/cancelada → form |
| `routes/AppRoutes.tsx` | Modificar | Rota `/entradas/:id/editar` |
| `features/entradas/pages/EntradaDetalhePage.tsx` | Modificar | Botão Editar + toast vindo da navegação |
| `features/entradas/pages/EntradasPage.tsx` | Modificar | Usa `PAPEIS_EDICAO_ENTRADA` |

> **Desvio consciente da spec (frontend):** a spec dizia "EntradaFormPage em modo edição". O plano usa uma página de edição própria, que reaproveita os componentes extraídos do form de registro. O form de registro tem 389 linhas e lógica de itens (adicionar/remover/trocar tipo) que não existe na edição. Um modo condicional espalharia `if (edicao)` pelo arquivo, contra o CLAUDE.md. O "total antes → depois" aparece ao vivo na tabela de custos, em vez de num modal pós-salvar: o usuário vê o efeito antes de confirmar.

---

### Task 1: Domínio — métodos de edição em `EntradaMercadoria`

**Files:**
- Modify: `src/CasaDiAna.Domain/Entities/ItemEntradaMercadoria.cs`
- Modify: `src/CasaDiAna.Domain/Entities/ItemEntradaUtensilio.cs`
- Create: `src/CasaDiAna.Domain/Entities/AlteracaoBoletos.cs`
- Modify: `src/CasaDiAna.Domain/Entities/EntradaMercadoria.cs`
- Test: `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaEdicaoTests.cs`

**Interfaces:**
- Produces:
  - `void EntradaMercadoria.AtualizarCabecalho(Guid fornecedorId, DateTime dataEntrada, string? numeroNotaFiscal, string? recebidoPor, string? observacoes, Guid atualizadoPor)`
  - `AlteracaoBoletos EntradaMercadoria.SubstituirBoletos(IEnumerable<DateTime> datasVencimento, DateTime hoje, Guid atualizadoPor)`
  - `void EntradaMercadoria.AlterarCustoItem(Guid itemId, decimal custoUnitario, Guid atualizadoPor)`
  - `void EntradaMercadoria.AlterarCustoItemUtensilio(Guid itemId, decimal custoUnitario, Guid atualizadoPor)`
  - `sealed record AlteracaoBoletos(IReadOnlyList<BoletoEntrada> Removidos, IReadOnlyList<BoletoEntrada> Adicionados)` (namespace `CasaDiAna.Domain.Entities`)

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaEdicaoTests.cs`:

```csharp
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EntradaMercadoriaEdicaoTests
{
    private static readonly DateTime Hoje = new(2026, 10, 13);
    private readonly Guid _criadoPor = Guid.NewGuid();
    private readonly Guid _editadoPor = Guid.NewGuid();

    private EntradaMercadoria NovaEntrada() =>
        EntradaMercadoria.Criar(Guid.NewGuid(), Hoje, _criadoPor, "NF-1", "Ana", "obs");

    [Fact]
    public void AtualizarCabecalho_DeveAlterarCampos_ERegistrarAuditoria()
    {
        var entrada = NovaEntrada();
        var novoFornecedor = Guid.NewGuid();
        var novaData = Hoje.AddDays(-2);

        entrada.AtualizarCabecalho(novoFornecedor, novaData, "NF-2", "Bia", null, _editadoPor);

        entrada.FornecedorId.Should().Be(novoFornecedor);
        entrada.DataEntrada.Should().Be(novaData);
        entrada.NumeroNotaFiscal.Should().Be("NF-2");
        entrada.RecebidoPor.Should().Be("Bia");
        entrada.Observacoes.Should().BeNull();
        entrada.AtualizadoPor.Should().Be(_editadoPor);
        entrada.Status.Should().Be(StatusEntrada.Confirmada);
    }

    [Fact]
    public void AtualizarCabecalho_EntradaCancelada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.Cancelar(_criadoPor);

        var acao = () => entrada.AtualizarCabecalho(Guid.NewGuid(), Hoje, null, "Ana", null, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }

    [Fact]
    public void AlterarCustoItem_DeveRecalcularCustoTotal()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);
        var item = entrada.Itens.Single();

        entrada.AlterarCustoItem(item.Id, 7.5m, _editadoPor);

        item.CustoUnitario.Should().Be(7.5m);
        item.CustoTotal.Should().Be(75m);
        entrada.CustoTotal.Should().Be(75m);
        entrada.AtualizadoPor.Should().Be(_editadoPor);
    }

    [Fact]
    public void AlterarCustoItem_CustoNegativo_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);

        var acao = () => entrada.AlterarCustoItem(entrada.Itens.Single().Id, -1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("Custo unitário não pode ser negativo.");
    }

    [Fact]
    public void AlterarCustoItem_ItemDeOutraEntrada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);

        var acao = () => entrada.AlterarCustoItem(Guid.NewGuid(), 1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("Item não pertence a esta entrada.");
    }

    [Fact]
    public void AlterarCustoItem_EntradaCancelada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItem(Guid.NewGuid(), 10m, 5m);
        entrada.Cancelar(_criadoPor);

        var acao = () => entrada.AlterarCustoItem(entrada.Itens.Single().Id, 1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }

    [Fact]
    public void AlterarCustoItemUtensilio_DeveRecalcularCustoTotal()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarItemUtensilio(Guid.NewGuid(), 4m, 3m);
        var item = entrada.ItensUtensilio.Single();

        entrada.AlterarCustoItemUtensilio(item.Id, 2m, _editadoPor);

        item.CustoTotal.Should().Be(8m);
    }

    [Fact]
    public void AlterarCustoItemUtensilio_ItemInexistente_DeveLancar()
    {
        var entrada = NovaEntrada();

        var acao = () => entrada.AlterarCustoItemUtensilio(Guid.NewGuid(), 1m, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("Item não pertence a esta entrada.");
    }

    [Fact]
    public void SubstituirBoletos_DeveManterExistentes_RemoverAusentes_EAdicionarNovos()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));
        entrada.AdicionarBoleto(Hoje.AddDays(20));
        var mantido = entrada.Boletos.Single(b => b.DataVencimento == Hoje.AddDays(10));
        var removido = entrada.Boletos.Single(b => b.DataVencimento == Hoje.AddDays(20));

        var alteracao = entrada.SubstituirBoletos(
            new[] { Hoje.AddDays(10), Hoje.AddDays(30) }, Hoje, _editadoPor);

        entrada.Boletos.Select(b => b.DataVencimento)
            .Should().BeEquivalentTo(new[] { Hoje.AddDays(10), Hoje.AddDays(30) });
        entrada.Boletos.Should().Contain(mantido);
        alteracao.Removidos.Should().ContainSingle().Which.Should().Be(removido);
        alteracao.Adicionados.Should().ContainSingle()
            .Which.DataVencimento.Should().Be(Hoje.AddDays(30));
    }

    [Fact]
    public void SubstituirBoletos_DataExistenteNoPassado_DeveSerAceita()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(-5));

        var alteracao = entrada.SubstituirBoletos(
            new[] { Hoje.AddDays(-5).AddHours(3) }, Hoje, _editadoPor);

        alteracao.Removidos.Should().BeEmpty();
        alteracao.Adicionados.Should().BeEmpty();
        entrada.Boletos.Should().ContainSingle();
    }

    [Fact]
    public void SubstituirBoletos_DataNovaNoPassado_DeveLancar_SemAlterarBoletos()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));

        var acao = () => entrada.SubstituirBoletos(new[] { Hoje.AddDays(-1) }, Hoje, _editadoPor);

        acao.Should().Throw<DomainException>()
            .WithMessage("A data de vencimento do boleto deve ser hoje ou no futuro.");
        entrada.Boletos.Should().ContainSingle()
            .Which.DataVencimento.Should().Be(Hoje.AddDays(10));
    }

    [Fact]
    public void SubstituirBoletos_ListaVazia_DeveRemoverTodos()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));
        entrada.AdicionarBoleto(Hoje.AddDays(20));

        var alteracao = entrada.SubstituirBoletos(Array.Empty<DateTime>(), Hoje, _editadoPor);

        entrada.Boletos.Should().BeEmpty();
        alteracao.Removidos.Should().HaveCount(2);
    }

    [Fact]
    public void SubstituirBoletos_DatasRepetidas_DeveManterUmBoletoPorOcorrencia()
    {
        var entrada = NovaEntrada();
        entrada.AdicionarBoleto(Hoje.AddDays(10));

        var alteracao = entrada.SubstituirBoletos(
            new[] { Hoje.AddDays(10), Hoje.AddDays(10) }, Hoje, _editadoPor);

        entrada.Boletos.Should().HaveCount(2);
        alteracao.Adicionados.Should().ContainSingle();
    }

    [Fact]
    public void SubstituirBoletos_EntradaCancelada_DeveLancar()
    {
        var entrada = NovaEntrada();
        entrada.Cancelar(_criadoPor);

        var acao = () => entrada.SubstituirBoletos(Array.Empty<DateTime>(), Hoje, _editadoPor);

        acao.Should().Throw<DomainException>().WithMessage("*cancelada*");
    }
}
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run (em `CasaDiAna/`): `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~EntradaMercadoriaEdicaoTests"`
Expected: falha de compilação (`AtualizarCabecalho`, `SubstituirBoletos`, `AlterarCustoItem*` não existem).

- [ ] **Step 3: Implementar**

Em `ItemEntradaMercadoria.cs` e em `ItemEntradaUtensilio.cs`, adicionar logo após o método `Criar`:

```csharp
    internal void AlterarCustoUnitario(decimal custoUnitario) => CustoUnitario = custoUnitario;
```

Criar `src/CasaDiAna.Domain/Entities/AlteracaoBoletos.cs`:

```csharp
namespace CasaDiAna.Domain.Entities;

public sealed record AlteracaoBoletos(
    IReadOnlyList<BoletoEntrada> Removidos,
    IReadOnlyList<BoletoEntrada> Adicionados);
```

Em `EntradaMercadoria.cs`, substituir tudo de `public void AdicionarItem(` até o fim da classe por:

```csharp
    public void AdicionarItem(Guid ingredienteId, decimal quantidade, decimal custoUnitario)
    {
        GarantirConfirmada("Não é possível adicionar itens a uma entrada cancelada.");
        ValidarQuantidadeECusto(quantidade, custoUnitario);
        if (_itens.Any(i => i.IngredienteId == ingredienteId))
            throw new DomainException("Ingrediente já adicionado nesta entrada.");

        _itens.Add(ItemEntradaMercadoria.Criar(Id, ingredienteId, quantidade, custoUnitario));
    }

    public void AdicionarItemUtensilio(Guid utensilioId, decimal quantidade, decimal custoUnitario)
    {
        GarantirConfirmada("Não é possível adicionar itens a uma entrada cancelada.");
        ValidarQuantidadeECusto(quantidade, custoUnitario);
        if (_itensUtensilio.Any(i => i.UtensilioId == utensilioId))
            throw new DomainException("Utensílio já adicionado nesta entrada.");

        _itensUtensilio.Add(ItemEntradaUtensilio.Criar(Id, utensilioId, quantidade, custoUnitario));
    }

    public void AdicionarBoleto(DateTime dataVencimento)
    {
        GarantirConfirmada("Não é possível adicionar boleto a uma entrada cancelada.");

        _boletos.Add(BoletoEntrada.Criar(Id, dataVencimento));
    }

    public void AtualizarCabecalho(
        Guid fornecedorId,
        DateTime dataEntrada,
        string? numeroNotaFiscal,
        string? recebidoPor,
        string? observacoes,
        Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);

        FornecedorId = fornecedorId;
        DataEntrada = dataEntrada;
        NumeroNotaFiscal = numeroNotaFiscal;
        RecebidoPor = recebidoPor;
        Observacoes = observacoes;
        RegistrarAlteracao(atualizadoPor);
    }

    /// <summary>
    /// Substitui os boletos pela lista informada. Boletos cuja data já existia são mantidos
    /// (mesmo vencidos); datas novas precisam ser hoje ou no futuro.
    /// </summary>
    public AlteracaoBoletos SubstituirBoletos(IEnumerable<DateTime> datasVencimento, DateTime hoje, Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);

        var semCorrespondencia = _boletos.ToList();
        var datasNovas = new List<DateTime>();
        foreach (var data in datasVencimento)
        {
            var existente = semCorrespondencia.FirstOrDefault(b => b.DataVencimento.Date == data.Date);
            if (existente is null)
                datasNovas.Add(data);
            else
                semCorrespondencia.Remove(existente);
        }

        if (datasNovas.Any(d => d.Date < hoje.Date))
            throw new DomainException("A data de vencimento do boleto deve ser hoje ou no futuro.");

        foreach (var removido in semCorrespondencia)
            _boletos.Remove(removido);

        var adicionados = datasNovas.Select(d => BoletoEntrada.Criar(Id, d)).ToList();
        _boletos.AddRange(adicionados);
        RegistrarAlteracao(atualizadoPor);

        return new AlteracaoBoletos(semCorrespondencia, adicionados);
    }

    public void AlterarCustoItem(Guid itemId, decimal custoUnitario, Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);
        ValidarCusto(custoUnitario);
        var item = _itens.FirstOrDefault(i => i.Id == itemId)
            ?? throw new DomainException(MensagemItemInexistente);

        item.AlterarCustoUnitario(custoUnitario);
        RegistrarAlteracao(atualizadoPor);
    }

    public void AlterarCustoItemUtensilio(Guid itemId, decimal custoUnitario, Guid atualizadoPor)
    {
        GarantirConfirmada(MensagemEdicaoCancelada);
        ValidarCusto(custoUnitario);
        var item = _itensUtensilio.FirstOrDefault(i => i.Id == itemId)
            ?? throw new DomainException(MensagemItemInexistente);

        item.AlterarCustoUnitario(custoUnitario);
        RegistrarAlteracao(atualizadoPor);
    }

    public void Cancelar(Guid atualizadoPor)
    {
        if (Status == StatusEntrada.Cancelada)
            throw new DomainException("Entrada já está cancelada.");

        Status = StatusEntrada.Cancelada;
        RegistrarAlteracao(atualizadoPor);
    }

    private const string MensagemEdicaoCancelada = "Não é possível editar uma entrada cancelada.";
    private const string MensagemItemInexistente = "Item não pertence a esta entrada.";

    private void GarantirConfirmada(string mensagem)
    {
        if (Status != StatusEntrada.Confirmada)
            throw new DomainException(mensagem);
    }

    private static void ValidarQuantidadeECusto(decimal quantidade, decimal custoUnitario)
    {
        if (quantidade <= 0)
            throw new DomainException("Quantidade deve ser maior que zero.");
        ValidarCusto(custoUnitario);
    }

    private static void ValidarCusto(decimal custoUnitario)
    {
        if (custoUnitario < 0)
            throw new DomainException("Custo unitário não pode ser negativo.");
    }

    private void RegistrarAlteracao(Guid atualizadoPor)
    {
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
```

- [ ] **Step 4: Rodar a suíte de entradas**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Entradas"`
Expected: PASS, incluindo os testes antigos (`EntradaMercadoriaBoletoTests`, `EntradaMercadoriaItemUtensilioTests` etc.). As mensagens antigas foram preservadas.

- [ ] **Step 5: Commit**

```bash
git add CasaDiAna/src/CasaDiAna.Domain/Entities CasaDiAna/tests/CasaDiAna.Application.Tests/Entradas/EntradaMercadoriaEdicaoTests.cs
git commit -m "feat(entradas): domínio permite editar cabeçalho, boletos e custo dos itens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Aplicação — regras compartilhadas, command e validator de edição

**Files:**
- Create: `src/CasaDiAna.Application/Entradas/Common/ICabecalhoEntrada.cs`
- Create: `src/CasaDiAna.Application/Entradas/Common/CabecalhoEntradaValidator.cs`
- Create: `src/CasaDiAna.Application/Entradas/Common/EntradaPermissao.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommand.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/RegistrarEntrada/RegistrarEntradaCommandValidator.cs`
- Modify: `src/CasaDiAna.Application/Entradas/Commands/CancelarEntrada/CancelarEntradaCommandHandler.cs:41-42`
- Create: `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/CustoItemInputDto.cs`
- Create: `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommand.cs`
- Create: `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommandValidator.cs`
- Test: `tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandValidatorTests.cs`

**Interfaces:**
- Consumes: nada do Task 1.
- Produces:
  - `interface ICabecalhoEntrada { Guid FornecedorId; DateTime DataEntrada; string RecebidoPor; string? NumeroNotaFiscal; }` (namespace `CasaDiAna.Application.Entradas.Common`)
  - `internal static class EntradaPermissao { static void GarantirPodeAlterar(EntradaMercadoria entrada, ICurrentUserService usuario) }`
  - `record CustoItemInputDto(Guid ItemId, decimal CustoUnitario)` (namespace `CasaDiAna.Application.Entradas.Commands.EditarEntrada`)
  - `record EditarEntradaCommand(Guid EntradaId, Guid FornecedorId, DateTime DataEntrada, string RecebidoPor, string? NumeroNotaFiscal = null, string? Observacoes = null, IReadOnlyList<DateTime>? DatasVencimentoBoleto = null, IReadOnlyList<CustoItemInputDto>? CustosItens = null, IReadOnlyList<CustoItemInputDto>? CustosItensUtensilio = null) : IRequest<EntradaMercadoriaDto>, ICabecalhoEntrada`

- [ ] **Step 1: Escrever os testes do validator (falham)**

Criar `tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandValidatorTests.cs`:

```csharp
using CasaDiAna.Application.Entradas.Commands.EditarEntrada;
using FluentAssertions;

namespace CasaDiAna.Application.Tests.Entradas;

public class EditarEntradaCommandValidatorTests
{
    private readonly EditarEntradaCommandValidator _sut = new();

    private static EditarEntradaCommand ComandoValido() => new(
        EntradaId: Guid.NewGuid(),
        FornecedorId: Guid.NewGuid(),
        DataEntrada: DateTime.UtcNow,
        RecebidoPor: "Ana",
        CustosItens: new[] { new CustoItemInputDto(Guid.NewGuid(), 10m) },
        CustosItensUtensilio: new[] { new CustoItemInputDto(Guid.NewGuid(), 0m) });

    [Fact]
    public void Deve_passar_quando_ComandoValido()
    {
        _sut.Validate(ComandoValido()).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_passar_quando_BoletoNoPassado_PoisRegraFicaNoDominio()
    {
        var comando = ComandoValido() with { DatasVencimentoBoleto = new[] { DateTime.UtcNow.AddDays(-30) } };

        _sut.Validate(comando).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Deve_falhar_quando_FornecedorVazio()
    {
        var resultado = _sut.Validate(ComandoValido() with { FornecedorId = Guid.Empty });

        resultado.Errors.Should().Contain(e => e.ErrorMessage == "Fornecedor é obrigatório.");
    }

    [Fact]
    public void Deve_falhar_quando_RecebidoPorVazio()
    {
        var resultado = _sut.Validate(ComandoValido() with { RecebidoPor = "" });

        resultado.Errors.Should().Contain(e => e.ErrorMessage == "Informe quem recebeu os produtos.");
    }

    [Fact]
    public void Deve_falhar_quando_NotaFiscalMaiorQue60()
    {
        var resultado = _sut.Validate(ComandoValido() with { NumeroNotaFiscal = new string('9', 61) });

        resultado.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Deve_falhar_quando_CustoNegativo()
    {
        var comando = ComandoValido() with { CustosItens = new[] { new CustoItemInputDto(Guid.NewGuid(), -0.01m) } };

        _sut.Validate(comando).Errors.Should()
            .Contain(e => e.ErrorMessage == "Custo unitário não pode ser negativo.");
    }

    [Fact]
    public void Deve_falhar_quando_ItemIdVazio()
    {
        var comando = ComandoValido() with { CustosItensUtensilio = new[] { new CustoItemInputDto(Guid.Empty, 1m) } };

        _sut.Validate(comando).Errors.Should().Contain(e => e.ErrorMessage == "Item é obrigatório.");
    }

    [Fact]
    public void Deve_falhar_quando_ItemRepetido()
    {
        var itemId = Guid.NewGuid();
        var comando = ComandoValido() with
        {
            CustosItens = new[] { new CustoItemInputDto(itemId, 1m), new CustoItemInputDto(itemId, 2m) }
        };

        _sut.Validate(comando).Errors.Should()
            .Contain(e => e.ErrorMessage == "Item repetido na lista de custos.");
    }
}
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~EditarEntradaCommandValidatorTests"`
Expected: falha de compilação (`EditarEntradaCommand` não existe).

- [ ] **Step 3: Criar as regras compartilhadas**

`src/CasaDiAna.Application/Entradas/Common/ICabecalhoEntrada.cs`:

```csharp
namespace CasaDiAna.Application.Entradas.Common;

/// <summary>Campos de cabeçalho comuns ao registro e à edição de entrada.</summary>
public interface ICabecalhoEntrada
{
    Guid FornecedorId { get; }
    DateTime DataEntrada { get; }
    string RecebidoPor { get; }
    string? NumeroNotaFiscal { get; }
}
```

`src/CasaDiAna.Application/Entradas/Common/CabecalhoEntradaValidator.cs`. É `internal` de propósito: `AddValidatorsFromAssembly` só registra tipos públicos, então ele não entra no pipeline sozinho, só via `Include`.

```csharp
using FluentValidation;

namespace CasaDiAna.Application.Entradas.Common;

internal sealed class CabecalhoEntradaValidator : AbstractValidator<ICabecalhoEntrada>
{
    public CabecalhoEntradaValidator()
    {
        RuleFor(x => x.FornecedorId)
            .NotEmpty().WithMessage("Fornecedor é obrigatório.");

        RuleFor(x => x.DataEntrada)
            .NotEmpty().WithMessage("Data de entrada é obrigatória.");

        RuleFor(x => x.NumeroNotaFiscal)
            .MaximumLength(60).When(x => x.NumeroNotaFiscal != null)
            .WithMessage("Número da nota fiscal deve ter no máximo 60 caracteres.");

        RuleFor(x => x.RecebidoPor)
            .NotEmpty().WithMessage("Informe quem recebeu os produtos.")
            .MaximumLength(100).WithMessage("Nome de quem recebeu deve ter no máximo 100 caracteres.");
    }
}
```

`src/CasaDiAna.Application/Entradas/Common/EntradaPermissao.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Entradas.Common;

internal static class EntradaPermissao
{
    /// <summary>Só quem registrou a entrada ou um Admin pode alterá-la (editar/cancelar).</summary>
    public static void GarantirPodeAlterar(EntradaMercadoria entrada, ICurrentUserService usuario)
    {
        if (entrada.CriadoPor != usuario.UsuarioId && usuario.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");
    }
}
```

- [ ] **Step 4: Aplicar as regras compartilhadas no registro e no cancelamento**

Em `RegistrarEntradaCommand.cs`, adicionar `using CasaDiAna.Application.Entradas.Common;` e trocar a última linha da declaração por:

```csharp
    IReadOnlyList<ItemEntradaUtensilioInputDto>? ItensUtensilio = null) : IRequest<EntradaMercadoriaDto>, ICabecalhoEntrada;
```

Em `RegistrarEntradaCommandValidator.cs`:
- adicionar `using CasaDiAna.Application.Entradas.Common;`;
- remover as regras de `FornecedorId`, `DataEntrada`, `NumeroNotaFiscal` e `RecebidoPor`;
- colocar como primeira linha do construtor:

```csharp
        Include(new CabecalhoEntradaValidator());
```

Ficam no validator de registro só a regra "pelo menos um item", os `RuleForEach` de itens e a regra de boleto.

Em `CancelarEntradaCommandHandler.cs`, adicionar `using CasaDiAna.Application.Entradas.Common;` e substituir:

```csharp
        if (entrada.CriadoPor != _currentUser.UsuarioId && _currentUser.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");
```

por:

```csharp
        EntradaPermissao.GarantirPodeAlterar(entrada, _currentUser);
```

- [ ] **Step 5: Criar o command e o validator de edição**

`src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/CustoItemInputDto.cs`:

```csharp
namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

public record CustoItemInputDto(Guid ItemId, decimal CustoUnitario);
```

`src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommand.cs`:

```csharp
using CasaDiAna.Application.Entradas.Common;
using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

/// <summary>
/// Edita cabeçalho, boletos e custo dos itens de uma entrada confirmada. Não altera estoque.
/// Itens ausentes de <see cref="CustosItens"/>/<see cref="CustosItensUtensilio"/> mantêm o custo.
/// </summary>
public record EditarEntradaCommand(
    Guid EntradaId,
    Guid FornecedorId,
    DateTime DataEntrada,
    string RecebidoPor,
    string? NumeroNotaFiscal = null,
    string? Observacoes = null,
    IReadOnlyList<DateTime>? DatasVencimentoBoleto = null,
    IReadOnlyList<CustoItemInputDto>? CustosItens = null,
    IReadOnlyList<CustoItemInputDto>? CustosItensUtensilio = null) : IRequest<EntradaMercadoriaDto>, ICabecalhoEntrada;
```

`src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommandValidator.cs`:

```csharp
using CasaDiAna.Application.Entradas.Common;
using FluentValidation;

namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

public class EditarEntradaCommandValidator : AbstractValidator<EditarEntradaCommand>
{
    public EditarEntradaCommandValidator()
    {
        Include(new CabecalhoEntradaValidator());

        // Vencimento de boleto não é validado aqui: boletos já existentes podem estar vencidos.
        // A regra "data nova deve ser hoje ou no futuro" fica em EntradaMercadoria.SubstituirBoletos.

        RuleForEach(x => x.CustosItens).SetValidator(new CustoItemInputValidator());
        RuleForEach(x => x.CustosItensUtensilio).SetValidator(new CustoItemInputValidator());

        RuleFor(x => x.CustosItens).Must(SemItensRepetidos)
            .WithMessage("Item repetido na lista de custos.");
        RuleFor(x => x.CustosItensUtensilio).Must(SemItensRepetidos)
            .WithMessage("Item repetido na lista de custos.");
    }

    private static bool SemItensRepetidos(IReadOnlyList<CustoItemInputDto>? custos) =>
        custos is null || custos.Select(c => c.ItemId).Distinct().Count() == custos.Count;

    private sealed class CustoItemInputValidator : AbstractValidator<CustoItemInputDto>
    {
        public CustoItemInputValidator()
        {
            RuleFor(c => c.ItemId)
                .NotEmpty().WithMessage("Item é obrigatório.");
            RuleFor(c => c.CustoUnitario)
                .GreaterThanOrEqualTo(0).WithMessage("Custo unitário não pode ser negativo.");
        }
    }
}
```

- [ ] **Step 6: Rodar os testes de entradas**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~Entradas"`
Expected: PASS. Os testes novos passam, e `RegistrarEntradaValidatorBoletoTests` e `CancelarEntradaCommandHandlerTests` continuam passando. `IValidator<in T>` é contravariante, então `Include(IValidator<ICabecalhoEntrada>)` compila para os dois commands.

- [ ] **Step 7: Commit**

```bash
git add CasaDiAna/src/CasaDiAna.Application/Entradas CasaDiAna/tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandValidatorTests.cs
git commit -m "feat(entradas): command e validator de edição com regras de cabeçalho compartilhadas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Handler de edição, repositório e endpoint `PUT`

**Files:**
- Modify: `src/CasaDiAna.Domain/Interfaces/IEntradaMercadoriaRepository.cs`
- Modify: `src/CasaDiAna.Infrastructure/Repositories/EntradaMercadoriaRepository.cs`
- Create: `src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommandHandler.cs`
- Modify: `src/CasaDiAna.API/Controllers/EntradasController.cs`
- Test: `tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandHandlerTests.cs`

**Interfaces:**
- Consumes:
  - do Task 1: `AtualizarCabecalho`, `SubstituirBoletos` → `AlteracaoBoletos`, `AlterarCustoItem`, `AlterarCustoItemUtensilio`;
  - do Task 2: `EditarEntradaCommand`, `CustoItemInputDto`, `EntradaPermissao.GarantirPodeAlterar`;
  - existente: `RegistrarEntradaCommandHandler.ToDto(EntradaMercadoria)`.
- Produces:
  - `Task<IReadOnlySet<Guid>> IEntradaMercadoriaRepository.ObterIngredientesComEntradaPosteriorAsync(EntradaMercadoria entrada, CancellationToken ct = default)`
  - `Task<IReadOnlySet<Guid>> IEntradaMercadoriaRepository.ObterUtensiliosComEntradaPosteriorAsync(EntradaMercadoria entrada, CancellationToken ct = default)`
  - `Task IEntradaMercadoriaRepository.AdicionarBoletosAsync(IEnumerable<BoletoEntrada> boletos, CancellationToken ct = default)`
  - `void IEntradaMercadoriaRepository.RemoverBoletos(IEnumerable<BoletoEntrada> boletos)`
  - HTTP `PUT /api/entradas/{id}`. Body em JSON camelCase: `fornecedorId`, `dataEntrada`, `recebidoPor`, `numeroNotaFiscal`, `observacoes`, `datasVencimentoBoleto: string[]`, `custosItens: {itemId, custoUnitario}[]`, `custosItensUtensilio: {itemId, custoUnitario}[]`. Retorna `ApiResponse<EntradaMercadoriaDto>`.

- [ ] **Step 1: Ampliar a interface do repositório**

Em `IEntradaMercadoriaRepository.cs`, adicionar antes de `SalvarAsync`:

```csharp
    /// <summary>
    /// Ingredientes da entrada que aparecem em outra entrada confirmada mais recente
    /// (maior DataEntrada; empate decidido pelo maior CriadoEm).
    /// </summary>
    Task<IReadOnlySet<Guid>> ObterIngredientesComEntradaPosteriorAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    /// <summary>Mesmo critério de <see cref="ObterIngredientesComEntradaPosteriorAsync"/>, para utensílios.</summary>
    Task<IReadOnlySet<Guid>> ObterUtensiliosComEntradaPosteriorAsync(EntradaMercadoria entrada, CancellationToken ct = default);
    Task AdicionarBoletosAsync(IEnumerable<BoletoEntrada> boletos, CancellationToken ct = default);
    void RemoverBoletos(IEnumerable<BoletoEntrada> boletos);
```

- [ ] **Step 2: Escrever os testes do handler (falham)**

Criar `tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandHandlerTests.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.EditarEntrada;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace CasaDiAna.Application.Tests.Entradas;

public class EditarEntradaCommandHandlerTests
{
    private readonly Mock<IEntradaMercadoriaRepository> _entradas = new();
    private readonly Mock<IFornecedorRepository> _fornecedores = new();
    private readonly Mock<IIngredienteRepository> _ingredientes = new();
    private readonly Mock<IUtensilioRepository> _utensilios = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly EditarEntradaCommandHandler _handler;

    private readonly Guid _usuarioId = Guid.NewGuid();
    private readonly Guid _fornecedorId = Guid.NewGuid();
    private readonly Guid _ingredienteId = Guid.NewGuid();
    private readonly Guid _utensilioId = Guid.NewGuid();
    private readonly Ingrediente _ingrediente;
    private readonly Utensilio _utensilio;

    public EditarEntradaCommandHandlerTests()
    {
        _currentUser.Setup(u => u.UsuarioId).Returns(_usuarioId);
        _currentUser.Setup(u => u.Papel).Returns("Compras");

        _ingrediente = Ingrediente.Criar("Farinha", 1, 0, _usuarioId);
        _ingrediente.AtualizarEstoque(10, _usuarioId);
        _ingrediente.AtualizarCusto(5m, _usuarioId);
        _utensilio = Utensilio.Criar("Detergente", 1, 0, _usuarioId);
        _utensilio.AtualizarEstoque(4, _usuarioId);
        _utensilio.AtualizarCusto(3m, _usuarioId);

        _ingredientes.Setup(r => r.ObterPorIdAsync(_ingredienteId, It.IsAny<CancellationToken>())).ReturnsAsync(_ingrediente);
        _utensilios.Setup(r => r.ObterPorIdAsync(_utensilioId, It.IsAny<CancellationToken>())).ReturnsAsync(_utensilio);
        _entradas.Setup(r => r.ObterIngredientesComEntradaPosteriorAsync(It.IsAny<EntradaMercadoria>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        _entradas.Setup(r => r.ObterUtensiliosComEntradaPosteriorAsync(It.IsAny<EntradaMercadoria>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        _entradas.Setup(r => r.SalvarAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _handler = new EditarEntradaCommandHandler(
            _entradas.Object, _fornecedores.Object, _ingredientes.Object, _utensilios.Object, _currentUser.Object);
    }

    private EntradaMercadoria EntradaSalva(Guid? criadoPor = null)
    {
        var entrada = EntradaMercadoria.Criar(_fornecedorId, DateTime.UtcNow.Date, criadoPor ?? _usuarioId, "NF-1", "Ana");
        entrada.AdicionarItem(_ingredienteId, 10m, 5m);
        entrada.AdicionarItemUtensilio(_utensilioId, 4m, 3m);
        _entradas.Setup(r => r.ObterPorIdComItensAsync(entrada.Id, It.IsAny<CancellationToken>())).ReturnsAsync(entrada);
        return entrada;
    }

    private EditarEntradaCommand Comando(EntradaMercadoria entrada) => new(
        EntradaId: entrada.Id,
        FornecedorId: entrada.FornecedorId,
        DataEntrada: entrada.DataEntrada,
        RecebidoPor: "Bia",
        NumeroNotaFiscal: "NF-2");

    [Fact]
    public async Task DeveEditarCabecalhoECustos_EPropagarCusto_QuandoEntradaMaisRecente()
    {
        var entrada = EntradaSalva();
        var comando = Comando(entrada) with
        {
            CustosItens = new[] { new CustoItemInputDto(entrada.Itens.Single().Id, 6m) },
            CustosItensUtensilio = new[] { new CustoItemInputDto(entrada.ItensUtensilio.Single().Id, 2m) },
        };

        var resultado = await _handler.Handle(comando, CancellationToken.None);

        resultado.RecebidoPor.Should().Be("Bia");
        resultado.NumeroNotaFiscal.Should().Be("NF-2");
        resultado.CustoTotal.Should().Be(10m * 6m + 4m * 2m);
        _ingrediente.CustoUnitario.Should().Be(6m);
        _utensilio.CustoUnitario.Should().Be(2m);
        _entradas.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NaoDevePropagarCusto_QuandoExisteEntradaPosterior()
    {
        var entrada = EntradaSalva();
        _entradas.Setup(r => r.ObterIngredientesComEntradaPosteriorAsync(entrada, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid> { _ingredienteId });
        var comando = Comando(entrada) with
        {
            CustosItens = new[] { new CustoItemInputDto(entrada.Itens.Single().Id, 9m) },
        };

        await _handler.Handle(comando, CancellationToken.None);

        _ingrediente.CustoUnitario.Should().Be(5m);
        _ingredientes.Verify(r => r.Atualizar(It.IsAny<Ingrediente>()), Times.Never);
    }

    [Fact]
    public async Task DeveSincronizarCustoDoCadastro_MesmoSemAlterarCusto_QuandoEntradaPassaASerMaisRecente()
    {
        var entrada = EntradaSalva();
        _ingrediente.AtualizarCusto(99m, _usuarioId);

        await _handler.Handle(Comando(entrada) with { DataEntrada = DateTime.UtcNow.Date.AddDays(1) }, CancellationToken.None);

        _ingrediente.CustoUnitario.Should().Be(5m);
    }

    [Fact]
    public async Task NaoDeveAlterarEstoque()
    {
        var entrada = EntradaSalva();
        var comando = Comando(entrada) with
        {
            CustosItens = new[] { new CustoItemInputDto(entrada.Itens.Single().Id, 6m) },
        };

        await _handler.Handle(comando, CancellationToken.None);

        _ingrediente.EstoqueAtual.Should().Be(10m);
        _utensilio.EstoqueAtual.Should().Be(4m);
    }

    [Fact]
    public async Task DeveRejeitar_UsuarioQueNaoEAutorNemAdmin()
    {
        var entrada = EntradaSalva(criadoPor: Guid.NewGuid());

        var acao = () => _handler.Handle(Comando(entrada), CancellationToken.None);

        await acao.Should().ThrowAsync<UnauthorizedAccessException>();
        _entradas.Verify(r => r.SalvarAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DevePermitir_AdminEditarEntradaDeOutroUsuario()
    {
        _currentUser.Setup(u => u.Papel).Returns("Admin");
        var entrada = EntradaSalva(criadoPor: Guid.NewGuid());

        var resultado = await _handler.Handle(Comando(entrada), CancellationToken.None);

        resultado.RecebidoPor.Should().Be("Bia");
    }

    [Fact]
    public async Task DeveLancar_QuandoEntradaNaoEncontrada()
    {
        var acao = () => _handler.Handle(
            new EditarEntradaCommand(Guid.NewGuid(), _fornecedorId, DateTime.UtcNow, "Ana"),
            CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Entrada não encontrada.");
    }

    [Fact]
    public async Task DeveRejeitar_TrocaParaFornecedorInativo()
    {
        var entrada = EntradaSalva();
        var inativo = Fornecedor.Criar("Fornecedor Inativo", _usuarioId);
        inativo.Desativar(_usuarioId);
        _fornecedores.Setup(r => r.ObterPorIdAsync(inativo.Id, It.IsAny<CancellationToken>())).ReturnsAsync(inativo);

        var acao = () => _handler.Handle(Comando(entrada) with { FornecedorId = inativo.Id }, CancellationToken.None);

        await acao.Should().ThrowAsync<DomainException>().WithMessage("Fornecedor está inativo.");
    }

    [Fact]
    public async Task NaoDeveValidarFornecedor_QuandoNaoMuda()
    {
        var entrada = EntradaSalva();

        await _handler.Handle(Comando(entrada), CancellationToken.None);

        _fornecedores.Verify(r => r.ObterPorIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeveManterBoletoVencido_EInserirApenasOsNovosPeloRepositorio()
    {
        var entrada = EntradaSalva();
        var vencido = DateTime.UtcNow.Date.AddDays(-3);
        entrada.AdicionarBoleto(vencido);
        var novo = DateTime.UtcNow.Date.AddDays(15);

        await _handler.Handle(
            Comando(entrada) with { DatasVencimentoBoleto = new[] { vencido, novo } },
            CancellationToken.None);

        _entradas.Verify(r => r.AdicionarBoletosAsync(
            It.Is<IEnumerable<BoletoEntrada>>(b => b.Single().DataVencimento == novo),
            It.IsAny<CancellationToken>()), Times.Once);
        _entradas.Verify(r => r.RemoverBoletos(
            It.Is<IEnumerable<BoletoEntrada>>(b => !b.Any())), Times.Once);
    }

    [Fact]
    public async Task DeveRemoverBoletos_QuandoListaVazia()
    {
        var entrada = EntradaSalva();
        entrada.AdicionarBoleto(DateTime.UtcNow.Date.AddDays(5));

        await _handler.Handle(Comando(entrada) with { DatasVencimentoBoleto = Array.Empty<DateTime>() }, CancellationToken.None);

        _entradas.Verify(r => r.RemoverBoletos(
            It.Is<IEnumerable<BoletoEntrada>>(b => b.Count() == 1)), Times.Once);
        entrada.Boletos.Should().BeEmpty();
    }
}
```

- [ ] **Step 3: Rodar e confirmar que falham**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~EditarEntradaCommandHandlerTests"`
Expected: falha de compilação (`EditarEntradaCommandHandler` não existe).

- [ ] **Step 4: Implementar o handler**

`src/CasaDiAna.Application/Entradas/Commands/EditarEntrada/EditarEntradaCommandHandler.cs`:

```csharp
using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Common;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

public class EditarEntradaCommandHandler : IRequestHandler<EditarEntradaCommand, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IFornecedorRepository _fornecedores;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUtensilioRepository _utensilios;
    private readonly ICurrentUserService _currentUser;

    public EditarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IFornecedorRepository fornecedores,
        IIngredienteRepository ingredientes,
        IUtensilioRepository utensilios,
        ICurrentUserService currentUser)
    {
        _entradas = entradas;
        _fornecedores = fornecedores;
        _ingredientes = ingredientes;
        _utensilios = utensilios;
        _currentUser = currentUser;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        EditarEntradaCommand request, CancellationToken cancellationToken)
    {
        var entrada = await _entradas.ObterPorIdComItensAsync(request.EntradaId, cancellationToken)
            ?? throw new DomainException("Entrada não encontrada.");

        EntradaPermissao.GarantirPodeAlterar(entrada, _currentUser);

        // Só valida quando muda: uma entrada de fornecedor desativado depois continua editável.
        if (request.FornecedorId != entrada.FornecedorId)
            await GarantirFornecedorAtivoAsync(request.FornecedorId, cancellationToken);

        var usuarioId = _currentUser.UsuarioId;

        entrada.AtualizarCabecalho(
            request.FornecedorId,
            request.DataEntrada,
            request.NumeroNotaFiscal,
            request.RecebidoPor,
            request.Observacoes,
            usuarioId);

        var boletos = entrada.SubstituirBoletos(
            request.DatasVencimentoBoleto ?? Array.Empty<DateTime>(), DateTime.UtcNow.Date, usuarioId);
        // Filhos de coleção readonly entram/saem pelo repositório (erro E1).
        _entradas.RemoverBoletos(boletos.Removidos);
        await _entradas.AdicionarBoletosAsync(boletos.Adicionados, cancellationToken);

        foreach (var custo in request.CustosItens ?? Array.Empty<CustoItemInputDto>())
            entrada.AlterarCustoItem(custo.ItemId, custo.CustoUnitario, usuarioId);

        foreach (var custo in request.CustosItensUtensilio ?? Array.Empty<CustoItemInputDto>())
            entrada.AlterarCustoItemUtensilio(custo.ItemId, custo.CustoUnitario, usuarioId);

        await SincronizarCustoIngredientesAsync(entrada, cancellationToken);
        await SincronizarCustoUtensiliosAsync(entrada, cancellationToken);

        await _entradas.SalvarAsync(cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return RegistrarEntradaCommandHandler.ToDto(salva!);
    }

    private async Task GarantirFornecedorAtivoAsync(Guid fornecedorId, CancellationToken ct)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(fornecedorId, ct)
            ?? throw new DomainException("Fornecedor não encontrado.");

        if (!fornecedor.Ativo)
            throw new DomainException("Fornecedor está inativo.");
    }

    /// <summary>
    /// O custo do cadastro é o da compra mais recente: só é sobrescrito pelos itens
    /// cujo ingrediente não aparece numa entrada confirmada posterior a esta.
    /// </summary>
    private async Task SincronizarCustoIngredientesAsync(EntradaMercadoria entrada, CancellationToken ct)
    {
        var comEntradaPosterior = await _entradas.ObterIngredientesComEntradaPosteriorAsync(entrada, ct);

        foreach (var item in entrada.Itens.Where(i => !comEntradaPosterior.Contains(i.IngredienteId)))
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, ct)
                ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

            ingrediente.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);
        }
    }

    private async Task SincronizarCustoUtensiliosAsync(EntradaMercadoria entrada, CancellationToken ct)
    {
        var comEntradaPosterior = await _entradas.ObterUtensiliosComEntradaPosteriorAsync(entrada, ct);

        foreach (var item in entrada.ItensUtensilio.Where(i => !comEntradaPosterior.Contains(i.UtensilioId)))
        {
            var utensilio = await _utensilios.ObterPorIdAsync(item.UtensilioId, ct)
                ?? throw new DomainException($"Utensílio '{item.UtensilioId}' não encontrado.");

            utensilio.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _utensilios.Atualizar(utensilio);
        }
    }
}
```

> Não chamar `_entradas.Atualizar(entrada)`: a entrada vem rastreada de `ObterPorIdComItensAsync`, e `Update` no grafo marcaria boletos novos com chave como `Modified` (E1).

- [ ] **Step 5: Rodar os testes do handler**

Run: `dotnet test tests/CasaDiAna.Application.Tests --filter "FullyQualifiedName~EditarEntradaCommandHandlerTests"`
Expected: PASS (11 testes).

- [ ] **Step 6: Implementar o repositório**

Em `EntradaMercadoriaRepository.cs`, adicionar antes de `SalvarAsync`:

```csharp
    public async Task<IReadOnlySet<Guid>> ObterIngredientesComEntradaPosteriorAsync(
        EntradaMercadoria entrada, CancellationToken ct = default)
    {
        var ids = entrada.Itens.Select(i => i.IngredienteId).ToList();
        if (ids.Count == 0)
            return new HashSet<Guid>();

        var encontrados = await EntradasConfirmadasPosteriores(entrada)
            .SelectMany(e => e.Itens)
            .Where(i => ids.Contains(i.IngredienteId))
            .Select(i => i.IngredienteId)
            .Distinct()
            .ToListAsync(ct);

        return encontrados.ToHashSet();
    }

    public async Task<IReadOnlySet<Guid>> ObterUtensiliosComEntradaPosteriorAsync(
        EntradaMercadoria entrada, CancellationToken ct = default)
    {
        var ids = entrada.ItensUtensilio.Select(i => i.UtensilioId).ToList();
        if (ids.Count == 0)
            return new HashSet<Guid>();

        var encontrados = await EntradasConfirmadasPosteriores(entrada)
            .SelectMany(e => e.ItensUtensilio)
            .Where(i => ids.Contains(i.UtensilioId))
            .Select(i => i.UtensilioId)
            .Distinct()
            .ToListAsync(ct);

        return encontrados.ToHashSet();
    }

    public async Task AdicionarBoletosAsync(IEnumerable<BoletoEntrada> boletos, CancellationToken ct = default) =>
        await _db.BoletosEntrada.AddRangeAsync(boletos, ct);

    public void RemoverBoletos(IEnumerable<BoletoEntrada> boletos) =>
        _db.BoletosEntrada.RemoveRange(boletos);

    // Usa os valores em memória da entrada (data possivelmente editada e ainda não salva).
    private IQueryable<EntradaMercadoria> EntradasConfirmadasPosteriores(EntradaMercadoria entrada)
    {
        var id = entrada.Id;
        var dataEntrada = entrada.DataEntrada;
        var criadoEm = entrada.CriadoEm;

        return _db.EntradasMercadoria.Where(e =>
            e.Id != id
            && e.Status == StatusEntrada.Confirmada
            && (e.DataEntrada > dataEntrada || (e.DataEntrada == dataEntrada && e.CriadoEm > criadoEm)));
    }
```

- [ ] **Step 7: Expor o endpoint**

Em `EntradasController.cs`, adicionar `using CasaDiAna.Application.Entradas.Commands.EditarEntrada;` e, depois de `Registrar`:

```csharp
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EntradaMercadoriaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Editar(
        Guid id, [FromBody] EditarEntradaCommand command, CancellationToken ct)
    {
        var resultado = await _mediator.Send(command with { EntradaId = id }, ct);
        return Ok(ApiResponse<EntradaMercadoriaDto>.Ok(resultado));
    }
```

- [ ] **Step 8: Build e suíte completa**

Run: `dotnet build src/CasaDiAna.API` e depois `dotnet test tests/CasaDiAna.Application.Tests`
Expected: build sem erros; todos os testes PASS.

- [ ] **Step 9: Commit**

```bash
git add CasaDiAna/src CasaDiAna/tests/CasaDiAna.Application.Tests/Entradas/EditarEntradaCommandHandlerTests.cs
git commit -m "feat(entradas): endpoint PUT edita entrada e propaga custo só da compra mais recente

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Frontend — primitivos compartilhados do formulário de entrada

Extrai do `EntradaFormPage` o que a edição vai reaproveitar. **O comportamento do registro não pode mudar.**

**Files:**
- Create: `frontend/src/lib/erros.ts`
- Create: `frontend/src/features/entradas/permissoes.ts`
- Create: `frontend/src/features/entradas/schemas/entradaSchemas.ts`
- Create: `frontend/src/features/entradas/components/SecaoBoletos.tsx`
- Create: `frontend/src/features/entradas/components/CamposCabecalhoEntrada.tsx`
- Modify: `frontend/src/types/estoque.ts` (bloco `EntradaFormValues`, ~linha 283)
- Modify: `frontend/src/features/entradas/pages/EntradaFormPage.tsx`
- Modify: `frontend/src/features/entradas/pages/EntradasPage.tsx:13,91`
- Modify: `frontend/src/features/entradas/pages/EntradaDetalhePage.tsx:11,33`

**Interfaces:**
- Produces:
  - `extrairMensagemErro(erro: unknown, padrao: string): string`
  - `PAPEIS_EDICAO_ENTRADA: string[]`
  - `entradaRegistroSchema`, `entradaEdicaoSchema` (Zod)
  - `<CamposCabecalhoEntrada fornecedores={Pick<Fornecedor,'id'|'razaoSocial'>[]} />`, que exige `FormProvider` de um form cujos valores estendem `CabecalhoEntradaValues`
  - tipos `CabecalhoEntradaValues`, `EntradaEdicaoFormValues`

- [ ] **Step 1: Tipos**

Em `types/estoque.ts`, substituir a interface `EntradaFormValues` por:

```ts
export interface CabecalhoEntradaValues {
  fornecedorId: string
  dataEntrada: string
  numeroNotaFiscal: string
  recebidoPor: string
  observacoes: string
  temBoleto: boolean
  boletos: { dataVencimento: string }[]
}

export type TipoItemEntrada = 'ingrediente' | 'utensilio'

export interface EntradaFormValues extends CabecalhoEntradaValues {
  itens: {
    tipo: TipoItemEntrada
    itemId: string
    quantidade: number | undefined
    custoUnitario: number | undefined
  }[]
}

export interface EntradaEdicaoFormValues extends CabecalhoEntradaValues {
  custos: {
    itemId: string
    tipo: TipoItemEntrada
    custoUnitario: number | undefined
  }[]
}

export interface CustoItemInput {
  itemId: string
  custoUnitario: number
}

export interface EditarEntradaInput {
  fornecedorId: string
  dataEntrada: string
  recebidoPor: string
  numeroNotaFiscal: string | null
  observacoes: string | null
  datasVencimentoBoleto: string[]
  custosItens: CustoItemInput[]
  custosItensUtensilio: CustoItemInput[]
}
```

- [ ] **Step 2: Utilitário de erro e permissões**

`lib/erros.ts`:

```ts
import { isAxiosError } from 'axios'

/** Primeira mensagem de `ApiResponse.erros` da resposta, ou `padrao`. */
export function extrairMensagemErro(erro: unknown, padrao: string): string {
  if (isAxiosError(erro)) {
    const mensagem = erro.response?.data?.erros?.[0]
    if (typeof mensagem === 'string' && mensagem.length > 0) return mensagem
  }
  return padrao
}
```

`features/entradas/permissoes.ts`:

```ts
export const PAPEIS_EDICAO_ENTRADA = ['Admin', 'Coordenador', 'Compras']
```

Em `EntradasPage.tsx` e `EntradaDetalhePage.tsx`, apagar a `const PAPEIS_EDICAO = [...]` local, importar `import { PAPEIS_EDICAO_ENTRADA } from '../permissoes'` e usar `temPapel(...PAPEIS_EDICAO_ENTRADA)`.

- [ ] **Step 3: Schemas**

`features/entradas/schemas/entradaSchemas.ts`:

```ts
import { z } from 'zod'

/** Campo numérico de input HTML: '' vira undefined antes de validar. */
const campoNumerico = <T extends z.ZodNumber>(schema: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), schema)

const custoUnitario = campoNumerico(z.number().min(0, 'Custo deve ser ≥ 0.'))
const tipoItem = z.enum(['ingrediente', 'utensilio'])

const cabecalhoEntradaShape = {
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  recebidoPor: z.string().min(1, 'Informe quem recebeu os produtos.').max(100),
  observacoes: z.string(),
  temBoleto: z.boolean().default(false),
  boletos: z.array(z.object({
    dataVencimento: z.string().min(1, 'Informe a data de vencimento.'),
  })).default([]),
}

const boletoObrigatorio = (d: { temBoleto: boolean; boletos: unknown[] }) =>
  !d.temBoleto || d.boletos.length > 0
const boletoObrigatorioErro = { message: 'Adicione pelo menos um boleto.', path: ['boletos'] }

export const entradaRegistroSchema = z.object({
  ...cabecalhoEntradaShape,
  itens: z.array(z.object({
    tipo: tipoItem,
    itemId: z.string().min(1, 'Selecione um item.'),
    quantidade: campoNumerico(z.number().positive('Quantidade deve ser maior que 0.')),
    custoUnitario,
  })).min(1, 'Adicione pelo menos um item.'),
}).refine(boletoObrigatorio, boletoObrigatorioErro)

export const entradaEdicaoSchema = z.object({
  ...cabecalhoEntradaShape,
  custos: z.array(z.object({
    itemId: z.string(),
    tipo: tipoItem,
    custoUnitario,
  })),
}).refine(boletoObrigatorio, boletoObrigatorioErro)
```

- [ ] **Step 4: `SecaoBoletos`**

Mover para `features/entradas/components/SecaoBoletos.tsx` o checkbox "Pagamento via boleto", a lista de boletos e o `handleToggleBoleto`, hoje no `EntradaFormPage`. O JSX é o mesmo de hoje:

```tsx
import { useFieldArray, useFormContext } from 'react-hook-form'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CampoTexto } from '@/components/form/CampoTexto'
import type { CabecalhoEntradaValues } from '@/types/estoque'

export function SecaoBoletos() {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<CabecalhoEntradaValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'boletos' })
  const temBoleto = watch('temBoleto')

  const alternarBoleto = (marcado: boolean) => {
    setValue('temBoleto', marcado)
    if (marcado && fields.length === 0) append({ dataVencimento: '' })
    if (!marcado) remove()
  }

  return (
    <>
      <div className="col-span-2">
        <label className="flex items-center gap-3 cursor-pointer select-none" htmlFor="temBoleto">
          <input
            id="temBoleto"
            type="checkbox"
            checked={temBoleto}
            onChange={e => alternarBoleto(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: '#C4870A' }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--ada-body)' }}>
            Pagamento via boleto
          </span>
        </label>
      </div>

      {temBoleto && (
        <div className="col-span-2 flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex-1">
                <CampoTexto
                  label={`Vencimento do boleto ${index + 1}`}
                  obrigatorio
                  type="date"
                  {...register(`boletos.${index}.dataVencimento`)}
                  erro={errors.boletos?.[index]?.dataVencimento?.message}
                />
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-0.5 p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--ada-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
                  title="Remover boleto"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {errors.boletos?.message && (
            <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
              {errors.boletos.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => append({ dataVencimento: '' })}
            className="flex items-center gap-1.5 text-xs font-semibold self-start transition-colors"
            style={{ color: '#C4870A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B87D0A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar outro boleto
          </button>
        </div>
      )}
    </>
  )
}
```

> `remove()` sem índice remove todos, e substitui o loop reverso que existia na página.

- [ ] **Step 5: `CamposCabecalhoEntrada`**

`features/entradas/components/CamposCabecalhoEntrada.tsx`:

```tsx
import { useFormContext } from 'react-hook-form'
import { CampoTexto } from '@/components/form/CampoTexto'
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
import type { CabecalhoEntradaValues, Fornecedor } from '@/types/estoque'
import { SecaoBoletos } from './SecaoBoletos'

interface Props {
  fornecedores: Pick<Fornecedor, 'id' | 'razaoSocial'>[]
}

/** Campos de cabeçalho de entrada (registro e edição). Exige um FormProvider. */
export function CamposCabecalhoEntrada({ fornecedores }: Props) {
  const { control, register, formState: { errors } } = useFormContext<CabecalhoEntradaValues>()

  return (
    <div className="grid grid-cols-2 gap-4">
      <ComboboxCampo
        control={control}
        name="fornecedorId"
        label="Fornecedor"
        obrigatorio
        placeholder="Buscar fornecedor…"
        opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
        erro={errors.fornecedorId?.message}
      />
      <CampoTexto
        label="Data da Entrada"
        obrigatorio
        type="date"
        {...register('dataEntrada')}
        erro={errors.dataEntrada?.message}
      />
      <CampoTexto
        label="Nota Fiscal"
        placeholder="Número da NF (opcional)"
        {...register('numeroNotaFiscal')}
      />
      <CampoTexto
        label="Recebido por"
        obrigatorio
        placeholder="Nome do funcionário que recebeu"
        {...register('recebidoPor')}
        erro={errors.recebidoPor?.message}
      />
      <CampoTexto
        label="Observações"
        placeholder="Observações (opcional)"
        {...register('observacoes')}
      />
      <SecaoBoletos />
    </div>
  )
}
```

- [ ] **Step 6: Refatorar `EntradaFormPage`**

No `EntradaFormPage.tsx`:
1. Apagar `boletoSchema` e `entradaSchema` locais e importar `import { entradaRegistroSchema } from '../schemas/entradaSchemas'`. Usar `zodResolver(entradaRegistroSchema) as any`.
2. Trocar a desestruturação de `useForm` por `const form = useForm<EntradaFormValues>({ ...mesmas opções })` seguido de `const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = form`.
3. Apagar `temBoleto`, o `useFieldArray` de `boletos` e `handleToggleBoleto`.
4. Envolver o `<form>` com `<FormProvider {...form}>` (importar `FormProvider` de `react-hook-form`).
5. Substituir todo o `<div className="grid grid-cols-2 gap-4">…</div>` que fica entre `<FormSection titulo="Dados da Entrada" />` e `<FormSection titulo="Itens da Entrada" />` por `<CamposCabecalhoEntrada fornecedores={fornecedores} />`.
6. Remover imports que ficarem sem uso. O `PlusIcon`/`TrashIcon` continuam em uso pelos itens.
7. O `onSubmit` não muda.

- [ ] **Step 7: Verificar**

Run (em `CasaDiAna/frontend`): `npx tsc -b --noEmit` e `npm run lint`
Expected: sem erros.

Teste manual rápido (`npm run dev` com a API rodando): em `/entradas/nova`, marcar e desmarcar boleto, adicionar 2 boletos, remover 1 e registrar uma entrada com boleto. O comportamento deve ser idêntico ao anterior.

- [ ] **Step 8: Commit**

```bash
git add CasaDiAna/frontend/src
git commit -m "refactor(entradas): extrai campos de cabeçalho, boletos e schemas do form de entrada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Frontend — serviço e lógica pura da edição

**Files:**
- Modify: `frontend/src/features/entradas/services/entradasService.ts`
- Create: `frontend/src/features/entradas/utils/edicaoEntrada.ts`
- Create: `frontend/src/features/entradas/hooks/useEntradaEdicao.ts`

**Interfaces:**
- Consumes: tipos do Task 4, `PUT /api/entradas/{id}` do Task 3.
- Produces:
  - `entradasService.editar(id: string, input: EditarEntradaInput): Promise<EntradaMercadoria>`
  - `valoresIniciaisEdicao(entrada: EntradaMercadoria): EntradaEdicaoFormValues`
  - `montarEdicaoInput(valores: EntradaEdicaoFormValues, entrada: EntradaMercadoria): EditarEntradaInput`
  - `itensDaEntrada(entrada: EntradaMercadoria): ItemEdicao[]`, com `ItemEdicao = { itemId, tipo, nome, unidadeMedidaCodigo, quantidade, custoUnitario }`
  - `opcoesFornecedorEdicao(fornecedores: Fornecedor[], entrada: EntradaMercadoria): Pick<Fornecedor,'id'|'razaoSocial'>[]`
  - `useEntradaEdicao(id?: string): { entrada: EntradaMercadoria | null; fornecedores: Pick<Fornecedor,'id'|'razaoSocial'>[]; loading: boolean; erro: string | null }`

- [ ] **Step 1: Serviço**

Em `entradasService.ts`, adicionar `EditarEntradaInput` ao import de tipos e, depois de `registrar`:

```ts
  editar: async (id: string, input: EditarEntradaInput): Promise<EntradaMercadoria> => {
    const resp = await api.put<ApiResponse<EntradaMercadoria>>(`/entradas/${id}`, input)
    return resp.data.dados
  },
```

- [ ] **Step 2: Funções puras**

`features/entradas/utils/edicaoEntrada.ts`:

```ts
import type {
  CustoItemInput,
  EditarEntradaInput,
  EntradaEdicaoFormValues,
  EntradaMercadoria,
  Fornecedor,
  TipoItemEntrada,
} from '@/types/estoque'

export interface ItemEdicao {
  itemId: string
  tipo: TipoItemEntrada
  nome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoUnitario: number
}

/** Data ISO do backend ("2026-10-13T00:00:00") → valor de <input type="date">. */
const paraInputData = (iso: string) => iso.slice(0, 10)

/** Itens de ingrediente e utensílio numa lista única, na ordem exibida no formulário. */
export function itensDaEntrada(entrada: EntradaMercadoria): ItemEdicao[] {
  return [
    ...entrada.itens.map(i => ({
      itemId: i.id, tipo: 'ingrediente' as const, nome: i.ingredienteNome,
      unidadeMedidaCodigo: i.unidadeMedidaCodigo, quantidade: i.quantidade, custoUnitario: i.custoUnitario,
    })),
    ...entrada.itensUtensilio.map(i => ({
      itemId: i.id, tipo: 'utensilio' as const, nome: i.utensilioNome,
      unidadeMedidaCodigo: i.unidadeMedidaCodigo, quantidade: i.quantidade, custoUnitario: i.custoUnitario,
    })),
  ]
}

export function valoresIniciaisEdicao(entrada: EntradaMercadoria): EntradaEdicaoFormValues {
  return {
    fornecedorId: entrada.fornecedorId,
    dataEntrada: paraInputData(entrada.dataEntrada),
    numeroNotaFiscal: entrada.numeroNotaFiscal ?? '',
    recebidoPor: entrada.recebidoPor ?? '',
    observacoes: entrada.observacoes ?? '',
    temBoleto: entrada.boletos.length > 0,
    boletos: entrada.boletos.map(b => ({ dataVencimento: paraInputData(b.dataVencimento) })),
    custos: itensDaEntrada(entrada).map(i => ({ itemId: i.itemId, tipo: i.tipo, custoUnitario: i.custoUnitario })),
  }
}

/** Monta o payload do PUT enviando só os custos que mudaram. */
export function montarEdicaoInput(valores: EntradaEdicaoFormValues, entrada: EntradaMercadoria): EditarEntradaInput {
  const custoOriginal = new Map(itensDaEntrada(entrada).map(i => [i.itemId, i.custoUnitario]))
  const alterados = (tipo: TipoItemEntrada): CustoItemInput[] =>
    valores.custos
      .filter(c => c.tipo === tipo && c.custoUnitario !== custoOriginal.get(c.itemId))
      .map(c => ({ itemId: c.itemId, custoUnitario: c.custoUnitario! }))

  return {
    fornecedorId: valores.fornecedorId,
    dataEntrada: valores.dataEntrada,
    recebidoPor: valores.recebidoPor,
    numeroNotaFiscal: valores.numeroNotaFiscal || null,
    observacoes: valores.observacoes || null,
    datasVencimentoBoleto: valores.temBoleto ? valores.boletos.map(b => b.dataVencimento) : [],
    custosItens: alterados('ingrediente'),
    custosItensUtensilio: alterados('utensilio'),
  }
}

/** Garante que o fornecedor atual apareça no combobox mesmo se tiver sido desativado. */
export function opcoesFornecedorEdicao(
  fornecedores: Fornecedor[],
  entrada: EntradaMercadoria,
): Pick<Fornecedor, 'id' | 'razaoSocial'>[] {
  if (fornecedores.some(f => f.id === entrada.fornecedorId)) return fornecedores
  return [{ id: entrada.fornecedorId, razaoSocial: entrada.fornecedorNome }, ...fornecedores]
}
```

- [ ] **Step 3: Hook de carregamento**

`features/entradas/hooks/useEntradaEdicao.ts`:

```ts
import { useEffect, useState } from 'react'
import { entradasService } from '../services/entradasService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { opcoesFornecedorEdicao } from '../utils/edicaoEntrada'
import type { EntradaMercadoria, Fornecedor } from '@/types/estoque'

export function useEntradaEdicao(id?: string) {
  const [entrada, setEntrada] = useState<EntradaMercadoria | null>(null)
  const [fornecedores, setFornecedores] = useState<Pick<Fornecedor, 'id' | 'razaoSocial'>[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([entradasService.obterPorId(id), fornecedoresService.listar()])
      .then(([dados, listaFornecedores]) => {
        setEntrada(dados)
        setFornecedores(opcoesFornecedorEdicao(listaFornecedores, dados))
      })
      .catch(() => setErro('Erro ao carregar entrada.'))
      .finally(() => setLoading(false))
  }, [id])

  return { entrada, fornecedores, loading, erro }
}
```

> Antes de escrever, conferir o tipo de retorno de `fornecedoresService.listar()`. Se não for `Fornecedor[]`, ajustar o parâmetro de `opcoesFornecedorEdicao` para o tipo real (ele precisa de `id` e `razaoSocial`).

- [ ] **Step 4: Verificar**

Run: `npx tsc -b --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add CasaDiAna/frontend/src
git commit -m "feat(entradas): serviço, hook e funções puras da edição de entrada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Frontend — tela de edição, rota e botão no detalhe

**Files:**
- Create: `frontend/src/features/entradas/components/TabelaCustosEdicao.tsx`
- Create: `frontend/src/features/entradas/components/FormularioEdicaoEntrada.tsx`
- Create: `frontend/src/features/entradas/pages/EntradaEdicaoPage.tsx`
- Modify: `frontend/src/routes/AppRoutes.tsx:16,78`
- Modify: `frontend/src/features/entradas/pages/EntradaDetalhePage.tsx`

**Interfaces:**
- Consumes: tudo do Task 4 e do Task 5.
- Produces: rota `/entradas/:id/editar`. Navegação de volta com `state: { mensagem: string }`, lida pelo detalhe.

- [ ] **Step 1: `TabelaCustosEdicao`**

```tsx
import { useFormContext, useWatch } from 'react-hook-form'
import { CampoTexto } from '@/components/form/CampoTexto'
import type { EntradaEdicaoFormValues } from '@/types/estoque'
import type { ItemEdicao } from '../utils/edicaoEntrada'

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const cabecalho = 'text-[11px] font-semibold uppercase tracking-wide'
const grade = 'grid grid-cols-[1fr_110px_130px] gap-2'

interface Props {
  itens: ItemEdicao[]
}

/** Itens com nome e quantidade travados; só o custo unitário é editável. */
export function TabelaCustosEdicao({ itens }: Props) {
  const { register, control, formState: { errors } } = useFormContext<EntradaEdicaoFormValues>()
  const custos = useWatch({ control, name: 'custos' })

  const totalAntes = itens.reduce((soma, i) => soma + i.quantidade * i.custoUnitario, 0)
  const totalDepois = itens.reduce((soma, i, idx) => soma + i.quantidade * (Number(custos?.[idx]?.custoUnitario) || 0), 0)

  return (
    <div className="overflow-x-auto">
      <div className={`${grade} px-1 mb-1.5`} style={{ color: 'var(--ada-muted)' }}>
        <span className={cabecalho}>Item</span>
        <span className={cabecalho}>Quantidade</span>
        <span className={cabecalho}>Custo Unit. (R$)</span>
      </div>
      <div className="space-y-2">
        {itens.map((item, index) => (
          <div key={item.itemId} className={`${grade} items-center`}>
            <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{item.nome}</span>
            <span className="text-sm font-mono" style={{ color: 'var(--ada-muted)' }}>
              {item.quantidade} {item.unidadeMedidaCodigo}
            </span>
            <CampoTexto
              label=" "
              type="number"
              step="0.01"
              min="0"
              {...register(`custos.${index}.custoUnitario`)}
              erro={errors.custos?.[index]?.custoUnitario?.message}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-right" style={{ color: 'var(--ada-body)' }}>
        Total: {totalAntes === totalDepois
          ? <strong>{moeda(totalDepois)}</strong>
          : <>{moeda(totalAntes)} → <strong>{moeda(totalDepois)}</strong></>}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--ada-muted)' }}>
        Para corrigir quantidade ou itens, cancele a entrada e registre de novo.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: `FormularioEdicaoEntrada`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { FormSection } from '@/components/form/FormSection'
import { Toast } from '@/components/ui/Toast'
import { extrairMensagemErro } from '@/lib/erros'
import type { EntradaEdicaoFormValues, EntradaMercadoria, Fornecedor } from '@/types/estoque'
import { entradasService } from '../services/entradasService'
import { entradaEdicaoSchema } from '../schemas/entradaSchemas'
import { itensDaEntrada, montarEdicaoInput, valoresIniciaisEdicao } from '../utils/edicaoEntrada'
import { CamposCabecalhoEntrada } from './CamposCabecalhoEntrada'
import { TabelaCustosEdicao } from './TabelaCustosEdicao'

interface Props {
  entrada: EntradaMercadoria
  fornecedores: Pick<Fornecedor, 'id' | 'razaoSocial'>[]
}

export function FormularioEdicaoEntrada({ entrada, fornecedores }: Props) {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const voltarParaDetalhe = (mensagem?: string) =>
    navigate(`/entradas/${entrada.id}`, mensagem ? { state: { mensagem } } : undefined)

  const form = useForm<EntradaEdicaoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(entradaEdicaoSchema) as any,
    defaultValues: valoresIniciaisEdicao(entrada),
  })

  const onSubmit = async (valores: EntradaEdicaoFormValues) => {
    try {
      await entradasService.editar(entrada.id, montarEdicaoInput(valores, entrada))
      voltarParaDetalhe('Entrada atualizada com sucesso.')
    } catch (e) {
      setErro(extrairMensagemErro(e, 'Erro ao salvar alterações.'))
    }
  }

  return (
    <FormProvider {...form}>
      {erro && <Toast tipo="erro" mensagem={erro} onFechar={() => setErro(null)} />}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={form.handleSubmit(onSubmit as any)}>
        <FormCard>
          <FormSection titulo="Dados da Entrada" />
          <CamposCabecalhoEntrada fornecedores={fornecedores} />
          <FormSection titulo="Custos dos Itens" />
          <TabelaCustosEdicao itens={itensDaEntrada(entrada)} />
          <FormActions
            salvando={form.formState.isSubmitting}
            labelSalvar="Salvar alterações"
            onCancelar={() => voltarParaDetalhe()}
          />
        </FormCard>
      </form>
    </FormProvider>
  )
}
```

> Se o lint do projeto não exigir o `eslint-disable` para `as any` em `handleSubmit` (o `EntradaFormPage` não usa), remover a linha de comentário para seguir o mesmo padrão.

- [ ] **Step 3: `EntradaEdicaoPage`**

```tsx
import { Link, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useEntradaEdicao } from '../hooks/useEntradaEdicao'
import { FormularioEdicaoEntrada } from '../components/FormularioEdicaoEntrada'
import type { EntradaMercadoria } from '@/types/estoque'

function motivoBloqueio(entrada: EntradaMercadoria | null, erro: string | null): string | null {
  if (erro) return erro
  if (!entrada) return 'Entrada não encontrada.'
  if (entrada.status !== 'Confirmada') return 'Entradas canceladas não podem ser editadas.'
  return null
}

export function EntradaEdicaoPage() {
  const { id } = useParams<{ id: string }>()
  const { entrada, fornecedores, loading, erro } = useEntradaEdicao(id)
  const mensagemBloqueio = motivoBloqueio(entrada, erro)

  return (
    <div className="ada-page max-w-3xl">
      <Link to={id ? `/entradas/${id}` : '/entradas'} className="back-link">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Voltar para a entrada
      </Link>
      <PageHeader titulo="Editar Entrada" />
      {loading ? (
        <LoadingState mensagem="Carregando entrada…" />
      ) : mensagemBloqueio || !entrada ? (
        <div className="state-error" role="alert">{mensagemBloqueio}</div>
      ) : (
        <FormularioEdicaoEntrada entrada={entrada} fornecedores={fornecedores} />
      )}
    </div>
  )
}
```

> Antes de escrever, ler `components/ui/PageHeader.tsx` e usar as props reais (o nome pode ser `titulo` ou `title`; pode aceitar `subtitulo`). Se a prop tiver outro nome, ajustar só essa linha.

- [ ] **Step 4: Rota**

Em `AppRoutes.tsx`, importar `import { EntradaEdicaoPage } from '@/features/entradas/pages/EntradaEdicaoPage'` e adicionar **antes** de `<Route path="/entradas/:id" …>`:

```tsx
          <Route path="/entradas/:id/editar" element={<EntradaEdicaoPage />} />
```

Usar a mesma proteção de papel aplicada a `/entradas/nova`. Se `/entradas/nova` estiver dentro de um wrapper de papéis, colocar a nova rota no mesmo wrapper.

- [ ] **Step 5: Botão Editar e toast no detalhe**

Em `EntradaDetalhePage.tsx`:
1. Renomear `podeCancelar` para `podeAlterar` (e o uso).
2. Importar `Link` e `useLocation` de `react-router-dom` e `PencilSquareIcon` de `@heroicons/react/24/outline`.
3. Inicializar o toast com a mensagem vinda da edição e limpar o state da navegação, para o toast não reaparecer no F5:

```tsx
  const location = useLocation()
  const mensagemNavegacao = (location.state as { mensagem?: string } | null)?.mensagem
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(
    mensagemNavegacao ? { tipo: 'sucesso', mensagem: mensagemNavegacao } : null
  )

  useEffect(() => {
    if (mensagemNavegacao) navigate(location.pathname, { replace: true, state: null })
  }, [mensagemNavegacao, navigate, location.pathname])
```

(substitui o `useState` de `toast` atual).

4. Confirmar que o `<Toast …/>` é renderizado no retorno principal. Se só existir em outro ponto, colocar no topo do `<div className="ada-page max-w-3xl">`, como no `EntradaFormPage`.
5. Dentro de `{podeAlterar && entrada.status === 'Confirmada' && (…)}`, envolver os botões num fragment e colocar antes de "Cancelar Entrada":

```tsx
            <Link to={`/entradas/${entrada.id}/editar`} className="btn-secondary flex items-center gap-2">
              <PencilSquareIcon className="h-4 w-4" />
              Editar
            </Link>
```

- [ ] **Step 6: Verificar**

Run: `npx tsc -b --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add CasaDiAna/frontend/src
git commit -m "feat(entradas): tela de edição de entrada com custos editáveis e botão no detalhe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Verificação ponta a ponta e BrainOS

**Files:**
- Modify: `docs/brain/04_MODULOS/MOD_ENTRADAS.md` (raiz do repositório, `ProjetoGestao/`)
- Modify: `docs/brain/08_TASK_LOG/TASK_LOG.md`
- Modify: `docs/brain/09_OPEN_LOOPS/OPEN_LOOPS.md`

- [ ] **Step 1: Suítes**

Run (em `CasaDiAna/`): `dotnet build src/CasaDiAna.API` e `dotnet test tests/CasaDiAna.Application.Tests`
Run (em `CasaDiAna/frontend`): `npx tsc -b --noEmit` e `npm run lint`
Expected: tudo verde.

- [ ] **Step 2: Roteiro manual (API na 5130 + front na 5173)**

1. Registrar a entrada A (Farinha, 10 un, R$ 5,00), com data de hoje e um boleto.
2. No detalhe de A, clicar em Editar. O formulário deve vir preenchido, com o boleto listado.
3. Mudar o custo para R$ 6,00. O total deve mostrar "R$ 50,00 → R$ 60,00". Salvar: volta ao detalhe com o toast, e o cadastro da Farinha mostra custo R$ 6,00.
4. Registrar a entrada B (Farinha, R$ 8,00), também com data de hoje. Editar A para R$ 7,00. O cadastro da Farinha **continua** R$ 8,00, porque B foi criada depois (desempate por `CriadoEm`).
5. Editar A sem mudar nada e salvar. Não deve dar erro, e o estoque da Farinha não muda.
6. Em A, desmarcar boleto e salvar. O detalhe fica sem boletos.
7. Cancelar A e abrir `/entradas/{A}/editar`. Deve aparecer "Entradas canceladas não podem ser editadas.", e o botão Editar some do detalhe.
8. Desativar o fornecedor de B e editar a NF de B. Salva normalmente, e o combobox mostra o fornecedor.
9. Conferir que `/entradas/nova` continua funcionando, inclusive os boletos.

- [ ] **Step 3: BrainOS (rotina pós-task)**

- `MOD_ENTRADAS.md`: em "Status detectado", acrescentar "edição de cabeçalho, boletos e custo dos itens (2026-10-13)". Em "Pontos de atenção", acrescentar: "Edição não mexe em estoque; custo do cadastro só é sobrescrito se a entrada editada for a compra confirmada mais recente do item (DataEntrada, desempate CriadoEm)". Atualizar `ultima_atualizacao`.
- `TASK_LOG.md`: entrada no topo, com a data de 2026-10-13 e o resumo.
- `OPEN_LOOPS.md`: registrar a pendência "Regra autor/Admin lança `UnauthorizedAccessException` → 401 → interceptor do axios faz logout. Afeta cancelar/editar entrada e inventários quando o usuário tem o papel mas não é o autor. Proposta: exceção de acesso negado mapeada para 403 sem logout."

- [ ] **Step 4: Commit e push**

```bash
git add docs/brain
git commit -m "docs(brain): registra edição de entradas e pendência do 401 em regra de autor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin master
```
