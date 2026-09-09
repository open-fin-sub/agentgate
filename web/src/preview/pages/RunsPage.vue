<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import EmptyState from '../../components/EmptyState.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview } from '../workspace'
import {
  percent,
  retryScopeLabels,
  queryText,
  runMetrics,
  statuses,
  statusLabels,
  formatTime,
} from '../components/RunSupport'
import RunProgress from '../components/RunProgress.vue'
const { state } = usePreview()
const route = useRoute()
const router = useRouter()
const filters = reactive({ q: '', status: '', target: '' })
const page = ref(1)
const pageSize = 8
const selected = ref<string[]>([])
const filtered = computed(() =>
  state.runs
    .filter(
      (run) =>
        (!filters.q ||
          `${run.name} ${run.id} ${run.target.name}`
            .toLowerCase()
            .includes(filters.q.toLowerCase())) &&
        (!filters.status || run.status === filters.status) &&
        (!filters.target || run.config.targetId === filters.target),
    )
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const currentPage = computed(() => Math.min(page.value, pageCount.value))
const rows = computed(() =>
  filtered.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize),
)
const finishedRows = computed(() => rows.value.filter((run) => run.status === 'completed'))
const allSelected = computed(
  () =>
    !!finishedRows.value.length &&
    finishedRows.value.every((run) => selected.value.includes(run.id)),
)
const selectedRuns = computed(() => state.runs.filter((run) => selected.value.includes(run.id)))
const compareIssue = computed(() =>
  selectedRuns.value.length < 2
    ? '至少选择两次已完成运行。'
    : selectedRuns.value.some((run) => run.status !== 'completed')
      ? '选择中包含未完成运行，请取消勾选。'
      : new Set(selectedRuns.value.map((run) => run.config.targetId)).size !== 1
        ? '请选择同一个 Agent 或 Skill 的历史运行。'
        : '',
)
function readQuery() {
  filters.q = queryText(route.query, 'q')
  filters.status = queryText(route.query, 'status')
  filters.target = queryText(route.query, 'target')
  page.value = Math.max(1, Number(queryText(route.query, 'page')) || 1)
  selected.value = queryText(route.query, 'selected')
    .split(',')
    .filter((id) => state.runs.some((run) => run.id === id))
}
function sync(reset = true) {
  if (reset) page.value = 1
  void router.replace({
    path: '/preview/runs',
    query: {
      q: filters.q || undefined,
      status: filters.status || undefined,
      target: filters.target || undefined,
      page: page.value > 1 ? String(page.value) : undefined,
      selected: selected.value.join(',') || undefined,
    },
  })
}
function filterChanged() {
  sync()
}
function pageChanged(value: number) {
  page.value = value
  sync(false)
}
function selectionChanged() {
  sync(false)
}
function togglePage() {
  selected.value = allSelected.value
    ? selected.value.filter((id) => !finishedRows.value.some((run) => run.id === id))
    : [...new Set([...selected.value, ...finishedRows.value.map((run) => run.id)])]
  sync(false)
}
function clearFilters() {
  Object.assign(filters, { q: '', status: '', target: '' })
  sync()
}
function clearSelection() {
  selected.value = []
  sync(false)
}
function compare() {
  if (!compareIssue.value)
    void router.push({
      path: '/preview/comparisons',
      query: { mode: 'historical', runs: selectedRuns.value.map((run) => run.id).join(',') },
    })
}
watch(() => route.fullPath, readQuery, { immediate: true })
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>测评任务</h1>
      <p>从固定配置追踪执行进度，完成后直接查看质量报告与证据。</p>
    </div>
    <RouterLink class="ag-button primary" to="/preview/runs/new">创建测评</RouterLink>
  </div>
  <section class="panel">
    <form class="toolbar" @submit.prevent="filterChanged">
      <label class="field"
        >搜索任务<el-input
          v-model="filters.q"
          clearable
          placeholder="名称、运行 ID 或对象"
          aria-label="搜索任务"
          @change="filterChanged"
      /></label>
      <label class="field"
        >任务状态<el-select
          v-model="filters.status"
          clearable
          placeholder="全部状态"
          aria-label="任务状态"
          @change="filterChanged"
          ><el-option
            v-for="status in statuses"
            :key="status"
            :value="status"
            :label="statusLabels[status]" /></el-select
      ></label>
      <label class="field"
        >测评对象<el-select
          v-model="filters.target"
          clearable
          placeholder="全部对象"
          aria-label="筛选测评对象"
          @change="filterChanged"
          ><el-option
            v-for="target in state.targets"
            :key="target.id"
            :value="target.id"
            :label="target.name" /></el-select
      ></label>
      <el-button @click="clearFilters">清除筛选</el-button>
    </form>
    <div class="action-row">
      <el-checkbox :model-value="allSelected" :disabled="!finishedRows.length" @change="togglePage"
        >选择本页已完成任务</el-checkbox
      ><el-button type="primary" :disabled="!!compareIssue" @click="compare"
        >对比所选结果（{{ selected.length }}）</el-button
      ><el-button v-if="selected.length" text @click="clearSelection">清除选择</el-button
      ><span class="muted small">{{
        compareIssue || '将在历史对比中检查配置差异；列表第一条所选运行为默认基线，可在对比页调整。'
      }}</span>
    </div>
  </section>
  <EmptyState
    v-if="!rows.length"
    title="没有符合条件的任务"
    description="清除筛选查看其他任务，或创建首次测评。"
    ><el-button @click="clearFilters">清除筛选</el-button>
    <RouterLink to="/preview/runs/new">创建测评 →</RouterLink></EmptyState
  >
  <section v-else class="panel">
    <p class="muted small">
      共
      {{ filtered.length }} 次测评任务。质量统计来自该次任务的机器原判，不适用和执行错误不计入分数。
    </p>
    <div class="table-scroll">
      <table class="preview-table data-table">
        <thead>
          <tr>
            <th scope="col">选择</th>
            <th scope="col">任务与固定版本</th>
            <th scope="col">执行进度</th>
            <th scope="col">质量</th>
            <th scope="col">创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in rows" :key="run.id">
            <td>
              <el-checkbox
                v-model="selected"
                :value="run.id"
                :disabled="run.status !== 'completed'"
                :aria-label="`选择 ${run.name}`"
                @change="selectionChanged"
              />
            </td>
            <td>
              <RouterLink
                :to="{ path: `/preview/runs/${run.id}`, query: { listReturn: route.fullPath } }"
                >{{ run.name }}</RouterLink
              >
              <EntityRef
                :name="run.target.name"
                :type="run.target.type"
                :version="run.config.targetVersion"
                compact
              />
              <EntityRef
                :name="state.datasets.find((item) => item.id === run.config.datasetId)?.name ?? ''"
                type="测评集"
                :version="run.config.datasetVersion"
                compact
              />
              <MetadataGroup :items="[{ label: '用例数', value: run.cases.length }]" />
              <MetadataGroup
                v-if="run.sourceRunId"
                :items="[
                  {
                    label: '复跑来源',
                    value: state.runs.find((item) => item.id === run.sourceRunId)?.name,
                  },
                  { label: '复跑范围', value: retryScopeLabels[run.retryScope || 'all'] },
                ]"
              />
            </td>
            <td><RunProgress :run="run" :state="state" compact /></td>
            <td>
              <template v-if="run.results.length"
                ><strong>{{ percent(runMetrics(run).passRate) }}</strong
                ><small>用例通过率</small>
                <MetadataGroup
                  :items="[
                    { label: '适用用例数', value: runMetrics(run).applicable },
                    { label: '不通过', value: runMetrics(run).counts.fail },
                    { label: '需复核', value: runMetrics(run).counts.review },
                    { label: '执行错误', value: runMetrics(run).counts.error },
                  ]" /></template
              ><span v-else class="muted">尚无结果</span>
            </td>
            <td>{{ formatTime(run.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="run-pagination">
      <span class="muted small">第 {{ currentPage }} / {{ pageCount }} 页</span
      ><el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="filtered.length"
        layout="prev, pager, next"
        :pager-count="5"
        @current-change="pageChanged"
      />
    </div>
  </section>
</template>
<style scoped>
.field :deep(.el-input),
.field :deep(.el-select) {
  display: block;
  width: 100%;
  margin-top: 8px;
}
.run-pagination {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
td {
  overflow-wrap: anywhere;
}
td:nth-child(2) {
  min-width: 210px;
  max-width: 320px;
}
td:nth-child(3) {
  min-width: 230px;
}
.preview-empty a {
  margin-left: 16px;
}
@media (max-width: 767px) {
  .toolbar .field {
    min-width: 100%;
  }
  .action-row :deep(.el-button) {
    margin-left: 0;
  }
}
</style>
