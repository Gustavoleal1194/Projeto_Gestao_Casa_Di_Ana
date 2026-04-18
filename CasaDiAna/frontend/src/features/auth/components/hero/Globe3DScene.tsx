import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import {
  AUTO_ROTATE_SPEED,
  DRAG_SENSITIVITY,
  GLOBE_NODES,
  GLOBE_TOKENS,
  THETA_MAX,
} from '../../lib/globeConfig'
import { useCursorParallax } from '../../hooks/useCursorParallax'

export interface RotacaoGlobo {
  phi: number
  theta: number
}

interface Globe3DSceneProps {
  interactive?: boolean  // false em reduced-motion: congela rotação e parallax
  rotationRef?: RefObject<RotacaoGlobo>  // exposto pra NeuralMesh rotacionar junto
}

/**
 * Renderiza o globo 3D dot-matrix (cobe) + parallax + drag.
 *
 * Os markers são nós gerados deterministicamente na esfera (GLOBE_NODES) —
 * como a referência é estável, o globo é criado uma única vez e vive o ciclo
 * todo do componente (sem recriação periódica).
 *
 * Durante arrasto (pointerdown → pointermove → pointerup), auto-rotação e
 * parallax ficam suspensos; ao soltar, retomam naturalmente.
 *
 * Export default para casar com React.lazy() do consumidor.
 */
export default function Globe3DScene({ interactive = true, rotationRef }: Globe3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useCursorParallax(containerRef)

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
      markers:       GLOBE_NODES,
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

        // Expõe rotação atual para a malha neural rotacionar em sincronia
        if (rotationRef?.current) {
          rotationRef.current.phi   = currentPhiRef.current
          rotationRef.current.theta = currentThetaRef.current
        }
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
    // Recria apenas quando o modo interactive muda — markers são estáticos.
  }, [interactive, parallaxRef, rotationRef])

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
