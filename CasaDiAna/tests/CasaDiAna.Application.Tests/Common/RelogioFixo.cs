namespace CasaDiAna.Application.Tests.Common;

/// <summary>TimeProvider parado num instante conhecido, para testes que dependem de "hoje".</summary>
public sealed class RelogioFixo(DateTimeOffset agora) : TimeProvider
{
    /// <summary>
    /// 30/11/2026 às 22h30 em Brasília — já 01/12 em UTC. Pega o bug clássico de
    /// calcular "hoje" em UTC, que só aparece das 21h à meia-noite.
    /// </summary>
    public static readonly DateTimeOffset NoiteEmBrasilia = new(2026, 11, 30, 22, 30, 0, TimeSpan.FromHours(-3));

    /// <summary>A data de "hoje" na loja no instante <see cref="NoiteEmBrasilia"/>.</summary>
    public static readonly DateTime HojeNaLoja = new(2026, 11, 30);

    public static RelogioFixo ANoite() => new(NoiteEmBrasilia);

    public override DateTimeOffset GetUtcNow() => agora.ToUniversalTime();
}
