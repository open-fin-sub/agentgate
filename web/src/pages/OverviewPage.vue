<script setup lang="ts">
import EntityRef from '../components/EntityRef.vue'
import MetadataGroup from '../components/MetadataGroup.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { onMounted, onUnmounted, ref } from 'vue'
import { api, type Overview } from '../api/client'
import { runsApi } from '../api/runs'
import type { EvaluationRun } from '../types/run'
const data = ref<Overview | null>(null),
  runs = ref<EvaluationRun[]>([]),
  error = ref(''),
  loading = ref(true)
let controller: AbortController
async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  loading.value = true
  error.value = ''
  try {
    const [summary, rows] = await Promise.all([
      api.overview(signal),
      runsApi.list(undefined, 10, signal),
    ])
    if (signal.aborted) return
    data.value = summary
    runs.value = rows
  } catch (e) {
    if (!signal.aborted) error.value = userError(e)
  } finally {
    if (!signal.aborted) loading.value = false
  }
}
onMounted(load)
onUnmounted(() => controller?.abort())
const labels = {
  pending: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '执行失败',
  cancelled: '已取消',
}
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>总览</h1>
      <p>了解测评进展，从最近结果继续定位和验证。</p>
    </div>
    <RouterLink class="ag-button primary" to="/runs/new">创建测评</RouterLink>
  </div>
  <StatusNotice type="error" v-if="error">
    概况加载失败：{{ error }} <button class="text-button" @click="load">重新加载</button>
  </StatusNotice>
  <div v-if="loading && !data" class="skeleton" role="status">正在读取运行概况…</div>
  <template v-if="data"
    ><div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">测评任务</div>
        <div class="stat-number">{{ data.total_runs }}</div>
        <RouterLink class="stat-note" to="/runs">查看运行记录 →</RouterLink>
      </div>
      <div class="stat-box">
        <div class="stat-label">正在执行</div>
        <div class="stat-number">{{ data.running_runs ?? '—' }}</div>
        <RouterLink class="stat-note" to="/runs?status=running">查看进度 →</RouterLink>
      </div>
      <div class="stat-box">
        <div class="stat-label">已完成任务</div>
        <div class="stat-number">{{ data.completed_runs }}</div>
        <span class="stat-note">执行完成不代表质量达标</span>
      </div>
      <div class="stat-box">
        <div class="stat-label">测评用例</div>
        <div class="stat-number">{{ data.case_count }}</div>
        <RouterLink class="stat-note" to="/datasets">各集最新发布版本 →</RouterLink>
      </div>
    </div>
    <div v-if="data.latest" class="panel">
      <div class="panel-title">
        <h2>最近完成的测评</h2>
        <RouterLink :to="`/runs/${data.latest.run.id}`">阅读报告 →</RouterLink>
      </div>
      <div class="detail-row">
        <span>测评对象</span><strong>{{ data.latest.run.manifest.target.display_name }}</strong>
      </div>
      <div class="detail-row">
        <span>对象版本</span
        ><span>{{ data.latest.run.manifest.target.ref.external_version_id }}</span>
      </div>
      <div class="detail-row">
        <span>判定结论</span
        ><span class="badge" :class="data.latest.release_gate.outcome">{{
          data.latest.release_gate.outcome === 'pass' ? '达到本次测评门槛' : '未达到本次测评门槛'
        }}</span>
      </div>
    </div>
    <section class="panel table-panel">
      <div class="panel-title">
        <h2>最近任务</h2>
        <RouterLink to="/runs">查看全部 →</RouterLink>
      </div>
      <EmptyState
        v-if="!runs.length"
        title="还没有测评记录"
        description="选择测评对象、已发布测评集和评分标准，开始首次测评。"
        ><RouterLink class="ag-button primary" to="/runs/new">创建首次测评</RouterLink></EmptyState
      >
      <div v-else class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>对象与版本</th>
              <th>测评输入</th>
              <th>执行状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in runs" :key="run.id">
              <td>
                <EntityRef
                  :name="run.manifest.target.display_name"
                  type="测评对象"
                  :version="run.manifest.target.ref.external_version_id"
                  compact
                />
              </td>
              <td>
                <EntityRef
                  :name="run.manifest.dataset.dataset_name"
                  type="测评集"
                  :version="run.manifest.dataset.version"
                  compact
                />
                <MetadataGroup
                  :items="[{ label: '用例数', value: run.manifest.dataset.cases.length }]"
                />
              </td>
              <td>
                <span class="badge" :class="run.status">{{ labels[run.status] }}</span>
              </td>
              <td>
                <RouterLink :to="`/runs/${run.id}`">{{
                  run.status === 'completed' ? '查看报告' : '查看进度'
                }}</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span>最近 10 条测评任务</span><RouterLink to="/capabilities">当前接入范围</RouterLink>
      </div>
    </section></template
  >
</template>
