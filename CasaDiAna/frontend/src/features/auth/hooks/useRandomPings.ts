import { useEffect, useState } from 'react'
import { PING_REFRESH_MS, SP_LOCATION } from '../lib/globeConfig'

export interface GlobeMarker {
  location: [number, number]
  size: number
}

const PIN_SP: GlobeMarker = {
  location: SP_LOCATION,
  size: 0.1,
}

function gerarPingsAleatorios(qtd: number): GlobeMarker[] {
  const pings: GlobeMarker[] = []
  for (let i = 0; i < qtd; i++) {
    const lat = Math.random() * 120 - 60       // -60..60
    const lng = Math.random() * 360 - 180      // -180..180
    pings.push({
      location: [lat, lng],
      size: 0.04,
    })
  }
  return pings
}

/**
 * Retorna array de markers para o cobe: SP sempre incluído (size 0.1, "herói"),
 * mais 3-5 pings aleatórios (size 0.04) renovados a cada PING_REFRESH_MS.
 *
 * Limitação do cobe: todos os markers usam a mesma cor (`markerColor` global).
 * A diferenciação do SP é feita pelo tamanho, não pela cor. Cor definida em
 * globeConfig.ts como âmbar (coerência de marca).
 *
 * Se `ativo` for false, retorna apenas o pin de SP (modo reduced-motion).
 */
export function useRandomPings(ativo: boolean = true): GlobeMarker[] {
  const [markers, setMarkers] = useState<GlobeMarker[]>(() => [PIN_SP])

  useEffect(() => {
    if (!ativo) {
      setMarkers([PIN_SP])
      return
    }

    const atualizar = () => {
      const qtd = 3 + Math.floor(Math.random() * 3)  // 3..5
      setMarkers([PIN_SP, ...gerarPingsAleatorios(qtd)])
    }

    atualizar()
    const id = window.setInterval(atualizar, PING_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [ativo])

  return markers
}
