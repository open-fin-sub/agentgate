<script setup lang="ts">
import type { JsonObject, JsonValue } from '../types/dataset'
import JsonValueInput from './JsonValueInput.vue'
import SchemaBuilder from './SchemaBuilder.vue'
defineProps<{
  modelValue: {
    operator: string
    value?: JsonValue
    minimum?: number | null
    maximum?: number | null
    epsilon?: number
    pattern?: string
    allowed?: JsonValue[]
  }
  disabled?: boolean
  operators?: string[]
  label?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
const names: Record<string, string> = {
  equals: '等于',
  contains: '包含文本',
  exists: '字段存在',
  gte: '大于或等于',
  lte: '小于或等于',
  within_tolerance: '数值容差',
  within_range: '数值范围',
  matches_pattern: '匹配表达式',
  one_of: '属于允许值',
  must_be_missing: '字段不存在',
  matches_json_schema: '字段结构',
}
</script>
<template>
  <div class="ux-rule-builder">
    <el-form-item label="判断方式"
      ><el-select
        :model-value="modelValue.operator"
        :disabled="disabled"
        :aria-label="`${label ?? '规则'}判断方式`"
        @update:model-value="
          emit('update:modelValue', {
            operator: $event,
            value: '',
            minimum: null,
            maximum: null,
            epsilon: 0.000001,
            pattern: '',
            allowed: [],
          })
        "
        ><el-option
          v-for="key in operators ?? Object.keys(names)"
          :key="key"
          :value="key"
          :label="names[key] ?? key" /></el-select></el-form-item
    ><el-form-item
      v-if="['equals', 'contains', 'gte', 'lte', 'within_tolerance'].includes(modelValue.operator)"
      label="期望值"
      ><JsonValueInput
        :model-value="modelValue.value === undefined ? '' : modelValue.value"
        :disabled="disabled"
        :label="`${label ?? '规则'}期望值`"
        @update:model-value="
          emit('update:modelValue', { ...modelValue, value: $event })
        " /></el-form-item
    ><SchemaBuilder
      v-if="modelValue.operator === 'matches_json_schema'"
      :model-value="
        (modelValue.value &&
        typeof modelValue.value === 'object' &&
        !Array.isArray(modelValue.value)
          ? modelValue.value
          : {}) as JsonObject
      "
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', { ...modelValue, value: $event })"
    /><el-form-item v-if="modelValue.operator === 'within_tolerance'" label="允许误差"
      ><el-input-number
        :model-value="modelValue.epsilon"
        :min="0.000000001"
        :disabled="disabled"
        aria-label="允许误差"
        @update:model-value="
          emit('update:modelValue', { ...modelValue, epsilon: $event })
        " /></el-form-item
    ><template v-if="modelValue.operator === 'within_range'"
      ><el-form-item label="最小值"
        ><el-input-number
          :model-value="modelValue.minimum ?? undefined"
          :disabled="disabled"
          aria-label="最小值"
          @update:model-value="
            emit('update:modelValue', { ...modelValue, minimum: $event ?? null })
          " /></el-form-item
      ><el-form-item label="最大值"
        ><el-input-number
          :model-value="modelValue.maximum ?? undefined"
          :disabled="disabled"
          aria-label="最大值"
          @update:model-value="
            emit('update:modelValue', { ...modelValue, maximum: $event ?? null })
          " /></el-form-item></template
    ><el-form-item v-if="modelValue.operator === 'matches_pattern'" label="匹配表达式"
      ><el-input
        :model-value="modelValue.pattern ?? ''"
        :disabled="disabled"
        aria-label="匹配表达式"
        @update:model-value="
          emit('update:modelValue', { ...modelValue, pattern: $event })
        " /></el-form-item
    ><el-form-item v-if="modelValue.operator === 'one_of'" label="允许值"
      ><JsonValueInput
        :model-value="modelValue.allowed ?? []"
        :disabled="disabled"
        label="允许值"
        hide-type
        @update:model-value="
          emit('update:modelValue', { ...modelValue, allowed: $event })
        " /></el-form-item
    ><slot />
  </div>
</template>
<style scoped>
.ux-rule-builder {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.ux-rule-builder .el-form-item {
  margin-bottom: 8px;
}
.ux-rule-builder .el-select {
  width: 100%;
}
</style>
