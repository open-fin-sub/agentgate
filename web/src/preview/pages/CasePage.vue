<script setup lang="ts">
import TokenUsage from '../../components/TokenUsage.vue'
import ValueView from '../../components/ValueView.vue'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { usePreview, clone, uid, downloadJson } from '../workspace'
import { buildRun } from '../execution'
import type { HumanReview, TestCase } from '../types'
import {
  formatTime,
  outcomeLabels,
  queryText,
  reportFilters,
  reportRows,
  reviewedRun,
  scoreText,
  validateConfig,
} from '../components/RunSupport'
const { state, change } = usePreview()
const route = useRoute()
const router = useRouter()
const run = computed(() => state.runs.find((item) => item.id === String(route.params.id)))
const testCase = computed(() =>
  run.value?.cases.find((item) => item.id === String(route.params.caseId)),
)
const result = computed(() =>
  run.value?.results.find((item) => item.caseId === String(route.params.caseId)),
)
const reviews = computed(() =>
  state.reviews
    .filter((item) => item.runId === run.value?.id && item.caseId === testCase.value?.id)
    .slice()
    .sort((a, b) => b.time.localeCompare(a.time)),
)
const latestReview = computed(() => reviews.value[0])
const scoreMode = computed(() => (queryText(route.query, 'mode') === 'human' ? 'human' : 'machine'))
const filteredIds = computed(() => {
  const current = run.value
  if (!current) return []
  const report = scoreMode.value === 'human' ? reviewedRun(current, state.reviews) : current
  return reportRows(report, reportFilters(route.query)).map((row) => row.testCase.id)
})
const position = computed(() => filteredIds.value.indexOf(testCase.value?.id ?? ''))
const previous = computed(() => (position.value > 0 ? filteredIds.value[position.value - 1] : ''))
const next = computed(() => (position.value >= 0 ? filteredIds.value[position.value + 1] : ''))
const readonly = computed(() => state.role === 'viewer')
const feedback = ref('')
const busy = ref(false)
const review = reactive<{
  decision: HumanReview['decision']
  score: number | undefined
  reason: string
}>({ decision: 'pending', score: undefined, reason: '' })
const savedReview = ref('')
const dirty = computed(() => savedReview.value !== JSON.stringify(review))
const regressionId = ref('ds-regression')
const regressionCaseId = ref('')
const regressionDestinations = computed(() =>
  state.datasets.filter(
    (item) =>
      !item.archived &&
      item.id !== run.value?.config.datasetId &&
      item.targetId === run.value?.config.targetId,
  ),
)
const reportLink = computed(() => ({
  path: `/preview/runs/${run.value?.id ?? String(route.params.id)}`,
  query: { ...route.query },
}))
const revisionLink = computed(() => ({
  path: `/preview/datasets/${run.value?.config.datasetId}`,
  query: {
    run: run.value?.id,
    case: testCase.value?.id,
    version: String(run.value?.config.datasetVersion),
    draft: '1',
    returnTo: route.fullPath,
  },
}))
const regressionLink = computed(() => ({
  path: `/preview/datasets/${regressionId.value}`,
  query: {
    draft: '1',
    case: regressionCaseId.value || testCase.value?.id,
    returnTo: route.fullPath,
  },
}))
const absentChecks = computed(
  () =>
    run.value?.config.evaluatorRefs.filter(
      (ref) =>
        !result.value?.checks.some(
          (check) => check.evaluatorId === ref.id && check.evaluatorVersion === ref.version,
        ),
    ) ?? [],
)
const reviewForm = ref<HTMLElement>()
function initializeReview() {
  review.decision = latestReview.value?.decision ?? 'pending'
  review.score = latestReview.value?.score ?? undefined
  review.reason = latestReview.value?.reason ?? ''
  savedReview.value = JSON.stringify(review)
  feedback.value = ''
  regressionCaseId.value = ''
  if (!regressionDestinations.value.some((item) => item.id === regressionId.value))
    regressionId.value = regressionDestinations.value[0]?.id ?? ''
}
async function guard() {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm('人工复核尚未保存，离开会丢失输入。', '未保存的复核', {
      confirmButtonText: '放弃并离开',
      cancelButtonText: '继续复核',
      type: 'warning',
    })
    return true
  } catch {
    return false
  }
}
onBeforeRouteLeave(guard)
onBeforeRouteUpdate((to) =>
  String(to.params.caseId) !== String(route.params.caseId) ? guard() : true,
)
function navigate(id: string | undefined) {
  if (id)
    void router.push({
      path: `/preview/runs/${run.value?.id}/cases/${id}`,
      query: { ...route.query },
    })
}
function navigatePrevious() {
  navigate(previous.value)
}
function navigateNext() {
  navigate(next.value)
}
function saveReview() {
  const current = run.value,
    item = testCase.value
  if (!current || !item || !result.value) return
  if (!review.reason.trim()) {
    feedback.value = '请填写人工复核理由，说明证据和纠正依据。'
    return
  }
  if (
    review.score != null &&
    (!Number.isFinite(review.score) || review.score < 0 || review.score > 1)
  ) {
    feedback.value = '人工分数须为 0～1，或留空。'
    return
  }
  const entry: HumanReview = {
    runId: current.id,
    caseId: item.id,
    decision: review.decision,
    score: review.score ?? null,
    reason: review.reason.trim(),
    actor: '当前体验用户',
    time: new Date().toISOString(),
  }
  if (
    change(`${current.id}/${item.id}`, '追加人工复核（保留机器判定）', () =>
      state.reviews.push(clone(entry)),
    )
  ) {
    savedReview.value = JSON.stringify(review)
    feedback.value = '人工复核已独立保存。机器原判、分数和证据保持原样。'
  } else feedback.value = '复核未保存，请查看权限或存储冲突提示。'
}
function clearScore() {
  review.score = undefined
}
function updateScore(event: Event) {
  const input = event.target as HTMLInputElement
  review.score = input.validity.badInput
    ? Number.NaN
    : input.value === ''
      ? undefined
      : input.valueAsNumber
}
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    saveReview()
    return
  }
  const element = event.target as HTMLElement | null
  if (
    element?.closest(
      'input, textarea, select, button, [contenteditable="true"], [role="combobox"], [role="dialog"]',
    )
  )
    return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key === 'ArrowLeft' && previous.value) {
    event.preventDefault()
    navigatePrevious()
  }
  if (event.key === 'ArrowRight' && next.value) {
    event.preventDefault()
    navigateNext()
  }
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    reviewForm.value?.focus()
    reviewForm.value?.scrollIntoView({ block: 'start' })
  }
}
function sameCase(a: TestCase, b: TestCase) {
  return JSON.stringify({ ...a, sources: [] }) === JSON.stringify({ ...b, sources: [] })
}
function reviseCase() {
  const current = run.value,
    item = testCase.value
  if (!current || !item) return
  const dataset = state.datasets.find((entry) => entry.id === current.config.datasetId)
  const version = dataset?.versions.find((entry) => entry.version === current.config.datasetVersion)
  if (!dataset || dataset.archived || !version) {
    feedback.value = '原测评集版本不存在或已归档，无法创建修订草稿。'
    return
  }
  if (dataset.draft !== null) {
    const existing = dataset.draft.find((entry) => entry.id === item.id)
    if (!existing || !sameCase(existing, item)) {
      feedback.value = '已有草稿包含不同的用例修订。请先处理已有草稿，本操作不会覆盖它。'
      return
    }
    void router.push(revisionLink.value)
    return
  }
  const ok = change(`${current.id}/${item.id}`, '从固定输入版本创建用例修订草稿', () => {
    dataset.draft = clone(version.cases)
    const index = dataset.draft.findIndex((entry) => entry.id === item.id)
    if (index < 0) throw new Error('原固定版本未找到该用例。')
    dataset.draft[index] = clone(item)
    dataset.draft[index]!.sources = [
      ...new Set([...item.sources, `/preview/runs/${current.id}/cases/${item.id}`]),
    ]
    dataset.draftBase = version.version
  })
  if (ok) void router.push(revisionLink.value)
}
function addRegression() {
  const current = run.value,
    item = testCase.value
  const dataset = state.datasets.find((entry) => entry.id === regressionId.value)
  if (
    !current ||
    !item ||
    !dataset ||
    dataset.archived ||
    dataset.id === current.config.datasetId ||
    dataset.targetId !== current.config.targetId
  ) {
    feedback.value = '请选择同一对象下可编辑的其他回归测评集。'
    return
  }
  let selectedId = item.id
  const ok = change(`${current.id}/${item.id}`, `加入回归集 ${dataset.name} 草稿`, () => {
    const base = dataset.versions[dataset.versions.length - 1]
    if (dataset.draft === null) {
      dataset.draft = clone(base?.cases ?? [])
      dataset.draftBase = base?.version ?? null
    }
    const source = `/preview/runs/${current.id}/cases/${item.id}`
    const already = dataset.draft.find(
      (entry) => entry.sources.includes(source) || (entry.id === item.id && sameCase(entry, item)),
    )
    if (already) {
      already.sources = [...new Set([...already.sources, source])]
      selectedId = already.id
      return
    }
    const addition = clone(item)
    if (dataset.draft.some((entry) => entry.id === addition.id)) addition.id = uid('case')
    addition.sources = [
      ...new Set([
        ...addition.sources,
        source,
        `${current.config.datasetId}@${current.config.datasetVersion}`,
      ]),
    ]
    dataset.draft.push(addition)
    selectedId = addition.id
  })
  if (ok) {
    regressionCaseId.value = selectedId
    feedback.value = `已加入“${dataset.name}”草稿，ID：${selectedId}。请审阅并发布新版本后用于回归。`
  }
}
async function rerunSingle() {
  const current = run.value,
    item = testCase.value
  if (!current || !item || busy.value) return
  const config = clone(current.config)
  config.caseIds = [item.id]
  config.scheduledAt = null
  if (config.fault === 'infrastructure') config.fault = 'none'
  const errors = validateConfig(state, config)
  if (errors.length) {
    feedback.value = `无法单例复跑：${errors.join(' ')}`
    return
  }
  if (!(await guard())) return
  busy.value = true
  try {
    let id = ''
    const ok = change(`${current.id}/${item.id}`, '单用例复跑，创建新运行', () => {
      const nextRun = buildRun(state, config, `${current.name} · ${item.id} 单例复跑`, current.id)
      nextRun.cases = [clone(item)]
      nextRun.target = clone(current.target)
      nextRun.evaluators = clone(current.evaluators)
      nextRun.retryScope = 'single'
      nextRun.attempt = (current.attempt ?? 1) + 1
      state.runs.push(nextRun)
      id = nextRun.id
    })
    if (ok) {
      savedReview.value = JSON.stringify(review)
      await router.push(`/preview/runs/${id}`)
    }
  } finally {
    busy.value = false
  }
}
function exportEvidence() {
  if (run.value && testCase.value)
    downloadJson(`${run.value.id}-${testCase.value.id}.json`, {
      timestamp: new Date().toISOString(),
      manifest: run.value.config,
      runId: run.value.id,
      filterManifest: { ...reportFilters(route.query), scoreMode: scoreMode.value },
      targetSnapshot: run.value.target,
      evaluatorSnapshots: run.value.evaluators,
      caseSnapshot: testCase.value,
      machineResult: result.value ?? null,
      humanReviews: reviews.value,
    })
}
watch(() => `${String(route.params.id)}/${String(route.params.caseId)}`, initializeReview, {
  immediate: true,
})
onMounted(() => window.addEventListener('keydown', keyboard))
onUnmounted(() => window.removeEventListener('keydown', keyboard))
</script>
<template>
  <RouterLink class="back-link" :to="reportLink">← 返回报告（保留筛选）</RouterLink>
  <section v-if="!run || !testCase" class="panel preview-empty" role="alert">
    <h1>用例不存在或无权访问</h1>
    <p>未找到该运行中的固定用例 {{ String(route.params.caseId) }}，请从原报告重新进入。</p>
  </section>
  <template v-else>
    <div class="page-intro">
      <div>
        <h1>{{ testCase.id }} · 用例证据</h1>
        <p>
          {{ run.target.name }} / {{ run.config.targetVersion }} · {{ run.config.datasetId }} v{{
            run.config.datasetVersion
          }}
          · {{ testCase.category }} / {{ testCase.difficulty }} / {{ testCase.priority }}
        </p>
      </div>
      <el-button @click="exportEvidence">导出本条证据</el-button>
    </div>
    <div class="case-navigation panel">
      <div class="action-row">
        <el-button :disabled="!previous" @click="navigatePrevious">← 上一条</el-button
        ><span>{{
          position >= 0 ? `${position + 1} / ${filteredIds.length}` : '本条已不在当前筛选内'
        }}</span
        ><el-button :disabled="!next" @click="navigateNext">下一条 →</el-button>
      </div>
      <span class="muted small">沿用报告筛选 · ← / → 切换，R 定位复核，Ctrl / ⌘ + Enter 保存</span>
    </div>
    <div v-if="readonly" class="notice warning">
      当前为只读角色，无权保存人工复核、修订用例、加入回归集或复跑。
    </div>
    <div v-if="feedback" class="notice" role="status">{{ feedback }}</div>
    <section class="panel">
      <h2>机器原始判定</h2>
      <template v-if="result"
        ><div class="action-row">
          <span class="badge" :class="result.outcome">{{ outcomeLabels[result.outcome] }}</span
          ><strong>{{ scoreText(result.score) }}</strong
          ><span>{{ result.reason }}</span>
        </div>
<TokenUsage :input="result.inputTokens" :output="result.outputTokens" :total="result.tokens" :latency="result.latency" scope="本条用例" />
        <p v-if="result.outcome === 'NA' || result.outcome === 'error'" class="notice warning">
          {{
            result.outcome === 'NA'
              ? '不适用：该标准缺少适用条件。'
              : '执行错误：没有可用于质量评分的有效执行结果。'
          }}不计入平均分与通过率分母，不能按零分解释。
        </p></template
      >
      <p v-else class="notice warning">
        该用例尚未返回结果。原始输入可查看，当前不能填写无证据的人工评分。
      </p>
      <div v-if="latestReview" class="review-summary">
        <strong>最新人工复核（独立记录）</strong>
        <p>
          {{
            latestReview.decision === 'confirmed'
              ? '确认 Badcase'
              : latestReview.decision === 'dismissed'
                ? '非 Badcase / 机器误判'
                : '待复核'
          }}
          · 人工分数 {{ scoreText(latestReview.score) }} · {{ latestReview.reason }}
        </p>
        <span class="muted small"
          >{{ latestReview.actor }} · {{ formatTime(latestReview.time) }}</span
        >
      </div>
    </section>
    <div class="preview-columns evidence-grid">
      <section class="panel">
        <h2>原始输入与期望快照</h2>
        <h3>输入</h3>
        <ValueView :value="testCase.question" />
        <h3 class="case-space">期望输出</h3>
        <ValueView :value="testCase.expected || '缺少期望输出'" />
        <p class="case-space">期望 Skill：{{ testCase.expectedSkill || '未指定' }}</p>
        <details>
          <summary>变量、文件引用、标签与来源</summary>
          <ValueView :value="testCase.variables || '未提供变量'" />
          <p class="case-space">
            文件引用：{{ testCase.files.join('、') || '无' }}（不读取文件内容）
          </p>
          <p>标签：{{ testCase.tags.join('、') || '无' }}</p>
          <p>备注：{{ testCase.note || '无' }}</p>
          <p class="case-wrap">来源：{{ testCase.sources.join('、') || '无来源记录' }}</p>
        </details>
      </section>
      <section class="panel">
        <h2>实际输出</h2>
        <ValueView :value="result?.output || '暂无有效输出'" />
        <p class="case-space">实际 Skill：{{ result?.actualSkill || '缺失' }}</p>
        <p
          v-if="
            result?.actualSkill &&
            testCase.expectedSkill &&
            result.actualSkill !== testCase.expectedSkill
          "
          class="notice warning"
        >
          实际 Skill 与期望不一致，请结合路由和工具证据定位原因。
        </p>
      </section>
    </div>
    <section v-if="testCase.turns.length" class="panel">
      <h2>多轮输入与逐轮期望</h2>
      <article v-for="(turn, index) in testCase.turns" :key="index" class="trace-step">
        <h3>第 {{ index + 1 }} 轮</h3>
        <p><strong>输入：</strong>{{ turn.input }}</p>
        <p><strong>期望：</strong>{{ turn.expected || '未指定' }}</p>
      </article>
      <p class="muted small">
        逐轮实际输出仅在下方 Trace 有证据时展示；不使用期望内容补齐缺失 Trace。
      </p>
    </section>
    <section class="panel">
      <h2>评估器检查与判定原因</h2>
      <article
        v-for="(check, index) in result?.checks ?? []"
        :key="`${check.evaluatorId}-${check.evaluatorVersion}-${index}`"
        class="evidence-card"
      >
        <div class="action-row">
          <h3>{{ check.name }}</h3>
          <span class="badge" :class="check.outcome">{{ outcomeLabels[check.outcome] }}</span
          ><strong>{{ scoreText(check.score) }}</strong>
        </div>
        <p>{{ check.reason || '未返回原因，证据不足' }}</p>
        <RouterLink
          :to="{
            path: `/preview/evaluators/${check.evaluatorId}`,
            query: { version: String(check.evaluatorVersion) },
          }"
          >{{ check.evaluatorId }} v{{ check.evaluatorVersion }}</RouterLink
        ><span class="muted small"> · 维度 {{ check.dimension || '未提供' }}</span>
      </article>
      <p v-if="absentChecks.length" class="notice warning">
        检查缺失：{{
          absentChecks.map((item) => `${item.id} v${item.version}`).join('、')
        }}。可能尚未执行、因前置失败短路或证据未返回；缺少原因时无法确定，不补成通过或零分。
      </p>
      <p v-if="!result?.checks.length" class="muted">尚无评估器检查证据。</p>
    </section>
    <section class="panel">
      <h2>执行 Trace</h2>
      <p v-if="!result?.trace.length" class="notice warning">
        Trace 缺失或尚未返回。只能依据现有输入、输出和检查定位，无法确认具体调用或失败轮次。
      </p>
      <details
        v-for="step in result?.trace ?? []"
        :key="step.id"
        class="trace-step"
        :class="{ flagged: !!step.error }"
        :open="!!step.error"
      >
        <summary>
          {{ step.title }} · {{ step.duration == null ? '耗时缺失' : `${step.duration} ms`
          }}{{ step.error ? ' · 有错误' : '' }}
        </summary>
        <p v-if="step.error" class="notice error">{{ step.error }}</p>
        <p><strong>输入</strong></p>
        <ValueView :value="step.input || '输入缺失'" />
        <p class="case-space"><strong>输出</strong></p>
        <ValueView :value="step.output || '输出缺失'" />
        <p class="muted small">Token：{{ step.tokens ?? '缺失' }} · 节点 {{ step.id }}</p>
      </details>
    </section>
    <section ref="reviewForm" class="panel" tabindex="-1" aria-label="人工复核表单">
      <h2>人工复核</h2>
      <p class="muted">
        复核追加独立记录，不覆盖机器分数。人工口径按最新记录派生，机器原始报告始终可查看。
      </p>
      <form @submit.prevent="saveReview">
        <div class="preview-form form-grid">
          <label class="field"
            >人工结论<el-select
              v-model="review.decision"
              :disabled="readonly || !result"
              aria-label="人工结论"
              ><el-option value="confirmed" label="确认 Badcase" /><el-option
                value="dismissed"
                label="非 Badcase / 机器误判" /><el-option
                value="pending"
                label="待复核" /></el-select
          ></label>
          <label class="field">
            人工分数（可选，0～1）
            <input
              :value="review.score ?? ''"
              :disabled="readonly || !result"
              type="number"
              min="0"
              max="1"
              step="0.001"
              inputmode="decimal"
              placeholder="未填写"
              aria-label="人工分数"
              aria-describedby="review-score-help"
              @input="updateScore"
            />
            <span id="review-score-help" class="hint">
              未填写时不调整机器分数；填写 0 会明确保存零分。
            </span>
            <el-button :disabled="readonly || !result" text @click="clearScore">留空</el-button>
          </label>
          <label class="field full"
            >复核理由<el-input
              v-model="review.reason"
              :disabled="readonly || !result"
              type="textarea"
              :rows="4"
              maxlength="3000"
              show-word-limit
              aria-label="复核理由"
              placeholder="结合期望、输出和 Trace 说明判断依据"
          /></label>
        </div>
        <div class="action-row case-space">
          <el-button
            type="primary"
            native-type="submit"
            :disabled="readonly || !result || !review.reason.trim() || !dirty"
            >保存人工复核</el-button
          ><span class="muted small">{{ dirty ? '有未保存的修改' : '无未保存修改' }}</span>
        </div>
      </form>
      <details v-if="reviews.length" class="case-space">
        <summary>复核历史（{{ reviews.length }}）</summary>
        <article
          v-for="(entry, index) in reviews"
          :key="`${entry.time}-${index}`"
          class="evidence-card"
        >
          <strong
            >{{
              entry.decision === 'confirmed'
                ? '确认 Badcase'
                : entry.decision === 'dismissed'
                  ? '非 Badcase'
                  : '待复核'
            }}
            · {{ scoreText(entry.score) }}</strong
          >
          <p>{{ entry.reason }}</p>
          <p class="muted small">{{ entry.actor }} · {{ formatTime(entry.time) }}</p>
        </article>
      </details>
    </section>
    <section class="panel">
      <h2>修订与复验</h2>
      <div class="action-row">
        <el-button :disabled="readonly" @click="reviseCase">修订此用例</el-button
        ><el-button :disabled="readonly" :loading="busy" @click="rerunSingle">单例复跑</el-button
        ><RouterLink :to="revisionLink">查看原测评集草稿</RouterLink>
      </div>
      <p class="muted small case-space">
        修订从原发布版本创建草稿并定位
        {{
          testCase.id
        }}；已有不同草稿不会覆盖。单例复跑保留当前对象、输入和评分版本，新增来源关联。
      </p>
      <div class="action-row">
        <el-select
          v-model="regressionId"
          class="regression-select"
          aria-label="目标回归集"
          placeholder="选择回归集"
          ><el-option
            v-for="item in regressionDestinations"
            :key="item.id"
            :label="item.name"
            :value="item.id" /></el-select
        ><el-button :disabled="readonly || !regressionId" @click="addRegression"
          >加入回归集草稿</el-button
        ><RouterLink v-if="regressionCaseId" :to="regressionLink"
          >审阅已加入的用例并发布 →</RouterLink
        >
      </div>
      <p v-if="!regressionDestinations.length" class="muted small">
        尚无同对象的其他可编辑回归集。<RouterLink
          :to="{
            path: '/preview/datasets',
            query: { mode: 'manual', target: run.config.targetId },
          }"
          >创建测评集</RouterLink
        >
      </p>
    </section>
  </template>
</template>
<style scoped>
.case-navigation {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.case-space {
  margin-top: 20px;
}
.case-wrap {
  overflow-wrap: anywhere;
}
.review-summary {
  margin-top: 20px;
  padding: 16px;
  background: var(--ag-bg);
  border-radius: 6px;
}
.review-summary p {
  margin: 8px 0;
}
.field :deep(.el-select),
.field :deep(.el-input),
.field :deep(.el-textarea) {
  width: 100%;
  margin-top: 8px;
}
.field :deep(.el-input-number) {
  margin-top: 8px;
}
.regression-select {
  width: min(100%, 300px);
}
.evidence-card h3 {
  margin-bottom: 0;
}
.trace-step summary {
  overflow-wrap: anywhere;
}
@media (max-width: 767px) {
  .action-row :deep(.el-button) {
    margin-left: 0;
  }
  .preview-columns {
    display: block;
  }
}
</style>
