import type { ComponentType, CSSProperties, SVGProps } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline'
import type { ComparacaoPrecoIngrediente } from '@/types/estoque'

type Tendencia = ComparacaoPrecoIngrediente['tendenciaPreco']

interface Variante {
  rotulo: string
  Icone: ComponentType<SVGProps<SVGSVGElement>>
  estilo: CSSProperties
}

const VARIANTES: Partial<Record<Tendencia, Variante>> = {
  aumento: {
    rotulo: 'Aumento',
    Icone: ArrowTrendingUpIcon,
    estilo: { background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)', border: '1px solid var(--ada-error-border)' },
  },
  reducao: {
    rotulo: 'Redução',
    Icone: ArrowTrendingDownIcon,
    estilo: { background: 'var(--ada-success-bg)', color: 'var(--ada-success-text)', border: '1px solid var(--ada-success-border)' },
  },
  estavel: {
    rotulo: 'Estável',
    Icone: MinusIcon,
    estilo: { background: 'var(--ada-surface)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' },
  },
}

export function TendenciaBadge({ tendencia }: { tendencia: Tendencia }) {
  const variante = VARIANTES[tendencia]
  if (!variante) {
    return <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>Sem histórico</span>
  }
  const { rotulo, Icone, estilo } = variante
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={estilo}>
      <Icone className="h-3 w-3" />
      {rotulo}
    </span>
  )
}
