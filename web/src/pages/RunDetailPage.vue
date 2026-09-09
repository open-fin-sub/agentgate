<script setup lang="ts">
import EntityRef from '../components/EntityRef.vue'
import { useDetailState } from '../components/detailState'
import LineageLink from '../components/LineageLink.vue'
import DetailDrawer from '../components/DetailDrawer.vue'
import CaseResultPage from './CaseResultPage.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import JsonFallback from '../components/JsonFallback.vue'
import MetadataGroup from '../components/MetadataGroup.vue'
import { catalogLabel } from '../catalogLabels'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type Report, type Outcome } from '../api/client'
import { runsApi } from '../api/runs'
import type { RunProgress } from '../types/run'
import { outcomeLabels, gateLabels, scoreText } from '../resultLabels'
import { metricLabel } from '../metricLabels'
const route = useRoute(),
  router = useRouter(),
  report = ref<Report | null>(null),
  progress = ref<RunProgress | null>(null),
  error = ref(''),
  loading = ref(true)
const tab = ref(String(route.query.tab ?? 'summary')),
  filter = ref(String(route.query.outcome ?? '')),
  query = ref(String(route.query.q ?? '')),
  dimension = ref(String(route.query.dimension ?? ''))
watch([tab, filter, query, dimension], () =>
  router.replace({
    query: {
      ...route.query,
      tab: tab.value,
      outcome: filter.value || undefined,
      q: query.value || undefined,
      dimension: dimension.value || undefined,
    },
  }),
)
watch(
  () => route.query,
  () => {
    tab.value = String(route.query.tab ?? 'summary')
    filter.value = String(route.query.outcome ?? '')
    query.value = String(route.query.q ?? '')
    dimension.value = String(route.query.dimension ?? '')
  },
)
let controller: AbortController, timer: ReturnType<typeof setTimeout> | undefined
const overall = computed(() => report.value?.metrics.find((m) => m.level === 'overall'))
const cases = computed(
  () => new Map(report.value?.run.manifest.dataset.cases.map((c) => [c.id, c]) ?? []),
)
const primary = computed(
  () =>
    report.value?.results.filter((r) =>
      report.value!.run.manifest.primary_evaluator_ids.includes(r.evaluator_id),
    ) ?? [],
)
const results = computed(() =>
  primary.value.filter(
    (r) =>
      (!filter.value || r.outcome === filter.value) &&
      (!dimension.value || r.dimension === dimension.value) &&
      `${cases.value.get(r.case_id)?.name} ${r.evaluator_name} ${r.reason}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)
const statusLabels = {
  pending: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '执行失败',
  cancelled: '已取消',
}
const evidenceKey = useDetailState('report-evidence', '')
const evidenceItems = computed(() =>
  results.value.map((item) => ({
    key: JSON.stringify([item.case_id, item.evaluator_id]),
    label: cases.value.get(item.case_id)?.name ?? '用例证据',
  })),
)
const evidenceResult = computed(() =>
  results.value.find(
    (item) => JSON.stringify([item.case_id, item.evaluator_id]) === evidenceKey.value,
  ),
)
const evidencePath = computed(() =>
  evidenceResult.value && report.value
    ? router.resolve({
        path: `/runs/${encodeURIComponent(report.value.run.id)}/cases/${encodeURIComponent(evidenceResult.value.case_id)}`,
        query: {
          evaluator: evidenceResult.value.evaluator_id,
          outcome: filter.value || undefined,
          dimension: dimension.value || undefined,
          q: query.value || undefined,
          fromStatus: route.query.fromStatus,
          fromQuery: route.query.fromQuery,
        },
      }).fullPath
    : undefined,
)
async function load() {
  clearTimeout(timer)
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  error.value = ''
  try {
    const state = await runsApi.status(String(route.params.runId), signal)
    if (signal.aborted) return
    progress.value = state
    if (state.status === 'completed') {
      const value = await api.report(state.run_id, signal)
      if (!signal.aborted) report.value = value
    } else report.value = null
  } catch (e) {
    if (!signal.aborted) error.value = userError(e)
  } finally {
    if (!signal.aborted) {
      loading.value = false
      if (progress.value?.status === 'pending' || progress.value?.status === 'running')
        timer = setTimeout(load, 2000)
    }
  }
}
watch(
  () => route.params.runId,
  () => {
    report.value = null
    progress.value = null
    loading.value = true
    load()
  },
  { immediate: true },
)
onUnmounted(() => {
  controller?.abort()
  clearTimeout(timer)
})
function exportReport() {
  if (!report.value) return
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report.value, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${report.value.run.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}
function showResults(key = '') {
  tab.value = 'cases'
  dimension.value = key
}
function showOutcome(key: Outcome) {
  filter.value = key
  showResults()
}
function showDimension(key: string) {
  filter.value = ''
  showResults(key)
}
</script>
<template>
  <RouterLink
    class="back-link"
    :to="{ path: '/runs', query: { status: route.query.fromStatus, q: route.query.fromQuery } }"
    >← 返回任务列表</RouterLink
  >
  <div class="page-intro">
    <div>
      <h1>{{ report ? '测评报告' : '任务详情' }}</h1>
      <EntityRef v-if="progress" :name="catalogLabel(progress.target_name)" type="测评对象" :version="progress.target_version" compact />
      <StatusNotice
        v-if="report"
        :type="report.release_gate.outcome === 'fail' ? 'warning' : 'info'"
      >
        <h2>{{ gateLabels[report.release_gate.reason_code] }}</h2>
        <div>依据本次测评保存的判定规则；此结论不会自动发布测评对象。</div>
      </StatusNotice>
      <details v-if="progress">
        <summary>测评对象与固定输入</summary>
        <div class="entity-group">
          <EntityRef
            :name="progress.target_name"
            type="测评对象"
            :version="progress.target_version"
            compact
          />
          <EntityRef
            :name="progress.dataset_name"
            type="测评集"
            :version="progress.dataset_version"
            compact
          />
        </div>
      </details>
      <details>
        <summary>查看任务编号</summary>
        <code>{{ route.params.runId }}</code>
      </details>
    </div>
    <div v-if="report" class="action-row">
      <RouterLink
        class="ag-button primary"
        :to="{ path: '/runs/new', query: { source: report.run.id } }"
        >沿用配置新建测评</RouterLink
      ><button class="ag-button" @click="exportReport">导出报告数据</button>
      <RouterLink
        class="ag-button"
        :to="{ path: '/comparisons', query: { baseline: report.run.id } }"
        >作为基线对比</RouterLink
      >
      <LineageLink
        class="ag-button"
        :to="{
          path: '/lineage',
          query: {
            kind: 'run',
            id: report.run.id,
            source: report.run.manifest.target.ref.source_id,
            returnTo: route.fullPath,
          },
        }"
        >来源与关联任务</LineageLink
      >
      <LineageLink
        class="ag-button"
        :to="{
          path: '/lineage',
          query: {
            kind: 'target',
            id: report.run.manifest.target.ref.external_target_id,
            source: report.run.manifest.target.ref.source_id,
            targetType: report.run.manifest.target.ref.target_type,
            version: report.run.manifest.target.ref.external_version_id,
            hash: report.run.manifest.target.descriptor_sha256,
            returnTo: route.fullPath,
          },
        }"
        >此对象版本的关联任务</LineageLink
      >
    </div>
  </div>
  <StatusNotice type="error" v-if="error">
    状态或报告读取失败：{{ error }} <button class="text-button" @click="load">重新加载</button>
  </StatusNotice>
  <div v-if="loading" class="skeleton">正在读取当前任务…</div>
  <section v-if="progress && !report" class="panel">
    <div class="panel-title">
      <h2>执行进度</h2>
      <span class="badge" :class="progress.status">{{ statusLabels[progress.status] }}</span>
    </div>
    <p>{{ progress.completed_cases }} / {{ progress.total_cases }} 条用例已完成评估</p>
    <div
      class="progress-track"
      role="progressbar"
      :aria-valuenow="Math.round(progress.progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="用例进度"
    >
      <span :style="{ width: `${progress.progress * 100}%` }"></span>
    </div>
    <div class="detail-row">
      <span>队列位置</span><span>{{ progress.queue_position ?? '—' }}</span>
    </div>
    <div class="detail-row">
      <span>开始时间</span
      ><span>{{
        progress.started_at ? new Date(progress.started_at).toLocaleString('zh-CN') : '尚未开始'
      }}</span>
    </div>
    <StatusNotice
      type="error"
      v-if="progress.error"
      message="任务执行中断。请核对对象与评分标准后重新创建测评；仍失败时请联系管理员。"
    />
    <JsonFallback
      v-if="progress.error"
      :model-value="progress.error"
      readonly
      label="执行错误详情"
    />
    <p class="muted">
      {{
        progress.status === 'pending' || progress.status === 'running'
          ? '每 2 秒更新进度，完成后自动显示正式报告。'
          : '本次任务已结束，但没有形成完整报告。可核对当前状态，再重新创建测评。'
      }}
    </p>
    <p v-if="progress.status === 'pending' || progress.status === 'running'" class="muted small">
      任务状态会自动更新。你可以返回任务列表，完成后再查看报告。
    </p>
    <RouterLink v-else class="ag-button" to="/runs/new">重新创建测评</RouterLink>
  </section>
  <template v-if="report">
    <nav class="local-tabs" aria-label="报告内容">
      <button :class="{ active: tab === 'summary' }" @click="tab = 'summary'">总体结果</button
      ><button :class="{ active: tab === 'cases' }" @click="tab = 'cases'">评估结果与用例</button
      ><button :class="{ active: tab === 'config' }" @click="tab = 'config'">配置与版本</button>
    </nav>
    <template v-if="tab === 'summary'"
      ><div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">总体分数</div>
          <div class="stat-number">{{ scoreText(overall?.score) }}</div>
          <div class="stat-note">范围 0～1，按评分方案汇总，不是通过率</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">测评用例</div>
          <div class="stat-number">{{ report.run.manifest.dataset.cases.length }}</div>
          <div class="stat-note">来自本次固定输入</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">主评估器结果</div>
          <div class="stat-number">{{ overall?.total ?? '—' }}</div>
          <div class="stat-note">一个用例可有多个评估结果</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">最低总分要求</div>
          <div class="stat-number">{{ scoreText(report.release_gate.minimum_score) }}</div>
          <div class="stat-note">达到分数仍须满足阻断规则</div>
        </div>
      </div>
      <section class="panel">
        <h2>评估结果分布</h2>
        <div class="action-row">
          <button
            v-for="(label, key) in outcomeLabels"
            :key="key"
            class="ag-button"
            @click="showOutcome(key)"
          >
            {{ label }}：
            {{
              key === 'pass'
                ? overall?.passed
                : key === 'fail'
                  ? overall?.failed
                  : key === 'review'
                    ? overall?.reviewed
                    : key === 'error'
                      ? overall?.errors
                      : overall?.not_applicable
            }}
          </button>
        </div>
        <p class="muted small">
          单位：用例 × 主评估器结果。“需复核”为机器结论，不表示已完成人工复核。
        </p>
      </section>
      <section class="panel table-panel">
        <div class="panel-title">
          <h2>质量维度</h2>
          <span class="small muted">点击维度下钻证据</span>
        </div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>维度</th>
                <th>总分</th>
                <th>通过情况</th>
                <th>待处理结果</th>
                <th>不适用</th>
                <th>统计范围</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in report.metrics.filter((m) => m.level === 'dimension')" :key="m.key">
                <td>{{ metricLabel(m.key) }}</td>
                <td>{{ scoreText(m.score) }}</td>
                <td>
                  <MetadataGroup
                    :items="[
                      { label: '通过', value: m.passed },
                      { label: '不通过', value: m.failed },
                    ]"
                  />
                </td>
                <td>
                  <MetadataGroup
                    :items="[
                      { label: '需复核', value: m.reviewed },
                      { label: '错误', value: m.errors },
                    ]"
                  />
                </td>
                <td>{{ m.not_applicable }}</td>
                <td>
                  <MetadataGroup
                    :items="[
                      { label: '适用', value: m.applicable },
                      { label: '总数', value: m.total },
                    ]"
                  />
                </td>
                <td>
                  <button class="text-button" @click="showDimension(m.key)">查看对应结果</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <StatusNotice type="error" v-if="report.release_gate.missing_results.length">
        <p>
          有
          {{ report.release_gate.missing_results.length }}
          项检查缺少结果，请核对以下用例与评分标准后重新测评。
        </p>
        <MetadataGroup
          v-for="[caseId, evaluatorId] in report.release_gate.missing_results"
          :key="`${caseId}:${evaluatorId}`"
          :items="[
            {
              label: '用例',
              value:
                report.run.manifest.dataset.cases.find((c) => c.id === caseId)?.name ??
                '名称未提供',
            },
            {
              label: '评分标准',
              value: catalogLabel(
                report.run.manifest.evaluator_specs.find((e) => e.id === evaluatorId)?.name ??
                  '名称未提供',
              ),
            },
          ]"
        /> </StatusNotice
    ></template>
    <section v-else-if="tab === 'cases'" class="panel table-panel">
      <div class="panel-title">
        <h2>逐项结果</h2>
        <MetadataGroup :items="[{ label: '结果数', value: results.length }]" />
        <button v-if="dimension" class="text-button" @click="dimension = ''">
          清除维度：{{ metricLabel(dimension) }}
        </button>
      </div>
      <div class="toolbar" style="padding: 0 20px">
        <label class="field"
          >结果状态<el-select v-model="filter" aria-label="结果状态">
            <el-option value="" label="全部状态" />
            <el-option
              v-for="(label, key) in outcomeLabels"
              :key="key"
              :value="key"
              :label="label"
            /> </el-select></label
        ><label class="field"
          >搜索证据<el-input v-model="query" aria-label="搜索证据" placeholder="用例、评估器或原因"
        /></label>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>测评内容</th>
              <th>测评结果</th>
              <th>原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in results" :key="`${item.case_id}:${item.evaluator_id}`">
              <td>
                <EntityRef :name="cases.get(item.case_id)?.name ?? ''" type="用例" compact />
                <MetadataGroup
                  :items="[
                    { label: '评分标准', value: catalogLabel(item.evaluator_name) },
                    { label: '评分版本', value: item.evaluator_version },
                  ]"
                />
              </td>
              <td>
                <span class="badge" :class="item.outcome">{{ outcomeLabels[item.outcome] }}</span
                ><MetadataGroup :items="[{ label: '分数', value: scoreText(item.score) }]" />
              </td>
              <td>{{ item.reason }}</td>
              <td>
                <button
                  class="text-button"
                  :data-detail-key="JSON.stringify([item.case_id, item.evaluator_id])"
                  @click="evidenceKey = JSON.stringify([item.case_id, item.evaluator_id])"
                >
                  查看证据
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState
        v-if="!results.length"
        title="没有匹配的评分结果"
        description="调整用例或评估器筛选，查看其他结果；任务进行中时可稍后回来查看。"
      ></EmptyState>
    </section>
    <section v-else class="panel">
      <h2>固定版本与执行配置</h2>
      <div class="entity-group">
        <EntityRef
          :name="report.run.manifest.dataset.dataset_name"
          type="测评集"
          :version="report.run.manifest.dataset.version"
          :id="report.run.manifest.dataset.dataset_id"
        >
          <RouterLink
            :to="{
              path: '/datasets',
              query: {
                dataset: report.run.manifest.dataset.dataset_id,
                version: report.run.manifest.dataset.version,
              },
            }"
            >打开测评集</RouterLink
          >
        </EntityRef>
        <EntityRef
          v-for="item in report.run.manifest.evaluator_specs"
          :key="item.id"
          :name="catalogLabel(item.name)"
          type="评估器"
          :version="item.version"
          :id="item.id"
        />
      </div>
      <details>
        <summary>高级：评分汇总方案</summary>
        <MetadataGroup
          :items="[
            { label: '方案编号', value: report.run.manifest.metric_plan.id },
            { label: '版本', value: report.run.manifest.metric_plan.version },
          ]"
        />
      </details>
      <div class="detail-row">
        <span>运行超时</span><span>{{ report.run.manifest.timeout_seconds }} 秒</span>
      </div>
      <div class="detail-row"><span>Token 用量</span><span>当前报告未提供</span></div>
      <details>
        <summary>查看本次完整配置快照</summary>
        <JsonFallback :model-value="report.run.manifest" readonly />
      </details></section
  ></template>
  <DetailDrawer
    :model-value="!!evidenceResult"
    title="用例证据"
    :items="evidenceItems"
    :current-key="evidenceKey"
    :full-path="evidencePath"
    @update:model-value="
      (value) => {
        if (!value) evidenceKey = ''
      }
    "
    @select="evidenceKey = $event"
  >
    <CaseResultPage
      v-if="evidenceResult && report"
      :run-id="report.run.id"
      :case-id="evidenceResult.case_id"
      :evaluator-id="evidenceResult.evaluator_id"
      :source-report="report"
      embedded
    />
  </DetailDrawer>
</template>
