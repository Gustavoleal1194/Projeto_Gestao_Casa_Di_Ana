using FluentValidation;

namespace CasaDiAna.Application.Usuarios.Commands.Habilitar2Fa;

public class Habilitar2FaCommandValidator : AbstractValidator<Habilitar2FaCommand>
{
    public Habilitar2FaCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .NotEmpty().WithMessage("Usuário inválido.");

        RuleFor(x => x.Telefone)
            .NotEmpty().WithMessage("Telefone é obrigatório.")
            .Matches(@"^\+55\d{10,11}$")
            .WithMessage("Telefone deve estar no formato E.164 brasileiro: +55 seguido de 10 ou 11 dígitos.");
    }
}
