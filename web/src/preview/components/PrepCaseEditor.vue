<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TestCase } from '../types'
import { clone, usePreview } from '../workspace'
import { caseErrors, caseTitle, emptyCase, syncCase } from './PrepCases'
import PrepLineage from './PrepLineage.vue'
import PayloadInput from '../../components/PayloadInput.vue'
import FormSection from '../../components/FormSection.vue'
const props = defineProps<{ modelValue: TestCase[]; readonly?: boolean; focusId?: string }>()
const emit = defineEmits<{ 'update:modelValue': [cases: TestCase[]] }>()
const { state } = usePreview()
const route = useRoute(),
  router = useRouter()
const item = ref<TestCase | null>(null),
  originalId = ref(''),
  error = ref('')
const variablesValid = ref(true)
const query = computed({
  get: () => String(route.query.caseSearch ?? ''),
  set: (value: string) => setFilter('caseSearch', value),
})
const category = computed({
  get: () => String(route.query.category ?? ''),
  set: (value: string) => setFilter('category', value),
})
const priority = computed({
  get: () => String(route.query.priority ?? ''),
  set: (value: string) => setFilter('priority', value),
})
const difficulty = computed({
  get: () => String(route.query.difficulty ?? ''),
  set: (value: string) => setFilter('difficulty', value),
})
const page = computed({
  get: () => Math.max(1, Number(route.query.casePage) || 1),
  set: (value: number) => {
    void router.replace({ query: { ...route.query, casePage: String(value) } })
  },
})
function setFilter(key: string, value: string) {
  void router.replace({ query: { ...route.query, [key]: value || undefined, casePage: undefined } })
}
const filtered = computed(() =>
  props.modelValue.filter(
    (row) =>
      `${row.id} ${row.question} ${row.expected} ${row.tags.join(' ')} ${row.note}`
        .toLowerCase()
        .includes(query.value.toLowerCase()) &&
      (!category.value || row.category === category.value) &&
      (!priority.value || row.priority === priority.value) &&
      (!difficulty.value || row.difficulty === difficulty.value),
  ),
)
const visible = computed(() => filtered.value.slice((page.value - 1) * 8, page.value * 8))
const tags = computed({
  get: () => item.value?.tags.join(', ') ?? '',
  set: (value: string) => {
    if (item.value)
      item.value.tags = value
        .split(/[,，]/)
        .map((v) => v.trim())
        .filter(Boolean)
  },
})
const files = computed({
  get: () => item.value?.files.join('\n') ?? '',
  set: (value: string) => {
    if (item.value)
      item.value.files = value
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean)
  },
})
function open(row: TestCase) {
  item.value = clone(row)
  originalId.value = row.id
  error.value = ''
}
function add() {
  item.value = emptyCase()
  originalId.value = ''
  error.value = ''
}
function addTurn() {
  if (item.value)
    item.value.turns.push(
      item.value.turns.length
        ? { input: '', expected: '' }
        : { input: item.value.question, expected: item.value.expected },
    )
}
function removeTurn(index: number) {
  item.value?.turns.splice(index, 1)
}
function save() {
  if (!item.value || props.readonly) return
  if (!variablesValid.value) { error.value='请修正变量名称后再应用修改。'; return }
  error.value = caseErrors(item.value).join('；')
  if (error.value) return
  const rows = clone(props.modelValue)
  const index = rows.findIndex((row) => row.id === originalId.value)
  if (index < 0) rows.push(syncCase(clone(item.value)))
  else rows[index] = syncCase(clone(item.value))
  emit('update:modelValue', rows)
  item.value = null
  ElMessage.success('已应用到本页草稿，请保存草稿以持久化')
}
function remove(id: string) {
  if (!props.readonly)
    emit(
      'update:modelValue',
      props.modelValue.filter((row) => row.id !== id),
    )
}
watch(
  () => [props.focusId, props.readonly, props.modelValue],
  () => {
    const row = props.modelValue.find((entry) => entry.id === props.focusId)
    if (row) open(row)
    else item.value = null
  },
  { immediate: true },
)
watch(
  () => props.modelValue,
  () => {
    if (page.value > Math.max(1, Math.ceil(filtered.value.length / 8))) page.value = 1
  },
)
</script>
<template>
  <section class="panel">
    <div class="action-row">
      <h2>用例（{{ modelValue.length }}）</h2>
      <el-button v-if="!readonly" @click="add">新增用例</el-button>
    </div>
    <div class="preview-grid prep-filters">
      <el-input
        v-model="query"
        aria-label="搜索用例"
        placeholder="问题、ID、期望、标签或备注"
        clearable
      />
      <el-select v-model="category" aria-label="筛选类别" placeholder="全部类别" clearable
        ><el-option v-for="value in ['正例', '负例', '边界']" :key="value" :value="value"
      /></el-select>
      <el-select v-model="difficulty" aria-label="筛选难度" placeholder="全部难度" clearable
        ><el-option v-for="value in ['简单', '中等', '困难']" :key="value" :value="value"
      /></el-select>
      <el-select v-model="priority" aria-label="筛选优先级" placeholder="全部优先级" clearable
        ><el-option v-for="value in ['P0', 'P1', 'P2']" :key="value" :value="value"
      /></el-select>
    </div>
    <div v-if="!visible.length" class="preview-empty">没有匹配的用例，可清除筛选或新增用例。</div>
    <article v-for="row in visible" :key="row.id" class="prep-case">
      <div>
        <strong>{{ caseTitle(row) }}</strong>
        <p class="muted">
          {{ row.id }} · {{ row.category }} · {{ row.difficulty }} · {{ row.priority }} ·
          {{ row.turns.length ? `${row.turns.length} 轮` : '单轮' }}
        </p>
        <p>
          期望：{{ row.expected || '未填写'
          }}<span v-if="row.expectedSkill"> · 路由 {{ row.expectedSkill }}</span>
        </p>
        <p v-if="row.tags.length" class="muted">{{ row.tags.join(' · ') }}</p>
      </div>
      <div class="action-row">
        <el-button @click="open(row)">{{ readonly ? '查看用例' : '编辑用例' }}</el-button
        ><el-popconfirm v-if="!readonly" title="从本页草稿移除此用例？" @confirm="remove(row.id)"
          ><template #reference
            ><el-button type="danger" plain>移除</el-button></template
          ></el-popconfirm
        >
      </div>
    </article>
    <el-pagination
      v-model:current-page="page"
      :page-size="8"
      :total="filtered.length"
      layout="prev, pager, next"
      :pager-count="5"
    />
    <section v-if="item" class="prep-editor">
      <h3>{{ readonly ? '用例快照' : originalId ? '编辑用例' : '新增用例' }}</h3>
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <el-form label-position="top" :disabled="readonly" class="preview-form">
        <el-form-item v-if="!item.turns.length" label="问题 / 场景入口（必填）"
          ><el-input v-model="item.question" type="textarea" :rows="2"
        /></el-form-item>
        <p v-else class="muted">
          多轮摘要：{{ caseTitle(item) }}。摘要由逐轮输入自动同步，执行输入以各轮内容为准。
        </p>
        <el-form-item label="期望输出 / 工具及业务要求"
          ><el-input v-model="item.expected" type="textarea" :rows="3"
        /></el-form-item>
        <FormSection title="处理流程要求" optional :open="!!item.expectedSkill">
          <el-form-item label="期望处理流程">
            <el-select v-model="item.expectedSkill" clearable placeholder="不限制处理流程" aria-label="期望处理流程">
              <el-option v-for="skill in state.targets.filter(target => target.type === 'Skill')" :key="skill.id" :value="skill.id" :label="skill.name" />
            </el-select>
          </el-form-item>
        </FormSection>
        <div v-for="(turn, index) in item.turns" :key="index" class="prep-turn">
          <h4>第 {{ index + 1 }} 轮</h4>
          <el-form-item :label="`第 ${index + 1} 轮输入`"
            ><el-input v-model="turn.input" type="textarea" /></el-form-item
          ><el-form-item :label="`第 ${index + 1} 轮期望`"
            ><el-input v-model="turn.expected" type="textarea" /></el-form-item
          ><el-button v-if="!readonly" @click="removeTurn(index)">移除此轮</el-button>
        </div>
        <el-button v-if="!readonly" @click="addTurn">添加对话轮次</el-button>
        <FormSection title="分类与备注" optional>
        <div class="preview-grid">
          <el-form-item label="类别"
            ><el-select v-model="item.category"
              ><el-option
                v-for="value in ['正例', '负例', '边界']"
                :key="value"
                :value="value" /></el-select></el-form-item
          ><el-form-item label="难度"
            ><el-select v-model="item.difficulty"
              ><el-option
                v-for="value in ['简单', '中等', '困难']"
                :key="value"
                :value="value" /></el-select></el-form-item
          ><el-form-item label="优先级"
            ><el-select v-model="item.priority"
              ><el-option
                v-for="value in ['P0', 'P1', 'P2']"
                :key="value"
                :value="value" /></el-select
          ></el-form-item>
        </div>
        <el-form-item label="标签（逗号分隔）"><el-input v-model="tags" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="item.note" type="textarea" /></el-form-item>
        </FormSection>
        <FormSection title="变量与附件" optional :open="item.variables !== '{}' || item.files.length > 0">
        <el-form-item label="输入变量"><PayloadInput v-model="item.variables" label="变量" :disabled="readonly" object-only @validity="variablesValid=$event" /></el-form-item>
        <el-form-item label="文件引用（每行一个；仅保存引用，不上传文件）"
          ><el-input v-model="files" type="textarea"
        /></el-form-item>
        </FormSection>
      </el-form>
      <h4>用例来源</h4>
      <PrepLineage :sources="item.sources" />
      <div class="action-row">
        <el-button v-if="!readonly" type="primary" @click="save">应用用例修改</el-button
        ><el-button @click="item = null">关闭编辑区</el-button>
      </div>
    </section>
  </section>
</template>
<style scoped>
.prep-filters {
  margin-bottom: 16px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}
.prep-case {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--ag-line);
  overflow-wrap: anywhere;
}
.prep-case p {
  margin: 6px 0;
}
.prep-case > div:first-child {
  min-width: 0;
  flex: 1;
}
.prep-editor {
  margin-top: 24px;
  border-top: 2px solid var(--ag-line);
  padding-top: 24px;
}
.prep-turn {
  margin: 16px 0;
  padding: 16px;
  background: var(--ag-bg);
}
.el-pagination {
  margin-top: 20px;
}
@media (max-width: 640px) {
  .prep-case {
    flex-direction: column;
  }
}
</style>
