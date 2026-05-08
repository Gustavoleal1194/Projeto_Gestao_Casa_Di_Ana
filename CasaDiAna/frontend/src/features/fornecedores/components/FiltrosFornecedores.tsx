import { useState } from 'react'

interface Props {
  busca: string
  onBuscaChange: (v: string) => void
}

export function FiltrosFornecedores({ busca, onBuscaChange }: Props) {
  const [focado, setFocado] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
        border: '1px solid var(--ada-border)',
        borderRadius: 20,
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
          borderBottom: busca ? '1px solid var(--ada-border-sub)' : 'none',
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
          <label htmlFor="busca-fornecedor" className="sr-only">
            Buscar fornecedor
          </label>
          <input
            id="busca-fornecedor"
            type="text"
            placeholder="Buscar por razão social, nome fantasia ou CNPJ…"
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
              type="button"
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

      {/* Active pills bar — only when busca is active */}
      {busca && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            padding: '12px 20px',
            background: 'linear-gradient(90deg, rgba(212,150,12,.04) 0%, transparent 60%)',
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
              type="button"
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
        </div>
      )}
    </div>
  )
}
