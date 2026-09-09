<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{
  modelValue: boolean
  title: string
  items?: { key: string; label: string }[]
  currentKey?: string
  fullPath?: string
  beforeClose?: () => boolean | Promise<boolean>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; select: [key: string] }>()
const index = computed(() => props.items?.findIndex((item) => item.key === props.currentKey) ?? -1)
let origin: HTMLElement | null = null
const busy = ref(false)
function opened() {
  origin = document.activeElement instanceof HTMLElement ? document.activeElement : null
}
function closed() {
  origin?.focus()
}
async function close(done: () => void) {
  busy.value = true
  try {
    if (!props.beforeClose || (await props.beforeClose())) done()
  } finally {
    busy.value = false
  }
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
    @open="opened"
    @closed="closed"
    ><nav v-if="items?.length" class="ux-detail-nav" aria-label="详情切换">
      <el-button :disabled="index <= 0 || busy" @click="emit('select', items[index - 1]!.key)"
        >上一条</el-button
      ><span>{{ index + 1 }} / {{ items.length }}</span
      ><el-button
        :disabled="index < 0 || index >= items.length - 1 || busy"
        @click="emit('select', items[index + 1]!.key)"
        >下一条</el-button
      >
    </nav>
    <RouterLink v-if="fullPath" :to="fullPath" class="ux-full-link">全页打开</RouterLink>
    <div class="ux-drawer-content"><slot /></div
  ></el-drawer>
</template>
<style scoped>
.ux-detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
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
