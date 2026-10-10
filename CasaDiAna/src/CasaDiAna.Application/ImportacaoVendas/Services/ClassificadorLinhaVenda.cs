using CasaDiAna.Application.ImportacaoVendas.Dtos;

namespace CasaDiAna.Application.ImportacaoVendas.Services;

/// <summary>
/// Única regra que identifica linhas do relatório que não são produto, e sim
/// valores repassados (taxa de serviço à equipe, entregas aos motoboys).
/// </summary>
public static class ClassificadorLinhaVenda
{
    public static TipoRepasse? ClassificarRepasse(string nome)
    {
        var norm = NormalizadorNome.Normalizar(nome);

        // Entrega primeiro: "Taxa de entrega" começa com "taxa" mas é entrega.
        if (norm.StartsWith("entrega") || norm.StartsWith("taxa de entrega") || norm.StartsWith("taxa entrega"))
            return TipoRepasse.Entrega;
        if (norm.StartsWith("taxa"))
            return TipoRepasse.TaxaServico;
        return null;
    }
}
