<script setup lang="ts">
import { useDetailState } from '../../components/detailState'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter, type LocationQuery, type RouteLocationRaw } from 'vue-router'
import DetailDrawer from '../../components/DetailDrawer.vue'
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
const TargetsPage = defineAsyncComponent(() => import('../pages/TargetsPage.vue'))
const DatasetsPage = defineAsyncComponent(() => import('../pages/DatasetsPage.vue'))
const EvaluatorsPage = defineAsyncComponent(() => import('../pages/EvaluatorsPage.vue'))
defineOptions({ inheritAttrs: false })
const props = defineProps<{ to: RouteLocationRaw; contextKey: string; related?: { label: string; to: RouteLocationRaw }[] }>()
const router = useRouter()
const route = useRoute()
const triggerKey = computed(() => `${props.contextKey}:${router.resolve(props.to).fullPath}`)
const selection = useDetailState<{ opened: boolean; active?: RouteLocationRaw; sourceKey: string }>(() => `asset:${triggerKey.value}`, { opened: false, sourceKey: '' })
const opened = computed({ get: () => selection.value.opened, set: value => { selection.value = { ...selection.value, opened: value } } })
const active = computed({ get: () => selection.value.active, set: value => { selection.value = { ...selection.value, active: value } } })
const sourceKey = computed({ get: () => selection.value.sourceKey, set: value => { selection.value = { ...selection.value, sourceKey: value } } })
const detail = ref<{ beforeClose?: () => boolean | Promise<boolean> }>()
const resolved = computed(() => router.resolve(active.value ?? props.to))
const fullPath = computed(() => router.resolve({ path: resolved.value.path, query: { ...resolved.value.query, origin: route.fullPath } }).fullPath)
const kind = computed(() => resolved.value.path.split('/')[2])
const context = computed(() => ({ id: String(resolved.value.params.id ?? ''), query: resolved.value.query }))
const title = computed(() => ({ targets: '测评对象详情', datasets: '测评集详情', evaluators: '评估器详情' })[kind.value ?? ''] ?? '版本详情')
const items = computed(() => (props.related ?? [{ to: props.to, label: '当前版本' }]).map(item => ({ key: router.resolve(item.to).fullPath, label: item.label })))
function open() { active.value = props.to; sourceKey.value = router.resolve(props.to).fullPath; opened.value = true }
function select(value: string) { active.value = value; sourceKey.value = value }
async function beforeClose() { return await detail.value?.beforeClose?.() ?? true }
function changeQuery(query: LocationQuery) { active.value = { path: resolved.value.path, query } }
</script>
<template>
  <button class="text-button" v-bind="$attrs" :data-detail-key="triggerKey" @click="open"><slot /></button>
  <DetailDrawer v-model="opened" :title="title" :items="items" :current-key="sourceKey" :return-focus-key="triggerKey" :full-path="fullPath" :before-close="beforeClose" @select="select">
    <Suspense v-if="opened">
      <template #default>
      <TargetsPage v-if="kind === 'targets'" ref="detail" :context="context" @change-query="changeQuery" />
      <DatasetsPage v-else-if="kind === 'datasets'" ref="detail" :context="context" @change-query="changeQuery" />
      <EvaluatorsPage v-else-if="kind === 'evaluators'" ref="detail" :context="context" @change-query="changeQuery" />
      <EmptyState v-else title="找不到此版本详情" description="请关闭详情，从列表重新选择对象、测评集或评估器。" />
      </template>
      <template #fallback><StatusNotice message="正在读取版本详情…" busy /></template>
    </Suspense>
  </DetailDrawer>
</template>
