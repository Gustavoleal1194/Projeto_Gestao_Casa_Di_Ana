import { useCallback, useEffect, useState } from 'react'
import { despesasFixasService, type DespesasFixasMes } from '../services/despesasFixasService'
import { mesParaCompetencia } from '../../shared/competencia'

export function useDespesasFixas(mes: string) {
  const [dados, setDados] = useState<DespesasFixasMes | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await despesasFixasService.listar(mesParaCompetencia(mes))
      setDados(data)
    } catch {
      setErro('Erro ao carregar despesas fixas.')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, loading, erro, recarregar }
}
