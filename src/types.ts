export type City = {
  name: string
  subtitle: string
  lon: number
  lat: number
  height: number
  summary: string
}

export type DrawMode = 'none' | 'measure' | 'point' | 'line' | 'polygon'

export type BaseMap = 'osm' | 'dark'
