using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class NotificacaoEstoque
{
    public Guid Id { get; private set; }
    public string Titulo { get; private set; } = string.Empty;
    public string Mensagem { get; private set; } = string.Empty;
    public TipoNotificacaoEstoque Tipo { get; private set; }
    public DateTime DataCriacao { get; private set; }
    public bool Lida { get; private set; }
    public Guid IngredienteId { get; private set; }

    public Ingrediente? Ingrediente { get; private set; }

    private NotificacaoEstoque() { }

    public static NotificacaoEstoque Criar(
        Guid ingredienteId,
        string titulo,
        string mensagem,
        TipoNotificacaoEstoque tipo)
    {
        return new NotificacaoEstoque
        {
            Id            = Guid.NewGuid(),
            IngredienteId = ingredienteId,
            Titulo        = titulo,
            Mensagem      = mensagem,
            Tipo          = tipo,
            DataCriacao   = DateTime.UtcNow,
            Lida          = false,
        };
    }

    public void MarcarComoLida() => Lida = true;
}
