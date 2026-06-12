import { useCallback, useEffect, useState } from 'react'
import { despesasService, type DespesasMes, type ComprasMes } from '../services/despesasService'
import { mesParaCompetencia, type TipoDespesa } from '../../shared/competencia'

export function useDespesas(mes: string, tipo: TipoDespesa) {
  const [dados, setDados] = useState<DespesasMes | null>(null)
  const [compras, setCompras] = useState<ComprasMes | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const comp = mesParaCompetencia(mes)
      const [d, c] = await Promise.all([despesasService.listar(comp, tipo), despesasService.compras(comp)])
      setDados(d); setCompras(c)
    } catch { setErro('Erro ao carregar despesas.') } finally { setLoading(false) }
  }, [mes, tipo])

  useEffect(() => { recarregar() }, [recarregar])
  return { dados, compras, loading, erro, recarregar }
}
