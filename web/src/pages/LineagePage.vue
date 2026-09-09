<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { readLineage } from '../api/lineage'
import { ApiError } from '../api/client'
import type { LineageGraph, LineageKind, LineageNode, LineageSubject } from '../types/lineage'
import { catalogLabel } from '../catalogLabels'

const route = useRoute(),
  router = useRouter()
const graph = ref<LineageGraph | null>(null),
  loading = ref(false),
  error = ref(''),
  conflict = ref(false)
const kinds: Record<LineageKind, string> = {
  run: '测评任务',
  dataset: '测评集',
  case: '用例',
  agent: 'Agent',
  skill: 'Skill',
  evaluator: '评估器',
}
const relations: Record<LineageGraph['edges'][number]['relation'], string> = {
  uses_dataset: '使用测评集',
  contains_case: '包含用例',
  evaluates_agent: '测评 Agent',
  evaluates_skill: '测评 Skill',
  includes_skill: '关联 Skill',
  uses_evaluator: '使用评估器',
}
const subject = computed<LineageSubject>(() => ({
  kind: String(route.query.kind ?? 'run') as LineageSubject['kind'],
  id: String(route.query.id ?? ''),
  version: route.query.version ? String(route.query.version) : undefined,
  caseId: route.query.case ? String(route.query.case) : undefined,
  sourceId: route.query.source ? String(route.query.source) : undefined,
  targetType: route.query.targetType as 'agent' | 'skill' | undefined,
  hash: route.query.hash ? String(route.query.hash) : undefined,
}))
const limit = computed(() =>
  [50, 100, 200].includes(Number(route.query.limit)) ? Number(route.query.limit) : 50,
)
const nodes = computed(() => new Map(graph.value?.nodes.map((node) => [node.id, node]) ?? []))
const root = computed(() => (graph.value ? nodes.value.get(graph.value.root_node_id) : undefined))
const relatedRuns = computed(() => graph.value?.nodes.filter((node) => node.kind === 'run') ?? [])
const runPage = ref(1)
const visibleRuns = computed(() =>
  relatedRuns.value.slice((runPage.value - 1) * 20, runPage.value * 20),
)
const assets = computed(
  () =>
    graph.value?.nodes.filter(
      (node) => node.kind !== 'run' && node.id !== graph.value?.root_node_id,
    ) ?? [],
)
const assetGroups = computed(() =>
  (Object.keys(kinds) as LineageKind[])
    .filter((kind) => kind !== 'run')
    .map((kind) => ({ kind, nodes: assets.value.filter((node) => node.kind === kind) }))
    .filter((group) => group.nodes.length),
)
const returnPath = computed(() => {
  const path = String(route.query.returnTo ?? '')
  return /^\/(runs|datasets|evaluators|comparisons|targets)(\/|\?|$)/.test(path) ? path : '/runs'
})
const label = (node?: LineageNode) =>
  node ? `${catalogLabel(node.label)}${node.version ? ` · 版本 ${node.version}` : ''}` : '未知节点'
function runSummary(run: LineageNode) {
  const edges = graph.value?.edges.filter((edge) => edge.source_id === run.id) ?? []
  const target = edges.find(
    (edge) => edge.relation === 'evaluates_agent' || edge.relation === 'evaluates_skill',
  )
  const dataset = edges.find((edge) => edge.relation === 'uses_dataset')
  return [
    target ? label(nodes.value.get(target.target_id)) : '对象未提供',
    dataset ? label(nodes.value.get(dataset.target_id)) : '输入未提供',
  ].join(' · ')
}
let controller: AbortController | undefined
async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  graph.value = null
  runPage.value = 1
  error.value = ''
  conflict.value = false
  loading.value = true
  if (
    !['run', 'dataset', 'case', 'target', 'skill', 'evaluator'].includes(subject.value.kind) ||
    !subject.value.id
  ) {
    error.value = '请从任务、已发布测评集或评估器进入，保留准确的资产与版本。'
    loading.value = false
    return
  }
  const current = subject.value
  if (
    (current.kind !== 'run' && !current.version) ||
    (['dataset', 'case'].includes(current.kind) && !/^[1-9]\d*$/.test(current.version ?? '')) ||
    (['target', 'skill'].includes(current.kind) && !current.sourceId) ||
    (current.kind === 'target' && !['agent', 'skill'].includes(current.targetType ?? '')) ||
    (current.kind === 'case' && !current.caseId) ||
    (current.hash && !/^[a-f0-9]{64}$/.test(current.hash))
  ) {
    error.value = '来源参数不完整或格式无效：请返回来源报告或发布版本，通过“关联任务”入口重新进入。'
    loading.value = false
    return
  }
  try {
    const data = await readLineage(subject.value, limit.value, signal)
    if (!signal.aborted) graph.value = data
  } catch (e) {
    if (!signal.aborted) {
      conflict.value = e instanceof ApiError && e.status === 409
      error.value = String(e)
    }
  } finally {
    if (!signal.aborted) loading.value = false
  }
}
function linkedSubject(node: LineageNode) {
  const common = {
    id: node.external_id,
    version: node.version ?? undefined,
    hash: node.content_sha256 ?? undefined,
    source: subject.value.sourceId,
    returnTo: returnPath.value,
  }
  if (node.kind === 'dataset' || node.kind === 'evaluator')
    return { path: '/lineage', query: { ...common, kind: node.kind } }
  if (node.kind === 'case') {
    const edge = graph.value?.edges.find(
      (edge) => edge.relation === 'contains_case' && edge.target_id === node.id,
    )
    const dataset = edge ? nodes.value.get(edge.source_id) : undefined
    if (dataset)
      return {
        path: '/lineage',
        query: {
          ...common,
          kind: 'case',
          id: dataset.external_id,
          version: dataset.version ?? undefined,
          case: node.external_id,
        },
      }
  }
  if ((node.kind === 'agent' || node.kind === 'skill') && subject.value.sourceId)
    return {
      path: '/lineage',
      query: {
        ...common,
        kind: node.kind === 'agent' ? 'target' : 'skill',
        targetType: node.kind === 'agent' ? 'agent' : 'skill',
      },
    }
  return null
}
function setLimit(event: Event) {
  router.replace({ query: { ...route.query, limit: (event.target as HTMLSelectElement).value } })
}
watch(
  () => [
    route.query.kind,
    route.query.id,
    route.query.version,
    route.query.case,
    route.query.source,
    route.query.targetType,
    route.query.hash,
    route.query.limit,
  ],
  load,
  { immediate: true },
)
onUnmounted(() => controller?.abort())
</script>

<template>
  <RouterLink class="back-link" :to="returnPath">← 返回来源页面</RouterLink>
  <div class="page-intro">
    <div>
      <h1>来源与关联任务</h1>
      <p>查看固定版本之间的实际引用，追溯测评输入和评分标准。</p>
    </div>
    <button class="ag-button" :disabled="loading" @click="load">刷新关系</button>
  </div>
  <div v-if="loading" class="skeleton">正在读取已保存的关系…</div>
  <div v-if="error" role="alert" class="notice error">
    <strong>{{ conflict ? '版本身份暂时无法唯一确定' : '关系读取失败' }}</strong>
    <p>
      {{
        conflict
          ? '同版本可能存在多份内容快照，或本次运行引用的固定对象快照无法解析。请从带完整指纹的报告入口核对；具体原因见服务返回。'
          : '请核对资产、发布版本或运行是否存在。未执行过的评估器也可能尚无可追溯快照。'
      }}
    </p>
    <details>
      <summary>查看服务返回原因</summary>
      {{ error }}
    </details>
  </div>
  <template v-if="graph && root">
    <section class="panel">
      <h2>
        {{ kinds[root.kind] }} ·
        {{ root.kind === 'run' ? root.external_id.slice(0, 8) : label(root) }}
      </h2>
      <details v-if="root.kind === 'run'">
        <summary>完整任务编号</summary>
        <code class="hash">{{ root.external_id }}</code>
      </details>
      <p v-else class="muted">{{ root.external_id }}</p>
      <details v-if="root.content_sha256">
        <summary>固定内容指纹</summary>
        <code class="hash">{{ root.content_sha256 }}</code>
      </details>
      <p class="notice">
        关系来自后端保存的运行和版本引用。这里不包含用例内容、对象 Prompt 或执行
        Trace；具体证据请进入任务报告查看。
      </p>
    </section>
    <section v-if="subject.kind !== 'run'" class="panel">
      <div class="panel-title">
        <h2>关联测评任务</h2>
        <label class="field"
          >查询上限<select :value="limit" aria-label="查询上限" @change="setLimit">
            <option :value="50">最多 50 条</option>
            <option :value="100">最多 100 条</option>
            <option :value="200">最多 200 条</option>
          </select></label
        >
      </div>
      <p class="muted">
        本次返回 {{ relatedRuns.length }} 条，最多查询
        {{ limit }} 条；接口未提供总量与翻页信息，不能据此认定已显示全部关联任务。
      </p>
      <p v-if="!relatedRuns.length" class="empty-state">当前查询未返回关联任务。</p>
      <p v-else class="muted small">以下按任务标识排列；创建时间、运行状态和判定请进入任务查看。</p>
      <div class="related-list">
        <article v-for="run in visibleRuns" :key="run.id">
          <strong>{{ runSummary(run) }}</strong>
          <p class="muted small">任务 {{ run.external_id.slice(0, 8) }}</p>
          <RouterLink :to="`/runs/${encodeURIComponent(run.external_id)}`"
            >查看任务与报告</RouterLink
          >
        </article>
      </div>
      <div v-if="relatedRuns.length > 20" class="action-row">
        <button class="ag-button" :disabled="runPage === 1" @click="runPage--">上一页任务</button
        ><span>已返回记录：第 {{ runPage }} / {{ Math.ceil(relatedRuns.length / 20) }} 页</span
        ><button
          class="ag-button"
          :disabled="runPage * 20 >= relatedRuns.length"
          @click="runPage++"
        >
          下一页任务
        </button>
      </div>
    </section>
    <section class="panel">
      <h2>{{ subject.kind === 'run' ? '固定版本资产' : '关联任务中的其他固定资产' }}</h2>
      <details
        v-for="group in assetGroups"
        :key="`${root.id}:${group.kind}`"
        :open="subject.kind === 'run' && ['dataset', 'agent'].includes(group.kind)"
        class="asset-group"
      >
        <summary>{{ kinds[group.kind] }} · {{ group.nodes.length }} 个固定版本</summary>
        <div class="related-list">
          <article v-for="node in group.nodes" :key="node.id">
            <span class="badge">{{ kinds[node.kind] }}</span>
            <h3>{{ label(node) }}</h3>
            <p class="muted small">{{ node.external_id }}</p>
            <details v-if="node.content_sha256">
              <summary>内容指纹</summary>
              <code class="hash">{{ node.content_sha256 }}</code>
            </details>
            <div class="action-row">
              <RouterLink
                v-if="node.kind === 'dataset'"
                :to="{
                  path: '/datasets',
                  query: { dataset: node.external_id, version: node.version },
                }"
                >查看发布版本</RouterLink
              ><RouterLink v-if="linkedSubject(node)" :to="linkedSubject(node)!"
                >查看此版本关联任务</RouterLink
              >
            </div>
          </article>
        </div>
      </details>
    </section>
    <section class="panel">
      <h2>引用关系</h2>
      <p class="muted">每条关系保留方向；同名资产不同版本分别展示。</p>
      <details :key="root.id">
        <summary>查看 {{ graph.edges.length }} 条引用关系</summary>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>来源</th>
                <th>关系</th>
                <th>引用对象</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="edge in graph.edges"
                :key="`${edge.source_id}:${edge.relation}:${edge.target_id}`"
              >
                <td>{{ label(nodes.get(edge.source_id)) }}</td>
                <td>{{ relations[edge.relation] }}</td>
                <td>{{ label(nodes.get(edge.target_id)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <p v-if="!graph.edges.length" class="empty-state">当前记录没有返回关联边。</p>
    </section>
  </template>
</template>

<style scoped>
.related-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.related-list article {
  padding: 16px;
  border: 1px solid var(--ag-line);
  border-radius: 8px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.hash {
  display: block;
  overflow-wrap: anywhere;
  padding: 12px 0;
}
.asset-group {
  margin: 16px 0;
}
.asset-group > summary {
  padding: 8px 0;
}
.table-scroll {
  overflow-x: auto;
}
td {
  overflow-wrap: anywhere;
}
@media (max-width: 767px) {
  .related-list {
    grid-template-columns: 1fr;
  }
}
</style>
