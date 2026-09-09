<script setup lang="ts">
import EntityRef from '../components/EntityRef.vue'
import MetadataGroup from '../components/MetadataGroup.vue'
import LineageLink from '../components/LineageLink.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { catalogLabel, operationLabel, conditionField } from '../catalogLabels'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type Report, type Trace, type CheckResult } from '../api/client'
import { outcomeLabels, scoreText } from '../resultLabels'
import ValueView from '../components/ValueView.vue'
import JsonFallback from '../components/JsonFallback.vue'
import ExpectationSummary from '../components/dataset/ExpectationSummary.vue'
import TokenUsage from '../components/TokenUsage.vue'

const props = defineProps<{
  runId?: string
  caseId?: string
  evaluatorId?: string
  sourceReport?: Report
  embedded?: boolean
}>()
const route = useRoute(),
  router = useRouter()
const currentRunId = computed(() => props.runId ?? String(route.params.runId ?? ''))
const currentCaseId = computed(() => props.caseId ?? String(route.params.caseId ?? ''))
const evaluator = ref('')
watch(
  () => props.evaluatorId ?? String(route.query.evaluator ?? ''),
  (value) => (evaluator.value = value),
  { immediate: true },
)
function chooseEvaluator(id: string) {
  evaluator.value = id
  if (!props.embedded) void router.replace({ query: { ...route.query, evaluator: id } })
}
const report = ref<Report | null>(null),
  trace = ref<Trace | null>(null)
const error = ref(''),
  traceError = ref(''),
  loading = ref(true),
  traceLoading = ref(true)
let controller: AbortController
const currentCase = computed(() =>
  report.value?.run.manifest.dataset.cases.find((c) => c.id === currentCaseId.value),
)
function checkField(check: CheckResult) {
  const expectation = currentCase.value?.turns.flatMap(turn => turn.expectations)
    .find(item => item.id === check.expectation_id)
  return conditionField(expectation) ?? conditionField(check.expected)
}
const results = computed(
  () => report.value?.results.filter((r) => r.case_id === currentCaseId.value) ?? [],
)
const selected = computed(
  () => results.value.find((r) => r.evaluator_id === evaluator.value) ?? results.value[0],
)
const spans = computed(() =>
  [...(trace.value?.spans ?? [])].sort((a, b) => a.sequence - b.sequence),
)
const failureSpans = computed(
  () =>
    new Set(
      selected.value?.checks
        .filter((c) => c.outcome === 'fail' || c.outcome === 'error')
        .flatMap((c) => (c.failure_span_id ? [c.failure_span_id] : c.span_ids)) ?? [],
    ),
)
async function loadTrace(signal: AbortSignal) {
  traceLoading.value = true
  traceError.value = ''
  try {
    const value = await api.trace(currentRunId.value, currentCaseId.value, signal)
    if (!signal.aborted) trace.value = value
  } catch (e) {
    if (!signal.aborted) traceError.value = userError(e)
  } finally {
    if (!signal.aborted) traceLoading.value = false
  }
}
async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  report.value = null
  trace.value = null
  error.value = ''
  loading.value = true
  try {
    const value =
      props.sourceReport?.run.id === currentRunId.value
        ? props.sourceReport
        : await api.report(currentRunId.value, signal)
    if (signal.aborted) return
    report.value = value
    if (!currentCase.value) error.value = '本次任务中没有这个用例，请返回报告选择。'
    else await loadTrace(signal)
  } catch (e) {
    if (!signal.aborted) error.value = userError(e)
  } finally {
    if (!signal.aborted) loading.value = false
  }
}
async function locateSpan(id: string) {
  const node = document.getElementById(`span-${id}`) as HTMLDetailsElement | null
  if (node) {
    node.open = true
    await nextTick()
    node.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    })
    node.focus()
  }
}
watch([currentRunId, currentCaseId], load, { immediate: true })
onUnmounted(() => controller?.abort())
</script>

<template>
  <RouterLink
    v-if="!embedded && route.query.comparisonBaseline && route.query.comparisonCandidate"
    class="back-link"
    :to="{
      path: '/comparisons',
      query: {
        baseline: route.query.comparisonBaseline,
        candidate: route.query.comparisonCandidate,
        change: route.query.comparisonChange,
        q: route.query.comparisonQuery,
      },
    }"
    >← 返回版本对比与筛选</RouterLink
  >
  <RouterLink
    v-if="!embedded"
    class="back-link"
    :to="{
      path: `/runs/${currentRunId}`,
      query: {
        tab: 'cases',
        outcome: route.query.outcome,
        dimension: route.query.dimension,
        q: route.query.q,
        fromStatus: route.query.fromStatus,
        fromQuery: route.query.fromQuery,
      },
    }"
    >← 返回报告与筛选结果</RouterLink
  >
  <div class="page-intro">
    <div>
      <h1>{{ currentCase?.name ?? '用例证据' }}</h1>
      <div v-if="report" class="entity-group">
        <EntityRef
          :name="catalogLabel(report.run.manifest.target.display_name)"
          type="测评对象"
          :version="report.run.manifest.target.ref.external_version_id"
          compact
        />
        <EntityRef
          :name="report.run.manifest.dataset.dataset_name"
          type="测评集"
          :version="report.run.manifest.dataset.version"
          compact
        />
      </div>
    </div>
    <RouterLink
      v-if="currentCase && report"
      class="ag-button"
      :to="{
        path: '/datasets',
        query: {
          ...route.query,
          dataset: report.run.manifest.dataset.dataset_id,
          version: report.run.manifest.dataset.version,
          case: currentCase.id,
          source: report.run.id,
          evaluator: selected?.evaluator_id,
          returnTo: 'evidence',
        },
      }"
      >查看用例与修订版本</RouterLink
    >
  </div>
  <StatusNotice type="error" v-if="error">
    {{ error }} <button class="text-button" @click="load">重新加载</button>
  </StatusNotice>
  <div v-if="loading && !report" class="skeleton">正在读取本次用例与评估证据…</div>
  <template v-if="currentCase && report">
    <LineageLink
      class="ag-button"
      :to="{
        path: '/lineage',
        query: {
          kind: 'case',
          id: report.run.manifest.dataset.dataset_id,
          version: report.run.manifest.dataset.version,
          case: currentCase.id,
          returnTo: route.fullPath,
        },
      }"
      >此用例版本的关联任务</LineageLink
    >
    <StatusNotice>
      这里展示本次任务保存的输入、检查项和执行记录。修订测评集会产生新版本，不会改变这份报告。
    </StatusNotice>
    <div class="split-grid">
      <section class="panel">
        <h2>用例输入与预期</h2>
        <p v-if="currentCase.notes" class="muted">{{ currentCase.notes }}</p>
        <article v-for="(turn, index) in currentCase.turns" :key="turn.id" class="evidence-card">
          <h3>第 {{ index + 1 }} 轮输入</h3>
          <ValueView :value="turn.input" />
          <details>
            <summary>本轮预期（{{ turn.expectations.length }} 项）</summary>
            <ExpectationSummary :items="turn.expectations" />
          </details>
          <template v-if="trace?.turn_outcomes[turn.id]"
            ><h3>实际输出</h3>
            <ValueView :value="trace.turn_outcomes[turn.id].output" />
          </template>
        </article>
        <JsonFallback :model-value="currentCase" readonly label="完整用例" />
      </section>
      <section class="panel">
        <h2>评分标准与检查项</h2>
        <nav class="action-row" aria-label="选择评分标准">
          <div v-for="item in results" :key="item.evaluator_id">
            <button
              class="ag-button"
              :class="{ primary: selected?.evaluator_id === item.evaluator_id }"
              :aria-current="selected?.evaluator_id === item.evaluator_id ? 'true' : undefined"
              @click="chooseEvaluator(item.evaluator_id)"
            >
              {{ catalogLabel(item.evaluator_name) }}
            </button>
            <MetadataGroup
              :items="[
                { label: '版本', value: item.evaluator_version },
                { label: '结果', value: outcomeLabels[item.outcome] },
              ]"
            />
          </div>
        </nav>
        <template v-if="selected"
          ><EntityRef
            :name="catalogLabel(selected.evaluator_name)"
            type="评估器"
            :version="selected.evaluator_version"
            :id="selected.evaluator_id"
            :heading-level="3"
          />
          <p>
            <span class="badge" :class="selected.outcome">{{
              outcomeLabels[selected.outcome]
            }}</span
            >　分数 {{ scoreText(selected.score) }}
          </p>
          <p>{{ selected.reason }}</p>
          <LineageLink
            :to="{
              path: '/lineage',
              query: {
                kind: 'evaluator',
                id: selected.evaluator_id,
                version: selected.evaluator_version,
                hash: selected.evaluator_content_sha256,
                returnTo: route.fullPath,
              },
            }"
            >使用此评分版本的任务</LineageLink
          >
          <StatusNotice type="error" v-if="selected.error_detail">
            <strong
              >评分执行异常：
              {{
                { crash: '执行失败', timeout: '调用超时', invalid_output: '返回格式无效' }[
                  selected.error_detail.category
                ]
              }}</strong
            >
            <p>{{ selected.error_detail.message }}</p>
            <p>
              {{
                selected.error_detail.retryable
                  ? '请核对连接与评分标准后，从报告重新创建测评。'
                  : '请联系管理员核对评分标准，再重新测评。'
              }}
            </p>
          </StatusNotice>
          <section v-if="selected.judge_record" class="evidence-card" aria-label="大模型评分调用信息">
            <h3>大模型评分调用</h3>
            <MetadataGroup
              :items="[
                { label: '请求模型', value: selected.judge_record.requested_model },
                { label: '实际模型', value: selected.judge_record.resolved_model },
              ]"
            />
            <TokenUsage
              :input="selected.judge_record.input_tokens"
              :output="selected.judge_record.output_tokens"
              :total="
                selected.judge_record.input_tokens != null &&
                selected.judge_record.output_tokens != null
                  ? selected.judge_record.input_tokens + selected.judge_record.output_tokens
                  : null
              "
              :latency="selected.judge_record.latency_ms"
              scope="这次评分调用，不含被测对象的其他调用"
            />
            <JsonFallback :model-value="selected.judge_record" readonly label="评分调用原始记录" />
          </section>
          <StatusNotice type="warning" v-if="selected.outcome === 'review'">
            请核对预期与实际输出，并将结论交给任务负责人。此报告保留原始评分结果。
          </StatusNotice>
          <article v-for="check in selected.checks" :key="check.id" class="evidence-card">
            <div class="panel-title">
              <h3>{{ catalogLabel(check.name) }}</h3>
              <span class="badge" :class="check.outcome">{{ outcomeLabels[check.outcome] }}</span>
            </div>
            <p>{{ check.reason }}</p>
            <div class="detail-row">
              <span>预期</span>
              <ValueView :value="check.expected" :field="checkField(check)" />
            </div>
            <div class="detail-row">
              <span>实际</span>
              <span v-if="check.actual_missing">未采集到实际值</span>
              <ValueView v-else :value="check.actual" :field="checkField(check)" />
            </div>
            <button
              v-if="check.failure_span_id && spans.some((s) => s.span_id === check.failure_span_id)"
              class="text-button"
              @click="locateSpan(check.failure_span_id)"
            >
              定位关联执行步骤
            </button>
          </article>
          <EmptyState
            v-if="!selected.checks.length"
            title="没有逐项检查记录"
            description="请先查看上方评分理由，并结合输入、输出与执行步骤核对结果。"
          />
        </template>
        <EmptyState
          v-else
          title="本用例缺少评分结果"
          description="请返回报告核对任务进度和缺失结果；已采集的输入与输出仍可查看。"
        ></EmptyState>
      </section>
    </div>
    <section class="panel">
      <div class="panel-title">
        <h2>执行轨迹</h2>
        <MetadataGroup
          :items="[
            { label: '排序', value: '实际采集顺序' },
            { label: '步骤数', value: spans.length },
          ]"
        />
      </div>
      <p class="muted">高亮表示当前评分标准关联的异常步骤；不代表已经确认根因。</p>
      <div v-if="traceLoading" class="skeleton">正在读取执行记录…</div>
      <StatusNotice type="error" v-if="traceError">
        执行记录读取失败：{{ traceError }}
        <button class="text-button" @click="loadTrace(controller.signal)">重试执行记录</button>
      </StatusNotice>
      <details
        v-for="span in spans"
        :id="`span-${span.span_id}`"
        :key="span.span_id"
        tabindex="-1"
        class="trace-step"
        :class="{ flagged: failureSpans.has(span.span_id) }"
      >
        <summary>
          <strong>{{ catalogLabel(span.name) }}</strong>
          <MetadataGroup
            :items="[
              { label: '步骤序号', value: span.sequence },
              { label: '操作类型', value: operationLabel(span.operation_type) },
              { label: '关联异常', value: failureSpans.has(span.span_id) },
            ]"
          />
        </summary>
        <ValueView :value="span.attributes" />
      </details>
      <EmptyState
        v-if="!traceLoading && !traceError && !spans.length"
        title="未采集到执行步骤"
        description="可先核对输入、输出与评分依据；需要调用详情时，请联系任务负责人。"
      ></EmptyState>
      <JsonFallback v-if="trace" :model-value="trace" readonly label="完整执行记录" />
    </section>
  </template>
</template>
