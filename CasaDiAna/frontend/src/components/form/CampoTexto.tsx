// CasaDiAna/frontend/src/components/form/CampoTexto.tsx
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
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}{obrigatorio && <span className="ml-0.5" style={{ color: '#F87171' }} aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-required={obrigatorio}
          aria-invalid={!!erro}
          className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 ${className ?? ''}`}
          style={{
            background: 'rgba(255,255,255,.05)',
            border: `1px solid ${erro ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)'}`,
            color: 'var(--ada-heading)',
            paddingRight: sufixo ? '2.5rem' : undefined,
            colorScheme: 'dark',
          }}
          {...props}
        />
        {sufixo && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--ada-muted)' }}
          >
            {sufixo}
          </span>
        )}
      </div>
      {erro && (
        <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
