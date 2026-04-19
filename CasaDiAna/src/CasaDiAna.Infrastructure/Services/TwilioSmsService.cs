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
    private readonly string _numeroDe;
    private readonly ILogger<TwilioSmsService> _logger;

    public TwilioSmsService(IConfiguration config, ILogger<TwilioSmsService> logger)
    {
        _logger = logger;
        var sid = config["Twilio:AccountSid"]
            ?? throw new InvalidOperationException("Twilio:AccountSid não configurado.");
        var token = config["Twilio:AuthToken"]
            ?? throw new InvalidOperationException("Twilio:AuthToken não configurado.");
        _numeroDe = config["Twilio:NumeroDe"]
            ?? throw new InvalidOperationException("Twilio:NumeroDe não configurado.");
        TwilioClient.Init(sid, token);
    }

    public async Task EnviarAsync(string telefone, string codigo, CancellationToken ct = default)
    {
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
