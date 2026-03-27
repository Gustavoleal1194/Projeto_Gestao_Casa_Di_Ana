namespace CasaDiAna.Application.Categorias.Dtos;

public record CategoriaDto(Guid Id, string Nome, bool Ativo, DateTime CriadoEm, DateTime AtualizadoEm);
