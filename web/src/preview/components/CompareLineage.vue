<script setup lang="ts">
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
            <RouterLink
              :to="{
                path: `/preview/targets/${run.config.targetId}`,
                query: { version: run.config.targetVersion },
              }"
              >{{ run.target.name }} @ {{ run.config.targetVersion }}</RouterLink
            >
            ·
            <RouterLink
              :to="{
                path: `/preview/datasets/${run.config.datasetId}`,
                query: { version: String(run.config.datasetVersion) },
              }"
              >{{ run.config.datasetId }} @ {{ run.config.datasetVersion }}</RouterLink
            >
          </p>
          <p>
            评分：<RouterLink
              v-for="ref in run.config.evaluatorRefs"
              :key="`${ref.id}@${ref.version}`"
              :to="{
                path: `/preview/evaluators/${ref.id}`,
                query: { version: String(ref.version) },
              }"
              >{{ ref.id }} @ {{ ref.version }}
            </RouterLink>
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
    <p v-if="!audit.length" class="muted">此对比暂无操作记录；种子数据仅为 Mock 示例。</p>
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
