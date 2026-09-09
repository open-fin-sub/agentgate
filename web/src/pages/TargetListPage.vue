<script setup lang="ts">
import StatusNotice from '../components/StatusNotice.vue'
import { userError } from '../apiErrors'
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
      <h1>测评对象</h1>
      <p>确认对象及版本，再选择适合的用例与评分标准。</p>
    </div>
  </div>
  <StatusNotice type="warning">
    可选择下列信贷助手版本进行测评。需要接入其他对象，请联系管理员并<RouterLink to="/capabilities"
      >查看接入要求</RouterLink
    >
  </StatusNotice>
  <StatusNotice type="error" v-if="error">
    {{ error }} <button class="text-button" @click="load">重试</button>
  </StatusNotice>
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
