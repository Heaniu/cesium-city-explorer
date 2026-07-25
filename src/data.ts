export const cities = [
  { name: '上海', subtitle: '陆家嘴金融中心', lon: 121.4998, lat: 31.2397, height: 12500 },
  { name: '北京', subtitle: '古都与现代都市', lon: 116.3975, lat: 39.9087, height: 16000 },
  { name: '深圳', subtitle: '粤港澳大湾区', lon: 114.0579, lat: 22.5431, height: 13000 },
  { name: '成都', subtitle: '公园城市示范区', lon: 104.0665, lat: 30.5723, height: 14000 },
]

export const districtGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '浦东演示区域', value: '数字城市核心区' },
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
