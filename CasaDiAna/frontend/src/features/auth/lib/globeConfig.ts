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
 * Capitais das 20 maiores potências econômicas (PIB nominal).
 * Brasil representado por São Paulo (base da Casa di Ana) como hub principal.
 * Índices fixos — alterar a ordem quebra CONEXOES_HUB em NeuralMesh.tsx.
 *
 * 0:SP  1:Washington  2:Toronto     3:Cidade do México
 * 4:Londres  5:Paris  6:Berlim      7:Roma       8:Madri
 * 9:Amsterdã 10:Zurique 11:Moscou   12:Istambul  13:Riade
 * 14:Nova Déli  15:Pequim  16:Seul  17:Tóquio    18:Jacarta  19:Sydney
 */
export const CAPITAIS: Capital[] = [
  // Américas
  { nome: 'São Paulo',        lat: -23.5505, lng:  -46.6333, destaque: true },
  { nome: 'Washington D.C.',  lat:  38.9072, lng:  -77.0369 },
  { nome: 'Toronto',          lat:  43.6532, lng:  -79.3832 },
  { nome: 'Cidade do México', lat:  19.4326, lng:  -99.1332 },
  // Europa
  { nome: 'Londres',          lat:  51.5074, lng:   -0.1278 },
  { nome: 'Paris',            lat:  48.8566, lng:    2.3522 },
  { nome: 'Berlim',           lat:  52.5200, lng:   13.4050 },
  { nome: 'Roma',             lat:  41.9028, lng:   12.4964 },
  { nome: 'Madri',            lat:  40.4168, lng:   -3.7038 },
  { nome: 'Amsterdã',         lat:  52.3676, lng:    4.9041 },
  { nome: 'Zurique',          lat:  47.3769, lng:    8.5417 },
  { nome: 'Moscou',           lat:  55.7558, lng:   37.6173 },
  // Oriente Médio
  { nome: 'Istambul',         lat:  41.0082, lng:   28.9784 },
  { nome: 'Riade',            lat:  24.7136, lng:   46.6753 },
  // Sul / Leste da Ásia / Oceania
  { nome: 'Nova Déli',        lat:  28.6139, lng:   77.2090 },
  { nome: 'Pequim',           lat:  39.9042, lng:  116.4074 },
  { nome: 'Seul',             lat:  37.5665, lng:  126.9780 },
  { nome: 'Tóquio',           lat:  35.6762, lng:  139.6503 },
  { nome: 'Jacarta',          lat:  -6.2088, lng:  106.8456 },
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
