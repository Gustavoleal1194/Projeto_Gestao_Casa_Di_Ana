using FluentValidation;

namespace CasaDiAna.Application.Usuarios.Commands.RedefinirSenha;

public class RedefinirSenhaCommandValidator : AbstractValidator<RedefinirSenhaCommand>
{
    public RedefinirSenhaCommandValidator()
    {
        RuleFor(x => x.NovaSenha).NotEmpty().MinimumLength(6);
    }
}
