namespace CasaDiAna.Application.Despesas.Dtos;

/// <summary>Resultado da cópia das despesas fixas: quantas foram copiadas e quantas já existiam.</summary>
public record ReplicacaoDespesasDto(
    DateTime CompetenciaOrigem, DateTime CompetenciaDestino, int Copiadas, int JaExistentes);
