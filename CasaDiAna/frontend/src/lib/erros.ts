import { isAxiosError } from 'axios'

/** Primeira mensagem de `ApiResponse.erros` da resposta, ou `padrao`. */
export function extrairMensagemErro(erro: unknown, padrao: string): string {
  if (isAxiosError(erro)) {
    const mensagem = erro.response?.data?.erros?.[0]
    if (typeof mensagem === 'string' && mensagem.length > 0) return mensagem
  }
  return padrao
}
