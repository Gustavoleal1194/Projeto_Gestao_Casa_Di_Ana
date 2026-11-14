/** Tipos de movimentação de ingrediente como chegam da API (nome do enum). */
export const TIPO_MOVIMENTACAO = {
  entrada: 'Entrada',
  ajustePositivo: 'AjustePositivo',
  ajusteNegativo: 'AjusteNegativo',
  saidaProducao: 'SaidaProducao',
  saidaVenda: 'SaidaVenda',
} as const

const CONSUMO: readonly string[] = [TIPO_MOVIMENTACAO.saidaProducao, TIPO_MOVIMENTACAO.saidaVenda]
const AJUSTE: readonly string[] = [TIPO_MOVIMENTACAO.ajustePositivo, TIPO_MOVIMENTACAO.ajusteNegativo]

/** Consumo de insumos: produção em lote ou venda de item feito na hora. */
export const ehConsumo = (tipo: string) => CONSUMO.includes(tipo)
export const ehAjuste = (tipo: string) => AJUSTE.includes(tipo)
export const ehEntrada = (tipo: string) => tipo === TIPO_MOVIMENTACAO.entrada
/** Tudo que aumenta o saldo. */
export const somaAoEstoque = (tipo: string) =>
  tipo === TIPO_MOVIMENTACAO.entrada || tipo === TIPO_MOVIMENTACAO.ajustePositivo
/** Tudo que reduz o saldo. */
export const subtraiDoEstoque = (tipo: string) =>
  ehConsumo(tipo) || tipo === TIPO_MOVIMENTACAO.ajusteNegativo
