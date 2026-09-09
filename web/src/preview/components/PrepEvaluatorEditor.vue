<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import EntityLink from './EntityLink.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { EvaluatorVersion } from '../types'
import { clone, usePreview } from '../workspace'
import { ruleExamples } from './PrepEvaluation'
import PrepRuleBuilder from './PrepRuleBuilder.vue'
import FormSection from '../../components/FormSection.vue'
const props = defineProps<{ modelValue: EvaluatorVersion; readonly?: boolean; ownerId?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: EvaluatorVersion] }>()
const { state } = usePreview()
const value = computed(() => props.modelValue)
const options = computed(() =>
  state.evaluators
    .filter((item) => !item.archived && item.id !== props.ownerId)
    .flatMap((item) =>
      item.versions.map((entry) => ({
        value: `${item.id}@${entry.version}`,
        label: `${item.name}（版本：${entry.version}）`,
        name: item.name,
        version: entry.version,
      })),
    ),
)
const weights = computed(() => value.value.children.reduce((sum, child) => sum + child.weight, 0))
function set<K extends keyof EvaluatorVersion>(key: K, next: EvaluatorVersion[K]) {
  if (!props.readonly) emit('update:modelValue', { ...clone(value.value), [key]: next })
}
function ruleTemplate(type: string) {
  set('rule', JSON.stringify(ruleExamples[type], null, 2))
}
function addChild() {
  set('children', [...clone(value.value.children), { id: '', version: 1, weight: 1 }])
}
async function removeChild(index: number) {
  const child = value.value.children[index]
  if (!child || props.readonly) return
  const confirmed = await ElMessageBox.confirm(
    `将从当前复合标准移除第 ${index + 1} 个子评估器及其权重。请重新核对剩余权重；已发布版本不受影响。`,
    '移除子评估器',
    { confirmButtonText: '确认移除', cancelButtonText: '保留子项', type: 'warning' },
  ).then(() => true, () => false)
  if (!confirmed || props.readonly || !value.value.children.includes(child)) return
  set(
    'children',
    value.value.children.filter(item => item !== child),
  )
}
function selectChild(index: number, ref: string) {
  const [id, version] = ref.split('@')
  const children = clone(value.value.children)
  children[index] = { ...children[index], id, version: Number(version) }
  set('children', children)
}
function setWeight(index: number, weight: number | undefined) {
  const children = clone(value.value.children)
  children[index].weight = weight ?? 0
  set('children', children)
}
function resource(id: string) {
  if (!props.readonly)
    emit('update:modelValue', {
      ...clone(value.value),
      resourceId: id,
      model: state.credentials.find((item) => item.id === id)?.model ?? '',
    })
}
</script>
<template>
  <el-form label-position="top" :disabled="readonly" class="preview-form">
    <el-form-item label="评估器类型"
      ><el-select :model-value="value.kind" @update:model-value="set('kind', $event)"
        ><el-option label="确定性规则" value="rule" /><el-option
          label="大模型评分"
          value="llm" /><el-option label="复合标准" value="composite" /></el-select
    ></el-form-item>
    <template v-if="value.kind === 'rule'"
      ><div v-if="!readonly" class="action-row">
        <el-button
          v-for="(label, type) in {
            json: '字段结构模板',
            regex: '正则模板',
            field: '字段模板',
            tool: '工具模板',
          }"
          :key="type"
          @click="ruleTemplate(type)"
          >{{ label }}</el-button
        >
      </div>
      <PrepRuleBuilder
        :model-value="value.rule"
        :readonly="readonly"
        @update:model-value="set('rule', $event)"
    /></template>
    <template v-else-if="value.kind === 'llm'"
      ><el-form-item label="评分提示词"
        ><el-input
          :model-value="value.prompt"
          type="textarea"
          :rows="7"
          @update:model-value="set('prompt', $event)"
      /></el-form-item>
      <p class="muted" v-pre>
        可用变量：{{ input }}、{{ output }}（必需）、{{ expected }}。返回 0～1 分数与理由。
      </p>
      <el-form-item label="大模型评分资源"
        ><el-select :model-value="value.resourceId" @update:model-value="resource"
          ><el-option
            v-for="entry in state.credentials"
            :key="entry.id"
            :label="entry.name"
            :value="entry.id"
            ><EntityRef
              :name="entry.name"
              :type="entry.kind === 'public' ? '公共资源' : '私有资源'"
              compact /><MetadataGroup
              :items="[
                { label: '可用', value: entry.enabled && entry.healthy },
              ]" /></el-option></el-select></el-form-item
      ><el-form-item label="评分模型"
        ><el-input :model-value="value.model" @update:model-value="set('model', $event)"
      /></el-form-item>
      <p class="muted">
        仅引用资源别名，不接受密钥。资源用于评分；真实执行时公共并发只约束使用公共资源的阶段。
      </p></template
    >
    <template v-else
      ><p>
        按以下顺序执行，子项固定到发布版本。有效分数按权重和归一化；NA / error 保留缺失，不算零分。
      </p>
      <div v-for="(child, index) in value.children" :key="index" class="prep-child">
        <el-form-item :label="`子评估器 ${index + 1} 固定版本`"
          ><el-select
            :model-value="`${child.id}@${child.version}`"
            @update:model-value="selectChild(index, $event)"
            ><el-option
              v-for="option in options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              ><EntityRef
                :name="option.name"
                type="评估器"
                :version="option.version"
                compact /></el-option></el-select></el-form-item
        ><el-form-item :label="`子评估器 ${index + 1} 权重`"
          ><el-input-number
            :model-value="child.weight"
            :min="0.01"
            :max="100"
            :step="0.1"
            :precision="2"
            @update:model-value="setWeight(index, $event)" /></el-form-item
        ><EntityLink
          context-key="src/preview/components/PrepEvaluatorEditor.vue:75"
          v-if="child.id"
          :related="
            value.children
              .filter((item) => item.id)
              .map((item) => ({
                label: state.evaluators.find((entry) => entry.id === item.id)?.name ?? '子评估器',
                to: `/preview/evaluators/${item.id}?version=${item.version}`,
              }))
          "
          :to="`/preview/evaluators/${child.id}?version=${child.version}`"
          >查看子项版本</EntityLink
        ><el-button v-if="!readonly" @click="removeChild(index)">移除子项</el-button>
      </div>
      <el-button v-if="!readonly" @click="addChild">添加子评估器</el-button>
      <p class="muted">权重合计 {{ weights.toFixed(2) }}；执行顺序同显示顺序。</p>
      <FormSection title="条件终止" optional>
        <el-form-item label="遇到失败后的处理方式"
          ><el-switch
            :model-value="value.shortCircuit"
            active-text="前序检查未通过或出错时，跳过后续检查"
            @update:model-value="set('shortCircuit', Boolean($event))"
        /></el-form-item>
        <StatusNotice>
          模拟前序检查未通过后停止其余检查。被跳过的检查不计为通过，也不计零分。
        </StatusNotice></FormSection
      ></template
    >
    <el-form-item v-if="value.kind !== 'rule'" label="通过阈值（0～1，分数 ≥ 阈值时通过）"
      ><el-input-number
        :model-value="value.threshold"
        :min="0"
        :max="1"
        :step="0.05"
        :precision="2"
        @update:model-value="set('threshold', $event ?? 0)"
    /></el-form-item>
    <p v-else class="muted">
      规则的全部检查通过记 1 分并通过，任一检查失败记 0 分；配置错误与不适用均无分数。
    </p>
    <el-form-item label="版本说明（发布时必填）"
      ><el-input
        :model-value="value.note"
        type="textarea"
        @update:model-value="set('note', $event)"
    /></el-form-item>
  </el-form>
</template>
<style scoped>
.prep-child {
  padding: 16px;
  margin: 16px 0;
  background: var(--ag-bg);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.prep-child > .el-form-item {
  flex: 1;
  min-width: 200px;
}
.action-row {
  margin-bottom: 16px;
}
.el-switch {
  height: auto;
  white-space: normal;
}
.el-switch :deep(.el-switch__label) {
  height: auto;
}
</style>
