import type { TipoProduto } from '@/types/producao'

export const TIPO_PRODUTO_ROTULO: Record<TipoProduto, string> = {
  produzido: 'Produzido em lote',
  feitoNaHora: 'Feito na hora',
  revenda: 'Bebida pronta (revenda)',
}

/** Onde os insumos são consumidos — exibido no cadastro para orientar a escolha. */
export const TIPO_PRODUTO_DESCRICAO: Record<TipoProduto, string> = {
  produzido: 'Bolos, tortas, salgados: insumos baixados ao lançar a produção.',
  feitoNaHora: 'Café, sanduíche, suco: insumos baixados automaticamente a cada venda.',
  revenda: 'Comprado pronto: sem ficha de ingredientes.',
}

export const TIPO_PRODUTO_OPCOES = (Object.keys(TIPO_PRODUTO_ROTULO) as TipoProduto[])
  .map(valor => ({ valor, rotulo: TIPO_PRODUTO_ROTULO[valor] }))

/** Só produtos em lote têm produção lançada; feitos na hora baixam na venda. */
export const temProducaoManual = (tipo: TipoProduto) => tipo === 'produzido'
