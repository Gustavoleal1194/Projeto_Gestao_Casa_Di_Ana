import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface Props {
  paginaAtual: number
  totalPaginas: number
  totalItens: number
  itensPorPagina: number
  onPaginaChange: (pagina: number) => void
}

export function Paginacao({ paginaAtual, totalPaginas, totalItens, itensPorPagina, onPaginaChange }: Props) {
  if (totalPaginas <= 1) return null

  const inicio = (paginaAtual - 1) * itensPorPagina + 1
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens)

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1
  )

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-white rounded-b-xl">
      <span className="text-sm text-stone-500">
        Mostrando {inicio}–{fim} de {totalItens} ingredientes
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPaginaChange(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 text-stone-600" />
        </button>

        {paginas.map((p, idx) => {
          const anterior = paginas[idx - 1]
          const mostraReticencias = anterior !== undefined && p - anterior > 1
          return (
            <span key={p} className="flex items-center gap-1">
              {mostraReticencias && <span className="text-stone-400 text-sm px-1">…</span>}
              <button
                onClick={() => onPaginaChange(p)}
                className={`min-w-[32px] h-8 rounded text-sm px-2
                  ${p === paginaAtual
                    ? 'bg-amber-700 text-white font-medium'
                    : 'hover:bg-stone-100 text-stone-600'
                  }`}
              >
                {p}
              </button>
            </span>
          )
        })}

        <button
          onClick={() => onPaginaChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-4 w-4 text-stone-600" />
        </button>
      </div>
    </div>
  )
}
