<script setup lang="ts">
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
import { catalogLabel } from '../catalogLabels'
import { computed, onMounted, ref } from 'vue'
import { api, type EvaluatorOption } from '../api/client'
import { metricLabel } from '../metricLabels'
import { useRoute } from 'vue-router'
import ValueView from '../components/ValueView.vue'
import JsonFallback from '../components/JsonFallback.vue'
const route = useRoute()
const rows = ref<EvaluatorOption[]>([]),
  query = ref(''),
  error = ref(''),
  loading = ref(true)
const visible = computed(() =>
  rows.value.filter((r) =>
    `${r.name} ${catalogLabel(r.name)} ${r.metric} ${metricLabel(r.dimension)}`
      .toLowerCase()
      .includes(query.value.toLowerCase()),
  ),
)
const kinds = { rule: '规则', llm_judge: 'LLM', hybrid: '复合' }
async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await api.evaluators()
  } catch (e) {
    error.value = userError(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>评估器</h1>
      <p>查看本环境可用的评分标准，选择固定版本用于测评。</p>
    </div>
    <RouterLink class="ag-button primary" to="/runs/new">选择标准并测评</RouterLink>
  </div>
  <StatusNotice type="error" v-if="error">
    {{ error }} <button class="text-button" @click="load">重试</button>
  </StatusNotice>
  <div class="toolbar">
    <label class="field"
      >查找评分标准<input v-model="query" placeholder="名称、指标或质量维度"
    /></label>
  </div>
  <div v-if="loading" class="skeleton">正在加载评分标准…</div>
  <div v-for="item in visible" :key="item.id" class="panel">
    <div class="panel-title">
      <h2>{{ catalogLabel(item.name) }}</h2>
      <span class="badge">{{ kinds[item.kind] }} · v{{ item.version }}</span>
    </div>
    <div class="detail-row">
      <span>质量维度 / 指标</span
      ><span>{{ metricLabel(item.dimension) }} / {{ metricLabel(item.metric) }}</span>
    </div>
    <div class="detail-row">
      <span>未通过时的影响</span
      ><span>{{ item.severity === 'blocking' ? '阻断本次测评判定' : '参与评分与结果统计' }}</span>
    </div>
    <details>
      <summary>查看评分配置</summary>
      <ValueView :value="item.config" />
      <JsonFallback :model-value="item.config" readonly label="评分配置" />
      <p class="muted small">
        实现 {{ item.implementation_id }} · {{ item.implementation_version }}
      </p>
    </details>
    <StatusNotice v-if="item.kind === 'llm_judge'">
      此标准由模型评分。完成测评后，可在用例报告中查看评分理由与调用记录。
    </StatusNotice>
    <RouterLink
      :to="{
        path: '/lineage',
        query: {
          kind: 'evaluator',
          id: item.id,
          version: item.version,
          hash: item.content_sha256,
          returnTo: route.fullPath,
        },
      }"
      >查看此版本的关联任务</RouterLink
    >
  </div>
  <EmptyState
    v-if="!loading && !visible.length && !error"
    title="没有匹配的评估器"
    description="请调整搜索词；仍找不到所需标准时，请联系管理员确认可用评分标准。"
  ></EmptyState>
</template>
