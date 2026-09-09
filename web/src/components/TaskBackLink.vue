<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
const props = withDefaults(defineProps<{ fallback: RouteLocationRaw; label?: string }>(), { label: '返回任务列表' })
const route = useRoute()
const origin = computed(() => {
  const value = route.query.origin
  return typeof value === 'string' && /^\/(?!\/)[^\\\s]*$/.test(value) ? value : null
})
</script>
<template>
  <RouterLink class="back-link" :to="origin ?? fallback"><span aria-hidden="true">← </span>{{ origin ? '返回来源页面' : label }}</RouterLink>
</template>
