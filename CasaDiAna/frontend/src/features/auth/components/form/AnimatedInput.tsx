import { motion } from 'framer-motion'
import { useState } from 'react'

interface AnimatedInputProps {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (valor: string) => void
  autoComplete?: string
  disabled?: boolean
}

export function AnimatedInput({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  disabled,
}: AnimatedInputProps) {
  const [focused, setFocused] = useState(false)
  const flutuando = focused || value.length > 0

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        className="absolute pointer-events-none select-none font-medium"
        style={{
          left: '1rem',
          color: focused ? '#C4870A' : 'var(--ada-muted)',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          background: flutuando ? 'white' : 'transparent',
          padding: flutuando ? '0 0.375rem' : '0',
          transformOrigin: 'left center',
        }}
        animate={{
          y: flutuando ? -10 : 14,
          scale: flutuando ? 0.82 : 1,
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {label}
      </motion.label>

      <input
        id={id}
        type={type}
        name={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        spellCheck={false}
        disabled={disabled}
        className="w-full rounded-xl px-4 py-3 text-sm text-[var(--ada-heading)]
                   bg-white border border-[var(--ada-border)] outline-none
                   transition-all duration-200
                   focus-visible:border-[#C4870A] focus-visible:ring-2 focus-visible:ring-[#C4870A]/20
                   disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: 'var(--shadow-xs)' }}
      />
    </div>
  )
}
