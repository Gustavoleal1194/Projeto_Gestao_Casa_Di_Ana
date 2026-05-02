import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface DadosConfirmacaoFinalizacaoInventario {
  totalItens: number
  horario: string
}

interface Props {
  aberto: boolean
  onFechar: () => void
  dados: DadosConfirmacaoFinalizacaoInventario
}

function useCountUp(target: number, duration: number, enabled: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    setValue(0)
    let start: number | null = null
    let rafId: number
    let cancelled = false
    const step = (ts: number) => {
      if (cancelled) return
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setValue(target)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, enabled])
  return value
}

function CheckMarkAmbar({ delay = 100 }: { delay?: number }) {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" fill="transparent"
        stroke="#D4960C" strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: `ripple 900ms ${delay + 200}ms ease-out both` }} />
      <circle cx="36" cy="36" r="26"
        stroke="#D4960C" strokeWidth="2.5" fill="transparent"
        strokeDasharray="163" strokeDashoffset="163"
        style={{ animation: `circleDraw 600ms ${delay}ms cubic-bezier(.4,0,.2,1) both` }} />
      <circle cx="36" cy="36" r="24"
        fill="rgba(212,150,12,.15)"
        style={{ animation: `fadeIn 150ms ${delay + 400}ms ease both` }} />
      <path d="M22 37l9 9 19-19"
        stroke="#D4960C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
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
          width: 7, height: 7, background: '#D4960C', borderRadius: 2,
          transformOrigin: 'center',
          animation: `sparkle 600ms ${delay + i * 80}ms ease both`,
        }} />
      ))}
    </>
  )
}

export function ConfirmacaoFinalizacaoInventarioModal({ aberto, onFechar, dados }: Props) {
  const countItens = useCountUp(dados.totalItens, 900, aberto)
  if (!aberto) return null

  const chips = [
    { label: 'Itens contados', value: `${Math.round(countItens).toLocaleString('pt-BR')}` },
    { label: 'Horário', value: dados.horario },
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
        <div style={{ height: 4, background: 'linear-gradient(90deg, #D4960C, #E8A520)' }} />

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
                <CheckMarkAmbar delay={100} />
              </div>
              <Sparkles delay={700} />
            </div>
            <div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D4960C',
                marginBottom: 4, animation: 'fadeIn 300ms 700ms ease both',
              }}>
                Inventário finalizado
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                {Math.round(countItens).toLocaleString('pt-BR')} itens
              </div>
              <div style={{ fontSize: 12, color: 'var(--ada-muted)', marginTop: 4, animation: 'fadeIn 300ms 900ms ease both' }}>
                contagem encerrada · {dados.horario}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 20,
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
                <div style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--ada-warning-bg)', border: '1px solid var(--ada-warning-border)',
            marginBottom: 20,
            animation: 'fadeUp 280ms 1000ms ease both',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              strokeWidth="1.8" strokeLinecap="round"
              style={{ flexShrink: 0, marginTop: 1, stroke: 'var(--ada-warning-text)' }}>
              <path d="M13 16h-1v-4h-1m1-4h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, color: 'var(--ada-warning-text)', lineHeight: 1.45 }}>
              Estoque ajustado automaticamente com base nas contagens registradas.
            </span>
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
            <button type="button" onClick={onFechar} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #D4960C, #B87D0A)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,150,12,0.30)',
            }}>
              Ver Inventário →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
