<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { datasetApi } from '../../api/datasets'
import { userError } from '../../apiErrors'
import type { DatasetVersion } from '../../types/dataset'
import DetailDrawer from '../DetailDrawer.vue'
import EntityRef from '../EntityRef.vue'
import EmptyState from '../EmptyState.vue'
import StatusNotice from '../StatusNotice.vue'
import CaseEditor from './CaseEditor.vue'

const props = defineProps<{ datasetId: string; version: number }>()
const opened = ref(false)
const loading = ref(false)
const error = ref('')
const version = ref<DatasetVersion | null>(null)
const selectedId = ref('')
const selectedCase = computed(() => version.value?.cases.find(item => item.id === selectedId.value) ?? null)
watch([opened, () => props.datasetId, () => props.version], async ([open], _previous, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  if (!open) return
  version.value = null
  error.value = ''
  loading.value = true
  try {
    const result = await datasetApi.version(props.datasetId, props.version)
    if (active) {
      version.value = result
      selectedId.value = result.cases[0]?.id ?? ''
    }
  } catch (failure) {
    if (active) error.value = userError(failure)
  } finally {
    if (active) loading.value = false
  }
})
</script>
<template>
  <button class="text-button" @click="opened = true">查看发布版本</button>
  <DetailDrawer v-model="opened" title="测评集发布版本" :items="version?.cases.map(item => ({ key: item.id, label: item.name }))" :current-key="selectedId" @select="selectedId = $event">
    <StatusNotice v-if="loading" message="正在读取发布版本…" busy />
    <StatusNotice v-else-if="error" :message="error" type="error">
      <template #actions><el-button @click="opened = false">关闭详情，返回关联记录</el-button></template>
    </StatusNotice>
    <template v-else-if="version">
      <EntityRef :name="version.dataset_name" type="测评集" :version="version.version" :id="version.dataset_id" />
      <p v-if="version.dataset_description">{{ version.dataset_description }}</p>
      <template v-if="version.cases.length">
        <el-select v-model="selectedId" aria-label="查看用例">
          <el-option v-for="item in version.cases" :key="item.id" :value="item.id" :label="item.name" />
        </el-select>
        <CaseEditor :item="selectedCase" :editable="false" />
      </template>
      <EmptyState v-else title="此版本没有用例" description="可关闭详情，查看其他测评集版本或原任务报告。" />
    </template>
  </DetailDrawer>
</template>
