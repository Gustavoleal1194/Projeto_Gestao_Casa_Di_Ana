// Núcleo único das fórmulas de precificação — usado pela listagem E pelo simulador.
// Percentuais são frações (0.30 = 30%).

export type StatusPrecificacao =
  | 'saudavel' | 'atencao' | 'abaixoDoIdeal' | 'prejuizo' | 'custoAlto' | 'indefinido'

export interface PrecificacaoInput {
  precoVenda: number
  custoDireto: number
  temFicha: boolean
}

export interface PrecificacaoContexto {
  cmvAlvo: number
  margemDesejada: number
  taxas: number
  despesaFixaPct: number | null
}

export interface PrecificacaoResultado {
  cmvAtual: number | null
  margemContribuicao: number
  rateioFixo: number
  lucroEstimado: number
  margemLiquidaEst: number | null
  custoMaximoPermitido: number
  precoSugeridoPorCmv: number | null
  precoSugeridoPorMargem: number | null
  precoSugerido: number | null
  diferenca: number | null
  status: StatusPrecificacao
  semCusto: boolean
  somaInvalida: boolean
}

// Banda (em pontos de fração) acima da margem desejada que ainda conta como "Atenção".
export const BANDA_ATENCAO = 0.05

export function calcularPrecificacao(
  input: PrecificacaoInput,
  ctx: PrecificacaoContexto,
): PrecificacaoResultado {
  const preco = input.precoVenda
  const custo = input.custoDireto
  const dfp = ctx.despesaFixaPct ?? 0
  const semCusto = !input.temFicha || custo <= 0

  const cmvAtual = preco > 0 ? custo / preco : null
  const margemContribuicao = preco - custo
  const rateioFixo = preco * dfp
  const lucroEstimado = preco - custo - rateioFixo
  const margemLiquidaEst = preco > 0 ? lucroEstimado / preco : null
  const custoMaximoPermitido = preco * ctx.cmvAlvo

  const precoSugeridoPorCmv = ctx.cmvAlvo > 0 ? custo / ctx.cmvAlvo : null
  const denom = 1 - dfp - ctx.taxas - ctx.margemDesejada
  const somaInvalida = denom <= 0
  const precoSugeridoPorMargem = somaInvalida ? null : custo / denom
  const precoSugerido = precoSugeridoPorMargem ?? precoSugeridoPorCmv
  const diferenca = precoSugerido !== null ? precoSugerido - preco : null

  const status = calcularStatus(
    preco, semCusto, lucroEstimado, cmvAtual, ctx.cmvAlvo, margemLiquidaEst, ctx.margemDesejada,
  )

  return {
    cmvAtual, margemContribuicao, rateioFixo, lucroEstimado, margemLiquidaEst,
    custoMaximoPermitido, precoSugeridoPorCmv, precoSugeridoPorMargem, precoSugerido,
    diferenca, status, semCusto, somaInvalida,
  }
}

function calcularStatus(
  preco: number, semCusto: boolean, lucroEstimado: number,
  cmvAtual: number | null, cmvAlvo: number,
  margemLiquidaEst: number | null, margemDesejada: number,
): StatusPrecificacao {
  if (preco <= 0 || semCusto) return 'indefinido'
  if (lucroEstimado < 0) return 'prejuizo'
  if (cmvAtual !== null && cmvAtual > cmvAlvo) return 'custoAlto'
  if (margemLiquidaEst === null) return 'indefinido'
  if (margemLiquidaEst < margemDesejada) return 'abaixoDoIdeal'
  if (margemLiquidaEst < margemDesejada + BANDA_ATENCAO) return 'atencao'
  return 'saudavel'
}

// Mapeamento status -> StatusBadge (paleta existente) + rótulo pt-BR.
import type { BadgeVariante } from '@/components/ui/StatusBadge'

export const STATUS_BADGE: Record<StatusPrecificacao, { variante: BadgeVariante; label: string }> = {
  saudavel:     { variante: 'ativo',   label: 'Saudável' },
  atencao:      { variante: 'baixo',   label: 'Atenção' },
  abaixoDoIdeal:{ variante: 'info',    label: 'Abaixo do ideal' },
  custoAlto:    { variante: 'critico', label: 'Custo alto' },
  prejuizo:     { variante: 'critico', label: 'Prejuízo estimado' },
  indefinido:   { variante: 'inativo', label: 'Indefinido' },
}
