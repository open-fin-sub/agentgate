<script setup lang="ts">
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
    error.value = String(e)
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
  <div class="notice">
    当前为服务提供的只读目录，提交测评时会显式选择标准。环境配置 LLM Judge
    后才会出现相应标准；新建、编辑、版本发布和试评尚未开放。
  </div>
  <div v-if="error" role="alert" class="notice error">
    {{ error }} <button class="text-button" @click="load">重试</button>
  </div>
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
    <p v-if="item.kind === 'llm_judge'" class="notice">
      此标准会通过已配置的模型进行评分；调用记录在报告中查看，凭据和模型配置由服务端管理。
    </p>
    <RouterLink
      :to="{
        path: '/lineage',
        query: { kind: 'evaluator', id: item.id, version: item.version, returnTo: route.fullPath },
      }"
      >查看此版本的关联任务</RouterLink
    >
    <p class="muted small">
      目录未返回内容指纹；同版本存在多份快照时，请从任务报告按固定指纹查询。
    </p>
  </div>
  <div v-if="!loading && !visible.length && !error" class="empty-state">
    没有匹配的评估器，请调整搜索条件。
  </div>
</template>
