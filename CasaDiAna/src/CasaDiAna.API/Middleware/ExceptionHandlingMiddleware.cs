using System.Text.Json;
using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Exceptions;
using FluentValidation;

namespace CasaDiAna.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            var erros = ex.Errors.Select(e => e.ErrorMessage);
            var resposta = ApiResponse<object>.Erro(erros);
            await context.Response.WriteAsync(
                JsonSerializer.Serialize(resposta, _jsonOptions));
        }
        catch (DomainException ex)
        {
            context.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";
            var resposta = ApiResponse<object>.Erro(ex.Message);
            await context.Response.WriteAsync(
                JsonSerializer.Serialize(resposta, _jsonOptions));
        }
        catch (UnauthorizedAccessException)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var resposta = ApiResponse<object>.Erro("Credenciais inválidas.");
            await context.Response.WriteAsync(
                JsonSerializer.Serialize(resposta, _jsonOptions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro não tratado.");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var resposta = ApiResponse<object>.Erro("Erro interno do servidor.");
            await context.Response.WriteAsync(
                JsonSerializer.Serialize(resposta, _jsonOptions));
        }
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}
