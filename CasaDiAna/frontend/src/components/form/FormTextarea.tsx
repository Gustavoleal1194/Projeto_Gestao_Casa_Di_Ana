import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  erro?: string
  obrigatorio?: boolean
}

export function FormTextarea({ label, erro, obrigatorio, id, className, rows = 3, ...props }: Props) {
  const inputId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-[13px] font-medium mb-1.5"
        style={{ color: 'var(--ada-body)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
      >
        {label}
        {obrigatorio && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
        )}
        {obrigatorio && <span className="sr-only">(obrigatório)</span>}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={!!erro}
        aria-describedby={erro ? `${inputId}-erro` : undefined}
        {...props}
        className={[
          'w-full rounded-lg px-3.5 py-2.5 text-sm resize-none outline-none transition-all duration-200',
          'border focus-visible:ring-2 focus-visible:ring-[#C4870A]/25',
          erro
            ? 'border-red-300 bg-red-50/50 focus-visible:border-red-400'
            : 'border-[var(--ada-border)] bg-[var(--ada-surface)] focus-visible:border-[#C4870A]',
          'text-[var(--ada-heading)] placeholder-[var(--ada-placeholder)]',
          className ?? '',
        ].join(' ')}
        style={{ boxShadow: 'var(--shadow-xs)' }}
      />
      {erro && (
        <p id={`${inputId}-erro`} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {erro}
        </p>
      )}
    </div>
  )
}
