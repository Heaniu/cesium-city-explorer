<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCesiumDemo } from './composables/useCesiumDemo'

const container = ref<HTMLElement>()

const {
  activeTool,
  baseMap,
  cameraHeight,
  cities,
  clearSketch,
  coordinates,
  drawMode,
  flyTo,
  geoJsonVisible,
  initViewer,
  modelVisible,
  pickedInfo,
  playRoute,
  routePlaying,
  selected,
  setBaseMap,
  setDrawMode,
  showCityInfo,
  statusLabel,
  tilesVisible,
  toggle3DTiles,
  toggleGeoJson,
  toggleModel,
} = useCesiumDemo(container)

onMounted(initViewer)
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
      <button v-for="(city, i) in cities" :key="city.name" :class="{ active: showCityInfo && selected.name === city.name }" @click="flyTo(city)">
        <span>0{{ i + 1 }}</span>{{ city.name }}
      </button>
      <div class="rail-line" />
      <button @click="toggleGeoJson"><span>06</span>{{ geoJsonVisible ? '隐藏区域' : 'GeoJSON' }}</button>
      <button @click="toggleModel"><span>07</span>{{ modelVisible ? '隐藏模型' : '模型' }}</button>
      <button @click="toggle3DTiles"><span>08</span>{{ tilesVisible ? '隐藏瓦片' : '3D Tiles' }}</button>
      <button @click="playRoute"><span>09</span>航线</button>
    </aside>

    <section v-if="showCityInfo" class="hero-card">
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
        <button v-for="city in cities" :key="city.name" :class="{ active: showCityInfo && selected.name === city.name }" @click="flyTo(city)">
          {{ city.name }}
        </button>
      </div>
      <div class="mobile-group">
        <button :class="{ active: geoJsonVisible }" @click="toggleGeoJson">GeoJSON</button>
        <button :class="{ active: modelVisible }" @click="toggleModel">模型</button>
        <button :class="{ active: tilesVisible }" @click="toggle3DTiles">3D Tiles</button>
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
