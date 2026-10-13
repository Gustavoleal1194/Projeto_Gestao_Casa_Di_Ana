import { useEffect, useState } from 'react'
import { entradasService } from '../services/entradasService'
import { fornecedoresService } from '@/features/fornecedores/services/fornecedoresService'
import { opcoesFornecedorEdicao } from '../utils/edicaoEntrada'
import type { EntradaMercadoria, Fornecedor } from '@/types/estoque'

export function useEntradaEdicao(id?: string) {
  const [entrada, setEntrada] = useState<EntradaMercadoria | null>(null)
  const [fornecedores, setFornecedores] = useState<Pick<Fornecedor, 'id' | 'razaoSocial'>[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ativo = true
    Promise.all([entradasService.obterPorId(id), fornecedoresService.listar()])
      .then(([dados, listaFornecedores]) => {
        if (!ativo) return
        setEntrada(dados)
        setFornecedores(opcoesFornecedorEdicao(listaFornecedores, dados))
      })
      .catch(() => {
        if (ativo) setErro('Erro ao carregar entrada.')
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [id])

  // Sem id não há carregamento em curso; sem isso, loading ficaria preso em true.
  return { entrada, fornecedores, loading: loading && Boolean(id), erro }
}
