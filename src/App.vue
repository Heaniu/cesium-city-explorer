<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BoundingSphere, Cartesian2, Cartesian3, Cartographic, Color, ConstantPositionProperty, CustomDataSource,
  GeoJsonDataSource, HeadingPitchRange, HeightReference, ImageryLayer, Math as CesiumMath, NearFarScalar,
  OpenStreetMapImageryProvider, PolylineGlowMaterialProperty, ScreenSpaceEventHandler, ScreenSpaceEventType,
  UrlTemplateImageryProvider, Viewer,
} from 'cesium'
import { cities, districtGeoJson, type City } from './data'

type DrawMode = 'none' | 'measure' | 'point' | 'line' | 'polygon'
type BaseMap = 'osm' | 'dark'

const modelUrl = 'https://cesium.com/downloads/cesiumjs/releases/1.132/Apps/SampleData/models/CesiumAir/Cesium_Air.glb'
const container = ref<HTMLElement>()
const selected = ref(cities[0])
const coordinates = ref('121.50°E · 31.24°N')
const cameraHeight = ref('12.5 km')
const activeTool = ref('城市探索')
const drawMode = ref<DrawMode>('none')
const baseMap = ref<BaseMap>('osm')
const geoJsonVisible = ref(false)
const modelVisible = ref(false)
const routePlaying = ref(false)
const pickedInfo = ref('点击城市标记或绘制对象查看属性')

let viewer: Viewer | undefined
let handler: ScreenSpaceEventHandler | undefined
let baseLayer: ImageryLayer | undefined
let geoJsonLayer: GeoJsonDataSource | undefined
let measureSource: CustomDataSource | undefined
let drawSource: CustomDataSource | undefined
let routeSource: CustomDataSource | undefined
let modelSource: CustomDataSource | undefined
let sketchPoints: Cartesian3[] = []

const statusLabel = computed(() => drawMode.value === 'none' ? '系统在线 · WebGL' : '点击地球添加节点')
const drawModeLabel = computed(() => ({
  none: '浏览',
  measure: '距离测量',
  point: '绘制点',
  line: '绘制线',
  polygon: '绘制面',
}[drawMode.value]))

function ensureSources() {
  if (!viewer) return
  if (!measureSource) {
    measureSource = new CustomDataSource('measure')
    viewer.dataSources.add(measureSource)
  }
  if (!drawSource) {
    drawSource = new CustomDataSource('draw')
    viewer.dataSources.add(drawSource)
  }
  if (!routeSource) {
    routeSource = new CustomDataSource('route')
    viewer.dataSources.add(routeSource)
  }
  if (!modelSource) {
    modelSource = new CustomDataSource('model')
    viewer.dataSources.add(modelSource)
  }
}

function flyTo(city: City) {
  selected.value = city
  activeTool.value = city.name
  pickedInfo.value = `${city.name}：${city.summary}`
  const target = Cartesian3.fromDegrees(city.lon, city.lat)
  viewer?.camera.flyToBoundingSphere(new BoundingSphere(target, 1), {
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-55), city.height),
    duration: 1.6,
  })
}

function setBaseMap(type: BaseMap, force = false) {
  if (!viewer || (!force && baseMap.value === type)) return
  baseMap.value = type
  viewer.imageryLayers.removeAll(true)
  const provider = type === 'osm'
    ? new OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
    : new UrlTemplateImageryProvider({
      url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      credit: '© OpenStreetMap contributors © CARTO',
    })
  baseLayer = viewer.imageryLayers.addImageryProvider(provider, 0)
  activeTool.value = type === 'osm' ? '标准底图' : '暗色底图'
}

async function toggleGeoJson() {
  if (!viewer) return
  activeTool.value = 'GeoJSON 区域'
  if (geoJsonLayer) {
    viewer.dataSources.remove(geoJsonLayer, true)
    geoJsonLayer = undefined
    geoJsonVisible.value = false
    return
  }
  geoJsonLayer = await GeoJsonDataSource.load(districtGeoJson as never, {
    fill: Color.fromCssColorString('#00d4ff').withAlpha(0.26),
    stroke: Color.fromCssColorString('#6ee7ff'),
    strokeWidth: 3,
    clampToGround: true,
  })
  viewer.dataSources.add(geoJsonLayer)
  geoJsonVisible.value = true
  await viewer.flyTo(geoJsonLayer)
}

function toggleModel() {
  if (!viewer) return
  ensureSources()
  activeTool.value = '模型加载'
  modelVisible.value = !modelVisible.value
  modelSource!.entities.removeAll()
  if (!modelVisible.value) return
  const entity = modelSource!.entities.add({
    name: 'Cesium Air glTF 模型',
    position: Cartesian3.fromDegrees(121.5062, 31.2452, 450),
    model: {
      uri: modelUrl,
      scale: 2.2,
      minimumPixelSize: 84,
      maximumScale: 600,
    },
    label: {
      text: 'glTF 模型',
      font: '600 13px sans-serif',
      fillColor: Color.WHITE,
      showBackground: true,
      backgroundColor: Color.fromCssColorString('#07111f').withAlpha(.72),
      pixelOffset: new Cartesian2(0, -54),
      scaleByDistance: new NearFarScalar(1000, 1, 70000, .45),
    },
  })
  viewer.flyTo(entity, { duration: 1.2 })
}

function playRoute() {
  if (!viewer || routePlaying.value) return
  ensureSources()
  routePlaying.value = true
  activeTool.value = '动态航线'
  routeSource!.entities.removeAll()
  const points = cities.map(c => Cartesian3.fromDegrees(c.lon, c.lat, 1500))
  const route = routeSource!.entities.add({
    name: '城市航线',
    polyline: {
      positions: points,
      width: 5,
      material: new PolylineGlowMaterialProperty({ color: Color.CYAN, glowPower: 0.22 }),
    },
  })
  const marker = routeSource!.entities.add({
    name: '航线当前位置',
    position: points[0],
    point: { pixelSize: 16, color: Color.WHITE, outlineColor: Color.CYAN, outlineWidth: 5 },
  })
  let index = 0
  const next = () => {
    if (!viewer || index >= points.length) {
      routePlaying.value = false
      window.setTimeout(() => routeSource?.entities.remove(route), 1800)
      window.setTimeout(() => routeSource?.entities.remove(marker), 1800)
      return
    }
    marker.position = new ConstantPositionProperty(points[index])
    flyTo(cities[index])
    index += 1
    window.setTimeout(next, 1750)
  }
  next()
}

function setDrawMode(mode: DrawMode) {
  if (!viewer) return
  ensureSources()
  drawMode.value = mode
  activeTool.value = drawModeLabel.value
  sketchPoints = []
  if (mode === 'measure') measureSource!.entities.removeAll()
}

function clearSketch() {
  sketchPoints = []
  measureSource?.entities.removeAll()
  drawSource?.entities.removeAll()
  pickedInfo.value = '绘制与测量结果已清空'
}

function pickPosition(position: Cartesian2) {
  if (!viewer) return undefined
  return viewer.scene.pickPosition(position) ?? viewer.camera.pickEllipsoid(position)
}

function addMeasurePoint(cartesian: Cartesian3) {
  if (!measureSource) return
  sketchPoints.push(cartesian)
  measureSource.entities.add({
    name: '测量点',
    position: cartesian,
    point: { pixelSize: 10, color: Color.CYAN, heightReference: HeightReference.CLAMP_TO_GROUND },
  })
  if (sketchPoints.length === 2) {
    const distance = Cartesian3.distance(sketchPoints[0], sketchPoints[1])
    const midpoint = Cartesian3.midpoint(sketchPoints[0], sketchPoints[1], new Cartesian3())
    measureSource.entities.add({
      name: '距离测量',
      position: midpoint,
      label: {
        text: `${(distance / 1000).toFixed(2)} km`,
        font: '600 16px sans-serif',
        fillColor: Color.WHITE,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('#07111f').withAlpha(.8),
        pixelOffset: new Cartesian2(0, -18),
      },
      polyline: { positions: sketchPoints, width: 4, material: Color.CYAN, clampToGround: true },
    })
    pickedInfo.value = `两点距离：${(distance / 1000).toFixed(2)} km`
    setDrawMode('none')
  }
}

function addDrawGeometry(cartesian: Cartesian3) {
  if (!drawSource) return
  sketchPoints.push(cartesian)
  const commonPoint = {
    pixelSize: 10,
    color: Color.fromCssColorString('#ffcf5a'),
    outlineColor: Color.WHITE,
    outlineWidth: 2,
    heightReference: HeightReference.CLAMP_TO_GROUND,
  }
  if (drawMode.value === 'point') {
    drawSource.entities.add({ name: '绘制点', position: cartesian, point: commonPoint })
    pickedInfo.value = '已添加一个绘制点'
    setDrawMode('none')
    return
  }
  drawSource.entities.add({ name: '绘制节点', position: cartesian, point: commonPoint })
  if (drawMode.value === 'line' && sketchPoints.length === 2) {
    drawSource.entities.add({
      name: '绘制线',
      polyline: { positions: [...sketchPoints], width: 4, material: Color.fromCssColorString('#ffcf5a'), clampToGround: true },
    })
    pickedInfo.value = '已完成一条绘制线'
    setDrawMode('none')
  }
  if (drawMode.value === 'polygon' && sketchPoints.length === 3) {
    drawSource.entities.add({
      name: '绘制面',
      polygon: {
        hierarchy: [...sketchPoints],
        material: Color.fromCssColorString('#ffcf5a').withAlpha(.32),
        outline: true,
        outlineColor: Color.WHITE,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    })
    pickedInfo.value = '已完成一个三角面'
    setDrawMode('none')
  }
}

function handleClick(position: Cartesian2) {
  if (!viewer) return
  if (drawMode.value !== 'none') {
    const cartesian = pickPosition(position)
    if (!cartesian) return
    if (drawMode.value === 'measure') addMeasurePoint(cartesian)
    else addDrawGeometry(cartesian)
    return
  }
  const picked = viewer.scene.pick(position)
  if (picked?.id?.name) {
    pickedInfo.value = picked.id.description?.getValue?.() || picked.id.name
    activeTool.value = '点击拾取'
  }
}

onMounted(() => {
  viewer = new Viewer(container.value!, {
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
  })
  viewer.scene.globe.enableLighting = true
  viewer.scene.pickTranslucentDepth = true
  viewer.resolutionScale = Math.min(window.devicePixelRatio, 1.5)
  setBaseMap(baseMap.value, true)
  ensureSources()
  cities.forEach(city => viewer!.entities.add({
    name: city.name,
    description: `${city.name}：${city.summary}`,
    position: Cartesian3.fromDegrees(city.lon, city.lat),
    point: {
      pixelSize: 12,
      color: Color.fromCssColorString('#00d4ff'),
      outlineColor: Color.WHITE,
      outlineWidth: 2,
      heightReference: HeightReference.CLAMP_TO_GROUND,
    },
    label: {
      text: city.name,
      font: '600 14px sans-serif',
      fillColor: Color.WHITE,
      pixelOffset: new Cartesian2(0, -24),
      showBackground: true,
      backgroundColor: Color.fromCssColorString('#07111f').withAlpha(.68),
    },
  }))
  handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((event: { position: Cartesian2 }) => handleClick(event.position), ScreenSpaceEventType.LEFT_CLICK)
  viewer.camera.changed.addEventListener(() => {
    if (!viewer) return
    const c = Cartographic.fromCartesian(viewer.camera.position)
    coordinates.value = `${CesiumMath.toDegrees(c.longitude).toFixed(2)}°E · ${CesiumMath.toDegrees(c.latitude).toFixed(2)}°N`
    cameraHeight.value = c.height > 1000 ? `${(c.height / 1000).toFixed(1)} km` : `${c.height.toFixed(0)} m`
  })
  flyTo(cities[0])
})

onBeforeUnmount(() => {
  handler?.destroy()
  viewer?.destroy()
})
</script>

<template>
  <main class="shell">
    <div ref="container" class="globe" />

    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">CE</span>
        <div>
          <b>City Explorer</b>
          <small>CESIUM LAB · 2026</small>
        </div>
      </div>
      <div class="top-actions">
        <span class="live"><i />{{ statusLabel }}</span>
        <button class="icon-btn" aria-label="重置视角" title="重置视角" @click="flyTo(cities[0])">⌖</button>
      </div>
    </header>

    <aside class="rail">
      <span class="rail-label">EXPLORE</span>
      <button v-for="(city, i) in cities" :key="city.name" :class="{ active: selected.name === city.name }" @click="flyTo(city)">
        <span>0{{ i + 1 }}</span>{{ city.name }}
      </button>
      <div class="rail-line" />
      <button @click="toggleGeoJson"><span>05</span>{{ geoJsonVisible ? '隐藏区域' : 'GeoJSON' }}</button>
      <button @click="toggleModel"><span>06</span>{{ modelVisible ? '隐藏模型' : '模型' }}</button>
      <button @click="playRoute"><span>07</span>航线</button>
    </aside>

    <section class="hero-card">
      <p>FEATURED LOCATION</p>
      <h1>{{ selected.name }}</h1>
      <h2>{{ selected.subtitle }}</h2>
      <div class="rule" />
      <p class="description">{{ selected.summary }}</p>
      <button class="primary" @click="playRoute">{{ routePlaying ? '演示进行中' : '开始自动巡航' }} <span>→</span></button>
    </section>

    <section class="tool-panel">
      <div class="panel-row">
        <span>底图</span>
        <button :class="{ active: baseMap === 'osm' }" @click="setBaseMap('osm')">标准</button>
        <button :class="{ active: baseMap === 'dark' }" @click="setBaseMap('dark')">暗色</button>
      </div>
      <div class="panel-row">
        <span>绘制</span>
        <button :class="{ active: drawMode === 'point' }" @click="setDrawMode('point')">点</button>
        <button :class="{ active: drawMode === 'line' }" @click="setDrawMode('line')">线</button>
        <button :class="{ active: drawMode === 'polygon' }" @click="setDrawMode('polygon')">面</button>
        <button :class="{ active: drawMode === 'measure' }" @click="setDrawMode('measure')">量距</button>
      </div>
      <button class="ghost" @click="clearSketch">清空绘制</button>
    </section>

    <section class="stats">
      <div><small>经纬度</small><b>{{ coordinates }}</b></div>
      <div><small>相机高度</small><b>{{ cameraHeight }}</b></div>
      <div><small>当前模式</small><b>{{ activeTool }}</b></div>
      <div><small>拾取信息</small><b>{{ pickedInfo }}</b></div>
    </section>

    <section class="mobile-toolbar">
      <div class="mobile-group">
        <button v-for="city in cities" :key="city.name" :class="{ active: selected.name === city.name }" @click="flyTo(city)">
          {{ city.name }}
        </button>
      </div>
      <div class="mobile-group">
        <button :class="{ active: geoJsonVisible }" @click="toggleGeoJson">GeoJSON</button>
        <button :class="{ active: modelVisible }" @click="toggleModel">模型</button>
        <button :class="{ active: routePlaying }" @click="playRoute">航线</button>
        <button @click="setBaseMap(baseMap === 'osm' ? 'dark' : 'osm')">{{ baseMap === 'osm' ? '暗色' : '标准' }}</button>
        <button :class="{ active: drawMode === 'measure' }" @click="setDrawMode('measure')">量距</button>
        <button :class="{ active: drawMode === 'point' }" @click="setDrawMode('point')">点</button>
        <button :class="{ active: drawMode === 'line' }" @click="setDrawMode('line')">线</button>
        <button :class="{ active: drawMode === 'polygon' }" @click="setDrawMode('polygon')">面</button>
        <button @click="clearSketch">清空</button>
      </div>
    </section>
  </main>
</template>
