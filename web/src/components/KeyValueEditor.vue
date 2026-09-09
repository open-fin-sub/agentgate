<script setup lang="ts">
import { shallowRef, watch, computed, useId, reactive } from 'vue'
import type { JsonObject, JsonValue } from '../types/dataset'
import JsonValueInput from './JsonValueInput.vue'
import JsonFallback from './JsonFallback.vue'
import InlineError from './InlineError.vue'
import ValueView from './ValueView.vue'
const props = defineProps<{
  modelValue: JsonObject
  disabled?: boolean
  label?: string
  nested?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: JsonObject]; validity: [valid: boolean] }>()
const rows = shallowRef<{ key: string; value: JsonValue; id: number }[]>([])
let nextId = 0,
  sent = ''
const uid = useId()
const childValidity = reactive<Record<number, boolean>>({})
watch(
  () => props.modelValue,
  (value) => {
    if (JSON.stringify(value) === sent) return
    rows.value = Object.entries(value ?? {}).map(([key, value]) => ({
      key,
      value: JSON.parse(JSON.stringify(value)),
      id: nextId++,
    }))
  },
  { immediate: true, deep: true },
)
const error = computed(() =>
  rows.value.some((row) => !row.key.trim())
    ? '请填写每一行的变量名称，或移除空行。'
    : new Set(rows.value.map((row) => row.key)).size !== rows.value.length
      ? '变量名称重复，请分别命名。'
      : '',
)
const valid = computed(
  () => !error.value && rows.value.every((row) => childValidity[row.id] !== false),
)
watch(valid, (value) => emit('validity', value), { immediate: true })
watch(valid, (value) => {
  if (value) update()
})
function update() {
  rows.value = [...rows.value]
  if (!valid.value) return
  const value = Object.fromEntries(rows.value.map((row) => [row.key, row.value])) as JsonObject
  sent = JSON.stringify(value)
  emit('update:modelValue', value)
}
function add() {
  rows.value = [...rows.value, { key: '', value: '', id: nextId++ }]
}
function remove(index: number) {
  rows.value = rows.value.filter((_, position) => position !== index)
  update()
}
</script>
<template>
  <div class="ux-key-values">
    <ValueView v-if="disabled" :value="modelValue" /><template v-else
      ><div v-for="(row, index) in rows" :key="row.id" class="ux-key-row">
        <el-input
          v-model="row.key"
          :aria-label="`${label ?? '变量'} ${index + 1} 名称`"
          placeholder="变量名称"
          :aria-describedby="`${uid}-error`"
          @update:model-value="update"
        /><JsonValueInput
          v-model="row.value"
          :label="`${label ?? '变量'} ${index + 1} 值`"
          @update:model-value="update"
          @validity="childValidity[row.id] = $event"
        /><el-button
          text
          type="danger"
          :aria-label="`移除${label ?? '变量'} ${index + 1}`"
          @click="remove(index)"
          >移除</el-button
        >
      </div>
      <InlineError :id="`${uid}-error`" :message="error" /><el-button @click="add"
        >添加{{ label ?? '变量' }}</el-button
      ></template
    ><JsonFallback
      v-if="!nested"
      :model-value="modelValue"
      :readonly="disabled"
      object-only
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
<style scoped>
.ux-key-values {
  width: 100%;
  min-width: 0;
}
.ux-key-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 2fr) auto;
  gap: 8px;
  margin: 8px 0;
  align-items: start;
}
.ux-key-row > .el-button {
  min-height: 40px;
}
@media (max-width: 768px) {
  .ux-key-row {
    grid-template-columns: 1fr;
    padding: 12px;
    background: var(--ag-bg);
    border-radius: 4px;
  }
}
</style>
