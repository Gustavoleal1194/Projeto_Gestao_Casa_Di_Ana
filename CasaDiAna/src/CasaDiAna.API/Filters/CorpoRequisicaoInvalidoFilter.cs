using CasaDiAna.Application.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace CasaDiAna.API.Filters;

/// <summary>
/// Responde 400 quando o corpo da requisição não pôde ser lido (JSON malformado ou fora de UTF-8).
/// O filtro automático de ModelState fica desligado para o FluentValidation dar as mensagens em
/// pt-BR; sem este filtro, o argumento do corpo chegaria nulo ao controller e viraria 500.
/// </summary>
public sealed class CorpoRequisicaoInvalidoFilter : IActionFilter
{
    public const string Mensagem =
        "Corpo da requisição inválido. Envie um JSON válido codificado em UTF-8.";

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var corpoNaoLido = context.ActionDescriptor.Parameters.Any(p =>
            p.BindingInfo?.BindingSource == BindingSource.Body
            && (!context.ActionArguments.TryGetValue(p.Name, out var valor) || valor is null));

        if (corpoNaoLido)
            context.Result = new BadRequestObjectResult(ApiResponse<object>.Erro(Mensagem));
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
