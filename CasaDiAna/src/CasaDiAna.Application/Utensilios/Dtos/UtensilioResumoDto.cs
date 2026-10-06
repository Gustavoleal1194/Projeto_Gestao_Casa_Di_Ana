namespace CasaDiAna.Application.Utensilios.Dtos;

public record UtensilioResumoDto(
    Guid Id,
    string Nome,
    string? CodigoInterno,
    string? CategoriaNome,
    string UnidadeMedidaCodigo,
    decimal EstoqueAtual,
    decimal EstoqueMinimo,
    bool EstaBaixoDoMinimo,
    bool Ativo);
