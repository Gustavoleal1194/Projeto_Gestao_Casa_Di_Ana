import { motion } from 'framer-motion'

interface ScanLineProps {
  ativo?: boolean
}

/**
 * Linha horizontal fina com glow cyan que varre o painel de cima pra baixo
 * em loop. Efeito HUD sutil.
 */
export function ScanLine({ ativo = true }: ScanLineProps) {
  if (!ativo) return null

  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        height: '2px',
        background:
          'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.5) 50%, transparent 100%)',
        boxShadow: '0 0 12px rgba(56,189,248,0.4)',
        mixBlendMode: 'screen',
        opacity: 0.4,
      }}
      initial={{ top: '0%' }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  )
}
