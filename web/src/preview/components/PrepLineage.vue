<script setup lang="ts">
import { computed } from 'vue'
import { usePreview } from '../workspace'
const props = defineProps<{ sources: string[] }>()
const { state } = usePreview()
const links = computed(() =>
  [...new Set(props.sources)].map((source) => {
    if (/^\/preview\//.test(source) && !source.includes('\\')) return { label: source, to: source }
    const dataset = state.datasets.find(
      (item) =>
        source === item.id || source.startsWith(`${item.id}@`) || source.startsWith(`${item.id}:`),
    )
    if (dataset) {
      const version = source.slice(dataset.id.length).match(/(?:@|:v?)(\d+)/)?.[1]
      const caseId = source.match(/@\d+:(.+)$/)?.[1]
      return {
        label: `${dataset.name}${version ? ` · v${version}` : ''} · ${source}`,
        to: `/preview/datasets/${dataset.id}${version ? `?version=${version}` : ''}${caseId ? `&case=${encodeURIComponent(caseId)}` : ''}`,
      }
    }
    const run = state.runs.find((item) => source === item.id || source.startsWith(`${item.id}:`))
    if (run) return { label: `${run.name} · ${source}`, to: `/preview/runs/${run.id}` }
    const target = state.targets.find(
      (item) => source === item.id || source.startsWith(`${item.id}@`),
    )
    if (target) return { label: `${target.name} · ${source}`, to: `/preview/targets/${target.id}` }
    return { label: source, to: '' }
  }),
)
</script>
<template>
  <ul v-if="links.length" class="prep-sources">
    <li v-for="link in links" :key="link.label">
      <RouterLink v-if="link.to" :to="link.to">{{ link.label }}</RouterLink
      ><span v-else>{{ link.label }}（来源引用）</span>
    </li>
  </ul>
  <span v-else class="muted">手工创建，暂无上游来源</span>
</template>
<style scoped>
.prep-sources {
  padding-left: 20px;
  overflow-wrap: anywhere;
}
</style>
