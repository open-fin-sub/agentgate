<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetailDrawer from '../../components/DetailDrawer.vue'
import CasePage from '../pages/CasePage.vue'
const props = defineProps<{ modelValue: string; runId: string; items: { key: string; label: string }[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const detail = ref<InstanceType<typeof CasePage>>()
const route = useRoute(), router = useRouter()
const fullPath = computed(() => router.resolve({ path: `/preview/runs/${encodeURIComponent(props.runId)}/cases/${encodeURIComponent(props.modelValue)}`, query: { ...route.query, returnTo: route.fullPath } }).fullPath)
async function beforeClose() { return await detail.value?.beforeClose() ?? true }
</script>
<template>
  <DetailDrawer :model-value="!!modelValue" title="用例证据与复核" :items="items" :current-key="modelValue" :full-path="fullPath" :before-close="beforeClose" @update:model-value="value => { if (!value) emit('update:modelValue', '') }" @select="emit('update:modelValue', $event)">
    <CasePage v-if="modelValue" ref="detail" :run-id="runId" :case-id="modelValue" embedded />
  </DetailDrawer>
</template>
