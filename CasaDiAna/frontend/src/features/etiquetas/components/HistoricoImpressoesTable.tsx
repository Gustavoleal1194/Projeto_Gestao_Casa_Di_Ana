import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Paginacao } from '@/components/ui/Paginacao'
import { destacar } from '@/utils/destacar'
import type { HistoricoImpressao, TipoEtiqueta } from '@/lib/etiquetasService'

const ITENS_POR_PAGINA = 10

const TIPO_LABELS: Record<TipoEtiqueta, string> = { 1: 'Completa', 2: 'Simples', 3: 'Nutricional' }

interface Props {
  historico: HistoricoImpressao[]
}

export function HistoricoImpressoesTable({ historico }: Props) {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoEtiqueta | 0>(0)
  const [pagina, setPagina] = useState(1)
  const [focado, setFocado] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

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
      if (!btnRef.current?.contains(e.target as Node) && !(e.target as Element).closest?.('[data-hist-dropdown]')) fechar()
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
  }, [dropdownAberto, fechar])

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return historico.filter(h => {
      if (tipoFiltro && h.tipoEtiqueta !== tipoFiltro) return false
      if (t && !h.produtoNome.toLowerCase().includes(t)) return false
      return true
    })
  }, [historico, busca, tipoFiltro])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)
  const temFiltro = !!busca || !!tipoFiltro

  const handleBusca = (v: string) => { setBusca(v); setPagina(1) }
  const handleTipo = (v: TipoEtiqueta | 0) => { setTipoFiltro(v); setDropdownAberto(false); setPagina(1) }
  const limparTudo = () => { setBusca(''); setTipoFiltro(0); setPagina(1) }

  const chipStyle = (ativo: boolean) => ({
    display: 'inline-flex' as const, alignItems: 'center' as const, gap: 7,
    padding: '7px 12px',
    background: ativo ? 'linear-gradient(180deg, rgba(240,176,48,.10), rgba(212,150,12,.06))' : 'var(--ada-surface-2)',
    border: `1px solid ${ativo ? 'rgba(240,176,48,.35)' : 'var(--ada-border)'}`,
    borderRadius: 9, fontSize: 12.5, fontWeight: 500,
    color: ativo ? 'var(--ada-heading)' : 'var(--ada-body)',
    cursor: 'pointer' as const, userSelect: 'none' as const, whiteSpace: 'nowrap' as const,
    flexShrink: 0, transition: 'all 150ms ease',
    boxShadow: ativo ? '0 0 0 1px rgba(240,176,48,.10) inset, 0 4px 12px -4px rgba(240,176,48,.35)' : 'none',
  })

  const pillStyle = {
    display: 'inline-flex' as const, alignItems: 'center' as const,
    background: 'rgba(212,150,12,.12)', border: '1px solid rgba(240,176,48,.28)',
    borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--ada-heading)',
    overflow: 'hidden', animation: 'pillIn 250ms cubic-bezier(.34,1.56,.64,1)',
  }

  const pillLabel = {
    padding: '5px 9px', fontFamily: 'ui-monospace, monospace', fontSize: 10.5,
    fontWeight: 500, color: '#F0B030', textTransform: 'uppercase' as const,
    letterSpacing: '.08em', background: 'rgba(212,150,12,.10)', borderRight: '1px solid rgba(240,176,48,.20)',
  }

  const pillRemoveBtn = {
    padding: '5px 9px 5px 4px', background: 'none', border: 'none', cursor: 'pointer' as const,
    color: 'var(--ada-muted)', display: 'flex' as const, alignItems: 'center' as const,
  }

  const xIcon = (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )

  return (
    <div className="ada-surface-card">
      {/* ── Filtro premium ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 50px at 50% 0%, rgba(212,150,12,.08) 0%, transparent 100%)' }} aria-hidden="true" />

        {/* Search row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--ada-border-sub)', position: 'relative' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
            Histórico de Impressões
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: 'var(--ada-muted)' }}>{historico.length}</span>
          </h2>
          <div
            onFocus={() => setFocado(true)} onBlur={() => setFocado(false)}
            style={{
              flex: 1, maxWidth: 300, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 40,
              background: 'var(--ada-surface-2)',
              border: `1px solid ${focado ? 'rgba(240,176,48,.45)' : 'var(--ada-border)'}`,
              borderRadius: 10, transition: 'border-color 200ms, box-shadow 200ms',
              boxShadow: focado ? '0 0 0 4px rgba(212,150,12,.10), 0 0 20px -4px rgba(240,176,48,.30)' : 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ flexShrink: 0, color: focado ? '#F0B030' : 'var(--ada-muted)', transition: 'color 200ms' }}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <label htmlFor="busca-historico" className="sr-only">Buscar produto no histórico</label>
            <input id="busca-historico" type="text" placeholder="Buscar produto…" value={busca}
              onChange={e => handleBusca(e.target.value)} autoComplete="off"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 500, color: 'var(--ada-heading)', letterSpacing: '-.005em' }}
            />
            {busca && (
              <button type="button" onClick={() => handleBusca('')} aria-label="Limpar busca"
                style={{ width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(255,255,255,.06)', color: 'var(--ada-muted)', cursor: 'pointer', flexShrink: 0 }}>
                {xIcon}
              </button>
            )}
          </div>
        </div>

        {/* Chip rail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--ada-border-sub)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--ada-placeholder)', flexShrink: 0, paddingRight: 6 }}>
            Filtros
          </span>
          <button ref={btnRef} type="button" onClick={abrirDropdown} aria-expanded={dropdownAberto} aria-haspopup="listbox"
            style={chipStyle(!!tipoFiltro)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              style={{ flexShrink: 0, color: tipoFiltro ? '#F0B030' : 'var(--ada-muted)', transition: 'color 150ms' }}>
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            {tipoFiltro ? TIPO_LABELS[tipoFiltro] : 'Tipo'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ opacity: 0.5 }} aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {dropdownAberto && createPortal(
            <div data-hist-dropdown style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999, background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', borderRadius: 12, boxShadow: '0 24px 56px rgba(0,0,0,.55), 0 8px 16px rgba(0,0,0,.3)', minWidth: 180, padding: 6, animation: 'pillIn 180ms cubic-bezier(.34,1.56,.64,1)' }}>
              {([0, 1, 2, 3] as const).map(v => {
                const label = v === 0 ? 'Todos os tipos' : TIPO_LABELS[v]
                const ativo = tipoFiltro === v
                return (
                  <button key={v} type="button" onClick={() => handleTipo(v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13, color: ativo ? 'var(--ada-heading)' : 'var(--ada-body)', cursor: 'pointer', border: 'none', background: ativo ? 'var(--ada-surface-2)' : 'none', transition: 'background 100ms', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: ativo ? 'none' : '1.5px solid var(--ada-border)', background: ativo ? '#D4960C' : 'none' }}>
                      {ativo && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0E16" strokeWidth="3" strokeLinecap="round"><path d="m4 12 5 5L20 6" /></svg>}
                    </span>
                    {label}
                  </button>
                )
              })}
            </div>,
            document.body
          )}
        </div>

        {/* Active pills */}
        {temFiltro && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 20px', background: 'linear-gradient(90deg, rgba(212,150,12,.04) 0%, transparent 60%)', borderBottom: '1px solid var(--ada-border-sub)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: '#F0B030', paddingRight: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F0B030', boxShadow: '0 0 6px rgba(240,176,48,.35)', animation: 'dotPulseFilter 2s ease infinite', flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />
              Ativos
            </span>
            {busca && (
              <span style={pillStyle}>
                <span style={pillLabel}>Busca</span>
                <span style={{ padding: '5px 9px' }}>{busca}</span>
                <button type="button" onClick={() => handleBusca('')} aria-label="Remover filtro de busca" style={pillRemoveBtn}>{xIcon}</button>
              </span>
            )}
            {tipoFiltro > 0 && (
              <span style={pillStyle}>
                <span style={pillLabel}>Tipo</span>
                <span style={{ padding: '5px 9px' }}>{TIPO_LABELS[tipoFiltro]}</span>
                <button type="button" onClick={() => { setTipoFiltro(0); setPagina(1) }} aria-label="Remover filtro de tipo" style={pillRemoveBtn}>{xIcon}</button>
              </span>
            )}
            <button type="button" onClick={limparTudo} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 500, color: 'var(--ada-muted)', letterSpacing: '.06em', padding: '5px 10px', borderRadius: 6, transition: 'color 150ms, background 150ms' }}>
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* ── Tabela ── */}
      {paginados.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--ada-muted)' }}>
          {historico.length === 0 ? 'Nenhuma impressão registrada ainda.' : 'Nenhum resultado para os filtros aplicados.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="table-head-row">
                <th className="table-th" scope="col">Produto</th>
                <th className="table-th" scope="col">Tipo</th>
                <th className="table-th" scope="col">Qtd</th>
                <th className="table-th" scope="col">Data de Produção</th>
                <th className="table-th" scope="col">Impresso em</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(h => (
                <tr key={h.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <span className="accent-bar shrink-0" aria-hidden="true" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                        {destacar(h.produtoNome, busca)}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'var(--ada-hover)', color: 'var(--ada-body)' }}>
                      {TIPO_LABELS[h.tipoEtiqueta]}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm tabular-nums" style={{ color: 'var(--ada-body)' }}>{h.quantidade}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                      {new Date(h.dataProducao).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>
                      {new Date(h.impressoEm).toLocaleString('pt-BR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacao
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        totalItens={filtrados.length}
        itensPorPagina={ITENS_POR_PAGINA}
        onPaginaChange={setPagina}
      />
    </div>
  )
}
