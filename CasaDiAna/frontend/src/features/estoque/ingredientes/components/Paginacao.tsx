import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface Props {
  paginaAtual: number
  totalPaginas: number
  totalItens: number
  itensPorPagina: number
  onPaginaChange: (pagina: number) => void
}

export function Paginacao({
  paginaAtual,
  totalPaginas,
  totalItens,
  itensPorPagina,
  onPaginaChange,
}: Props) {
  if (totalPaginas <= 1) return null

  const inicio = (paginaAtual - 1) * itensPorPagina + 1
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens)

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1
  )

  const btnBase = [
    'min-w-[32px] h-8 rounded-lg text-[13px] font-medium px-2',
    'transition-all duration-150 outline-none',
    'focus-visible:ring-2 focus-visible:ring-[#C4870A]/40',
  ].join(' ')

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between px-5 py-3 rounded-b-xl border-t"
      style={{
        background: '#FAFAF8',
        borderColor: '#EEEBE5',
      }}
    >
      <p className="text-[12.5px]" style={{ color: '#8B7E73' }}>
        Exibindo{' '}
        <span className="font-semibold" style={{ color: '#4B4039' }}>
          {inicio}–{fim}
        </span>{' '}
        de{' '}
        <span className="font-semibold" style={{ color: '#4B4039' }}>
          {totalItens}
        </span>{' '}
        itens
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPaginaChange(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className={`${btnBase} p-1.5`}
          style={{ color: '#8B7E73' }}
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {paginas.map((p, idx) => {
          const anterior = paginas[idx - 1]
          const mostraElipsis = anterior !== undefined && p - anterior > 1
          const isActive = p === paginaAtual

          return (
            <span key={p} className="flex items-center gap-1">
              {mostraElipsis && (
                <span className="text-[13px] px-1" style={{ color: '#8B7E73' }} aria-hidden="true">
                  …
                </span>
              )}
              <button
                onClick={() => onPaginaChange(p)}
                className={btnBase}
                aria-label={`Página ${p}`}
                aria-current={isActive ? 'page' : undefined}
                style={isActive
                  ? { background: '#C4870A', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(196,135,10,0.30)' }
                  : { color: '#4B4039' }
                }
                onMouseEnter={e => !isActive && ((e.currentTarget as HTMLElement).style.background = '#F0EBE3')}
                onMouseLeave={e => !isActive && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                {p}
              </button>
            </span>
          )
        })}

        <button
          onClick={() => onPaginaChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className={`${btnBase} p-1.5`}
          style={{ color: '#8B7E73' }}
          aria-label="Próxima página"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
