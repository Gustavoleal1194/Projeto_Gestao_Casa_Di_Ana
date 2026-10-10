// A API trabalha com frações (0.25); a UI, com percentuais digitados ("25").
export const percentualParaTexto = (frac: number) => String(Math.round(frac * 1000) / 10) // 0.3 -> "30"
// Texto vazio vira NaN (e não 0), para que fracaoValida o rejeite.
export const textoParaFracao = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')) / 100)
export const fracaoValida = (v: number, permiteZero: boolean) =>
  Number.isFinite(v) && v < 1 && (permiteZero ? v >= 0 : v > 0)
