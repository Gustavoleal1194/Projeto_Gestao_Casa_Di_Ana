using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace CasaDiAna.Infrastructure.Services;

public class TwilioSmsService : ISmsService
{
    private readonly string? _sid;
    private readonly string? _token;
    private readonly string? _numeroDe;
    private readonly ILogger<TwilioSmsService> _logger;

    public TwilioSmsService(IConfiguration config, ILogger<TwilioSmsService> logger)
    {
        _logger = logger;
        _sid      = config["Twilio:AccountSid"];
        _token    = config["Twilio:AuthToken"];
        _numeroDe = config["Twilio:NumeroDe"];

        if (string.IsNullOrWhiteSpace(_sid) || string.IsNullOrWhiteSpace(_token) || string.IsNullOrWhiteSpace(_numeroDe))
            _logger.LogWarning("Twilio não configurado: SMS 2FA não funcionará até que AccountSid, AuthToken e NumeroDe sejam definidos.");
        else
            TwilioClient.Init(_sid, _token);
    }

    public async Task EnviarAsync(string telefone, string codigo, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_sid) || string.IsNullOrWhiteSpace(_token) || string.IsNullOrWhiteSpace(_numeroDe))
            throw new InvalidOperationException("Serviço de SMS não configurado. Configure as variáveis Twilio no servidor.");

        try
        {
            var message = await MessageResource.CreateAsync(
                body: $"Seu código de verificação Casa di Ana: {codigo}. Válido por 5 minutos.",
                from: new PhoneNumber(_numeroDe),
                to: new PhoneNumber(telefone));

            _logger.LogInformation("SMS 2FA enviado para {Telefone}. SID: {Sid}",
                Usuario.MascararTelefone(telefone), message.Sid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar SMS 2FA para {Telefone}.",
                Usuario.MascararTelefone(telefone));
            throw;
        }
    }
}
