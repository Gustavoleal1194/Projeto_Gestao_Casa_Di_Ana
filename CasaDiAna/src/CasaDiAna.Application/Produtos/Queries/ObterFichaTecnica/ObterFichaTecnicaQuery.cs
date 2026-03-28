using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Queries.ObterFichaTecnica;

public record ObterFichaTecnicaQuery(Guid ProdutoId) : IRequest<FichaTecnicaDto>;
