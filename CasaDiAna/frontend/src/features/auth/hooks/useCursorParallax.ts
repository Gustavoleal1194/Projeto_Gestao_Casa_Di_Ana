import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { PARALLAX_MAX_DELTA } from '../lib/globeConfig'

export interface ParallaxDelta {
  phiOffset: number
  thetaOffset: number
}

/**
 * Retorna uma ref mutável com o offset alvo de phi/theta baseado na posição
 * do cursor dentro do elemento `containerRef`. Consumidores aplicam lerp
 * para suavizar a transição ao valor alvo.
 *
 * Honra prefers-reduced-motion — quando ativo, o offset fica sempre em zero.
 */
export function useCursorParallax(
  containerRef: RefObject<HTMLElement | null>,
): RefObject<ParallaxDelta> {
  const deltaRef = useRef<ParallaxDelta>({ phiOffset: 0, thetaOffset: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const motionReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motionReduzido) {
      deltaRef.current = { phiOffset: 0, thetaOffset: 0 }
      return
    }

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width  // 0..1
      const y = (e.clientY - rect.top) / rect.height  // 0..1
      const normX = x * 2 - 1   // -1..1
      const normY = y * 2 - 1   // -1..1

      deltaRef.current = {
        phiOffset:   normX * PARALLAX_MAX_DELTA,
        thetaOffset: normY * PARALLAX_MAX_DELTA,
      }
    }

    const handleLeave = () => {
      deltaRef.current = { phiOffset: 0, thetaOffset: 0 }
    }

    container.addEventListener('mousemove', handleMove)
    container.addEventListener('mouseleave', handleLeave)

    return () => {
      container.removeEventListener('mousemove', handleMove)
      container.removeEventListener('mouseleave', handleLeave)
    }
  }, [containerRef])

  return deltaRef
}
