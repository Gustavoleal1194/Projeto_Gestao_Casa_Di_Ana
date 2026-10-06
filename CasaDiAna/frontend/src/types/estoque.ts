// ─── Wrapper de resposta da API ───────────────────────────────────────────────
export interface ApiResponse<T> {
  sucesso: boolean
  dados: T
  erros: string[]
}

// ─── Categoria de Ingrediente ─────────────────────────────────────────────────
export interface CategoriaIngrediente {
  id: string
  nome: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarCategoriaInput {
  nome: string
}

export interface AtualizarCategoriaInput {
  id: string
  nome: string
}

// ─── Unidade de Medida ────────────────────────────────────────────────────────
export interface UnidadeMedida {
  id: number   // short no backend → number no TS
  codigo: string
  descricao: string
}

// ─── Ingrediente (listagem) ───────────────────────────────────────────────────
export interface IngredienteResumo {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estaBaixoDoMinimo: boolean
  ativo: boolean
}

// ─── Ingrediente (detalhe / edição) ──────────────────────────────────────────
export interface Ingrediente {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaId: string | null
  categoriaNome: string | null
  unidadeMedidaId: number
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo: number | null
  estaBaixoDoMinimo: boolean
  observacoes: string | null
  quantidadeEmbalagemValor: number | null
  unidadeEmbalagem: string | null
  ativo: boolean
  atualizadoEm: string
}

export interface CriarIngredienteInput {
  nome: string
  unidadeMedidaId: number
  estoqueMinimo: number
  codigoInterno?: string | null
  categoriaId?: string | null
  estoqueMaximo?: number | null
  observacoes?: string | null
  quantidadeEmbalagemValor?: number
  unidadeEmbalagem?: string
}

export interface AtualizarIngredienteInput extends CriarIngredienteInput {
  id: string
}

export interface IngredienteFormValues {
  nome: string
  codigoInterno: string
  categoriaId: string
  unidadeMedidaId: string
  estoqueMinimo: number | undefined
  estoqueMaximo: number | undefined
  observacoes: string
  quantidadeEmbalagemValor: number | undefined
  unidadeEmbalagem: string
  _ehPacote?: boolean
}

// ─── Categoria de Utensílio ────────────────────────────────────────────────────
export interface CategoriaUtensilio {
  id: string
  nome: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarCategoriaUtensilioInput {
  nome: string
}

export interface AtualizarCategoriaUtensilioInput {
  id: string
  nome: string
}

// ─── Utensílio (listagem) ──────────────────────────────────────────────────────
export interface UtensilioResumo {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estaBaixoDoMinimo: boolean
  ativo: boolean
}

// ─── Utensílio (detalhe / edição) ──────────────────────────────────────────
export interface Utensilio {
  id: string
  nome: string
  codigoInterno: string | null
  categoriaUtensilioId: string | null
  categoriaNome: string | null
  unidadeMedidaId: number
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo: number | null
  estaBaixoDoMinimo: boolean
  custoUnitario: number | null
  ativo: boolean
  atualizadoEm: string
}

export interface CriarUtensilioInput {
  nome: string
  unidadeMedidaId: number
  estoqueMinimo: number
  codigoInterno?: string | null
  categoriaUtensilioId?: string | null
  estoqueMaximo?: number | null
}

export interface AtualizarUtensilioInput extends CriarUtensilioInput {
  id: string
}

export interface UtensilioFormValues {
  nome: string
  codigoInterno: string
  categoriaUtensilioId: string
  unidadeMedidaId: string
  estoqueMinimo: number | undefined
  estoqueMaximo: number | undefined
}

// ─── Fornecedor ───────────────────────────────────────────────────────────────
export interface Fornecedor {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string | null
  telefone: string | null
  email: string | null
  contatoNome: string | null
  observacoes: string | null
  ativo: boolean
  atualizadoEm: string
}

export interface CriarFornecedorInput {
  razaoSocial: string
  nomeFantasia?: string | null
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  contatoNome?: string | null
  observacoes?: string | null
}

export interface AtualizarFornecedorInput extends CriarFornecedorInput {
  id: string
}

export interface FornecedorFormValues {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  telefone: string
  email: string
  contatoNome: string
  observacoes: string
}

// ─── Entradas de Mercadoria ───────────────────────────────────────────────────
export interface EntradaMercadoriaResumo {
  id: string
  fornecedorNome: string
  numeroNotaFiscal: string | null
  dataEntrada: string
  status: string
  recebidoPor: string | null
  totalItens: number
  custoTotal: number
  criadoEm: string
  temBoleto: boolean
  dataVencimentoBoleto: string | null
}

export interface ItemEntrada {
  id: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoUnitario: number
  custoTotal: number
}

export interface ItemEntradaUtensilio {
  id: string
  utensilioId: string
  utensilioNome: string
  unidadeMedidaCodigo: string
  quantidade: number
  custoUnitario: number
  custoTotal: number
}

export interface EntradaMercadoria {
  id: string
  fornecedorId: string
  fornecedorNome: string
  numeroNotaFiscal: string | null
  dataEntrada: string
  status: string
  recebidoPor: string | null
  observacoes: string | null
  custoTotal: number
  criadoEm: string
  temBoleto: boolean
  dataVencimentoBoleto: string | null
  itens: ItemEntrada[]
  itensUtensilio: ItemEntradaUtensilio[]
}

export interface ItemEntradaInput {
  ingredienteId: string
  quantidade: number
  custoUnitario: number
}

export interface ItemEntradaUtensilioInput {
  utensilioId: string
  quantidade: number
  custoUnitario: number
}

export interface RegistrarEntradaInput {
  fornecedorId: string
  dataEntrada: string
  itens: ItemEntradaInput[]
  itensUtensilio?: ItemEntradaUtensilioInput[]
  recebidoPor: string
  numeroNotaFiscal?: string | null
  observacoes?: string | null
  temBoleto: boolean
  dataVencimentoBoleto?: string | null
}

export interface EntradaFormValues {
  fornecedorId: string
  dataEntrada: string
  numeroNotaFiscal: string
  recebidoPor: string
  observacoes: string
  itens: {
    tipo: 'ingrediente' | 'utensilio'
    itemId: string
    quantidade: number | undefined
    custoUnitario: number | undefined
  }[]
  temBoleto: boolean
  dataVencimentoBoleto: string
}

// ─── Inventários ──────────────────────────────────────────────────────────────
export interface InventarioResumo {
  id: string
  dataRealizacao: string
  descricao: string | null
  status: string
  totalItens: number
  criadoEm: string
}

export interface ItemInventario {
  id: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidadeSistema: number
  quantidadeContada: number
  diferenca: number
  observacoes: string | null
}

export interface Inventario {
  id: string
  dataRealizacao: string
  descricao: string | null
  status: string
  observacoes: string | null
  finalizadoEm: string | null
  criadoEm: string
  itens: ItemInventario[]
}

export interface IniciarInventarioInput {
  dataRealizacao: string
  descricao?: string | null
  observacoes?: string | null
}

export interface AdicionarItemInventarioInput {
  ingredienteId: string
  quantidadeContada: number
  observacoes?: string | null
}

// ─── Relatórios ───────────────────────────────────────────────────────────────
export interface EstoqueAtualItem {
  ingredienteId: string
  nome: string
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  estoqueMinimo: number
  estoqueMaximo: number | null
  estaBaixoDoMinimo: boolean
}

export interface MovimentacaoRelatorio {
  id: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  tipo: string
  quantidade: number
  saldoApos: number
  referenciaTipo: string | null
  referenciaId: string | null
  criadoEm: string
  operadorNome: string | null
}

export interface EntradaRelatorioItem {
  id: string
  fornecedorNome: string
  numeroNotaFiscal: string | null
  dataEntrada: string
  status: string
  totalItens: number
  custoTotal: number
}

export interface EntradaRelatorioResumo {
  de: string
  ate: string
  totalEntradas: number
  totalEntradasConfirmadas: number
  custoTotalConfirmadas: number
  entradas: EntradaRelatorioItem[]
}

export interface InsumoProducaoDia {
  data: string          // DateOnly serialized as "YYYY-MM-DD"
  producaoDiariaId: string
  produtoId: string
  produtoNome: string
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  quantidade: number
}

// ─── Comparação de Preços de Ingredientes ─────────────────────────────────────
export interface HistoricoPrecoItem {
  entradaId: string
  numeroNotaFiscal: string | null
  dataEntrada: string
  fornecedorId: string
  fornecedorNome: string
  custoUnitario: number
  quantidade: number
}

export interface PrecoFornecedor {
  fornecedorId: string
  fornecedorNome: string
  precoMinimo: number
  precoMaximo: number
  precoMedio: number
  ultimoPreco: number
  ultimaCompra: string
  totalCompras: number
}

export interface ComparacaoPrecoIngrediente {
  ingredienteId: string
  ingredienteNome: string
  unidadeMedidaCodigo: string
  historico: HistoricoPrecoItem[]
  porFornecedor: PrecoFornecedor[]
  ultimoPreco: number | null
  precoAnterior: number | null
  variacaoValor: number | null
  variacaoPercentual: number | null
  tendenciaPreco: 'aumento' | 'reducao' | 'estavel' | 'sem_historico'
}

export interface ComparacaoPreco {
  ingredientes: ComparacaoPrecoIngrediente[]
  maioresAumentos: ComparacaoPrecoIngrediente[]
  maioresReducoes: ComparacaoPrecoIngrediente[]
}
