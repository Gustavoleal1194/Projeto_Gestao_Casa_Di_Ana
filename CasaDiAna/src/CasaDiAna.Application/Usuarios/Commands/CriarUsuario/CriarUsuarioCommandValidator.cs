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
        RuleFor(x => x.Senha)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Senha deve ter no mínimo 8 caracteres.")
            .Matches("[A-Z]").WithMessage("Senha deve conter ao menos uma letra maiúscula.")
            .Matches("[a-z]").WithMessage("Senha deve conter ao menos uma letra minúscula.")
            .Matches("[0-9]").WithMessage("Senha deve conter ao menos um número.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Senha deve conter ao menos um caractere especial.");
        RuleFor(x => x.Papel)
            .NotEmpty()
            .Must(p => PapeisValidos.Contains(p))
            .WithMessage($"Papel inválido. Valores aceitos: {string.Join(", ", PapeisValidos)}.");
    }
}
