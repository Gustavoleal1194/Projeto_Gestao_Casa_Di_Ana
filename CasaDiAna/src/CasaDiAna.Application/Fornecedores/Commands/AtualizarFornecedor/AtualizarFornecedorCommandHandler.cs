using CasaDiAna.Application.Common;
using CasaDiAna.Application.Fornecedores.Commands.CriarFornecedor;
using CasaDiAna.Application.Fornecedores.Dtos;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Fornecedores.Commands.AtualizarFornecedor;

public class AtualizarFornecedorCommandHandler : IRequestHandler<AtualizarFornecedorCommand, FornecedorDto>
{
    private readonly IFornecedorRepository _fornecedores;
    private readonly ICurrentUserService _currentUser;

    public AtualizarFornecedorCommandHandler(
        IFornecedorRepository fornecedores,
        ICurrentUserService currentUser)
    {
        _fornecedores = fornecedores;
        _currentUser = currentUser;
    }

    public async Task<FornecedorDto> Handle(AtualizarFornecedorCommand request, CancellationToken cancellationToken)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException("Fornecedor não encontrado.");

        if (request.Cnpj != null &&
            await _fornecedores.CnpjExisteAsync(request.Cnpj, ignorarId: request.Id, ct: cancellationToken))
            throw new DomainException($"Já existe um fornecedor com o CNPJ '{request.Cnpj}'.");

        fornecedor.Atualizar(
            request.RazaoSocial,
            _currentUser.UsuarioId,
            request.NomeFantasia,
            request.Cnpj,
            request.Telefone,
            request.Email,
            request.ContatoNome,
            request.Observacoes);

        _fornecedores.Atualizar(fornecedor);
        await _fornecedores.SalvarAsync(cancellationToken);

        return CriarFornecedorCommandHandler.ToDto(fornecedor);
    }
}
