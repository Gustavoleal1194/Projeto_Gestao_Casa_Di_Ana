namespace CasaDiAna.Application.Utensilios.Dtos;

public record UtensilioDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    Guid? CategoriaUtensilioId,
    string? CategoriaNome,
    short UnidadeMedidaId,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    decimal? EstoqueMaximo,
    bool EstaBaixoDoMinimo,
    decimal? CustoUnitario,
    bool Ativo,
    DateTime AtualizadoEm);
