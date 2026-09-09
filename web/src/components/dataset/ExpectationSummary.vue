<script setup lang="ts">
import type { Expectation } from '../../types/dataset'
import type { Condition } from '../../types/dataset'
import RuleBuilder from '../RuleBuilder.vue'
import MetadataGroup from '../MetadataGroup.vue'
import EmptyState from '../EmptyState.vue'
defineProps<{ items: Expectation[] }>()
const names = { output: '最终输出', state: '业务状态', tool_argument: '工具参数', skill_route: '处理流程', tool_call: '工具调用', policy: '业务策略' }
function rule(condition: Condition) {
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
</script>
<template>
  <EmptyState v-if="!items.length" title="本轮未指定预期" description="可查看实际输出及评分标准，修订测评集时补充预期。" />
  <section v-for="(item, index) in items" :key="item.id" class="expectation-summary">
    <h4>{{ index + 1 }}. {{ item.name || names[item.kind] }}</h4>
    <MetadataGroup :items="[
      {label:'检查对象',value:names[item.kind]},
      ...('tool' in item ? [{label:'工具',value:item.tool}] : []),
      ...('path' in item ? [{label:'字段',value:item.path || '完整输出'}] : []),
      ...('occurrence' in item ? [{label:'调用范围',value:{first:'第一次',last:'最后一次',any:'任意一次',all:'每一次'}[item.occurrence]}] : []),
      ...(item.kind === 'tool_call' ? [{label:'要求',value:item.mode === 'required' ? '必须调用' : '不得调用'}] : []),
      ...(item.kind === 'policy' ? [{label:'策略',value:item.policy_id === 'high_risk_requires_review' ? '高风险申请必须转人工复核' : item.policy_id}] : [])
    ]" />
    <RuleBuilder v-if="'condition' in item" :model-value="rule(item.condition)" disabled :label="`预期${index + 1}`" />
  </section>
</template>
<style scoped>.expectation-summary{padding:12px 0;border-bottom:1px solid var(--ag-line)}h4{margin:0 0 8px}</style>
