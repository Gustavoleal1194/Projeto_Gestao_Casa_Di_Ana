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

export interface Capital {
  nome: string
  lat: number
  lng: number
  destaque?: boolean  // SP é destaque por ser base da Casa di Ana
}

/**
 * Nós principais da rede — capitais globais reais, distribuídas nos
 * continentes para equilíbrio estético. Brasil representado por São Paulo
 * (não Brasília) por ser a base operacional da Casa di Ana.
 * São fixos: mesmas coordenadas geográficas sempre, rotacionam com o globo.
 */
export const CAPITAIS: Capital[] = [
  // Américas
  { nome: 'São Paulo',        lat: -23.5505, lng:  -46.6333, destaque: true },
  { nome: 'Nova York',        lat:  40.7128, lng:  -74.0060 },
  { nome: 'Cidade do México', lat:  19.4326, lng:  -99.1332 },
  { nome: 'Buenos Aires',     lat: -34.6037, lng:  -58.3816 },
  // Europa
  { nome: 'Londres',          lat:  51.5074, lng:   -0.1278 },
  { nome: 'Paris',            lat:  48.8566, lng:    2.3522 },
  { nome: 'Moscou',           lat:  55.7558, lng:   37.6173 },
  // África
  { nome: 'Cairo',            lat:  30.0444, lng:   31.2357 },
  { nome: 'Cidade do Cabo',   lat: -33.9249, lng:   18.4241 },
  // Oriente Médio / Ásia / Oceania
  { nome: 'Dubai',            lat:  25.2048, lng:   55.2708 },
  { nome: 'Mumbai',           lat:  19.0760, lng:   72.8777 },
  { nome: 'Singapura',        lat:   1.3521, lng:  103.8198 },
  { nome: 'Pequim',           lat:  39.9042, lng:  116.4074 },
  { nome: 'Tóquio',           lat:  35.6762, lng:  139.6503 },
  { nome: 'Sydney',           lat: -33.8688, lng:  151.2093 },
]

// Markers do cobe: derivados das capitais, com São Paulo em destaque
export const GLOBE_NODES: GlobeMarker[] = CAPITAIS.map((c) => ({
  location: [c.lat, c.lng],
  size: c.destaque ? 0.06 : 0.035,
}))

// Velocidade de auto-rotação (incremento de phi por frame).
export const AUTO_ROTATE_SPEED = 0.003

// Amplitude máxima do parallax de cursor, em radianos.
export const PARALLAX_MAX_DELTA = 0.3

// Sensibilidade do drag (radianos por pixel de movimento do ponteiro).
export const DRAG_SENSITIVITY = 0.005

// Limite do theta no drag vertical — evita virar o globo de cabeça pra baixo.
export const THETA_MAX = 1.0
