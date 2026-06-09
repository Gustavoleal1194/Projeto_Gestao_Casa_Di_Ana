// Categorias (espelha o enum CategoriaDespesaFixa do backend; enums trafegam como int)
export type CategoriaDespesaFixa =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export const CATEGORIA_DESPESA_LABELS: Record<CategoriaDespesaFixa, string> = {
  1: 'Aluguel',
  2: 'Folha de pagamento',
  3: 'Água',
  4: 'Energia',
  5: 'Gás',
  6: 'Internet',
  7: 'Contabilidade',
  8: 'Manutenção',
  9: 'Sistema',
  10: 'Marketing',
  11: 'Outros',
}

export const CATEGORIA_DESPESA_OPCOES = (
  Object.keys(CATEGORIA_DESPESA_LABELS) as unknown as CategoriaDespesaFixa[]
).map(Number).map(valor => ({
  valor: valor as CategoriaDespesaFixa,
  label: CATEGORIA_DESPESA_LABELS[valor as CategoriaDespesaFixa],
}))

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
