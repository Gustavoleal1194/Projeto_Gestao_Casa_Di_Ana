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
    public decimal Proteinas { get; private set; }
    public decimal GordurasTotais { get; private set; }
    public decimal GordurasSaturadas { get; private set; }
    public decimal FibraAlimentar { get; private set; }
    public decimal Sodio { get; private set; }
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
        decimal proteinas,
        decimal gordurasTotais,
        decimal gordurasSaturadas,
        decimal fibraAlimentar,
        decimal sodio)
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
            Proteinas = proteinas,
            GordurasTotais = gordurasTotais,
            GordurasSaturadas = gordurasSaturadas,
            FibraAlimentar = fibraAlimentar,
            Sodio = sodio,
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
        decimal proteinas,
        decimal gordurasTotais,
        decimal gordurasSaturadas,
        decimal fibraAlimentar,
        decimal sodio)
    {
        Porcao = porcao;
        ValorEnergeticoKcal = valorEnergeticoKcal;
        ValorEnergeticoKJ = valorEnergeticoKJ;
        Carboidratos = carboidratos;
        AcucaresTotais = acucaresTotais;
        Proteinas = proteinas;
        GordurasTotais = gordurasTotais;
        GordurasSaturadas = gordurasSaturadas;
        FibraAlimentar = fibraAlimentar;
        Sodio = sodio;
        AtualizadoEm = DateTime.UtcNow;
    }
}
