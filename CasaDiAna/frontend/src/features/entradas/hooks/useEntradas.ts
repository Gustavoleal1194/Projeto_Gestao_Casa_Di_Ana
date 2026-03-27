import { useState, useCallback } from 'react'
import { entradasService } from '../services/entradasService'
import type { EntradaMercadoriaResumo } from '@/types/estoque'

function primeiroDiaMesAtual(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export function useEntradas() {
  const [entradas, setEntradas] = useState<EntradaMercadoriaResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDiaMesAtual)
  const [ate, setAte] = useState(hoje)

  const carregar = useCallback(async (filtroDE?: string, filtroATE?: string) => {
    const deFinal = filtroDE ?? de
    const ateFinal = filtroATE ?? ate
    setLoading(true)
    setErro(null)
    try {
      const data = await entradasService.listar(deFinal, ateFinal)
      setEntradas(data)
    } catch {
      setErro('Erro ao carregar entradas.')
    } finally {
      setLoading(false)
    }
  }, [de, ate])

  const atualizarDe = (valor: string) => setDe(valor)
  const atualizarAte = (valor: string) => setAte(valor)

  return { entradas, loading, erro, de, ate, atualizarDe, atualizarAte, carregar }
}
