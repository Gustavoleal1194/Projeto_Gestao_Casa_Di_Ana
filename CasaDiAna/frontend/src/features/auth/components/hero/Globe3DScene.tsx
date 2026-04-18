import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import { AUTO_ROTATE_SPEED, GLOBE_TOKENS } from '../../lib/globeConfig'
import { useCursorParallax } from '../../hooks/useCursorParallax'
import { useRandomPings } from '../../hooks/useRandomPings'

interface Globe3DSceneProps {
  interactive?: boolean  // false em reduced-motion: congela rotação e parallax
}

/**
 * Renderiza o globo 3D dot-matrix (cobe) + parallax de cursor + pings aleatórios.
 *
 * cobe recebe markers apenas na criação; para animar os pings, recriamos o globo
 * a cada refresh do hook useRandomPings (2.5s) — custo de recreate é pequeno
 * porque cobe destroy() libera o canvas WebGL imediatamente.
 *
 * Export default para casar com React.lazy() do consumidor.
 */
export default function Globe3DScene({ interactive = true }: Globe3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useCursorParallax(containerRef)
  const markers = useRandomPings(interactive)

  const phiRef = useRef(0)
  const currentPhiRef = useRef(0)
  const currentThetaRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let width = container.offsetWidth

    const onResize = () => {
      if (container) width = container.offsetWidth
    }
    window.addEventListener('resize', onResize)

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width:  width * 2,
      height: width * 2,
      phi:    0,
      theta:  0.25,
      dark:          GLOBE_TOKENS.dark,
      diffuse:       GLOBE_TOKENS.diffuse,
      mapSamples:    GLOBE_TOKENS.mapSamples,
      mapBrightness: GLOBE_TOKENS.mapBrightness,
      baseColor:     GLOBE_TOKENS.baseColor,
      markerColor:   GLOBE_TOKENS.markerBrand,
      glowColor:     GLOBE_TOKENS.glowColor,
      markers,
      onRender: (state) => {
        if (interactive && !document.hidden) {
          phiRef.current += AUTO_ROTATE_SPEED
        }
        // Lerp suave entre valor atual e alvo do parallax.
        const targetPhi   = phiRef.current + parallaxRef.current.phiOffset
        const targetTheta = 0.25 + parallaxRef.current.thetaOffset
        currentPhiRef.current   += (targetPhi   - currentPhiRef.current)   * 0.08
        currentThetaRef.current += (targetTheta - currentThetaRef.current) * 0.08

        state.phi    = currentPhiRef.current
        state.theta  = currentThetaRef.current
        state.width  = width * 2
        state.height = width * 2
      },
    })

    return () => {
      window.removeEventListener('resize', onResize)
      globe.destroy()
    }
    // Recria o globo quando markers mudam (pings renovados) ou interactive muda.
  }, [markers, interactive, parallaxRef])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Globo decorativo"
        aria-hidden="true"
        style={{
          width:      '100%',
          maxWidth:   '560px',
          aspectRatio: '1',
          opacity:    0.95,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
