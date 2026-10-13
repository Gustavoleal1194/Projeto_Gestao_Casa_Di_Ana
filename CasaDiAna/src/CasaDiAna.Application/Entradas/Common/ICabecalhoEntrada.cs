namespace CasaDiAna.Application.Entradas.Common;

/// <summary>Campos de cabeçalho comuns ao registro e à edição de entrada.</summary>
public interface ICabecalhoEntrada
{
    Guid FornecedorId { get; }
    DateTime DataEntrada { get; }
    string RecebidoPor { get; }
    string? NumeroNotaFiscal { get; }
}
