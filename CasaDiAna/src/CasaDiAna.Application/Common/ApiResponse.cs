namespace CasaDiAna.Application.Common;

public class ApiResponse<T>
{
    public bool Sucesso { get; private set; }
    public T? Dados { get; private set; }
    public IReadOnlyList<string> Erros { get; private set; } = Array.Empty<string>();

    private ApiResponse() { }

    public static ApiResponse<T> Ok(T dados) =>
        new() { Sucesso = true, Dados = dados };

    public static ApiResponse<T> Erro(params string[] erros) =>
        new() { Sucesso = false, Erros = erros };

    public static ApiResponse<T> Erro(IEnumerable<string> erros) =>
        new() { Sucesso = false, Erros = erros.ToList().AsReadOnly() };
}
