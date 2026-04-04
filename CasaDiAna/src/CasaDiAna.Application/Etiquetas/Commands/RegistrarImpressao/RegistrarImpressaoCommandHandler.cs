using CasaDiAna.Application.Common;
using CasaDiAna.Application.Etiquetas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Etiquetas.Commands.RegistrarImpressao;

public class RegistrarImpressaoCommandHandler
    : IRequestHandler<RegistrarImpressaoCommand, HistoricoImpressaoDto>
{
    private readonly IHistoricoImpressaoRepository _historico;
    private readonly IProdutoRepository _produtos;
    private readonly ICurrentUserService _currentUser;

    public RegistrarImpressaoCommandHandler(
        IHistoricoImpressaoRepository historico,
        IProdutoRepository produtos,
        ICurrentUserService currentUser)
    {
        _historico = historico;
        _produtos = produtos;
        _currentUser = currentUser;
    }

    public async Task<HistoricoImpressaoDto> Handle(
        RegistrarImpressaoCommand request,
        CancellationToken cancellationToken)
    {
        var produto = await _produtos.ObterPorIdAsync(request.ProdutoId, cancellationToken)
            ?? throw new DomainException("Produto não encontrado.");

        var registro = HistoricoImpressaoEtiqueta.Criar(
            produto.Id,
            request.TipoEtiqueta,
            request.Quantidade,
            request.DataProducao,
            _currentUser.UsuarioId);

        await _historico.AdicionarAsync(registro, cancellationToken);
        await _historico.SalvarAsync(cancellationToken);

        return ToDto(registro, produto.Nome);
    }

    internal static HistoricoImpressaoDto ToDto(
        HistoricoImpressaoEtiqueta h,
        string produtoNome) => new(
            h.Id,
            h.ProdutoId,
            produtoNome,
            h.TipoEtiqueta,
            h.Quantidade,
            h.DataProducao,
            h.ImpressoEm);
}
