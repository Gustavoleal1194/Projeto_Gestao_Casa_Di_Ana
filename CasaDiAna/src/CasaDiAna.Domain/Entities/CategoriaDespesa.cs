using CasaDiAna.Domain.Enums;

namespace CasaDiAna.Domain.Entities;

public class CategoriaDespesa
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public TipoDespesa Tipo { get; private set; }
    public bool EhFolhaPagamento { get; private set; }
    public bool Ativo { get; private set; }
    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid CriadoPor { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private CategoriaDespesa() { }

    public static CategoriaDespesa Criar(string nome, TipoDespesa tipo, bool ehFolhaPagamento, Guid criadoPor) => new()
    {
        Id = Guid.NewGuid(),
        Nome = nome.Trim(),
        Tipo = tipo,
        EhFolhaPagamento = ehFolhaPagamento,
        Ativo = true,
        CriadoEm = DateTime.UtcNow,
        AtualizadoEm = DateTime.UtcNow,
        CriadoPor = criadoPor,
        AtualizadoPor = criadoPor
    };

    public void Atualizar(string nome, TipoDespesa tipo, bool ehFolhaPagamento, Guid atualizadoPor)
    {
        Nome = nome.Trim();
        Tipo = tipo;
        EhFolhaPagamento = ehFolhaPagamento;
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
