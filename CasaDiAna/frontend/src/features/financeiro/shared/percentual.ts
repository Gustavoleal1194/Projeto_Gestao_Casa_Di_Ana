// A API trabalha com frações (0.25); a UI, com percentuais digitados ("25").
export const percentualParaTexto = (frac: number) => String(Math.round(frac * 1000) / 10) // 0.3 -> "30"
export const textoParaFracao = (s: string) => Number(s.replace(',', '.')) / 100
export const fracaoValida = (v: number, permiteZero: boolean) =>
  Number.isFinite(v) && v < 1 && (permiteZero ? v >= 0 : v > 0)
