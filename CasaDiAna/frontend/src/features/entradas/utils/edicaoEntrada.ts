import type {
  CustoItemInput,
  EditarEntradaInput,
  EntradaEdicaoFormValues,
  EntradaMercadoria,
  Fornecedor,
  TipoItemEntrada,
} from '@/types/estoque'

export interface ItemEdicao {
  itemId: string
  tipo: TipoItemEntrada
  nome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoUnitario: number
}

/** Data ISO do backend ("2026-10-13T00:00:00") → valor de <input type="date">. */
const paraInputData = (iso: string) => iso.slice(0, 10)

/** Itens de ingrediente e utensílio numa lista única, na ordem exibida no formulário. */
export function itensDaEntrada(entrada: EntradaMercadoria): ItemEdicao[] {
  return [
    ...entrada.itens.map(i => ({
      itemId: i.id, tipo: 'ingrediente' as const, nome: i.ingredienteNome,
      unidadeMedidaCodigo: i.unidadeMedidaCodigo, quantidade: i.quantidade, custoUnitario: i.custoUnitario,
    })),
    ...entrada.itensUtensilio.map(i => ({
      itemId: i.id, tipo: 'utensilio' as const, nome: i.utensilioNome,
      unidadeMedidaCodigo: i.unidadeMedidaCodigo, quantidade: i.quantidade, custoUnitario: i.custoUnitario,
    })),
  ]
}

export function valoresIniciaisEdicao(entrada: EntradaMercadoria): EntradaEdicaoFormValues {
  return {
    fornecedorId: entrada.fornecedorId,
    dataEntrada: paraInputData(entrada.dataEntrada),
    numeroNotaFiscal: entrada.numeroNotaFiscal ?? '',
    recebidoPor: entrada.recebidoPor ?? '',
    observacoes: entrada.observacoes ?? '',
    temBoleto: entrada.boletos.length > 0,
    boletos: entrada.boletos.map(b => ({ dataVencimento: paraInputData(b.dataVencimento) })),
    custos: itensDaEntrada(entrada).map(i => ({ itemId: i.itemId, tipo: i.tipo, custoUnitario: i.custoUnitario })),
  }
}

/** Monta o payload do PUT enviando só os custos que mudaram. */
export function montarEdicaoInput(valores: EntradaEdicaoFormValues, entrada: EntradaMercadoria): EditarEntradaInput {
  const custoOriginal = new Map(itensDaEntrada(entrada).map(i => [i.itemId, i.custoUnitario]))
  const custosAlterados = (tipo: TipoItemEntrada): CustoItemInput[] =>
    valores.custos.flatMap(c => {
      if (c.tipo !== tipo || c.custoUnitario === undefined) return []
      if (c.custoUnitario === custoOriginal.get(c.itemId)) return []
      return [{ itemId: c.itemId, custoUnitario: c.custoUnitario }]
    })

  return {
    fornecedorId: valores.fornecedorId,
    dataEntrada: valores.dataEntrada,
    recebidoPor: valores.recebidoPor,
    numeroNotaFiscal: valores.numeroNotaFiscal || null,
    observacoes: valores.observacoes || null,
    datasVencimentoBoleto: valores.temBoleto ? valores.boletos.map(b => b.dataVencimento) : [],
    custosItens: custosAlterados('ingrediente'),
    custosItensUtensilio: custosAlterados('utensilio'),
  }
}

/** Garante que o fornecedor atual apareça no combobox mesmo se tiver sido desativado. */
export function opcoesFornecedorEdicao(
  fornecedores: Fornecedor[],
  entrada: EntradaMercadoria,
): Pick<Fornecedor, 'id' | 'razaoSocial'>[] {
  if (fornecedores.some(f => f.id === entrada.fornecedorId)) return fornecedores
  return [{ id: entrada.fornecedorId, razaoSocial: entrada.fornecedorNome }, ...fornecedores]
}
