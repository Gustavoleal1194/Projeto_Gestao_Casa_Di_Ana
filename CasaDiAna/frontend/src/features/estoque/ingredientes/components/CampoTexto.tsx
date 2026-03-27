import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
  sufixo?: string
}

export function CampoTexto({ label, erro, obrigatorio, sufixo, className, ...props }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                      ${erro ? 'border-red-300 bg-red-50' : 'border-stone-200'}
                      ${props.disabled ? 'bg-stone-50 cursor-not-allowed text-stone-400' : ''}
                      ${sufixo ? 'pr-12' : ''}
                      ${className ?? ''}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium pointer-events-none">
            {sufixo}
          </span>
        )}
      </div>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  )
}
