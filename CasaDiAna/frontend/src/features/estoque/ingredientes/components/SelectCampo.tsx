import type { SelectHTMLAttributes } from 'react'

interface Opcao {
  valor: string | number
  rotulo: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
  opcoes: Opcao[]
  placeholderOpcao?: string
}

export function SelectCampo({
  label,
  erro,
  obrigatorio,
  opcoes,
  placeholderOpcao = 'Selecione...',
  ...props
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        {...props}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                    ${erro ? 'border-red-300 bg-red-50' : 'border-stone-200'}
                    ${props.disabled ? 'bg-stone-50 cursor-not-allowed text-stone-400' : ''}`}
      >
        <option value="">{placeholderOpcao}</option>
        {opcoes.map(op => (
          <option key={op.valor} value={op.valor}>
            {op.rotulo}
          </option>
        ))}
      </select>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  )
}
