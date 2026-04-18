import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Estrela {
  cx: number
  cy: number
  r: number
  delay: number
  duration: number
}

function gerarEstrelas(qtd: number): Estrela[] {
  const estrelas: Estrela[] = []
  for (let i = 0; i < qtd; i++) {
    estrelas.push({
      cx: Math.random() * 400,
      cy: Math.random() * 400,
      r: Math.random() * 1.2 + 0.4,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })
  }
  return estrelas
}

/**
 * Fallback 2D (desktop sem WebGL). Órbitas SVG concêntricas + estrelas + satélite.
 */
export function MobileHeroFallback() {
  const estrelas = useMemo(() => gerarEstrelas(20), [])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative w-[400px] h-[400px]">
        {/* Estrelas */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {estrelas.map((e, i) => (
            <motion.circle
              key={i}
              cx={e.cx}
              cy={e.cy}
              r={e.r}
              fill="rgba(56,189,248,0.6)"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: e.duration,
                repeat: Infinity,
                delay: e.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </svg>

        {/* Anel externo */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle
              cx="200" cy="200" r="190"
              fill="none"
              stroke="rgba(56,189,248,0.25)"
              strokeWidth="1"
              strokeDasharray="3 8"
            />
            {/* Satélite âmbar orbitando */}
            <circle cx="390" cy="200" r="4" fill="#D4960C" />
          </svg>
        </motion.div>

        {/* Anel médio (sentido contrário) */}
        <motion.div
          className="absolute inset-[30px]"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 340 340" className="w-full h-full">
            <circle
              cx="170" cy="170" r="160"
              fill="none"
              stroke="rgba(56,189,248,0.3)"
              strokeWidth="1"
              strokeDasharray="1 4"
            />
          </svg>
        </motion.div>

        {/* Anel interno */}
        <motion.div
          className="absolute inset-[70px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 260 260" className="w-full h-full">
            <circle
              cx="130" cy="130" r="120"
              fill="none"
              stroke="rgba(212,150,12,0.35)"
              strokeWidth="1"
            />
          </svg>
        </motion.div>

        {/* Núcleo central pulsante */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(212,150,12,0.5) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
