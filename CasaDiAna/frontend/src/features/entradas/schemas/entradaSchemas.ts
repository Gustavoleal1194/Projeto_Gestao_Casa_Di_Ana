import { z } from 'zod'

/** Campo numérico de input HTML: '' vira undefined antes de validar. */
const campoNumerico = (
  configurar: (numero: z.ZodNumber) => z.ZodNumber,
  mensagemVazio = 'Informe um valor.',
) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    configurar(z.number({ error: mensagemVazio })),
  )

const custoUnitario = campoNumerico((n) => n.min(0, 'Custo deve ser ≥ 0.'))
const tipoItem = z.enum(['ingrediente', 'utensilio'])

const cabecalhoEntradaShape = {
  fornecedorId: z.string().min(1, 'Selecione um fornecedor.'),
  dataEntrada: z.string().min(1, 'Informe a data da entrada.'),
  numeroNotaFiscal: z.string().max(60),
  recebidoPor: z.string().min(1, 'Informe quem recebeu os produtos.').max(100),
  observacoes: z.string(),
  temBoleto: z.boolean().default(false),
  boletos: z.array(z.object({
    dataVencimento: z.string().min(1, 'Informe a data de vencimento.'),
  })).default([]),
}

const boletoObrigatorio = (d: { temBoleto: boolean; boletos: unknown[] }) =>
  !d.temBoleto || d.boletos.length > 0
const boletoObrigatorioErro = { message: 'Adicione pelo menos um boleto.', path: ['boletos'] }

export const entradaRegistroSchema = z.object({
  ...cabecalhoEntradaShape,
  itens: z.array(z.object({
    tipo: tipoItem,
    itemId: z.string().min(1, 'Selecione um item.'),
    quantidade: campoNumerico((n) => n.positive('Quantidade deve ser maior que 0.')),
    custoUnitario,
  })).min(1, 'Adicione pelo menos um item.'),
}).refine(boletoObrigatorio, boletoObrigatorioErro)

export const entradaEdicaoSchema = z.object({
  ...cabecalhoEntradaShape,
  custos: z.array(z.object({
    itemId: z.string(),
    tipo: tipoItem,
    custoUnitario,
  })),
}).refine(boletoObrigatorio, boletoObrigatorioErro)
