<script setup lang="ts">
import { computed } from 'vue'
import type { JsonObject } from '../../types/dataset'
import RuleBuilder from '../../components/RuleBuilder.vue'
import SchemaBuilder from '../../components/SchemaBuilder.vue'
import JsonFallback from '../../components/JsonFallback.vue'
import InlineError from '../../components/InlineError.vue'
import FormSection from '../../components/FormSection.vue'
import { ruleExamples } from './PrepEvaluation'
const props = defineProps<{ modelValue: string; readonly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const config = computed<JsonObject | null>(() => {
  try {
    const value = JSON.parse(props.modelValue)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
})
function set(patch: JsonObject) {
  emit('update:modelValue', JSON.stringify({ ...config.value, ...patch }, null, 2))
}
function type(value: string) {
  emit('update:modelValue', JSON.stringify(ruleExamples[value], null, 2))
}
const rule = computed(() => ({
  operator: String(
    config.value?.operator ?? (config.value?.type === 'regex' ? 'matches_pattern' : 'equals'),
  ),
  value: config.value?.value,
  pattern: String(config.value?.pattern ?? ''),
}))
const schema = computed(() => ({
  required: config.value?.required ?? [],
  properties: config.value?.properties ?? {},
}))
</script>
<template>
  <div>
    <InlineError
      v-if="!config"
      message="无法读取规则，请重新选择检查模板，或在高级内容中修正。"
    /><el-form-item label="检查模板" required
      ><el-select
        :model-value="config?.type ?? 'json'"
        :disabled="readonly"
        aria-label="检查模板"
        @update:model-value="type"
        ><el-option label="字段结构" value="json" /><el-option
          label="文本匹配"
          value="regex" /><el-option label="字段值" value="field" /><el-option
          label="工具调用"
          value="tool" /></el-select></el-form-item
    ><template v-if="config"
      ><el-form-item v-if="config.type === 'tool'" label="工具名称" required
        ><el-input
          :model-value="String(config.tool ?? '')"
          :disabled="readonly"
          @update:model-value="set({ tool: $event })" /></el-form-item
      ><el-form-item v-if="config.type === 'field'" label="检查字段" required
        ><el-input
          :model-value="String(config.path ?? '')"
          :disabled="readonly"
          placeholder="例如：decision"
          @update:model-value="set({ path: $event })" /></el-form-item
      ><SchemaBuilder
        v-if="config.type === 'json' || config.type === 'tool'"
        hide-advanced
        :model-value="schema"
        :disabled="readonly"
        @update:model-value="set($event)" /><RuleBuilder
        v-else
        :model-value="rule"
        :disabled="readonly"
        :operators="
          config.type === 'regex'
            ? ['matches_pattern']
            : ['equals', 'contains', 'exists', 'gte', 'lte']
        "
        @update:model-value="
          set(
            config.type === 'regex'
              ? { pattern: $event.pattern }
              : {
                  operator: $event.operator,
                  ...($event.operator === 'exists' ? {} : { value: $event.value }),
                },
          )
        " /><FormSection v-if="config.type !== 'regex'" title="适用条件" optional
        ><el-form-item label="仅在此字段存在时检查"
          ><el-input
            :model-value="String(config.applicableField ?? '')"
            :disabled="readonly"
            placeholder="留空表示检查所有样本"
            @update:model-value="
              set({ applicableField: $event })
            " /></el-form-item></FormSection></template
    ><JsonFallback
      :model-value="config ?? modelValue"
      :readonly="readonly"
      object-only
      @update:model-value="emit('update:modelValue', JSON.stringify($event, null, 2))"
    />
  </div>
</template>
