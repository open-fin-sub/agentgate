<script setup lang="ts">
import { ref, watch } from 'vue'
import DetailNavigation from './DetailNavigation.vue'
const props = defineProps<{
  modelValue: boolean
  title: string
  items?: { key: string; label: string }[]
  currentKey?: string
  returnFocusKey?: string
  fullPath?: string
  beforeClose?: () => boolean | Promise<boolean>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; select: [key: string] }>()
let origin: HTMLElement | null = null
let lastKey = props.currentKey
watch(() => props.currentKey, key => { if (key) lastKey = key }, { flush: 'sync' })
const busy = ref(false)
watch(() => props.modelValue, (open) => {
  if (open) origin = document.activeElement instanceof HTMLElement ? document.activeElement : null
}, { flush: 'sync' })
function closed() {
  const explicit = props.returnFocusKey ? document.querySelector<HTMLElement>(`[data-detail-key="${CSS.escape(props.returnFocusKey)}"]`) : null
  const trigger = explicit ?? (origin?.isConnected ? origin : lastKey ? document.querySelector<HTMLElement>(`[data-detail-key="${CSS.escape(lastKey)}"]`) : null)
  trigger?.focus({ preventScroll: true })
}
async function close(done: () => void) {
  if (busy.value) return
  busy.value = true
  try {
    if (!props.beforeClose || (await props.beforeClose())) done()
  } finally {
    busy.value = false
  }
}
async function select(key: string) {
  if (busy.value) return
  busy.value = true
  try {
    if (!props.beforeClose || await props.beforeClose()) emit('select', key)
  } finally { busy.value = false }
}
</script>
<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    size="min(920px, 100vw)"
    append-to-body
    :before-close="close"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="closed"
    ><DetailNavigation v-if="items" :items="items" :current-key="currentKey" :busy="busy" @select="select" />
    <RouterLink v-if="fullPath" :to="fullPath" class="ux-full-link">全页打开</RouterLink>
    <div class="ux-drawer-content"><slot /></div
  ></el-drawer>
</template>
<style scoped>
.ux-full-link {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  margin-bottom: 16px;
}
.ux-drawer-content {
  min-width: 0;
}
.ux-drawer-content :deep(.page-intro) {
  margin-top: 0;
}
.ux-drawer-content :deep(h1) {
  font-size: 24px;
  line-height: 32px;
}
</style>
