namespace CasaDiAna.Domain.Entities;

public class ModeloEtiquetaNutricional
{
    public Guid Id { get; private set; }
    public Guid ProdutoId { get; private set; }
    public Produto? Produto { get; private set; }
    public string Porcao { get; private set; } = "100g";
    public decimal ValorEnergeticoKcal { get; private set; }
    public decimal ValorEnergeticoKJ { get; private set; }
    public decimal Carboidratos { get; private set; }
    public decimal AcucaresTotais { get; private set; }
    public decimal AcucaresAdicionados { get; private set; }
    public decimal Proteinas { get; private set; }
    public decimal GordurasTotais { get; private set; }
    public decimal GordurasSaturadas { get; private set; }
    public decimal GordurasTrans { get; private set; }
    public decimal FibraAlimentar { get; private set; }
    public decimal Sodio { get; private set; }
    public int? PorcoesPorEmbalagem { get; private set; }
    public string? MedidaCaseira { get; private set; }

    public string? VdValorEnergetico { get; private set; }
    public string? VdCarboidratos { get; private set; }
    public string? VdAcucaresAdicionados { get; private set; }
    public string? VdProteinas { get; private set; }
    public string? VdGordurasTotais { get; private set; }
    public string? VdGordurasSaturadas { get; private set; }
    public string? VdGordurasTrans { get; private set; }
    public string? VdFibraAlimentar { get; private set; }
    public string? VdSodio { get; private set; }

    public string? Nome { get; private set; }
    public bool ContemAlergicos { get; private set; }
    public bool ContemGluten { get; private set; }
    public bool ContemLactose { get; private set; }
    public string? LoteFabricacao { get; private set; }

    public DateTime CriadoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }

    private ModeloEtiquetaNutricional() { }

    public static ModeloEtiquetaNutricional Criar(
        Guid produtoId,
        string porcao,
        decimal valorEnergeticoKcal,
        decimal valorEnergeticoKJ,
        decimal carboidratos,
        decimal acucaresTotais,
        decimal acucaresAdicionados,
        decimal proteinas,
        decimal gordurasTotais,
        decimal gordurasSaturadas,
        decimal gordurasTrans,
        decimal fibraAlimentar,
        decimal sodio,
        int? porcoesPorEmbalagem,
        string? medidaCaseira,
        string? vdValorEnergetico = null,
        string? vdCarboidratos = null,
        string? vdAcucaresAdicionados = null,
        string? vdProteinas = null,
        string? vdGordurasTotais = null,
        string? vdGordurasSaturadas = null,
        string? vdGordurasTrans = null,
        string? vdFibraAlimentar = null,
        string? vdSodio = null,
        string? nome = null,
        bool contemAlergicos = false,
        bool contemGluten = false,
        bool contemLactose = false,
        string? loteFabricacao = null)
    {
        return new ModeloEtiquetaNutricional
        {
            Id = Guid.NewGuid(),
            ProdutoId = produtoId,
            Porcao = porcao,
            ValorEnergeticoKcal = valorEnergeticoKcal,
            ValorEnergeticoKJ = valorEnergeticoKJ,
            Carboidratos = carboidratos,
            AcucaresTotais = acucaresTotais,
            AcucaresAdicionados = acucaresAdicionados,
            Proteinas = proteinas,
            GordurasTotais = gordurasTotais,
            GordurasSaturadas = gordurasSaturadas,
            GordurasTrans = gordurasTrans,
            FibraAlimentar = fibraAlimentar,
            Sodio = sodio,
            PorcoesPorEmbalagem = porcoesPorEmbalagem,
            MedidaCaseira = medidaCaseira,
            VdValorEnergetico = NullIfEmpty(vdValorEnergetico),
            VdCarboidratos = NullIfEmpty(vdCarboidratos),
            VdAcucaresAdicionados = NullIfEmpty(vdAcucaresAdicionados),
            VdProteinas = NullIfEmpty(vdProteinas),
            VdGordurasTotais = NullIfEmpty(vdGordurasTotais),
            VdGordurasSaturadas = NullIfEmpty(vdGordurasSaturadas),
            VdGordurasTrans = NullIfEmpty(vdGordurasTrans),
            VdFibraAlimentar = NullIfEmpty(vdFibraAlimentar),
            VdSodio = NullIfEmpty(vdSodio),
            Nome = NullIfEmpty(nome),
            ContemAlergicos = contemAlergicos,
            ContemGluten = contemGluten,
            ContemLactose = contemLactose,
            LoteFabricacao = NullIfEmpty(loteFabricacao),
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
        };
    }

    public void Atualizar(
        string porcao,
        decimal valorEnergeticoKcal,
        decimal valorEnergeticoKJ,
        decimal carboidratos,
        decimal acucaresTotais,
        decimal acucaresAdicionados,
        decimal proteinas,
        decimal gordurasTotais,
        decimal gordurasSaturadas,
        decimal gordurasTrans,
        decimal fibraAlimentar,
        decimal sodio,
        int? porcoesPorEmbalagem,
        string? medidaCaseira,
        string? vdValorEnergetico,
        string? vdCarboidratos,
        string? vdAcucaresAdicionados,
        string? vdProteinas,
        string? vdGordurasTotais,
        string? vdGordurasSaturadas,
        string? vdGordurasTrans,
        string? vdFibraAlimentar,
        string? vdSodio,
        string? nome = null,
        bool contemAlergicos = false,
        bool contemGluten = false,
        bool contemLactose = false,
        string? loteFabricacao = null)
    {
        Porcao = porcao;
        ValorEnergeticoKcal = valorEnergeticoKcal;
        ValorEnergeticoKJ = valorEnergeticoKJ;
        Carboidratos = carboidratos;
        AcucaresTotais = acucaresTotais;
        AcucaresAdicionados = acucaresAdicionados;
        Proteinas = proteinas;
        GordurasTotais = gordurasTotais;
        GordurasSaturadas = gordurasSaturadas;
        GordurasTrans = gordurasTrans;
        FibraAlimentar = fibraAlimentar;
        Sodio = sodio;
        PorcoesPorEmbalagem = porcoesPorEmbalagem;
        MedidaCaseira = medidaCaseira;
        VdValorEnergetico = NullIfEmpty(vdValorEnergetico);
        VdCarboidratos = NullIfEmpty(vdCarboidratos);
        VdAcucaresAdicionados = NullIfEmpty(vdAcucaresAdicionados);
        VdProteinas = NullIfEmpty(vdProteinas);
        VdGordurasTotais = NullIfEmpty(vdGordurasTotais);
        VdGordurasSaturadas = NullIfEmpty(vdGordurasSaturadas);
        VdGordurasTrans = NullIfEmpty(vdGordurasTrans);
        VdFibraAlimentar = NullIfEmpty(vdFibraAlimentar);
        VdSodio = NullIfEmpty(vdSodio);
        Nome = NullIfEmpty(nome);
        ContemAlergicos = contemAlergicos;
        ContemGluten = contemGluten;
        ContemLactose = contemLactose;
        LoteFabricacao = NullIfEmpty(loteFabricacao);
        AtualizadoEm = DateTime.UtcNow;
    }

    public void AtualizarNome(string? nome)
    {
        Nome = NullIfEmpty(nome);
        AtualizadoEm = DateTime.UtcNow;
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
