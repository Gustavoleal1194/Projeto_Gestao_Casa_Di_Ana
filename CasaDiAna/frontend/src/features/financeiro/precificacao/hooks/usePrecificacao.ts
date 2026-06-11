import { useCallback, useEffect, useState } from 'react'
import { precificacaoService, type AnalisePrecificacao } from '../services/precificacaoService'
import { mesParaCompetencia } from '../../shared/competencia'

export function usePrecificacao(mes: string) {
  const [analise, setAnalise] = useState<AnalisePrecificacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      setAnalise(await precificacaoService.obterAnalise(mesParaCompetencia(mes)))
    } catch {
      setErro('Erro ao carregar a análise de precificação.')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { recarregar() }, [recarregar])

  return { analise, loading, erro, recarregar, setAnalise }
}
