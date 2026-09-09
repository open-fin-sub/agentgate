<script setup lang="ts">
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { catalogLabel } from '../catalogLabels'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, type Report, type Trace } from '../api/client'
import { outcomeLabels, scoreText } from '../resultLabels'
import ValueView from '../components/ValueView.vue'
import JsonFallback from '../components/JsonFallback.vue'
import ExpectationSummary from '../components/dataset/ExpectationSummary.vue'
import TokenUsage from '../components/TokenUsage.vue'

const route = useRoute()
const report = ref<Report | null>(null),
  trace = ref<Trace | null>(null)
const error = ref(''),
  traceError = ref(''),
  loading = ref(true),
  traceLoading = ref(true)
let controller: AbortController
const currentCase = computed(() =>
  report.value?.run.manifest.dataset.cases.find((c) => c.id === route.params.caseId),
)
const results = computed(
  () => report.value?.results.filter((r) => r.case_id === route.params.caseId) ?? [],
)
const selected = computed(
  () => results.value.find((r) => r.evaluator_id === route.query.evaluator) ?? results.value[0],
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
    const value = await api.trace(String(route.params.runId), String(route.params.caseId), signal)
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
    const value = await api.report(String(route.params.runId), signal)
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
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    node.focus()
  }
}
watch(() => [route.params.runId, route.params.caseId], load, { immediate: true })
onUnmounted(() => controller?.abort())
</script>

<template>
  <RouterLink
    v-if="route.query.comparisonBaseline && route.query.comparisonCandidate"
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
    class="back-link"
    :to="{
      path: `/runs/${route.params.runId}`,
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
      <p v-if="report">
        {{ report.run.manifest.target.display_name }} ·
        {{ report.run.manifest.target.ref.external_version_id }} ·
        {{ report.run.manifest.dataset.dataset_name }} v{{ report.run.manifest.dataset.version }}
      </p>
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
    <RouterLink
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
      >此用例版本的关联任务</RouterLink
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
          <RouterLink
            v-for="item in results"
            :key="item.evaluator_id"
            class="ag-button"
            :class="{ primary: selected?.evaluator_id === item.evaluator_id }"
            :aria-current="selected?.evaluator_id === item.evaluator_id ? 'true' : undefined"
            :to="{ path: route.path, query: { ...route.query, evaluator: item.evaluator_id } }"
            >{{ catalogLabel(item.evaluator_name) }} · {{ outcomeLabels[item.outcome] }}</RouterLink
          >
        </nav>
        <template v-if="selected"
          ><h3>{{ catalogLabel(selected.evaluator_name) }}</h3>
          <p>
            <span class="badge" :class="selected.outcome">{{
              outcomeLabels[selected.outcome]
            }}</span
            >　分数 {{ scoreText(selected.score) }}
          </p>
          <p>{{ selected.reason }}</p>
          <p class="muted">评分标准固定版本：{{ selected.evaluator_version }}</p>
          <RouterLink
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
            >使用此评分版本的任务</RouterLink
          >
          <StatusNotice type="error" v-if="selected.error_detail">
            <strong
              >评分执行异常 ·
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
          <section v-if="selected.judge_record" class="evidence-card" aria-label="LLM 评分调用信息">
            <h3>LLM 评分调用</h3>
            <div class="detail-row">
              <span>请求 / 实际模型</span
              ><span
                >{{ selected.judge_record.requested_model }} /
                {{ selected.judge_record.resolved_model ?? '未返回' }}</span
              >
            </div>
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
              <h3>{{ check.name }}</h3>
              <span class="badge" :class="check.outcome">{{ outcomeLabels[check.outcome] }}</span>
            </div>
            <p>{{ check.reason }}</p>
            <div class="detail-row">
              <span>预期</span>
              <ValueView :value="check.expected" />
            </div>
            <div class="detail-row">
              <span>实际</span>
              <span v-if="check.actual_missing">未采集到实际值</span>
              <ValueView v-else :value="check.actual" />
            </div>
            <button
              v-if="check.failure_span_id && spans.some((s) => s.span_id === check.failure_span_id)"
              class="text-button"
              @click="locateSpan(check.failure_span_id)"
            >
              定位关联执行步骤
            </button>
          </article>
          <EmptyState v-if="!selected.checks.length" title="没有逐项检查记录" description="请先查看上方评分理由，并结合输入、输出与执行步骤核对结果。" />
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
        <span class="muted small">按实际采集顺序 · {{ spans.length }} 个步骤</span>
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
          <span class="badge">{{ span.sequence }}</span> {{ span.name }}
          <span class="muted">· {{ span.operation_type }}</span>
          <span v-if="failureSpans.has(span.span_id)">· 关联异常</span>
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
