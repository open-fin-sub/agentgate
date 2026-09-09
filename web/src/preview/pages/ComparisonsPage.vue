<script setup lang="ts">
import EmptyState from '../../components/EmptyState.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview } from '../workspace'
import { comparisonConclusion } from '../comparison'
import CompareCreate from '../components/CompareCreate.vue'
const { state } = usePreview()
const route = useRoute(),
  router = useRouter()
const search = computed({
  get: () => String(route.query.q ?? ''),
  set: (q: string) => {
    router.replace({ query: { ...route.query, q: q || undefined } })
  },
})
const asset = computed({
  get: () => String(route.query.asset ?? ''),
  set: (asset: string) => {
    router.replace({ query: { ...route.query, asset: asset || undefined } })
  },
})
const creating = computed(
  () =>
    route.query.create === '1' ||
    !!route.query.baseline ||
    !!route.query.run ||
    route.query.mode === 'controlled',
)
const rows = computed(() =>
  state.comparisons
    .map((comparison) => {
      const baseline = state.runs.find((run) => run.id === comparison.baselineRunId)
      const candidates = comparison.candidateRunIds.map((id) =>
        state.runs.find((run) => run.id === id),
      )
      return { comparison, baseline, candidates }
    })
    .filter(
      (row) =>
        (!asset.value || row.baseline?.config.targetId === asset.value) &&
        `${row.comparison.name} ${row.comparison.id} ${row.baseline?.target.name ?? ''}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
    ),
)
function toggleCreate() {
  router.replace({
    query: {
      q: search.value || undefined,
      asset: asset.value || undefined,
      create: creating.value ? undefined : '1',
    },
  })
}
function created(id: string) {
  router.push(`/preview/comparisons/${id}`)
}
</script>

<template>
  <div class="page-intro">
    <div>
      <h1>版本对比</h1>
      <p>固定基线，逐一核对候选的质量、性能和样本证据。所有结果均为 Mock。</p>
    </div>
    <el-button @click="toggleCreate">{{ creating ? '收起创建表单' : '创建对比' }}</el-button>
  </div>
  <CompareCreate v-if="creating" @created="created" />
  <section class="panel">
    <div class="action-row filters">
      <label>搜索对比<el-input v-model="search" clearable placeholder="名称、对象或 ID" /></label
      ><label
        >目标资产<el-select v-model="asset" clearable placeholder="全部资产"
          ><el-option
            v-for="target in state.targets"
            :key="target.id"
            :label="target.name"
            :value="target.id" /></el-select
      ></label>
    </div>
    <p class="muted">{{ rows.length }} 条对比；新实验与已有结果比较分别标明来源。</p>
    <EmptyState
      v-if="!rows.length"
      title="没有匹配的对比"
      description="调整筛选，或选择已有测评结果创建对比。"
    ></EmptyState>
    <article v-for="row in rows" :key="row.comparison.id" class="comparison-row">
      <div>
        <h2>
          <RouterLink :to="`/preview/comparisons/${row.comparison.id}`">{{
            row.comparison.name
          }}</RouterLink>
        </h2>
        <p>
          {{ row.baseline?.target.name ?? '基线记录不存在' }} ·
          {{ row.comparison.mode === 'controlled' ? '共同配置新实验' : '已有结果比较 / 事后规则' }}
          · {{ new Date(row.comparison.createdAt).toLocaleString() }}
        </p>
      </div>
      <p>
        基线：{{ row.baseline?.name ?? row.comparison.baselineRunId }} ·
        {{ row.baseline?.config.targetVersion }}
      </p>
      <ul>
        <li
          v-for="(candidate, index) in row.candidates"
          :key="row.comparison.candidateRunIds[index]"
        >
          {{ candidate?.name ?? '候选记录不存在' }} · {{ candidate?.config.targetVersion }} ·
          <strong>{{
            row.baseline && candidate
              ? comparisonConclusion(row.baseline, candidate, row.comparison.rules)
              : '证据缺失'
          }}</strong>
        </li>
      </ul>
      <RouterLink :to="`/preview/comparisons/${row.comparison.id}`">查看对比报告 →</RouterLink>
    </article>
  </section>
</template>

<style scoped>
.filters {
  margin-bottom: 16px;
  align-items: flex-end;
}
.filters label {
  display: grid;
  gap: 6px;
  min-width: 0;
  width: 260px;
  max-width: 100%;
}
.comparison-row {
  border-top: 1px solid var(--ag-line);
  padding: 20px 0;
  overflow-wrap: anywhere;
}
.comparison-row h2 {
  font-size: 20px;
  margin-bottom: 6px;
}
.comparison-row p {
  margin-bottom: 8px;
}
.comparison-row > a {
  display: inline-block;
  padding-block: 8px;
}
</style>
