using CasaDiAna.Application.Inventarios.Dtos;
using MediatR;

namespace CasaDiAna.Application.Inventarios.Commands.AdicionarItemInventario;

public record AdicionarItemInventarioCommand(
    Guid InventarioId,
    Guid IngredienteId,
    decimal QuantidadeContada,
    string? Observacoes = null) : IRequest<InventarioDto>;
