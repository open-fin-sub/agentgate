<script setup lang="ts">
import TaskBackLink from '../components/TaskBackLink.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { catalogLabel } from '../catalogLabels'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type DatasetOption, type EvaluatorOption, type Version } from '../api/client'
import { datasetApi } from '../api/datasets'
import { runsApi } from '../api/runs'
import type { DatasetVersion } from '../types/dataset'
import { metricLabel } from '../metricLabels'
const route = useRoute(),
  router = useRouter()
const targets = ref<Version[]>([]),
  datasets = ref<DatasetOption[]>([]),
  evaluators = ref<EvaluatorOption[]>([]),
  versions = ref<DatasetVersion[]>([])
const target = ref(''),
  datasetId = ref(''),
  datasetVersion = ref<number | null>(null),
  selected = ref<string[]>([])
const loading = ref(true),
  versionLoading = ref(false),
  submitting = ref(false),
  error = ref(''),
  versionError = ref(''),
  reuseIssue = ref(''),
  ready = ref(false)
let alive = true,
  versionRequest = 0
const chosen = computed(() => versions.value.find((v) => v.version === datasetVersion.value))
const canSubmit = computed(
  () =>
    !loading.value &&
    !versionLoading.value &&
    !submitting.value &&
    !reuseIssue.value &&
    targets.value.some((t) => t.id === target.value) &&
    chosen.value &&
    selected.value.length &&
    selected.value.every((id) => evaluators.value.some((e) => e.id === id)),
)
function store() {
  if (!ready.value) return
  try {
    sessionStorage.setItem(
      'ag-evaluation-draft',
      JSON.stringify({
        target: target.value,
        datasetId: datasetId.value,
        datasetVersion: datasetVersion.value,
        selected: selected.value,
      }),
    )
  } catch {
    /* Optional browser draft storage. */
  }
}
async function loadVersions(id: string, preferred: number | null = null) {
  const current = ++versionRequest
  versionLoading.value = true
  versionError.value = ''
  versions.value = []
  datasetVersion.value = null
  try {
    if (id) {
      const all = await datasetApi.versions(id)
      if (!alive || current !== versionRequest) return
      versions.value = all.filter((v) => v.status === 'published')
      datasetVersion.value =
        preferred !== null
          ? (versions.value.find((v) => v.version === preferred)?.version ?? null)
          : (versions.value[0]?.version ?? null)
      if (preferred !== null && datasetVersion.value === null)
        versionError.value = `所需 v${preferred} 不可用，请明确选择其他发布版本。`
    }
  } catch (e) {
    if (alive && current === versionRequest) versionError.value = userError(e)
  } finally {
    if (alive && current === versionRequest) {
      versionLoading.value = false
      store()
    }
  }
}
async function initialize() {
  loading.value = true
  error.value = ''
  try {
    const [ts, ds, es] = await Promise.all([api.versions(), api.datasets(), api.evaluators()])
    if (!alive) return
    targets.value = ts
    datasets.value = ds
    evaluators.value = es
    let saved: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(sessionStorage.getItem('ag-evaluation-draft') ?? '{}')
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed
    } catch {
      /* Ignore an invalid browser draft. */
    }
    target.value = String((route.query.resume === '1' ? saved.target : route.query.target) ?? saved.target ?? ts[0]?.id ?? '')
    datasetId.value = String(
      route.query.dataset ?? saved.datasetId ?? ds.find((d) => d.version !== null)?.id ?? '',
    )
    selected.value = Array.isArray(saved.selected)
      ? saved.selected.filter(
          (id): id is string => typeof id === 'string' && es.some((e) => e.id === id),
        )
      : []
    if (route.query.resume === '1' && !Array.isArray(saved.selected))
      reuseIssue.value = '原填写内容未能恢复，请重新核对配置并选择评分标准。'
    let preferred = route.query.version
      ? Number(route.query.version)
      : (!route.query.dataset || route.query.dataset === saved.datasetId) &&
          typeof saved.datasetVersion === 'number'
        ? saved.datasetVersion
        : null
    if (route.query.source && route.query.resume !== '1') {
      const report = await api.report(String(route.query.source))
      if (!alive) return
      target.value = String(
        route.query.target ?? report.run.manifest.target.ref.external_version_id,
      )
      datasetId.value = String(route.query.dataset ?? report.run.manifest.dataset.dataset_id)
      preferred = route.query.version
        ? Number(route.query.version)
        : report.run.manifest.dataset.version
      const specs = report.run.manifest.evaluator_specs.filter((e) =>
        report.run.manifest.primary_evaluator_ids.includes(e.id),
      )
      selected.value = specs
        .filter((old) =>
          es.some(
            (e) =>
              e.id === old.id &&
              e.version === old.version &&
              e.content_sha256 === old.content_sha256,
          ),
        )
        .map((e) => e.id)
      if (selected.value.length !== specs.length)
        reuseIssue.value =
          '部分历史评分标准与当前目录不同，无法直接沿用。请改为按当前标准重新配置。'
    }
    ready.value = true
    await loadVersions(datasetId.value, preferred)
  } catch (e) {
    if (alive) error.value = userError(e)
  } finally {
    if (alive) loading.value = false
  }
}
function changeDataset() {
  loadVersions(datasetId.value)
}
function resetStandards() {
  reuseIssue.value = ''
  selected.value = []
}
async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    const run = await runsApi.launch({
      version: target.value,
      datasetId: datasetId.value,
      datasetVersion: datasetVersion.value!,
      evaluatorIds: [...selected.value],
    })
    await router.push(`/runs/${run.run_id}`)
  } catch (e) {
    error.value = `提交未完成：${userError(e)}。请先查看任务列表核实是否已创建，再决定是否重试。`
  } finally {
    submitting.value = false
  }
}
watch([target, datasetVersion, selected], store, { deep: true })
onMounted(initialize)
onUnmounted(() => {
  alive = false
  versionRequest++
})
</script>
<template>
  <TaskBackLink :fallback="route.query.source ? `/runs/${encodeURIComponent(String(route.query.source))}` : '/runs'" :label="route.query.source ? '返回来源报告' : '返回任务列表'" />
  <div class="page-intro">
    <div>
      <h1>创建测评</h1>
      <p>选择对象、固定输入和评分标准，直接提交一次测评。</p>
    </div>
  </div>
  <StatusNotice type="warning">
    当前执行对象为内置信贷 Agent 演示接入，结果由真实执行产生。<RouterLink to="/capabilities"
      >查看完整接入范围</RouterLink
    >
  </StatusNotice>
  <StatusNotice v-if="route.query.source">
    已带入原报告的对象、测评集和可用评分标准。请核对版本与执行设置后提交新测评。
  </StatusNotice>
  <StatusNotice type="error" v-if="error">
    {{ error }} <button v-if="!ready" class="text-button" @click="initialize">重新加载</button>
  </StatusNotice>
  <div v-if="loading" class="skeleton">正在读取可用对象和测评配置…</div>
  <form v-else-if="ready" @submit.prevent="submit">
    <section class="panel">
      <h2>测评对象与输入</h2>
      <div class="form-grid">
        <label class="field"
          >对象版本<select v-model="target" aria-label="对象版本" required>
            <option value="" disabled>请选择对象版本</option>
            <option v-for="item in targets" :key="item.id" :value="item.id">
              {{ catalogLabel(item.label) }} · {{ item.id }}
            </option>
          </select></label
        ><label class="field"
          >测评集<select v-model="datasetId" aria-label="测评集" required @change="changeDataset">
            <option value="" disabled>请选择测评集</option>
            <option v-for="item in datasets" :key="item.id" :value="item.id">
              {{ catalogLabel(item.name) }}{{ item.version === null ? '（尚未发布）' : '' }}
            </option>
          </select></label
        ><label class="field"
          >固定发布版本<select
            v-model="datasetVersion"
            aria-label="固定发布版本"
            :disabled="versionLoading"
            required
          >
            <option :value="null" disabled>
              {{ versionLoading ? '正在读取版本…' : '请选择已发布版本' }}
            </option>
            <option v-for="item in versions" :key="item.id" :value="item.version">
              v{{ item.version }} · {{ item.cases.length }} 条用例
            </option></select
          ><span class="hint">草稿不能执行，任务不会随“最新版本”变化。</span></label
        >
        <div>
          <span class="muted small">需要补充或修正用例？</span>
          <div class="action-row">
            <RouterLink
              :to="{
                path: '/datasets',
                query: { dataset: datasetId, version: datasetVersion, returnTo: 'create', source: route.query.source, creationOrigin: route.query.origin },
              }"
              >编辑测评集并返回 →</RouterLink
            >
          </div>
        </div>
      </div>
      <StatusNotice type="error" v-if="versionError">
        {{ versionError }}
        <button type="button" class="text-button" @click="loadVersions(datasetId)">
          重新加载发布版本
        </button>
      </StatusNotice>
    </section>
    <section class="panel">
      <div class="panel-title">
        <h2>
          评分标准 <span class="muted small">已选 {{ selected.length }} 项</span>
        </h2>
        <RouterLink to="/evaluators">查看可用评分标准</RouterLink>
      </div>
      <StatusNotice type="warning" v-if="reuseIssue">
        {{ reuseIssue }}
        <button type="button" class="text-button" @click="resetStandards">
          按当前标准重新配置
        </button>
      </StatusNotice>
      <div class="toolbar">
        <button
          type="button"
          class="ag-button"
          @click="selected = evaluators.filter((e) => e.kind === 'rule').map((e) => e.id)"
        >
          选择全部规则标准</button
        ><button
          type="button"
          class="text-button"
          :disabled="!selected.length"
          @click="selected = []"
        >
          清空选择</button
        ><span class="muted small">按用例中的预期执行；缺少适用预期的标准可能返回“不适用”。</span>
      </div>
      <div class="form-grid">
        <label v-for="item in evaluators" :key="item.id" class="checkbox-card"
          ><input v-model="selected" type="checkbox" :value="item.id" /><span
            ><b>{{ catalogLabel(item.name) }}</b
            ><span class="muted small" style="display: block"
              >v{{ item.version }} · {{ metricLabel(item.dimension) }} ·
              {{ { rule: '规则', llm_judge: 'LLM 评分', hybrid: '复合' }[item.kind] }} ·
              {{ item.severity === 'blocking' ? '阻断项' : '标准项' }}</span
            ></span
          ></label
        >
      </div>
      <p v-if="!selected.length" class="muted small">至少选择一个适用于本次输入的评估器。</p>
      <StatusNotice
        v-if="evaluators.some((item) => item.kind === 'llm_judge' && selected.includes(item.id))"
      >
        已选择 LLM 评分。同一输入的评分可能存在差异，完成后可在用例报告查看评分理由与调用记录。
      </StatusNotice>
    </section>
    <section class="panel">
      <details>
        <summary>执行说明</summary>
        <p>
          提交后立即入队，具体开始时间取决于执行容量。执行设置沿用当前环境的默认值；需要调整时请联系管理员。
        </p>
        <p class="muted small">
          未提交配置会暂存在当前浏览器会话。关闭浏览器前请完成提交，或记录需要保留的选择。
        </p>
      </details>
      <div class="detail-row">
        <span>本次执行范围</span
        ><strong
          >{{ chosen?.cases.length ?? '—' }} 条用例 × 1 个对象版本 ·
          {{ selected.length }} 个评估器</strong
        >
      </div>
      <div class="action-row">
        <button class="ag-button primary" type="submit" :disabled="!canSubmit">
          {{ submitting ? '正在提交…' : '提交测评' }}</button
        ><RouterLink to="/runs">返回任务列表</RouterLink>
      </div>
    </section>
  </form>
</template>
