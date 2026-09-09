<script setup lang="ts">
import JsonFallback from '../../components/JsonFallback.vue'
import { computed } from 'vue'
import type { Run } from '../types'
import { preflight } from '../comparison'
import { usePreview } from '../workspace'
const props = defineProps<{ baseline: Run; candidate: Run }>()
const { state } = usePreview()
const result = computed(() => preflight(props.baseline, props.candidate))
function summary(label: string, run: Run, raw: string) {
  const config = run.config
  const resource = (id: string) => {
    const item = state.credentials.find((item) => item.id === id)
    return item
      ? `${item.name}（${item.kind === 'public' ? '公共' : '私有'}）`
      : `${id}（目录中缺失）`
  }
  if (label === '目标资产') return `${run.target.name}（${run.target.type}）`
  if (label === '测评集 ID')
    return `${state.datasets.find((item) => item.id === config.datasetId)?.name ?? config.datasetId} · ${config.datasetId}`
  if (label === '测评集版本') return `发布版本 v${config.datasetVersion}`
  if (label === '评估器与版本（有序）')
    return config.evaluatorRefs
      .map(
        (ref) =>
          `${run.evaluators.find((item) => item.id === ref.id)?.name ?? ref.id} v${ref.version}`,
      )
      .join(' → ')
  if (label === '评估器配置快照')
    return `${run.evaluators.reduce((count, item) => count + item.versions.length, 0)} 份评分定义（含子项），核对规则、模型、权重与阈值`
  if (label === '并发 / 超时 / 重试 / 采样')
    return `并发 ${config.concurrency} · 超时 ${config.timeout} 秒 · 重试 ${config.retries} 次 · 采样 ${config.sampling}%`
  if (label === '资源 / 用途 / 模型')
    return `执行模型：${config.model}；调用资源按下方执行、评分两个阶段分别核对`
  if (label === '执行阶段资源') return resource(config.executionResourceId ?? config.resourceId)
  if (label === '评分阶段资源') return resource(config.scoringResourceId ?? config.resourceId)
  if (label === '评分阈值 / 故障模拟')
    return `通过阈值 ${config.threshold} · ${{ none: '正常执行', infrastructure: '基础设施故障', 'missing-trace': 'Trace 未采集', 'missing-usage': 'Token 用量未采集' }[config.fault]}`
  if (label === '预约时间')
    return config.scheduledAt ? new Date(config.scheduledAt).toLocaleString() : '立即执行'
  if (label === '配置用例范围' || label === '实际用例范围') {
    const ids = label === '配置用例范围' ? config.caseIds : run.cases.map((item) => item.id)
    return `${ids.length} 条 · ${ids.slice(0, 3).join('、')}${ids.length > 3 ? '等' : ''}`
  }
  if (label === '输入和期望快照')
    return `${run.cases.length} 条用例，${run.cases.filter((item) => item.turns.length > 1).length} 条多轮；核对输入、各轮期望、变量及文件`
  return raw
}
</script>

<template>
  <section class="panel">
    <h2>控制变量检查</h2>
    <p :class="['notice', { warning: !result.controlled }]">
      {{
        result.controlled
          ? '配置与输入快照一致，可进行受控样本比较。'
          : '控制变量存在差异：仅作描述性比较，不能形成受控发布结论。'
      }}
      同一资产允许目标版本不同。人工确认配对不会改变此检查。
    </p>
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
              <th scope="row">{{ check.label }}</th>
              <td>{{ summary(check.label, baseline, check.a) }}</td>
              <td>{{ summary(check.label, candidate, check.b) }}</td>
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
