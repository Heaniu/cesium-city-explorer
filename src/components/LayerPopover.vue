<script setup lang="ts">
import { computed } from 'vue'

type LayerBubble = {
  title: string
  meta: string
  description: string
}

const props = defineProps<{
  bubble: LayerBubble | null
  position: { left: string, top: string }
}>()

const virtualRef = computed(() => ({
  getBoundingClientRect: () => new DOMRect(
    Number.parseFloat(props.position.left),
    Number.parseFloat(props.position.top),
    0,
    0,
  ),
}))
</script>

<template>
  <el-popover
    popper-class="layer-popover"
    placement="top"
    :show-arrow="true"
    :teleported="false"
    :virtual-ref="virtualRef"
    virtual-triggering
    :visible="Boolean(bubble)"
    :width="340"
  >
    <template v-if="bubble">
      <p class="layer-popover__meta">{{ bubble.meta }}</p>
      <h2 class="layer-popover__title">{{ bubble.title }}</h2>
      <div class="rule" />
      <p class="layer-popover__description">{{ bubble.description }}</p>
    </template>
  </el-popover>
</template>
