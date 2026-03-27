namespace CasaDiAna.Application.Relatorios.Dtos;

public record MovimentacaoRelatorioDto(
    Guid Id,
    Guid IngredienteId,
    string IngredienteNome,
    string UnidadeMedidaCodigo,
    string Tipo,
    decimal Quantidade,
    decimal SaldoApos,
    string? ReferenciaTipo,
    Guid? ReferenciaId,
    DateTime CriadoEm);
