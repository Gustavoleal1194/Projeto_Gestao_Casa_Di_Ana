import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Opcao {
  valor: string
  rotulo: string
}

interface Props {
  label: string
  valorAtivo: string
  opcoes: Opcao[]
  onChange: (v: string) => void
  icon?: React.ReactNode
}

export function EntityChipDropdown({ label, valorAtivo, opcoes, onChange, icon }: Props) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const fechar = useCallback(() => setAberto(false), [])

  const toggle = () => {
    if (!aberto && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
    setAberto(v => !v)
  }

  useEffect(() => {
    if (!aberto) return
    const handle = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !(e.target as Element).closest?.('[data-entity-dropdown]')) fechar()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handleKey)
    document.addEventListener('scroll', fechar, true)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('scroll', fechar, true)
    }
  }, [aberto, fechar])

  const rotuloAtivo = opcoes.find(o => o.valor === valorAtivo)?.rotulo ?? label

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px',
          background: valorAtivo ? 'linear-gradient(180deg, rgba(240,176,48,.10), rgba(212,150,12,.06))' : 'var(--ada-surface-2)',
          border: `1px solid ${valorAtivo ? 'rgba(240,176,48,.35)' : 'var(--ada-border)'}`, borderRadius: 9,
          fontSize: 12.5, fontWeight: 500, color: valorAtivo ? 'var(--ada-heading)' : 'var(--ada-body)',
          cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 150ms ease',
          boxShadow: valorAtivo ? '0 0 0 1px rgba(240,176,48,.10) inset, 0 4px 12px -4px rgba(240,176,48,.35)' : 'none',
        }}
      >
        {icon && (
          <span style={{ flexShrink: 0, color: valorAtivo ? '#F0B030' : 'var(--ada-muted)', transition: 'color 150ms', display: 'flex' }}>
            {icon}
          </span>
        )}
        {rotuloAtivo}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ opacity: 0.5 }} aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && createPortal(
        <div data-entity-dropdown style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
          background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', borderRadius: 12,
          boxShadow: '0 24px 56px rgba(0,0,0,.55), 0 8px 16px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.04) inset',
          minWidth: 200, maxHeight: 320, overflowY: 'auto', padding: 6,
          animation: 'pillIn 180ms cubic-bezier(.34,1.56,.64,1)',
        }}>
          {opcoes.map(opt => (
            <button
              key={opt.valor}
              type="button"
              onClick={() => { onChange(opt.valor); fechar() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 10px',
                borderRadius: 7, fontSize: 13, fontFamily: 'inherit', textAlign: 'left', border: 'none',
                color: valorAtivo === opt.valor ? 'var(--ada-heading)' : 'var(--ada-body)',
                background: valorAtivo === opt.valor ? 'var(--ada-surface-2)' : 'none',
                cursor: 'pointer', transition: 'background 100ms',
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: valorAtivo === opt.valor ? 'none' : '1.5px solid var(--ada-border)',
                background: valorAtivo === opt.valor ? '#D4960C' : 'none',
              }}>
                {valorAtivo === opt.valor && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0E16" strokeWidth="3" strokeLinecap="round">
                    <path d="m4 12 5 5L20 6" />
                  </svg>
                )}
              </span>
              {opt.rotulo}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
