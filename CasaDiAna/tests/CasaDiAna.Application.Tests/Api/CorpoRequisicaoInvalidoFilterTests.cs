using CasaDiAna.API.Filters;
using CasaDiAna.Application.Common;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;

namespace CasaDiAna.Application.Tests.Api;

public class CorpoRequisicaoInvalidoFilterTests
{
    private readonly CorpoRequisicaoInvalidoFilter _filtro = new();

    private static ActionExecutingContext CriarContexto(
        BindingSource origem, object? valorArgumento)
    {
        var acao = new ActionDescriptor
        {
            Parameters = new List<ParameterDescriptor>
            {
                new()
                {
                    Name = "command",
                    ParameterType = typeof(object),
                    BindingInfo = new BindingInfo { BindingSource = origem }
                }
            }
        };
        var actionContext = new ActionContext(new DefaultHttpContext(), new RouteData(), acao);
        var argumentos = new Dictionary<string, object?>();
        if (valorArgumento is not null)
            argumentos["command"] = valorArgumento;

        return new ActionExecutingContext(
            actionContext, new List<IFilterMetadata>(), argumentos, controller: new object());
    }

    [Fact]
    public void DeveRetornar400_QuandoCorpoNaoPodeSerLido()
    {
        // JSON malformado ou fora de UTF-8: o model binding deixa o argumento do corpo nulo.
        var contexto = CriarContexto(BindingSource.Body, valorArgumento: null);

        _filtro.OnActionExecuting(contexto);

        var resultado = contexto.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var resposta = resultado.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        resposta.Sucesso.Should().BeFalse();
        resposta.Erros.Should().ContainSingle()
            .Which.Should().Be(CorpoRequisicaoInvalidoFilter.Mensagem);
    }

    [Fact]
    public void DeveSeguir_QuandoCorpoFoiLido()
    {
        var contexto = CriarContexto(BindingSource.Body, valorArgumento: new object());

        _filtro.OnActionExecuting(contexto);

        contexto.Result.Should().BeNull();
    }

    [Fact]
    public void DeveIgnorar_ParametrosQueNaoVemDoCorpo()
    {
        var contexto = CriarContexto(BindingSource.Query, valorArgumento: null);

        _filtro.OnActionExecuting(contexto);

        contexto.Result.Should().BeNull();
    }
}
