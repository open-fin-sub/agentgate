<script setup lang="ts">
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import JsonFallback from '../../components/JsonFallback.vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview, clone, uid, downloadJson } from '../workspace'
import { buildRun } from '../execution'
import {
  comparisonConclusion,
  executionIssues,
  formatMetric,
  measureGates,
  metricChange,
  metricDefinitions,
  mockStatistics,
  pairLabels,
  pairSamples,
  preflight,
  runMetrics,
  runStatusLabels,
} from '../comparison'
import type { Metric, PairKind } from '../comparison'
import ComparePreflight from '../components/ComparePreflight.vue'
import CompareEvidence from '../components/CompareEvidence.vue'
import CompareLineage from '../components/CompareLineage.vue'

const route = useRoute(),
  router = useRouter()
const { state, change } = usePreview()
const error = ref('')
const comparison = computed(() =>
  state.comparisons.find((item) => item.id === String(route.params.id ?? '')),
)
const baseline = computed(() =>
  state.runs.find((item) => item.id === comparison.value?.baselineRunId),
)
const candidateId = computed({
  get: () => String(route.query.candidate ?? comparison.value?.candidateRunIds[0] ?? ''),
  set: (candidate: string) => {
    router.replace({ query: { ...route.query, candidate, case: undefined } })
  },
})
const candidate = computed(() =>
  comparison.value?.candidateRunIds.includes(candidateId.value)
    ? state.runs.find((item) => item.id === candidateId.value)
    : undefined,
)
const sameAsset = computed(
  () =>
    !!baseline.value &&
    !!candidate.value &&
    baseline.value.config.targetId === candidate.value.config.targetId,
)
const pairs = computed(() =>
  baseline.value && candidate.value ? pairSamples(baseline.value, candidate.value) : [],
)
function queryField(key: string) {
  return computed({
    get: () => String(route.query[key] ?? ''),
    set: (value: string) => {
      router.replace({ query: { ...route.query, [key]: value || undefined } })
    },
  })
}
const group = queryField('group'),
  search = queryField('q'),
  tag = queryField('tag'),
  selectedCase = queryField('case')
const manualA = queryField('manualA'),
  manualB = queryField('manualB')
const statistics = computed({
  get: () =>
    route.query.statistics === 'sufficient' ? ('sufficient' as const) : ('insufficient' as const),
  set: (value: 'sufficient' | 'insufficient') => {
    router.replace({ query: { ...route.query, statistics: value } })
  },
})
const manualConfirmed = computed(
  () =>
    route.query.manual === `${manualA.value}:${manualB.value}` &&
    !!manualA.value &&
    !!manualB.value,
)
const counts = computed(
  () =>
    Object.fromEntries(
      Object.keys(pairLabels).map((kind) => [
        kind,
        pairs.value.filter((item) => item.kind === kind).length,
      ]),
    ) as Record<PairKind, number>,
)
const tags = computed(() => [
  ...new Set(
    pairs.value.flatMap((item) => [...(item.aCase?.tags ?? []), ...(item.bCase?.tags ?? [])]),
  ),
])
const filtered = computed(() =>
  pairs.value.filter(
    (item) =>
      (!group.value || item.kind === group.value) &&
      (!tag.value ||
        item.aCase?.tags.includes(tag.value) ||
        item.bCase?.tags.includes(tag.value)) &&
      `${item.id} ${item.aCase?.question ?? ''} ${item.bCase?.question ?? ''}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
)
const selected = computed(() =>
  selectedCase.value
    ? pairs.value.find((item) => item.id === selectedCase.value)
    : filtered.value[0],
)
const metrics = computed(() => {
  if (!baseline.value || !candidate.value) return []
  const a = runMetrics(baseline.value),
    b = runMetrics(candidate.value)
  return (Object.keys(metricDefinitions) as Metric[]).map((metric) => ({
    metric,
    ...metricDefinitions[metric],
    a: a[metric],
    b: b[metric],
    delta: metricChange(metric, a[metric].value, b[metric].value).delta,
  }))
})
const gates = computed(() =>
  baseline.value && candidate.value && comparison.value
    ? measureGates(baseline.value, candidate.value, comparison.value.rules)
    : [],
)
const controlled = computed(() =>
  baseline.value && candidate.value ? preflight(baseline.value, candidate.value).controlled : false,
)
const statisticalExample = computed(() =>
  baseline.value && candidate.value
    ? mockStatistics(baseline.value, candidate.value, statistics.value)
    : null,
)
const statusText = { met: '达到样本阈值', failed: '未通过', insufficient: '证据不足' }

function selectGroup(kind: PairKind | '') {
  router.replace({ query: { ...route.query, group: kind || undefined, case: undefined } })
}
function selectSample(id: string) {
  selectedCase.value = id
}
function confirmManual() {
  router.replace({ query: { ...route.query, manual: `${manualA.value}:${manualB.value}` } })
}
function exportComparison() {
  if (!comparison.value || !baseline.value || !candidate.value) return
  downloadJson(`mock-comparison-${comparison.value.id}.json`, {
    comparison: comparison.value,
    runs: [
      baseline.value,
      ...comparison.value.candidateRunIds.map((id) => state.runs.find((item) => item.id === id)),
    ],
    selectedCandidate: candidate.value.id,
    preflight: preflight(baseline.value, candidate.value),
    metrics: metrics.value,
    gates: gates.value,
    pairs: pairs.value,
    filters: { group: group.value, q: search.value, tag: tag.value },
    statisticalExample: statisticalExample.value,
    verdict: comparisonConclusion(
      baseline.value,
      candidate.value,
      comparison.value.rules,
      statistics.value,
    ),
    basis: '机器原判快照；人工复核独立留存',
  })
}
function replay(recover: boolean) {
  error.value = ''
  const original = comparison.value
  if (!original) return
  const sourceRuns = [original.baselineRunId, ...original.candidateRunIds].map((id) =>
    state.runs.find((item) => item.id === id),
  )
  if (sourceRuns.some((run) => !run)) {
    error.value = '关联运行缺失，无法复现。'
    return
  }
  const id = uid('cmp')
  const saved = change(
    id,
    recover
      ? `从 ${original.id} 清除故障并创建恢复实验`
      : `复现 ${original.id} 的固定配置，创建新记录`,
    () => {
      const created = sourceRuns.map((source) => {
        if (!source) throw new Error('来源运行不存在。')
        const config = {
          ...clone(source.config),
          scheduledAt: null,
          fault: recover ? ('none' as const) : source.config.fault,
        }
        const issues = executionIssues(state, config)
        if (issues.length) throw new Error(issues.join(' '))
        const run = buildRun(
          state,
          config,
          `${source.name} · ${recover ? '恢复' : '复现'}`,
          source.id,
        )
        run.target = clone(source.target)
        run.cases = clone(source.cases)
        run.evaluators = clone(source.evaluators)
        run.comparisonId = id
        run.attempt = (source.attempt ?? 1) + 1
        run.retryScope = 'all'
        return run
      })
      state.runs.push(...created)
      state.comparisons.unshift({
        ...clone(original),
        id,
        name: `${original.name} · ${recover ? '故障恢复' : '复现'}`,
        baselineRunId: created[0].id,
        candidateRunIds: created.slice(1).map((run) => run.id),
        createdAt: new Date().toISOString(),
        sourceId: original.id,
      })
      const suggestion = state.suggestions.find((item) => item.id === original.suggestionId)
      if (suggestion) suggestion.comparisonId = id
    },
  )
  if (saved) router.push(`/preview/comparisons/${id}`)
}
function reproduce() {
  replay(false)
}
function recover() {
  replay(true)
}
</script>

<template>
  <RouterLink to="/preview/comparisons" class="back-link">← 版本对比列表</RouterLink>
  <EmptyState
    v-if="!comparison"
    title="找不到对比报告"
    description="请从对比列表重新选择记录；重置体验数据可能移除了原报告。"
    ><RouterLink class="ag-button" to="/preview/comparisons">查看对比列表</RouterLink></EmptyState
  >
  <template v-else>
    <div class="page-intro">
      <div>
        <h1>{{ comparison.name }}</h1>
        <p>
          {{ comparison.mode === 'controlled' ? '共同配置新实验' : '已有运行比较 · 事后评审规则' }}
          · Mock · {{ comparison.id }}
        </p>
      </div>
      <div class="action-row">
        <el-button @click="exportComparison">导出对比 JSON</el-button
        ><el-button :disabled="state.role === 'viewer'" @click="reproduce"
          >复现配置（新记录）</el-button
        >
      </div>
    </div>
    <StatusNotice type="warning" v-if="state.role === 'viewer'">
      当前为只读角色，无权复现或恢复实验；可查看与导出证据。
    </StatusNotice>
    <StatusNotice type="error" v-if="error">{{ error }}</StatusNotice>
    <section class="panel">
      <label
        >候选版本（每个候选独立对基线）<el-select v-model="candidateId"
          ><el-option
            v-for="id in comparison.candidateRunIds"
            :key="id"
            :value="id"
            :label="`${state.runs.find((item) => item.id === id)?.name ?? '记录缺失'} · ${state.runs.find((item) => item.id === id)?.config.targetVersion ?? id}`" /></el-select
      ></label>
    </section>
    <EmptyState
      v-if="!baseline || !candidate"
      title="缺少关联任务"
      description="请选择其他候选任务，或返回对比列表重新选择报告。"
      ><RouterLink class="ag-button" to="/preview/comparisons">查看对比列表</RouterLink></EmptyState
    >
    <StatusNotice type="error" v-else-if="!sameAsset" class="panel">
      <h2>不能跨资产比较</h2>
      <p>基线与候选必须是同一逻辑 Agent 或 Skill。请返回列表重新选择。</p>
    </StatusNotice>
    <template v-else>
      <section class="panel">
        <h2>{{ comparisonConclusion(baseline, candidate, comparison.rules, statistics) }}</h2>
        <div class="preview-columns compare-two">
          <div>
            <h3>基线 A · {{ baseline.config.targetVersion }}</h3>
            <RouterLink :to="`/preview/runs/${baseline.id}`">{{ baseline.name }}</RouterLink>
            <p>
              {{ runStatusLabels[baseline.status] }} · 返回 {{ baseline.results.length }} /
              {{ baseline.cases.length }} 条
            </p>
            <StatusNotice type="error" v-if="baseline.error">{{ baseline.error }}</StatusNotice>
          </div>
          <div>
            <h3>候选 B · {{ candidate.config.targetVersion }}</h3>
            <RouterLink :to="`/preview/runs/${candidate.id}`">{{ candidate.name }}</RouterLink>
            <p>
              {{ runStatusLabels[candidate.status] }} · 返回 {{ candidate.results.length }} /
              {{ candidate.cases.length }} 条
            </p>
            <StatusNotice type="error" v-if="candidate.error">{{ candidate.error }}</StatusNotice>
          </div>
        </div>
        <p>
          执行完成与质量通过分开。样例判定受本地实测阈值和下方模拟统计场景共同影响；单例只能支持个例复验，不表示生产统计样本门槛。
        </p>
        <el-button
          v-if="
            baseline.config.fault === 'infrastructure' ||
            candidate.config.fault === 'infrastructure'
          "
          :disabled="state.role === 'viewer'"
          @click="recover"
          >清除模拟故障并创建恢复实验</el-button
        >
        <p class="muted">
          复现保留原输入、对象与评估器快照并立即创建新运行；原预约时间保留在来源记录。
        </p>
      </section>
      <ComparePreflight :baseline="baseline" :candidate="candidate" />
      <section class="panel">
        <h2>聚合变化 · 候选 B − 基线 A</h2>
        <p class="muted">
          机器原判口径；不将人工意见覆盖原结果。适用 Case 通过率 = pass / (pass + fail +
          review)，排除 NA 和
          error，与运行报告一致。错误率以已返回用例为分母；缺失覆盖单列，分数不补零。
        </p>
        <StatusNotice type="warning" v-if="!controlled">
          以下均值差仅描述各自运行的变化；输入 / 评分 / 资源差异可能影响指标，不能归因于目标版本。
        </StatusNotice>
        <div class="preview-grid metric-grid">
          <article v-for="metric in metrics" :key="metric.metric" class="preview-kpi metric-card">
            <p>
              {{ metric.label }} · {{ metric.direction === 'higher' ? '越高越好' : '越低越好' }}
            </p>
            <strong>{{ formatMetric(metric.metric, metric.delta, true) }}</strong>
            <p>
              {{ metric.label }}{{ metric.label ? '：' : ''
              }}{{
                metric.label && metric.delta !== null
                  ? metricChange(metric.metric, metric.a.value, metric.b.value).label
                  : '证据不足'
              }}
            </p>
            <p>
              A {{ formatMetric(metric.metric, metric.a.value) }} → B
              {{ formatMetric(metric.metric, metric.b.value) }}
            </p>
            <small
              >采集覆盖 A {{ metric.a.observed }}/{{ metric.a.total }} · B
              {{ metric.b.observed }}/{{ metric.b.total }}</small
            >
          </article>
        </div>
      </section>
      <section class="panel">
        <h2>逐条实测阈值</h2>
        <p class="muted">
          {{
            comparison.mode === 'controlled' ? '执行前固定规则。' : '创建对比时添加的事后规则。'
          }}“达到样本阈值”仍需统计与发布政策验证。
        </p>
        <div class="table-scroll" tabindex="0" aria-label="逐条判定规则">
          <table class="preview-table data-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>规则</th>
                <th>候选实测值 / 覆盖</th>
                <th>结论</th>
                <th>依据</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(gate, index) in gates" :key="index">
                <th scope="row">{{ metricDefinitions[gate.rule.metric].label }}</th>
                <td>
                  {{ gate.rule.operator }} {{ formatMetric(gate.rule.metric, gate.rule.threshold) }}
                </td>
                <td>
                  {{ formatMetric(gate.rule.metric, gate.measurement.value)
                  }}<small>{{ gate.measurement.observed }} / {{ gate.measurement.total }} 条</small>
                </td>
                <td>
                  <span
                    :class="[
                      'badge',
                      gate.status === 'failed' ? 'fail' : gate.status === 'met' ? 'pass' : 'review',
                    ]"
                    >{{ statusText[gate.status] }}</span
                  >
                </td>
                <td>
                  {{ gate.reason }}
                  <RouterLink
                    :to="{
                      query: {
                        ...route.query,
                        group: gate.rule.metric === 'errorRate' ? 'error' : undefined,
                        case: undefined,
                      },
                      hash: '#comparison-samples',
                    }"
                    >查看样本证据</RouterLink
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <StatusNotice type="warning" v-if="!gates.length"
          >未配置规则，不能形成门禁通过结论。</StatusNotice
        >
        <StatusNotice type="warning">
          <label
            >统计响应体验场景（仅 Mock）<el-select v-model="statistics"
              ><el-option value="insufficient" label="证据不足示例" /><el-option
                value="sufficient"
                label="统计充足响应示例（模拟）" /></el-select
          ></label>
          <p>
            有效配对 n = {{ statisticalExample?.actualPairedCount }}，配对平均分差
            {{
              formatMetric('score', statisticalExample?.actualScoreDelta ?? null, true)
            }}。仅计入输入一致、两侧 pass/fail 且有分数的样本，排除 NA / error / review / 缺失。
          </p>
          <p>
            模拟响应 p = {{ statisticalExample?.pValue ?? '未提供' }}，CI =
            {{
              statisticalExample?.confidenceInterval
                ? `${statisticalExample.confidenceInterval[0]!.toFixed(3)} 至 ${statisticalExample.confidenceInterval[1]!.toFixed(3)}`
                : '未提供'
            }}。p/CI
            按实际差值方向选取固定示例，未由样本计算。切换场景不会修复不可比配置、缺失指标或未通过阈值，也不会形成生产发布许可。
          </p>
        </StatusNotice>
        <details>
          <summary>查看 Mock 统计响应与实际样本数</summary>
          <p>
            输入样本 A {{ baseline.cases.length }} 条、B
            {{ candidate.cases.length }} 条；有效评分配对
            {{ statisticalExample?.actualPairedCount }} 对。此处为模拟统计结果，仅用于体验判读流程。
          </p>
          <JsonFallback :model-value="statisticalExample" readonly />
        </details>
      </section>
      <section id="comparison-samples" class="panel">
        <h2>变化漏斗 → 样本证据</h2>
        <div class="action-row pair-filters">
          <el-button :type="!group ? 'primary' : 'default'" @click="selectGroup('')"
            >全部 {{ pairs.length }}</el-button
          ><el-button
            v-for="(label, kind) in pairLabels"
            :key="kind"
            :type="group === kind ? 'primary' : 'default'"
            @click="selectGroup(kind)"
            >{{ label }} {{ counts[kind] }}</el-button
          >
        </div>
        <div class="action-row sample-filter">
          <label>搜索用例<el-input v-model="search" clearable /></label
          ><label
            >场景标签<el-select v-model="tag" clearable placeholder="全部标签"
              ><el-option v-for="item in tags" :key="item" :label="item" :value="item" /></el-select
          ></label>
        </div>
        <p class="muted">
          仅 A / 仅 B 是输入范围增删；同 ID
          输入或期望变化、结果缺失均列为未配对。共同失败单列，不与执行错误混算。
        </p>
        <EmptyState
          v-if="!filtered.length"
          title="没有匹配的样本"
          description="调整样本分组或搜索词，查看其他变化。"
        ></EmptyState>
        <div class="sample-list">
          <button
            v-for="pair in filtered"
            :key="pair.id"
            :class="{ active: selected?.id === pair.id }"
            @click="selectSample(pair.id)"
          >
            <span>{{ pair.id }} · {{ pairLabels[pair.kind] }}</span
            ><strong>{{ pair.aCase?.question ?? pair.bCase?.question ?? '快照缺失' }}</strong>
          </button>
        </div>
        <template v-if="selected"
          ><h3>{{ selected.id }} · {{ pairLabels[selected.kind] }}</h3>
          <p>{{ selected.reason }}</p>
          <div class="preview-columns compare-two">
            <CompareEvidence
              :run="baseline"
              :sample="selected.aCase"
              :result="selected.a"
              label="基线 A"
            /><CompareEvidence
              :run="candidate"
              :sample="selected.bCase"
              :result="selected.b"
              label="候选 B"
            /></div
        ></template>
        <p v-else-if="selectedCase" role="alert">404 · 所选样本不在本次比较范围内。</p>
        <details>
          <summary>人工配对查看（仅用于描述性定位）</summary>
          <p>确认只改变当前并排视图；不改变原始配对数、控制变量检查或门禁证据。</p>
          <div class="preview-columns compare-two">
            <label
              >A 侧用例<el-select v-model="manualA"
                ><el-option
                  v-for="item in baseline.cases"
                  :key="item.id"
                  :value="item.id"
                  :label="`${item.id} · ${item.question}`" /></el-select></label
            ><label
              >B 侧用例<el-select v-model="manualB"
                ><el-option
                  v-for="item in candidate.cases"
                  :key="item.id"
                  :value="item.id"
                  :label="`${item.id} · ${item.question}`" /></el-select
            ></label>
          </div>
          <el-button :disabled="!manualA || !manualB" @click="confirmManual"
            >确认人工配对并查看</el-button
          >
          <div v-if="manualConfirmed" class="preview-columns compare-two manual-evidence">
            <CompareEvidence
              :run="baseline"
              :sample="baseline.cases.find((item) => item.id === manualA)"
              :result="baseline.results.find((item) => item.caseId === manualA)"
              label="人工定位 A"
            /><CompareEvidence
              :run="candidate"
              :sample="candidate.cases.find((item) => item.id === manualB)"
              :result="candidate.results.find((item) => item.caseId === manualB)"
              label="人工定位 B"
            />
          </div>
        </details>
      </section>
      <div class="action-row">
        <RouterLink
          :to="{ path: '/preview/analysis', query: { run: candidate.id } }"
          class="ag-button"
          >分析候选问题与改进建议</RouterLink
        ><RouterLink
          :to="{
            path: '/preview/comparisons',
            query: { mode: 'controlled', run: baseline.id, target: baseline.config.targetId },
          }"
          class="ag-button"
          >以基线配置创建统一实验</RouterLink
        >
      </div>
    </template>
    <CompareLineage :comparison="comparison" />
  </template>
</template>

<style scoped>
.compare-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.compare-two > * {
  min-width: 0;
  overflow-wrap: anywhere;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}
.metric-card {
  padding: 16px;
  border: 1px solid var(--ag-line);
  border-radius: 6px;
}
.metric-card strong {
  font-size: 22px;
}
.metric-card p {
  margin: 8px 0;
}
.sample-filter {
  margin: 16px 0;
}
.sample-filter label {
  width: 260px;
  max-width: 100%;
}
.pair-filters :deep(.el-button) {
  margin: 0;
}
.sample-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}
.sample-list button {
  background: var(--ag-surface);
  border: 1px solid var(--ag-line);
  border-radius: 6px;
  padding: 12px;
  text-align: left;
  color: var(--ag-body);
  min-width: 0;
  overflow-wrap: anywhere;
}
.sample-list button.active {
  border-color: var(--ag-link);
  background: #e7f6f2;
}
.sample-list span,
.sample-list strong {
  display: block;
}
.manual-evidence {
  margin-top: 16px;
}
:deep(.el-select) {
  width: 100%;
}
@media (max-width: 700px) {
  .compare-two,
  .sample-list {
    grid-template-columns: 1fr;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
