<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import TaskBackLink from '../../components/TaskBackLink.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import FormSection from '../../components/FormSection.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePreview, clone, uid } from '../workspace'
import { buildRun } from '../execution'
import type { ExecutionConfig } from '../types'
import { queryText, validateConfig } from '../components/RunSupport'

const { state, change } = usePreview()
const route = useRoute()
const router = useRouter()
const draftKey = 'agentgate-preview-run-draft-v1'
const name = ref('新测评任务')
const sourceRunId = ref<string | null>(null)
const originError = ref('')
const feedback = ref('')
const submitting = ref(false)
const submittedId = ref('')
const templateId = ref('')
const templateName = ref('')
const scheduled = ref(false)
const localTime = ref('')
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
function defaults(): ExecutionConfig {
  const target = state.targets.find((item) => item.id === 'agent-service') ?? state.targets[0]
  const dataset = state.datasets.find((item) => item.id === 'ds-service') ?? state.datasets[0]
  const resource =
    state.credentials.find((item) => item.id === 'public-model') ?? state.credentials[0]
  return {
    targetId: target?.id ?? '',
    targetVersion: target?.versions[0]?.id ?? '',
    datasetId: dataset?.id ?? '',
    datasetVersion: dataset?.versions[0]?.version ?? 1,
    evaluatorRefs: state.evaluators
      .slice(0, 1)
      .map((item) => ({ id: item.id, version: item.versions[0]?.version ?? 1 })),
    concurrency: 2,
    timeout: 60,
    retries: 1,
    sampling: 100,
    caseIds: dataset?.versions[0]?.cases.map((item) => item.id) ?? [],
    resourceId: resource?.id ?? '',
    executionResourceId: resource?.id ?? '',
    scoringResourceId: resource?.id ?? '',
    resourcePurpose: 'both',
    model: resource?.model ?? '',
    scheduledAt: null,
    fault: 'none',
    threshold: 0.8,
  }
}
const config = reactive<ExecutionConfig>(defaults())
function assignConfig(value: ExecutionConfig) {
  Object.assign(config, clone(value), {
    executionResourceId: value.executionResourceId ?? value.resourceId,
    scoringResourceId: value.scoringResourceId ?? value.resourceId,
  })
}
const target = computed(() => state.targets.find((item) => item.id === config.targetId))
const dataset = computed(() => state.datasets.find((item) => item.id === config.datasetId))
const input = computed(() =>
  dataset.value?.versions.find((item) => item.version === config.datasetVersion),
)
const resource = computed(() => state.credentials.find((item) => item.id === config.resourceId))
const scoringResource = computed(() =>
  state.credentials.find((item) => item.id === config.scoringResourceId),
)
const errors = computed(() => [
  ...(originError.value ? [originError.value] : []),
  ...validateConfig(state, config),
  ...(scheduled.value && !localTime.value ? ['请选择预约日期和时间。'] : []),
  ...(!name.value.trim() ? ['请填写任务名称。'] : []),
])
const readonly = computed(() => state.role === 'viewer')
const evaluatorKeys = computed({
  get: () => config.evaluatorRefs.map((item) => `${item.id}@${item.version}`),
  set: (keys: string[]) => {
    config.evaluatorRefs = keys.map((key) => {
      const split = key.lastIndexOf('@')
      return { id: key.slice(0, split), version: Number(key.slice(split + 1)) }
    })
  },
})
const evaluatorOptions = computed(() =>
  state.evaluators.flatMap((item) =>
    item.versions.map((version) => ({
      key: `${item.id}@${version.version}`,
      label: `${item.name}（版本：${version.version}）`,
      name: item.name,
      version: version.version,
      kind: { rule: '规则评估器', llm: '大模型评分评估器', composite: '复合评估器' }[version.kind],
      disabled: item.archived,
    })),
  ),
)
const changes = computed(() => {
  const original = state.runs.find((item) => item.id === sourceRunId.value)
  if (!original) return []
  const labels: Record<keyof ExecutionConfig, string> = {
    targetId: '测评对象',
    targetVersion: '对象版本',
    datasetId: '测评集',
    datasetVersion: '输入版本',
    evaluatorRefs: '评估器版本',
    concurrency: '并发',
    timeout: '超时',
    retries: '重试',
    sampling: '采样率',
    caseIds: '固定样本',
    resourceId: '执行资源',
    executionResourceId: '对象执行资源',
    scoringResourceId: '大模型评分资源',
    resourcePurpose: '资源用途',
    model: '模型',
    scheduledAt: '预约时间',
    fault: '故障模拟',
    threshold: '质量门槛',
  }
  return (Object.keys(config) as (keyof ExecutionConfig)[])
    .filter((key) => JSON.stringify(original.config[key]) !== JSON.stringify(config[key]))
    .map((key) => labels[key])
})
function sample() {
  const cases = input.value?.cases ?? []
  config.caseIds = cases
    .slice(0, Math.max(1, Math.ceil((cases.length * config.sampling) / 100)))
    .map((item) => item.id)
}
function changeDataset() {
  config.datasetVersion = dataset.value?.versions.slice(-1)[0]?.version ?? 1
  sample()
}
function changeTarget() {
  config.targetVersion = target.value?.versions.find((item) => item.executable)?.id ?? ''
  originError.value = ''
}
function changeResource() {
  config.resourceId = config.executionResourceId ?? ''
  config.resourcePurpose = 'both'
  config.model = resource.value?.model ?? ''
}
function setSchedule() {
  const date = new Date(localTime.value)
  config.scheduledAt =
    scheduled.value && Number.isFinite(date.getTime()) ? date.toISOString() : null
}
function setLocalTime() {
  scheduled.value = Boolean(config.scheduledAt)
  if (config.scheduledAt) {
    const date = new Date(config.scheduledAt)
    localTime.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  } else localTime.value = ''
}
function initialize() {
  originError.value = ''
  feedback.value = ''
  sourceRunId.value = null
  templateId.value = ''
  submittedId.value = ''
  Object.assign(config, defaults())
  if (queryText(route.query, 'draft') === '1') {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null')
      if (
        saved?.config &&
        Array.isArray(saved.config.caseIds) &&
        Array.isArray(saved.config.evaluatorRefs)
      ) {
        assignConfig(saved.config)
        name.value = String(saved.name ?? '新测评任务')
        sourceRunId.value = saved.sourceRunId ?? null
      }
    } catch {
      feedback.value = '浏览器草稿无法读取，请重新核对配置。'
    }
  } else if (route.query.source) {
    const original = state.runs.find((item) => item.id === queryText(route.query, 'source'))
    if (original) {
      assignConfig({ ...original.config, scheduledAt: null })
      name.value = `${original.name} · 复验`
      sourceRunId.value = original.id
    } else originError.value = '历史来源不存在或无权访问，无法复用该配置。'
  }
  if (route.query.template) {
    templateId.value = queryText(route.query, 'template')
    loadTemplate()
  }
  if (route.query.target) config.targetId = queryText(route.query, 'target')
  if (route.query.version || route.query.targetVersion)
    config.targetVersion = queryText(
      route.query,
      route.query.targetVersion ? 'targetVersion' : 'version',
    )
  const oldDataset = config.datasetId
  const oldVersion = config.datasetVersion
  if (route.query.dataset) config.datasetId = queryText(route.query, 'dataset')
  if (route.query.datasetVersion)
    config.datasetVersion = Number(queryText(route.query, 'datasetVersion'))
  else if (oldDataset !== config.datasetId)
    config.datasetVersion = dataset.value?.versions.slice(-1)[0]?.version ?? 1
  if (oldDataset !== config.datasetId || oldVersion !== config.datasetVersion) sample()
  if (route.query.caseIds)
    config.caseIds = queryText(route.query, 'caseIds').split(',').filter(Boolean)
  config.executionResourceId = config.executionResourceId || config.resourceId
  config.scoringResourceId = config.scoringResourceId || config.resourceId
  setLocalTime()
}
function loadTemplate() {
  const template = state.templates.find((item) => item.id === templateId.value)
  if (!template) {
    if (templateId.value) originError.value = '配置模板不存在，请重新选择。'
    return
  }
  Object.assign(config, clone(template.config), {
    scheduledAt: null,
    executionResourceId: template.config.executionResourceId ?? template.config.resourceId,
    scoringResourceId: template.config.scoringResourceId ?? template.config.resourceId,
  })
  name.value = `${template.name} · 测评`
  sourceRunId.value = null
  originError.value = ''
  setLocalTime()
  feedback.value = '模板已带入固定版本和样本。失效引用会阻止提交。'
}
function saveTemplate() {
  const issues = validateConfig(state, { ...config, scheduledAt: null })
  if (!templateName.value.trim() || issues.length) {
    feedback.value = issues[0] ?? '请填写模板名称。'
    return
  }
  const ok = change('运行模板', `保存模板 ${templateName.value.trim()}`, () => {
    const template = {
      id: uid('template'),
      name: templateName.value.trim(),
      config: clone({ ...config, scheduledAt: null }),
    }
    state.templates.push(template)
    templateId.value = template.id
  })
  if (ok) {
    feedback.value = '模板已保存，可从模板选择器复用；预约时间每次单独指定。'
    ElMessage.success('模板已保存')
  }
}
function saveDraft() {
  return change('运行草稿', '保存当前配置到浏览器会话', () => {
    sessionStorage.setItem(
      draftKey,
      JSON.stringify({ name: name.value, config: clone(config), sourceRunId: sourceRunId.value }),
    )
  })
}
function prepare(mode: 'manual' | 'merge') {
  if (!saveDraft()) return
  const returnTo = router.resolve({
    path: '/preview/runs/new',
    query: { draft: '1', origin: route.query.origin },
  }).href
  void router.push({
    path: '/preview/datasets',
    query: { mode, target: config.targetId, targetVersion: config.targetVersion, returnTo },
  })
}
function storeDraft() {
  if (saveDraft()) feedback.value = '草稿已保存到当前浏览器会话；从“恢复草稿”继续。'
}
async function submit() {
  if (submitting.value || submittedId.value) return
  const issues = errors.value
  if (issues.length) {
    feedback.value = issues.join(' ')
    return
  }
  submitting.value = true
  try {
    let id = ''
    const ok = change(name.value.trim(), '创建测评运行', () => {
      const currentErrors = validateConfig(state, config)
      if (currentErrors.length) throw new Error(currentErrors.join(' '))
      const run = buildRun(state, clone(config), name.value.trim(), sourceRunId.value)
      state.runs.push(run)
      id = run.id
    })
    if (!ok) {
      feedback.value = '没有创建任务，请查看权限或工作区存储冲突提示。'
      return
    }
    submittedId.value = id
    await router.push(`/preview/runs/${encodeURIComponent(id)}`)
  } catch (error) {
    feedback.value = `提交失败：${String(error)}`
  } finally {
    submitting.value = false
  }
}
watch(() => route.fullPath, initialize, { immediate: true })
</script>

<template>
  <TaskBackLink
    :fallback="sourceRunId ? `/preview/runs/${encodeURIComponent(sourceRunId)}` : '/preview/runs'"
    :label="sourceRunId ? '返回来源报告' : '返回任务列表'"
  />
  <div class="page-intro">
    <div>
      <h1>创建测评</h1>
      <p>固定对象、输入和评分标准，提交可追溯的本地 Mock 运行。</p>
    </div>
  </div>
  <StatusNotice type="warning" v-if="readonly">
    当前为只读角色，无权创建任务、保存模板或草稿。可查看配置并在资源管理中切换体验角色。
  </StatusNotice>
  <StatusNotice v-if="feedback">{{ feedback }}</StatusNotice>
  <StatusNotice v-if="sourceRunId">
    来源：<RouterLink :to="`/preview/runs/${sourceRunId}`">{{ sourceRunId }}</RouterLink
    >。已沿用完整配置和固定样本；本次变更：{{ changes.join('、') || '无' }}。
  </StatusNotice>
  <form @submit.prevent="submit">
    <section class="panel">
      <div class="panel-title">
        <h2>名称与配置复用</h2>
        <RouterLink to="/preview/runs/new?draft=1">恢复草稿</RouterLink>
      </div>
      <div class="preview-form form-grid">
        <label class="field"
          >任务名称<el-input v-model="name" maxlength="100" aria-label="任务名称"
        /></label>
        <label class="field"
          >配置模板<el-select
            v-model="templateId"
            clearable
            placeholder="选择已有模板"
            aria-label="配置模板"
            @change="loadTemplate"
            ><el-option
              v-for="item in state.templates"
              :key="item.id"
              :label="item.name"
              :value="item.id" /></el-select
        ></label>
      </div>
    </section>
    <section class="panel">
      <h2>1. 测评对象与固定版本</h2>
      <div class="preview-form form-grid">
        <label class="field"
          >测评对象<el-select v-model="config.targetId" aria-label="测评对象" @change="changeTarget"
            ><el-option
              v-for="item in state.targets"
              :key="item.id"
              :value="item.id"
              :label="item.name"
              ><EntityRef :name="item.name" :type="item.type" compact /></el-option></el-select
        ></label>
        <label class="field"
          >对象版本<el-select v-model="config.targetVersion" aria-label="对象版本"
            ><el-option
              v-for="item in target?.versions ?? []"
              :key="item.id"
              :value="item.id"
              :label="item.label"
              ><EntityRef
                :name="item.label"
                :type="target?.type ?? '测评对象'"
                :version="item.id"
                compact /><MetadataGroup
                :items="[{ label: '可执行', value: item.executable }]" /></el-option></el-select
        ></label>
      </div>
      <p class="muted small">{{ target?.description }}</p>
      <MetadataGroup
        :items="[
          { label: '所属平台', value: target?.platform },
          { label: '对象形态', value: target?.form },
        ]"
      />
    </section>
    <section class="panel">
      <div class="panel-title">
        <h2>2. 固定测评输入</h2>
        <div class="action-row">
          <el-button :disabled="readonly || !target" @click="prepare('manual')"
            >手工创建测评集</el-button
          ><el-button v-if="target?.type === 'Agent'" :disabled="readonly" @click="prepare('merge')"
            >合并关联 Skill 用例</el-button
          >
        </div>
      </div>
      <div class="preview-form form-grid">
        <label class="field"
          >测评集<el-select v-model="config.datasetId" aria-label="测评集" @change="changeDataset"
            ><el-option
              v-for="item in state.datasets"
              :key="item.id"
              :value="item.id"
              :label="`${item.name}${item.archived ? '（已归档）' : ''}`"
              :disabled="item.archived" /></el-select
        ></label>
        <label class="field"
          >固定发布版本<el-select
            v-model="config.datasetVersion"
            aria-label="固定发布版本"
            @change="sample"
            ><el-option
              v-for="item in dataset?.versions ?? []"
              :key="item.version"
              :value="item.version"
              :label="`版本 ${item.version}`"
              ><EntityRef
                :name="dataset?.name ?? ''"
                type="测评集"
                :version="item.version"
                compact /><MetadataGroup
                :items="[{ label: '用例数', value: item.cases.length }]" /></el-option></el-select
          ><span class="hint">只使用已发布版本；预约执行不会追随最新版本。</span></label
        >
      </div>
      <FormSection
        title="样本范围"
        optional
        description="默认使用全部用例；需要抽样或指定用例时再修改。"
      >
        <div class="preview-form form-grid">
          <label class="field"
            >采样率（%）<el-input-number
              v-model="config.sampling"
              :min="1"
              :max="100"
              aria-label="采样率"
              @change="sample"
            /><span class="hint"
              >按发布顺序取前 N 条，固定 ID 可复现；可在下面调整范围。</span
            ></label
          >
          <label class="field"
            >固定样本（已选 {{ config.caseIds.length }} / {{ input?.cases.length ?? 0 }}）<el-select
              v-model="config.caseIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              aria-label="固定样本"
              ><el-option
                v-for="item in input?.cases ?? []"
                :key="item.id"
                :value="item.id"
                :label="item.question"
                ><EntityRef :name="item.question" type="用例" compact /><MetadataGroup
                  :items="[
                    { label: '分类', value: item.category },
                    { label: '难度', value: item.difficulty },
                  ]" /></el-option></el-select
          ></label>
        </div>
      </FormSection>
      <details>
        <summary>查看实际样本 ID 与输入来源</summary>
        <p class="run-wrap">{{ config.caseIds.join('、') || '尚未选择' }}</p>
        <MetadataGroup
          :items="[
            { label: '发布说明', value: input?.note || '无' },
            { label: '来源记录', value: input?.sources.join('、') || '无' },
          ]"
        />
      </details>
    </section>
    <section class="panel">
      <h2>3. 评估器与资源用途</h2>
      <label class="field"
        >评估器固定版本<el-select
          v-model="evaluatorKeys"
          multiple
          aria-label="评估器固定版本"
          placeholder="至少选择一个评估器"
          ><el-option
            v-for="item in evaluatorOptions"
            :key="item.key"
            :value="item.key"
            :label="item.label"
            :disabled="item.disabled"
            ><EntityRef
              :name="item.name"
              :type="item.kind"
              :version="item.version"
              compact /></el-option></el-select
      ></label>
      <div class="preview-form form-grid run-spacing">
        <label class="field"
          >对象执行资源<el-select
            v-model="config.executionResourceId"
            aria-label="对象执行资源"
            @change="changeResource"
            ><el-option
              v-for="item in state.credentials"
              :key="item.id"
              :value="item.id"
              :label="item.name"
              ><EntityRef
                :name="item.name"
                :type="item.kind === 'public' ? '公共资源' : '私有资源'"
                compact /><MetadataGroup
                :items="[
                  { label: '可用', value: item.enabled && item.healthy },
                ]" /></el-option></el-select
          ><span class="hint">执行模型：{{ config.model || '缺失' }}（由资源确定）</span></label
        >
        <label class="field"
          >大模型评分资源<el-select v-model="config.scoringResourceId" aria-label="大模型评分资源"
            ><el-option
              v-for="item in state.credentials"
              :key="item.id"
              :value="item.id"
              :label="item.name"
              ><EntityRef
                :name="item.name"
                :type="item.kind === 'public' ? '公共资源' : '私有资源'"
                compact /><MetadataGroup
                :items="[
                  { label: '可用', value: item.enabled && item.healthy },
                ]" /></el-option></el-select
          ><span class="hint"
            >评分模型：{{ scoringResource?.model || '缺失' }}。用于所选标准中的 大模型评分。</span
          ></label
        >
        <label class="field"
          >质量分数门槛（0～1）<el-input-number
            v-model="config.threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :precision="2"
            aria-label="质量分数门槛"
        /></label>
      </div>
      <p class="muted small">
        可混合公共与私有资源。公共并发（示例容量
        {{
          state.publicConcurrency
        }}）只约束用到公共资源的阶段；私有阶段仍可能等待执行容量。这里仅选择虚构资源别名，不接收密钥或调用真实模型。
      </p>
      <RouterLink to="/preview/resources">查看资源状态与权限 →</RouterLink>
    </section>
    <section class="panel">
      <FormSection
        title="执行参数与预约"
        optional
        description="默认立即入队。需要调整并发、超时、重试或预约时再展开。"
      >
        <div class="preview-form form-grid">
          <label class="field"
            >并发数<el-input-number
              v-model="config.concurrency"
              :min="1"
              :max="32"
              aria-label="并发数"
          /></label>
          <label class="field"
            >单条超时（秒）<el-input-number
              v-model="config.timeout"
              :min="1"
              :max="3600"
              aria-label="单条超时"
          /></label>
          <label class="field"
            >自动重试次数<el-input-number
              v-model="config.retries"
              :min="0"
              :max="5"
              aria-label="自动重试次数"
          /></label>
          <label class="field"
            >Mock 故障场景<el-select v-model="config.fault" aria-label="故障场景"
              ><el-option value="none" label="正常执行" /><el-option
                value="infrastructure"
                label="基础设施中断" /><el-option
                value="missing-trace"
                label="执行轨迹缺失" /><el-option
                value="missing-usage"
                label="Token 用量未采集" /></el-select
          ></label>
          <div class="field">
            <el-checkbox v-model="scheduled" @change="setSchedule">预约入队</el-checkbox
            ><label v-if="scheduled" class="field"
              >预约日期和时间<el-date-picker
                v-model="localTime"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm"
                format="YYYY-MM-DD HH:mm"
                aria-label="预约日期和时间"
                @change="setSchedule"
            /></label>
            <p class="muted small">
              时区：{{ timezone }}。到达预约时间后入队，开始时间受资源容量影响。
            </p>
          </div>
        </div>
      </FormSection>
    </section>
    <section class="panel">
      <h2>提交摘要</h2>
      <div class="entity-group">
        <EntityRef
          :name="target?.name ?? ''"
          :type="target?.type ?? '测评对象'"
          :version="config.targetVersion"
          compact
        />
        <EntityRef
          :name="dataset?.name ?? ''"
          type="测评集"
          :version="config.datasetVersion"
          compact
        />
      </div>
      <MetadataGroup
        :items="[
          { label: '固定用例数', value: config.caseIds.length },
          { label: '评估器数', value: config.evaluatorRefs.length },
          { label: '执行资源', value: resource?.name },
          { label: '评分资源', value: scoringResource?.name },
          { label: '入队方式', value: scheduled ? `预约 ${localTime}（${timezone}）` : '立即入队' },
        ]"
      />
      <StatusNotice type="warning" v-if="errors.length" aria-label="配置校验"
        ><ul>
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul></StatusNotice
      >
      <div class="action-row">
        <el-button
          type="primary"
          native-type="submit"
          :loading="submitting"
          :disabled="readonly || !!errors.length || !!submittedId"
          >提交测评</el-button
        ><el-button :disabled="readonly" @click="storeDraft">保存草稿</el-button
        ><RouterLink v-if="submittedId" :to="`/preview/runs/${submittedId}`"
          >打开已创建任务</RouterLink
        >
      </div>
      <div class="action-row run-spacing">
        <el-input
          v-model="templateName"
          class="template-name"
          placeholder="模板名称"
          aria-label="模板名称"
          maxlength="80"
        /><el-button :disabled="readonly || !templateName.trim()" @click="saveTemplate"
          >保存为模板</el-button
        >
      </div>
    </section>
  </form>
</template>

<style scoped>
.field :deep(.el-select),
.field :deep(.el-input) {
  display: block;
  width: 100%;
  margin-top: 8px;
}
.field :deep(.el-input-number) {
  margin-top: 8px;
  max-width: 100%;
}
.run-spacing {
  margin-top: 20px;
}
.template-name {
  max-width: 300px;
}
.run-wrap {
  overflow-wrap: anywhere;
}
@media (max-width: 767px) {
  .action-row :deep(.el-button) {
    margin-left: 0;
  }
}
</style>
