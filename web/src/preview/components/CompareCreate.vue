<script setup lang="ts">
import FormSection from '../../components/FormSection.vue'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePreview, clone, uid } from '../workspace'
import { buildRun } from '../execution'
import {
  defaultGateRules,
  executionIssues,
  metricDefinitions,
  runStatusLabels,
} from '../comparison'
import type { Comparison, ExecutionConfig } from '../types'
import ComparePreflight from './ComparePreflight.vue'

const emit = defineEmits<{ created: [id: string] }>()
const route = useRoute()
const { state, change } = usePreview()
const sourceId = String(route.query.run ?? route.query.baseline ?? '')
const source = state.runs.find((item) => item.id === sourceId) ?? state.runs[0]
const mode = ref<'historical' | 'controlled'>(
  route.query.mode === 'controlled' ? 'controlled' : 'historical',
)
const name = ref('版本效果对比')
const assetId = ref(
  String(route.query.target ?? source?.config.targetId ?? state.targets[0]?.id ?? ''),
)
const baselineId = ref(source?.config.targetId === assetId.value ? source.id : '')
const candidateIds = ref<string[]>([])
const baselineVersion = ref(source?.config.targetVersion ?? 'v1')
const candidateVersions = ref<string[]>([])
const error = ref('')
const rules = ref(defaultGateRules())
const schedule = ref('')
const config = reactive<ExecutionConfig>(
  clone(
    source?.config ?? {
      targetId: assetId.value,
      targetVersion: 'v1',
      datasetId: state.datasets[0]?.id ?? '',
      datasetVersion: 1,
      evaluatorRefs: [],
      concurrency: 2,
      timeout: 60,
      retries: 1,
      sampling: 100,
      caseIds: [],
      resourceId: 'public-model',
      resourcePurpose: 'both',
      model: '体验模型',
      scheduledAt: null,
      fault: 'none',
      threshold: 0.8,
    },
  ),
)
config.scheduledAt = null
config.fault = 'none'
config.executionResourceId ??= config.resourceId
config.scoringResourceId ??= config.resourceId
const target = computed(() => state.targets.find((item) => item.id === assetId.value))
const runs = computed(() => state.runs.filter((item) => item.config.targetId === assetId.value))
const baseline = computed(() => state.runs.find((item) => item.id === baselineId.value))
const candidates = computed(() =>
  candidateIds.value
    .map((id) => state.runs.find((item) => item.id === id))
    .filter((item) => item !== undefined),
)
const dataset = computed(() => state.datasets.find((item) => item.id === config.datasetId))
const datasetVersion = computed(() =>
  dataset.value?.versions.find((item) => item.version === config.datasetVersion),
)
const evaluatorOptions = computed(() =>
  state.evaluators
    .filter((item) => !item.archived)
    .flatMap((item) =>
      item.versions.map((version) => ({
        value: `${item.id}@${version.version}`,
        label: `${item.name} v${version.version}`,
      })),
    ),
)
const evaluatorSelection = computed({
  get: () => config.evaluatorRefs.map((item) => `${item.id}@${item.version}`),
  set: (values: string[]) => {
    config.evaluatorRefs = values.map((value) => {
      const [id, version] = value.split('@')
      return { id, version: Number(version) }
    })
  },
})
const caseCount = computed(
  () =>
    config.caseIds.length ||
    Math.min(
      datasetVersion.value?.cases.length ?? 0,
      Math.ceil(((datasetVersion.value?.cases.length ?? 0) * config.sampling) / 100),
    ),
)
const publicStages = computed(() =>
  [
    state.credentials.find((item) => item.id === config.executionResourceId)?.kind === 'public'
      ? '执行'
      : '',
    state.credentials.find((item) => item.id === config.scoringResourceId)?.kind === 'public'
      ? '评分'
      : '',
  ]
    .filter(Boolean)
    .join('、'),
)
const issues = computed(() => {
  const messages: string[] = []
  if (!name.value.trim()) messages.push('填写对比名称。')
  if (!target.value) messages.push('目标资产不存在。')
  if (
    !rules.value.length ||
    rules.value.some(
      (rule) =>
        !Number.isFinite(rule.threshold) ||
        rule.threshold < 0 ||
        (['score', 'passRate', 'errorRate'].includes(rule.metric) && rule.threshold > 1),
    )
  )
    messages.push('规则阈值无效：分数与比率使用 0–1，其余使用非负值。')
  if (mode.value === 'historical') {
    if (!baseline.value || baseline.value.config.targetId !== assetId.value)
      messages.push('选择同一资产的基线运行。')
    if (!candidates.value.length || candidates.value.length !== candidateIds.value.length)
      messages.push('至少选择一个候选运行。')
    if (
      candidates.value.some(
        (item) => item.config.targetId !== assetId.value || item.id === baselineId.value,
      )
    )
      messages.push('候选必须属于同一资产且不能是基线记录。')
  } else {
    if (!candidateVersions.value.length || candidateVersions.value.includes(baselineVersion.value))
      messages.push('至少选择一个与基线不同的候选版本。')
    for (const version of [baselineVersion.value, ...candidateVersions.value])
      messages.push(
        ...executionIssues(state, { ...config, targetId: assetId.value, targetVersion: version }),
      )
  }
  return [...new Set(messages)]
})

function changeAsset() {
  const first = runs.value[0]
  baselineId.value = first?.id ?? ''
  candidateIds.value = []
  candidateVersions.value = []
  baselineVersion.value = target.value?.versions.find((item) => item.executable)?.id ?? ''
  if (first) Object.assign(config, clone(first.config))
  else {
    const input =
      state.datasets.find((item) => !item.archived && item.targetId === assetId.value) ??
      state.datasets.find((item) => !item.archived)
    config.datasetId = input?.id ?? ''
    config.datasetVersion = input?.versions[0]?.version ?? 1
    config.caseIds = []
  }
  config.executionResourceId ??= config.resourceId
  config.scoringResourceId ??= config.resourceId
  config.scheduledAt = null
  config.fault = 'none'
  schedule.value = ''
}
function changeBaseline() {
  candidateIds.value = candidateIds.value.filter((id) => id !== baselineId.value)
}
function changeBaselineVersion() {
  candidateVersions.value = candidateVersions.value.filter((id) => id !== baselineVersion.value)
}
function changeDataset() {
  config.datasetVersion = dataset.value?.versions[0]?.version ?? 1
  config.caseIds = []
}
function changeDatasetVersion() {
  config.caseIds = []
}
function changeSampling() {
  config.caseIds = []
}
function changeResource() {
  config.resourceId = config.executionResourceId ?? config.resourceId
  config.resourcePurpose = 'both'
  config.model = state.credentials.find((item) => item.id === config.resourceId)?.model ?? ''
}
function changeSchedule() {
  config.scheduledAt = schedule.value ? new Date(schedule.value).toISOString() : null
}
function create() {
  error.value = ''
  if (issues.value.length) {
    error.value = issues.value.join(' ')
    return
  }
  const id = uid('cmp')
  const comparison: Comparison = {
    id,
    name: name.value.trim(),
    mode: mode.value,
    baselineRunId: baselineId.value,
    candidateRunIds: [...candidateIds.value],
    rules: clone(rules.value),
    createdAt: new Date().toISOString(),
    sourceId: null,
    suggestionId: null,
  }
  const saved = change(
    id,
    mode.value === 'controlled'
      ? '创建共同配置的多版本 Mock 实验'
      : '比较已有 Mock 结果；保留原运行',
    () => {
      if (mode.value === 'controlled') {
        const versions = [baselineVersion.value, ...candidateVersions.value]
        const created = versions.map((version) =>
          buildRun(
            state,
            { ...clone(config), targetId: assetId.value, targetVersion: version },
            `${name.value.trim()} · ${version}`,
            source?.config.targetId === assetId.value ? source.id : null,
          ),
        )
        created.forEach((run) => {
          run.comparisonId = id
        })
        comparison.baselineRunId = created[0].id
        comparison.candidateRunIds = created.slice(1).map((run) => run.id)
        state.runs.push(...created)
      }
      state.comparisons.unshift(comparison)
    },
  )
  if (saved) emit('created', id)
}
</script>

<template>
  <section class="panel">
    <h2>创建版本对比</h2>
    <p class="muted">全部为本地 Mock 体验。新实验的输入、标准、参数和判定规则在提交时固定。</p>
    <el-alert
      v-if="state.role === 'viewer'"
      title="当前为只读角色，无权创建对比或执行实验。"
      type="warning"
      :closable="false"
    />
    <el-form class="preview-form" label-position="top" @submit.prevent="create">
      <el-form-item label="创建方式"
        ><el-radio-group v-model="mode"
          ><el-radio-button value="historical">比较已有运行</el-radio-button
          ><el-radio-button value="controlled">执行受控新实验</el-radio-button></el-radio-group
        ></el-form-item
      >
      <div class="preview-columns compare-form-grid">
        <el-form-item label="对比名称"><el-input v-model="name" maxlength="100" /></el-form-item>
        <el-form-item label="同一目标资产"
          ><el-select v-model="assetId" @change="changeAsset"
            ><el-option
              v-for="item in state.targets"
              :key="item.id"
              :value="item.id"
              :label="`${item.type} · ${item.name}`" /></el-select
        ></el-form-item>
      </div>
      <template v-if="mode === 'historical'">
        <p class="notice">仅保存已有运行的比较关联；执行时间、配置差异和缺失结果会显示在报告中。</p>
        <el-form-item label="基线运行 A"
          ><el-select v-model="baselineId" @change="changeBaseline"
            ><el-option
              v-for="run in runs"
              :key="run.id"
              :value="run.id"
              :label="`${run.name} · ${run.config.targetVersion} · ${runStatusLabels[run.status]}`" /></el-select
        ></el-form-item>
        <el-form-item label="候选运行 B（可多选，分别对基线）"
          ><el-select v-model="candidateIds" multiple
            ><el-option
              v-for="run in runs.filter((item) => item.id !== baselineId)"
              :key="run.id"
              :value="run.id"
              :label="`${run.name} · ${run.config.targetVersion} · ${runStatusLabels[run.status]}`" /></el-select
        ></el-form-item>
        <template v-if="baseline"
          ><ComparePreflight
            v-for="candidate in candidates"
            :key="candidate.id"
            :baseline="baseline"
            :candidate="candidate"
        /></template>
      </template>
      <template v-else>
        <div class="preview-columns compare-form-grid">
          <el-form-item label="基线对象版本 A"
            ><el-select v-model="baselineVersion" @change="changeBaselineVersion"
              ><el-option
                v-for="version in target?.versions ?? []"
                :key="version.id"
                :label="version.label"
                :value="version.id"
                :disabled="!version.executable" /></el-select
          ></el-form-item>
          <el-form-item label="候选对象版本（可多选）"
            ><el-select v-model="candidateVersions" multiple
              ><el-option
                v-for="version in target?.versions ?? []"
                :key="version.id"
                :label="version.label"
                :value="version.id"
                :disabled="!version.executable || version.id === baselineVersion" /></el-select
          ></el-form-item>
          <el-form-item label="共同测评集"
            ><el-select v-model="config.datasetId" @change="changeDataset"
              ><el-option
                v-for="item in state.datasets.filter((item) => !item.archived)"
                :key="item.id"
                :value="item.id"
                :label="item.name" /></el-select
          ></el-form-item>
          <el-form-item label="固定测评集版本"
            ><el-select v-model="config.datasetVersion" @change="changeDatasetVersion"
              ><el-option
                v-for="version in dataset?.versions ?? []"
                :key="version.version"
                :value="version.version"
                :label="`v${version.version} · ${version.cases.length} 条`" /></el-select
          ></el-form-item>
        </div>
        <el-form-item label="共同评估器（固定版本）"
          ><el-select v-model="evaluatorSelection" multiple
            ><el-option
              v-for="item in evaluatorOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label" /></el-select
        ></el-form-item>
        <div class="preview-columns compare-form-grid">
          <el-form-item label="执行阶段资源"
            ><el-select v-model="config.executionResourceId" @change="changeResource"
              ><el-option
                v-for="item in state.credentials"
                :key="item.id"
                :value="item.id"
                :label="`${item.name}${!item.healthy || !item.enabled ? '（不可用）' : ''}`"
                :disabled="!item.healthy || !item.enabled" /></el-select
          ></el-form-item>
          <el-form-item label="评分阶段资源"
            ><el-select v-model="config.scoringResourceId"
              ><el-option
                v-for="item in state.credentials"
                :key="item.id"
                :value="item.id"
                :label="`${item.name}${!item.healthy || !item.enabled ? '（不可用）' : ''}`"
                :disabled="!item.healthy || !item.enabled" /></el-select
          ></el-form-item>
        </div>
        <p class="muted">
          {{
            publicStages
              ? `公共并发仅约束${publicStages}阶段；当前公共上限 ${state.publicConcurrency}。私有阶段不进入公共队列。`
              : '执行与评分均使用私有资源，不进入公共队列。'
          }}
        </p>
        <FormSection title="共同参数与样本范围" optional description="默认使用全部用例和当前执行参数；仅在需要限制范围或预约时修改。">
          <div class="preview-columns compare-form-grid">
            <el-form-item label="模型标识（Mock）"
              ><el-input v-model="config.model"
            /></el-form-item>
            <el-form-item label="并发数"
              ><el-input-number v-model="config.concurrency" :min="1" :max="100" :precision="0"
            /></el-form-item>
            <el-form-item label="单条超时（秒）"
              ><el-input-number v-model="config.timeout" :min="1" :max="3600"
            /></el-form-item>
            <el-form-item label="基础设施失败重试次数"
              ><el-input-number v-model="config.retries" :min="0" :max="10" :precision="0"
            /></el-form-item>
            <el-form-item label="采样率（%，改动后重置显式子集）"
              ><el-input-number
                v-model="config.sampling"
                :min="1"
                :max="100"
                @change="changeSampling"
            /></el-form-item>
            <el-form-item label="机器评分通过阈值（0–1）"
              ><el-input-number v-model="config.threshold" :min="0" :max="1" :step="0.05"
            /></el-form-item>
            <el-form-item label="预约执行（本地时间，留空立即）"
              ><input
                v-model="schedule"
                class="schedule-input"
                type="datetime-local"
                @change="changeSchedule"
            /></el-form-item>
            <el-form-item label="体验故障场景"
              ><el-select v-model="config.fault"
                ><el-option label="正常执行" value="none" /><el-option
                  label="基础设施中断"
                  value="infrastructure" /><el-option
                  label="未采集 Trace"
                  value="missing-trace" /><el-option
                  label="未采集 Token 用量与耗时"
                  value="missing-usage" /></el-select
            ></el-form-item>
          </div>
          <el-form-item label="共同用例子集（留空按采样率选择，显式选择优先）"
            ><el-select v-model="config.caseIds" multiple filterable
              ><el-option
                v-for="item in datasetVersion?.cases ?? []"
                :key="item.id"
                :value="item.id"
                :label="`${item.id} · ${item.question}`" /></el-select
          ></el-form-item>
        </FormSection>
        <p class="notice">
          执行量：{{ candidateVersions.length + 1 }} 个版本 × {{ caseCount }} 条 =
          {{ (candidateVersions.length + 1) * caseCount }} 次 Mock
          样本执行。各版本使用同一输入范围；无真实 Agent 或 LLM 调用。
        </p>
      </template>
      <details open>
        <summary>
          {{
            mode === 'historical' ? '本次事后评审规则（不回写原运行）' : '执行前固定的多维判定规则'
          }}
        </summary>
        <p class="muted">
          默认值是可编辑的 Mock 演示规则，不代表生产上线政策。比率用 0–1，例如 0.8 = 80%。
        </p>
        <div class="gate-rule-grid">
          <div v-for="rule in rules" :key="rule.metric" class="rule-card">
            <label :for="`rule-${rule.metric}`"
              >{{ metricDefinitions[rule.metric].label }} ·
              {{ metricDefinitions[rule.metric].unit }}</label
            >
            <div class="action-row">
              <el-select
                v-model="rule.operator"
                :aria-label="`${metricDefinitions[rule.metric].label}比较符`"
                ><el-option label="不低于 ≥" value=">=" /><el-option label="不高于 ≤" value="<="
              /></el-select>
              <el-input-number
                :id="`rule-${rule.metric}`"
                v-model="rule.threshold"
                :min="0"
                :step="rule.metric === 'latency' ? 100 : 0.01"
                :max="['score', 'passRate', 'errorRate'].includes(rule.metric) ? 1 : undefined"
              />
            </div>
          </div>
        </div>
      </details>
      <p v-if="error" role="alert" class="notice error">{{ error }}</p>
      <p v-if="issues.length" class="muted">待补充：{{ issues.join(' ') }}</p>
      <el-button type="primary" native-type="submit" :disabled="state.role === 'viewer'">{{
        mode === 'historical' ? '生成已有结果对比' : '创建并执行 Mock 实验'
      }}</el-button>
    </el-form>
  </section>
</template>

<style scoped>
.compare-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}
.gate-rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.rule-card {
  border: 1px solid var(--ag-line);
  border-radius: 6px;
  padding: 12px;
  min-width: 0;
}
.rule-card label {
  display: block;
  margin-bottom: 8px;
}
.rule-card .el-select {
  width: 120px;
}
.schedule-input {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid #b9c0ca;
  border-radius: 4px;
  padding: 8px;
}
:deep(.el-select),
:deep(.el-input-number) {
  max-width: 100%;
}
@media (max-width: 700px) {
  .compare-form-grid {
    grid-template-columns: 1fr;
  }
  .gate-rule-grid {
    grid-template-columns: 1fr;
  }
  :deep(.el-radio-button__inner) {
    padding-inline: 10px;
  }
}
</style>
