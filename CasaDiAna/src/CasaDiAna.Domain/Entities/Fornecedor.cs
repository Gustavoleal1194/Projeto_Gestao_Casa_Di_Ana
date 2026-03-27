namespace CasaDiAna.Domain.Entities;

public class Fornecedor
{
    public Guid Id { get; private set; }
    public string RazaoSocial { get; private set; } = string.Empty;
    public string? NomeFantasia { get; private set; }
    public string? Cnpj { get; private set; }
    public string? Telefone { get; private set; }
    public string? Email { get; private set; }
    public string? ContatoNome { get; private set; }
    public string? Observacoes { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private Fornecedor() { }

    public static Fornecedor Criar(
        string razaoSocial,
        Guid criadoPor,
        string? nomeFantasia = null,
        string? cnpj = null,
        string? telefone = null,
        string? email = null,
        string? contatoNome = null,
        string? observacoes = null)
    {
        return new Fornecedor
        {
            Id = Guid.NewGuid(),
            RazaoSocial = razaoSocial,
            NomeFantasia = nomeFantasia,
            Cnpj = cnpj,
            Telefone = telefone,
            Email = email,
            ContatoNome = contatoNome,
            Observacoes = observacoes,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
            CriadoPor = criadoPor,
            AtualizadoPor = criadoPor
        };
    }

    public void Atualizar(
        string razaoSocial,
        Guid atualizadoPor,
        string? nomeFantasia = null,
        string? cnpj = null,
        string? telefone = null,
        string? email = null,
        string? contatoNome = null,
        string? observacoes = null)
    {
        RazaoSocial = razaoSocial;
        NomeFantasia = nomeFantasia;
        Cnpj = cnpj;
        Telefone = telefone;
        Email = email;
        ContatoNome = contatoNome;
        Observacoes = observacoes;
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
