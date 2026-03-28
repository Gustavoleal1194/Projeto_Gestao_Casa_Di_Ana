using CasaDiAna.Application.Common;
using CasaDiAna.Application.Perdas.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Perdas.Commands.RegistrarPerda;

public class RegistrarPerdaCommandHandler : IRequestHandler<RegistrarPerdaCommand, PerdaProdutoDto>
{
    private readonly IPerdaProdutoRepository _perdas;
    private readonly IProdutoRepository _produtos;
    private readonly ICurrentUserService _currentUser;

    public RegistrarPerdaCommandHandler(
        IPerdaProdutoRepository perdas,
        IProdutoRepository produtos,
        ICurrentUserService currentUser)
    {
        _perdas = perdas;
        _produtos = produtos;
        _currentUser = currentUser;
    }

    public async Task<PerdaProdutoDto> Handle(
        RegistrarPerdaCommand request, CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        if (!produto.Ativo)
            throw new DomainException("Produto está inativo.");

        var perda = Domain.Entities.PerdaProduto.Criar(
            request.ProdutoId,
            request.Data,
            request.Quantidade,
            request.Justificativa,
            _currentUser.UsuarioId);

        await _perdas.AdicionarAsync(perda, cancellationToken);
        await _perdas.SalvarAsync(cancellationToken);

        return ToDto(perda, produto.Nome);
    }

    internal static PerdaProdutoDto ToDto(Domain.Entities.PerdaProduto p, string produtoNome) =>
        new(p.Id, p.ProdutoId, produtoNome, p.Data, p.Quantidade, p.Justificativa, p.CriadoEm);
}
