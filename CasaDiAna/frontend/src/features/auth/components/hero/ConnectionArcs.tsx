import { useReducedMotion } from 'framer-motion'
import { CONEXOES_HUD } from '../../lib/globeConfig'
import type { ArcoConexao } from '../../lib/globeConfig'

interface ConnectionArcsProps {
  ativo: boolean
}

/**
 * Camada HUD sobre o globo: arcos curvos entre pontos fixos da viewport com
 * partículas percorrendo cada linha (simula tráfego de dados).
 *
 * A curva é um Bézier quadrático cujo ponto de controle fica deslocado
 * perpendicularmente à linha base pelo fator `curvatura` (-1..1).
 *
 * Animação usa SMIL (`<animateMotion>` + `<mpath>`) — GPU-accelerated, zero
 * overhead de JS. Em prefers-reduced-motion, renderiza só as linhas estáticas.
 */
export function ConnectionArcs({ ativo }: ConnectionArcsProps) {
  const motionReduzido = useReducedMotion()
  if (!ativo) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {CONEXOES_HUD.map((arco) => (
          <path key={arco.id} id={`arco-${arco.id}`} d={construirBezier(arco)} />
        ))}
      </defs>

      {CONEXOES_HUD.map((arco) => (
        <g key={arco.id}>
          <use
            href={`#arco-${arco.id}`}
            stroke="rgba(56, 153, 204, 0.35)"
            strokeWidth={0.18}
            fill="none"
          />
          {!motionReduzido && (
            <circle r={0.55} fill="rgba(255, 220, 130, 0.95)">
              <animateMotion
                dur={`${arco.duracao}s`}
                repeatCount="indefinite"
                begin={`${arco.delay}s`}
                rotate="auto"
              >
                <mpath href={`#arco-${arco.id}`} />
              </animateMotion>
            </circle>
          )}
        </g>
      ))}
    </svg>
  )
}

/**
 * Gera path Bézier quadrático de (x1,y1) até (x2,y2) com ponto de controle
 * deslocado perpendicularmente ao segmento pela magnitude `curvatura`.
 */
function construirBezier(arco: ArcoConexao): string {
  const { x1, y1, x2, y2, curvatura } = arco
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const comprimento = Math.sqrt(dx * dx + dy * dy) || 1
  // Normal perpendicular (gira o vetor 90°)
  const nx = -dy / comprimento
  const ny =  dx / comprimento
  const cx = mx + nx * curvatura * comprimento
  const cy = my + ny * curvatura * comprimento
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}
