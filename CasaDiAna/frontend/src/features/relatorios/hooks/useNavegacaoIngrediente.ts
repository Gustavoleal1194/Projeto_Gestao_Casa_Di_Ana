import { useCallback, useEffect, useState } from 'react'
import { idLinhaIngrediente } from '../components/comparacao-preco/formatadores'

const DURACAO_FOCO_MS = 2400

interface Foco {
  id: string
  /** Incrementa a cada navegação para reiniciar o destaque mesmo no mesmo item. */
  seq: number
}

/**
 * Controla quais linhas da comparação estão expandidas e a navegação até uma
 * linha específica (expande, rola até ela e aplica destaque temporário).
 */
export function useNavegacaoIngrediente() {
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(() => new Set())
  const [foco, setFoco] = useState<Foco | null>(null)

  const alternar = useCallback((id: string) => {
    setAbertos(prev => {
      const proximo = new Set(prev)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }, [])

  const focar = useCallback((id: string) => {
    setAbertos(prev => (prev.has(id) ? prev : new Set(prev).add(id)))
    setFoco(atual => ({ id, seq: (atual?.seq ?? 0) + 1 }))
  }, [])

  useEffect(() => {
    if (!foco) return
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document
      .getElementById(idLinhaIngrediente(foco.id))
      ?.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'center' })
    const timer = window.setTimeout(() => setFoco(null), DURACAO_FOCO_MS)
    return () => window.clearTimeout(timer)
  }, [foco])

  return { abertos, foco, alternar, focar }
}
