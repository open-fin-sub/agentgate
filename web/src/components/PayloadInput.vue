<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KeyValueEditor from './KeyValueEditor.vue'
import JsonFallback from './JsonFallback.vue'
import InlineError from './InlineError.vue'
import type { JsonObject } from '../types/dataset'
const props = defineProps<{
  modelValue: string
  disabled?: boolean
  label: string
  objectOnly?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; validity: [valid: boolean] }>()
const object = computed<JsonObject | null>(() => {
  try {
    const value = JSON.parse(props.modelValue)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
})
const mode = ref<'text' | 'fields'>(props.objectOnly || object.value ? 'fields' : 'text')
const cachedText = ref(''),
  cachedObject = ref<JsonObject>({})
const fieldsValid = ref(true)
const sourceError = computed(() =>
  props.objectOnly && props.modelValue.trim() && !object.value
    ? '这份变量内容无法按字段读取。请在高级内容中修正格式，原内容仍保留。'
    : '',
)
watch(
  () => [fieldsValid.value, sourceError.value, mode.value],
  () => emit('validity', !sourceError.value && (mode.value === 'text' || fieldsValid.value)),
  { immediate: true },
)
watch(
  () => props.modelValue,
  (value) => {
    if (object.value) {
      cachedObject.value = object.value
      mode.value = 'fields'
    } else if (value) {
      cachedText.value = value
      if (!props.objectOnly) mode.value = 'text'
    }
  },
  { immediate: true },
)
function switchMode(value: string | number | boolean | undefined) {
  mode.value = value === 'fields' ? 'fields' : 'text'
  emit(
    'update:modelValue',
    mode.value === 'fields' ? JSON.stringify(cachedObject.value) : cachedText.value,
  )
}
</script>
<template>
  <div class="ux-payload-input">
    <el-radio-group
      v-if="!objectOnly"
      :model-value="mode"
      :disabled="disabled"
      :aria-label="`${label}填写方式`"
      @update:model-value="switchMode"
      ><el-radio-button value="text">文本</el-radio-button
      ><el-radio-button value="fields">字段组</el-radio-button></el-radio-group
    ><template v-if="sourceError"
      ><InlineError :message="sourceError" /><JsonFallback
        :model-value="modelValue"
        :readonly="disabled"
        object-only
        @update:model-value="emit('update:modelValue', JSON.stringify($event))" /></template
    ><KeyValueEditor
      v-else-if="mode === 'fields'"
      :model-value="object ?? cachedObject"
      :disabled="disabled"
      :label="label"
      @update:model-value="emit('update:modelValue', JSON.stringify($event))"
      @validity="fieldsValid = $event"
    /><template v-else
      ><el-input
        :model-value="modelValue"
        :disabled="disabled"
        type="textarea"
        :rows="3"
        :aria-label="label"
        @update:model-value="emit('update:modelValue', $event)" /><JsonFallback
        :model-value="modelValue"
        :readonly="disabled"
        @update:model-value="
          emit('update:modelValue', typeof $event === 'string' ? $event : JSON.stringify($event))
        "
    /></template>
  </div>
</template>
<style scoped>
.ux-payload-input {
  width: 100%;
  min-width: 0;
}
.el-radio-group {
  margin-bottom: 12px;
}
</style>
