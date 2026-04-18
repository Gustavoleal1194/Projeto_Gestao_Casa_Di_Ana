// Tokens de cor e configuração do globo 3D (cobe).
// Cores em formato [r, g, b] no range [0, 1] — padrão exigido pelo cobe.

export const GLOBE_TOKENS = {
  baseColor:     [0.22, 0.60, 0.80] as [number, number, number], // cyan frio (casca do globo)
  glowColor:     [0.12, 0.35, 0.55] as [number, number, number], // cyan escuro (glow atmosférico)
  markerBrand:   [0.83, 0.59, 0.05] as [number, number, number], // âmbar Casa di Ana (todos os markers)
  dark:          1,
  diffuse:       1.2,
  mapSamples:    16000,
  mapBrightness: 6,
}

export interface GlobeMarker {
  location: [number, number]  // [lat, lng]
  size: number                 // raio relativo (0..1)
}

// Nós de ativação distribuídos uniformemente pela esfera — não correspondem
// a cidades. Geração determinística via PRNG (seed fixa) para manter o mesmo
// layout entre recargas. São "pontos quentes" da malha neural visíveis através
// da superfície dot-matrix do globo.
function gerarNosGlobais(quantidade: number, seed: number): GlobeMarker[] {
  let s = seed | 0
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const nos: GlobeMarker[] = []
  for (let i = 0; i < quantidade; i++) {
    // z uniforme em [-1, 1] → latitude com distribuição uniforme por área
    const z = rng() * 2 - 1
    const lat = (Math.asin(z) * 180) / Math.PI
    const lng = (rng() * 2 - 1) * 180
    nos.push({
      location: [lat, lng],
      size: 0.022 + rng() * 0.028,
    })
  }
  return nos
}

export const GLOBE_NODES: GlobeMarker[] = gerarNosGlobais(18, 8472)

// Velocidade de auto-rotação (incremento de phi por frame).
export const AUTO_ROTATE_SPEED = 0.003

// Amplitude máxima do parallax de cursor, em radianos.
export const PARALLAX_MAX_DELTA = 0.3

// Sensibilidade do drag (radianos por pixel de movimento do ponteiro).
export const DRAG_SENSITIVITY = 0.005

// Limite do theta no drag vertical — evita virar o globo de cabeça pra baixo.
export const THETA_MAX = 1.0
