import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import { AUTO_ROTATE_SPEED, DRAG_SENSITIVITY, GLOBE_TOKENS, THETA_MAX } from '../../lib/globeConfig'
import { useCursorParallax } from '../../hooks/useCursorParallax'
import { useRandomPings } from '../../hooks/useRandomPings'

interface Globe3DSceneProps {
  interactive?: boolean  // false em reduced-motion: congela rotação e parallax
}

/**
 * Renderiza o globo 3D dot-matrix (cobe) + parallax de cursor + drag + pings.
 *
 * cobe recebe markers apenas na criação; para animar os pings, recriamos o globo
 * a cada refresh do hook useRandomPings (2.5s) — custo de recreate é pequeno
 * porque cobe destroy() libera o canvas WebGL imediatamente.
 *
 * Durante arrasto (pointerdown → pointermove → pointerup), a auto-rotação e o
 * parallax são suspensos; ao soltar, retomam.
 *
 * Export default para casar com React.lazy() do consumidor.
 */
export default function Globe3DScene({ interactive = true }: Globe3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useCursorParallax(containerRef)
  const markers = useRandomPings(interactive)

  const phiRef = useRef(0)
  const thetaOffsetRef = useRef(0)  // offset acumulado pelo drag vertical
  const currentPhiRef = useRef(0)
  const currentThetaRef = useRef(0)
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })

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
        const arrastando = draggingRef.current
        if (interactive && !document.hidden && !arrastando) {
          phiRef.current += AUTO_ROTATE_SPEED
        }
        // Parallax só atua quando NÃO está arrastando (evita competição).
        const phiParallax   = arrastando ? 0 : parallaxRef.current.phiOffset
        const thetaParallax = arrastando ? 0 : parallaxRef.current.thetaOffset
        const targetPhi   = phiRef.current + phiParallax
        const targetTheta = 0.25 + thetaOffsetRef.current + thetaParallax
        currentPhiRef.current   += (targetPhi   - currentPhiRef.current)   * 0.08
        currentThetaRef.current += (targetTheta - currentThetaRef.current) * 0.08

        state.phi    = currentPhiRef.current
        state.theta  = currentThetaRef.current
        state.width  = width * 2
        state.height = width * 2
      },
    })

    canvas.style.cursor = interactive ? 'grab' : 'default'

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return
      draggingRef.current = true
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const { x: lx, y: ly } = lastPointerRef.current
      const dx = e.clientX - lx
      const dy = e.clientY - ly
      phiRef.current += dx * DRAG_SENSITIVITY
      thetaOffsetRef.current = Math.max(
        -THETA_MAX,
        Math.min(THETA_MAX, thetaOffsetRef.current + dy * DRAG_SENSITIVITY),
      )
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId)
      }
      canvas.style.cursor = interactive ? 'grab' : 'default'
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
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
          width:       '100%',
          maxWidth:    '560px',
          aspectRatio: '1',
          opacity:     0.95,
          pointerEvents: interactive ? 'auto' : 'none',
          touchAction:   'none',
        }}
      />
    </div>
  )
}
