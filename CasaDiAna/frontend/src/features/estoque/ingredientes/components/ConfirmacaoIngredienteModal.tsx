import type { CSSProperties } from 'react'

export interface DadosConfirmacaoIngrediente {
  ingredienteNome: string
  unidade: string
  modo: 'criado' | 'atualizado'
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerIngredientes: () => void
  dados: DadosConfirmacaoIngrediente
}

function CheckMarkVerde({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#16A34A" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#16A34A" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="#F0FDF4"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: `checkDraw 350ms ${delay + 500}ms cubic-bezier(.4,0,.2,1) both` }} />
    </svg>
  )
}

const SPARKLE_POS: CSSProperties[] = [
  { top: -14, left: 14 },
  { top: 2, right: -16 },
  { bottom: 0, left: -18 },
  { top: -10, right: 4 },
  { bottom: 4, right: -12 },
]

function Sparkles({ delay = 800 }: { delay?: number }) {
  return (
    <>
      {SPARKLE_POS.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 7, height: 7, background: '#16A34A', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoIngredienteModal({ aberto, onFechar, onVerIngredientes, dados }: Props) {
  if (!aberto) return null

  const chips = [
    { label: 'Unidade de medida', value: dados.unidade || '—' },
    { label: 'Status', value: dados.modo === 'criado' ? 'Novo ingrediente' : 'Atualizado' },
  ]

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(7,16,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'overlayIn 200ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #16A34A, #22C55E)' }} />

        <button type="button" onClick={onFechar} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--ada-border)',
          color: 'var(--ada-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, animation: 'fadeUp 300ms 50ms ease both' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ animation: 'float 3000ms 1000ms ease-in-out infinite' }}>
                <CheckMarkVerde delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#16A34A',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Ingrediente {dados.modo}
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 20, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {dados.ingredienteNome}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 28,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            {chips.map(chip => (
              <div key={chip.label} style={{
                background: 'var(--ada-surface-2)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ada-muted)', marginBottom: 6 }}>
                  {chip.label}
                </div>
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--ada-heading)', letterSpacing: '-0.01em' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Fechar
            </button>
            <button type="button" onClick={onVerIngredientes} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #16A34A, #15803D)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.30)',
            }}>
              Ver Ingredientes →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
