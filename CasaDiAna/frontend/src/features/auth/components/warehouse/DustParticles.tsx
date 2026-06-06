import { useMemo } from 'react'

interface DustParticlesProps {
  /** quando false (reduced-motion), não renderiza motes animados */
  animate: boolean
}

export function DustParticles({ animate }: DustParticlesProps) {
  const motes = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 12}s`,
        animationDuration: `${8 + Math.random() * 8}s`,
        opacity: 0.2 + Math.random() * 0.5,
      })),
    [],
  )
  if (!animate) return <div className="lr-dust" />
  return (
    <div className="lr-dust">
      {motes.map((style, i) => (
        <span key={i} style={style} />
      ))}
    </div>
  )
}
