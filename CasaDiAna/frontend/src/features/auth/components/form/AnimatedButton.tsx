import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

interface AnimatedButtonProps {
  type?: 'button' | 'submit'
  carregando?: boolean
  disabled?: boolean
  children: ReactNode
}

export function AnimatedButton({
  type = 'button',
  carregando = false,
  disabled = false,
  children,
}: AnimatedButtonProps) {
  const desabilitado = disabled || carregando

  return (
    <motion.button
      type={type}
      disabled={desabilitado}
      whileHover={desabilitado ? undefined : { scale: 1.01, y: -1 }}
      whileTap={desabilitado ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold
                 text-white mt-2 outline-none
                 focus-visible:ring-2 focus-visible:ring-[#C4870A]/40
                 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #D4960C 0%, #B87D0A 100%)',
        boxShadow: '0 4px 12px rgba(196,135,10,0.30)',
        fontFamily: 'Sora, system-ui, sans-serif',
      }}
    >
      {carregando && <Spinner />}
      {children}
    </motion.button>
  )
}
