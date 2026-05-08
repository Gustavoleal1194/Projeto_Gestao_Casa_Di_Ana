import { useState } from 'react'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  apenasAbaixo: boolean
  onApenasAbaixoChange: (v: boolean) => void
}

const XIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const pillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', background: 'rgba(212,150,12,.12)',
  border: '1px solid rgba(240,176,48,.28)', borderRadius: 8, fontSize: 12, fontWeight: 500,
  color: 'var(--ada-heading)', overflow: 'hidden', animation: 'pillIn 250ms cubic-bezier(.34,1.56,.64,1)',
}
const pillTag: React.CSSProperties = {
  padding: '5px 9px', fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500,
  color: '#F0B030', textTransform: 'uppercase', letterSpacing: '.08em',
  background: 'rgba(212,150,12,.10)', borderRight: '1px solid rgba(240,176,48,.20)',
}
const pillClose: React.CSSProperties = {
  padding: '5px 9px 5px 4px', background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--ada-muted)', display: 'flex', alignItems: 'center', transition: 'color 150ms',
}

export function FiltrosEstoqueAtual({ busca, onBuscaChange, apenasAbaixo, onApenasAbaixoChange }: Props) {
  const [focado, setFocado] = useState(false)
  const temFiltroAtivo = !!busca || apenasAbaixo

  const limparTudo = () => { onBuscaChange(''); onApenasAbaixoChange(false) }

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
      border: '1px solid var(--ada-border)', borderRadius: 20,
      boxShadow: '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 60px rgba(0,0,0,.40), 0 8px 24px rgba(0,0,0,.28)',
      marginBottom: 24,
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60px at 50% 0%, rgba(212,150,12,.10) 0%, transparent 100%)' }} aria-hidden="true" />

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--ada-border-sub)', position: 'relative' }}>
        <div onFocus={() => setFocado(true)} onBlur={() => setFocado(false)} style={{
          position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 14px', height: 48, background: 'var(--ada-surface-2)',
          border: `1px solid ${focado ? 'rgba(240,176,48,.45)' : 'var(--ada-border)'}`, borderRadius: 12,
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
          boxShadow: focado ? '0 0 0 4px rgba(212,150,12,.10), 0 0 24px -4px rgba(240,176,48,.35)' : 'none',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: focado ? '#F0B030' : 'var(--ada-muted)', transition: 'color 200ms ease' }} aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="busca-estoque-atual" className="sr-only">Buscar ingrediente</label>
          <input id="busca-estoque-atual" type="text" placeholder="Buscar por ingrediente ou categoria…" value={busca} onChange={e => onBuscaChange(e.target.value)} autoComplete="off" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14.5, fontWeight: 500, color: 'var(--ada-heading)', letterSpacing: '-.005em', height: '100%' }} />
          {busca && (
            <button type="button" onClick={() => onBuscaChange('')} aria-label="Limpar busca" style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(255,255,255,.06)', color: 'var(--ada-muted)', cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}>
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Chip rail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--ada-border-sub)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--ada-placeholder)', flexShrink: 0, paddingRight: 6 }}>Filtros</span>

        <button type="button" onClick={() => onApenasAbaixoChange(!apenasAbaixo)} aria-pressed={apenasAbaixo} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px',
          background: apenasAbaixo ? 'linear-gradient(180deg, rgba(240,176,48,.10), rgba(212,150,12,.06))' : 'var(--ada-surface-2)',
          border: `1px solid ${apenasAbaixo ? 'rgba(240,176,48,.35)' : 'var(--ada-border)'}`, borderRadius: 9,
          fontSize: 12.5, fontWeight: 500, color: apenasAbaixo ? 'var(--ada-heading)' : 'var(--ada-body)',
          cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 150ms ease',
          boxShadow: apenasAbaixo ? '0 0 0 1px rgba(240,176,48,.10) inset, 0 4px 12px -4px rgba(240,176,48,.35)' : 'none',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: apenasAbaixo ? '#F0B030' : 'var(--ada-muted)', transition: 'color 150ms' }} aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Abaixo do mínimo
        </button>
      </div>

      {/* Active pills */}
      {temFiltroAtivo && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 20px', background: 'linear-gradient(90deg, rgba(212,150,12,.04) 0%, transparent 60%)', borderBottom: '1px solid var(--ada-border-sub)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: '#F0B030', paddingRight: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F0B030', boxShadow: '0 0 6px rgba(240,176,48,.35)', animation: 'dotPulseFilter 2s ease infinite', flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />
            Ativos
          </span>
          {busca && (
            <span style={pillBase}>
              <span style={pillTag}>Busca</span>
              <span style={{ padding: '5px 9px' }}>{busca}</span>
              <button type="button" onClick={() => onBuscaChange('')} aria-label="Remover filtro de busca" style={pillClose}><XIcon /></button>
            </span>
          )}
          {apenasAbaixo && (
            <span style={pillBase}>
              <span style={pillTag}>Estoque</span>
              <span style={{ padding: '5px 9px' }}>Abaixo do mínimo</span>
              <button type="button" onClick={() => onApenasAbaixoChange(false)} aria-label="Remover filtro de estoque abaixo do mínimo" style={pillClose}><XIcon /></button>
            </span>
          )}
          <button type="button" onClick={limparTudo} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 500, color: 'var(--ada-muted)', letterSpacing: '.06em', padding: '5px 10px', borderRadius: 6, transition: 'color 150ms, background 150ms' }}>
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}
