namespace CasaDiAna.Domain.Common;

/// <summary>
/// Calendário de negócio da loja (horário de Brasília).
///
/// Instantes (CriadoEm, AtualizadoEm…) continuam gravados em UTC. Tudo que significa
/// "dia" — "hoje", filtros por período — precisa ser calculado neste fuso: em UTC,
/// das 21h à meia-noite o servidor já estaria no dia seguinte.
/// </summary>
public static class FusoHorarioLoja
{
    public static readonly TimeZoneInfo Fuso = ObterFuso();

    // Imagens de container sem tzdata não conhecem o ID IANA. Sem horário de verão
    // desde 2019, Brasília é UTC−3 fixo — fallback equivalente em vez de derrubar a API.
    private static TimeZoneInfo ObterFuso()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone("America/Sao_Paulo", TimeSpan.FromHours(-3), "Brasília", "Brasília");
        }
    }

    /// <summary>Data de hoje na loja (Kind = Unspecified, hora zerada).</summary>
    public static DateTime Hoje(this TimeProvider relogio) =>
        TimeZoneInfo.ConvertTime(relogio.GetUtcNow(), Fuso).Date;

    /// <summary>Instante UTC em que o dia <paramref name="dia"/> começa na loja.</summary>
    public static DateTime InicioDoDiaEmUtc(DateTime dia) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(dia.Date, DateTimeKind.Unspecified), Fuso);

    /// <summary>
    /// Intervalo UTC [inicio, fim) que cobre os dias de <paramref name="de"/> até
    /// <paramref name="ate"/> inteiros, no calendário da loja.
    /// </summary>
    public static (DateTime Inicio, DateTime Fim) PeriodoEmUtc(DateTime de, DateTime ate) =>
        (InicioDoDiaEmUtc(de), InicioDoDiaEmUtc(ate.Date.AddDays(1)));
}
