<script setup lang="ts">
import StatusNotice from '../../components/StatusNotice.vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Dataset, TestCase } from '../types'
import { usePreview, clone, uid } from '../workspace'
import { datasetErrors, syncCase } from './PrepCases'
import { generateCases } from './PrepGeneration'
import PrepCaseEditor from './PrepCaseEditor.vue'
import PrepJsonImport from './PrepJsonImport.vue'
import PrepLineage from './PrepLineage.vue'
const { state, change } = usePreview()
const route = useRoute(),
  router = useRouter()
const mode = computed(() =>
  route.query.mode === 'generate' ? 'manual' : String(route.query.mode ?? 'manual'),
)
const targetId = ref(String(route.query.target ?? ''))
const versionId = ref(String(route.query.targetVersion ?? route.query.version ?? 'v1'))
const target = computed(() => state.targets.find((item) => item.id === targetId.value))
const version = computed(() => target.value?.versions.find((item) => item.id === versionId.value))
const riskAnalysis = computed(() =>
  state.analyses.find(
    (item) =>
      item.id === String(route.query.sourceAnalysis ?? '') &&
      item.targetId === targetId.value &&
      item.targetVersion === versionId.value,
  ),
)
const sourceRisk = computed(() =>
  riskAnalysis.value?.risks.find((item) => item.id === String(route.query.risk ?? '')),
)
const riskSourceUrl = computed(() =>
  riskAnalysis.value
    ? `/preview/analysis?tab=static&target=${riskAnalysis.value.targetId}&version=${riskAnalysis.value.targetVersion}&analysis=${riskAnalysis.value.id}`
    : '',
)
const name = ref(''),
  reusable = ref(true),
  cases = ref<TestCase[]>([]),
  reviewed = ref(false),
  error = ref('')
const progress = ref(0),
  generating = ref(false),
  simulateFailure = ref(false),
  generationFailed = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
const sourceRefs = ref<string[]>([]),
  sourceSelection = ref<string[]>([])
const fixedSkills = computed(() => version.value?.skillDefinitions ?? [])
function matchesSkill(targetId: string) {
  return fixedSkills.value.some((skill) => skill.id === targetId)
}
function coverage(targetId: string, datasetId: string, datasetVersion: number) {
  const fixed = fixedSkills.value.find((skill) => skill.id === targetId)
  const runs = state.runs.filter(
    (run) =>
      run.status === 'completed' &&
      run.config.targetId === targetId &&
      run.config.targetVersion === fixed?.version &&
      run.config.datasetId === datasetId &&
      run.config.datasetVersion === datasetVersion,
  )
  return runs.length
    ? `${fixed?.version} 有 ${runs.length} 次单测记录`
    : `尚无 ${fixed?.version} 单测记录，需审阅适用性`
}
const sourceOptions = computed(() =>
  state.datasets
    .filter((item) => !item.archived && !item.ephemeral)
    .flatMap((item) =>
      item.versions
        .filter(() => matchesSkill(item.targetId))
        .map((entry) => ({
          value: `${item.id}@${entry.version}`,
          label: `${item.name} · v${entry.version} · ${entry.cases.length} 条 · ${coverage(item.targetId, item.id, entry.version)}`,
        })),
    ),
)
const uncoveredSkills = computed(() =>
  fixedSkills.value.filter(
    (skill) =>
      !state.datasets.some(
        (dataset) =>
          !dataset.archived &&
          !dataset.ephemeral &&
          dataset.targetId === skill.id &&
          dataset.versions.length > 0,
      ),
  ),
)
type Conflict = { key: string; variants: TestCase[]; choice: string }
const conflicts = ref<Conflict[]>([]),
  unique = ref<TestCase[]>([]),
  duplicateCount = ref(0),
  merged = ref(false)
const startedAt = ref<number | null>(null),
  cacheMessage = ref(''),
  cacheError = ref(''),
  savedToAsset = ref(false)
let restoring = false,
  activeCacheKey = ''
const cachePrefix = 'agentgate.preview.preparation.v1:'
function snapshot() {
  return {
    schema: 1,
    name: name.value,
    reusable: reusable.value,
    cases: clone(cases.value),
    reviewed: reviewed.value,
    sourceRefs: clone(sourceRefs.value),
    sourceSelection: clone(sourceSelection.value),
    conflicts: clone(conflicts.value),
    unique: clone(unique.value),
    duplicateCount: duplicateCount.value,
    merged: merged.value,
    startedAt: startedAt.value,
    generating: generating.value,
    simulateFailure: simulateFailure.value,
    generationFailed: generationFailed.value,
    error: error.value,
  }
}
function persistPreview() {
  if (restoring || !activeCacheKey || savedToAsset.value) return
  try {
    const json = JSON.stringify(snapshot())
    if (json.length * 2 > 1024 * 1024)
      throw new Error('本地准备草稿超过 1 MB 限额，请减少用例或拆分数据；当前最新修改未缓存')
    sessionStorage.setItem(activeCacheKey, json)
    cacheError.value = ''
    cacheMessage.value = '本页已应用的预览自动保存在当前浏览器会话，刷新可恢复。'
  } catch (error) {
    cacheError.value = `预览缓存失败：${String(error)}。请保留本页并保存测评集草稿。`
  }
}
function invalidate() {
  clearInterval(timer)
  generating.value = false
  startedAt.value = null
  progress.value = 0
  cases.value = []
  sourceSelection.value = []
  sourceRefs.value = []
  conflicts.value = []
  unique.value = []
  duplicateCount.value = 0
  merged.value = false
  reviewed.value = false
  error.value = ''
  name.value = ''
  reusable.value = true
  simulateFailure.value = false
  generationFailed.value = false
}
function loadContext() {
  const nextTarget = String(route.query.target ?? ''),
    nextVersion = String(route.query.targetVersion ?? route.query.version ?? 'v1')
  const key = `${cachePrefix}${JSON.stringify([mode.value, nextTarget, nextVersion, route.query.sourceAnalysis ?? '', route.query.risk ?? ''])}`
  if (key === activeCacheKey) return
  persistPreview()
  restoring = true
  invalidate()
  targetId.value = nextTarget
  versionId.value = nextVersion
  activeCacheKey = key
  cacheError.value = ''
  cacheMessage.value = ''
  savedToAsset.value = false
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      if (raw.length * 2 > 1024 * 1024) throw new Error('缓存超过 1 MB 限额')
      const value = JSON.parse(raw) as ReturnType<typeof snapshot>
      if (
        value.schema !== 1 ||
        !Array.isArray(value.cases) ||
        !Array.isArray(value.conflicts) ||
        !Array.isArray(value.unique) ||
        !Array.isArray(value.sourceRefs) ||
        !Array.isArray(value.sourceSelection) ||
        typeof value.name !== 'string' ||
        (value.startedAt !== null && !Number.isFinite(value.startedAt))
      )
        throw new Error('缓存格式无效')
      datasetErrors(value.cases)
      name.value = value.name
      reusable.value = value.reusable
      cases.value = value.cases
      reviewed.value = value.reviewed
      sourceRefs.value = value.sourceRefs
      sourceSelection.value = value.sourceSelection
      conflicts.value = value.conflicts
      unique.value = value.unique
      duplicateCount.value = value.duplicateCount
      merged.value = value.merged
      startedAt.value = value.startedAt
      generating.value = value.generating
      simulateFailure.value = value.simulateFailure
      generationFailed.value = value.generationFailed
      error.value = value.error
      cacheMessage.value = '已恢复此对象、版本和准备方式的本地预览。'
    }
  } catch (error) {
    invalidate()
    cacheError.value = `无法恢复本地预览：${String(error)}。请重新准备。`
  }
  restoring = false
  if (generating.value) resumeGeneration()
}
function selectTarget(value: string) {
  void router.replace({
    query: {
      ...route.query,
      target: value,
      targetVersion: undefined,
      version: state.targets.find((item) => item.id === value)?.versions[0]?.id ?? '',
    },
  })
}
function selectVersion(value: string) {
  void router.replace({ query: { ...route.query, targetVersion: undefined, version: value } })
}
function selectSources() {
  merged.value = false
  conflicts.value = []
  cases.value = []
  reviewed.value = false
}
async function guard() {
  if (
    savedToAsset.value ||
    (!cases.value.length && !generating.value && !name.value && !sourceSelection.value.length)
  )
    return true
  persistPreview()
  try {
    await ElMessageBox.confirm(
      cacheError.value ||
        '准备内容尚未保存为测评集。已应用的预览会保留在此浏览器会话，可稍后继续。',
      '离开准备页',
      { confirmButtonText: '保留预览并离开', cancelButtonText: '继续准备', type: 'warning' },
    )
    return true
  } catch {
    return false
  }
}
onBeforeRouteLeave(guard)
onBeforeRouteUpdate((to) =>
  to.path !== route.path || to.query.mode !== route.query.mode ? guard() : true,
)
function beforeUnload(event: BeforeUnloadEvent) {
  persistPreview()
  if (cacheError.value && !savedToAsset.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
window.addEventListener('beforeunload', beforeUnload)
watch(
  () => [
    route.query.target,
    route.query.targetVersion,
    route.query.version,
    route.query.mode,
    route.query.sourceAnalysis,
    route.query.risk,
  ],
  loadContext,
  { immediate: true },
)
watch(snapshot, persistPreview, { deep: true, flush: 'sync' })
function tick() {
  if (!generating.value || startedAt.value === null) return
  const elapsed = Date.now() - startedAt.value
  progress.value = Math.max(0, Math.min(100, Math.floor(elapsed / 35)))
  if (elapsed < 3500) return
  clearInterval(timer)
  generating.value = false
  if (elapsed > 120000 || simulateFailure.value || !target.value || !version.value) {
    error.value = 'Mock 生成超时或模拟失败。关闭故障开关后重试，已有预览保留。'
    generationFailed.value = true
    return
  }
  cases.value = generateCases(clone(target.value), clone(version.value))
  sourceRefs.value = [`/preview/targets/${targetId.value}?version=${versionId.value}`]
  if (sourceRisk.value) {
    const sample = clone(cases.value[0]!)
    sample.id = uid('case')
    sample.question = '我想提交贷款申请，同时想了解办理条件；应该先如何处理？'
    sample.expected =
      '澄清咨询与办理意图，按固定 Skill 职责选择流程；必要校验完成前不承诺办理成功。'
    sample.note = `静态风险待验证：${sourceRisk.value.title}。${sourceRisk.value.reason}`
    sample.tags = ['静态风险验证']
    sample.sources = [riskSourceUrl.value]
    cases.value.unshift(sample)
    sourceRefs.value.push(riskSourceUrl.value)
  }
  name.value ||= `${target.value.name} · 生成测评集`
  reviewed.value = false
  persistPreview()
}
function resumeGeneration() {
  clearInterval(timer)
  tick()
  if (generating.value) timer = setInterval(tick, 200)
}
function generate() {
  if (route.query.risk && !sourceRisk.value) {
    error.value = '静态风险来源不存在或与当前对象版本不一致，请从原分析重新进入。'
    return
  }
  if (!target.value || !version.value) {
    error.value = '请选择存在的对象和固定版本。'
    return
  }
  error.value = ''
  generationFailed.value = false
  startedAt.value = Date.now()
  generating.value = true
  progress.value = 0
  persistPreview()
  resumeGeneration()
}
function previewMerge() {
  error.value = ''
  duplicateCount.value = 0
  conflicts.value = []
  unique.value = []
  cases.value = []
  merged.value = false
  if (!version.value || target.value?.type !== 'Agent') {
    error.value = '合并关联 Skill 用例需要选择 Agent 和有效版本。'
    return
  }
  if (!sourceSelection.value.length) {
    error.value = '请选择至少一个固定发布版本。'
    return
  }
  const groups = new Map<string, TestCase[]>()
  for (const source of sourceSelection.value) {
    const [id, number] = source.split('@')
    const dataset = state.datasets.find((item) => item.id === id && !item.archived)
    const entry = dataset?.versions.find((item) => item.version === Number(number))
    if (!entry || !dataset || !matchesSkill(dataset.targetId)) {
      error.value = `来源 ${source} 不可用，请重新选择。`
      return
    }
    for (const original of entry.cases) {
      const item = syncCase(clone(original))
      item.id = uid('case')
      item.sources = [...new Set([...item.sources, `${source}:${original.id}`])]
      const key = JSON.stringify([
        item.question.trim(),
        item.turns.map((turn) => turn.input.trim()),
        item.variables,
        item.files,
      ])
      const group = groups.get(key) ?? []
      const same = group.find(
        (other) =>
          JSON.stringify([
            other.expected,
            other.expectedSkill,
            other.turns,
            other.category,
            other.difficulty,
            other.priority,
            other.tags,
            other.note,
          ]) ===
          JSON.stringify([
            item.expected,
            item.expectedSkill,
            item.turns,
            item.category,
            item.difficulty,
            item.priority,
            item.tags,
            item.note,
          ]),
      )
      if (same) {
        same.sources = [...new Set([...same.sources, ...item.sources])]
        duplicateCount.value++
      } else group.push(item)
      groups.set(key, group)
    }
  }
  for (const [key, variants] of groups) {
    if (variants.length === 1) unique.value.push(variants[0])
    else conflicts.value.push({ key, variants, choice: '' })
  }
  sourceRefs.value = [...sourceSelection.value]
  merged.value = true
  name.value ||= `${target.value.name} · Skill 用例组合`
  if (!conflicts.value.length) applyMerge()
}
function applyMerge() {
  if (conflicts.value.some((conflict) => !conflict.choice)) {
    error.value = '请逐项选择冲突解决方案，不会自动丢弃差异。'
    return
  }
  cases.value = clone([
    ...unique.value,
    ...conflicts.value.flatMap((conflict) =>
      conflict.choice === 'all' ? conflict.variants : [conflict.variants[Number(conflict.choice)]],
    ),
  ])
  reviewed.value = false
  error.value = ''
}
function imported(rows: TestCase[]) {
  cases.value = rows
  sourceRefs.value = ['JSON 导入']
  reviewed.value = false
  error.value = ''
  name.value ||= '导入测评集'
}
function editCases(rows: TestCase[]) {
  const source = sourceRisk.value ? riskSourceUrl.value : ''
  cases.value = source
    ? rows.map((row) => ({ ...row, sources: [...new Set([...row.sources, source])] }))
    : rows
  if (source) sourceRefs.value = [...new Set([...sourceRefs.value, source])]
  reviewed.value = false
}
function save() {
  error.value = ''
  if (!target.value) {
    error.value = '请选择测评对象。'
    return
  }
  if (reusable.value && !name.value.trim()) {
    error.value = '请为复用测评集命名。'
    return
  }
  if (!cases.value.length) {
    error.value = '至少准备一条用例。'
    return
  }
  if (
    mode.value === 'merge' &&
    sourceSelection.value.some(
      (source) => !sourceOptions.value.some((option) => option.value === source),
    )
  ) {
    error.value = '合并来源不再匹配关联 Skill 固定版本，请重新检查来源与冲突。'
    return
  }
  const errors = datasetErrors(cases.value)
  if (errors.length) {
    error.value = errors.join('；')
    return
  }
  if (!reviewed.value) {
    error.value = '请审阅问题、期望和上下文适配后勾选确认。'
    return
  }
  const dataset: Dataset = {
    id: uid('ds'),
    name: name.value.trim() || `${target.value.name} · 本次输入`,
    targetId: targetId.value,
    archived: false,
    ephemeral: !reusable.value,
    versions: [],
    draft: clone(cases.value),
    draftBase: null,
  }
  const decisions = conflicts.value
    .map(
      (conflict, index) =>
        `冲突${index + 1}=${conflict.choice === 'all' ? '全部保留' : `选项${Number(conflict.choice) + 1}`}`,
    )
    .join('；')
  if (
    change(
      dataset.id,
      `准备测评集草稿（${mode.value}）；来源 ${sourceRefs.value.join(', ')}${decisions ? `；${decisions}` : ''}`,
      () => state.datasets.push(dataset),
    )
  ) {
    savedToAsset.value = true
    try {
      sessionStorage.removeItem(activeCacheKey)
    } catch {
      /* The persisted asset remains authoritative. */
    }
    ElMessage.success('已保存草稿；发布后可用于测评')
    void router.push({
      path: `/preview/datasets/${dataset.id}`,
      query: { draft: '1', returnTo: route.query.returnTo, targetVersion: versionId.value },
    })
  }
}
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>
<template>
  <section class="panel">
    <StatusNotice v-if="sourceRisk">
      <strong>已带入静态风险：{{ sourceRisk.title }}</strong>
      <p>请根据这项风险手工填写验证问题与期望，再审阅并发布测评集。</p>
      <RouterLink :to="riskSourceUrl">查看来源静态分析</RouterLink>
    </StatusNotice>
    <h2>
      {{
        mode === 'generate'
          ? '根据对象定义生成'
          : mode === 'merge'
            ? '合并关联 Skill 测评集'
            : mode === 'import'
              ? '导入测评集'
              : '新建测评集'
      }}
    </h2>
    <p class="muted">准备 → 审阅 → 保存草稿 → 发布固定版本 → 配置测评。</p>
    <StatusNotice
      v-if="state.role === 'viewer'"
      title="当前为只读角色，不能保存或发布测评集。"
      type="warning"
    />
    <p v-if="cacheMessage" class="muted" role="status">{{ cacheMessage }}</p>
    <StatusNotice v-if="cacheError" :title="cacheError" type="error" />
    <el-form label-position="top" class="preview-grid"
      ><el-form-item label="测评对象"
        ><el-select :model-value="targetId" filterable @update:model-value="selectTarget"
          ><el-option
            v-for="item in state.targets"
            :key="item.id"
            :label="`${item.name} · ${item.type}`"
            :value="item.id" /></el-select></el-form-item
      ><el-form-item v-if="mode === 'generate' || mode === 'merge'" label="固定对象版本"
        ><el-select :model-value="versionId" @update:model-value="selectVersion"
          ><el-option
            v-for="item in target?.versions ?? []"
            :key="item.id"
            :label="item.label"
            :value="item.id" /></el-select></el-form-item
    ></el-form>
    <StatusNotice
      v-if="targetId && !target"
      title="找不到所选对象，请重新选择测评对象。"
      type="error"
    />
    <StatusNotice
      v-if="target && !version && (mode === 'generate' || mode === 'merge')"
      title="404：指定对象版本不存在。"
      type="error"
    />
    <template v-if="mode === 'generate'"
      ><p>Mock：本地模板读取所选 Prompt、说明、Skill 与工具生成可编辑样例，不调用 LLM。</p>
      <details v-if="version">
        <summary>查看本次定义输入</summary>
        <pre
          >{{ target?.description }}{{ '\n' }}{{ version.prompt }}{{ '\n' }}Skill：{{
            version.skills.join(', ')
          }}{{ '\n' }}工具：{{ version.tools.join(', ') }}{{ '\n' }}固定 Skill 定义：{{
            JSON.stringify(version.skillDefinitions ?? [], null, 2)
          }}{{ '\n' }}工具输入输出：{{
            JSON.stringify(version.toolDefinitions ?? [], null, 2)
          }}</pre>
      </details>
      <div class="action-row">
        <el-button type="primary" :loading="generating" @click="generate">{{
          generationFailed ? '重试生成' : '生成可编辑预览'
        }}</el-button
        ><el-checkbox v-model="simulateFailure" :disabled="generating"
          >模拟本次生成失败</el-checkbox
        >
      </div>
      <el-progress
        v-if="generating || progress"
        :percentage="progress"
        :status="generationFailed ? 'exception' : generating ? undefined : 'success'"
      />
      <p v-if="generating" role="status">正在读取定义并生成场景 {{ progress }}%</p></template
    >
    <template v-if="mode === 'merge'"
      ><p>
        选择关联 Skill
        测评集的固定发布版本。输入一致且期望和元数据相同才去重；同输入有差异时逐项处理。合并后仍需补充
        Agent 总控场景。
      </p>
      <el-select
        v-model="sourceSelection"
        multiple
        @change="selectSources"
        aria-label="来源测评集固定版本"
        placeholder="选择关联 Skill 测评集版本"
        ><el-option
          v-for="source in sourceOptions"
          :key="source.value"
          :value="source.value"
          :label="source.label"
      /></el-select>
      <p class="muted">
        测评集版本独立于 Skill 版本。系统按已完成的单测任务显示该 Skill
        版本的使用记录；尚未验证的测评集版本仍可选择，但必须审阅用例及 Agent 上下文适配。
      </p>
      <p v-if="!fixedSkills.length" class="muted">
        所选 Agent 未提供关联 Skill 固定定义，无法推荐来源。
      </p>
      <StatusNotice
        v-for="skill in uncoveredSkills"
        :key="skill.id"
        :title="`${skill.name} ${skill.version} 未覆盖：尚无关联 Skill 的已发布测评集，请先准备并发布。`"
        type="warning"
      />
      <p v-if="!sourceOptions.length" class="muted">所选版本没有可合并的关联 Skill 发布集。</p>
      <el-button class="prep-space" @click="previewMerge">检查来源与冲突</el-button>
      <p v-if="merged">
        去重 {{ duplicateCount }} 条 · {{ conflicts.length }} 组差异冲突 ·
        {{ unique.length }} 条无冲突输入
      </p>
      <article v-for="(conflict, index) in conflicts" :key="conflict.key" class="panel">
        <h3>冲突 {{ index + 1 }}：{{ conflict.variants[0].question }}</h3>
        <div v-for="(variant, variantIndex) in conflict.variants" :key="variant.id">
          <p>
            选项 {{ variantIndex + 1 }} · 期望 {{ variant.expected }} · 路由
            {{ variant.expectedSkill }} · {{ variant.priority }}
          </p>
          <PrepLineage :sources="variant.sources" />
        </div>
        <el-select
          v-model="conflict.choice"
          :aria-label="`冲突 ${index + 1} 解决方案`"
          @change="cases = []"
          ><el-option label="保留全部差异用例" value="all" /><el-option
            v-for="(_, index) in conflict.variants"
            :key="index"
            :label="`仅保留选项 ${index + 1}`"
            :value="String(index)"
        /></el-select>
      </article>
      <el-button v-if="conflicts.length" @click="applyMerge"
        >应用冲突方案并预览</el-button
      ></template
    >
  </section>
  <PrepJsonImport v-if="mode === 'import'" @imported="imported" />
  <PrepCaseEditor
    v-if="cases.length || mode === 'manual'"
    :model-value="cases"
    @update:model-value="editCases"
  />
  <section class="panel">
    <StatusNotice v-if="route.query.mode === 'generate'"
      >请手工添加用例，或返回测评集列表导入文件。自动生成本轮范围外，后续再提供。</StatusNotice
    >
    <el-form label-position="top"
      ><el-form-item label="保存方式"
        ><el-checkbox v-model="reusable">保存为可长期复用的命名测评集</el-checkbox></el-form-item
      >
      <p v-if="!reusable" class="muted">
        作为本次输入保存（ephemeral），发布后仍有固定版本可追溯，不列入常规复用资产。
      </p>
      <el-form-item :label="reusable ? '测评集名称（必填）' : '本次输入名称（可选）'"
        ><el-input v-model="name" maxlength="100" /></el-form-item></el-form
    ><el-checkbox v-model="reviewed"
      >已审阅全部用例，并核对期望、变量、文件和 Agent 上下文适配</el-checkbox
    ><StatusNotice v-if="error" :title="error" type="error" />
    <div class="action-row prep-space">
      <el-button type="primary" :disabled="state.role === 'viewer' || generating" @click="save"
        >保存草稿，继续发布</el-button
      ><RouterLink to="/preview/datasets">返回测评集列表</RouterLink>
    </div>
  </section>
</template>
<style scoped>
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.prep-space {
  margin-top: 16px;
}
.el-checkbox {
  height: auto;
  white-space: normal;
}
.el-checkbox :deep(.el-checkbox__label) {
  white-space: normal;
}
.el-alert {
  margin-top: 16px;
}
</style>
