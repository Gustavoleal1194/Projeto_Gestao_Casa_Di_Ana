import type { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  onFechar: () => void
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--sb-accent)' }}>
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function Calc({ nome, formula, children }: { nome: string; formula: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: 'var(--ada-border)', background: 'var(--ada-bg)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{nome}</p>
      <p className="text-[13px] font-mono rounded px-2 py-1" style={{ background: 'var(--ada-surface-2, var(--ada-hover))', color: 'var(--ada-body)' }}>
        {formula}
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ada-muted)' }}>{children}</p>
    </div>
  )
}

export function ModalAjudaPrecificacao({ onFechar }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ajuda-precificacao-titulo"
    >
      <div
        className="w-full max-w-2xl rounded-xl border flex flex-col"
        style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho fixo */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--ada-border)' }}>
          <h2 id="ajuda-precificacao-titulo" className="text-lg font-semibold" style={{ color: 'var(--ada-heading)' }}>
            Como funciona a precificação
          </h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--ada-muted)' }}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ada-body)' }}>
            Esta tela parte do <strong>custo da ficha técnica</strong> de cada produto e cruza com as
            <strong> despesas fixas do mês</strong> para mostrar a saúde da margem e sugerir um preço.
            Todos os percentuais são frações do preço de venda.
          </p>

          <Secao titulo="1. Os números de cada produto">
            <Calc nome="Custo da ficha técnica" formula="Σ (ingrediente × quantidade)  ·  ou custo da bebida pronta">
              É a base de tudo: quanto o produto custa para ser feito. Mantenha atualizado lançando as compras/entradas.
            </Calc>
            <Calc nome="CMV atual %" formula="custo ÷ preço de venda">
              Quanto do preço é "engolido" pelo custo. Ex.: custo R$ 2,10 / preço R$ 6,00 = <strong>35%</strong>. Quanto menor, melhor.
            </Calc>
            <Calc nome="Margem de contribuição" formula="preço − custo">
              O que sobra (em R$) para pagar as despesas e gerar lucro.
            </Calc>
            <Calc nome="Rateio de despesas" formula="preço × % despesa fixa do mês">
              A fatia das despesas fixas que esse produto precisa cobrir. O <em>% despesa fixa</em> vem do Fechamento
              (despesas fixas ÷ faturamento do mês). Sem faturamento definido, esse rateio fica em 0.
            </Calc>
            <Calc nome="Lucro estimado por unidade" formula="preço − custo − rateio de despesas">
              O que de fato sobra a cada unidade vendida, já descontando a parte das despesas fixas.
            </Calc>
            <Calc nome="Margem líquida estimada %" formula="lucro estimado ÷ preço">
              Seu lucro real, em porcentagem. É o número que diz se o produto "se paga".
            </Calc>
          </Secao>

          <Secao titulo="2. Como o preço sugerido é calculado">
            <Calc nome="Preço sugerido por margem desejada (o principal)" formula="custo ÷ (1 − despesa fixa% − taxas% − margem desejada%)">
              Embute tudo: custo + despesas + taxas + o lucro que você quer. É o <strong>piso recomendado</strong>.
              Se a soma dos percentuais chegar a 100%, o cálculo é bloqueado (não há espaço para o custo).
            </Calc>
            <Calc nome="Preço sugerido por CMV alvo" formula="custo ÷ CMV alvo">
              Preço para o custo representar uma porcentagem-meta do preço. Ex.: custo R$ 2,10 e CMV alvo 30% → R$ 7,00.
            </Calc>
            <Calc nome="Custo máximo permitido" formula="preço × CMV alvo">
              Se o custo da ficha passar disso, o produto entra como <strong>Custo alto</strong> — está caro de produzir para o preço atual.
            </Calc>
          </Secao>

          <Secao titulo="3. O que cada status significa">
            <ul className="space-y-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--ada-body)' }}>
              <li><strong style={{ color: '#4ADE80' }}>Saudável</strong> — margem líquida confortável, acima da desejada.</li>
              <li><strong style={{ color: '#FCD34D' }}>Atenção</strong> — lucro positivo, mas perto do limite da margem desejada.</li>
              <li><strong style={{ color: '#93C5FD' }}>Abaixo do ideal</strong> — dá lucro, mas menos que a margem que você quer.</li>
              <li><strong style={{ color: '#F87171' }}>Custo alto</strong> — o custo da ficha está acima do máximo permitido (CMV acima do alvo).</li>
              <li><strong style={{ color: '#F87171' }}>Prejuízo estimado</strong> — o preço não cobre custo + rateio de despesas. Reajuste já.</li>
            </ul>
          </Secao>

          <Secao titulo="4. Como ter sempre lucro">
            <ul className="space-y-2 text-[13px] leading-relaxed" style={{ color: 'var(--ada-body)' }}>
              <li>• Mantenha o <strong>custo da ficha</strong> atualizado — lance as compras/entradas das notas.</li>
              <li>• Defina o <strong>faturamento do mês</strong> no Fechamento; sem ele o rateio fica em 0 e o preço sugerido subestima.</li>
              <li>• Configure <strong>CMV alvo, margem desejada e taxas</strong> realistas para o seu negócio.</li>
              <li>• <strong>Regra de ouro:</strong> nunca venda abaixo do <em>preço sugerido por margem desejada</em> — ele já é o piso que cobre custo, despesas, taxas e o seu lucro.</li>
              <li>• Use o <strong>status</strong> como alarme: Prejuízo, Custo alto ou Abaixo do ideal = reajuste o preço ou reduza o custo.</li>
              <li>• Em resumo, para lucrar sempre: <strong>preço de venda ≥ custo + rateio de despesas + taxas + margem desejada</strong>.</li>
            </ul>
          </Secao>
        </div>

        {/* Rodapé fixo */}
        <div className="flex justify-end px-6 py-3 shrink-0" style={{ borderTop: '1px solid var(--ada-border)' }}>
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: 'var(--sb-accent)' }}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
