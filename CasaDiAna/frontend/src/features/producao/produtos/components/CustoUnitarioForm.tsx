import { useState } from 'react'
import { CampoTexto } from '@/components/form/CampoTexto'
import { FormCard } from '@/components/form/FormCard'
import { FormSection } from '@/components/form/FormSection'
import { FooterFormulario } from './FooterFormulario'

interface Props {
  valorInicial: number | null
  salvando: boolean
  onSalvar: (valor: number) => void
  onVoltar: () => void
  onErro: (msg: string) => void
}

export function CustoUnitarioForm({ valorInicial, salvando, onSalvar, onVoltar, onErro }: Props) {
  const [custo, setCusto] = useState(valorInicial != null ? String(valorInicial) : '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valor = Number(custo)
    if (!valor || valor <= 0) {
      onErro('Informe um custo unitário maior que zero.')
      return
    }
    onSalvar(valor)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormCard>
        <FormSection titulo="Custo Unitário" />
        <p className="mb-4 text-sm" style={{ color: 'var(--ada-muted)' }}>
          Bebida pronta (revenda): informe o custo de compra por unidade. Não há ficha de ingredientes.
        </p>
        <div className="max-w-[220px]">
          <CampoTexto
            label="Custo Unitário (R$)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={custo}
            onChange={e => setCusto(e.target.value)}
          />
        </div>
        <FooterFormulario salvando={salvando} onVoltar={onVoltar} labelSalvar="Salvar Custo Unitário" />
      </FormCard>
    </form>
  )
}
