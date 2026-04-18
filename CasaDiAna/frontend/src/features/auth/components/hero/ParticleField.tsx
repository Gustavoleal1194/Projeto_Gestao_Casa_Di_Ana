import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particula {
  left: string
  top: string
  size: number
  delay: number
  duration: number
  cor: string
}

function gerarParticulas(qtd: number): Particula[] {
  const cores = ['rgba(56,189,248,0.6)', 'rgba(212,150,12,0.5)', 'rgba(115,185,210,0.4)']
  const particulas: Particula[] = []
  for (let i = 0; i < qtd; i++) {
    particulas.push({
      left:     `${Math.random() * 100}%`,
      top:      `${Math.random() * 100}%`,
      size:     1 + Math.random() * 2.5,
      delay:    Math.random() * 8,
      duration: 6 + Math.random() * 6,
      cor:      cores[Math.floor(Math.random() * cores.length)],
    })
  }
  return particulas
}

interface ParticleFieldProps {
  ativo?: boolean
}

export function ParticleField({ ativo = true }: ParticleFieldProps) {
  const particulas = useMemo(() => gerarParticulas(24), [])

  if (!ativo) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {particulas.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full block"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.cor,
            boxShadow: `0 0 ${p.size * 2}px ${p.cor}`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
