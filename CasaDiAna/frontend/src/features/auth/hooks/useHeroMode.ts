import { useEffect, useState } from 'react'

export type HeroMode =
  | 'desktop-3d'            // globo 3D completo
  | 'desktop-2d-fallback'   // desktop sem WebGL — SVG
  | 'reduced-motion'        // honra prefers-reduced-motion
  | 'hidden'                // viewport < lg (painel esquerdo some)

function webglDisponivel(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return gl !== null
  } catch {
    return false
  }
}

function calcularModo(): HeroMode {
  if (typeof window === 'undefined') return 'hidden'

  const desktop = window.matchMedia('(min-width: 1024px)').matches
  if (!desktop) return 'hidden'

  const motionReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (motionReduzido) return 'reduced-motion'

  if (!webglDisponivel()) return 'desktop-2d-fallback'

  return 'desktop-3d'
}

export function useHeroMode(): HeroMode {
  const [modo, setModo] = useState<HeroMode>(() => calcularModo())

  useEffect(() => {
    const atualizar = () => setModo(calcularModo())

    const mediaDesktop = window.matchMedia('(min-width: 1024px)')
    const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    mediaDesktop.addEventListener('change', atualizar)
    mediaMotion.addEventListener('change', atualizar)

    return () => {
      mediaDesktop.removeEventListener('change', atualizar)
      mediaMotion.removeEventListener('change', atualizar)
    }
  }, [])

  return modo
}
