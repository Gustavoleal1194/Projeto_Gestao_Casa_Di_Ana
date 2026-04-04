namespace CasaDiAna.Application.Notificacoes.Dtos;

public record NotificacaoEstoqueDto(
    Guid Id,
    string Titulo,
    string Mensagem,
    string Tipo,
    DateTime DataCriacao,
    bool Lida,
    Guid IngredienteId,
    string? IngredienteNome
);
