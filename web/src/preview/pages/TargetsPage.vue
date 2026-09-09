<script setup lang="ts">
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import ValueView from '../../components/ValueView.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview } from '../workspace'
const { state } = usePreview()
const route = useRoute(),
  router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const target = computed(() => state.targets.find((item) => item.id === id.value))
const versionId = computed({
  get: () => String(route.query.version ?? target.value?.versions[0]?.id ?? ''),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, version: value } })
  },
})
const version = computed(() => target.value?.versions.find((item) => item.id === versionId.value))
const query = computed({
  get: () => String(route.query.q ?? ''),
  set: (value: string) => setFilter('q', value),
})
const type = computed({
  get: () => String(route.query.type ?? ''),
  set: (value: string) => setFilter('type', value),
})
function setFilter(key: string, value: string) {
  void router.replace({ query: { ...route.query, [key]: value || undefined } })
}
const rows = computed(() =>
  state.targets.filter(
    (item) =>
      (!type.value || item.type === type.value) &&
      `${item.name} ${item.id} ${item.description} ${item.form}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)
const skills = computed(
  () =>
    version.value?.skills.map((skill) => ({
      id: skill,
      target: state.targets.find((item) => item.id === skill),
      definition: version.value?.skillDefinitions?.find((item) => item.id === skill),
    })) ?? [],
)
const datasets = computed(() =>
  state.datasets.filter((item) => item.targetId === id.value && !item.archived),
)
const runs = computed(() =>
  state.runs.filter(
    (item) => item.config.targetId === id.value && item.config.targetVersion === versionId.value,
  ),
)
const config = computed(() => ({ target: id.value, version: versionId.value }))
const canAnalyze = computed(
  () =>
    target.value?.type === 'Agent' &&
    !!version.value?.prompt &&
    skills.value.length > 1 &&
    skills.value.every((skill) => skill.definition),
)
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>{{ target?.name ?? '测评对象' }}</h1>
      <p>Mock 外部版本快照 · 选择 Agent 或 Skill，固定版本后准备测评。</p>
    </div>
    <RouterLink v-if="id" to="/preview/targets">返回对象列表</RouterLink>
  </div>
  <StatusNotice
    v-if="id && (!target || !version)"
    type="error"
    title="404：对象或指定版本不存在，无法使用该快照。"
  />
  <template v-else-if="target && version">
    <section class="panel">
      <div class="preview-grid">
        <div>
          <p class="muted">{{ target.type }} · {{ target.form }} · {{ target.platform }}</p>
          <p>{{ target.description }}</p>
          <p class="muted">外部 ID：{{ target.id }}</p>
        </div>
        <label
          >固定对象版本<el-select v-model="versionId" aria-label="对象版本"
            ><el-option
              v-for="entry in target.versions"
              :key="entry.id"
              :value="entry.id"
              :label="entry.label" /></el-select
        ></label>
      </div>
      <p>{{ version.note }}</p>
      <StatusNotice
        v-if="!version.executable"
        title="此版本已由源平台停用，只能查看快照，无法创建测评任务。"
        type="warning"
      />
      <div class="action-row prep-actions">
        <RouterLink
          v-if="version.executable"
          class="ag-button primary"
          :to="{ path: '/preview/runs/new', query: config }"
          >配置测评</RouterLink
        ><RouterLink
          class="ag-button"
          :to="{ path: '/preview/datasets', query: { ...config, mode: 'manual' } }"
          >手工创建测评集</RouterLink
        ><RouterLink
          v-if="target.type === 'Agent' && skills.length"
          class="ag-button"
          :to="{ path: '/preview/datasets', query: { ...config, mode: 'merge' } }"
          >合并关联 Skill 用例</RouterLink
        ><RouterLink
          v-if="canAnalyze"
          class="ag-button"
          :to="{ path: '/preview/analysis', query: { ...config, tab: 'static' } }"
          >静态分析</RouterLink
        >
      </div>
      <p v-if="!canAnalyze" class="muted">
        静态 Skill 冲突分析需要 Agent Prompt 和多个关联 Skill 定义；当前上下文不满足。
      </p>
    </section>
    <div class="preview-columns">
      <section class="panel">
        <h2>Prompt 快照</h2>
        <ValueView :value="version.prompt || '源平台未提供 Prompt'" />
        <h3>工具定义</h3>
        <el-tag v-for="tool in version.tools" :key="tool" class="prep-tag">{{ tool }}</el-tag>
        <p v-if="!version.tools.length" class="muted">此版本没有工具定义。</p>
        <details v-for="tool in version.toolDefinitions ?? []" :key="tool.name">
          <summary>{{ tool.name }} · 输入输出定义</summary>
          <h4>输入 Schema</h4>
          <ValueView :value="tool.inputSchema" />
          <h4>输出 Schema</h4>
          <ValueView :value="tool.outputSchema" />
        </details>
        <p v-if="!version.toolDefinitions?.length" class="muted">
          此快照未提供详细输入输出 Schema。
        </p>
      </section>
      <section class="panel">
        <h2>关联 Skill</h2>
        <p v-if="!skills.length" class="muted">独立 Skill，无下级关联。</p>
        <article v-for="skill in skills" :key="skill.id">
          <RouterLink
            v-if="skill.definition"
            :to="{
              path: `/preview/targets/${skill.id}`,
              query: { version: skill.definition.version },
            }"
            >{{ skill.definition.name }} · {{ skill.definition.version }}</RouterLink
          >
          <span v-else>{{ skill.id }}（固定版本定义未提供）</span>
          <template v-if="skill.definition"
            ><p>{{ skill.definition.description }}</p>
            <details>
              <summary>查看关联 Skill 固定定义</summary>
              <ValueView :value="skill.definition.prompt" />
              <div v-for="tool in skill.definition.tools" :key="tool.name">
                <h4>{{ tool.name }}</h4>
                <p>输入 Schema</p>
                <ValueView :value="tool.inputSchema" />
                <p>输出 Schema</p>
                <ValueView :value="tool.outputSchema" />
              </div></details
          ></template>
        </article>
        <p v-if="skills.some((skill) => !skill.definition)" class="muted">
          部分 Skill 缺少固定定义，不使用目录最新版本替代历史快照。
        </p>
      </section>
    </div>
    <section class="panel">
      <h2>相关测评集</h2>
      <EmptyState
        v-if="!datasets.length"
        title="还没有关联测评集"
        description="可手工创建用例，或从测评集页面导入文件。"
        ><RouterLink class="ag-button" to="/preview/datasets">查看测评集</RouterLink></EmptyState
      >
      <p v-for="dataset in datasets" :key="dataset.id">
        <RouterLink :to="`/preview/datasets/${dataset.id}`">{{ dataset.name }}</RouterLink> ·
        {{ dataset.versions.length }} 个发布版本
      </p>
      <h2>此版本的相关任务</h2>
      <p v-if="!runs.length" class="muted">此版本尚无测评任务。</p>
      <p v-for="run in runs" :key="run.id">
        <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink> · {{ run.status }}
      </p>
    </section>
  </template>
  <template v-else
    ><div class="panel">
      <div class="preview-grid">
        <el-input
          v-model="query"
          aria-label="搜索测评对象"
          placeholder="搜索名称、ID、形态或说明"
          clearable
        /><el-select v-model="type" aria-label="对象类型" placeholder="全部类型" clearable
          ><el-option value="Agent" /><el-option value="Skill"
        /></el-select>
      </div>
    </div>
    <EmptyState
      v-if="!rows.length"
      title="没有匹配的对象"
      description="请调整搜索词，或清除对象类型筛选，查看其他可用对象。"
    ></EmptyState>
    <div class="preview-grid">
      <article v-for="item in rows" :key="item.id" class="panel">
        <p class="muted">{{ item.type }} · {{ item.form }}</p>
        <h2>
          <RouterLink :to="`/preview/targets/${item.id}`">{{ item.name }}</RouterLink>
        </h2>
        <p>{{ item.description }}</p>
        <p class="muted">
          {{ item.platform }} ·
          {{ item.versions.filter((entry) => entry.executable).length }} 个可执行版本
        </p>
        <RouterLink :to="`/preview/targets/${item.id}`">查看版本与定义 →</RouterLink>
      </article>
    </div></template
  >
</template>
<style scoped>
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: inherit;
}
.prep-actions {
  margin-top: 20px;
}
.prep-tag {
  margin: 0 8px 8px 0;
}
article {
  overflow-wrap: anywhere;
}
label .el-select {
  display: block;
  margin-top: 8px;
}
</style>
