<script setup lang="ts">
import { useDetailState } from './detailState'
import { computed, ref } from 'vue'
import { useRouter, type LocationQuery, type RouteLocationRaw } from 'vue-router'
import DetailDrawer from './DetailDrawer.vue'
import LineagePage from '../pages/LineagePage.vue'
defineOptions({ inheritAttrs: false })
const props = defineProps<{ to: RouteLocationRaw; related?: { label: string; to: RouteLocationRaw }[] }>()
const router = useRouter()
type Entry = { label: string; query: LocationQuery }
type View = { query: LocationQuery; entries: Entry[] }
const triggerKey = computed(() => `lineage:${router.resolve(props.to).fullPath}`)
const selection = useDetailState<{ opened: boolean; current?: View; history: View[] }>(() => triggerKey.value, { opened: false, history: [] })
const opened = computed({ get: () => selection.value.opened, set: value => { selection.value = { ...selection.value, opened: value } } })
const current = computed({ get: () => selection.value.current, set: value => { selection.value = { ...selection.value, current: value } } })
const history = computed({ get: () => selection.value.history, set: value => { selection.value = { ...selection.value, history: value } } })
const key = (query: LocationQuery) => router.resolve({ path: '/lineage', query: { ...query, limit: undefined } }).fullPath
const items = computed(() => current.value?.entries.map(item => ({ key: key(item.query), label: item.label })) ?? [])
const fullPath = computed(() => current.value && router.resolve({ path: '/lineage', query: current.value.query }).fullPath)
function open() {
  history.value = []
  current.value = { query: router.resolve(props.to).query, entries: (props.related ?? []).map(item => ({ label: item.label, query: router.resolve(item.to).query })) }
  opened.value = true
}
function navigate(query: LocationQuery, entries: Entry[]) {
  if (!current.value) return
  if (!entries.length) { current.value.query = query; return }
  history.value.push(current.value)
  current.value = { query, entries }
}
function select(value: string) {
  const entry = current.value?.entries.find(item => key(item.query) === value)
  if (entry && current.value) current.value.query = entry.query
}
function back() { current.value = history.value.pop() }
</script>
<template>
  <button class="text-button" v-bind="$attrs" :data-detail-key="triggerKey" @click="open"><slot /></button>
  <DetailDrawer v-model="opened" title="来源与关联任务" :items="items" :current-key="current && key(current.query)" :return-focus-key="triggerKey" :full-path="fullPath" @select="select">
    <el-button v-if="history.length" @click="back">返回上层关联</el-button>
    <LineagePage v-if="opened && current" :context="current.query" embedded @navigate="navigate" />
  </DetailDrawer>
</template>
