using CasaDiAna.Application.Notificacoes.Services;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Domain.Exceptions;
using CasaDiAna.Domain.Interfaces;

namespace CasaDiAna.Infrastructure.Services;

public class NotificacaoEstoqueService : INotificacaoEstoqueService
{
    private readonly INotificacaoEstoqueRepository _notificacoes;
    private readonly IIngredienteRepository _ingredientes;

    public NotificacaoEstoqueService(
        INotificacaoEstoqueRepository notificacoes,
        IIngredienteRepository ingredientes)
    {
        _notificacoes = notificacoes;
        _ingredientes = ingredientes;
    }

    public async Task VerificarECriarAsync(Ingrediente ingrediente, CancellationToken ct = default)
    {
        var nivel = DeterminarNivel(ingrediente);

        if (nivel is null) return;

        var jaExiste = await _notificacoes.ExisteNaoLidaParaIngredienteAsync(ingrediente.Id, ct);
        if (jaExiste) return;

        var (titulo, mensagem) = GerarTexto(ingrediente, nivel.Value);
        var notificacao = NotificacaoEstoque.Criar(ingrediente.Id, titulo, mensagem, nivel.Value);

        await _notificacoes.AdicionarAsync(notificacao, ct);
        await _notificacoes.SalvarAsync(ct);
    }

    public async Task MarcarComoLidaAsync(Guid id, CancellationToken ct = default)
    {
        var notificacao = await _notificacoes.ObterPorIdAsync(id, ct)
            ?? throw new DomainException("Notificação não encontrada.");

        notificacao.MarcarComoLida();
        _notificacoes.Atualizar(notificacao);
        await _notificacoes.SalvarAsync(ct);
    }

    public async Task MarcarTodasComoLidasAsync(CancellationToken ct = default)
    {
        await _notificacoes.MarcarTodasComoLidasAsync(ct);
    }

    public async Task SincronizarAsync(CancellationToken ct = default)
    {
        var ingredientes = await _ingredientes.ListarAsync(apenasAtivos: true, ct);
        foreach (var ing in ingredientes)
            await VerificarECriarAsync(ing, ct);
    }

    private static TipoNotificacaoEstoque? DeterminarNivel(Ingrediente ingrediente)
    {
        if (ingrediente.EstoqueAtual == 0)
            return TipoNotificacaoEstoque.Zerado;

        if (ingrediente.EstoqueAtual <= ingrediente.EstoqueMinimo)
            return TipoNotificacaoEstoque.Critico;

        if (ingrediente.EstoqueMinimo > 0 &&
            ingrediente.EstoqueAtual <= ingrediente.EstoqueMinimo * 1.5m)
            return TipoNotificacaoEstoque.Atencao;

        return null;
    }

    private static (string titulo, string mensagem) GerarTexto(
        Ingrediente ingrediente,
        TipoNotificacaoEstoque nivel) => nivel switch
    {
        TipoNotificacaoEstoque.Zerado => (
            $"Estoque zerado: {ingrediente.Nome}",
            $"O ingrediente '{ingrediente.Nome}' está com estoque ZERO. " +
            "Realize uma entrada imediatamente para retomar a produção."
        ),
        TipoNotificacaoEstoque.Critico => (
            $"Estoque crítico: {ingrediente.Nome}",
            $"O ingrediente '{ingrediente.Nome}' está ABAIXO do mínimo — " +
            $"atual: {ingrediente.EstoqueAtual:G}, mínimo: {ingrediente.EstoqueMinimo:G}. " +
            "Providencie reposição urgente."
        ),
        TipoNotificacaoEstoque.Atencao => (
            $"Atenção ao estoque: {ingrediente.Nome}",
            $"O ingrediente '{ingrediente.Nome}' está próximo do nível mínimo — " +
            $"atual: {ingrediente.EstoqueAtual:G}, mínimo: {ingrediente.EstoqueMinimo:G}. " +
            "Verifique a necessidade de reposição."
        ),
        _ => throw new ArgumentOutOfRangeException(nameof(nivel))
    };
}
