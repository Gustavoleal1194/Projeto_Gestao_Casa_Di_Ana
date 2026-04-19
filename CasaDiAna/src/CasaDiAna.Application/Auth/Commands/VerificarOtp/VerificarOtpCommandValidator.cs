using FluentValidation;

namespace CasaDiAna.Application.Auth.Commands.VerificarOtp;

public class VerificarOtpCommandValidator : AbstractValidator<VerificarOtpCommand>
{
    public VerificarOtpCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .NotEmpty().WithMessage("Sessão inválida.");

        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("Código é obrigatório.")
            .Length(6).WithMessage("Código deve ter 6 dígitos.")
            .Matches(@"^\d{6}$").WithMessage("Código deve conter apenas dígitos.");
    }
}
