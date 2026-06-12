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

export function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarPercentual(fracao: number | null): string {
  if (fracao === null || fracao === undefined) return '—'
  return `${(fracao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}
