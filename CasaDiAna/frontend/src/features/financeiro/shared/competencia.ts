// Categorias: o backend serializa enums como string camelCase
// (JsonStringEnumConverter com CamelCase em Program.cs), não como int.
export type CategoriaDespesaFixa =
  | 'aluguel'
  | 'folhaPagamento'
  | 'agua'
  | 'energia'
  | 'gas'
  | 'internet'
  | 'contabilidade'
  | 'manutencao'
  | 'sistema'
  | 'marketing'
  | 'outros'

export const CATEGORIA_DESPESA_LABELS: Record<CategoriaDespesaFixa, string> = {
  aluguel: 'Aluguel',
  folhaPagamento: 'Folha de pagamento',
  agua: 'Água',
  energia: 'Energia',
  gas: 'Gás',
  internet: 'Internet',
  contabilidade: 'Contabilidade',
  manutencao: 'Manutenção',
  sistema: 'Sistema',
  marketing: 'Marketing',
  outros: 'Outros',
}

export const CATEGORIA_DESPESA_OPCOES = (
  Object.keys(CATEGORIA_DESPESA_LABELS) as CategoriaDespesaFixa[]
).map(valor => ({ valor, label: CATEGORIA_DESPESA_LABELS[valor] }))

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
