<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import { provideDetailState } from '../components/detailState'

provideDetailState()
const route = useRoute()
const preview = computed(() => route.path.startsWith('/preview'))
const switchPath = computed(() => {
  const section = route.path.replace(/^\/preview/, '').split('/')[1] || ''
  const common = [
    '',
    'targets',
    'datasets',
    'evaluators',
    'runs',
    'comparisons',
    'capabilities',
  ].includes(section)
  return preview.value
    ? common
      ? `/${section}`
      : '/capabilities'
    : `/preview${section === 'lineage' ? '/capabilities' : section ? `/${section}` : ''}`
})
const open = ref(false),
  collapsed = ref(false),
  mobile = ref(false)
const toggle = ref<HTMLButtonElement>()
const media = window.matchMedia('(max-width: 767px)')
function resize() {
  mobile.value = media.matches
  if (!mobile.value) open.value = false
}
async function close() {
  open.value = false
  await nextTick()
  toggle.value?.focus()
}
function trapNavigation(event: KeyboardEvent) {
  if (!open.value || !mobile.value || event.key !== 'Tab') return
  const nodes = document.querySelectorAll<HTMLElement>('#app-navigation a, #app-navigation button')
  const first = nodes[0],
    last = nodes[nodes.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
watch(open, async (value) => {
  document.body.style.overflow = value && mobile.value ? 'hidden' : ''
  if (value) {
    await nextTick()
    document.querySelector<HTMLElement>('#app-navigation .nav-close')?.focus()
  }
})
watch(
  () => route.path,
  async () => {
    open.value = false
    document.title = `${route.meta.title ?? '测评平台'} · AgentGate`
    await nextTick()
    document.getElementById('workspace-main')?.focus({ preventScroll: true })
  },
  { immediate: true },
)
onMounted(() => {
  resize()
  media.addEventListener('change', resize)
})
onUnmounted(() => {
  media.removeEventListener('change', resize)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="product-shell"
    :class="{ 'nav-collapsed': collapsed }"
    @keydown="trapNavigation"
    @keydown.esc="open && close()"
  >
    <a class="skip-link" href="#workspace-main">跳到主要内容</a>
    <AppSidebar
      :open="open"
      :collapsed="collapsed && !mobile"
      :inert="mobile && !open"
      :aria-hidden="mobile && !open ? true : undefined"
      @close="close"
    />
    <button
      v-if="open"
      class="product-backdrop"
      tabindex="-1"
      aria-label="关闭导航遮罩"
      @click="close"
    ></button>
    <div class="product-body" :inert="mobile && open">
      <header class="product-topbar">
        <button
          ref="toggle"
          class="mobile-toggle"
          aria-label="打开导航"
          aria-controls="app-navigation"
          :aria-expanded="open"
          @click="open = !open"
        >
          ☰
        </button>
        <button
          class="desktop-toggle"
          :aria-label="collapsed ? '展开导航' : '收起导航'"
          @click="collapsed = !collapsed"
        >
          ☰
        </button>
        <span class="location-label"
          >智能体测评平台 <span>/</span> <strong>{{ route.meta.title }}</strong></span
        >
        <RouterLink class="environment-link" :to="switchPath">{{
          preview ? '切换真实接入' : '进入完整 Mock 体验'
        }}</RouterLink>
      </header>
      <main id="workspace-main" class="product-main" tabindex="-1"><RouterView /></main>
      <footer class="product-footer">AgentGate · 测评配置、版本与结果可追溯</footer>
    </div>
  </div>
</template>
