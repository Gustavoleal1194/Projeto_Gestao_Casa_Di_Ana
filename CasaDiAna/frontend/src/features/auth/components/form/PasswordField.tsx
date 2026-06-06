import { useState } from 'react'
import { IconField, LockIcon } from './IconField'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  disabled?: boolean
}

function EyeIcon({ slash }: { slash: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {slash && <path d="M3 3l18 18" />}
    </svg>
  )
}

export function PasswordField({ id, label, value, onChange, autoComplete, disabled }: PasswordFieldProps) {
  const [shown, setShown] = useState(false)
  return (
    <IconField
      id={id}
      label={label}
      type={shown ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      icon={<LockIcon />}
      placeholder="••••••••"
      autoComplete={autoComplete}
      disabled={disabled}
      trailing={
        <button
          type="button"
          className="lr-eye-btn"
          onClick={() => setShown(s => !s)}
          aria-label={shown ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <EyeIcon slash={shown} />
        </button>
      }
    />
  )
}
