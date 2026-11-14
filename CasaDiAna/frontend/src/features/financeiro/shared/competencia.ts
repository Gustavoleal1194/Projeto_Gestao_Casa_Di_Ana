export type TipoDespesa = 'fixa' | 'variavel'
export const TIPO_DESPESA_LABELS: Record<TipoDespesa, string> = { fixa: 'Fixa', variavel: 'Variável' }

// <input type="month"> usa "YYYY-MM". API usa o 1º dia do mês "YYYY-MM-01".
export function competenciaInicial(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

export function mesParaCompetencia(mes: string): string {
  return `${mes}-01`
}

/** "2026-11" → "outubro de 2026" (nome do mês anterior, para mensagens). */
export function nomeMesAnterior(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  return new Date(ano, m - 2, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarPercentual(fracao: number | null): string {
  if (fracao === null || fracao === undefined) return '—'
  return `${(fracao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}
