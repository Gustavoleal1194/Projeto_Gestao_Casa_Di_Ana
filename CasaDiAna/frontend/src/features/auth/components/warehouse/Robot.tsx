import type { BoxColor } from './types'

/** Deslocamento vertical da caixa quando o robô é forklift (alinha com as garras). */
const FORKLIFT_HOLDING_TOP = 44

interface RobotProps {
  variant: 'walker' | 'forklift'
  path: 'r1' | 'r2'
  holding: BoxColor
  /** duração do bounce (ms); o protótipo usa 380 no r1 e 420 no r2 */
  bounceMs?: number
  /** screen verde (default) ou âmbar */
  screen?: 'green' | 'amber'
  /** olhos em modo scan (apenas robô walker no protótipo) */
  scanEyes?: boolean
}

export function Robot({ variant, path, holding, bounceMs = 380, screen = 'green', scanEyes = false }: RobotProps) {
  return (
    <div className={`lr-robot ${path}`}>
      <div className="lr-bounce" style={{ animationDuration: `${bounceMs}ms` }}>
        <div className="lr-head">
          <div className="lr-eyes">
            <span className={`lr-eye${scanEyes ? ' scan' : ''}`} />
            <span className={`lr-eye${scanEyes ? ' scan' : ''}`} />
          </div>
          <div className="lr-mouth" />
        </div>
        <div className="lr-body">
          <div className={`lr-screen ok${screen === 'amber' ? ' amber' : ''}`} />
        </div>
        {variant === 'walker' ? (
          <>
            <span className="lr-arm left" />
            <span className="lr-arm right" />
          </>
        ) : (
          <div className="lr-claw" />
        )}
        <div
          className={`lr-holding b-${holding}`}
          style={variant === 'forklift' ? { top: FORKLIFT_HOLDING_TOP } : undefined}
        />
        <div className="lr-base" />
        <div className="lr-trail" />
      </div>
    </div>
  )
}
