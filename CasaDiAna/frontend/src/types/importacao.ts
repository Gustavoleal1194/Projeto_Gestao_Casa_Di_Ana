export type StatusImportacao = 'matched' | 'unmatched' | 'ambiguous' | 'ignored'

export interface SugestaoMatch {
  produtoId: string
  produtoNome: string
}

export interface ItemPreview {
  codigoExterno: string | null
  nomeRelatorio: string
  grupo: string | null
  quantidade: number
  valorTotal: number
  status: StatusImportacao
  produtoId: string | null
  produtoNome: string | null
  sugestoes: SugestaoMatch[]
}

export interface PreviewImportacao {
  hash: string
  periodoDe: string | null
  periodoAte: string | null
  totalLinhasParseadas: number
  totalMatched: number
  totalAmbiguous: number
  totalUnmatched: number
  totalIgnored: number
  itens: ItemPreview[]
}

export interface ItemConfirmar {
  produtoId: string
  quantidade: number
}

export interface ConfirmarImportacaoInput {
  hash: string
  nomeArquivo: string
  dataVenda: string
  periodoDe: string | null
  periodoAte: string | null
  totalLinhasParseadas: number
  totalIgnoradas: number
  totalNaoEncontradas: number
  itens: ItemConfirmar[]
}

export interface ResultadoImportacao {
  totalImportadas: number
  totalIgnoradas: number
  totalNaoEncontradas: number
}
