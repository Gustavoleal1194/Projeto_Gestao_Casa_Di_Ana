import type { ReactNode } from 'react'

export interface PillAtiva {
  tag: string
  valor: string
  onRemove: () => void
}

interface Props {
  de: string
  onDeChange: (v: string) => void
  ate: string
  onAteChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  submitLabel?: string
  pills?: PillAtiva[]
  children?: ReactNode
}

const XIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

function dateInputStyle(ativo: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    background: ativo ? 'linear-gradient(180deg, rgba(240,176,48,.10), rgba(212,150,12,.06))' : 'var(--ada-surface-2)',
    border: `1px solid ${ativo ? 'rgba(240,176,48,.35)' : 'var(--ada-border)'}`,
    borderRadius: 9, fontSize: 12.5, fontWeight: 500,
    color: ativo ? 'var(--ada-heading)' : 'var(--ada-muted)',
    outline: 'none', flexShrink: 0, cursor: 'pointer',
    boxShadow: ativo ? '0 0 0 1px rgba(240,176,48,.10) inset, 0 4px 12px -4px rgba(240,176,48,.35)' : 'none',
  }
}

const pillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  background: 'rgba(212,150,12,.12)', border: '1px solid rgba(240,176,48,.28)',
  borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--ada-heading)',
  overflow: 'hidden', animation: 'pillIn 250ms cubic-bezier(.34,1.56,.64,1)',
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


export function FiltrosRelatorio({
  de, onDeChange, ate, onAteChange,
  onSubmit, loading,
  submitLabel = 'Gerar Relatório',
  pills = [],
  children,
}: Props) {
  const temPillAtiva = pills.length > 0

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 24 }}>
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
        border: '1px solid var(--ada-border)', borderRadius: 20,
        boxShadow: '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 60px rgba(0,0,0,.40), 0 8px 24px rgba(0,0,0,.28)',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60px at 50% 0%, rgba(212,150,12,.10) 0%, transparent 100%)' }} aria-hidden="true" />

        {/* Chip rail */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '14px 20px', position: 'relative', borderBottom: temPillAtiva ? '1px solid var(--ada-border-sub)' : 'none' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--ada-placeholder)', flexShrink: 0, paddingRight: 6 }}>
            Filtros
          </span>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <label htmlFor="rel-de" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ada-placeholder)', flexShrink: 0 }}>De</label>
            <input id="rel-de" type="date" value={de} max={ate || undefined} onChange={e => { onDeChange(e.target.value); if (ate && e.target.value > ate) onAteChange('') }} style={dateInputStyle(!!de)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <label htmlFor="rel-ate" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ada-placeholder)', flexShrink: 0 }}>Até</label>
            <input id="rel-ate" type="date" value={ate} min={de || undefined} onChange={e => { onAteChange(e.target.value); if (de && e.target.value < de) onDeChange('') }} style={dateInputStyle(!!ate)} />
          </div>

          {/* Entity chips slot */}
          {children && (
            <>
              <span style={{ width: 1, height: 18, background: 'var(--ada-border)', flexShrink: 0, marginLeft: 4, marginRight: 4 }} aria-hidden="true" />
              {children}
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--ada-surface-2)' : 'linear-gradient(180deg, rgba(240,176,48,.22) 0%, rgba(212,150,12,.14) 100%)',
              color: loading ? 'var(--ada-muted)' : 'var(--ada-heading)',
              fontSize: 13, fontWeight: 600, fontFamily: 'Sora, system-ui, sans-serif',
              border: `1px solid ${loading ? 'var(--ada-border)' : 'rgba(240,176,48,.35)'}`,
              boxShadow: loading ? 'none' : '0 0 0 1px rgba(240,176,48,.08) inset, 0 4px 12px -4px rgba(240,176,48,.30)',
              transition: 'all 150ms ease', flexShrink: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Carregando…
              </>
            ) : submitLabel}
          </button>
        </div>

        {/* Active pills */}
        {temPillAtiva && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 20px', background: 'linear-gradient(90deg, rgba(212,150,12,.04) 0%, transparent 60%)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: '#F0B030', paddingRight: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F0B030', boxShadow: '0 0 6px rgba(240,176,48,.35)', animation: 'dotPulseFilter 2s ease infinite', flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />
              Ativos
            </span>
            {pills.map(p => (
              <span key={p.tag + p.valor} style={pillBase}>
                <span style={pillTag}>{p.tag}</span>
                <span style={{ padding: '5px 9px' }}>{p.valor}</span>
                <button type="button" onClick={p.onRemove} aria-label={`Remover filtro ${p.tag}`} style={pillClose}>
                  <XIcon />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}
