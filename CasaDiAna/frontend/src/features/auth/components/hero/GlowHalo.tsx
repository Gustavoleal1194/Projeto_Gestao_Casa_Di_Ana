import { motion, useReducedMotion } from 'framer-motion'

interface GlowHaloProps {
  ativo: boolean
}

/**
 * Duas camadas de radial-gradient atrás do globo criando profundidade:
 * - Halo externo cyan (600px): atmosfera fria, cria o "campo" ao redor
 * - Halo interno âmbar (360px): calor da marca bem próximo ao centro
 *
 * Ambas pulsam em ciclos ligeiramente distintos para um efeito orgânico —
 * sem pulsação em reduced-motion.
 */
export function GlowHalo({ ativo }: GlowHaloProps) {
  const motionReduzido = useReducedMotion()
  if (!ativo) return null

  const pulsarExterno = motionReduzido
    ? { opacity: 0.55, scale: 1 }
    : { opacity: [0.45, 0.65, 0.45], scale: [1, 1.04, 1] }

  const pulsarInterno = motionReduzido
    ? { opacity: 0.35, scale: 1 }
    : { opacity: [0.25, 0.45, 0.25], scale: [1, 1.06, 1] }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        aria-hidden="true"
        animate={pulsarExterno}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width:  600,
          height: 600,
          background:
            'radial-gradient(circle, rgba(56, 153, 204, 0.35) 0%, rgba(56, 153, 204, 0.12) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute"
        animate={pulsarInterno}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        style={{
          width:  360,
          height: 360,
          background:
            'radial-gradient(circle, rgba(212, 150, 13, 0.28) 0%, rgba(212, 150, 13, 0.08) 45%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  )
}
