<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import { useDetailState } from '../../components/detailState'
import EntityLink from '../components/EntityLink.vue'
import CaseEvidenceDrawer from '../components/CaseEvidenceDrawer.vue'
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import TokenUsage from '../../components/TokenUsage.vue'
import JsonFallback from '../../components/JsonFallback.vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview, clone, downloadJson } from '../workspace'
import { buildRun } from '../execution'
import type { Outcome, Run } from '../types'
import {
  tokenText,
  evaluatorCheck,
  formatTime,
  isActive,
  outcomeLabels,
  outcomes,
  percent,
  qualityConclusion,
  queryText,
  reportFilters,
  reportQuery,
  reportRows,
  retryScopeLabels,
  reviewedRun,
  runMetrics,
  scoreText,
  validateConfig,
} from '../components/RunSupport'
import RunProgress from '../components/RunProgress.vue'
const { state, change } = usePreview()
const route = useRoute()
const router = useRouter()
const run = computed(() => state.runs.find((item) => item.id === String(route.params.id)))
const datasetName = computed(
  () => state.datasets.find((item) => item.id === run.value?.config.datasetId)?.name ?? '',
)
const filters = reactive(reportFilters(route.query))
const mode = ref('machine')
const page = ref(1)
const pageSize = 10
const busy = ref(false)
const feedback = ref('')
const tableRegion = ref<HTMLElement>()
const readonly = computed(() => state.role === 'viewer')
const reportRun = computed(
  () => run.value && (mode.value === 'human' ? reviewedRun(run.value, state.reviews) : run.value),
)
const metrics = computed(() => reportRun.value && runMetrics(reportRun.value))
const rows = computed(() => (reportRun.value ? reportRows(reportRun.value, filters) : []))
const currentPage = computed(() =>
  Math.min(page.value, Math.max(1, Math.ceil(rows.value.length / pageSize))),
)
const pageRows = computed(() =>
  rows.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize),
)
const tags = computed(() => [...new Set(run.value?.cases.flatMap((item) => item.tags) ?? [])])
const unfinishedIds = computed(
  () =>
    run.value?.cases
      .filter((item) => !run.value?.results.some((result) => result.caseId === item.id))
      .map((item) => item.id) ?? [],
)
const failedIds = computed(
  () =>
    run.value?.results
      .filter((item) => item.outcome === 'fail' || item.outcome === 'error')
      .map((item) => item.caseId) ?? [],
)
const listReturn = computed(() => {
  const path = queryText(route.query, 'listReturn')
  return path.startsWith('/preview/runs?') ? path : '/preview/runs'
})
const history = computed(() =>
  state.runs.filter(
    (item) => item.sourceRunId === run.value?.id || item.id === run.value?.sourceRunId,
  ),
)
const audits = computed(() =>
  state.audit
    .filter(
      (item) =>
        item.subject === run.value?.id ||
        item.subject === run.value?.name ||
        item.subject.startsWith(`${run.value?.id}/`),
    )
    .slice(0, 20),
)
const comparisons = computed(() =>
  state.comparisons.filter(
    (item) =>
      item.baselineRunId === run.value?.id || item.candidateRunIds.includes(run.value?.id ?? ''),
  ),
)
const evaluatorStats = computed(
  () =>
    run.value?.config.evaluatorRefs.map((ref) => {
      const current = run.value!
      const checks = current.results.flatMap((result) => {
        const check = evaluatorCheck(current, result, ref.id)
        return check ? [check] : []
      })
      const scored = checks.filter(
        (check) => check.outcome !== 'NA' && check.outcome !== 'error' && check.score != null,
      )
      return {
        ...ref,
        name: current.evaluators.find((item) => item.id === ref.id)?.name ?? ref.id,
        count: checks.length,
        pass: checks.filter((item) => item.outcome === 'pass').length,
        fail: checks.filter((item) => item.outcome === 'fail').length,
        error: checks.filter((item) => item.outcome === 'error').length,
        score: scored.length
          ? scored.reduce((sum, item) => sum + item.score!, 0) / scored.length
          : null,
      }
    }) ?? [],
)
const dimensions = computed(() => {
  const current = run.value
  if (!current) return []
  const names = [
    ...new Set(current.results.flatMap((result) => result.checks.map((check) => check.dimension))),
  ]
  return names.map((dimension) => {
    const cases = current.results.flatMap((result) => {
      const checks = result.checks.filter(
        (check) =>
          check.dimension === dimension && check.outcome !== 'NA' && check.outcome !== 'error',
      )
      return checks.length ? [checks.every((check) => check.outcome === 'pass')] : []
    })
    return {
      dimension,
      count: cases.length,
      rate: cases.length ? cases.filter(Boolean).length / cases.length : null,
    }
  })
})
const groups = computed(() => {
  const current = reportRun.value
  if (!current) return []
  return (['category', 'difficulty'] as const).flatMap((key) =>
    [...new Set(current.cases.map((item) => item[key]))].map((value) => {
      const ids = current.cases.filter((item) => item[key] === value).map((item) => item.id)
      const values = current.results.filter((item) => ids.includes(item.caseId))
      return {
        key,
        value,
        total: ids.length,
        failed: values.filter((item) => item.outcome === 'fail').length,
        errors: values.filter((item) => item.outcome === 'error').length,
      }
    }),
  )
})
function readQuery() {
  Object.assign(filters, reportFilters(route.query))
  mode.value = queryText(route.query, 'mode') === 'human' ? 'human' : 'machine'
  page.value = Math.max(1, Number(queryText(route.query, 'page')) || 1)
}
async function sync(focus = false, resetPage = true) {
  if (resetPage) page.value = 1
  await router.replace({
    path: route.path,
    query: {
      ...reportQuery(filters),
      mode: mode.value === 'human' ? 'human' : undefined,
      page: page.value > 1 ? String(page.value) : undefined,
      listReturn: queryText(route.query, 'listReturn') || undefined,
    },
  })
  if (focus) {
    await nextTick()
    tableRegion.value?.focus({ preventScroll: true })
    tableRegion.value?.scrollIntoView({ block: 'start' })
  }
}
function filterChanged() {
  void sync()
}
function pageChanged(value: number) {
  page.value = value
  void sync(false, false)
}
function clearFilters() {
  Object.assign(filters, {
    q: '',
    outcome: '',
    tag: '',
    difficulty: '',
    category: '',
    evaluator: '',
  })
  void sync()
}
function selectOutcome(outcome: Outcome | 'pending' | '') {
  clearFiltersLocal()
  filters.outcome = outcome
  void sync(true)
}
function clearFiltersLocal() {
  Object.assign(filters, {
    q: '',
    outcome: '',
    tag: '',
    difficulty: '',
    category: '',
    evaluator: '',
  })
}
function selectGroup(key: 'category' | 'difficulty', value: string) {
  clearFiltersLocal()
  filters[key] = value
  void sync(true)
}
function selectEvaluator(id: string) {
  clearFiltersLocal()
  filters.evaluator = id
  void sync(true)
}
const evidenceCase = useDetailState('report-evidence', '')
const evidenceItems = computed(() =>
  rows.value.map((row) => ({ key: row.testCase.id, label: row.testCase.question })),
)
function stop() {
  const current = run.value
  if (!current || !isActive(current)) return
  const stopped = current.status === 'running' ? 'terminated' : 'cancelled'
  if (
    change(
      current.id,
      stopped === 'terminated' ? '终止运行，保留已返回结果' : '取消等待或预约',
      () => {
        if (!isActive(current)) throw new Error('任务状态已变化，请重新检查。')
        current.status = stopped
        current.completedAt = new Date().toISOString()
      },
    )
  )
    feedback.value =
      stopped === 'terminated' ? '已终止，已返回结果和原配置保留。' : '已取消，该任务不会继续执行。'
}
async function rerun(scope: NonNullable<Run['retryScope']>) {
  const current = run.value
  if (!current || busy.value || isActive(current)) return
  const ids =
    scope === 'unfinished'
      ? unfinishedIds.value
      : scope === 'failed'
        ? failedIds.value
        : current.cases.map((item) => item.id)
  if (!ids.length) {
    feedback.value = '该范围没有可执行用例。'
    return
  }
  const config = clone(current.config)
  config.caseIds = [...ids]
  config.scheduledAt = null
  if (scope === 'unfinished' || (scope === 'failed' && config.fault === 'infrastructure'))
    config.fault = 'none'
  const issues = validateConfig(state, config)
  if (issues.length) {
    feedback.value = `无法复跑：${issues.join(' ')} 可从“调整配置”选择有效资源。`
    return
  }
  busy.value = true
  try {
    let id = ''
    const label =
      scope === 'unfinished' ? '恢复未完成' : scope === 'failed' ? '失败子集复跑' : '同配置复跑'
    const ok = change(current.id, `${label} ${ids.length} 条，创建独立运行`, () => {
      const next = buildRun(state, config, `${current.name} · ${label}`, current.id)
      next.cases = clone(current.cases.filter((item) => ids.includes(item.id)))
      next.target = clone(current.target)
      next.evaluators = clone(current.evaluators)
      next.retryScope = scope
      next.attempt = (current.attempt ?? 1) + 1
      state.runs.push(next)
      id = next.id
    })
    if (ok) await router.push(`/preview/runs/${id}`)
    else feedback.value = '复跑未保存，请查看权限或存储冲突提示。'
  } finally {
    busy.value = false
  }
}
function exportReport() {
  const current = run.value
  if (!current) return
  const ids = rows.value.map((row) => row.testCase.id)
  downloadJson(`${current.id}-report.json`, {
    timestamp: new Date().toISOString(),
    runId: current.id,
    name: current.name,
    status: current.status,
    manifest: clone(current.config),
    filterManifest: {
      ...filters,
      scoreMode: mode.value,
      matchingCaseIds: ids,
      matchingCount: ids.length,
      totalCases: current.cases.length,
    },
    metrics: metrics.value,
    metricScope: '完整运行；结果明细按 filterManifest 导出',
    target: current.target,
    evaluators: current.evaluators,
    cases: rows.value.map((row) => row.testCase),
    machineResults: current.results.filter((item) => ids.includes(item.caseId)),
    displayedResults: rows.value.flatMap((row) => (row.result ? [row.result] : [])),
    humanReviews: state.reviews.filter(
      (item) => item.runId === current.id && ids.includes(item.caseId),
    ),
    sourceRunId: current.sourceRunId,
    retryScope: current.retryScope ?? 'all',
    attempt: current.attempt ?? 1,
  })
}
watch(() => route.fullPath, readQuery, { immediate: true })
</script>
<template>
  <RouterLink class="back-link" :to="listReturn">← 测评任务</RouterLink>
  <EmptyState
    v-if="!run"
    title="找不到测评任务"
    description="请从列表重新选择记录；重置体验数据可能移除了原任务。"
    ><RouterLink class="ag-button" to="/preview/runs">查看测评任务</RouterLink></EmptyState
  >
  <template v-else-if="metrics && reportRun">
    <div class="page-intro">
      <div>
        <h1>{{ run.name }}</h1>
        <details>
          <summary>测评对象与固定输入</summary>
          <div class="entity-group">
            <EntityRef
              :name="run.target.name"
              :type="run.target.type"
              :version="run.config.targetVersion"
              compact
            />
            <EntityRef
              :name="datasetName"
              type="测评集"
              :version="run.config.datasetVersion"
              :id="run.config.datasetId"
              compact
            />
          </div>
          <MetadataGroup :items="[{ label: '固定用例数', value: run.cases.length }]" />
        </details>
      </div>
      <div class="action-row">
        <el-button @click="exportReport">导出报告</el-button
        ><RouterLink
          class="ag-button"
          :to="{ path: '/preview/runs/new', query: { source: run.id } }"
          >调整配置</RouterLink
        >
      </div>
    </div>
    <StatusNotice type="warning" v-if="readonly">
      当前为只读角色，无权取消、终止、复跑或写入复核；报告和证据仍可查看。
    </StatusNotice>
    <StatusNotice v-if="feedback">{{ feedback }}</StatusNotice>
    <section class="panel quality-panel">
      <div class="panel-title">
        <h2>{{ qualityConclusion(reportRun) }}</h2>
        <el-select
          v-model="mode"
          class="score-mode"
          aria-label="报告评分口径"
          @change="filterChanged"
          ><el-option value="machine" label="机器原始口径" /><el-option
            value="human"
            label="人工复核口径"
        /></el-select>
      </div>
      <p>
        本次质量条件：平均适用分数 ≥
        {{
          run.config.threshold
        }}，无不通过、待复核或执行错误，结果完整。运行完成与质量达标分别判断。
      </p>
      <StatusNotice v-if="mode === 'human'">
        采用每条用例最新人工复核：确认问题→不通过，非
        Badcase→通过，待复核→需复核；填写人工分数时替代 Case 分数，未填写时沿用机器分数。NA／error
        仍保留原判。评估器检查与原始证据不变，此口径不是生产上线门禁。
      </StatusNotice>
      <div class="preview-grid run-kpis">
        <button class="preview-kpi" @click="selectOutcome('')">
          <span>平均 Case 分数</span><strong>{{ scoreText(metrics.score) }}</strong
          ><small>{{ metrics.scored }} 条适用有分数结果</small></button
        ><button class="preview-kpi" @click="selectOutcome('pass')">
          <span>Case 通过率</span><strong>{{ percent(metrics.passRate) }}</strong
          ><small>{{ metrics.counts.pass }} / {{ metrics.applicable }} 条适用结果</small></button
        ><button class="preview-kpi" @click="selectOutcome('error')">
          <span>执行错误率</span><strong>{{ percent(metrics.errorRate) }}</strong
          ><small>{{ metrics.counts.error }} / {{ metrics.completed }} 条已返回结果</small>
        </button>
        <div class="preview-kpi">
          <span>总 Token 用量</span><strong>{{ tokenText(metrics.tokens) }}</strong
          ><MetadataGroup
            :items="[
              { label: '用量未采集数', value: metrics.tokensMissing },
              { label: '已返回结果数', value: metrics.completed },
            ]"
          />
        </div>
      </div>
      <div class="action-row result-summary">
        <TokenUsage
          :input="metrics.inputTokens"
          :output="metrics.outputTokens"
          :total="metrics.tokens"
          scope="已返回的用例结果；任一用量缺失时不展示完整合计"
        />
        <el-button v-for="outcome in outcomes" :key="outcome" @click="selectOutcome(outcome)"
          >{{ outcomeLabels[outcome] }} {{ metrics.counts[outcome] }}</el-button
        ><el-button @click="selectOutcome('pending')">未返回 {{ metrics.pending }}</el-button>
      </div>
      <details>
        <summary>指标定义与性能证据</summary>
        <p>
          每条 Case 计数一次。通过率分母为 pass + fail + review；NA（不适用）和
          error（执行错误）均不计入分数或通过率分母。执行错误率分母为已返回结果数，未返回项另计。机器检查数不能当作用例数；多标签统计不可相加。
        </p>
        <MetadataGroup
          :items="[
            {
              label: '平均耗时',
              value: metrics.latency == null ? null : `${metrics.latency.toFixed(0)} ms`,
            },
            { label: '95% 用例耗时上限', value: metrics.p95 == null ? null : `${metrics.p95} ms` },
            { label: '已采集耗时的用例数', value: metrics.latencyCount },
          ]"
        />
        <MetadataGroup
          :items="[
            {
              label: run.target.type === 'Agent' ? 'Skill 路由一致率' : 'Skill 触发一致率',
              value: percent(metrics.routingRate),
            },
            { label: '同时有预期与实际 Skill 的用例数', value: metrics.routingCount },
          ]"
        />
        <p>Skill 一致率不能代替工具调用或业务质量。每个维度的所有检查通过，该用例才计为通过。</p>
        <MetadataGroup
          v-for="item in dimensions"
          :key="item.dimension"
          :title="item.dimension"
          :items="[
            { label: '通过率', value: percent(item.rate) },
            { label: '适用用例数', value: item.count },
          ]"
        />
        <p class="muted">
          没有检查证据的维度不生成指标；未采集用量不填零。全部数值均来自本地
          Mock，不能作为生产质量结论。
        </p>
      </details>
    </section>
    <section class="panel">
      <h2>执行状态</h2>
      <RunProgress :run="run" :state="state" />
      <StatusNotice type="error" v-if="run.error">{{ run.error }}</StatusNotice>
      <div class="action-row run-spacing">
        <el-button v-if="isActive(run)" type="danger" plain :disabled="readonly" @click="stop">{{
          run.status === 'running' ? '终止运行' : '取消任务'
        }}</el-button
        ><template v-else
          ><el-button :loading="busy" :disabled="readonly" @click="rerun('all')"
            >同配置复跑</el-button
          ><el-button :disabled="readonly || busy || !failedIds.length" @click="rerun('failed')"
            >仅重跑失败项（{{ failedIds.length }}）</el-button
          ><el-button
            v-if="run.status === 'failed' || run.status === 'terminated'"
            type="primary"
            :disabled="readonly || busy || !unfinishedIds.length"
            @click="rerun('unfinished')"
            >恢复未完成（{{ unfinishedIds.length }}）</el-button
          ></template
        >
      </div>
      <p class="muted small">
        恢复会清除基础设施故障，仅执行尚未返回结果的
        ID。失败子集包括机器不通过和执行错误。所有复跑均保存原始快照并创建新运行，保留来源；预约时间改为立即入队。
      </p>
    </section>
    <section class="panel">
      <h2>问题分布与评分标准</h2>
      <div class="action-row">
        <div v-for="group in groups" :key="`${group.key}-${group.value}`">
          <el-button @click="selectGroup(group.key, group.value)">{{ group.value }}</el-button>
          <MetadataGroup
            :items="[
              { label: '用例数', value: group.total },
              { label: '不通过', value: group.failed },
              { label: '执行错误', value: group.errors },
            ]"
          />
        </div>
      </div>
      <div class="table-scroll run-spacing">
        <table class="preview-table data-table">
          <thead>
            <tr>
              <th>固定评估器</th>
              <th>机器均分</th>
              <th>返回检查数</th>
              <th>问题结果数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in evaluatorStats" :key="item.id">
              <td>
                <button class="text-button" @click="selectEvaluator(item.id)">
                  {{ item.name }} v{{ item.version }}
                </button>
              </td>
              <td>{{ scoreText(item.score) }}</td>
              <td>{{ item.count }}</td>
              <td>
                <MetadataGroup
                  :items="[
                    { label: '不通过', value: item.fail },
                    { label: '执行错误', value: item.error },
                  ]"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section
      id="case-results"
      ref="tableRegion"
      class="panel"
      tabindex="-1"
      aria-label="用例结果表"
    >
      <div class="panel-title">
        <h2>用例结果</h2>
        <MetadataGroup
          :items="[
            { label: '当前匹配数', value: rows.length },
            { label: '全部用例数', value: run.cases.length },
          ]"
        />
        <el-button @click="clearFilters">清除筛选</el-button>
      </div>
      <form class="preview-form run-filters" @submit.prevent="filterChanged">
        <label class="field"
          >搜索用例<el-input
            v-model="filters.q"
            clearable
            aria-label="搜索用例"
            placeholder="ID、问题或原因"
            @change="filterChanged" /></label
        ><label class="field"
          >结果<el-select
            v-model="filters.outcome"
            clearable
            aria-label="结果筛选"
            @change="filterChanged"
            ><el-option
              v-for="outcome in outcomes"
              :key="outcome"
              :value="outcome"
              :label="outcomeLabels[outcome]" /><el-option
              value="pending"
              label="未返回" /></el-select></label
        ><label class="field"
          >标签<el-select
            v-model="filters.tag"
            clearable
            aria-label="标签筛选"
            @change="filterChanged"
            ><el-option
              v-for="tag in tags"
              :key="tag"
              :value="tag"
              :label="tag" /></el-select></label
        ><label class="field"
          >难度<el-select
            v-model="filters.difficulty"
            clearable
            aria-label="难度筛选"
            @change="filterChanged"
            ><el-option
              v-for="item in ['简单', '中等', '困难']"
              :key="item"
              :value="item"
              :label="item" /></el-select></label
        ><label class="field"
          >分类<el-select
            v-model="filters.category"
            clearable
            aria-label="分类筛选"
            @change="filterChanged"
            ><el-option
              v-for="item in ['正例', '负例', '边界']"
              :key="item"
              :value="item"
              :label="item" /></el-select></label
        ><label class="field"
          >评估器<el-select
            v-model="filters.evaluator"
            clearable
            aria-label="评估器筛选"
            @change="filterChanged"
            ><el-option
              v-for="item in evaluatorStats"
              :key="item.id"
              :value="item.id"
              :label="`${item.name} v${item.version}`" /></el-select
        ></label>
      </form>
      <p v-if="filters.evaluator" class="muted small">
        结果筛选按所选评估器的机器检查判定；Case 分数仍按所选报告口径展示。
      </p>
      <EmptyState
        v-if="!rows.length"
        title="没有匹配的用例结果"
        description="清除筛选查看全部用例；未返回的评分结果不会计为通过。"
        ><el-button @click="clearFilters">查看全部用例</el-button></EmptyState
      >
      <div v-else class="table-scroll">
        <table class="preview-table data-table">
          <thead>
            <tr>
              <th>用例与输入</th>
              <th>用例属性</th>
              <th>Case 判定与分数</th>
              <th>原因与证据</th>
              <th>Token 用量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.testCase.id">
              <td>
                <button
                  class="text-button"
                  :data-detail-key="row.testCase.id"
                  @click="evidenceCase = row.testCase.id"
                >
                  {{ row.testCase.question }}</button
                ><MetadataGroup
                  :items="[
                    { label: '轮次', value: Math.max(1, row.testCase.turns.length) },
                    { label: '优先级', value: row.testCase.priority },
                  ]"
                />
                <details>
                  <summary>查看用例编号</summary>
                  <code>{{ row.testCase.id }}</code>
                </details>
              </td>
              <td>
                <MetadataGroup
                  :items="[
                    { label: '分类', value: row.testCase.category },
                    { label: '难度', value: row.testCase.difficulty },
                    { label: '标签', value: row.testCase.tags.join('、') || '无' },
                  ]"
                />
              </td>
              <td>
                <span v-if="row.result" class="badge" :class="row.result.outcome">{{
                  outcomeLabels[row.result.outcome]
                }}</span
                ><span v-else>未返回</span><small>{{ scoreText(row.result?.score) }}</small>
              </td>
              <td>
                {{ row.result?.reason || '暂无执行证据'
                }}<small v-if="filters.evaluator && row.result"
                  >所选检查：{{
                    evaluatorCheck(run, row.result, filters.evaluator)?.reason || '检查缺失'
                  }}</small
                ><button class="text-button" @click="evidenceCase = row.testCase.id">
                  查看证据与复核 →
                </button>
              </td>
              <td>{{ tokenText(row.result?.tokens) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <el-pagination
        v-if="rows.length > pageSize"
        class="run-spacing"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="rows.length"
        layout="prev, pager, next"
        :pager-count="5"
        @current-change="pageChanged"
      />
    </section>
    <section class="panel">
      <h2>固定版本与运行关系</h2>
      <div class="run-lineage" aria-label="运行关系图">
        <span
          >对象 {{ run.config.targetVersion }}<br />输入 v{{ run.config.datasetVersion }}<br />{{
            run.config.evaluatorRefs.length
          }}
          个评分版本</span
        ><span aria-hidden="true">→</span><strong>{{ run.name }}</strong
        ><span aria-hidden="true">→</span><span>报告 / 用例证据<br />复跑 / 历史对比</span>
      </div>
      <div class="table-scroll">
        <table class="preview-table data-table">
          <thead>
            <tr>
              <th>关系</th>
              <th>固定引用</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>测评对象</td>
              <td>
                <EntityRef
                  :name="run.target.name"
                  :type="run.target.type"
                  :version="run.config.targetVersion"
                  compact
                />
                <EntityLink
                  context-key="src/preview/pages/RunPage.vue:342"
                  :to="{
                    path: '/preview/targets/' + run.config.targetId,
                    query: { version: run.config.targetVersion },
                  }"
                  >查看对象版本</EntityLink
                >
              </td>
            </tr>
            <tr>
              <td>测评集</td>
              <td>
                <EntityRef
                  :name="datasetName"
                  type="测评集"
                  :version="run.config.datasetVersion"
                  :id="run.config.datasetId"
                  compact
                />
                <EntityLink
                  context-key="src/preview/pages/RunPage.vue:354"
                  :to="{
                    path: '/preview/datasets/' + run.config.datasetId,
                    query: { version: String(run.config.datasetVersion) },
                  }"
                  >查看测评集版本</EntityLink
                >
              </td>
            </tr>
            <tr v-for="ref in run.config.evaluatorRefs" :key="ref.id">
              <td>评估器</td>
              <td>
                <EntityRef
                  :name="run.evaluators.find((item) => item.id === ref.id)?.name ?? ''"
                  type="评估器"
                  :version="ref.version"
                  :id="ref.id"
                  compact
                />
                <EntityLink
                  context-key="src/preview/pages/RunPage.vue:366"
                  :related="
                    run.config.evaluatorRefs.map((item) => ({
                      label:
                        run?.evaluators.find((entry) => entry.id === item.id)?.name ?? '评分标准',
                      to: {
                        path: '/preview/evaluators/' + item.id,
                        query: { version: String(item.version) },
                      },
                    }))
                  "
                  :to="{
                    path: '/preview/evaluators/' + ref.id,
                    query: { version: String(ref.version) },
                  }"
                  >查看评估器版本</EntityLink
                >
              </td>
            </tr>
            <tr>
              <td>模型与分阶段资源</td>
              <td>
                <MetadataGroup
                  :items="[
                    { label: '模型', value: run.config.model },
                    {
                      label: '执行资源',
                      value: state.credentials.find(
                        (item) =>
                          item.id === (run?.config.executionResourceId || run?.config.resourceId),
                      )?.name,
                    },
                    {
                      label: '评分资源',
                      value: state.credentials.find(
                        (item) =>
                          item.id === (run?.config.scoringResourceId || run?.config.resourceId),
                      )?.name,
                    },
                  ]"
                />
              </td>
            </tr>
            <tr>
              <td>关联对比</td>
              <td>
                <span v-if="!comparisons.length">尚未关联</span>
                <div v-for="item in comparisons" :key="item.id">
                  <RouterLink :to="`/preview/comparisons/${item.id}`">{{ item.name }}</RouterLink>
                  <MetadataGroup
                    :items="[
                      {
                        label: '对比方式',
                        value: item.mode === 'controlled' ? '受控对比' : '历史对比',
                      },
                    ]"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="run.sourceRunId">
              <td>复跑来源</td>
              <td>
                <RouterLink :to="`/preview/runs/${run.sourceRunId}`">{{
                  state.runs.find((item) => item.id === run?.sourceRunId)?.name || '查看来源任务'
                }}</RouterLink>
                <MetadataGroup
                  :items="[
                    { label: '复跑范围', value: retryScopeLabels[run.retryScope || 'all'] },
                    { label: '执行次数', value: run.attempt || 1 },
                  ]"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <details>
        <summary>查看不可变输入、对象、评估器快照与执行参数</summary>
        <JsonFallback
          :model-value="{
            config: run.config,
            target: run.target,
            evaluators: run.evaluators,
            cases: run.cases,
          }"
          readonly
        />
      </details>
    </section>
    <section class="panel">
      <h2>本地历史</h2>
      <div v-for="item in history" :key="item.id" class="detail-row">
        <RouterLink :to="`/preview/runs/${item.id}`">{{ item.name }}</RouterLink
        ><MetadataGroup
          :items="[
            { label: '范围', value: retryScopeLabels[item.retryScope || 'all'] },
            { label: '创建时间', value: formatTime(item.createdAt) },
          ]"
        />
      </div>
      <p v-if="!history.length" class="muted">暂无来源或后续复跑。</p>
      <div v-for="entry in audits" :key="entry.id" class="detail-row">
        <span>{{ entry.action }}</span
        ><MetadataGroup
          :items="[
            { label: '操作人', value: entry.actor },
            { label: '操作时间', value: formatTime(entry.time) },
          ]"
        />
      </div>
      <p v-if="!audits.length" class="muted small">暂无该运行的本地操作留痕。</p>
    </section>
  </template>
  <CaseEvidenceDrawer v-if="run" v-model="evidenceCase" :run-id="run.id" :items="evidenceItems" />
</template>
<style scoped>
.quality-panel {
  border-top: 3px solid var(--ag-brand);
}
.run-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0;
}
.run-kpis .preview-kpi {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--ag-bg);
  border: 1px solid var(--ag-line);
  border-radius: 6px;
  text-align: left;
  padding: 16px;
  color: var(--ag-body);
  min-width: 0;
}
.run-kpis strong {
  font-size: 24px;
  color: var(--ag-text);
  overflow-wrap: anywhere;
}
.run-kpis small {
  color: var(--ag-muted);
}
.score-mode {
  width: 210px;
}
.run-spacing {
  margin-top: 20px;
}
.result-summary {
  margin-bottom: 16px;
}
.run-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.field :deep(.el-select),
.field :deep(.el-input) {
  width: 100%;
  margin-top: 8px;
}
td {
  overflow-wrap: anywhere;
}
td:first-child {
  min-width: 180px;
}
.run-lineage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
  background: var(--ag-bg);
  border-radius: 6px;
}
.run-lineage > * {
  overflow-wrap: anywhere;
  min-width: 0;
}
@media (max-width: 1023px) {
  .run-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 767px) {
  .run-filters {
    grid-template-columns: 1fr;
  }
  .action-row :deep(.el-button) {
    margin-left: 0;
  }
  .run-kpis strong {
    font-size: 20px;
  }
  .run-lineage {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
