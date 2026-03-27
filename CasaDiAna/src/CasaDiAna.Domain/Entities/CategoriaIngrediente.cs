namespace CasaDiAna.Domain.Entities;

public class CategoriaIngrediente
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private CategoriaIngrediente() { }

    public static CategoriaIngrediente Criar(string nome, Guid criadoPor)
    {
        return new CategoriaIngrediente
        {
            Id = Guid.NewGuid(),
            Nome = nome,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(string nome, Guid atualizadoPor)
    {
        Nome = nome;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    public void Desativar(Guid atualizadoPor)
    {
        Ativo = false;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }
}
