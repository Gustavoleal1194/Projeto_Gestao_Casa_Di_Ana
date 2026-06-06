import type { ReactNode } from 'react'

interface IconFieldProps {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (v: string) => void
  icon: ReactNode
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
  /** slot à direita (ex.: botão de olho) */
  trailing?: ReactNode
}

/** Campo de input escuro com ícone à esquerda (estilo .lr-input-wrap). */
export function IconField({
  id, label, type, value, onChange, icon, placeholder, autoComplete, disabled, trailing,
}: IconFieldProps) {
  return (
    <div className="lr-field">
      <label htmlFor={id}>{label}</label>
      <div className="lr-input-wrap">
        {icon}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          spellCheck={false}
          onChange={e => onChange(e.target.value)}
        />
        {trailing}
      </div>
    </div>
  )
}

export function MailIcon() {
  return (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
