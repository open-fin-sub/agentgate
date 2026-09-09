<script setup lang="ts">
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Dataset, TestCase } from '../types'
import { usePreview, clone, uid, downloadJson } from '../workspace'
import { caseDiff, datasetErrors, previewReturn } from '../components/PrepCases'
import PrepCaseEditor from '../components/PrepCaseEditor.vue'
import PrepDatasetPrepare from '../components/PrepDatasetPrepare.vue'
import PrepLineage from '../components/PrepLineage.vue'
const { state, change } = usePreview()
const route = useRoute(),
  router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const dataset = computed(() => state.datasets.find((item) => item.id === id.value))
const sourceRun = computed(() =>
  state.runs.find((item) => item.id === String(route.query.run ?? '')),
)
const versionNumber = computed(() =>
  Number(
    route.query.version ??
      (sourceRun.value?.config.datasetId === id.value
        ? sourceRun.value.config.datasetVersion
        : dataset.value?.versions.slice(-1)[0]?.version),
  ),
)
const version = computed(() =>
  dataset.value?.versions.find((entry) => entry.version === versionNumber.value),
)
const editing = computed(
  () => route.query.draft === '1' && !!dataset.value && dataset.value.draft !== null,
)
const caseId = computed(() => String(route.query.case ?? ''))
const localCases = ref<TestCase[]>([]),
  saved = ref(''),
  note = ref(''),
  error = ref('')
const dirty = computed(() => editing.value && saved.value !== JSON.stringify(localCases.value))
const readonly = computed(
  () => !editing.value || state.role === 'viewer' || dataset.value?.archived,
)
const query = computed({
  get: () => String(route.query.q ?? ''),
  set: (value: string) => setFilter('q', value),
})
const status = computed({
  get: () => String(route.query.status ?? 'active'),
  set: (value: string) => setFilter('status', value),
})
const targetFilter = computed({
  get: () => String(route.query.target ?? ''),
  set: (value: string) => setFilter('target', value),
})
const page = computed({
  get: () => Math.max(1, Number(route.query.page) || 1),
  set: (value: number) => {
    void router.replace({ query: { ...route.query, page: String(value) } })
  },
})
function setFilter(key: string, value: string) {
  void router.replace({ query: { ...route.query, [key]: value || undefined, page: undefined } })
}
const rows = computed(() =>
  state.datasets.filter(
    (item) =>
      (status.value === 'all' || status.value === 'archived'
        ? status.value === 'all' || item.archived
        : status.value === 'ephemeral'
          ? item.ephemeral && !item.archived
          : !item.archived && !item.ephemeral) &&
      (!targetFilter.value || item.targetId === targetFilter.value) &&
      `${item.name} ${item.id} ${item.versions.flatMap((entry) => entry.cases.flatMap((row) => row.tags)).join(' ')}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)
const visible = computed(() => rows.value.slice((page.value - 1) * 8, page.value * 8))
const base = computed(() =>
  dataset.value?.versions.find(
    (entry) =>
      entry.version === (editing.value ? dataset.value?.draftBase : versionNumber.value - 1),
  ),
)
const diff = computed(() =>
  caseDiff(
    base.value?.cases ?? [],
    editing.value ? localCases.value : (version.value?.cases ?? []),
  ),
)
const sources = computed(() => [
  ...new Set([
    ...(version.value?.sources ?? []),
    ...(editing.value ? localCases.value : (version.value?.cases ?? [])).flatMap(
      (item) => item.sources,
    ),
  ]),
])
const relatedRuns = computed(() =>
  state.runs.filter(
    (run) =>
      run.config.datasetId === id.value &&
      (editing.value
        ? run.config.datasetVersion === dataset.value?.draftBase
        : run.config.datasetVersion === versionNumber.value),
  ),
)
const revisionError = computed(() => {
  if (route.query.run && !sourceRun.value) return '404：来源任务不存在。'
  if (sourceRun.value && sourceRun.value.config.datasetId !== id.value)
    return '来源任务未使用此测评集，不能将修订错误关联。'
  if (
    caseId.value &&
    !(editing.value ? localCases.value : (version.value?.cases ?? [])).some(
      (item) => item.id === caseId.value,
    )
  )
    return '指定用例不在当前版本中，请切换至原报告引用的版本。'
  return ''
})
watch(
  () => [id.value, route.query.draft, route.query.version],
  () => {
    localCases.value = clone(
      editing.value ? (dataset.value?.draft ?? []) : (version.value?.cases ?? []),
    )
    saved.value = JSON.stringify(localCases.value)
    note.value = ''
    error.value = ''
  },
  { immediate: true },
)
async function guard() {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm('本页有尚未保存的用例修改。离开将丢失这些修改。', '离开编辑页', {
      confirmButtonText: '放弃未保存修改',
      cancelButtonText: '继续编辑',
      type: 'warning',
    })
    return true
  } catch {
    return false
  }
}
onBeforeRouteLeave(guard)
onBeforeRouteUpdate((to) =>
  to.params.id !== route.params.id ||
  to.query.version !== route.query.version ||
  to.query.draft !== route.query.draft
    ? guard()
    : true,
)
function draft() {
  const item = dataset.value
  if (!item || item.archived || revisionError.value) return
  if (item.draft !== null) {
    void router.push({ query: { ...route.query, draft: '1' } })
    return
  }
  if (!version.value) return
  const cases = clone(version.value.cases),
    baseVersion = version.value.version
  const source =
    sourceRun.value && caseId.value
      ? `/preview/runs/${sourceRun.value.id}/cases/${caseId.value}`
      : ''
  if (source) {
    const row = cases.find((entry) => entry.id === caseId.value)
    if (row) row.sources = [...new Set([...row.sources, source])]
  }
  if (
    change(item.id, `从 v${baseVersion} 新建修订草稿`, () => {
      item.draft = cases
      item.draftBase = baseVersion
    })
  )
    void router.push({ query: { ...route.query, draft: '1' } })
}
function saveDraft() {
  const item = dataset.value
  if (!item || readonly.value) return false
  error.value = datasetErrors(localCases.value).join('；')
  if (error.value) return false
  if (
    !change(item.id, '保存测评集草稿', () => {
      item.draft = clone(localCases.value)
    })
  )
    return false
  saved.value = JSON.stringify(localCases.value)
  ElMessage.success('草稿已保存')
  return true
}
function publish() {
  const item = dataset.value
  if (!item || readonly.value) return
  error.value = datasetErrors(localCases.value).join('；')
  if (!localCases.value.length) error.value = '空测评集不能发布，请添加至少一条有效用例。'
  if (!note.value.trim()) error.value = '请填写本次发布说明。'
  if (error.value) return
  const number = Math.max(0, ...item.versions.map((entry) => entry.version)) + 1
  const newVersion = {
    version: number,
    cases: clone(localCases.value),
    note: note.value.trim(),
    createdAt: new Date().toISOString(),
    sources: [
      ...new Set([
        ...(item.draftBase ? [`${item.id}@${item.draftBase}`] : []),
        ...localCases.value.flatMap((row) => row.sources),
      ]),
    ],
  }
  if (
    change(
      item.id,
      `发布测评集 v${number}（新增 ${diff.value.added.length} / 修改 ${diff.value.changed.length} / 删除 ${diff.value.removed.length}）`,
      () => {
        item.versions.push(newVersion)
        item.draft = null
        item.draftBase = null
      },
    )
  ) {
    saved.value = JSON.stringify(localCases.value)
    ElMessage.success(`已发布 v${number}，历史版本保持不变`)
    void router.replace({ query: { ...route.query, version: String(number), draft: undefined } })
  }
}
function copy(item: Dataset) {
  const entry = item.id === id.value ? version.value : item.versions[item.versions.length - 1]
  const rows = clone(entry?.cases ?? item.draft ?? [])
  const source = entry ? `${item.id}@${entry.version}` : ''
  if (source)
    rows.forEach((row) => {
      row.sources = [...new Set([...row.sources, source])]
    })
  const next: Dataset = {
    id: uid('ds'),
    name: `${item.name} · 副本`,
    targetId: item.targetId,
    archived: false,
    ephemeral: false,
    versions: [],
    draft: rows,
    draftBase: null,
  }
  if (change(next.id, `复制测评集 ${item.id}`, () => state.datasets.push(next)))
    void router.push({ path: `/preview/datasets/${next.id}`, query: { draft: '1' } })
}
function archive(item: Dataset) {
  change(item.id, item.archived ? '恢复测评集' : '归档测评集（保留历史引用）', () => {
    item.archived = !item.archived
  })
}
function exportVersion() {
  if (dataset.value && version.value)
    downloadJson(`${dataset.value.id}-v${version.value.version}.json`, {
      dataset: dataset.value.name,
      ...clone(version.value),
    })
}
function selectVersion(value: string) {
  void router.push({ query: { ...route.query, version: value, draft: undefined } })
}
function useDataset() {
  if (!dataset.value || !version.value || dataset.value.archived) return
  const returnRoute = router.resolve(previewReturn(route.query.returnTo))
  const destination = ['/preview/runs/new', '/preview/analysis'].includes(returnRoute.path)
    ? returnRoute
    : router.resolve('/preview/runs/new')
  void router.push({
    path: destination.path,
    query: {
      ...destination.query,
      target: dataset.value.targetId,
      version:
        route.query.targetVersion ??
        sourceRun.value?.config.targetVersion ??
        destination.query.version,
      dataset: dataset.value.id,
      datasetVersion: String(version.value.version),
      source: sourceRun.value?.id,
    },
  })
}
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>{{ dataset?.name ?? '测评集' }}</h1>
      <p>审阅输入、发布固定版本，保留每次任务使用的历史内容。</p>
    </div>
    <RouterLink v-if="id || route.query.mode" to="/preview/datasets">返回测评集列表</RouterLink>
  </div>
  <StatusNotice
    v-if="state.role === 'viewer'"
    title="只读角色：可以查看、导出历史版本，不能创建、修改、复制或归档。"
    type="warning"
  />
  <StatusNotice
    v-if="id && !dataset"
    title="404：测评集不存在。请返回列表选择可用记录。"
    type="error"
  />
  <template v-else-if="dataset">
    <StatusNotice
      v-if="dataset.archived"
      title="此测评集已归档，历史版本和报告仍可查看。恢复后才能修改或用于新任务。"
      type="warning"
    />
    <StatusNotice v-if="revisionError" :title="revisionError" type="error" />
    <section class="panel">
      <div class="action-row">
        <el-tag>{{
          editing
            ? `草稿 · 基于 ${dataset.draftBase ? `v${dataset.draftBase}` : '新建'}`
            : `发布版本 v${versionNumber}`
        }}</el-tag
        ><el-tag v-if="dataset.ephemeral" type="info">本次输入</el-tag
        ><el-select
          v-if="dataset.versions.length"
          :model-value="String(versionNumber)"
          aria-label="测评集版本"
          @change="selectVersion"
          ><el-option
            v-for="entry in dataset.versions"
            :key="entry.version"
            :label="`v${entry.version} · ${entry.cases.length} 条 · ${entry.note}`"
            :value="String(entry.version)" /></el-select
        ><RouterLink :to="`/preview/targets/${dataset.targetId}`">查看测评对象</RouterLink>
      </div>
      <p v-if="!editing" class="muted">
        已发布版本只读。{{ version?.note }} · {{ version?.createdAt }}
      </p>
      <p v-else class="muted">
        修改先应用到本页，再保存草稿或发布。{{
          dirty ? '当前有未保存修改。' : '本页内容与已保存草稿一致。'
        }}
      </p>
      <div class="action-row">
        <el-button
          v-if="!editing"
          :disabled="state.role === 'viewer' || dataset.archived || !!revisionError"
          @click="draft"
          >{{
            dataset.draft !== null
              ? '继续编辑已有草稿'
              : sourceRun
                ? '从报告修订用例'
                : '新建修订草稿'
          }}</el-button
        ><el-button :disabled="state.role === 'viewer'" @click="copy(dataset)">复制测评集</el-button
        ><el-popconfirm
          :title="
            dataset.archived ? '恢复此测评集？' : '归档后不能用于新任务，历史记录保留。继续？'
          "
          @confirm="archive(dataset)"
          ><template #reference
            ><el-button :disabled="state.role === 'viewer'">{{
              dataset.archived ? '恢复测评集' : '归档测评集'
            }}</el-button></template
          ></el-popconfirm
        ><el-button v-if="version && !editing" @click="exportVersion">导出此版本 JSON</el-button
        ><el-button
          v-if="version && !editing"
          type="primary"
          :disabled="dataset.archived"
          @click="useDataset"
          >{{ route.query.returnTo ? '使用此版本并返回' : '用于测评' }}</el-button
        >
      </div>
      <p v-if="sourceRun">
        <RouterLink
          :to="
            previewReturn(
              route.query.returnTo,
              `/preview/runs/${sourceRun.id}${caseId ? `/cases/${caseId}` : ''}`,
            )
          "
          >返回原报告证据</RouterLink
        >
        · 原任务仍引用 v{{ sourceRun.config.datasetVersion }}，发布不会改变原报告。
      </p>
    </section>
    <StatusNotice
      v-if="!editing && !version"
      title="404：指定发布版本不存在；可选择已有版本或继续编辑草稿。"
      type="error"
    />
    <PrepCaseEditor
      v-if="editing || version"
      v-model="localCases"
      :readonly="readonly"
      :focus-id="caseId"
    />
    <section v-if="editing || version" class="panel">
      <h2>版本变化摘要</h2>
      <p>
        相对 {{ base ? `v${base.version}` : '空测评集' }}：新增 {{ diff.added.length }} · 修改
        {{ diff.changed.length }} · 删除 {{ diff.removed.length }}
      </p>
      <details v-if="diff.added.length || diff.changed.length || diff.removed.length">
        <summary>查看增删改用例</summary>
        <p v-for="entry in diff.added" :key="`add-${entry.id}`">
          新增 · {{ entry.id }} · {{ entry.question }}
        </p>
        <p v-for="entry in diff.changed" :key="`change-${entry.id}`">
          修改 · {{ entry.id }} · {{ entry.question }}
        </p>
        <p v-for="entry in diff.removed" :key="`remove-${entry.id}`">
          删除 · {{ entry.id }} · {{ entry.question }}
        </p>
      </details>
      <template v-if="editing"
        ><el-form label-position="top"
          ><el-form-item label="发布说明（必填）"
            ><el-input
              v-model="note"
              :disabled="readonly"
              type="textarea"
              placeholder="说明修订原因及主要变化" /></el-form-item></el-form
        ><StatusNotice v-if="error" :title="error" type="error" />
        <div class="action-row prep-space">
          <el-button :disabled="readonly" @click="saveDraft">保存草稿</el-button
          ><el-button type="primary" :disabled="readonly" @click="publish">发布新版本</el-button>
        </div></template
      >
    </section>
    <div class="preview-columns">
      <section class="panel">
        <h2>一跳来源关系</h2>
        <PrepLineage :sources="sources" />
      </section>
      <section class="panel">
        <h2>相关任务</h2>
        <EmptyState v-if="!relatedRuns.length" title="此版本还没有关联任务" description="可使用已发布版本创建测评；草稿请先审阅并发布。" />
        <p v-for="run in relatedRuns" :key="run.id">
          <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink> · {{ run.status }}
        </p>
      </section>
    </div>
  </template>
  <PrepDatasetPrepare v-else-if="route.query.mode" :key="String(route.query.mode)" />
  <template v-else
    ><section class="panel">
      <div class="action-row">
        <RouterLink class="ag-button primary" to="/preview/datasets?mode=manual"
          >新建测评集</RouterLink
        ><RouterLink class="ag-button" to="/preview/datasets?mode=merge">合并 Skill 用例</RouterLink
        ><RouterLink class="ag-button" to="/preview/datasets?mode=import"
          >导入 JSON / Excel</RouterLink
        >
      </div>
      <div class="preview-grid prep-space">
        <el-input
          v-model="query"
          aria-label="搜索测评集"
          placeholder="搜索名称、ID 或标签"
          clearable
        /><el-select v-model="status" aria-label="测评集状态"
          ><el-option label="可复用资产" value="active" /><el-option
            label="已归档"
            value="archived" /><el-option label="本次输入" value="ephemeral" /><el-option
            label="全部"
            value="all" /></el-select
        ><el-select
          v-model="targetFilter"
          aria-label="测评对象筛选"
          placeholder="全部对象"
          clearable
          ><el-option
            v-for="item in state.targets"
            :key="item.id"
            :label="item.name"
            :value="item.id"
        /></el-select>
      </div>
    </section>
    <EmptyState
      v-if="!visible.length"
      title="没有匹配的测评集"
      description="调整筛选，或手工创建、导入测评集，准备测评输入。"
    ></EmptyState>
    <article v-for="item in visible" :key="item.id" class="panel">
      <div class="action-row">
        <h2>
          <RouterLink
            :to="{
              path: `/preview/datasets/${item.id}`,
              query: item.versions.length ? {} : { draft: '1' },
            }"
            >{{ item.name }}</RouterLink
          >
        </h2>
        <el-tag v-if="item.archived" type="info">已归档</el-tag
        ><el-tag v-if="item.draft !== null">有草稿</el-tag
        ><el-tag v-if="item.ephemeral" type="info">本次输入</el-tag>
      </div>
      <p class="muted">
        {{ state.targets.find((target) => target.id === item.targetId)?.name ?? '对象不可用' }} ·
        {{ item.versions.length }} 个发布版本 ·
        {{ item.versions[item.versions.length - 1]?.cases.length ?? item.draft?.length ?? 0 }}
        条用例
      </p>
      <div class="action-row">
        <RouterLink
          :to="{
            path: `/preview/datasets/${item.id}`,
            query: item.versions.length ? {} : { draft: '1' },
          }"
          >查看用例与版本</RouterLink
        ><el-button :disabled="state.role === 'viewer'" @click="copy(item)">复制</el-button
        ><el-popconfirm
          :title="item.archived ? '恢复此测评集？' : '归档后保留历史引用，继续？'"
          @confirm="archive(item)"
          ><template #reference
            ><el-button :disabled="state.role === 'viewer'">{{
              item.archived ? '恢复' : '归档'
            }}</el-button></template
          ></el-popconfirm
        >
      </div>
    </article>
    <el-pagination
      v-model:current-page="page"
      :total="rows.length"
      :page-size="8"
      layout="prev, pager, next"
      :pager-count="5"
  /></template>
</template>
<style scoped>
.prep-space {
  margin-top: 18px;
}
h2 {
  overflow-wrap: anywhere;
}
.el-alert {
  margin-bottom: 16px;
}
.el-select {
  max-width: 100%;
}
.action-row > .el-select {
  width: 320px;
}
</style>
