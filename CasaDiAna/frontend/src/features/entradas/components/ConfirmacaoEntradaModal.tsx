// frontend/src/features/entradas/components/ConfirmacaoEntradaModal.tsx
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface ItemConfirmacaoEntrada {
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoTotal: number
}

export interface DadosConfirmacaoEntrada {
  fornecedorNome: string
  numeroNotaFiscal: string | null
  custoTotal: number
  horario: string
  itens: ItemConfirmacaoEntrada[]
}

interface Props {
  aberto: boolean
  onFechar: () => void
  onVerEntradas: () => void
  dados: DadosConfirmacaoEntrada
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
        fill="#FFFBEB"
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

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ConfirmacaoEntradaModal({ aberto, onFechar, onVerEntradas, dados }: Props) {
  const countValue = useCountUp(dados.custoTotal, 1100, aberto)
  if (!aberto) return null

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
          width: '100%', maxWidth: 480,
          background: 'var(--ada-surface)',
          border: '1px solid var(--ada-border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 64px rgba(7,16,30,0.20), 0 8px 20px rgba(7,16,30,0.10)',
          animation: 'cardIn 350ms cubic-bezier(0.34,1.4,0.64,1) both',
          position: 'relative',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #D4960C, #B87D0A)' }} />

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
          {/* Header */}
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
                Entrada registrada
              </div>
              <div style={{
                fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 700,
                color: 'var(--ada-heading)', letterSpacing: '-0.02em',
                animation: 'fadeUp 300ms 400ms ease both',
              }}>
                R$ {fmt(countValue)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ada-muted)', marginTop: 4, animation: 'fadeIn 300ms 900ms ease both' }}>
                {dados.fornecedorNome} · {dados.horario}
              </div>
            </div>
          </div>

          {/* Tabela de itens */}
          <div style={{
            background: 'var(--ada-surface-2)', border: '1px solid var(--ada-border)',
            borderRadius: 12, padding: '4px 16px', marginBottom: 16,
            animation: 'fadeUp 300ms 550ms ease both',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0 6px',
              fontSize: 10.5, fontWeight: 600, fontFamily: 'Sora, system-ui, sans-serif',
              color: 'var(--ada-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: '1px solid var(--ada-border-sub)',
            }}>
              <span style={{ flex: 1 }}>Ingrediente</span>
              <span style={{ width: 72, textAlign: 'right' }}>Qtd</span>
              <span style={{ width: 80, textAlign: 'right' }}>Total</span>
            </div>
            {dados.itens.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0',
                borderBottom: i < dados.itens.length - 1 ? '1px solid var(--ada-border-sub)' : undefined,
              }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ada-heading)' }}>
                  {item.ingredienteNome}
                </span>
                <span style={{ width: 72, textAlign: 'right', fontSize: 13, color: 'var(--ada-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {item.quantidade} {item.unidadeMedidaCodigo}
                </span>
                <span style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums', fontFamily: 'Sora, system-ui, sans-serif' }}>
                  R$ {fmt(item.custoTotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div style={{
            background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
            borderRadius: 12, padding: '6px 16px', marginBottom: 20,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 0', animation: 'fadeUp 350ms 900ms ease both',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>Total</span>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: 'var(--ada-heading)', fontVariantNumeric: 'tabular-nums' }}>R$ {fmt(dados.custoTotal)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 0', animation: 'fadeUp 350ms 960ms ease both',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>Fornecedor</span>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: 'var(--ada-heading)' }}>{dados.fornecedorNome}</span>
            </div>
            {dados.numeroNotaFiscal && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', animation: 'fadeUp 350ms 1020ms ease both',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>Nota Fiscal</span>
                <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: 'var(--ada-heading)' }}>{dados.numeroNotaFiscal}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--ada-border-sub)', marginTop: 4, paddingTop: 4 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', animation: 'fadeUp 350ms 1080ms ease both',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 400 }}>Estoque atualizado automaticamente</span>
                <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600, color: '#D4960C' }}>✓</span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, animation: 'fadeUp 300ms 1100ms ease both' }}>
            <button type="button" onClick={onFechar} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'var(--ada-heading)', background: 'var(--ada-surface-2)',
              border: '1px solid var(--ada-border)', cursor: 'pointer',
            }}>
              Nova Entrada
            </button>
            <button type="button" onClick={onVerEntradas} style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              fontFamily: 'Sora, system-ui, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #D4960C, #B87D0A)',
              border: 0, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,150,12,0.30)',
            }}>
              Ver Entradas →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
