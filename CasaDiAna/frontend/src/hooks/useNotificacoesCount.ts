import { useState, useEffect, useCallback } from 'react'
import { notificacoesService } from '@/lib/notificacoesService'

const POLL_INTERVAL_MS = 30_000

export function useNotificacoesCount() {
  const [count, setCount] = useState(0)

  const atualizar = useCallback(async () => {
    try {
      const total = await notificacoesService.contarNaoLidas()
      setCount(total)
    } catch {
      // falha silenciosa — polling resiliente a erros de rede
    }
  }, [])

  useEffect(() => {
    atualizar()
    const timer = setInterval(atualizar, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [atualizar])

  return { count, atualizar }
}
