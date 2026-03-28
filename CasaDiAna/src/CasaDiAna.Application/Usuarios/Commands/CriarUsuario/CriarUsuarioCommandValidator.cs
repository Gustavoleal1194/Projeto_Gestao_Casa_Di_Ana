using CasaDiAna.Domain.Enums;
using FluentValidation;

namespace CasaDiAna.Application.Usuarios.Commands.CriarUsuario;

public class CriarUsuarioCommandValidator : AbstractValidator<CriarUsuarioCommand>
{
    private static readonly string[] PapeisValidos =
        Enum.GetNames<PapelUsuario>();

    public CriarUsuarioCommandValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Senha).NotEmpty().MinimumLength(6);
        RuleFor(x => x.Papel)
            .NotEmpty()
            .Must(p => PapeisValidos.Contains(p))
            .WithMessage($"Papel inválido. Valores aceitos: {string.Join(", ", PapeisValidos)}.");
    }
}
