<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import JsonFallback from '../../components/JsonFallback.vue'
import { computed } from 'vue'
import type { Run } from '../types'
import { preflight } from '../comparison'
import { usePreview } from '../workspace'
const props = defineProps<{ baseline: Run; candidate: Run }>()
const { state } = usePreview()
const result = computed(() => preflight(props.baseline, props.candidate))
const checkLabels: Record<string, string> = {
  目标资产: '测评对象',
  '测评集 ID': '测评集',
  '对象 / 评估器依赖快照完整性': '依赖定义完整性',
  '并发 / 超时 / 重试 / 采样': '执行参数',
  '资源 / 用途 / 模型': '资源配置',
  '评分阈值 / 故障模拟': '判定与执行场景',
}
function summary(label: string, run: Run, raw: string) {
  const config = run.config
  const resource = (id: string) => {
    const item = state.credentials.find((item) => item.id === id)
    return [
      { label: '资源名称', value: item?.name },
      {
        label: '使用范围',
        value: item ? (item.kind === 'public' ? '团队公共' : '本人专用') : undefined,
      },
    ]
  }
  if (label === '测评集版本') return [{ label: '发布版本', value: config.datasetVersion }]
  if (label === '评估器配置快照')
    return [
      {
        label: '评分定义数（含子项）',
        value: run.evaluators.reduce((count, item) => count + item.versions.length, 0),
      },
    ]
  if (label === '并发 / 超时 / 重试 / 采样')
    return [
      { label: '并发数', value: config.concurrency },
      { label: '超时', value: `${config.timeout} 秒` },
      { label: '重试上限', value: config.retries },
      { label: '采样率', value: `${config.sampling}%` },
    ]
  if (label === '资源 / 用途 / 模型')
    return [
      { label: '模型', value: config.model },
      {
        label: '用途',
        value: { execution: '对象执行', scoring: '评分', both: '对象执行与评分' }[
          config.resourcePurpose
        ],
      },
    ]
  if (label === '执行阶段资源') return resource(config.executionResourceId ?? config.resourceId)
  if (label === '评分阶段资源') return resource(config.scoringResourceId ?? config.resourceId)
  if (label === '评分阈值 / 故障模拟')
    return [
      { label: '通过阈值', value: config.threshold },
      {
        label: '模拟场景',
        value: {
          none: '正常执行',
          infrastructure: '基础设施故障',
          'missing-trace': '执行轨迹未采集',
          'missing-usage': 'Token 用量未采集',
        }[config.fault],
      },
    ]
  if (label === '预约时间')
    return [
      {
        label: '入队时间',
        value: config.scheduledAt ? new Date(config.scheduledAt).toLocaleString() : '立即入队',
      },
    ]
  if (label === '配置用例范围' || label === '实际用例范围') {
    const ids = label === '配置用例范围' ? config.caseIds : run.cases.map((item) => item.id)
    return [{ label: '用例数', value: ids.length }]
  }
  if (label === '输入和期望快照')
    return [
      { label: '用例数', value: run.cases.length },
      { label: '多轮用例数', value: run.cases.filter((item) => item.turns.length > 1).length },
    ]
  return [{ label: '检查记录', value: raw }]
}
</script>

<template>
  <section class="panel">
    <h2>控制变量检查</h2>
    <StatusNotice :type="result.controlled ? 'info' : 'warning'">
      {{
        result.controlled
          ? '配置与输入快照一致，可进行受控样本比较。'
          : '控制变量存在差异：仅作描述性比较，不能形成受控发布结论。'
      }}
      同一资产允许目标版本不同。人工确认配对不会改变此检查。
    </StatusNotice>
    <p>
      基线 {{ baseline.config.targetVersion }} → 候选
      {{ candidate.config.targetVersion }}；各自保留执行时快照。
    </p>
    <details :open="!result.controlled">
      <summary>
        逐项查看 {{ result.checks.filter((item) => !item.matches).length }} 项差异 /
        {{ result.checks.length }} 项检查
      </summary>
      <div class="table-scroll" tabindex="0" aria-label="控制变量检查表，可横向滚动">
        <table class="preview-table data-table">
          <thead>
            <tr>
              <th>检查项</th>
              <th>基线 A</th>
              <th>候选 B</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="check in result.checks" :key="check.label">
              <th scope="row">{{ checkLabels[check.label] ?? check.label }}</th>
              <td v-for="(run, index) in [baseline, candidate]" :key="index">
                <EntityRef
                  v-if="check.label === '目标资产'"
                  :name="run.target.name"
                  :type="run.target.type"
                  :version="run.config.targetVersion"
                  :id="run.config.targetId"
                  compact
                />
                <EntityRef
                  v-else-if="check.label === '测评集 ID'"
                  :name="
                    state.datasets.find((item) => item.id === run.config.datasetId)?.name ?? ''
                  "
                  type="测评集"
                  :version="run.config.datasetVersion"
                  :id="run.config.datasetId"
                  compact
                />
                <div v-else-if="check.label === '评估器与版本（有序）'">
                  <EntityRef
                    v-for="ref in run.config.evaluatorRefs"
                    :key="ref.id"
                    :name="run.evaluators.find((item) => item.id === ref.id)?.name ?? ''"
                    type="评估器"
                    :version="ref.version"
                    :id="ref.id"
                    compact
                  />
                </div>
                <MetadataGroup
                  v-else
                  :items="summary(check.label, run, index ? check.b : check.a)"
                />
              </td>
              <td>
                <span :class="['badge', check.matches ? 'pass' : 'review']">{{
                  check.matches ? '一致' : '不同'
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <details>
        <summary>原始检查依据（JSON，供逐字段核对）</summary>
        <JsonFallback :model-value="result.checks" readonly />
      </details>
    </details>
  </section>
</template>

<style scoped>
td {
  min-width: 150px;
  max-width: 420px;
  overflow-wrap: anywhere;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 420px;
  overflow: auto;
}
</style>
