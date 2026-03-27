using FluentValidation;

namespace CasaDiAna.Application.Inventarios.Commands.IniciarInventario;

public class IniciarInventarioCommandValidator : AbstractValidator<IniciarInventarioCommand>
{
    public IniciarInventarioCommandValidator()
    {
        RuleFor(x => x.DataRealizacao)
            .NotEmpty().WithMessage("Data de realização é obrigatória.");

        RuleFor(x => x.Descricao)
            .MaximumLength(200).When(x => x.Descricao != null)
            .WithMessage("Descrição deve ter no máximo 200 caracteres.");
    }
}
