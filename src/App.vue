<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BoundingSphere, Cartesian2, Cartesian3, Cartographic, Color, ConstantPositionProperty, CustomDataSource,
  Entity, GeoJsonDataSource, HeadingPitchRange, HeightReference, Math as CesiumMath, PolylineGlowMaterialProperty,
  ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer,
} from 'cesium'
import { cities, districtGeoJson } from './data'

const container = ref<HTMLElement>()
const drawerOpen = ref(false)
const activeTool = ref('城市探索')
const selected = ref(cities[0])
const coordinates = ref('121.50°E · 31.24°N')
const cameraHeight = ref('12.5 km')
const measuring = ref(false)
const routePlaying = ref(false)
let viewer: Viewer | undefined
let handler: ScreenSpaceEventHandler | undefined
let geoJsonLayer: GeoJsonDataSource | undefined
let measureSource: CustomDataSource | undefined
let measurePoints: Cartesian3[] = []

const statusLabel = computed(() => measuring.value ? '点击地球选择两个测量点' : '系统在线 · WebGL')

function flyTo(city: typeof cities[number]) {
  selected.value = city
  activeTool.value = city.name
  const target = Cartesian3.fromDegrees(city.lon, city.lat)
  viewer?.camera.flyToBoundingSphere(new BoundingSphere(target, 1), {
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-55), city.height),
    duration: 1.8,
  })
  drawerOpen.value = false
}

async function toggleGeoJson() {
  if (!viewer) return
  activeTool.value = '区域数据'
  if (geoJsonLayer) {
    viewer.dataSources.remove(geoJsonLayer, true)
    geoJsonLayer = undefined
    return
  }
  geoJsonLayer = await GeoJsonDataSource.load(districtGeoJson as never, {
    fill: Color.fromCssColorString('#00d4ff').withAlpha(0.26),
    stroke: Color.fromCssColorString('#6ee7ff'),
    strokeWidth: 3,
    clampToGround: true,
  })
  viewer.dataSources.add(geoJsonLayer)
  await viewer.flyTo(geoJsonLayer)
}

function playRoute() {
  if (!viewer || routePlaying.value) return
  routePlaying.value = true
  activeTool.value = '动态航线'
  const points = cities.map(c => Cartesian3.fromDegrees(c.lon, c.lat, 1500))
  const route = viewer.entities.add({
    polyline: {
      positions: points,
      width: 5,
      material: new PolylineGlowMaterialProperty({ color: Color.CYAN, glowPower: 0.22 }),
    },
  })
  const marker = viewer.entities.add({
    position: points[0],
    point: { pixelSize: 16, color: Color.WHITE, outlineColor: Color.CYAN, outlineWidth: 5 },
  })
  let index = 0
  const next = () => {
    if (!viewer || index >= points.length) {
      routePlaying.value = false
      window.setTimeout(() => viewer?.entities.remove(route), 1800)
      window.setTimeout(() => viewer?.entities.remove(marker), 1800)
      return
    }
    marker.position = new ConstantPositionProperty(points[index])
    flyTo(cities[index])
    index += 1
    window.setTimeout(next, 1900)
  }
  next()
}

function toggleMeasure() {
  if (!viewer) return
  measuring.value = !measuring.value
  activeTool.value = measuring.value ? '距离测量' : '城市探索'
  measurePoints = []
  if (!measureSource) {
    measureSource = new CustomDataSource('measure')
    viewer.dataSources.add(measureSource)
  }
  measureSource.entities.removeAll()
}

function measureClick(position: Cartesian2) {
  if (!viewer || !measuring.value || !measureSource) return
  const cartesian = viewer.scene.pickPosition(position) ?? viewer.camera.pickEllipsoid(position)
  if (!cartesian) return
  measurePoints.push(cartesian)
  measureSource.entities.add({ position: cartesian, point: { pixelSize: 10, color: Color.CYAN, heightReference: HeightReference.CLAMP_TO_GROUND } })
  if (measurePoints.length === 2) {
    const distance = Cartesian3.distance(measurePoints[0], measurePoints[1])
    const midpoint = Cartesian3.midpoint(measurePoints[0], measurePoints[1], new Cartesian3())
    measureSource.entities.add({
      position: midpoint,
      label: { text: `${(distance / 1000).toFixed(2)} km`, font: '600 16px sans-serif', fillColor: Color.WHITE, showBackground: true, backgroundColor: Color.fromCssColorString('#07111f').withAlpha(.8), pixelOffset: new Cartesian2(0, -18) },
      polyline: { positions: measurePoints, width: 4, material: Color.CYAN, clampToGround: true },
    })
    measuring.value = false
  }
}

onMounted(() => {
  viewer = new Viewer(container.value!, {
    animation: false, timeline: false, geocoder: false, homeButton: false,
    sceneModePicker: false, baseLayerPicker: false, navigationHelpButton: false,
    fullscreenButton: false, infoBox: false, selectionIndicator: false,
  })
  viewer.scene.globe.enableLighting = true
  viewer.resolutionScale = Math.min(window.devicePixelRatio, 1.5)
  cities.forEach(city => viewer!.entities.add({
    position: Cartesian3.fromDegrees(city.lon, city.lat),
    point: { pixelSize: 12, color: Color.fromCssColorString('#00d4ff'), outlineColor: Color.WHITE, outlineWidth: 2, heightReference: HeightReference.CLAMP_TO_GROUND },
    label: { text: city.name, font: '600 14px sans-serif', fillColor: Color.WHITE, pixelOffset: new Cartesian2(0, -24), showBackground: true, backgroundColor: Color.fromCssColorString('#07111f').withAlpha(.68) },
  }))
  handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((event: { position: Cartesian2 }) => measureClick(event.position), ScreenSpaceEventType.LEFT_CLICK)
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
      <div class="brand"><span class="brand-mark">CE</span><div><b>City Explorer</b><small>CESIUM LAB · 2026</small></div></div>
      <div class="top-actions">
        <span class="live"><i />{{ statusLabel }}</span>
        <button class="icon-btn" aria-label="重置视角" @click="flyTo(cities[0])">⌖</button>
      </div>
    </header>

    <aside class="rail">
      <span class="rail-label">EXPLORE</span>
      <button v-for="(city, i) in cities" :key="city.name" :class="{ active: selected.name === city.name }" @click="flyTo(city)">
        <span>0{{ i + 1 }}</span>{{ city.name }}
      </button>
      <div class="rail-line" />
      <button @click="toggleGeoJson"><span>05</span>区域</button>
      <button @click="playRoute"><span>06</span>航线</button>
      <button @click="toggleMeasure"><span>07</span>测量</button>
    </aside>

    <section class="hero-card">
      <p>FEATURED LOCATION</p>
      <h1>{{ selected.name }}</h1>
      <h2>{{ selected.subtitle }}</h2>
      <div class="rule" />
      <p class="description">基于真实经纬度构建的三维城市探索体验。拖动地球、选择城市，或开启空间数据能力演示。</p>
      <button class="primary" @click="playRoute">{{ routePlaying ? '演示进行中…' : '开始自动巡航' }} <span>→</span></button>
    </section>

    <section class="stats">
      <div><small>经纬度</small><b>{{ coordinates }}</b></div>
      <div><small>相机高度</small><b>{{ cameraHeight }}</b></div>
      <div><small>当前模式</small><b>{{ activeTool }}</b></div>
    </section>

    <button class="mobile-trigger" @click="drawerOpen = !drawerOpen">功能菜单 <span>⌃</span></button>
    <section class="mobile-drawer" :class="{ open: drawerOpen }">
      <button v-for="city in cities" :key="city.name" @click="flyTo(city)">{{ city.name }}</button>
      <button @click="toggleGeoJson">区域数据</button>
      <button @click="playRoute">自动航线</button>
      <button @click="toggleMeasure">距离测量</button>
    </section>
  </main>
</template>
