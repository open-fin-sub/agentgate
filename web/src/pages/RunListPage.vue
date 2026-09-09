<script setup lang="ts">
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { runsApi } from '../api/runs'
import type { EvaluationRun, RunStatus } from '../types/run'
const route = useRoute(),
  router = useRouter(),
  rows = ref<EvaluationRun[]>([]),
  loading = ref(true),
  error = ref('')
const labels: Record<RunStatus, string> = {
  pending: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '执行失败',
  cancelled: '已取消',
}
const status = computed(() =>
  Object.keys(labels).includes(String(route.query.status))
    ? (String(route.query.status) as RunStatus)
    : undefined,
)
const search = ref(String(route.query.q ?? '')),
  visible = computed(() =>
    rows.value.filter((r) =>
      `${r.id} ${r.manifest.target.display_name} ${r.manifest.target.ref.external_version_id} ${r.manifest.dataset.dataset_name}`
        .toLowerCase()
        .includes(String(route.query.q ?? '').toLowerCase()),
    ),
  )
let controller: AbortController, timer: ReturnType<typeof setTimeout> | undefined
async function load() {
  clearTimeout(timer)
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  loading.value = true
  error.value = ''
  try {
    const result = await runsApi.list(status.value, 200, signal)
    if (signal.aborted) return
    rows.value = result
  } catch (e) {
    if (!signal.aborted) error.value = userError(e)
  } finally {
    if (!signal.aborted) {
      loading.value = false
      if (!error.value && rows.value.some((r) => r.status === 'pending' || r.status === 'running'))
        timer = setTimeout(pollActivity, 5000)
    }
  }
}
async function pollActivity() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  try {
    const activity = await runsApi.activity(1, signal)
    if (signal.aborted) return
    const active = [...activity.queued, ...activity.running]
    const previousActive = rows.value.filter(
      (row) => row.status === 'pending' || row.status === 'running',
    )
    const changed =
      previousActive.some(
        (row) => !active.some((item) => item.run_id === row.id && item.status === row.status),
      ) ||
      active.some(
        (item) =>
          (!status.value || item.status === status.value) &&
          !rows.value.some((row) => row.id === item.run_id),
      )
    if (changed) await load()
    else if (previousActive.length) timer = setTimeout(pollActivity, 5000)
  } catch (e) {
    if (!signal.aborted) error.value = `运行状态更新失败：${userError(e)}。请点击刷新重试。`
  }
}
function filter(event: Event) {
  router.replace({
    query: { ...route.query, status: (event.target as HTMLSelectElement).value || undefined },
  })
}
function searchRows() {
  router.replace({ query: { ...route.query, q: search.value || undefined } })
}
const date = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
watch(status, load, { immediate: true })
onUnmounted(() => {
  controller?.abort()
  clearTimeout(timer)
})
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>测评任务</h1>
      <p>跟踪执行进度，查看每次运行对应的报告与固定配置。</p>
    </div>
    <RouterLink class="ag-button primary" to="/runs/new">创建测评</RouterLink>
  </div>
  <div class="toolbar">
    <label class="field"
      >查找当前返回记录<input
        v-model="search"
        placeholder="对象、版本、测评集或任务编号"
        @keydown.enter="searchRows" /></label
    ><label class="field"
      >执行状态<select :value="status ?? ''" @change="filter">
        <option value="">全部状态</option>
        <option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option>
      </select></label
    ><button class="ag-button" @click="searchRows">查询</button
    ><button class="ag-button" :disabled="loading" @click="load">刷新</button>
  </div>
  <StatusNotice type="error" v-if="error"> 列表刷新失败，已保留上次记录。{{ error }} </StatusNotice>
  <div v-if="loading && !rows.length" class="skeleton">正在加载任务…</div>
  <section v-else class="panel table-panel">
    <EmptyState
      v-if="!visible.length"
      title="没有匹配的测评任务"
      description="清除筛选查看全部任务，或创建一次测评。"
      ><RouterLink class="ag-button" to="/runs">清除筛选</RouterLink></EmptyState
    >
    <div v-else class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>对象 / 版本</th>
            <th>测评集</th>
            <th>执行状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in visible" :key="run.id">
            <td>
              {{ run.manifest.target.display_name
              }}<small>{{ run.manifest.target.ref.external_version_id }}</small
              ><small>{{ run.id.slice(0, 8) }}</small>
            </td>
            <td>
              {{ run.manifest.dataset.dataset_name
              }}<small
                >v{{ run.manifest.dataset.version }} ·
                {{ run.manifest.dataset.cases.length }} 条用例</small
              >
            </td>
            <td>
              <span class="badge" :class="run.status">{{ labels[run.status] }}</span>
            </td>
            <td class="small">{{ date(run.created_at) }}</td>
            <td>
              <RouterLink
                :to="{
                  path: `/runs/${run.id}`,
                  query: { fromStatus: status, fromQuery: String(route.query.q ?? '') },
                }"
                >{{ run.status === 'completed' ? '查看报告' : '查看进度' }}</RouterLink
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-foot">
      状态由服务端筛选，有排队或运行中任务时每 5 秒刷新；最多返回最近 200 条。关键词匹配其中
      {{ visible.length }} 条，不代表全量历史搜索。
    </div>
  </section>
</template>
