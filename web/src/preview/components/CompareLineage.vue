<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
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
    <p>查看基线与候选任务使用的对象、测评集和评分版本。</p>
    <p v-if="comparison.sourceId">
      来源对比：<RouterLink :to="`/preview/comparisons/${comparison.sourceId}`">{{
        state.comparisons.find((item) => item.id === comparison.sourceId)?.name || '查看来源对比'
      }}</RouterLink>
    </p>
    <p v-if="comparison.suggestionId">
      改进建议：<RouterLink
        :to="{ path: '/preview/analysis', query: { suggestion: comparison.suggestionId } }"
        >{{
          state.suggestions.find((item) => item.id === comparison.suggestionId)?.title ??
          '查看改进建议'
        }}</RouterLink
      >
    </p>
    <ul class="lineage-list">
      <li v-for="(run, index) in runs" :key="index">
        <template v-if="run">
          <strong>{{ index ? '候选' : '基线' }}</strong>
          <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink>
          <div class="entity-group">
            <EntityRef
              :name="run.target.name"
              :type="run.target.type"
              :version="run.config.targetVersion"
              compact
              ><template #name>
                <EntityLink
                  context-key="src/preview/components/CompareLineage.vue:25"
                  :to="{
                    path: `/preview/targets/${run.config.targetId}`,
                    query: { version: run.config.targetVersion },
                  }"
                  >{{ run.target.name }}</EntityLink
                >
              </template></EntityRef
            >
            <EntityRef
              :name="state.datasets.find((item) => item.id === run.config.datasetId)?.name ?? ''"
              type="测评集"
              :version="run.config.datasetVersion"
              compact
              ><template #name>
                <EntityLink
                  context-key="src/preview/components/CompareLineage.vue:33"
                  :to="{
                    path: `/preview/datasets/${run.config.datasetId}`,
                    query: { version: String(run.config.datasetVersion) },
                  }"
                  >{{
                    state.datasets.find((item) => item.id === run.config.datasetId)?.name ||
                    '查看测评集版本'
                  }}</EntityLink
                >
              </template></EntityRef
            >
          </div>
          <div class="entity-group">
            <EntityRef
              v-for="ref in run.config.evaluatorRefs"
              :key="`${ref.id}@${ref.version}`"
              :name="run.evaluators.find((item) => item.id === ref.id)?.name ?? ''"
              type="评估器"
              :version="ref.version"
              compact
              ><template #name>
                <EntityLink
                  context-key="src/preview/components/CompareLineage.vue:42"
                  :related="
                    run.config.evaluatorRefs.map((item) => ({
                      label:
                        run.evaluators.find((entry) => entry.id === item.id)?.name ?? '评分标准',
                      to: {
                        path: `/preview/evaluators/${item.id}`,
                        query: { version: String(item.version) },
                      },
                    }))
                  "
                  :to="{
                    path: `/preview/evaluators/${ref.id}`,
                    query: { version: String(ref.version) },
                  }"
                  >{{ run.evaluators.find((item) => item.id === ref.id)?.name || '查看评分标准' }}
                </EntityLink>
              </template></EntityRef
            >
          </div>
          <p v-if="run.sourceRunId">
            来源运行
            <RouterLink :to="`/preview/runs/${run.sourceRunId}`">{{
              state.runs.find((item) => item.id === run.sourceRunId)?.name || '查看来源任务'
            }}</RouterLink>
          </p>
        </template>
        <span v-else>测评任务不存在。</span>
      </li>
    </ul>
    <h3>操作记录</h3>
    <EmptyState
      v-if="!audit.length"
      title="还没有操作记录"
      description="可先核对上方报告来源；后续保存对比设置或确认样本配对时，会在这里留下记录。"
    />
    <ul>
      <li v-for="entry in audit" :key="entry.id">
        <p>{{ entry.action }}</p>
        <MetadataGroup
          :items="[
            { label: '操作时间', value: new Date(entry.time).toLocaleString() },
            { label: '操作人', value: entry.actor },
          ]"
        />
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
