using CasaDiAna.Application.Produtos.Dtos;
using MediatR;

namespace CasaDiAna.Application.Produtos.Commands.DefinirCustoUnitario;

public record DefinirCustoUnitarioCommand(
    Guid ProdutoId,
    decimal CustoUnitario) : IRequest<FichaTecnicaDto>;
