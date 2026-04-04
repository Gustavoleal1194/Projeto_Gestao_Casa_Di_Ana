// ─── Categoria de Produto ─────────────────────────────────────────────────────
export interface CategoriaProduto {
  id: string
  nome: string
  ativo: boolean
  atualizadoEm: string
}

export interface CriarCategoriaProdutoInput {
  nome: string
}

export interface AtualizarCategoriaProdutoInput {
  id: string
  nome: string
}

// ─── Produto ──────────────────────────────────────────────────────────────────
export interface ProdutoResumo {
  id: string
  nome: string
  categoriaNome: string | null
  precoVenda: number
  ativo: boolean
}

export interface Produto {
  id: string
  nome: string
  categoriaProdutoId: string | null
  categoriaNome: string | null
  descricao: string | null
  precoVenda: number
  ativo: boolean
  atualizadoEm: string
}

export interface CriarProdutoInput {
  nome: string
  precoVenda: number
  categoriaProdutoId?: string | null
  descricao?: string | null
}

export interface AtualizarProdutoInput extends CriarProdutoInput {
  id: string
}

export interface ProdutoFormValues {
  nome: string
  precoVenda: string
  categoriaProdutoId: string
  descricao: string
}

// ─── Ficha Técnica ────────────────────────────────────────────────────────────
export interface ItemFichaTecnica {
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidadePorUnidade: number
  custoUnitario: number | null
  custoItem: number
}

export interface FichaTecnica {
  produtoId: string
  produtoNome: string
  precoVenda: number
  itens: ItemFichaTecnica[]
  custoTotal: number
  margemLucro: number | null
}

export interface ItemFichaTecnicaInput {
  ingredienteId: string
  quantidadePorUnidade: number
}

export interface DefinirFichaTecnicaInput {
  itens: ItemFichaTecnicaInput[]
}

// ─── Produção Diária ──────────────────────────────────────────────────────────
export interface ProducaoDiaria {
  id: string
  produtoId: string
  produtoNome: string
  data: string
  quantidadeProduzida: number
  custoTotal: number
  observacoes: string | null
  criadoEm: string
}

export interface RegistrarProducaoInput {
  produtoId: string
  data: string
  quantidadeProduzida: number
  observacoes?: string | null
}

export interface ProducaoFormValues {
  produtoId: string
  data: string
  quantidadeProduzida: string
  observacoes: string
}

// ─── Venda Diária ─────────────────────────────────────────────────────────────
export interface VendaDiaria {
  id: string
  produtoId: string
  produtoNome: string
  data: string
  quantidadeVendida: number
  criadoEm: string
}

export interface RegistrarVendaInput {
  produtoId: string
  data: string
  quantidadeVendida: number
}

export interface VendaFormValues {
  produtoId: string
  data: string
  quantidadeVendida: string
}

// ─── Perda de Produto ─────────────────────────────────────────────────────────
export interface PerdaProduto {
  id: string
  produtoId: string
  produtoNome: string
  data: string
  quantidade: number
  justificativa: string
  criadoEm: string
}

export interface RegistrarPerdaInput {
  produtoId: string
  data: string
  quantidade: number
  justificativa: string
}

// ─── Relatório Produção/Vendas ────────────────────────────────────────────────
export interface RelatorioProducaoVendasItem {
  produtoId: string
  produtoNome: string
  precoVenda: number
  totalProduzido: number
  totalVendido: number
  perda: number
  custoTotalProducao: number
  custoMedioUnitario: number
  custoPerda: number
  receitaEstimada: number
  margemLucro: number | null
  margemPerda: number | null
}

export interface RelatorioProducaoVendas {
  de: string
  ate: string
  itens: RelatorioProducaoVendasItem[]
}
