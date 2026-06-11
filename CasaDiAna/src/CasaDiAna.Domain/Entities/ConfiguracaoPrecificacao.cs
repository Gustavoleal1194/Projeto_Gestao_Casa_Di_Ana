using CasaDiAna.Domain.Exceptions;

namespace CasaDiAna.Domain.Entities;

public class ConfiguracaoPrecificacao
{
    public Guid Id { get; private set; }
    public decimal CmvAlvo { get; private set; }
    public decimal MargemDesejada { get; private set; }
    public decimal Taxas { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public Guid AtualizadoPor { get; private set; }

    private ConfiguracaoPrecificacao() { }

    public static ConfiguracaoPrecificacao Padrao(Guid criadoPor) => new()
    {
        Id = Guid.NewGuid(),
        CmvAlvo = 0.30m,
        MargemDesejada = 0.20m,
        Taxas = 0m,
        AtualizadoEm = DateTime.UtcNow,
        AtualizadoPor = criadoPor
    };

    public void Atualizar(decimal cmvAlvo, decimal margemDesejada, decimal taxas, Guid atualizadoPor)
    {
        if (cmvAlvo <= 0 || cmvAlvo >= 1)
            throw new DomainException("CMV alvo deve estar entre 0 e 100% (exclusivo).");
        ValidarFracao(margemDesejada, "Margem desejada");
        ValidarFracao(taxas, "Taxas");

        CmvAlvo = cmvAlvo;
        MargemDesejada = margemDesejada;
        Taxas = taxas;
        AtualizadoEm = DateTime.UtcNow;
        AtualizadoPor = atualizadoPor;
    }

    private static void ValidarFracao(decimal valor, string campo)
    {
        if (valor < 0 || valor >= 1)
            throw new DomainException($"{campo} deve estar entre 0% e 100% (exclusivo no topo).");
    }
}
