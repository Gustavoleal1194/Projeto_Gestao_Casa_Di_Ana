using CasaDiAna.Application.Common;
using CasaDiAna.Application.Entradas.Dtos;
using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;
using MediatR;

namespace CasaDiAna.Application.Entradas.Commands.RegistrarEntrada;

public class RegistrarEntradaCommandHandler : IRequestHandler<RegistrarEntradaCommand, EntradaMercadoriaDto>
{
    private readonly IEntradaMercadoriaRepository _entradas;
    private readonly IIngredienteRepository _ingredientes;
    private readonly IUtensilioRepository _utensilios;
    private readonly IMovimentacaoRepository _movimentacoes;
    private readonly IMovimentacaoUtensilioRepository _movimentacoesUtensilio;
    private readonly IFornecedorRepository _fornecedores;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificacaoEstoqueService _notificacaoService;

    public RegistrarEntradaCommandHandler(
        IEntradaMercadoriaRepository entradas,
        IIngredienteRepository ingredientes,
        IUtensilioRepository utensilios,
        IMovimentacaoRepository movimentacoes,
        IMovimentacaoUtensilioRepository movimentacoesUtensilio,
        IFornecedorRepository fornecedores,
        ICurrentUserService currentUser,
        INotificacaoEstoqueService notificacaoService)
    {
        _entradas = entradas;
        _ingredientes = ingredientes;
        _utensilios = utensilios;
        _movimentacoes = movimentacoes;
        _movimentacoesUtensilio = movimentacoesUtensilio;
        _fornecedores = fornecedores;
        _currentUser = currentUser;
        _notificacaoService = notificacaoService;
    }

    public async Task<EntradaMercadoriaDto> Handle(
        RegistrarEntradaCommand request, CancellationToken cancellationToken)
    {
        var fornecedor = await _fornecedores.ObterPorIdAsync(request.FornecedorId, cancellationToken)
            ?? throw new DomainException("Fornecedor não encontrado.");

        if (!fornecedor.Ativo)
            throw new DomainException("Fornecedor está inativo.");

        var entrada = EntradaMercadoria.Criar(
            request.FornecedorId,
            request.DataEntrada,
            _currentUser.UsuarioId,
            request.NumeroNotaFiscal,
            request.RecebidoPor,
            request.Observacoes,
            request.TemBoleto,
            request.DataVencimentoBoleto);

        var itensIngrediente = request.Itens ?? Array.Empty<ItemEntradaInputDto>();

        // Carrega todos os ingredientes de uma vez
        var ingredienteIds = itensIngrediente.Select(i => i.IngredienteId).Distinct().ToList();
        var ingredientesMap = new Dictionary<Guid, Ingrediente>();
        foreach (var id in ingredienteIds)
        {
            var ing = await _ingredientes.ObterPorIdAsync(id, cancellationToken)
                ?? throw new DomainException($"Ingrediente '{id}' não encontrado.");
            if (!ing.Ativo)
                throw new DomainException($"Ingrediente '{ing.Nome}' está inativo.");
            ingredientesMap[id] = ing;
        }

        // Adiciona itens de ingrediente na entrada e atualiza estoque
        foreach (var item in itensIngrediente)
        {
            entrada.AdicionarItem(item.IngredienteId, item.Quantidade, item.CustoUnitario);

            var ingrediente = ingredientesMap[item.IngredienteId];
            var novoSaldo = ingrediente.EstoqueAtual + item.Quantidade;
            ingrediente.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            ingrediente.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _ingredientes.Atualizar(ingrediente);

            var movimentacao = Movimentacao.Criar(
                item.IngredienteId,
                TipoMovimentacao.Entrada,
                item.Quantidade,
                novoSaldo,
                _currentUser.UsuarioId,
                referenciaTipo: "EntradaMercadoria",
                referenciaId: entrada.Id);

            await _movimentacoes.AdicionarAsync(movimentacao, cancellationToken);
        }

        // Carrega todos os utensílios de uma vez
        var itensUtensilio = request.ItensUtensilio ?? Array.Empty<ItemEntradaUtensilioInputDto>();
        var utensilioIds = itensUtensilio.Select(i => i.UtensilioId).Distinct().ToList();
        var utensiliosMap = new Dictionary<Guid, Utensilio>();
        foreach (var id in utensilioIds)
        {
            var ute = await _utensilios.ObterPorIdAsync(id, cancellationToken)
                ?? throw new DomainException($"Utensílio '{id}' não encontrado.");
            if (!ute.Ativo)
                throw new DomainException($"Utensílio '{ute.Nome}' está inativo.");
            utensiliosMap[id] = ute;
        }

        // Adiciona itens de utensílio na entrada e atualiza estoque
        foreach (var item in itensUtensilio)
        {
            entrada.AdicionarItemUtensilio(item.UtensilioId, item.Quantidade, item.CustoUnitario);

            var utensilio = utensiliosMap[item.UtensilioId];
            var novoSaldo = utensilio.EstoqueAtual + item.Quantidade;
            utensilio.AtualizarEstoque(novoSaldo, _currentUser.UsuarioId);
            utensilio.AtualizarCusto(item.CustoUnitario, _currentUser.UsuarioId);
            _utensilios.Atualizar(utensilio);

            var movimentacaoUtensilio = MovimentacaoUtensilio.Criar(
                item.UtensilioId,
                TipoMovimentacao.Entrada,
                item.Quantidade,
                novoSaldo,
                _currentUser.UsuarioId,
                referenciaTipo: "EntradaMercadoria",
                referenciaId: entrada.Id);

            await _movimentacoesUtensilio.AdicionarAsync(movimentacaoUtensilio, cancellationToken);
        }

        await _entradas.AdicionarAsync(entrada, cancellationToken);
        await _entradas.SalvarAsync(cancellationToken);

        foreach (var ing in ingredientesMap.Values)
            await _notificacaoService.VerificarECriarAsync(ing, cancellationToken);

        var salva = await _entradas.ObterPorIdComItensAsync(entrada.Id, cancellationToken);
        return ToDto(salva!);
    }

    internal static EntradaMercadoriaDto ToDto(EntradaMercadoria e)
    {
        var itens = e.Itens.Select(i => new ItemEntradaDto(
            i.Id,
            i.IngredienteId,
            i.Ingrediente?.Nome ?? string.Empty,
            i.Ingrediente?.UnidadeMedida?.Codigo ?? string.Empty,
            i.Quantidade,
            i.CustoUnitario,
            i.CustoTotal)).ToList().AsReadOnly();

        var itensUtensilio = e.ItensUtensilio.Select(i => new ItemEntradaUtensilioDto(
            i.Id,
            i.UtensilioId,
            i.Utensilio?.Nome ?? string.Empty,
            i.Utensilio?.UnidadeMedida?.Codigo ?? string.Empty,
            i.Quantidade,
            i.CustoUnitario,
            i.CustoTotal)).ToList().AsReadOnly();

        return new EntradaMercadoriaDto(
            e.Id,
            e.FornecedorId,
            e.Fornecedor?.RazaoSocial ?? string.Empty,
            e.NumeroNotaFiscal,
            e.DataEntrada,
            e.Status.ToString(),
            e.RecebidoPor,
            e.Observacoes,
            itens,
            itens.Sum(i => i.CustoTotal) + itensUtensilio.Sum(i => i.CustoTotal),
            e.CriadoEm,
            e.TemBoleto,
            e.DataVencimentoBoleto,
            itensUtensilio);
    }
}
