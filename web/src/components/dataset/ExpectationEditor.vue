<script setup lang="ts">
import type { Condition, Expectation } from '../../types/dataset'
import RuleBuilder from '../RuleBuilder.vue'
import FormSection from '../FormSection.vue'
import EmptyState from '../EmptyState.vue'
import { ElMessageBox } from 'element-plus'
const props = defineProps<{ modelValue: Expectation[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: Expectation[]] }>()
function change(index: number, patch: Partial<Expectation>) {
  emit(
    'update:modelValue',
    props.modelValue.map((row, i) => (i === index ? ({ ...row, ...patch } as Expectation) : row)),
  )
}
function empty(kind: Expectation['kind'], id: string = crypto.randomUUID(), name: string | null = null): Expectation {
  const base = { id, name }
  const condition: Condition = { kind: 'equals', expected: '' }
  switch (kind) {
    case 'tool_call': return { ...base, kind, tool: '', mode: 'required' }
    case 'policy': return { ...base, kind, policy_id: '' }
    case 'skill_route': return { ...base, kind, condition }
    case 'tool_argument': return { ...base, kind, condition, path: '', tool: '', occurrence: 'last' }
    case 'state': return { ...base, kind, condition, path: '' }
    case 'output': return { ...base, kind, condition, path: null }
  }
}
function add(kind: Expectation['kind'] = 'output') {
  emit('update:modelValue', [...props.modelValue, empty(kind)])
}
async function changeKind(index: number, kind: Expectation['kind']) {
  const row = props.modelValue[index]!
  if (kind === row.kind) return
  try { await ElMessageBox.confirm('更换检查对象将清空本项的判断条件。', '更换检查对象', { confirmButtonText: '更换并重新填写', cancelButtonText: '保留原检查' }) } catch { return }
  const next = empty(kind, row.id, row.name)
  emit(
    'update:modelValue',
    props.modelValue.map((entry, i) => (i === index ? next : entry)),
  )
}
function form(condition: Condition) {
  return {
    operator: condition.kind,
    ...('expected' in condition ? { value: condition.expected } : {}),
    ...('json_schema' in condition ? { value: condition.json_schema } : {}),
    ...('epsilon' in condition ? { epsilon: condition.epsilon } : {}),
    ...('minimum' in condition ? { minimum: condition.minimum, maximum: condition.maximum } : {}),
    ...('pattern' in condition ? { pattern: condition.pattern } : {}),
    ...('allowed' in condition ? { allowed: condition.allowed } : {}),
  }
}
function updateCondition(index: number, value: ReturnType<typeof form>) {
  let condition: Condition
  switch (value.operator) {
    case 'within_tolerance':
      condition = {
        kind: 'within_tolerance',
        expected: Number(value.value ?? 0),
        epsilon: value.epsilon ?? 0.000001,
      }
      break
    case 'within_range':
      condition = {
        kind: 'within_range',
        minimum: value.minimum ?? null,
        maximum: value.maximum ?? null,
      }
      break
    case 'matches_pattern':
      condition = { kind: 'matches_pattern', pattern: value.pattern ?? '' }
      break
    case 'one_of':
      condition = { kind: 'one_of', allowed: value.allowed ?? [] }
      break
    case 'must_be_missing':
      condition = { kind: 'must_be_missing' }
      break
    case 'matches_json_schema':
      condition = {
        kind: 'matches_json_schema',
        json_schema:
          typeof value.value === 'object' && value.value && !Array.isArray(value.value)
            ? value.value
            : {},
      }
      break
    default:
      condition = { kind: 'equals', expected: value.value ?? '' }
  }
  change(index, { condition })
}
</script>
<template>
  <div class="expectation-editor">
    <div class="subsection-heading">
      <h3>预期结果</h3>
      <el-dropdown v-if="!disabled" trigger="click" @command="add"
        ><el-button data-testid="add-expectation">添加期望</el-button
        ><template #dropdown
          ><el-dropdown-menu
            ><el-dropdown-item command="output">最终输出</el-dropdown-item
            ><el-dropdown-item command="state">最终状态</el-dropdown-item
            ><el-dropdown-item command="tool_argument">工具参数</el-dropdown-item>
            <el-dropdown-item command="skill_route">处理流程</el-dropdown-item>
            <el-dropdown-item command="tool_call">工具调用</el-dropdown-item>
            <el-dropdown-item command="policy">业务策略</el-dropdown-item></el-dropdown-menu
          ></template
        ></el-dropdown
      >
    </div>
    <EmptyState
      v-if="!modelValue.length"
      title="尚未添加预期结果"
      description="添加一项检查，说明回答内容、业务状态或工具参数应符合什么条件。"
      :action-label="disabled ? undefined : '添加输出检查'"
      @action="add('output')"
    />
    <article
      v-for="(row, index) in modelValue"
      :key="row.id"
      class="expectation-row"
      :data-testid="`expectation-${index}`"
    >
      <h4>检查 {{ index + 1 }}</h4>
      <el-form-item label="检查对象"
        ><el-select
          :model-value="row.kind"
          :disabled="disabled"
          :aria-label="`检查${index + 1}对象`"
          @update:model-value="changeKind(index, $event)"
          ><el-option label="最终输出" value="output" /><el-option
            label="最终状态"
            value="state" /><el-option
            label="工具参数"
            value="tool_argument" /><el-option label="处理流程" value="skill_route" /><el-option label="工具调用" value="tool_call" /><el-option label="业务策略" value="policy" /></el-select></el-form-item
      ><el-form-item v-if="'tool' in row" label="工具名称" required
        ><el-input
          :model-value="row.tool"
          :disabled="disabled"
          :data-testid="`expectation-tool-${index}`"
          @update:model-value="change(index, { tool: $event })" /></el-form-item
      ><el-form-item v-if="'path' in row" label="检查字段" :required="row.kind !== 'output'"
        ><el-input
          :model-value="row.path ?? ''"
          :disabled="disabled"
          :data-testid="`expectation-path-${index}`"
          :placeholder="row.kind === 'output' ? '留空表示检查完整回答' : '例如：status'"
          @update:model-value="
            change(index, { path: $event || (row.kind === 'output' ? null : '') })
          " /></el-form-item
      ><el-form-item v-if="row.kind === 'tool_call'" label="调用要求">
        <el-select :model-value="row.mode" :disabled="disabled" :aria-label="`检查${index + 1}调用要求`" @update:model-value="change(index,{mode:$event})"><el-option label="必须调用" value="required" /><el-option label="不得调用" value="forbidden" /></el-select>
      </el-form-item>
      <el-form-item v-if="row.kind === 'policy'" label="业务策略" required>
        <el-input :model-value="row.policy_id" :disabled="disabled" :aria-label="`检查${index + 1}业务策略`" placeholder="填写被测对象中使用的策略名称" @update:model-value="change(index,{policy_id:$event})" />
      </el-form-item>
      <RuleBuilder v-if="'condition' in row"
        :model-value="form(row.condition)"
        :disabled="disabled"
        :label="`检查${index + 1}`"
        :operators="[
          'equals',
          'within_tolerance',
          'within_range',
          'matches_pattern',
          'one_of',
          'must_be_missing',
          'matches_json_schema',
        ]"
        @update:model-value="updateCondition(index, $event)"
      /><FormSection title="检查说明与调用范围" optional
        ><el-form-item label="检查名称"
          ><el-input
            :model-value="row.name ?? ''"
            :disabled="disabled"
            @update:model-value="change(index, { name: $event || null })" /></el-form-item
        ><el-form-item v-if="row.kind === 'tool_argument'" label="检查哪一次调用"
          ><el-select
            :model-value="row.occurrence"
            :disabled="disabled"
            @update:model-value="change(index, { occurrence: $event })"
            ><el-option label="最后一次" value="last" /><el-option
              label="第一次"
              value="first" /><el-option label="任意一次符合即可" value="any" /><el-option
              label="每次都应符合"
              value="all" /></el-select></el-form-item></FormSection
      ><el-button
        v-if="!disabled"
        text
        type="danger"
        @click="
          emit(
            'update:modelValue',
            modelValue.filter((_, i) => i !== index),
          )
        "
        >移除此检查</el-button
      >
    </article>
  </div>
</template>
