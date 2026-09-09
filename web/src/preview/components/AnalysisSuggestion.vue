<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import { useDetailState } from '../../components/detailState'
import StatusNotice from '../../components/StatusNotice.vue'
import CaseEvidenceDrawer from './CaseEvidenceDrawer.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview, clone, uid } from '../workspace'
import { buildRun } from '../execution'
import { defaultGateRules, executionIssues, measureGates, preflight } from '../comparison'
import type { Comparison, Suggestion } from '../types'

const props = defineProps<{ suggestion: Suggestion }>()
const evidenceCase = useDetailState(() => `suggestion-evidence:${props.suggestion.id}`, '')
const route = useRoute(),
  router = useRouter()
const { state, change } = usePreview()
const feedback = ref(''),
  versionId = ref(''),
  inputVersion = ref(0),
  error = ref('')
const corrections = ref<{ id: string; expected: string }[]>([])
const sourceRun = computed(() => state.runs.find((item) => item.id === props.suggestion.runId))
const target = computed(() => state.targets.find((item) => item.id === props.suggestion.targetId))
const dataset = computed(() =>
  state.datasets.find((item) => item.id === sourceRun.value?.config.datasetId),
)
const regression = computed(() =>
  state.comparisons.find((item) => item.id === props.suggestion.comparisonId),
)
const regressionBase = computed(() =>
  state.runs.find((item) => item.id === regression.value?.baselineRunId),
)
const regressionRun = computed(() =>
  state.runs.find((item) => item.id === regression.value?.candidateRunIds[0]),
)
const allAttempts = computed(() =>
  state.comparisons.filter((item) => item.suggestionId === props.suggestion.id),
)
const relatedAudit = computed(() =>
  state.audit.filter(
    (item) =>
      item.subject === props.suggestion.id ||
      allAttempts.value.some((attempt) => attempt.id === item.subject),
  ),
)
const kindLabels = {
  prompt: '系统提示词',
  skill: 'Skill 边界',
  tool: '工具 / 节点',
  dataset: '测评用例',
}
const decisionLabels = { pending: '待确认', adopted: '已采纳', ignored: '已忽略' }
watch(
  () => props.suggestion.id,
  () => {
    feedback.value = props.suggestion.feedback
    versionId.value = props.suggestion.linkedVersion ?? ''
    inputVersion.value = Number(
      route.query.datasetVersion ??
        dataset.value?.versions[dataset.value.versions.length - 1]?.version ??
        0,
    )
    corrections.value = props.suggestion.caseIds.flatMap((id) => {
      const item = sourceRun.value?.cases.find((item) => item.id === id)
      return item ? [{ id, expected: item.expected }] : []
    })
    error.value = ''
  },
  { immediate: true },
)
watch(
  () => route.query.datasetVersion,
  (value) => {
    if (value) inputVersion.value = Number(value)
  },
)
const verification = computed(() => {
  const suggestion = props.suggestion
  if (suggestion.decision === 'ignored') return '已忽略。可重新处理，历史验证保留'
  if (suggestion.decision === 'pending') return '待确认。尚未认定或修复问题'
  if (!suggestion.comparisonId)
    return suggestion.kind === 'dataset'
      ? '已采纳。等待修订用例并复验'
      : suggestion.linkedVersion
        ? '已关联外部版本。等待回归'
        : '已采纳。等待外部修改'
  const base = regressionBase.value,
    candidate = regressionRun.value
  if (!base || !candidate || !regression.value) return '回归证据缺失'
  if (
    ['failed', 'cancelled', 'terminated'].includes(base.status) ||
    ['failed', 'cancelled', 'terminated'].includes(candidate.status)
  )
    return '回归执行未完成。不能验证'
  if (base.status !== 'completed' || candidate.status !== 'completed') return '回归执行中。等待结果'
  const results = suggestion.caseIds.map((id) =>
    candidate.results.find((item) => item.caseId === id),
  )
  if (
    !results.length ||
    results.some((item) => !item || item.outcome === 'NA' || item.outcome === 'review')
  )
    return '关联样本证据不足。需要补充或复核'
  if (results.some((item) => item?.outcome === 'error')) return '关联样本执行错误。未完成验证'
  if (suggestion.kind === 'dataset')
    return results.every((item) => item?.outcome === 'pass')
      ? '修订用例复验符合新期望（Mock；输入已改变，仅描述性）'
      : '修订用例复验仍未通过（Mock）'
  if (!preflight(base, candidate).controlled) return '配置不可比。不能验证改进效果'
  if (candidate.config.targetVersion !== suggestion.linkedVersion)
    return '回归版本与当前关联版本不同。需重新验证'
  if (results.some((item) => item?.outcome === 'fail')) return '关联问题仍存在。改进未验证'
  const improved = suggestion.caseIds.some(
    (id) =>
      base.results.find((item) => item.caseId === id)?.outcome === 'fail' &&
      candidate.results.find((item) => item.caseId === id)?.outcome === 'pass',
  )
  const gates = measureGates(base, candidate, regression.value.rules)
  if (!improved) return '关联样本无可确认改善（Mock）'
  return gates.some((item) => item.status === 'failed')
    ? '关联样本已改善。全量回归仍未通过（Mock）'
    : '关联样本已改善（Mock）。统计与发布结论见对比报告'
})

function decide(decision: Suggestion['decision']) {
  error.value = ''
  if (decision !== 'pending' && !feedback.value.trim()) {
    error.value = '请先填写采纳或忽略的反馈理由。'
    return
  }
  change(props.suggestion.id, `建议设为${decisionLabels[decision]}，记录反馈`, () => {
    props.suggestion.decision = decision
    props.suggestion.feedback = feedback.value.trim()
  })
}
function adopt() {
  decide('adopted')
}
function ignore() {
  decide('ignored')
}
function defer() {
  decide('pending')
}
function saveFeedback() {
  change(props.suggestion.id, '更新建议反馈', () => {
    props.suggestion.feedback = feedback.value.trim()
  })
}
function linkVersion() {
  error.value = ''
  if (props.suggestion.decision !== 'adopted') {
    error.value = '先确认采纳并记录反馈，再关联已同步的外部修改版本。'
    return
  }
  const version = target.value?.versions.find((item) => item.id === versionId.value)
  if (!version?.executable || version.id === props.suggestion.targetVersion) {
    error.value = '关联同一资产中不同于原版本的可执行版本。'
    return
  }
  change(props.suggestion.id, `关联源平台已发布版本 ${version.id}；等待回归验证`, () => {
    if (props.suggestion.linkedVersion !== version.id) props.suggestion.comparisonId = null
    props.suggestion.linkedVersion = version.id
  })
}
function saveDraft() {
  error.value = ''
  const input = dataset.value,
    run = sourceRun.value
  if (!input || !run) {
    error.value = '来源测评集或运行不存在。'
    return
  }
  if (input.draft !== null) {
    error.value = '此测评集已有草稿，请使用下方入口继续审阅，避免覆盖他人的修改。'
    return
  }
  const published = input.versions.find((item) => item.version === run.config.datasetVersion)
  if (!published) {
    error.value = '来源发布版本不存在，不能建立修订草稿。'
    return
  }
  if (!corrections.value.length || corrections.value.some((item) => !item.expected.trim())) {
    error.value = '为关联用例填写明确的期望。'
    return
  }
  const saved = change(
    props.suggestion.id,
    `将用例建议保存到 ${input.id} 修订草稿，原报告保留`,
    () => {
      input.draft = clone(published.cases).map((item) => {
        const correction = corrections.value.find((row) => row.id === item.id)
        return correction
          ? {
              ...item,
              expected: correction.expected.trim(),
              sources: [...new Set([...item.sources, props.suggestion.id, run.id])],
            }
          : item
      })
      input.draftBase = published.version
    },
  )
  if (saved) openDataset()
}
function openDataset() {
  if (!sourceRun.value) return
  router.push({
    path: `/preview/datasets/${sourceRun.value.config.datasetId}`,
    query: {
      draft: dataset.value?.draft ? '1' : undefined,
      run: sourceRun.value.id,
      case: props.suggestion.caseIds[0],
      returnTo: `/preview/analysis?tab=runtime&run=${sourceRun.value.id}&suggestion=${props.suggestion.id}`,
      targetVersion: sourceRun.value.config.targetVersion,
    },
  })
}
function startRegression() {
  error.value = ''
  const source = sourceRun.value,
    suggestion = props.suggestion
  if (!source || suggestion.decision !== 'adopted') {
    error.value = '需要有效来源运行，并先采纳建议。'
    return
  }
  const id = uid('cmp')
  if (
    suggestion.kind !== 'dataset' &&
    (!suggestion.linkedVersion || suggestion.linkedVersion === source.config.targetVersion)
  ) {
    error.value = '先关联外部已修改的可执行新版本。'
    return
  }
  if (suggestion.kind === 'dataset' && inputVersion.value === source.config.datasetVersion) {
    error.value = '请选择已修订发布的新测评集版本；Agent 版本保持原值。'
    return
  }
  const saved = change(
    suggestion.id,
    suggestion.kind === 'dataset'
      ? '以原 Agent 版本执行修订用例，创建描述性复验对比'
      : '创建建议关联的共同配置回归实验',
    () => {
      const config = { ...clone(source.config), scheduledAt: null, fault: 'none' as const }
      const comparison: Comparison = {
        id,
        name: `${suggestion.title} · 回归`,
        mode: suggestion.kind === 'dataset' ? 'historical' : 'controlled',
        baselineRunId: source.id,
        candidateRunIds: [],
        rules: defaultGateRules(),
        createdAt: new Date().toISOString(),
        sourceId: suggestion.comparisonId,
        suggestionId: suggestion.id,
      }
      if (suggestion.kind === 'dataset') {
        config.datasetVersion = inputVersion.value
        config.caseIds =
          dataset.value?.versions
            .find((item) => item.version === inputVersion.value)
            ?.cases.map((item) => item.id) ?? []
        if (suggestion.caseIds.some((caseId) => !config.caseIds.includes(caseId)))
          throw new Error('新测评集版本缺少关联用例，不能验证此建议。')
        const issues = executionIssues(state, config)
        if (issues.length) throw new Error(issues.join(' '))
        const candidate = buildRun(state, config, `${suggestion.title} · 用例复验`, source.id)
        candidate.comparisonId = id
        comparison.candidateRunIds = [candidate.id]
        state.runs.push(candidate)
      } else {
        const versions = [source.config.targetVersion, suggestion.linkedVersion!]
        const created = versions.map((version) => {
          const currentConfig = { ...clone(config), targetVersion: version }
          const issues = executionIssues(state, currentConfig)
          if (issues.length) throw new Error(issues.join(' '))
          const run = buildRun(state, currentConfig, `${suggestion.title} · ${version}`, source.id)
          run.cases = clone(source.cases)
          run.evaluators = clone(source.evaluators)
          if (version === source.config.targetVersion) run.target = clone(source.target)
          run.comparisonId = id
          return run
        })
        comparison.baselineRunId = created[0].id
        comparison.candidateRunIds = [created[1].id]
        state.runs.push(...created)
      }
      state.comparisons.unshift(comparison)
      suggestion.comparisonId = id
    },
  )
  if (saved) router.push(`/preview/comparisons/${id}`)
}
</script>

<template>
  <section class="panel suggestion-detail">
    <MetadataGroup
      :items="[
        { label: '建议类型', value: kindLabels[suggestion.kind] },
        { label: '优先级', value: suggestion.priority },
        { label: '处理状态', value: decisionLabels[suggestion.decision] },
      ]"
    />
    <h2>{{ suggestion.title }}</h2>
    <StatusNotice>{{ verification }}</StatusNotice>
    <p><strong>来源事实：</strong>{{ suggestion.evidence }}</p>
    <p><strong>待验证假设：</strong>{{ suggestion.hypothesis }}</p>
    <p><strong>建议动作：</strong>{{ suggestion.action }}</p>
    <StatusNotice type="error" v-if="!sourceRun">
      找不到来源任务，无法查看证据或创建回归。请从任务列表重新选择报告。
      <RouterLink to="/preview/runs">查看测评任务</RouterLink>
    </StatusNotice>
    <template v-else
      ><p>
        <RouterLink :to="`/preview/runs/${sourceRun.id}`">来源运行 {{ sourceRun.name }}</RouterLink>
      </p>
      <EntityRef
        :name="sourceRun.target.name"
        :type="sourceRun.target.type"
        :version="suggestion.targetVersion"
        compact
      />
      <div class="action-row">
        <button
          class="text-button"
          v-for="id in suggestion.caseIds"
          :key="id"
          @click="evidenceCase = id"
        >
          {{ sourceRun.cases.find((item) => item.id === id)?.question || '查看用例证据' }}
        </button>
      </div></template
    >
    <label class="feedback-label"
      >处理反馈（采纳 / 忽略需理由）<el-input
        v-model="feedback"
        type="textarea"
        :rows="3"
        placeholder="记录判断依据、待外部修改项或忽略原因"
    /></label>
    <div class="action-row">
      <el-button :disabled="state.role === 'viewer'" type="primary" @click="adopt"
        >采纳建议</el-button
      ><el-button :disabled="state.role === 'viewer'" @click="ignore">忽略建议</el-button
      ><el-button :disabled="state.role === 'viewer'" @click="defer">设为待确认</el-button
      ><el-button :disabled="state.role === 'viewer'" @click="saveFeedback">保存反馈</el-button>
    </div>
    <p v-if="state.role === 'viewer'" class="muted">
      当前为只读角色，无权修改建议、用例或发起回归。
    </p>
    <template v-if="suggestion.decision === 'adopted' && sourceRun">
      <div v-if="suggestion.kind !== 'dataset'" class="improvement-step">
        <h3>关联外部修改 → 固定配置回归</h3>
        <p>
          请在源平台修改并发布后，关联这里已经同步的同一资产新版本。一个版本可以落实多条建议；采纳只记录决定。
        </p>
        <label
          >已修改的外部版本<el-select v-model="versionId" aria-label="已修改的外部版本"
            ><el-option
              v-for="version in target?.versions ?? []"
              :key="version.id"
              :value="version.id"
              :label="version.label"
              :disabled="
                !version.executable || version.id === suggestion.targetVersion
              " /></el-select></label
        ><el-button @click="linkVersion" :disabled="state.role === 'viewer'">关联此版本</el-button>
        <p>当前关联：{{ suggestion.linkedVersion ?? '尚未关联，等待外部修改' }}</p>
        <p class="muted">
          将重新测评原基线与候选，共同使用下列固定输入和原评分标准、执行设置，原任务与证据保留。
        </p>
        <EntityRef :name="dataset?.name ?? '测评集名称未提供'" type="测评集" :version="sourceRun.config.datasetVersion" compact />
      </div>
      <div v-else class="improvement-step">
        <h3>修订测评用例 → 使用原 Agent 复验</h3>
        <p>
          此建议修改输入资产；保留 {{ sourceRun.target.name }}
          {{ sourceRun.config.targetVersion }}，无需新 Agent 版本。
        </p>
        <label v-for="item in corrections" :key="item.id" class="correction-label"
          >修订期望：{{
            sourceRun.cases.find((entry) => entry.id === item.id)?.question || '用例内容未提供'
          }}<el-input v-model="item.expected" type="textarea" :rows="3"
        /></label>
        <div class="action-row">
          <el-button :disabled="state.role === 'viewer'" @click="saveDraft"
            >保存修订草稿并审阅发布</el-button
          ><el-button @click="openDataset">前往测评集继续修订 / 发布</el-button>
        </div>
        <label class="feedback-label"
          >已修订发布的测评集版本<el-select v-model="inputVersion" aria-label="已修订发布的测评集版本"
            ><el-option
              v-for="version in dataset?.versions ?? []"
              :key="version.version"
              :value="version.version"
              :label="`版本 ${version.version}`"
              :disabled="version.version === sourceRun.config.datasetVersion"
              ><EntityRef
                :name="dataset?.name ?? ''"
                type="测评集"
                :version="version.version"
                compact /><MetadataGroup
                :items="[{ label: '发布说明', value: version.note }]" /></el-option></el-select
        ></label>
        <StatusNotice type="warning">
          旧输入与新输入只能描述性比较；复验用于核对修订后的期望，不把差值归因于 Agent 改善。
        </StatusNotice>
      </div>
      <details>
        <summary>本次回归的 Mock 阈值</summary>
        <p>
          平均分 ≥ 0.8；适用 用例通过率 ≥ 80%；执行错误率 ≤ 0%；平均耗时 ≤ 3000 ms；平均单例 Token
          用量 ≤ 2000。完整结果及模拟统计场景在对比报告逐项展示。
        </p>
      </details>
      <el-button
        type="primary"
        :disabled="
          state.role === 'viewer' || (suggestion.kind !== 'dataset' && !suggestion.linkedVersion)
        "
        @click="startRegression"
        >{{
          suggestion.kind === 'dataset' ? '创建用例复验与描述性对比' : '创建受控回归对比'
        }}</el-button
      >
    </template>
    <StatusNotice type="error" v-if="error">{{ error }}</StatusNotice>
    <details v-if="allAttempts.length || relatedAudit.length">
      <summary>回归历史与操作留痕</summary>
      <ul>
        <li v-for="attempt in allAttempts" :key="attempt.id">
          <RouterLink :to="`/preview/comparisons/${attempt.id}`">{{ attempt.name }}</RouterLink>
          <MetadataGroup
            :items="[{ label: '创建时间', value: new Date(attempt.createdAt).toLocaleString() }]"
          />
        </li>
      </ul>
      <ul>
        <li v-for="entry in relatedAudit" :key="entry.id">
          <p>{{ entry.action }}</p>
          <MetadataGroup
            :items="[{ label: '操作时间', value: new Date(entry.time).toLocaleString() }]"
          />
        </li>
      </ul>
    </details>
  </section>
  <CaseEvidenceDrawer
    v-if="sourceRun"
    v-model="evidenceCase"
    :run-id="sourceRun.id"
    :items="
      suggestion.caseIds.map((id) => ({
        key: id,
        label: sourceRun?.cases.find((item) => item.id === id)?.question ?? '用例证据',
      }))
    "
  />
</template>

<style scoped>
.suggestion-detail {
  overflow-wrap: anywhere;
}
.feedback-label,
.correction-label {
  display: block;
  margin: 16px 0;
}
.improvement-step {
  margin: 24px 0;
  padding-top: 20px;
  border-top: 1px solid var(--ag-line);
}
.improvement-step .el-select {
  display: block;
  margin: 8px 0 12px;
  max-width: 550px;
}
.action-row > a {
  display: inline-block;
  padding: 8px 0;
}
.notice.error {
  margin-top: 16px;
}
:deep(.el-button) {
  margin-left: 0;
  max-width: 100%;
}
</style>
