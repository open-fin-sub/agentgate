<script setup lang="ts">
import MetadataGroup from './MetadataGroup.vue'
defineProps<{
  input?: number | null
  output?: number | null
  total?: number | null
  latency?: number | null
  scope?: string
}>()
</script>
<template>
  <div class="ux-token-usage">
    <p v-if="scope" class="muted small">统计范围：{{ scope }}</p>
    <MetadataGroup
      :items="[
        { label: '输入 Token', value: input == null ? '未采集' : input.toLocaleString() },
        { label: '输出 Token', value: output == null ? '未采集' : output.toLocaleString() },
        { label: '总 Token', value: total == null ? '未采集' : total.toLocaleString() },
        ...(latency !== undefined
          ? [
              {
                label: '耗时',
                value: latency === null ? '未采集' : `${latency.toLocaleString()} ms`,
              },
            ]
          : []),
      ]"
    />
  </div>
</template>
