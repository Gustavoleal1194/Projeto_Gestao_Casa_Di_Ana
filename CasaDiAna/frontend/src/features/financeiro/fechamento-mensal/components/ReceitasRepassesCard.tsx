import type { FechamentoMensal } from '../services/fechamentoService'
import { formatarBRL } from '../../shared/competencia'

interface LinhaProps {
  label: string
  valor: number
  sinal?: '−'
  destaque?: boolean
}

function Linha({ label, valor, sinal, destaque }: LinhaProps) {
  const cor = destaque ? 'var(--ada-heading)' : 'var(--ada-body)'
  return (
    <tr style={{ borderTop: '1px solid var(--ada-border)' }}>
      <td className="py-2.5 pr-4" style={{ color: cor, fontWeight: destaque ? 600 : 400 }}>{label}</td>
      <td className="py-2.5 text-right tabular-nums" style={{ color: cor, fontWeight: destaque ? 600 : 400 }}>
        {sinal ? `${sinal} ` : ''}{formatarBRL(valor)}
      </td>
    </tr>
  )
}

export function ReceitasRepassesCard({ dados }: { dados: FechamentoMensal }) {
  return (
    <div className="rounded-xl border p-6"
      style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--ada-muted)' }}>
        Receitas e repasses
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            <Linha label="Receita de produtos" valor={dados.faturamentoUsado} />
            <Linha label="Taxa de serviço recebida" valor={dados.receitaTaxaServico} />
            <Linha label="Entregas recebidas" valor={dados.receitaEntregas} />
            <Linha label="Receita total" valor={dados.receitaTotal} destaque />
            <Linha label="Repasse à equipe" valor={dados.repasseEquipe} sinal="−" />
            <Linha label="Repasse aos motoboys" valor={dados.repasseMotoboys} sinal="−" />
            <Linha label="Receita líquida da casa" valor={dados.receitaLiquida} destaque />
          </tbody>
        </table>
      </div>
    </div>
  )
}
