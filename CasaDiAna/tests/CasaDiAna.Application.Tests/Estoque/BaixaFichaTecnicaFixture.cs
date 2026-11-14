using CasaDiAna.Application.Common;
using CasaDiAna.Application.Estoque.Services;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Interfaces;
using Moq;

namespace CasaDiAna.Application.Tests.Estoque;

/// <summary>
/// Monta o <see cref="BaixaFichaTecnicaService"/> real sobre repositórios em memória,
/// para testar handlers pelo comportamento (estoque, movimentações, custo).
/// </summary>
public sealed class BaixaFichaTecnicaFixture
{
    public Guid UsuarioId { get; } = Guid.NewGuid();
    public Mock<IIngredienteRepository> Ingredientes { get; } = new();
    public Mock<IMovimentacaoRepository> Movimentacoes { get; } = new();
    public Mock<INotificacaoEstoqueService> Notificacoes { get; } = new();
    public Mock<ICurrentUserService> Usuario { get; } = new();
    public List<Movimentacao> MovimentacoesGravadas { get; } = new();

    private readonly Dictionary<Guid, Ingrediente> _ingredientes = new();

    public BaixaFichaTecnicaFixture()
    {
        Usuario.Setup(u => u.UsuarioId).Returns(UsuarioId);
        Ingredientes.Setup(r => r.ObterPorIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => _ingredientes.GetValueOrDefault(id));
        Movimentacoes.Setup(r => r.AdicionarAsync(It.IsAny<Movimentacao>(), It.IsAny<CancellationToken>()))
            .Callback<Movimentacao, CancellationToken>((m, _) => MovimentacoesGravadas.Add(m))
            .Returns(Task.CompletedTask);
    }

    public BaixaFichaTecnicaService Servico() =>
        new(Ingredientes.Object, Movimentacoes.Object, Notificacoes.Object, Usuario.Object);

    public Ingrediente Ingrediente(string nome, decimal estoque, decimal custoUnitario)
    {
        var ingrediente = Domain.Entities.Ingrediente.Criar(nome, 1, 0, UsuarioId);
        ingrediente.AtualizarEstoque(estoque, UsuarioId);
        ingrediente.AtualizarCusto(custoUnitario, UsuarioId);
        _ingredientes[ingrediente.Id] = ingrediente;
        return ingrediente;
    }

    public Produto Produto(string nome, TipoProduto tipo, params (Ingrediente Ingrediente, decimal Quantidade)[] ficha)
    {
        var produto = Domain.Entities.Produto.Criar(nome, 10m, UsuarioId, tipo: tipo);
        if (ficha.Length > 0)
            produto.DefinirFichaTecnica(ficha.Select(f => (f.Ingrediente.Id, f.Quantidade)));
        return produto;
    }
}
