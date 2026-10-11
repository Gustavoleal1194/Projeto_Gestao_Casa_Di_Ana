export type StatusImportacao = 'matched' | 'unmatched' | 'ambiguous' | 'ignored' | 'repasse'

export type TipoRepasse = 'taxaServico' | 'entrega'

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
  tipoRepasse: TipoRepasse | null
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
  totalRepasses: number
  totalTaxaServico: number
  totalEntregas: number
  itens: ItemPreview[]
}

export interface VinculoLinha {
  nomeRelatorio: string
  produtoId: string
}

export interface ConfirmarImportacaoInput {
  arquivo: File
  dataVenda: string
  vinculos: VinculoLinha[]
  linhasRemovidas: string[]
}

export interface ResultadoImportacao {
  totalImportadas: number
  totalIgnoradas: number
  totalNaoEncontradas: number
  totalTaxaServico: number
  totalEntregas: number
}
