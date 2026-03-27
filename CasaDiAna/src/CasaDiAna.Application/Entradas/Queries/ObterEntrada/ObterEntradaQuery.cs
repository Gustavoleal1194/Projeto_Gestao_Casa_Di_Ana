using CasaDiAna.Application.Entradas.Dtos;
using MediatR;

namespace CasaDiAna.Application.Entradas.Queries.ObterEntrada;

public record ObterEntradaQuery(Guid Id) : IRequest<EntradaMercadoriaDto>;
