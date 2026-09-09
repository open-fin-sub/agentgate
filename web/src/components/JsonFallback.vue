<script setup lang="ts">
import { ref, watch, useId } from 'vue'
import InlineError from './InlineError.vue'
const props = defineProps<{
  modelValue: unknown
  readonly?: boolean
  label?: string
  objectOnly?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()
const open = ref(false),
  text = ref(''),
  error = ref(''),
  uid = useId()
watch(
  () => props.modelValue,
  (value) => {
    text.value = JSON.stringify(value, null, 2) ?? 'null'
    error.value = ''
  },
  { immediate: true, deep: true },
)
function apply() {
  try {
    const value = JSON.parse(text.value)
    if (props.objectOnly && (!value || typeof value !== 'object' || Array.isArray(value))) {
      error.value = '请填写由字段和值组成的对象，或返回结构化表单编辑。'
      return
    }
    emit('update:modelValue', value)
    error.value = ''
    open.value = false
  } catch {
    error.value = '内容格式不完整，请检查引号和括号，或返回结构化表单编辑。'
  }
}
</script>
<template>
  <div class="ux-json-fallback">
    <el-button text :aria-expanded="open" :aria-controls="uid" @click="open = !open">{{
      open ? '关闭高级内容' : '高级：查看原始内容'
    }}</el-button>
    <section v-if="open" :id="uid">
      <p class="muted">{{ label || '高级 JSON 内容' }}</p>
      <pre v-if="readonly" class="code-view">{{ text }}</pre>
      <template v-else
        ><el-input
          v-model="text"
          type="textarea"
          :rows="6"
          aria-label="高级 JSON 内容"
          :aria-invalid="!!error"
          :aria-describedby="`${uid}-error`"
        /><InlineError :id="`${uid}-error`" :message="error" /><el-button @click="apply"
          >应用高级内容</el-button
        ></template
      >
    </section>
  </div>
</template>
<style scoped>
.ux-json-fallback {
  margin: 12px 0;
}
.ux-json-fallback section {
  padding: 16px;
  background: var(--ag-bg);
  border-radius: 4px;
}
.code-view {
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
