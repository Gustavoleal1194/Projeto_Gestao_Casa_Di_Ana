import { useState, useRef, useEffect } from 'react'
import type { CategoriaProduto } from '@/types/producao'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
  categoriaId: string
  onCategoriaChange: (v: string) => void
  categorias: CategoriaProduto[]
}

export function FiltrosProdutos({
  busca,
  onBuscaChange,
  categoriaId,
  onCategoriaChange,
  categorias,
}: Props) {
  const [focado, setFocado] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  const temFiltroAtivo = !!busca || !!categoriaId
  const catSelecionada = categorias.find(c => c.id === categoriaId)

  useEffect(() => {
    if (!dropdownAberto) return
    const handle = (e: MouseEvent) => {
      if (!chipRef.current?.contains(e.target as Node)) setDropdownAberto(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [dropdownAberto])

  const limparTudo = () => { onBuscaChange(''); onCategoriaChange('') }

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
        border: '1px solid var(--ada-border)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow:
          '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 60px rgba(0,0,0,.40), 0 8px 24px rgba(0,0,0,.28)',
        marginBottom: 24,
      }}
    >
      {/* Amber top glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 80% 60px at 50% 0%, rgba(212,150,12,.10) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Top row — search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          borderBottom: '1px solid var(--ada-border-sub)',
          position: 'relative',
        }}
      >
        <div
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 14px',
            height: 48,
            background: 'var(--ada-surface-2)',
            border: `1px solid ${focado ? 'rgba(240,176,48,.45)' : 'var(--ada-border)'}`,
            borderRadius: 12,
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            boxShadow: focado
              ? '0 0 0 4px rgba(212,150,12,.10), 0 0 24px -4px rgba(240,176,48,.35)'
              : 'none',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              flexShrink: 0,
              color: focado ? '#F0B030' : 'var(--ada-muted)',
              transition: 'color 200ms ease',
            }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="busca-produto" className="sr-only">
            Buscar produto
          </label>
          <input
            id="busca-produto"
            type="text"
            placeholder="Buscar por nome…"
            value={busca}
            onChange={e => onBuscaChange(e.target.value)}
            autoComplete="off"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14.5,
              fontWeight: 500,
              color: 'var(--ada-heading)',
              letterSpacing: '-.005em',
              height: '100%',
            }}
          />
          {busca && (
            <button
              onClick={() => onBuscaChange('')}
              aria-label="Limpar busca"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'rgba(255,255,255,.06)',
                color: 'var(--ada-muted)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 150ms',
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter chip rail */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          borderBottom: '1px solid var(--ada-border-sub)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10.5,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            color: 'var(--ada-placeholder)',
            flexShrink: 0,
            paddingRight: 6,
          }}
        >
          Filtros
        </span>

        {/* Chip — Categoria */}
        <div ref={chipRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownAberto(d => !d)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 12px',
              background: categoriaId
                ? 'linear-gradient(180deg, rgba(240,176,48,.10), rgba(212,150,12,.06))'
                : 'var(--ada-surface-2)',
              border: `1px solid ${categoriaId ? 'rgba(240,176,48,.35)' : 'var(--ada-border)'}`,
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 500,
              color: categoriaId ? 'var(--ada-heading)' : 'var(--ada-body)',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 150ms ease',
              boxShadow: categoriaId
                ? '0 0 0 1px rgba(240,176,48,.10) inset, 0 4px 12px -4px rgba(240,176,48,.35)'
                : 'none',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                flexShrink: 0,
                color: categoriaId ? '#F0B030' : 'var(--ada-muted)',
                transition: 'color 150ms',
              }}
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            {catSelecionada ? catSelecionada.nome : 'Categoria'}
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              style={{ opacity: 0.5 }}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Dropdown */}
          {dropdownAberto && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 50,
                background: 'var(--ada-surface)',
                border: '1px solid var(--ada-border)',
                borderRadius: 12,
                boxShadow:
                  '0 24px 56px rgba(0,0,0,.55), 0 8px 16px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.04) inset',
                minWidth: 200,
                padding: 6,
                animation: 'pillIn 180ms cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              <button
                onClick={() => { onCategoriaChange(''); setDropdownAberto(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 7,
                  fontSize: 13,
                  color: !categoriaId ? 'var(--ada-heading)' : 'var(--ada-body)',
                  cursor: 'pointer',
                  border: 'none',
                  background: !categoriaId ? 'var(--ada-surface-2)' : 'none',
                  transition: 'background 100ms',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: !categoriaId ? 'none' : '1.5px solid var(--ada-border)',
                    background: !categoriaId ? '#D4960C' : 'none',
                  }}
                >
                  {!categoriaId && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0A0E16"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="m4 12 5 5L20 6" />
                    </svg>
                  )}
                </span>
                Todas as categorias
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onCategoriaChange(cat.id); setDropdownAberto(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 7,
                    fontSize: 13,
                    color: categoriaId === cat.id ? 'var(--ada-heading)' : 'var(--ada-body)',
                    cursor: 'pointer',
                    border: 'none',
                    background: categoriaId === cat.id ? 'var(--ada-surface-2)' : 'none',
                    transition: 'background 100ms',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: categoriaId === cat.id ? 'none' : '1.5px solid var(--ada-border)',
                      background: categoriaId === cat.id ? '#D4960C' : 'none',
                    }}
                  >
                    {categoriaId === cat.id && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0A0E16"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="m4 12 5 5L20 6" />
                      </svg>
                    )}
                  </span>
                  {cat.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active pills bar — only when any filter is active */}
      {temFiltroAtivo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            padding: '12px 20px',
            background: 'linear-gradient(90deg, rgba(212,150,12,.04) 0%, transparent 60%)',
            borderBottom: '1px solid var(--ada-border-sub)',
          }}
        >
          {/* Active label with pulsing dot */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10.5,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '.14em',
              color: '#F0B030',
              paddingRight: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#F0B030',
                boxShadow: '0 0 6px rgba(240,176,48,.35)',
                animation: 'dotPulseFilter 2s ease infinite',
                flexShrink: 0,
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            Ativos
          </span>

          {/* Busca pill */}
          {busca && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(212,150,12,.12)',
                border: '1px solid rgba(240,176,48,.28)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--ada-heading)',
                overflow: 'hidden',
                animation: 'pillIn 250ms cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              <span
                style={{
                  padding: '5px 9px',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: '#F0B030',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  background: 'rgba(212,150,12,.10)',
                  borderRight: '1px solid rgba(240,176,48,.20)',
                }}
              >
                Busca
              </span>
              <span style={{ padding: '5px 9px' }}>{busca}</span>
              <button
                onClick={() => onBuscaChange('')}
                aria-label="Remover filtro de busca"
                style={{
                  padding: '5px 9px 5px 4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ada-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 150ms',
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {/* Categoria pill */}
          {catSelecionada && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(212,150,12,.12)',
                border: '1px solid rgba(240,176,48,.28)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--ada-heading)',
                overflow: 'hidden',
                animation: 'pillIn 250ms cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              <span
                style={{
                  padding: '5px 9px',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: '#F0B030',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  background: 'rgba(212,150,12,.10)',
                  borderRight: '1px solid rgba(240,176,48,.20)',
                }}
              >
                Categoria
              </span>
              <span style={{ padding: '5px 9px' }}>{catSelecionada.nome}</span>
              <button
                onClick={() => onCategoriaChange('')}
                aria-label="Remover filtro de categoria"
                style={{
                  padding: '5px 9px 5px 4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ada-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 150ms',
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          <button
            onClick={limparTudo}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--ada-muted)',
              letterSpacing: '.06em',
              padding: '5px 10px',
              borderRadius: 6,
              transition: 'color 150ms, background 150ms',
            }}
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}
