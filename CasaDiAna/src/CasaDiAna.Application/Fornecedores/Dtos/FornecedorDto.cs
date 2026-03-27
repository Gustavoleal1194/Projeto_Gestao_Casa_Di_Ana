namespace CasaDiAna.Application.Fornecedores.Dtos;

public record FornecedorDto(
    Guid Id,
    string RazaoSocial,
    string? NomeFantasia,
    string? Cnpj,
    string? Telefone,
    string? Email,
    string? ContatoNome,
    string? Observacoes,
    bool Ativo,
    DateTime AtualizadoEm);
