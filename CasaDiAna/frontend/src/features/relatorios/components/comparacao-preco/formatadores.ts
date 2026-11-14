export function fmtMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtData(iso: string): string {
  return iso.split('T')[0].split('-').reverse().join('/')
}

export function fmtPct(v: number | null): string {
  if (v === null) return '—'
  const sinal = v > 0 ? '+' : ''
  return `${sinal}${v.toFixed(2).replace('.', ',')}%`
}

/** Cor semântica de uma variação de custo: aumento é ruim, redução é bom. */
export function corVariacao(v: number | null): string {
  if (v === null || v === 0) return 'var(--ada-muted)'
  return v > 0 ? 'var(--ada-error-text)' : 'var(--ada-success-text)'
}

/** Id DOM da linha do ingrediente — alvo da navegação a partir dos destaques. */
export function idLinhaIngrediente(ingredienteId: string): string {
  return `comparacao-ingrediente-${ingredienteId}`
}
