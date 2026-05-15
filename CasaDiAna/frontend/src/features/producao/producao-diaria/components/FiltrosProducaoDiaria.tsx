import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ProdutoResumo } from '@/types/producao'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  de: string
  onDeChange: (v: string) => void
  ate: string
  onAteChange: (v: string) => void
  produtoId: string
  onProdutoChange: (v: string) => void
  produtos: ProdutoResumo[]
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

function fmtData(v: string) {
  if (!v) return ''
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

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

export function FiltrosProducaoDiaria({
  busca, onBuscaChange, de, onDeChange, ate, onAteChange, produtoId, onProdutoChange, produtos,
}: Props) {
  const [focado, setFocado] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const temFiltroAtivo = !!busca || !!de || !!ate || !!produtoId
  const produtoSelecionado = produtos.find(p => p.id === produtoId)

  const fechar = useCallback(() => setDropdownAberto(false), [])

  const abrirDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 6, left: r.left })
    }
    setDropdownAberto(d => !d)
  }

  useEffect(() => {
    if (!dropdownAberto) return
    const handle = (e: MouseEvent) => {
      const target = e.target as Node
      if (!btnRef.current?.contains(target) && !(e.target as Element).closest?.('[data-filtros-dropdown]')) fechar()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    const handleScroll = (e: Event) => {
      if ((e.target as Element)?.closest?.('[data-filtros-dropdown]')) return
      fechar()
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handleKey)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [dropdownAberto, fechar])

  const limparTudo = () => { onBuscaChange(''); onDeChange(''); onAteChange(''); onProdutoChange('') }

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
          <label htmlFor="busca-producao" className="sr-only">Buscar produção</label>
          <input id="busca-producao" type="text" placeholder="Buscar por produto ou observações…" value={busca} onChange={e => onBuscaChange(e.target.value)} autoComplete="off" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14.5, fontWeight: 500, color: 'var(--ada-heading)', letterSpacing: '-.005em', height: '100%' }} />
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <label htmlFor="producao-de" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ada-placeholder)', flexShrink: 0 }}>De</label>
          <input id="producao-de" type="date" value={de} onChange={e => onDeChange(e.target.value)} style={dateInputStyle(!!de)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <label htmlFor="producao-ate" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ada-placeholder)', flexShrink: 0 }}>Até</label>
          <input id="producao-ate" type="date" value={ate} onChange={e => onAteChange(e.target.value)} style={dateInputStyle(!!ate)} />
        </div>

        <span style={{ width: 1, height: 18, background: 'var(--ada-border)', flexShrink: 0, marginLeft: 4, marginRight: 4 }} aria-hidden="true" />

        {/* Produto chip */}
        <div style={{ position: 'relative' }}>
          <button ref={btnRef} type="button" onClick={abrirDropdown} aria-expanded={dropdownAberto} aria-haspopup="listbox" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px',
            background: produtoId ? 'linear-gradient(180deg, rgba(240,176,48,.10), rgba(212,150,12,.06))' : 'var(--ada-surface-2)',
            border: `1px solid ${produtoId ? 'rgba(240,176,48,.35)' : 'var(--ada-border)'}`, borderRadius: 9,
            fontSize: 12.5, fontWeight: 500, color: produtoId ? 'var(--ada-heading)' : 'var(--ada-body)',
            cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 150ms ease',
            boxShadow: produtoId ? '0 0 0 1px rgba(240,176,48,.10) inset, 0 4px 12px -4px rgba(240,176,48,.35)' : 'none',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: produtoId ? '#F0B030' : 'var(--ada-muted)', transition: 'color 150ms' }} aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            {produtoSelecionado ? produtoSelecionado.nome : 'Produto'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ opacity: 0.5 }} aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {dropdownAberto && createPortal(
            <div data-filtros-dropdown style={{
              position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999,
              background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', borderRadius: 12,
              boxShadow: '0 24px 56px rgba(0,0,0,.55), 0 8px 16px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.04) inset',
              minWidth: 220, maxHeight: 320, overflowY: 'auto', padding: 6, animation: 'pillIn 180ms cubic-bezier(.34,1.56,.64,1)',
            }}>
              <button type="button" onClick={() => { onProdutoChange(''); setDropdownAberto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13, color: !produtoId ? 'var(--ada-heading)' : 'var(--ada-body)', cursor: 'pointer', border: 'none', background: !produtoId ? 'var(--ada-surface-2)' : 'none', transition: 'background 100ms', fontFamily: 'inherit', textAlign: 'left' }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: !produtoId ? 'none' : '1.5px solid var(--ada-border)', background: !produtoId ? '#D4960C' : 'none' }}>
                  {!produtoId && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0E16" strokeWidth="3" strokeLinecap="round"><path d="m4 12 5 5L20 6" /></svg>}
                </span>
                Todos os produtos
              </button>
              {produtos.filter(p => p.ativo).map(p => (
                <button type="button" key={p.id} onClick={() => { onProdutoChange(p.id); setDropdownAberto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13, color: produtoId === p.id ? 'var(--ada-heading)' : 'var(--ada-body)', cursor: 'pointer', border: 'none', background: produtoId === p.id ? 'var(--ada-surface-2)' : 'none', transition: 'background 100ms', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: produtoId === p.id ? 'none' : '1.5px solid var(--ada-border)', background: produtoId === p.id ? '#D4960C' : 'none' }}>
                    {produtoId === p.id && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0E16" strokeWidth="3" strokeLinecap="round"><path d="m4 12 5 5L20 6" /></svg>}
                  </span>
                  {p.nome}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
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
          {de && (
            <span style={pillBase}>
              <span style={pillTag}>De</span>
              <span style={{ padding: '5px 9px' }}>{fmtData(de)}</span>
              <button type="button" onClick={() => onDeChange('')} aria-label="Remover data inicial" style={pillClose}><XIcon /></button>
            </span>
          )}
          {ate && (
            <span style={pillBase}>
              <span style={pillTag}>Até</span>
              <span style={{ padding: '5px 9px' }}>{fmtData(ate)}</span>
              <button type="button" onClick={() => onAteChange('')} aria-label="Remover data final" style={pillClose}><XIcon /></button>
            </span>
          )}
          {produtoSelecionado && (
            <span style={pillBase}>
              <span style={pillTag}>Produto</span>
              <span style={{ padding: '5px 9px' }}>{produtoSelecionado.nome}</span>
              <button type="button" onClick={() => onProdutoChange('')} aria-label="Remover filtro de produto" style={pillClose}><XIcon /></button>
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
