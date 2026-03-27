using CasaDiAna.Application.Common;
using FluentAssertions;
using FluentValidation;
using MediatR;
using Moq;

namespace CasaDiAna.Application.Tests.Common;

public class ValidationBehaviorTests
{
    private record ComandoValido : IRequest<string>;
    private record ComandoInvalido : IRequest<string>;

    private class ValidatorValido : AbstractValidator<ComandoValido>
    {
        public ValidatorValido() { }
    }

    private class ValidatorInvalido : AbstractValidator<ComandoInvalido>
    {
        public ValidatorInvalido()
        {
            RuleFor(x => x).Must(_ => false).WithMessage("Erro de validação.");
        }
    }

    [Fact]
    public async Task DevePassar_QuandoNaoHaValidadores()
    {
        var behavior = new ValidationBehavior<ComandoValido, string>(
            Enumerable.Empty<IValidator<ComandoValido>>());
        var next = new Mock<RequestHandlerDelegate<string>>();
        next.Setup(n => n()).ReturnsAsync("ok");

        var resultado = await behavior.Handle(
            new ComandoValido(), next.Object, CancellationToken.None);

        resultado.Should().Be("ok");
    }

    [Fact]
    public async Task DevePassar_QuandoValidacaoOk()
    {
        var validators = new[] { new ValidatorValido() };
        var behavior = new ValidationBehavior<ComandoValido, string>(validators);
        var next = new Mock<RequestHandlerDelegate<string>>();
        next.Setup(n => n()).ReturnsAsync("ok");

        var resultado = await behavior.Handle(
            new ComandoValido(), next.Object, CancellationToken.None);

        resultado.Should().Be("ok");
    }

    [Fact]
    public async Task DeveLancarExcecao_QuandoValidacaoFalha()
    {
        var validators = new[] { new ValidatorInvalido() };
        var behavior = new ValidationBehavior<ComandoInvalido, string>(validators);
        var next = new Mock<RequestHandlerDelegate<string>>();

        var acao = () => behavior.Handle(
            new ComandoInvalido(), next.Object, CancellationToken.None);

        await acao.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Erro de validação*");
    }
}
