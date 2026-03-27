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
  ativo: boolean
  atualizadoEm: string
}

// ─── Inputs para a API (o que enviamos) ──────────────────────────────────────
export interface CriarIngredienteInput {
  nome: string
  unidadeMedidaId: number
  estoqueMinimo: number
  codigoInterno?: string | null
  categoriaId?: string | null
  estoqueMaximo?: number | null
  observacoes?: string | null
}

export interface AtualizarIngredienteInput extends CriarIngredienteInput {
  id: string
}

// ─── Campos do formulário React Hook Form (strings para inputs HTML) ──────────
export interface IngredienteFormValues {
  nome: string
  codigoInterno: string
  categoriaId: string
  unidadeMedidaId: string   // coerced → number antes de enviar
  estoqueMinimo: string     // coerced → number antes de enviar
  estoqueMaximo: string     // coerced → number | null
  observacoes: string
}
