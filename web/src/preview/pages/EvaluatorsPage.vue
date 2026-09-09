<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Evaluator, EvaluatorVersion } from '../types'
import { usePreview, clone, uid, downloadJson } from '../workspace'
import { previewReturn } from '../components/PrepCases'
import { evaluatorErrors, ruleExamples } from '../components/PrepEvaluation'
import PrepEvaluatorEditor from '../components/PrepEvaluatorEditor.vue'
import PrepTrial from '../components/PrepTrial.vue'
const { state, change } = usePreview()
const route = useRoute(),
  router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const evaluator = computed(() => state.evaluators.find((item) => item.id === id.value))
const creating = computed(() => id.value === 'new' || route.query.mode === 'new')
const selectedVersion = computed(() =>
  Number(route.query.version ?? evaluator.value?.versions.slice(-1)[0]?.version ?? 1),
)
const version = computed(() =>
  evaluator.value?.versions.find((entry) => entry.version === selectedVersion.value),
)
const editing = ref(false),
  name = ref(''),
  description = ref(''),
  error = ref(''),
  saved = ref('')
const initialVersion = (): EvaluatorVersion => ({
  version: 1,
  kind: 'rule',
  rule: JSON.stringify(ruleExamples.json, null, 2),
  prompt: '根据 {{input}}、{{expected}} 评估 {{output}}，返回 0～1 分数及理由。',
  resourceId: 'public-model',
  model: '体验模型',
  children: [],
  threshold: 0.8,
  shortCircuit: true,
  note: '',
})
const draft = ref<EvaluatorVersion>(initialVersion())
const readonly = computed(
  () =>
    state.role === 'viewer' || !!evaluator.value?.archived || (!editing.value && !creating.value),
)
const current = computed(() => (editing.value || creating.value ? draft.value : version.value))
const dirty = computed(
  () =>
    (editing.value || creating.value) &&
    saved.value !== JSON.stringify([name.value, description.value, draft.value]),
)
const query = computed({
  get: () => String(route.query.q ?? ''),
  set: (value: string) => setFilter('q', value),
})
const kind = computed({
  get: () => String(route.query.kind ?? ''),
  set: (value: string) => setFilter('kind', value),
})
const status = computed({
  get: () => String(route.query.status ?? 'active'),
  set: (value: string) => setFilter('status', value),
})
const page = computed({
  get: () => Math.max(1, Number(route.query.page) || 1),
  set: (value: number) => {
    void router.replace({ query: { ...route.query, page: String(value) } })
  },
})
function setFilter(key: string, value: string) {
  void router.replace({ query: { ...route.query, [key]: value || undefined, page: undefined } })
}
const kinds = { rule: '规则', llm: 'LLM', composite: '复合' }
const rows = computed(() =>
  state.evaluators.filter(
    (item) =>
      (status.value === 'all' || (status.value === 'archived' ? item.archived : !item.archived)) &&
      (!kind.value || item.versions.slice(-1)[0]?.kind === kind.value) &&
      `${item.name} ${item.description} ${item.id}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)
const visible = computed(() => rows.value.slice((page.value - 1) * 8, page.value * 8))
const related = computed(() =>
  state.runs.filter((run) =>
    run.config.evaluatorRefs.some(
      (entry) => entry.id === id.value && entry.version === selectedVersion.value,
    ),
  ),
)
const parents = computed(() =>
  state.evaluators.flatMap((item) =>
    item.versions
      .filter((entry) =>
        entry.children.some(
          (child) => child.id === id.value && child.version === selectedVersion.value,
        ),
      )
      .map((entry) => ({ id: item.id, name: item.name, version: entry.version })),
  ),
)
watch(
  () => [id.value, route.query.mode, route.query.version],
  () => {
    editing.value = false
    error.value = ''
    name.value = evaluator.value?.name ?? ''
    description.value = evaluator.value?.description ?? ''
    draft.value = clone(version.value ?? initialVersion())
    saved.value = JSON.stringify([name.value, description.value, draft.value])
  },
  { immediate: true },
)
async function guard() {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm('评估器修改尚未发布，离开将丢失本页修改。', '离开配置页', {
      confirmButtonText: '放弃修改',
      cancelButtonText: '继续编辑',
      type: 'warning',
    })
    return true
  } catch {
    return false
  }
}
onBeforeRouteLeave(guard)
onBeforeRouteUpdate((to) =>
  to.params.id !== route.params.id ||
  to.query.version !== route.query.version ||
  to.query.mode !== route.query.mode
    ? guard()
    : true,
)
function edit() {
  if (!version.value || evaluator.value?.archived || state.role === 'viewer') return
  draft.value = clone(version.value)
  draft.value.note = ''
  editing.value = true
  saved.value = JSON.stringify([name.value, description.value, draft.value])
}
function update(value: EvaluatorVersion) {
  if (!readonly.value) draft.value = clone(value)
}
function publish() {
  if (readonly.value) return
  const errors = evaluatorErrors(draft.value, state, evaluator.value?.id)
  if (!name.value.trim()) errors.push('请填写评估器名称')
  if (!draft.value.note.trim()) errors.push('请填写版本说明')
  error.value = errors.join('；')
  if (error.value) return
  const number = Math.max(0, ...(evaluator.value?.versions.map((entry) => entry.version) ?? [])) + 1
  const nextVersion = { ...clone(draft.value), version: number }
  const item = evaluator.value
  const next: Evaluator = {
    id: uid('ev'),
    name: name.value.trim(),
    description: description.value.trim(),
    archived: false,
    versions: [nextVersion],
  }
  const subject = item?.id ?? next.id
  if (
    change(subject, `发布评估器 v${number}`, () => {
      if (item) item.versions.push(nextVersion)
      else state.evaluators.push(next)
    })
  ) {
    saved.value = JSON.stringify([name.value, description.value, draft.value])
    editing.value = false
    ElMessage.success(`已发布 v${number}，历史引用保持不变`)
    void router.replace({
      path: `/preview/evaluators/${subject}`,
      query: { version: String(number), returnTo: route.query.returnTo },
    })
  }
}
function copy(item: Evaluator) {
  const source = item.id === id.value ? version.value : item.versions.slice(-1)[0]
  if (!source) return
  const next: Evaluator = {
    id: uid('ev'),
    name: `${item.name} · 副本`,
    description: item.description,
    archived: false,
    versions: [
      {
        ...clone(source),
        version: 1,
        note: `复制自 ${item.name} ${item.id}@${source.version}；${source.note}`,
      },
    ],
  }
  if (change(next.id, `复制评估器 ${item.id}@${source.version}`, () => state.evaluators.push(next)))
    void router.push({ path: `/preview/evaluators/${next.id}`, query: { version: '1' } })
}
function archive(item: Evaluator) {
  change(item.id, item.archived ? '恢复评估器' : '归档评估器（保留历史引用）', () => {
    item.archived = !item.archived
  })
}
function selectVersion(value: string) {
  void router.push({ query: { ...route.query, version: value } })
}
function exportVersion() {
  if (evaluator.value && version.value)
    downloadJson(`${evaluator.value.id}-v${version.value.version}.json`, {
      id: evaluator.value.id,
      name: evaluator.value.name,
      version: clone(version.value),
    })
}
function useEvaluator() {
  if (!evaluator.value || !version.value || evaluator.value.archived) return
  const destination = router.resolve(previewReturn(route.query.returnTo))
  void router.push({
    path: destination.path,
    query: {
      ...destination.query,
      evaluator: evaluator.value.id,
      evaluatorVersion: String(version.value.version),
    },
  })
}
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>{{ creating ? '新建评估器' : (evaluator?.name ?? '评估器') }}</h1>
      <p>固定评分标准、验证单个样本，再发布独立版本用于测评。</p>
    </div>
    <RouterLink v-if="id || creating" to="/preview/evaluators">返回评估器列表</RouterLink>
  </div>
  <el-alert
    v-if="state.role === 'viewer'"
    title="只读角色：可以查看与本地试评，不能新建、发布、复制或归档。"
    type="warning"
    :closable="false"
  />
  <el-alert
    v-if="!creating && id && (!evaluator || !version)"
    title="404：评估器或指定发布版本不存在。"
    type="error"
    :closable="false"
  />
  <template v-else-if="creating || evaluator">
    <el-alert
      v-if="evaluator?.archived"
      title="此评估器已归档；历史版本保留，恢复后可用于新任务。"
      type="warning"
      :closable="false"
    />
    <section class="panel">
      <template v-if="evaluator && version"
        ><div class="action-row">
          <el-tag>{{
            editing ? '正在修订 · 尚未发布' : `发布版本 v${version.version} · 只读`
          }}</el-tag
          ><el-select
            :model-value="String(selectedVersion)"
            aria-label="评估器版本"
            @change="selectVersion"
            ><el-option
              v-for="entry in evaluator.versions"
              :key="entry.version"
              :label="`v${entry.version} · ${entry.note}`"
              :value="String(entry.version)"
          /></el-select>
        </div>
        <p>{{ evaluator.description }}</p>
        <div class="action-row">
          <el-button
            v-if="!editing"
            type="primary"
            :disabled="state.role === 'viewer' || evaluator.archived"
            @click="edit"
            >编辑并发布新版本</el-button
          ><el-button :disabled="state.role === 'viewer'" @click="copy(evaluator)"
            >复制评估器</el-button
          ><el-popconfirm
            :title="
              evaluator.archived ? '恢复此评估器？' : '归档后不能用于新任务，历史引用保留。继续？'
            "
            @confirm="archive(evaluator)"
            ><template #reference
              ><el-button :disabled="state.role === 'viewer'">{{
                evaluator.archived ? '恢复评估器' : '归档评估器'
              }}</el-button></template
            ></el-popconfirm
          ><el-button @click="exportVersion">导出此版本</el-button
          ><el-button :disabled="evaluator.archived || editing" @click="useEvaluator">{{
            route.query.returnTo ? '使用并返回配置' : '用于测评'
          }}</el-button>
        </div></template
      >
      <el-form v-if="creating" label-position="top" :disabled="state.role === 'viewer'"
        ><el-form-item label="评估器名称（必填）"
          ><el-input v-model="name" maxlength="100" /></el-form-item
        ><el-form-item label="用途说明"
          ><el-input v-model="description" type="textarea" /></el-form-item
      ></el-form>
      <PrepEvaluatorEditor
        v-if="current"
        :model-value="current"
        :readonly="readonly"
        :owner-id="evaluator?.id"
        @update:model-value="update"
      />
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon /><el-button
        v-if="creating || editing"
        type="primary"
        :disabled="readonly"
        @click="publish"
        >发布{{ creating ? '首个' : '新' }}版本</el-button
      >
    </section>
    <PrepTrial v-if="current" :version="current" />
    <section v-if="evaluator" class="panel">
      <h2>版本关系与相关任务</h2>
      <p v-if="!parents.length && !related.length" class="muted">当前版本暂无引用。</p>
      <p v-for="parent in parents" :key="`${parent.id}@${parent.version}`">
        被复合标准引用：<RouterLink
          :to="`/preview/evaluators/${parent.id}?version=${parent.version}`"
          >{{ parent.name }} v{{ parent.version }}</RouterLink
        >
      </p>
      <p v-for="run in related" :key="run.id">
        相关任务：<RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink>
      </p>
    </section>
  </template>
  <template v-else
    ><section class="panel">
      <div class="action-row">
        <RouterLink class="ag-button primary" to="/preview/evaluators/new">新建评估器</RouterLink
        ><RouterLink to="/preview/runs/new">选择标准并配置测评</RouterLink>
      </div>
      <div class="preview-grid prep-space">
        <el-input
          v-model="query"
          aria-label="搜索评估器"
          placeholder="搜索名称、ID 或用途"
          clearable
        /><el-select v-model="kind" aria-label="评估器类型筛选" placeholder="全部类型" clearable
          ><el-option
            v-for="(label, value) in kinds"
            :key="value"
            :label="label"
            :value="value" /></el-select
        ><el-select v-model="status" aria-label="评估器状态筛选"
          ><el-option label="使用中" value="active" /><el-option
            label="已归档"
            value="archived" /><el-option label="全部" value="all"
        /></el-select>
      </div>
    </section>
    <section v-if="!visible.length" class="panel preview-empty">
      没有匹配的评估器，请调整筛选或新建。
    </section>
    <article v-for="item in visible" :key="item.id" class="panel">
      <h2>
        <RouterLink :to="`/preview/evaluators/${item.id}`">{{ item.name }}</RouterLink>
      </h2>
      <p>{{ item.description }}</p>
      <p class="muted">
        {{ kinds[item.versions.slice(-1)[0]?.kind ?? 'rule'] }} ·
        {{ item.versions.length }} 个发布版本 · {{ item.archived ? '已归档' : '使用中' }}
      </p>
      <div class="action-row">
        <RouterLink :to="`/preview/evaluators/${item.id}`">查看配置与试评</RouterLink
        ><el-button :disabled="state.role === 'viewer'" @click="copy(item)">复制</el-button
        ><el-popconfirm
          :title="item.archived ? '恢复此评估器？' : '归档后保留历史引用，继续？'"
          @confirm="archive(item)"
          ><template #reference
            ><el-button :disabled="state.role === 'viewer'">{{
              item.archived ? '恢复' : '归档'
            }}</el-button></template
          ></el-popconfirm
        >
      </div>
    </article>
    <el-pagination
      v-model:current-page="page"
      :total="rows.length"
      :page-size="8"
      layout="prev, pager, next"
      :pager-count="5"
  /></template>
</template>
<style scoped>
.prep-space {
  margin-top: 18px;
}
.el-alert {
  margin-bottom: 16px;
}
.action-row {
  margin-bottom: 20px;
}
.action-row > .el-select {
  width: 320px;
  max-width: 100%;
}
</style>
