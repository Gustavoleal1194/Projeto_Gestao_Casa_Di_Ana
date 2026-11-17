/**
 * Datas no formato `yyyy-MM-dd` (valor de <input type="date"> e da API)
 * calculadas no fuso LOCAL do navegador.
 *
 * Não use `toISOString().split('T')[0]`: ele converte para UTC, e no Brasil
 * (UTC-3) a partir das 21h devolve o dia seguinte.
 */

export function paraDataIso(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function hojeIso(): string {
  return paraDataIso(new Date())
}

export function inicioDoMesIso(): string {
  const agora = new Date()
  return paraDataIso(new Date(agora.getFullYear(), agora.getMonth(), 1))
}

export function diasAtrasIso(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return paraDataIso(data)
}
