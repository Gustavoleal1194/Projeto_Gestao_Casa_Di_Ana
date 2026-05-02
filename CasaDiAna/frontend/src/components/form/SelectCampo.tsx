// CasaDiAna/frontend/src/components/form/SelectCampo.tsx
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

export function SelectCampo({ label, erro, obrigatorio, opcoes, placeholderOpcao, className, id, ...props }: Props) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}{obrigatorio && <span className="ml-0.5" style={{ color: '#F87171' }} aria-hidden="true">*</span>}
      </label>
      <select
        id={selectId}
        aria-required={obrigatorio}
        aria-invalid={!!erro}
        className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 appearance-none ${className ?? ''}`}
        style={{
          background: 'rgba(255,255,255,.05)',
          border: `1px solid ${erro ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)'}`,
          color: 'var(--ada-heading)',
          colorScheme: 'dark',
        }}
        {...props}
      >
        {placeholderOpcao && <option value="">{placeholderOpcao}</option>}
        {opcoes.map(o => (
          <option key={o.valor} value={o.valor}>{o.rotulo}</option>
        ))}
      </select>
      {erro && (
        <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
