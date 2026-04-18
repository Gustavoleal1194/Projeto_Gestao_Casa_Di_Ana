import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useHeroMode } from '../../hooks/useHeroMode'
import { BrandBlock } from './BrandBlock'
import { Globe3DFallback } from './Globe3DFallback'
import { GlowHalo } from './GlowHalo'
import { MobileHeroFallback } from './MobileHeroFallback'
import { NeuralMesh } from './NeuralMesh'
import { ParticleField } from './ParticleField'
import { ScanLine } from './ScanLine'

const Globe3DScene = lazy(() => import('./Globe3DScene'))

interface HeroErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}
interface HeroErrorBoundaryState {
  hasError: boolean
}

class HeroErrorBoundary extends Component<HeroErrorBoundaryProps, HeroErrorBoundaryState> {
  state: HeroErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): HeroErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error('[LoginHeroPanel] falha ao renderizar globo:', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * Painel esquerdo da tela de login. Decide entre globo 3D, fallback estático
 * 2D ou versão reduzida com base em useHeroMode. Em mobile (<lg) o componente
 * pai não renderiza este painel.
 */
export function LoginHeroPanel() {
  const modo = useHeroMode()

  return (
    <div
      className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0D1117 0%, #111827 100%)' }}
    >
      {/* Camadas decorativas em background.
          Ordem: halo (fundo) → globo → malha neural → partículas → scan → marca (topo) */}
      {modo === 'desktop-3d' && (
        <>
          <GlowHalo ativo={true} />
          <HeroErrorBoundary fallback={<Globe3DFallback />}>
            <Suspense fallback={<Globe3DFallback />}>
              <Globe3DScene interactive={true} />
            </Suspense>
          </HeroErrorBoundary>
          <NeuralMesh ativo={true} />
          <ParticleField ativo={true} />
          <ScanLine ativo={true} />
        </>
      )}

      {modo === 'reduced-motion' && (
        <HeroErrorBoundary fallback={<Globe3DFallback />}>
          <Suspense fallback={<Globe3DFallback />}>
            <Globe3DScene interactive={false} />
          </Suspense>
        </HeroErrorBoundary>
      )}

      {modo === 'desktop-2d-fallback' && <MobileHeroFallback />}

      {/* Conteúdo de marca em primeiro plano */}
      <BrandBlock />
    </div>
  )
}
