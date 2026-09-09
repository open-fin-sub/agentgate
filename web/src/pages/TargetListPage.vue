<script setup lang="ts">
import { catalogLabel } from '../catalogLabels'
import { onMounted, ref } from 'vue'
import { api, type Version } from '../api/client'
const versions = ref<Version[]>([]),
  error = ref(''),
  loading = ref(true)
async function load() {
  loading.value = true
  error.value = ''
  try {
    versions.value = await api.versions()
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
      <h1>测评对象</h1>
      <p>确认对象及版本，再选择适合的用例与评分标准。</p>
    </div>
  </div>
  <div class="notice warning">
    当前服务提供内置信贷 Agent 演示接入。外部 Agent、单 Skill 接入尚未提供。<RouterLink
      to="/capabilities"
      >查看接入范围</RouterLink
    >
  </div>
  <div v-if="error" class="notice error" role="alert">
    {{ error }} <button class="text-button" @click="load">重试</button>
  </div>
  <div v-if="loading" class="skeleton">正在加载对象版本…</div>
  <div v-else-if="!error" class="panel">
    <div class="panel-title">
      <h2>Loan Agent <span class="badge">Agent · 演示接入</span></h2>
    </div>
    <p class="muted">确定性执行，用于验证真实测评和 Trace 链路。对象由接入端管理。</p>
    <div v-for="version in versions" :key="version.id" class="detail-row">
      <div>
        <strong>{{ version.label }}</strong>
        <div class="muted small">{{ version.id }}</div>
      </div>
      <RouterLink class="ag-button" :to="{ path: '/runs/new', query: { target: version.id } }"
        >测评此版本</RouterLink
      >
    </div>
  </div>
</template>
