<script setup lang="ts">
import EntityRef from '../components/EntityRef.vue'
import MetadataGroup from '../components/MetadataGroup.vue'
import { useDetailState } from '../components/detailState'
import DetailDrawer from '../components/DetailDrawer.vue'
import CaseResultPage from './CaseResultPage.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, ApiError, type Report } from '../api/client'
import { runsApi } from '../api/runs'
import { compareRuns } from '../api/comparisons'
import type { EvaluationRun } from '../types/run'
import type { ComparisonChange, EvaluationComparison } from '../types/comparison'
import { catalogLabel } from '../catalogLabels'
import { metricLabel } from '../metricLabels'
import { gateLabels, outcomeLabels, scoreText } from '../resultLabels'

const route = useRoute(),
  router = useRouter()
const runs = ref<EvaluationRun[]>([]),
  baseline = ref(''),
  candidate = ref('')
const result = ref<EvaluationComparison | null>(null),
  reports = ref<Report[]>([])
const loading = ref(false),
  error = ref(''),
  listError = ref(''),
  conflict = ref(false),
  page = ref(1)
const labels: Record<ComparisonChange, string> = {
  improvement: '改善',
  regression: '退步',
  changed: '状态变化',
  unchanged: '不变',
}
const selectedChange = computed(() =>
  Object.keys(labels).includes(String(route.query.change)) ? String(route.query.change) : '',
)
const selectionDirty = computed(
  () =>
    !!result.value &&
    (baseline.value !== result.value.baseline_run_id ||
      candidate.value !== result.value.candidate_run_id),
)
const query = computed(() => String(route.query.q ?? ''))
const baselineReport = computed(() => reports.value[0])
const candidateReport = computed(() => reports.value[1])
const cases = computed(
  () =>
    new Map(
      baselineReport.value?.run.manifest.dataset.cases.map((item) => [item.id, item.name]) ?? [],
    ),
)
const evaluators = computed(
  () =>
    new Map(
      baselineReport.value?.run.manifest.evaluator_specs.map((item) => [item.id, item]) ?? [],
    ),
)
const filtered = computed(
  () =>
    result.value?.case_deltas.filter(
      (item) =>
        (!selectedChange.value || item.change === selectedChange.value) &&
        `${item.case_id} ${cases.value.get(item.case_id)} ${catalogLabel(evaluators.value.get(item.evaluator_id)?.name ?? '')}`
          .toLowerCase()
          .includes(query.value.toLowerCase()),
    ) ?? [],
)
const caseGroups = computed(() => {
  const groups = new Map<string, EvaluationComparison['case_deltas']>()
  for (const item of filtered.value) {
    if (!groups.has(item.case_id)) groups.set(item.case_id, [])
    groups.get(item.case_id)!.push(item)
  }
  return [...groups].map(([caseId, items]) => ({
    caseId,
    items,
    total: result.value?.case_deltas.filter((item) => item.case_id === caseId).length ?? 0,
  }))
})
const rows = computed(() => caseGroups.value.slice((page.value - 1) * 10, page.value * 10))
const options = computed(() => {
  const all = new Map(runs.value.map((run) => [run.id, run]))
  reports.value.forEach((report) => all.set(report.run.id, report.run))
  return [...all.values()]
})
const counts = computed(() =>
  Object.fromEntries(
    Object.keys(labels).map((key) => [
      key,
      result.value?.case_deltas.filter((item) => item.change === key).length ?? 0,
    ]),
  ),
)
const candidateGroups = computed(() => {
  const selected = options.value.find((run) => run.id === baseline.value)
  const sameInput = (run: EvaluationRun) => {
    if (!selected) return false
    const before = selected.manifest.target.ref,
      after = run.manifest.target.ref
    return (
      before.source_id === after.source_id &&
      before.target_type === after.target_type &&
      before.external_target_id === after.external_target_id &&
      selected.manifest.dataset.dataset_id === run.manifest.dataset.dataset_id &&
      selected.manifest.dataset.content_sha256 === run.manifest.dataset.content_sha256
    )
  }
  return [
    {
      label: '同对象、同输入内容（仍需服务校验评分与判定规则）',
      runs: options.value.filter(sameInput),
    },
    { label: '其他运行（可能不兼容）', runs: options.value.filter((run) => !sameInput(run)) },
  ]
})
const delta = (value: number | null) =>
  value === null ? '无可比分数' : `${value > 0 ? '+' : ''}${value.toFixed(4)}`
const optionLabel = (run: EvaluationRun) =>
  `${run.manifest.target.display_name}（对象版本：${run.manifest.target.ref.external_version_id}；测评集：${run.manifest.dataset.dataset_name}；发布版本：${run.manifest.dataset.version}；创建时间：${new Date(run.created_at).toLocaleString()}）`
let controller: AbortController | undefined
const listController = new AbortController()
async function loadRuns() {
  listError.value = ''
  try {
    runs.value = await runsApi.list('completed', 200, listController.signal)
  } catch (e) {
    if (!listController.signal.aborted) listError.value = userError(e)
  }
}
async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  baseline.value = String(route.query.baseline ?? '')
  candidate.value = String(route.query.candidate ?? '')
  result.value = null
  page.value = 1
  reports.value = []
  error.value = ''
  conflict.value = false
  loading.value = false
  if (!baseline.value || !candidate.value) return
  if (baseline.value === candidate.value) {
    error.value = '请选择两个不同的已完成运行。'
    return
  }
  loading.value = true
  try {
    const [comparison, before, after] = await Promise.all([
      compareRuns(baseline.value, candidate.value, signal),
      api.report(baseline.value, signal),
      api.report(candidate.value, signal),
    ])
    if (!signal.aborted) {
      result.value = comparison
      reports.value = [before, after]
    }
  } catch (e) {
    if (!signal.aborted) {
      conflict.value = e instanceof ApiError && e.status === 409
      error.value = userError(e)
    }
  } finally {
    if (!signal.aborted) loading.value = false
  }
}
function submit() {
  if (!baseline.value || !candidate.value) return
  router.push({
    path: '/comparisons',
    query: { baseline: baseline.value, candidate: candidate.value },
  })
}
function setFilter(change: string) {
  router.replace({ query: { ...route.query, change: change || undefined } })
}
function setQuery(event: Event) {
  router.replace({
    query: { ...route.query, q: (event.target as HTMLInputElement).value || undefined },
  })
}
const evidenceSelection = useDetailState<{ runId: string; key: string } | null>(
  'comparison-evidence',
  null,
)
const evidenceItems = computed(() =>
  filtered.value.map((item) => ({
    key: JSON.stringify([item.case_id, item.evaluator_id]),
    label: cases.value.get(item.case_id) ?? '用例证据',
  })),
)
const evidenceResult = computed(() =>
  filtered.value.find(
    (item) => JSON.stringify([item.case_id, item.evaluator_id]) === evidenceSelection.value?.key,
  ),
)
const evidenceReport = computed(() =>
  reports.value.find((item) => item.run.id === evidenceSelection.value?.runId),
)
const evidencePath = computed(() =>
  evidenceSelection.value && evidenceResult.value
    ? router.resolve(
        evidence(
          evidenceSelection.value.runId,
          evidenceResult.value.case_id,
          evidenceResult.value.evaluator_id,
        ),
      ).fullPath
    : undefined,
)
function openEvidence(runId: string, caseId: string, evaluator: string) {
  evidenceSelection.value = { runId, key: JSON.stringify([caseId, evaluator]) }
}
function evidence(runId: string, caseId: string, evaluator: string) {
  return {
    path: `/runs/${encodeURIComponent(runId)}/cases/${encodeURIComponent(caseId)}`,
    query: {
      evaluator,
      comparisonBaseline: result.value?.baseline_run_id,
      comparisonCandidate: result.value?.candidate_run_id,
      comparisonChange: selectedChange.value || undefined,
      comparisonQuery: query.value || undefined,
    },
  }
}
watch([() => route.query.baseline, () => route.query.candidate], load, { immediate: true })
watch([selectedChange, query], () => {
  page.value = 1
})
onMounted(loadRuns)
onUnmounted(() => {
  controller?.abort()
  listController.abort()
})
</script>

<template>
  <div class="page-intro">
    <div>
      <h1>版本对比</h1>
      <p>
        比较两个已完成运行的真实结果，支持不同版本比较或同版本复验，从指标变化定位到用例和评分标准。
      </p>
    </div>
    <RouterLink class="ag-button" to="/runs">查看测评任务</RouterLink>
  </div>
  <form class="panel" @submit.prevent="submit">
    <h2>选择已有运行</h2>
    <p class="muted">列表展示最近最多 200 个已完成运行；也可从历史报告“作为基线对比”进入。</p>
    <StatusNotice type="error" v-if="listError">
      运行列表读取失败：{{ listError }}
      <button type="button" class="text-button" @click="loadRuns">重试列表</button>
    </StatusNotice>
    <div class="split-grid">
      <label class="field"
        >基线运行 A<select v-model="baseline" aria-label="基线运行 A" required>
          <option value="">请选择基线运行</option>
          <option v-for="run in options" :key="run.id" :value="run.id">
            {{ optionLabel(run) }}
          </option>
          <option v-if="baseline && !options.some((run) => run.id === baseline)" :value="baseline">
            历史运行 {{ baseline }}
          </option>
        </select></label
      >
      <label class="field"
        >候选运行 B<select v-model="candidate" aria-label="候选运行 B" required>
          <option value="">请选择候选运行</option>
          <optgroup v-for="group in candidateGroups" :key="group.label" :label="group.label">
            <option
              v-for="run in group.runs"
              :key="run.id"
              :value="run.id"
              :disabled="run.id === baseline"
            >
              {{ optionLabel(run) }}
            </option>
          </optgroup>
          <option
            v-if="candidate && !options.some((run) => run.id === candidate)"
            :value="candidate"
          >
            历史运行 {{ candidate }}
          </option>
        </select></label
      >
    </div>
    <button
      class="ag-button primary"
      :disabled="loading || !baseline || !candidate || baseline === candidate"
    >
      {{ loading ? '正在比较…' : '比较结果' }}
    </button>
  </form>
  <StatusNotice type="error" v-if="error">
    <strong>{{ conflict ? '这两次运行不满足比较条件' : '暂时无法读取对比' }}</strong>
    <p>
      {{
        conflict
          ? '需要相同业务对象、相同测评输入和顺序、相同主评分标准、指标方案与判定规则。请调整运行选择。'
          : '请检查运行是否存在并已完成，然后重试。'
      }}
    </p>
    <details>
      <summary>查看服务返回原因</summary>
      {{ error }}
    </details>
    <button class="text-button" @click="load">重试当前对比</button>
  </StatusNotice>
  <div v-if="loading" class="skeleton">正在核对两次运行并读取结果…</div>
  <StatusNotice v-if="selectionDirty">
    运行选择已更改，请点击“比较结果”更新。上一次组合的结果已隐藏。
  </StatusNotice>
  <template v-if="result && !selectionDirty && baselineReport && candidateReport">
    <StatusNotice>
      <p>已核对：同一业务对象、输入内容与用例顺序、主评分标准、指标方案和判定规则。</p>
      <p>
        未核对：并发、超时、重试、调用配置、凭据和模型环境。本页不提供统计显著性或受控实验的上线结论。
      </p>
      <p>
        输入内容哈希一致：<code
          >{{ baselineReport.run.manifest.dataset.content_sha256.slice(0, 12) }}…</code
        >
      </p>
    </StatusNotice>
    <div class="split-grid">
      <section v-for="(report, index) in reports" :key="report.run.id" class="panel">
        <h2>{{ index === 0 ? '基线 A' : '候选 B' }}</h2>
        <div class="entity-group">
          <EntityRef
            :name="report.run.manifest.target.display_name"
            type="测评对象"
            :version="report.run.manifest.target.ref.external_version_id"
          />
          <EntityRef
            :name="report.run.manifest.dataset.dataset_name"
            type="测评集"
            :version="report.run.manifest.dataset.version"
          />
        </div>
        <p>
          <span class="badge" :class="report.release_gate.outcome">{{
            report.release_gate.outcome === 'pass' ? '本次判定通过' : '本次判定未通过'
          }}</span>
          {{ gateLabels[report.release_gate.reason_code] }}
        </p>
        <RouterLink class="ag-button" :to="`/runs/${encodeURIComponent(report.run.id)}`"
          >查看{{ index === 0 ? '基线' : '候选' }}报告</RouterLink
        >
      </section>
    </div>
    <section class="panel">
      <h2>指标变化</h2>
      <MetadataGroup
        :items="[{ label: '总体分数变化', value: delta(result.overall_score_delta) }]"
      />
      <p>差值为候选减基线，评分范围 0～1。</p>
      <StatusNotice
        type="warning"
        v-if="
          baselineReport.run.manifest.dataset.version !==
          candidateReport.run.manifest.dataset.version
        "
      >
        两次使用的测评集版本号不同，但输入内容和用例顺序相同。请同时核对执行设置，避免将其他差异归因于对象版本。
      </StatusNotice>
      <p class="muted small metric-scroll-hint">
        窄屏可横向滑动查看完整指标；键盘可聚焦表格区域后使用方向键。
      </p>
      <div class="table-scroll" tabindex="0" role="region" aria-label="指标变化明细">
        <table class="data-table metric-table">
          <thead>
            <tr>
              <th>统计指标</th>
              <th>基线 A</th>
              <th>候选 B</th>
              <th>分数变化</th>
              <th>适用结果数</th>
              <th>结果数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="metric in result.metric_deltas" :key="`${metric.level}:${metric.key}`">
              <td>
                <MetadataGroup
                  :items="[
                    {
                      label: '层级',
                      value: { overall: '总体', kind: '方法', dimension: '维度', metric: '指标' }[
                        metric.level
                      ],
                    },
                    { label: '指标', value: metricLabel(metric.key) },
                  ]"
                />
              </td>
              <td>{{ scoreText(metric.baseline.score) }}</td>
              <td>{{ scoreText(metric.candidate.score) }}</td>
              <td>{{ delta(metric.score_delta) }}</td>
              <td>
                <MetadataGroup
                  :items="[
                    { label: '基线 A', value: metric.baseline.applicable },
                    { label: '候选 B', value: metric.candidate.applicable },
                  ]"
                />
              </td>
              <td>
                <details>
                  <summary>查看数量变化</summary>
                  <dl class="metric-counts">
                    <template
                      v-for="(title, key) in {
                        passed: '通过',
                        failed: '失败',
                        reviewed: '待复核',
                        not_applicable: '不适用',
                        errors: '执行错误',
                        total: '总数',
                      }"
                      :key="key"
                      ><dt>{{ title }}</dt>
                      <dd>{{ metric.baseline[key] }} → {{ metric.candidate[key] }}</dd></template
                    >
                  </dl>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h2>逐项结果变化</h2>
      <p class="muted">
        每项对应一个用例和一个主评分标准；同一用例可能同时有改善与退步。缺失或不适用分数不按零分计算。
        改善/退步也可能来自结果状态变化，未必存在可比的数值分差。
      </p>
      <nav class="action-row" aria-label="筛选结果变化">
        <button class="ag-button" :aria-pressed="!selectedChange" @click="setFilter('')">
          全部 {{ result.case_deltas.length }} 项</button
        ><button
          v-for="(label, key) in labels"
          :key="key"
          class="ag-button"
          :aria-pressed="selectedChange === key"
          @click="setFilter(key)"
        >
          {{ label }} {{ counts[key] }} 项
        </button>
      </nav>
      <label class="field"
        >查找用例或评分标准<input
          :value="query"
          @input="setQuery"
          placeholder="用例名称、编号或评分标准"
      /></label>
      <article v-for="group in rows" :key="group.caseId" class="comparison-case">
        <EntityRef
          :name="cases.get(group.caseId) ?? ''"
          type="用例"
          :id="group.caseId"
          :heading-level="3"
        />
        <MetadataGroup
          :items="[
            { label: '评分结果总数', value: group.total },
            { label: '当前条件匹配数', value: group.items.length },
          ]"
        />
        <details :key="`${group.caseId}:${selectedChange}`" :open="!!selectedChange">
          <summary>查看此用例的评分变化</summary>
          <div v-for="item in group.items" :key="item.evaluator_id" class="comparison-evaluation">
            <div class="panel-title">
              <EntityRef
                :name="catalogLabel(evaluators.get(item.evaluator_id)?.name ?? '')"
                type="评估器"
                :version="evaluators.get(item.evaluator_id)?.version"
                :id="item.evaluator_id"
                :heading-level="4"
                compact
              />
              <span
                class="badge"
                :class="
                  item.change === 'regression'
                    ? 'fail'
                    : item.change === 'improvement'
                      ? 'pass'
                      : ''
                "
                >{{ labels[item.change] }}</span
              >
            </div>
            <p>
              分数变化
              {{ delta(item.score_delta) }}
            </p>
            <div class="split-grid">
              <div>
                <MetadataGroup
                  title="基线 A"
                  :items="[
                    {
                      label: '结果',
                      value: item.baseline_outcome
                        ? outcomeLabels[item.baseline_outcome]
                        : '缺少结果',
                    },
                    { label: '分数', value: scoreText(item.baseline_score) },
                  ]"
                />
                <button
                  class="text-button"
                  @click="openEvidence(result.baseline_run_id, item.case_id, item.evaluator_id)"
                >
                  查看基线证据
                </button>
              </div>
              <div>
                <MetadataGroup
                  title="候选 B"
                  :items="[
                    {
                      label: '结果',
                      value: item.candidate_outcome
                        ? outcomeLabels[item.candidate_outcome]
                        : '缺少结果',
                    },
                    { label: '分数', value: scoreText(item.candidate_score) },
                  ]"
                />
                <button
                  class="text-button"
                  @click="openEvidence(result.candidate_run_id, item.case_id, item.evaluator_id)"
                >
                  查看候选证据
                </button>
              </div>
            </div>
          </div>
        </details>
      </article>
      <EmptyState
        v-if="!filtered.length"
        title="没有匹配的结果"
        description="调整用例或变化类型筛选，查看其他结果。"
      ></EmptyState>
      <div v-if="caseGroups.length > 10" class="action-row">
        <button class="ag-button" :disabled="page === 1" @click="page--">上一页</button
        ><span
          >第 {{ page }} 页，共 {{ Math.ceil(caseGroups.length / 10) }} 页（按完整用例分页）</span
        ><button class="ag-button" :disabled="page * 10 >= caseGroups.length" @click="page++">
          下一页
        </button>
      </div>
    </section>
  </template>
  <EmptyState
    v-else-if="!loading && !error"
    title="选择两份报告开始对比"
    description="先在上方选择基线和候选任务，再点击对比，核对指标与用例变化。"
  ></EmptyState>
  <DetailDrawer
    :model-value="!!evidenceResult"
    :title="evidenceSelection?.runId === result?.baseline_run_id ? '基线用例证据' : '候选用例证据'"
    :items="evidenceItems"
    :current-key="evidenceSelection?.key"
    :full-path="evidencePath"
    @update:model-value="
      (value) => {
        if (!value) evidenceSelection = null
      }
    "
    @select="
      (key) => {
        if (evidenceSelection) evidenceSelection.key = key
      }
    "
  >
    <CaseResultPage
      v-if="evidenceSelection && evidenceResult"
      :run-id="evidenceSelection.runId"
      :case-id="evidenceResult.case_id"
      :evaluator-id="evidenceResult.evaluator_id"
      :source-report="evidenceReport"
      embedded
    />
  </DetailDrawer>
</template>

<style scoped>
.comparison-case {
  padding: 20px 0;
  border-top: 1px solid var(--ag-line);
  overflow-wrap: anywhere;
}
.comparison-evaluation {
  padding: 16px;
  margin: 12px 0;
  border: 1px solid var(--ag-line);
  border-radius: 8px;
}
.field {
  margin: 16px 0;
  min-width: 0;
}
select {
  width: 100%;
  min-width: 0;
}
.table-scroll {
  overflow-x: auto;
}
.metric-table {
  min-width: 740px;
}
.metric-table td:not(:first-child) {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.metric-table td:first-child {
  min-width: 180px;
}
.metric-scroll-hint {
  margin-bottom: 8px;
}
.ag-button[aria-pressed='true'] {
  border-color: var(--ag-link);
  background: #e7f6f2;
}
.metric-counts {
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  white-space: nowrap;
}
.metric-counts dd {
  margin: 0;
}
</style>
