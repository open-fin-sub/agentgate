<script setup lang="ts">
import { computed } from 'vue'
import type { JsonObject } from '../types/dataset'
import KeyValueEditor from './KeyValueEditor.vue'
import FormSection from './FormSection.vue'
const props = defineProps<{ modelValue: JsonObject; disabled?: boolean; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: JsonObject]; validity: [valid: boolean] }>()
const textKey = computed(
  () =>
    ['message', 'question', 'text', 'input'].find(
      (key) => typeof props.modelValue[key] === 'string',
    ) ?? 'message',
)
const text = computed({
  get: () => String(props.modelValue[textKey.value] ?? ''),
  set: (value) => {
    const next = { ...props.modelValue }
    if (value) next[textKey.value] = value
    else delete next[textKey.value]
    emit('update:modelValue', next)
  },
})
const variables = computed({
  get: () =>
    Object.fromEntries(
      Object.entries(props.modelValue).filter(([key]) => key !== textKey.value),
    ) as JsonObject,
  set: (value) =>
    emit('update:modelValue', { ...value, ...(text.value ? { [textKey.value]: text.value } : {}) }),
})
</script>
<template>
  <div class="ux-message-input">
    <el-input
      v-model="text"
      type="textarea"
      :rows="3"
      :disabled="disabled"
      :aria-label="label ?? '消息内容'"
      placeholder="输入用户会提出的问题；已有业务变量可在下方填写"
    /><FormSection title="输入变量" optional :open="Object.keys(variables).length > 0"
      ><KeyValueEditor
        v-model="variables"
        :disabled="disabled"
        label="变量"
        @validity="emit('validity', $event)"
    /></FormSection>
  </div>
</template>
<style scoped>
.ux-message-input {
  width: 100%;
  min-width: 0;
}
</style>
