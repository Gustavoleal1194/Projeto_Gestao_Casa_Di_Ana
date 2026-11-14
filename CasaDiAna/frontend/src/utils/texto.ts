/** Remove acentos e caixa para comparações tolerantes ("Açúcar" ≈ "acucar"). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function contemTexto(texto: string, termo: string): boolean {
  return normalizarTexto(texto).includes(normalizarTexto(termo.trim()))
}
