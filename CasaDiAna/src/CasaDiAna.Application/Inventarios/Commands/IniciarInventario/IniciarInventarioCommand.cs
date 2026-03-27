using CasaDiAna.Application.Inventarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.IniciarInventario;

public record IniciarInventarioCommand(
    DateTime DataRealizacao,
    string? Descricao = null,
    string? Observacoes = null) : IRequest<InventarioDto>;
