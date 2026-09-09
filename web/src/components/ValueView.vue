<script setup lang="ts">
import { computed } from 'vue'
import { businessValueLabel, conditionField } from '../catalogLabels'
const props = defineProps<{ value: unknown; depth?: number; field?: string }>()
const resolved = computed(() => {
  if (typeof props.value === 'string' && /^[\s]*[\[{]/.test(props.value)) {
    try {
      return JSON.parse(props.value) as unknown
    } catch {
      /* Plain text remains readable. */
    }
  }
  return props.value
})
const record = computed(() =>
  resolved.value && typeof resolved.value === 'object' && !Array.isArray(resolved.value)
    ? Object.entries(resolved.value)
    : null,
)
const fieldNames: Record<string, string> = {
  input: '输入',
  output: '输出',
  message: '消息',
  question: '问题',
  expected: '期望',
  actual: '实际',
  reason: '原因',
  status: '状态',
  skill: '处理场景',
  risk: '风险等级',
  amount: '申请金额',
  application_id: '申请编号',
  tool: '工具',
  arguments: '参数',
  name: '名称',
  kind: '检查类型',
  path: '检查字段',
  condition: '判断规则',
  type: '类型',
  required: '必填字段',
  properties: '字段定义',
  pattern: '匹配表达式',
  minimum: '最小值',
  maximum: '最大值',
  enum: '允许值',
  score: '分数',
  notes: '备注',
}
</script>
<template>
  <dl v-if="record?.length" class="ux-value-record">
    <div v-for="[key, item] in record" :key="key">
      <dt>{{ fieldNames[key] ?? key }}</dt>
      <dd><ValueView :value="item" :depth="(depth ?? 0) + 1" :field="['condition', 'expected', 'actual'].includes(key) ? conditionField(resolved) ?? field ?? key : key" /></dd>
    </div>
  </dl>
  <ul v-else-if="Array.isArray(resolved) && resolved.length" class="ux-value-list">
    <li v-for="(item, index) in resolved" :key="index">
      <ValueView :value="item" :depth="(depth ?? 0) + 1" />
    </li>
  </ul>
  <span v-else class="ux-value-text">{{
    resolved === null || resolved === undefined
      ? '未提供'
      : resolved === true
        ? '是'
        : resolved === false
          ? '否'
          : typeof resolved === 'object'
            ? '未填写'
            : resolved === ''
              ? '空文本'
              : businessValueLabel(field, resolved)
  }}</span>
</template>
<style scoped>
.ux-value-record {
  margin: 0;
  display: grid;
  gap: 8px;
}
.ux-value-record > div {
  display: grid;
  grid-template-columns: minmax(80px, 140px) minmax(0, 1fr);
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--ag-line);
}
dt {
  font-size: 12px;
  color: var(--ag-muted);
  overflow-wrap: anywhere;
}
dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.ux-value-list {
  margin: 0;
  padding-left: 20px;
}
.ux-value-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 24px;
}
@media (max-width: 640px) {
  .ux-value-record > div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
