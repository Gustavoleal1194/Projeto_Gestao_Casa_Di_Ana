import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const INTERVALO_MINIMO_MS = 30_000

async function versaoPublicada(): Promise<string | null> {
  try {
    const resp = await fetch('/version.json', { cache: 'no-store' })
    if (!resp.ok) return null
    const dados = (await resp.json()) as { versao?: string }
    return dados.versao ?? null
  } catch {
    return null
  }
}

/**
 * Detecta deploy novo e recarrega a aba na próxima troca de tela — momento
 * seguro, sem formulário em edição. Confere ao abrir, ao navegar e quando a
 * aba volta ao foco (no máximo a cada 30 s). Desligado em desenvolvimento.
 */
export function useAtualizacaoVersao() {
  const { pathname } = useLocation()
  const desatualizado = useRef(false)
  const ultimaVerificacao = useRef(0)

  const verificar = useCallback(async () => {
    if (desatualizado.current || Date.now() - ultimaVerificacao.current < INTERVALO_MINIMO_MS) return
    ultimaVerificacao.current = Date.now()
    const versao = await versaoPublicada()
    if (versao && versao !== __VERSAO_APP__) desatualizado.current = true
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) return
    const aoVoltarFoco = () => {
      if (document.visibilityState === 'visible') void verificar()
    }
    document.addEventListener('visibilitychange', aoVoltarFoco)
    return () => document.removeEventListener('visibilitychange', aoVoltarFoco)
  }, [verificar])

  useEffect(() => {
    if (import.meta.env.DEV) return
    if (desatualizado.current) window.location.reload()
    else void verificar()
  }, [pathname, verificar])
}
