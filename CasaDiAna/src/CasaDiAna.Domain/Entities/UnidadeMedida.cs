namespace CasaDiAna.Domain.Entities;

public class UnidadeMedida
{
    public short Id { get; private set; }
    public string Codigo { get; private set; } = string.Empty;
    public string Descricao { get; private set; } = string.Empty;

    private UnidadeMedida() { }
}
