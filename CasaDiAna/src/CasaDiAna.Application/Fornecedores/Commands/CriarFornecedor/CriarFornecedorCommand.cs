using CasaDiAna.Application.Fornecedores.Dtos;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Commands.CriarFornecedor;

public record CriarFornecedorCommand(
    string RazaoSocial,
    string? NomeFantasia = null,
    string? Cnpj = null,
    string? Telefone = null,
    string? Email = null,
    string? ContatoNome = null,
    string? Observacoes = null) : IRequest<FornecedorDto>;
