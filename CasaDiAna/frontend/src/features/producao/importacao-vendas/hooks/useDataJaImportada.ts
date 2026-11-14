import { useEffect, useState } from 'react'
import { importacaoVendasService } from '../services/importacaoVendasService'

/**
 * Verifica se a data de venda escolhida já tem importação. Nesse caso a tela
 * exige confirmação explícita: as vendas (e a baixa de insumos) seriam somadas.
 * Resultado e confirmação ficam atrelados à data — trocar a data invalida ambos.
 */
export function useDataJaImportada(dataVenda: string, ativo: boolean) {
  const [verificacao, setVerificacao] = useState<{ data: string; existe: boolean } | null>(null)
  const [confirmadaPara, setConfirmadaPara] = useState<string | null>(null)

  useEffect(() => {
    if (!ativo || dataVenda.length !== 10) return
    let cancelado = false
    importacaoVendasService.existeNaData(dataVenda)
      .then(existe => { if (!cancelado) setVerificacao({ data: dataVenda, existe }) })
      // Falha na checagem não trava a tela: o servidor valida de novo na confirmação.
      .catch(() => {})
    return () => { cancelado = true }
  }, [dataVenda, ativo])

  const jaImportada = ativo && verificacao?.data === dataVenda && verificacao.existe
  const confirmada = confirmadaPara === dataVenda

  return {
    jaImportada,
    confirmada,
    setConfirmada: (valor: boolean) => setConfirmadaPara(valor ? dataVenda : null),
    bloqueada: jaImportada && !confirmada,
  }
}
