import { useFormContext, useWatch } from 'react-hook-form'
import { CampoTexto } from '@/components/form/CampoTexto'
import type { EntradaEdicaoFormValues } from '@/types/estoque'
import type { ItemEdicao } from '../utils/edicaoEntrada'

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const cabecalho = 'text-[11px] font-semibold uppercase tracking-wide'
const grade = 'grid grid-cols-[1fr_110px_130px] gap-2'

interface Props {
  itens: ItemEdicao[]
}

/** Itens com nome e quantidade travados; só o custo unitário é editável. */
export function TabelaCustosEdicao({ itens }: Props) {
  const { register, control, formState: { errors } } = useFormContext<EntradaEdicaoFormValues>()
  const custos = useWatch({ control, name: 'custos' })

  const totalAntes = itens.reduce((soma, i) => soma + i.quantidade * i.custoUnitario, 0)
  const totalDepois = itens.reduce((soma, i, idx) => soma + i.quantidade * (Number(custos?.[idx]?.custoUnitario) || 0), 0)

  return (
    <div className="overflow-x-auto">
      <div className={`${grade} px-1 mb-1.5`} style={{ color: 'var(--ada-muted)' }}>
        <span className={cabecalho}>Item</span>
        <span className={cabecalho}>Quantidade</span>
        <span className={cabecalho}>Custo Unit. (R$)</span>
      </div>
      <div className="space-y-2">
        {itens.map((item, index) => (
          <div key={item.itemId} className={`${grade} items-center`}>
            <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{item.nome}</span>
            <span className="text-sm font-mono" style={{ color: 'var(--ada-muted)' }}>
              {item.quantidade} {item.unidadeMedidaCodigo}
            </span>
            <CampoTexto
              id={`custo-${item.itemId}`}
              label={`Custo unitário de ${item.nome}`}
              labelOculto
              type="number"
              step="0.0001"
              min="0"
              {...register(`custos.${index}.custoUnitario`)}
              erro={errors.custos?.[index]?.custoUnitario?.message}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-right" style={{ color: 'var(--ada-body)' }}>
        Total: {totalAntes === totalDepois
          ? <strong>{moeda(totalDepois)}</strong>
          : <>{moeda(totalAntes)} → <strong>{moeda(totalDepois)}</strong></>}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--ada-muted)' }}>
        Para corrigir quantidade ou itens, cancele a entrada e registre de novo.
      </p>
    </div>
  )
}
