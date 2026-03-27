using CasaDiAna.Application.Common;
using CasaDiAna.Application.Fornecedores.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Commands.CriarFornecedor;

public class CriarFornecedorCommandHandler : IRequestHandler<CriarFornecedorCommand, FornecedorDto>
{
    private readonly IFornecedorRepository _fornecedores;
    private readonly ICurrentUserService _currentUser;

    public CriarFornecedorCommandHandler(
        IFornecedorRepository fornecedores,
        ICurrentUserService currentUser)
    {
        _fornecedores = fornecedores;
        _currentUser = currentUser;
    }

    public async Task<FornecedorDto> Handle(CriarFornecedorCommand request, CancellationToken cancellationToken)
    {
        if (request.Cnpj != null &&
            await _fornecedores.CnpjExisteAsync(request.Cnpj, ct: cancellationToken))
            throw new DomainException($"Já existe um fornecedor com o CNPJ '{request.Cnpj}'.");

        var fornecedor = Fornecedor.Criar(
            request.RazaoSocial,
            _currentUser.UsuarioId,
            request.NomeFantasia,
            request.Cnpj,
            request.Telefone,
            request.Email,
            request.ContatoNome,
            request.Observacoes);

        await _fornecedores.AdicionarAsync(fornecedor, cancellationToken);
        await _fornecedores.SalvarAsync(cancellationToken);

        return ToDto(fornecedor);
    }

    internal static FornecedorDto ToDto(Fornecedor f) => new(
        f.Id, f.RazaoSocial, f.NomeFantasia,
        f.Cnpj, f.Telefone, f.Email,
        f.ContatoNome, f.Observacoes,
        f.Ativo, f.AtualizadoEm);
}
