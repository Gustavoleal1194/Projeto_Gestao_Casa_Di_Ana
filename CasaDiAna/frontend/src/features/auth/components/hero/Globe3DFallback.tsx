import { motion } from 'framer-motion'

/**
 * Skeleton pulsante exibido durante o lazy load do Globe3DScene
 * ou quando ele falha em runtime (ErrorBoundary).
 */
export function Globe3DFallback() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      {/* Círculo principal pulsante */}
      <motion.div
        className="w-[400px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(212,150,12,0.08) 55%, transparent 75%)',
          filter: 'blur(2px)',
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Arco orbital estático girando */}
      <motion.div
        className="absolute w-[380px] h-[380px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 380 380" className="w-full h-full">
          <circle
            cx="190"
            cy="190"
            r="180"
            fill="none"
            stroke="rgba(56,189,248,0.25)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        </svg>
      </motion.div>
    </div>
  )
}
