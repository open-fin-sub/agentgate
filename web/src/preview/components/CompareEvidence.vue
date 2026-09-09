<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import { outcomeLabels } from './RunSupport'
import { useDetailState } from '../../components/detailState'
import EmptyState from '../../components/EmptyState.vue'
import TokenUsage from '../../components/TokenUsage.vue'
import ValueView from '../../components/ValueView.vue'
import { computed, ref } from 'vue'
import CaseEvidenceDrawer from './CaseEvidenceDrawer.vue'
import type { CaseResult, Run, TestCase } from '../types'
import { formatMetric } from '../comparison'
const props = defineProps<{
  run: Run
  sample?: TestCase
  result?: CaseResult
  label: string
  items?: { key: string; label: string }[]
}>()
const evidenceCase = useDetailState(
  () => `comparison-evidence:${props.run.id}:${props.label}:${props.sample?.id}`,
  '',
)
const evidenceItems = computed(
  () => props.items ?? props.run.cases.map((item) => ({ key: item.id, label: item.question })),
)
</script>

<template>
  <article class="compare-evidence">
    <h3>{{ label }}</h3>
    <EntityRef
      :name="run.target.name"
      :type="run.target.type"
      :version="run.config.targetVersion"
      compact
    />
    <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink>
    <template v-if="sample">
      <MetadataGroup
        :items="[
          { label: '分类', value: sample.category },
          { label: '标签', value: sample.tags.join('、') || '无' },
        ]"
      />
      <details>
        <summary>查看用例编号</summary>
        <code>{{ sample.id }}</code>
      </details>
      <strong>输入</strong>
      <ValueView :value="sample.question" />
      <strong>期望</strong>
      <ValueView :value="sample.expected" />
    </template>
    <EmptyState
      v-else
      title="此侧缺少用例快照"
      description="请核对另一侧证据，或从原报告检查该用例是否包含在测评范围内。"
    ></EmptyState>
    <template v-if="result">
      <p>
        <span :class="['badge', result.outcome]">{{ outcomeLabels[result.outcome] }}</span>
      </p>
      <MetadataGroup :items="[{ label: '分数', value: formatMetric('score', result.score) }]" />
      <strong>实际输出</strong>
      <ValueView :value="result.output || '无有效输出'" />
      <p>{{ result.reason }}</p>
      <MetadataGroup :items="[{ label: '实际 Skill', value: result.actualSkill || '未采集' }]" />
      <TokenUsage
        :input="result.inputTokens"
        :output="result.outputTokens"
        :total="result.tokens"
        :latency="result.latency"
        scope="本条用例"
      />
      <button class="text-button" @click="evidenceCase = result.caseId">
        查看样本与 Trace{{ result.trace.length ? `（${result.trace.length} 节点）` : '（未采集）' }}
        →
      </button>
    </template>
    <EmptyState
      v-else
      title="此侧没有评分结果"
      description="请核对原任务进度或错误原因。缺少结果不计为零分。"
    ></EmptyState>
  </article>
  <CaseEvidenceDrawer v-model="evidenceCase" :run-id="run.id" :items="evidenceItems" />
</template>

<style scoped>
.compare-evidence {
  min-width: 0;
  border: 1px solid var(--ag-line);
  border-radius: 6px;
  padding: 16px;
  overflow-wrap: anywhere;
}
h3 {
  font-size: 17px;
  margin-bottom: 6px;
}
strong {
  display: block;
  margin-top: 12px;
}
.value-text {
  margin: 6px 0 12px;
}
a {
  display: inline-block;
  padding-block: 6px;
}
</style>
