<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { JsonValue } from '../types/dataset'
import KeyValueEditor from './KeyValueEditor.vue'
const props = defineProps<{
  modelValue: JsonValue
  disabled?: boolean
  label?: string
  hideType?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: JsonValue]; validity: [valid: boolean] }>()
const childValidity = reactive<Record<number, boolean>>({})
const valid = computed(() => Object.values(childValidity).every(Boolean))
watch(valid, (value) => emit('validity', value), { immediate: true })
function clearValidity() {
  for (const key of Object.keys(childValidity)) delete childValidity[Number(key)]
}
const kind = computed(() =>
  props.modelValue === null
    ? 'null'
    : Array.isArray(props.modelValue)
      ? 'array'
      : typeof props.modelValue,
)
const defaults: Record<string, JsonValue> = {
  string: '',
  number: 0,
  boolean: false,
  null: null,
  object: {},
  array: [],
}
async function changeType(type: string) {
  if (type === kind.value) return
  if (JSON.stringify(props.modelValue) !== JSON.stringify(defaults[kind.value])) {
    try {
      await ElMessageBox.confirm('更改类型将清空这个值。其他字段不受影响。', '更改值类型', {
        confirmButtonText: '更改并清空',
        cancelButtonText: '保留原值',
        type: 'warning',
      })
    } catch {
      return
    }
  }
  clearValidity()
  emit('update:modelValue', structuredClone(defaults[type] ?? ''))
}
function changeArray(index: number, value: JsonValue) {
  const list = [...(props.modelValue as JsonValue[])]
  list[index] = value
  emit('update:modelValue', list)
}
function removeArray(index: number) {
  const remaining = Object.entries(childValidity).filter(([key]) => Number(key) !== index)
  clearValidity()
  for (const [key, value] of remaining)
    childValidity[Number(key) > index ? Number(key) - 1 : Number(key)] = value
  emit(
    'update:modelValue',
    (props.modelValue as JsonValue[]).filter((_, i) => i !== index),
  )
}
</script>
<template>
  <div class="ux-value-input">
    <el-select
      v-if="!hideType"
      :model-value="kind"
      :disabled="disabled"
      :aria-label="`${label ?? '值'}类型`"
      class="ux-value-type"
      @update:model-value="changeType"
      ><el-option
        v-for="(text, type) in {
          string: '文本',
          number: '数字',
          boolean: '是或否',
          null: '空值',
          object: '字段组',
          array: '列表',
        }"
        :key="type"
        :label="text"
        :value="type" /></el-select
    ><el-input
      v-if="kind === 'string'"
      :model-value="String(modelValue ?? '')"
      :disabled="disabled"
      :aria-label="label ?? '值'"
      @update:model-value="emit('update:modelValue', $event)"
    /><el-input-number
      v-else-if="kind === 'number'"
      :model-value="Number(modelValue)"
      :disabled="disabled"
      :aria-label="label ?? '值'"
      @update:model-value="emit('update:modelValue', $event ?? 0)"
    /><el-switch
      v-else-if="kind === 'boolean'"
      :model-value="Boolean(modelValue)"
      :disabled="disabled"
      :aria-label="label ?? '值'"
      active-text="是"
      inactive-text="否"
      @update:model-value="emit('update:modelValue', Boolean($event))"
    /><KeyValueEditor
      v-else-if="kind === 'object'"
      :model-value="modelValue as Record<string, JsonValue>"
      :disabled="disabled"
      :label="label ?? '字段组'"
      nested
      @update:model-value="emit('update:modelValue', $event)"
      @validity="childValidity[0] = $event"
    />
    <div v-else-if="kind === 'array'" class="ux-array">
      <div v-for="(item, index) in modelValue as JsonValue[]" :key="index">
        <JsonValueInput
          :model-value="item"
          :disabled="disabled"
          :label="`${label ?? '列表'}第${index + 1}项`"
          @update:model-value="changeArray(index, $event)"
          @validity="childValidity[index] = $event"
        /><el-button v-if="!disabled" text @click="removeArray(index)"
          >移除第 {{ index + 1 }} 项</el-button
        >
      </div>
      <el-button
        v-if="!disabled"
        @click="emit('update:modelValue', [...(modelValue as JsonValue[]), ''])"
        >添加列表项</el-button
      >
    </div>
    <span v-else>空值</span>
  </div>
</template>
<style scoped>
.ux-value-input {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
  min-width: 0;
  width: 100%;
}
.ux-value-type {
  width: 112px;
  flex-shrink: 0;
}
.ux-value-input > .el-input {
  flex: 1;
  min-width: 120px;
}
.ux-array {
  width: 100%;
  display: grid;
  gap: 8px;
}
</style>
