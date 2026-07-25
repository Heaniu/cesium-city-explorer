export type City = {
  name: string
  subtitle: string
  lon: number
  lat: number
  height: number
  summary: string
}

export const cities: City[] = [
  {
    name: '武汉',
    subtitle: '长江与汉江交汇之城',
    lon: 114.3055,
    lat: 30.5928,
    height: 13500,
    summary: '作为默认起点，展示中部城市视角、跨城巡航与基础交互能力。',
  },
  {
    name: '上海',
    subtitle: '陆家嘴金融中心',
    lon: 121.4998,
    lat: 31.2397,
    height: 12500,
    summary: '标记点、GeoJSON 区域与城市视角飞行的主演示区。',
  },
  {
    name: '北京',
    subtitle: '古都与现代都市',
    lon: 116.3975,
    lat: 39.9087,
    height: 16000,
    summary: '用于演示跨城市航线、相机定位与实体拾取。',
  },
  {
    name: '深圳',
    subtitle: '粤港澳大湾区',
    lon: 114.0579,
    lat: 22.5431,
    height: 13000,
    summary: '适合展示移动端浏览下的城市快速切换。',
  },
  {
    name: '成都',
    subtitle: '公园城市示范区',
    lon: 104.0665,
    lat: 30.5723,
    height: 14000,
    summary: '用于演示大范围相机飞行和路线播放收尾。',
  },
]

export const districtGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '浦东演示区', value: '数字城市核心区' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [121.47, 31.20], [121.58, 31.20], [121.59, 31.28],
          [121.48, 31.29], [121.47, 31.20],
        ]],
      },
    },
  ],
}
