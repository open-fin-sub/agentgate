<script setup lang="ts">
import MetadataGroup from '../../components/MetadataGroup.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { PreviewState, Run } from '../types'
import { formatTime, runQueue, statusLabels } from './RunSupport'
const props = defineProps<{ run: Run; state: PreviewState; compact?: boolean }>()
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
const queue = computed(() => runQueue(props.state, props.run))
const progress = computed(() =>
  props.run.cases.length
    ? Math.round((props.run.results.length / props.run.cases.length) * 100)
    : 0,
)
const phaseLabel = computed(() =>
  props.run.status !== 'running'
    ? statusLabels[props.run.status]
    : props.run.phase === 'waiting-scoring'
      ? '等待评分资源'
      : props.run.phase === 'scoring'
        ? '评分中'
        : '对象执行中',
)
const estimate = computed(() => {
  const run = props.run
  const start =
    run.status === 'scheduled'
      ? Math.max(now.value, Date.parse(run.config.scheduledAt ?? run.createdAt)) + 2000
      : run.status === 'queued'
        ? now.value + queue.value.wait * 1000
        : Date.parse(run.startedAt ?? run.createdAt)
  const scoreStart =
    run.phase === 'scoring'
      ? Date.parse(run.phaseStartedAt ?? run.startedAt ?? run.createdAt)
      : start + 2000
  return {
    start: new Date(start).toISOString(),
    finish:
      run.phase === 'waiting-scoring'
        ? null
        : new Date(Math.max(now.value, scoreStart + run.cases.length * 600)).toISOString(),
  }
})
</script>
<template>
  <div class="run-progress" :class="{ compact }">
    <div class="action-row">
      <span class="badge" :class="run.status">{{ phaseLabel }}</span
      ><span>{{ run.results.length }} / {{ run.cases.length }} 条已返回</span>
    </div>
    <el-progress
      :percentage="progress"
      :show-text="false"
      :status="run.status === 'failed' ? 'exception' : undefined"
    />
    <template v-if="['scheduled', 'queued', 'running'].includes(run.status)">
      <p v-if="run.status === 'scheduled'">
        预约入队：{{ formatTime(run.config.scheduledAt) }}（{{
          Intl.DateTimeFormat().resolvedOptions().timeZone
        }}）
      </p>
      <MetadataGroup
        v-if="run.status === 'queued'"
        :items="[
          { label: '队列', value: queue.kind },
          { label: '位置', value: queue.position || '待分配' },
          { label: '预计等待', value: `${queue.wait} 秒` },
        ]"
      />
      <p v-if="estimate.finish === null" class="muted small">
        公共评分资源暂无空位，正在等待评分资源；预计完成时间暂时无法估算。
      </p>
      <p v-else class="muted small">
        {{ run.status === 'running' ? '预计完成' : '预计开始' }}：{{
          formatTime(run.status === 'running' ? estimate.finish : estimate.start)
        }}
        （模拟估算）
      </p>
      <MetadataGroup
        v-if="!compact"
        :items="[
          { label: '待返回用例数', value: run.cases.length - run.results.length },
          {
            label: '执行错误数',
            value: run.results.filter((item) => item.outcome === 'error').length,
          },
          { label: '重试次数上限', value: run.config.retries },
          { label: '估算更新时间', value: formatTime(new Date(now).toISOString()) },
        ]"
      />
    </template>
  </div>
</template>
<style scoped>
.run-progress {
  min-width: 0;
}
.run-progress :deep(.el-progress) {
  margin: 12px 0;
}
.run-progress p {
  margin: 8px 0 0;
  overflow-wrap: anywhere;
}
.compact {
  font-size: 12px;
}
</style>
