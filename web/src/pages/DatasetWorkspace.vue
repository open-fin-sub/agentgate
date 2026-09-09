<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '../api/client'
import { datasetApi } from '../api/datasets'
import DatasetList from '../components/dataset/DatasetList.vue'
import VersionSelector from '../components/dataset/VersionSelector.vue'
import CaseTable from '../components/dataset/CaseTable.vue'
import CaseEditor from '../components/dataset/CaseEditor.vue'
import type {
  DatasetExport,
  DatasetSummary,
  DatasetVersion,
  EvaluationCase,
  ValidationIssue,
} from '../types/dataset'

const route = useRoute()
const dirty = ref(false)
const loadError = ref('')
const copySourceId = ref('')
const pickerOpen = ref(false)
const caseView = ref<'list' | 'editor'>('list')
let datasetRequest = 0

const datasets = shallowRef<DatasetSummary[]>([])
const versions = shallowRef<DatasetVersion[]>([])
const activeDatasetId = ref('')
const activeVersionId = ref('')
const activeCaseId = ref('')
const editedCase = ref<EvaluationCase | null>(null)
const busy = ref(false)
const loading = ref(false)
const validationIssues = ref<ValidationIssue[]>([])
const datasetDialog = ref(false)
const dialogMode = ref<'create' | 'copy'>('create')
const dialogName = ref('')
const dialogDescription = ref('')
const importInput = ref<HTMLInputElement | null>(null)
const importIssues = ref<{ sheet?: string; row?: number; column?: string; message: string }[]>([])
const importError = ref('')
const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

const activeVersion = computed<DatasetVersion | null>(
  () => versions.value.find((item) => item.id === activeVersionId.value) ?? null,
)
const editable = computed(() => activeVersion.value?.status === 'draft')
const publishedVersions = computed(() =>
  versions.value.filter((item) => item.status === 'published'),
)
const activeDataset = computed(
  () => datasets.value.find((item) => item.id === activeDatasetId.value) ?? null,
)
const createLink = computed(() => ({
  path: '/runs/new',
  query: {
    dataset: activeDatasetId.value,
    version: activeVersion.value?.version ?? undefined,
    source: typeof route.query.source === 'string' ? route.query.source : undefined,
  },
}))
const evidenceLink = computed(() => ({
  path: `/runs/${route.query.source}/cases/${route.query.case}`,
  query: {
    evaluator: route.query.evaluator,
    outcome: route.query.outcome,
    dimension: route.query.dimension,
    q: route.query.q,
    fromStatus: route.query.fromStatus,
    fromQuery: route.query.fromQuery,
  },
}))
const returnCreateLink = computed(() =>
  activeVersion.value?.status === 'published'
    ? createLink.value
    : {
        path: '/runs/new',
        query: { source: route.query.source },
      },
)
async function allowDiscard(): Promise<boolean> {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm(
      '当前用例有未保存的修改。离开将放弃这些修改，请先保存或确认放弃。',
      '未保存的用例',
      { confirmButtonText: '放弃修改并继续', cancelButtonText: '继续编辑', type: 'warning' },
    )
    dirty.value = false
    return true
  } catch {
    return false
  }
}
onBeforeRouteLeave(allowDiscard)
onBeforeRouteUpdate(async (to) => {
  if (!(await allowDiscard())) return false
  await loadRoute(to.query)
})
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
const activeCaseIssues = computed(() => {
  const caseIndex =
    activeVersion.value?.cases.findIndex((item) => item.id === activeCaseId.value) ?? -1
  if (caseIndex < 0) return []
  const prefix = `cases[${caseIndex}]`
  return validationIssues.value.filter((issue) => issue.path.startsWith(prefix))
})

function chooseVersion(preferredId = '') {
  const selected =
    versions.value.find((item) => item.id === preferredId) ??
    versions.value.find((item) => item.status === 'draft') ??
    publishedVersions.value[0] ??
    null
  activeVersionId.value = selected?.id ?? ''
  selectFirstCase(selected)
}

function selectFirstCase(version: DatasetVersion | null) {
  const selected =
    version?.cases.find((item) => item.id === activeCaseId.value) ?? version?.cases[0] ?? null
  activeCaseId.value = selected?.id ?? ''
  editedCase.value = selected ? cloneJson(selected) : null
}

async function loadDatasets(preferredDatasetId = activeDatasetId.value) {
  datasets.value = await datasetApi.list()
  const selected =
    datasets.value.find((item) => item.id === preferredDatasetId) ?? datasets.value[0]
  if (selected) await selectDataset(selected.id)
  else {
    activeDatasetId.value = ''
    versions.value = []
    chooseVersion()
  }
}

async function selectDataset(datasetId: string, preferredVersionId = '') {
  if (!(await allowDiscard())) return
  const current = ++datasetRequest
  loading.value = true
  try {
    const detail = await datasetApi.detail(datasetId)
    if (current !== datasetRequest) return
    activeDatasetId.value = datasetId
    versions.value = detail.versions
    chooseVersion(preferredVersionId)
    pickerOpen.value = false
    caseView.value = 'list'
    loadError.value = ''
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法读取测评集'
  } finally {
    if (current === datasetRequest) loading.value = false
  }
}

async function selectVersion(version: DatasetVersion) {
  if (!(await allowDiscard())) return
  activeVersionId.value = version.id
  validationIssues.value = []
  selectFirstCase(version)
}

async function selectCase(item: EvaluationCase) {
  if (!(await allowDiscard())) return
  activeCaseId.value = item.id
  editedCase.value = cloneJson(item)
  caseView.value = 'editor'
}

function newCase(): EvaluationCase {
  return {
    id: crypto.randomUUID(),
    name: '新用例',
    category: 'positive',
    difficulty: 'medium',
    tags: [],
    notes: '',
    initial_state: {},
    turns: [
      {
        id: crypto.randomUUID(),
        input: { skill: 'loan_approval' },
        expectations: [{ id: crypto.randomUUID(), name: null, kind: 'skill_route', condition: { kind: 'equals', expected: 'loan_approval' } }],
        notes: '',
      },
    ],
  }
}

async function addCase() {
  if (!(await allowDiscard())) return
  const item = newCase()
  activeCaseId.value = item.id
  editedCase.value = item
  caseView.value = 'editor'
  dirty.value = true
  validationIssues.value = []
}

async function refreshAfterMutation(version: DatasetVersion, caseId = activeCaseId.value) {
  dirty.value = false
  datasets.value = await datasetApi.list()
  versions.value = await datasetApi.versions(activeDatasetId.value)
  activeVersionId.value = version.id
  activeCaseId.value = caseId
  const current = versions.value.find((item) => item.id === version.id) ?? version
  const selected = current.cases.find((item) => item.id === caseId) ?? current.cases[0] ?? null
  editedCase.value = selected ? cloneJson(selected) : null
}

async function saveCase(item: EvaluationCase) {
  if (!activeDatasetId.value || !editable.value) return
  busy.value = true
  try {
    const exists = activeVersion.value?.cases.some((entry) => entry.id === item.id) ?? false
    const version = exists
      ? await datasetApi.updateCase(activeDatasetId.value, item)
      : await datasetApi.addCase(activeDatasetId.value, item)
    await refreshAfterMutation(version, item.id)
    validationIssues.value = []
    ElMessage.success('用例已保存到草稿')
  } catch (error) {
    showError(error, '保存用例失败')
  } finally {
    busy.value = false
  }
}

async function copyCase(item: EvaluationCase) {
  if (!editable.value) return
  if (dirty.value) return ElMessage.warning('请先保存当前用例，再复制。')
  const version = await datasetApi.copyCase(activeDatasetId.value, item.id)
  const copied = version.cases.find(
    (entry) => !activeVersion.value?.cases.some((old) => old.id === entry.id),
  )
  await refreshAfterMutation(version, copied?.id)
  ElMessage.success('已复制用例')
}

async function removeCase(item: EvaluationCase) {
  if (dirty.value) return ElMessage.warning('请先保存当前用例，再删除。')
  await ElMessageBox.confirm(`删除草稿中的“${item.name}”？已发布版本不会受影响。`, '删除用例', {
    type: 'warning',
  })
  const version = await datasetApi.removeCase(activeDatasetId.value, item.id)
  activeCaseId.value = ''
  await refreshAfterMutation(version)
  ElMessage.success('用例已从草稿移除')
}

async function reorderCases(ids: string[]) {
  if (dirty.value) return ElMessage.warning('请先保存当前用例，再调整顺序。')
  const version = await datasetApi.reorderCases(activeDatasetId.value, ids)
  await refreshAfterMutation(version)
}

function openCreate() {
  dialogMode.value = 'create'
  dialogName.value = ''
  dialogDescription.value = ''
  datasetDialog.value = true
}

function openCopy(item: DatasetSummary) {
  copySourceId.value = item.id
  dialogMode.value = 'copy'
  dialogName.value = `${item.name}（副本）`
  dialogDescription.value = item.description
  datasetDialog.value = true
}

async function submitDatasetDialog() {
  if (!dialogName.value.trim()) return ElMessage.warning('请输入测评集名称')
  if (!(await allowDiscard())) return
  busy.value = true
  try {
    const result =
      dialogMode.value === 'create'
        ? await datasetApi.create(dialogName.value, dialogDescription.value)
        : await datasetApi.copy(
            copySourceId.value,
            dialogName.value,
            copySourceId.value === activeDatasetId.value &&
              activeVersion.value?.status === 'published'
              ? activeVersion.value.version
              : undefined,
          )
    datasetDialog.value = false
    await loadDatasets(result.dataset.id)
    ElMessage.success(dialogMode.value === 'create' ? '测评集已创建' : '测评集已复制')
  } catch (error) {
    showError(error, '操作失败')
  } finally {
    busy.value = false
  }
}

async function archiveDataset(item: DatasetSummary) {
  if (!(await allowDiscard())) return
  await ElMessageBox.confirm(`归档“${item.name}”？历史版本和运行记录仍可读取。`, '归档测评集', {
    type: 'warning',
  })
  await datasetApi.archive(item.id)
  await loadDatasets('')
  ElMessage.success('测评集已归档')
}

async function createDraft(base: number | null) {
  busy.value = true
  try {
    const draft = await datasetApi.createDraft(activeDatasetId.value, base)
    await selectDataset(activeDatasetId.value, draft.id)
    caseView.value = 'editor'
    ElMessage.success('新版本草稿已创建')
  } catch (error) {
    showError(error, '创建草稿失败')
  } finally {
    busy.value = false
  }
}

async function discardDraft() {
  await ElMessageBox.confirm('放弃当前草稿？草稿中的修改将无法恢复。', '放弃草稿', {
    type: 'warning',
  })
  await datasetApi.discardDraft(activeDatasetId.value)
  dirty.value = false
  await selectDataset(activeDatasetId.value)
  ElMessage.success('草稿已放弃')
}

async function publishDraft() {
  if (dirty.value) return ElMessage.warning('请先保存当前用例，再验证并发布测评集。')
  busy.value = true
  validationIssues.value = []
  try {
    const published = await datasetApi.publish(activeDatasetId.value)
    await selectDataset(activeDatasetId.value, published.id)
    datasets.value = await datasetApi.list()
    ElMessage.success(`已发布 v${published.version}`)
  } catch (error) {
    if (error instanceof ApiError && Array.isArray(error.detail)) {
      validationIssues.value = error.detail as ValidationIssue[]
    } else if (
      error instanceof ApiError &&
      error.status === 422 &&
      error.detail === 'published DatasetVersion requires at least one Case'
    ) {
      validationIssues.value = [{ path: 'cases', message: '测评集至少需要一个用例' }]
    }
    showError(error, '发布失败，请检查用例')
  } finally {
    busy.value = false
  }
}

async function exportVersion(version: number) {
  const payload = await datasetApi.exportVersion(activeDatasetId.value, version)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${activeDataset.value?.name ?? 'dataset'}-v${version}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function openImport() {
  importInput.value?.click()
}

async function exportExcel(version: number) {
  try {
    const blob = await datasetApi.exportExcel(activeDatasetId.value, version)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeDataset.value?.name ?? 'dataset'}-v${version}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    showError(error, '导出 Excel 失败')
  }
}

async function importDataset(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importIssues.value = []
  importError.value = ''
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('文件超过 10 MiB，请拆分后导入。')
    if (!(await allowDiscard())) return
    let result
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      const { value } = await ElMessageBox.prompt(
        'Excel 将导入为新测评集的草稿。请确认名称，检查用例后再发布。',
        '导入 Excel',
        {
          inputValue: file.name.replace(/\.xlsx$/i, ''),
          inputValidator: (value) => !!value?.trim() || '请输入名称',
          confirmButtonText: '导入',
          cancelButtonText: '取消',
        },
      )
      result = await datasetApi.importExcel(file, value.trim())
    } else result = await datasetApi.importDataset(JSON.parse(await file.text()) as DatasetExport)
    await loadDatasets(result.dataset.id)
    ElMessage.success('测评集已导入')
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    if (
      error instanceof ApiError &&
      typeof error.detail === 'object' &&
      error.detail &&
      'issues' in error.detail &&
      Array.isArray(error.detail.issues)
    ) {
      importIssues.value = error.detail.issues
      importError.value = '文件校验未通过，请按工作表、行和列修正后重新导入。'
    } else importError.value = error instanceof Error ? error.message : '导入失败'
  } finally {
    input.value = ''
  }
}

function showError(error: unknown, fallback: string) {
  ElMessage.error(error instanceof Error ? error.message : fallback)
}

async function performAction(action: () => Promise<unknown>) {
  if (busy.value) return
  busy.value = true
  try {
    await action()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error, '操作未完成，请重试')
  } finally {
    busy.value = false
  }
}

async function loadRoute(query = route.query) {
  loading.value = true
  try {
    datasets.value = await datasetApi.list()
    const datasetId = typeof query.dataset === 'string' ? query.dataset : datasets.value[0]?.id
    if (datasetId) {
      const detail = await datasetApi.detail(datasetId)
      activeDatasetId.value = datasetId
      versions.value = detail.versions
      const requested = query.version
        ? detail.versions.find((v) => v.version === Number(query.version))
        : null
      if (query.version && !requested) throw new Error('指定的测评集版本不存在，未切换为其他版本。')
      activeCaseId.value = typeof query.case === 'string' ? query.case : ''
      chooseVersion(requested?.id)
      caseView.value = query.case ? 'editor' : 'list'
      if (query.case && !activeVersion.value?.cases.some((c) => c.id === query.case))
        throw new Error('指定版本中没有这个用例。')
    }
    loadError.value = ''
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法加载测评集'
    activeVersionId.value = ''
    editedCase.value = null
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  loadRoute()
})
</script>

<template>
  <section class="dataset-workspace" aria-labelledby="dataset-workspace-title">
    <RouterLink
      v-if="route.query.returnTo === 'evidence' && route.query.source && route.query.case"
      class="back-link"
      :to="evidenceLink"
      >← 返回原任务的用例证据</RouterLink
    >
    <RouterLink
      v-else-if="route.query.returnTo === 'create'"
      class="back-link"
      :to="returnCreateLink"
      >←
      {{
        activeVersion?.status === 'published'
          ? '带此版本返回测评配置'
          : '返回原测评配置（不使用草稿）'
      }}</RouterLink
    >
    <div class="workspace-heading">
      <div>
        <span class="step">DATASET WORKSPACE</span>
        <h1 id="dataset-workspace-title">测评集与用例管理</h1>
        <p>维护输入与预期，保存草稿后发布固定版本，用于可追溯的测评。</p>
      </div>
      <div v-if="activeDataset" class="workspace-status">
        <b>{{ activeDataset.name }}</b>
        <span>{{
          activeVersion?.status === 'draft' ? '编辑草稿' : `查看 v${activeVersion?.version ?? '—'}`
        }}</span>
      </div>
    </div>
    <div v-if="loadError" class="notice error" role="alert">
      {{ loadError }} <button class="text-button" @click="loadRoute()">重新加载</button>
    </div>
    <div v-if="activeVersion?.status === 'published'" class="notice">
      已发布版本只读。修订时先创建草稿；如果已有草稿，请先检查其基于的版本，再继续编辑。
    </div>
    <div v-if="dirty" class="notice warning" role="status">
      当前用例有未保存的修改。请点击“保存用例”后再发布。
    </div>

    <div class="dataset-context-bar">
      <div>
        <strong>{{ activeDataset?.name ?? '请选择测评集' }}</strong
        ><small
          >{{
            activeVersion?.status === 'draft'
              ? '当前草稿'
              : `发布版本 v${activeVersion?.version ?? '—'}`
          }}
          · {{ activeVersion?.cases.length ?? 0 }} 条用例</small
        >
      </div>
      <div class="action-row">
        <button
          class="ag-button"
          :aria-expanded="pickerOpen"
          aria-controls="dataset-picker"
          @click="pickerOpen = !pickerOpen"
        >
          {{ pickerOpen ? '收起测评集列表' : '切换测评集' }}</button
        ><button class="ag-button" @click="openImport">导入测评集</button
        ><button class="ag-button" data-testid="create-dataset" @click="openCreate">
          新建测评集
        </button>
      </div>
    </div>
    <section v-if="pickerOpen || !datasets.length" id="dataset-picker" class="dataset-picker">
      <DatasetList
        :items="datasets"
        :selected-id="activeDatasetId"
        :loading="loading"
        @select="selectDataset"
        @create="openCreate"
        @copy="openCopy"
        @archive="performAction(() => archiveDataset($event))"
        @import="openImport"
      />
    </section>

    <div v-if="importError" class="notice error" role="alert">
      {{ importError }}
      <ul v-if="importIssues.length">
        <li v-for="(issue, index) in importIssues" :key="index">
          {{ issue.sheet ?? '工作表' }} · 第 {{ issue.row ?? '—' }} 行 ·
          {{ issue.column ?? '—' }} 列：{{ issue.message }}
        </li>
      </ul>
    </div>
    <VersionSelector
      v-if="activeDatasetId"
      :versions="versions"
      :active-id="activeVersionId"
      :busy="busy"
      @select="selectVersion"
      @create-draft="createDraft"
      @publish="publishDraft"
      @discard="performAction(discardDraft)"
      @export="performAction(() => exportVersion($event))"
      @export-excel="exportExcel"
    />

    <el-alert
      v-if="validationIssues.length"
      class="validation-alert"
      title="草稿尚不能发布"
      type="error"
      :closable="false"
      show-icon
    >
      <ul>
        <li v-for="issue in validationIssues" :key="`${issue.path}-${issue.message}`">
          <code>{{ issue.path }}</code
          >：{{ issue.message }}
        </li>
      </ul>
    </el-alert>

    <div class="dataset-view-switch local-tabs" aria-label="用例工作区">
      <button :class="{ active: caseView === 'list' }" @click="caseView = 'list'">
        用例列表 · {{ activeVersion?.cases.length ?? 0 }}</button
      ><button
        :class="{ active: caseView === 'editor' }"
        :disabled="!editedCase"
        @click="caseView = 'editor'"
      >
        {{ editable ? '编辑用例' : '用例详情' }}{{ dirty ? ' · 未保存' : '' }}
      </button>
    </div>
    <div class="dataset-layout" :data-view="caseView" v-loading="loading">
      <CaseTable
        :items="activeVersion?.cases ?? []"
        :selected-id="activeCaseId"
        :editable="editable"
        @select="selectCase"
        @add="addCase"
        @copy="performAction(() => copyCase($event))"
        @remove="performAction(() => removeCase($event))"
        @reorder="performAction(() => reorderCases($event))"
      />
      <CaseEditor
        :item="editedCase"
        :editable="editable"
        :saving="busy"
        :validation-issues="activeCaseIssues"
        @save="saveCase"
        @dirty="dirty = $event"
      />
    </div>

    <div v-if="activeDatasetId" class="dataset-run-bar">
      <div>
        <b>将此测评集用于测评</b>
        <span v-if="activeVersion?.status === 'published'"
          >v{{ activeVersion.version }} · {{ activeVersion.cases.length }} 个用例 · 内容
          {{ activeVersion.content_sha256.slice(0, 10) }}</span
        >
        <span v-else>草稿不能运行，请先验证并发布。</span>
      </div>
      <RouterLink
        v-if="activeVersion?.status === 'published'"
        class="ag-button primary"
        :to="createLink"
        data-testid="run-dataset-version"
        >用于测评</RouterLink
      >
      <span v-else class="muted">保存并发布后可继续配置测评对象和评分标准。</span>
      <RouterLink
        v-if="activeVersion?.status === 'published'"
        class="ag-button"
        :to="{
          path: '/lineage',
          query: {
            kind: 'dataset',
            id: activeDatasetId,
            version: activeVersion.version,
            returnTo: `/datasets?dataset=${encodeURIComponent(activeDatasetId)}&version=${activeVersion.version}`,
          },
        }"
        >此发布版本的关联任务</RouterLink
      >
    </div>

    <input
      ref="importInput"
      class="hidden-file-input"
      type="file"
      accept="application/json,.json,.xlsx"
      aria-label="选择 JSON 或 Excel 测评集文件"
      @change="importDataset"
    />

    <el-dialog
      v-model="datasetDialog"
      :title="dialogMode === 'create' ? '新建测评集' : '复制测评集'"
      width="min(460px, 92vw)"
    >
      <el-form label-position="top">
        <el-form-item label="名称"
          ><el-input v-model="dialogName" data-testid="dataset-name"
        /></el-form-item>
        <el-form-item v-if="dialogMode === 'create'" label="描述"
          ><el-input v-model="dialogDescription" type="textarea" :rows="3"
        /></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="datasetDialog = false">取消</el-button
        ><el-button
          type="primary"
          :loading="busy"
          data-testid="submit-dataset"
          @click="submitDatasetDialog"
          >确认</el-button
        ></template
      >
    </el-dialog>
  </section>
</template>
