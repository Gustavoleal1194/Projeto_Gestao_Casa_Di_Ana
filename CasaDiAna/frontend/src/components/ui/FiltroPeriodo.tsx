// CasaDiAna/frontend/src/components/ui/FiltroPeriodo.tsx
import type { FilterChipDef } from '@/components/ui/FilterBar'

interface FiltroPeriodoProps {
  de: string
  onChangeDe: (v: string) => void
  ate: string
  onChangeAte: (v: string) => void
  idDe?: string
  idAte?: string
}

function formatarData(iso: string): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function FiltroPeriodo({
  de,
  onChangeDe,
  ate,
  onChangeAte,
  idDe = 'filtro-de',
  idAte = 'filtro-ate',
}: FiltroPeriodoProps) {
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <>
      <div>
        <label htmlFor={idDe} className="filter-label">De</label>
        <input
          id={idDe}
          type="date"
          className="filter-input"
          value={de}
          max={hoje}
          onChange={e => onChangeDe(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={idAte} className="filter-label">Até</label>
        <input
          id={idAte}
          type="date"
          className="filter-input"
          value={ate}
          max={hoje}
          onChange={e => onChangeAte(e.target.value)}
        />
      </div>
    </>
  )
}

export function gerarChipsPeriodo(
  de: string,
  ate: string,
  onLimparDe: () => void,
  onLimparAte: () => void,
): FilterChipDef[] {
  const chips: FilterChipDef[] = []
  if (de) chips.push({ label: `De: ${formatarData(de)}`, onRemove: onLimparDe })
  if (ate) chips.push({ label: `Até: ${formatarData(ate)}`, onRemove: onLimparAte })
  return chips
}
