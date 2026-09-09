<script setup lang="ts">
import EntityLink from './EntityLink.vue'
import EmptyState from '../../components/EmptyState.vue'
import { computed } from 'vue'
import { usePreview } from '../workspace'
import type { Comparison } from '../types'
const props = defineProps<{ comparison: Comparison }>()
const { state } = usePreview()
const runs = computed(() =>
  [props.comparison.baselineRunId, ...props.comparison.candidateRunIds].map((id) =>
    state.runs.find((run) => run.id === id),
  ),
)
const audit = computed(() =>
  state.audit.filter((item) =>
    [
      props.comparison.id,
      props.comparison.suggestionId,
      ...runs.value.map((run) => run?.id),
    ].includes(item.subject),
  ),
)
</script>

<template>
  <details class="panel">
    <summary>来源关系与操作留痕</summary>
    <p>对比 {{ comparison.id }} → 基线 / 候选运行 → 对象、输入、评分版本</p>
    <p v-if="comparison.sourceId">
      来源对比：<RouterLink :to="`/preview/comparisons/${comparison.sourceId}`">{{
        comparison.sourceId
      }}</RouterLink>
    </p>
    <p v-if="comparison.suggestionId">
      改进建议：<RouterLink
        :to="{ path: '/preview/analysis', query: { suggestion: comparison.suggestionId } }"
        >{{
          state.suggestions.find((item) => item.id === comparison.suggestionId)?.title ??
          comparison.suggestionId
        }}</RouterLink
      >
    </p>
    <ul class="lineage-list">
      <li v-for="(run, index) in runs" :key="index">
        <template v-if="run">
          <strong>{{ index ? '候选' : '基线' }}</strong>
          <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink>
          <p>
            <EntityLink context-key="src/preview/components/CompareLineage.vue:25"
              :to="{
                path: `/preview/targets/${run.config.targetId}`,
                query: { version: run.config.targetVersion },
              }"
              >{{ run.target.name }} @ {{ run.config.targetVersion }}</EntityLink
            >
            ·
            <EntityLink context-key="src/preview/components/CompareLineage.vue:33"
              :to="{
                path: `/preview/datasets/${run.config.datasetId}`,
                query: { version: String(run.config.datasetVersion) },
              }"
              >{{ run.config.datasetId }} @ {{ run.config.datasetVersion }}</EntityLink
            >
          </p>
          <p>
            评分：<EntityLink context-key="src/preview/components/CompareLineage.vue:42"
              :related="run.config.evaluatorRefs.map(item => ({ label: run.evaluators.find(entry => entry.id === item.id)?.name ?? '评分标准', to: { path: `/preview/evaluators/${item.id}`, query: { version: String(item.version) } } }))"
              v-for="ref in run.config.evaluatorRefs"
              :key="`${ref.id}@${ref.version}`"
              :to="{
                path: `/preview/evaluators/${ref.id}`,
                query: { version: String(ref.version) },
              }"
              >{{ ref.id }} @ {{ ref.version }}
            </EntityLink>
          </p>
          <p v-if="run.sourceRunId">
            来源运行
            <RouterLink :to="`/preview/runs/${run.sourceRunId}`">{{ run.sourceRunId }}</RouterLink>
          </p>
        </template>
        <span v-else>运行记录不存在。</span>
      </li>
    </ul>
    <h3>操作记录</h3>
    <EmptyState v-if="!audit.length" title="还没有操作记录" description="可先核对上方报告来源；后续保存对比设置或确认样本配对时，会在这里留下记录。" />
    <ul>
      <li v-for="entry in audit" :key="entry.id">
        {{ new Date(entry.time).toLocaleString() }} · {{ entry.actor }} · {{ entry.action }}
      </li>
    </ul>
  </details>
</template>

<style scoped>
li {
  overflow-wrap: anywhere;
  margin-bottom: 12px;
}
.lineage-list {
  padding-left: 20px;
}
p {
  margin: 6px 0;
}
a {
  display: inline-block;
  padding-block: 4px;
}
</style>
