using CasaDiAna.Application.Common;
using CasaDiAna.Application.Estoque.Services;
using CasaDiAna.Application.VendasDiarias.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.VendasDiarias.Commands.RegistrarVenda;

public class RegistrarVendaCommandHandler : IRequestHandler<RegistrarVendaCommand, VendaDiariaDto>
{
    private readonly IVendaDiariaRepository _vendas;
    private readonly IProdutoRepository _produtos;
    private readonly BaixaFichaTecnicaService _baixaFicha;
    private readonly ICurrentUserService _currentUser;

    public RegistrarVendaCommandHandler(
        IVendaDiariaRepository vendas,
        IProdutoRepository produtos,
        BaixaFichaTecnicaService baixaFicha,
        ICurrentUserService currentUser)
    {
        _vendas = vendas;
        _produtos = produtos;
        _baixaFicha = baixaFicha;
        _currentUser = currentUser;
    }

    public async Task<VendaDiariaDto> Handle(
        RegistrarVendaCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdComFichaAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        if (!produto.Ativo)
            throw new DomainException("Produto está inativo.");

        var venda = Domain.Entities.VendaDiaria.Criar(
            request.ProdutoId,
            request.Data,
            request.QuantidadeVendida,
            _currentUser.UsuarioId);

        // Venda e baixa de insumos (quando o produto é feito na hora) num único SaveChanges.
        await _baixaFicha.BaixarVendaAsync(produto, venda, cancellationToken);
        await _vendas.AdicionarAsync(venda, cancellationToken);
        await _vendas.SalvarAsync(cancellationToken);
        await _baixaFicha.NotificarEstoqueBaixoAsync(cancellationToken);

        return ToDto(venda, produto.Nome);
    }

    internal static VendaDiariaDto ToDto(Domain.Entities.VendaDiaria v, string produtoNome) =>
        new(v.Id, v.ProdutoId, produtoNome, v.Data, v.QuantidadeVendida, v.CustoTotal, v.CriadoEm);
}
