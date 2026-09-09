<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import EntityLink from './EntityLink.vue'
import { computed } from 'vue'
import { usePreview } from '../workspace'
const props = defineProps<{ sources: string[] }>()
const { state } = usePreview()
const links = computed(() =>
  [...new Set(props.sources)].map((source) => {
    if (/^\/preview\//.test(source) && !source.includes('\\'))
      return {
        name: '查看来源页面',
        type: '来源记录',
        source,
        to: source,
        asset: false,
        version: undefined,
      }
    const dataset = state.datasets.find(
      (item) =>
        source === item.id || source.startsWith(`${item.id}@`) || source.startsWith(`${item.id}:`),
    )
    if (dataset) {
      const version = source.slice(dataset.id.length).match(/(?:@|:v?)(\d+)/)?.[1]
      const caseId = source.match(/@\d+:(.+)$/)?.[1]
      return {
        name: dataset.name,
        type: '测评集',
        source,
        version,
        asset: true,
        to: `/preview/datasets/${dataset.id}${version ? `?version=${version}` : ''}${caseId ? `&case=${encodeURIComponent(caseId)}` : ''}`,
      }
    }
    const run = state.runs.find((item) => source === item.id || source.startsWith(`${item.id}:`))
    if (run)
      return {
        name: run.name,
        type: '测评任务',
        source,
        to: `/preview/runs/${run.id}`,
        asset: false,
        version: undefined,
      }
    const target = state.targets.find(
      (item) => source === item.id || source.startsWith(`${item.id}@`),
    )
    if (target) {
      const version = source.startsWith(`${target.id}@`)
        ? source.slice(target.id.length + 1)
        : undefined
      return {
        name: target.name,
        type: target.type,
        source,
        version,
        asset: true,
        to: `/preview/targets/${target.id}${version ? `?version=${encodeURIComponent(version)}` : ''}`,
      }
    }
    return {
      name: '其他来源记录',
      type: '来源说明',
      source,
      to: '',
      asset: false,
      version: undefined,
    }
  }),
)
</script>
<template>
  <ul v-if="links.length" class="prep-sources">
    <li v-for="link in links" :key="link.source">
      <EntityRef
        :name="link.name"
        :type="link.type"
        :version="link.version"
        :id="link.source"
        compact
      >
        <template #name>
          <EntityLink
            v-if="link.asset"
            :context-key="`prep-source:${link.source}`"
            :to="link.to"
            :related="
              links
                .filter((item) => item.asset && item.type === link.type)
                .map((item) => ({ label: item.name, to: item.to }))
            "
            >{{ link.name }}</EntityLink
          >
          <RouterLink v-else-if="link.to" :to="link.to">{{ link.name }}</RouterLink>
          <span v-else>{{ link.name }}</span>
        </template>
      </EntityRef>
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
