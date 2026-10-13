using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;
using CasaDiAna.Application.Entradas.Common;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.EditarEntrada;

public class EditarEntradaCommandHandler : IRequestHandler<EditarEntradaCommand, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IFornecedorRepository _fornecedores;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUtensilioRepository _utensilios;
    private readonly ICurrentUserService _currentUser;

    public EditarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IFornecedorRepository fornecedores,
        IIngredienteRepository ingredientes,
        IUtensilioRepository utensilios,
        ICurrentUserService currentUser)
    {
        _entradas = entradas;
        _fornecedores = fornecedores;
        _ingredientes = ingredientes;
        _utensilios = utensilios;
        _currentUser = currentUser;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        EditarEntradaCommand request, CancellationToken cancellationToken)
    {
        var entrada = await _entradas.ObterPorIdComItensAsync(request.EntradaId, cancellationToken)
            ?? throw new DomainException("Entrada não encontrada.");

        EntradaPermissao.GarantirAcesso(entrada, _currentUser);

        // Só valida quando muda: uma entrada de fornecedor desativado depois continua editável.
        if (request.FornecedorId != entrada.FornecedorId)
            await GarantirFornecedorAtivoAsync(request.FornecedorId, cancellationToken);

        var usuarioId = _currentUser.UsuarioId;

        entrada.AtualizarCabecalho(
            request.FornecedorId,
            request.DataEntrada,
            request.NumeroNotaFiscal,
            request.RecebidoPor,
            request.Observacoes,
            usuarioId);

        var boletos = entrada.SubstituirBoletos(
            request.DatasVencimentoBoleto ?? Array.Empty<DateTime>(), DateTime.UtcNow.Date, usuarioId);
        // Boletos ficam numa coleção readonly com chaves geradas no cliente: precisam entrar/sair
        // pelo repositório. Com Update no agregado, os novos seriam marcados como Modified e o
        // SaveChanges falharia com DbUpdateConcurrencyException.
        _entradas.RemoverBoletos(boletos.Removidos);
        await _entradas.AdicionarBoletosAsync(boletos.Adicionados, cancellationToken);

        foreach (var custo in request.CustosItens ?? Array.Empty<CustoItemInputDto>())
            entrada.AlterarCustoItem(custo.ItemId, custo.CustoUnitario, usuarioId);

        foreach (var custo in request.CustosItensUtensilio ?? Array.Empty<CustoItemInputDto>())
            entrada.AlterarCustoItemUtensilio(custo.ItemId, custo.CustoUnitario, usuarioId);

        await SincronizarCustoIngredientesAsync(entrada, cancellationToken);
        await SincronizarCustoUtensiliosAsync(entrada, cancellationToken);

        // Sem _entradas.Atualizar(entrada) de propósito: a entrada já está rastreada e Update
        // marcaria os boletos novos como Modified (ver comentário acima).
        await _entradas.SalvarAsync(cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return RegistrarEntradaCommandHandler.ToDto(salva!);
    }

    private async Task GarantirFornecedorAtivoAsync(Guid fornecedorId, CancellationToken ct)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(fornecedorId, ct)
            ?? throw new DomainException("Fornecedor não encontrado.");

        if (!fornecedor.Ativo)
            throw new DomainException("Fornecedor está inativo.");
    }

    /// <summary>
    /// O custo do cadastro é o da compra mais recente: só é sobrescrito pelos itens
    /// cujo ingrediente não aparece numa entrada confirmada posterior a esta.
    /// </summary>
    private async Task SincronizarCustoIngredientesAsync(EntradaMercadoria entrada, CancellationToken ct)
    {
        var comEntradaPosterior = await _entradas.ObterIngredientesComEntradaPosteriorAsync(entrada, ct);

        foreach (var item in entrada.Itens.Where(i => !comEntradaPosterior.Contains(i.IngredienteId)))
        {
            var ingrediente = await _ingredientes.ObterPorIdAsync(item.IngredienteId, ct)
                ?? throw new DomainException($"Ingrediente '{item.IngredienteId}' não encontrado.");

            ingrediente.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);
        }
    }

    private async Task SincronizarCustoUtensiliosAsync(EntradaMercadoria entrada, CancellationToken ct)
    {
        var comEntradaPosterior = await _entradas.ObterUtensiliosComEntradaPosteriorAsync(entrada, ct);

        foreach (var item in entrada.ItensUtensilio.Where(i => !comEntradaPosterior.Contains(i.UtensilioId)))
        {
            var utensilio = await _utensilios.ObterPorIdAsync(item.UtensilioId, ct)
                ?? throw new DomainException($"Utensílio '{item.UtensilioId}' não encontrado.");

            utensilio.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _utensilios.Atualizar(utensilio);
        }
    }
}
