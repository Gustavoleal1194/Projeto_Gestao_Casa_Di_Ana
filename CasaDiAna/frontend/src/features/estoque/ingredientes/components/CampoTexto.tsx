import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
  sufixo?: string
}

export function CampoTexto({ label, erro, obrigatorio, sufixo, className, id, ...props }: Props) {
  const inputId = id ?? `campo-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-[13px] font-medium mb-1.5"
        style={{ color: '#4B4039', fontFamily: 'DM Sans, system-ui, sans-serif' }}
      >
        {label}
        {obrigatorio && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
        )}
        {obrigatorio && <span className="sr-only">(obrigatório)</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          {...props}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${inputId}-erro` : undefined}
          className={[
            'w-full rounded-lg px-3.5 py-2.5 text-sm text-[#18150E] placeholder-[#C4B8AD]',
            'border outline-none transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-[#C4870A]/25',
            erro
              ? 'border-red-300 bg-red-50/50 focus-visible:border-red-400'
              : 'border-[#E4DDD3] bg-white focus-visible:border-[#C4870A]',
            props.disabled
              ? 'bg-[#F9F8F6] cursor-not-allowed text-[#8B7E73] border-[#EEEBE5]'
              : '',
            sufixo ? 'pr-14' : '',
            className ?? '',
          ].join(' ')}
          style={{ boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04))' }}
        />
        {sufixo && (
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none select-none px-1.5 py-0.5 rounded"
            style={{ color: '#8B7E73', background: '#F5F3EF' }}
            aria-hidden="true"
          >
            {sufixo}
          </span>
        )}
      </div>
      {erro && (
        <p id={`${inputId}-erro`} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          {erro}
        </p>
      )}
    </div>
  )
}
