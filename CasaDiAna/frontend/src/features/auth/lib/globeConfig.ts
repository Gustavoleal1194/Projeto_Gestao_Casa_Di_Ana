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

// Capitais estratégicas distribuídas globalmente para sugerir alcance internacional.
// SP fica maior por ser a "base" da Casa di Ana; as demais são coadjuvantes discretas.
// Limitação do cobe: todos os markers compartilham a cor `markerColor` global —
// a hierarquia é feita por tamanho.
export const GLOBE_CAPITAIS: GlobeMarker[] = [
  { location: [-23.5505, -46.6333], size: 0.085 }, // São Paulo (destaque)
  { location: [ 40.7128, -74.0060], size: 0.030 }, // Nova York
  { location: [ 51.5074,  -0.1278], size: 0.030 }, // Londres
  { location: [ 25.2048,  55.2708], size: 0.030 }, // Dubai
  { location: [ 35.6762, 139.6503], size: 0.030 }, // Tóquio
  { location: [-33.8688, 151.2093], size: 0.030 }, // Sydney
  { location: [ 19.4326, -99.1332], size: 0.030 }, // Cidade do México
  { location: [-33.9249,  18.4241], size: 0.030 }, // Cidade do Cabo
]

// Arcos HUD sobrepostos ao globo em coordenadas de tela (% do viewBox 100x100).
// Não seguem a rotação do globo por design: compõem uma camada "HUD/interface"
// flutuante sobre o mapa, reforçando a sensação de dashboard futurista.
export interface ArcoConexao {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  curvatura: number  // -1..1, offset do ponto de controle perpendicular à linha
  duracao: number    // segundos para a partícula percorrer o arco
  delay: number      // offset inicial em segundos
}

export const CONEXOES_HUD: ArcoConexao[] = [
  { id: 'sp-nyc',  x1: 42, y1: 60, x2: 38, y2: 38, curvatura: -0.35, duracao: 4.2, delay: 0    },
  { id: 'nyc-lon', x1: 38, y1: 38, x2: 52, y2: 30, curvatura: -0.30, duracao: 3.8, delay: 0.9  },
  { id: 'lon-tok', x1: 52, y1: 30, x2: 72, y2: 42, curvatura: -0.38, duracao: 5.4, delay: 1.6  },
  { id: 'tok-syd', x1: 72, y1: 42, x2: 72, y2: 64, curvatura:  0.28, duracao: 3.6, delay: 0.4  },
]

// Velocidade de auto-rotação (incremento de phi por frame).
export const AUTO_ROTATE_SPEED = 0.003

// Amplitude máxima do parallax de cursor, em radianos.
export const PARALLAX_MAX_DELTA = 0.3

// Sensibilidade do drag (radianos por pixel de movimento do ponteiro).
export const DRAG_SENSITIVITY = 0.005

// Limite do theta no drag vertical — evita virar o globo de cabeça pra baixo.
export const THETA_MAX = 1.0
