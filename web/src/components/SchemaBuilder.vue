<script setup lang="ts">
import { computed, ref } from 'vue'
import type { JsonObject, JsonValue } from '../types/dataset'
import JsonValueInput from './JsonValueInput.vue'
import JsonFallback from './JsonFallback.vue'
import InlineError from './InlineError.vue'
const props = defineProps<{ modelValue: JsonObject; disabled?: boolean; hideAdvanced?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: JsonObject] }>()
const name = ref(''),
  error = ref('')
const fields = computed(() => {
  const properties = (props.modelValue.properties ?? {}) as JsonObject
  const keys = new Set([
    ...Object.keys(properties),
    ...((props.modelValue.required ?? []) as string[]),
  ])
  return [...keys].map((key) => [key, properties[key] ?? {}] as [string, JsonValue])
})
function update(key: string, field: string, value: JsonValue) {
  const properties = { ...((props.modelValue.properties as JsonObject) ?? {}) }
  properties[key] = { ...(properties[key] as JsonObject), [field]: value }
  if (field === 'type' && value === 'any') delete (properties[key] as JsonObject).type
  if (
    (['minimum', 'maximum'].includes(field) && value === null) ||
    (field === 'enum' && Array.isArray(value) && !value.length)
  )
    delete (properties[key] as JsonObject)[field]
  emit('update:modelValue', { ...props.modelValue, properties })
}
function required(key: string, yes: boolean) {
  const all = ((props.modelValue.required as string[]) ?? []).filter((value) => value !== key)
  if (yes) all.push(key)
  emit('update:modelValue', { ...props.modelValue, required: all })
}
function add() {
  if (!name.value.trim()) {
    error.value = '请输入字段名称。'
    return
  }
  if (fields.value.some(([key]) => key === name.value)) {
    error.value = '此字段已经存在，请使用不同名称。'
    return
  }
  update(name.value, 'type', 'string')
  name.value = ''
  error.value = ''
}
function remove(key: string) {
  const properties = { ...((props.modelValue.properties as JsonObject) ?? {}) }
  delete properties[key]
  emit('update:modelValue', {
    ...props.modelValue,
    properties,
    required: ((props.modelValue.required as string[]) ?? []).filter((value) => value !== key),
  })
}
</script>
<template>
  <div class="ux-schema">
    <section v-for="[key, field] in fields" :key="key" class="ux-schema-field">
      <h4>字段：{{ key }}</h4>
      <el-form-item label="字段类型"
        ><el-select
          :model-value="(field as JsonObject).type ?? 'any'"
          :disabled="disabled"
          :aria-label="`${key} 字段类型`"
          @update:model-value="update(key, 'type', $event)"
          ><el-option
            v-for="(label, value) in {
              any: '不限类型',
              string: '文本',
              number: '数字',
              integer: '整数',
              boolean: '是或否',
              object: '字段组',
              array: '列表',
              null: '空值',
            }"
            :key="value"
            :value="value"
            :label="label" /></el-select></el-form-item
      ><el-checkbox
        :model-value="((modelValue.required as string[]) ?? []).includes(key)"
        :disabled="disabled"
        @update:model-value="required(key, Boolean($event))"
        >此字段必填</el-checkbox
      ><el-form-item
        v-if="['number', 'integer'].includes(String((field as JsonObject).type))"
        label="数值范围"
        ><el-input-number
          :model-value="(field as JsonObject).minimum as number | undefined"
          :disabled="disabled"
          :aria-label="`${key} 最小值`"
          @update:model-value="update(key, 'minimum', $event ?? null)" /><el-input-number
          :model-value="(field as JsonObject).maximum as number | undefined"
          :disabled="disabled"
          :aria-label="`${key} 最大值`"
          @update:model-value="update(key, 'maximum', $event ?? null)"
      /></el-form-item>
      <details>
        <summary>限定允许值（可选）</summary>
        <JsonValueInput
          :model-value="(field as JsonObject).enum ?? []"
          :disabled="disabled"
          :label="`${key} 允许值`"
          hide-type
          @update:model-value="update(key, 'enum', $event)"
        />
      </details>
      <el-button v-if="!disabled" text type="danger" @click="remove(key)">移除此字段</el-button>
    </section>
    <div v-if="!disabled" class="action-row">
      <el-input
        v-model="name"
        aria-label="新增字段名称"
        placeholder="例如：是否批准"
        @keyup.enter="add"
      /><el-button @click="add">添加检查字段</el-button>
    </div>
    <InlineError :message="error" /><JsonFallback v-if="!hideAdvanced"
      :model-value="modelValue"
      :readonly="disabled"
      object-only
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
<style scoped>
.ux-schema {
  width: 100%;
}
.ux-schema-field {
  padding: 16px;
  border: 1px solid var(--ag-line);
  border-radius: 4px;
  margin: 12px 0;
}
.ux-schema-field h4 {
  margin: 0 0 12px;
}
.ux-schema-field .el-form-item {
  margin: 12px 0;
}
.action-row > .el-input {
  max-width: 320px;
}
summary {
  min-height: 32px;
  cursor: pointer;
}
</style>
