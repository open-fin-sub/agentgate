import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve('src')
function edit(file, changes) {
  const full = path.join(root, file)
  let source = fs.readFileSync(full, 'utf8')
  for (const [from, to] of changes) source = source.replaceAll(from, to)
  fs.writeFileSync(full, source)
}
edit('preview/types.ts', [['missing-cost','missing-usage'], ['  cost: number | null', '  inputTokens: number | null\n  outputTokens: number | null'], ["| 'cost'", "| 'tokens'"]])
edit('preview/execution.ts', [['missing-cost','missing-usage'], [/    cost: missing[^\n]+/g, '    inputTokens: missing ? null : 240 + index * 13,\n    outputTokens: missing ? null : 160 + index * 10,']])
edit('preview/comparison.ts', [
  ["cost: { label: '平均单例成本', direction: 'lower', unit: 'Mock CNY' }", "tokens: { label: '平均单例 Token 用量', direction: 'lower', unit: 'Token' }"],
  ["'cost'", "'tokens'"], ["    cost: average('tokens')", "    tokens: average('tokens')"],
  ["metric === 'tokens' ? 4", "metric === 'tokens' ? 1"], ["' Mock CNY'", "' Token'"],
  ["{ metric: 'tokens', operator: '<=', threshold: 0.1 }", "{ metric: 'tokens', operator: '<=', threshold: 2000 }"],
])
edit('preview/components/RunSupport.ts', [
  ['costText','tokenText'], ["value == null ? '缺失' : `¥${value.toFixed(4)}`", "value == null ? '未采集' : value.toLocaleString()"],
  ['costMissing','tokensMissing'], ['item.cost','item.tokens'], ['    cost:', '    tokens:'],
  ['    latency: latencies.length', "    inputTokens: !results.length || results.some(item => item.inputTokens == null) ? null : results.reduce((sum, item) => sum + item.inputTokens!, 0),\n    outputTokens: !results.length || results.some(item => item.outputTokens == null) ? null : results.reduce((sum, item) => sum + item.outputTokens!, 0),\n    latency: latencies.length"],
])
edit('preview/pages/RunPage.vue', [
  ['costText','tokenText'], ['metrics.costMissing','metrics.tokensMissing'], ['metrics.cost','metrics.tokens'], ['row.result?.cost','row.result?.tokens'],
  ['Mock 总成本','总 Token 用量'], ['条成本缺失','条用量未采集'], ['缺失成本不填零','未采集用量不填零'], ['生产质量或费用承诺','生产质量结论'], ['<th>成本</th>','<th>Token 用量</th>'],
])
edit('preview/pages/CasePage.vue', [['  costText,\r\n',''], ['  costText,\n',''], [/        <p class="muted small">\s*耗时：[\s\S]*?costText\(result.cost\)[\s\S]*?<\/p>/g, '<TokenUsage :input="result.inputTokens" :output="result.outputTokens" :total="result.tokens" :latency="result.latency" scope="本条用例" />'], ['<script setup lang="ts">', "<script setup lang=\"ts\">\nimport TokenUsage from '../../components/TokenUsage.vue'"]])
edit('preview/components/CompareEvidence.vue', [["Token {{ result.tokens ?? '未采集' }} · {{ formatMetric('cost', result.cost) }}", "Token 用量 {{ result.tokens ?? '未采集' }}"]])
for (const file of ['preview/pages/RunCreatePage.vue', 'preview/components/CompareCreate.vue', 'preview/components/ComparePreflight.vue']) edit(file, [['missing-cost','missing-usage'], ['未采集成本 / 耗时','未采集 Token 用量与耗时'], ['成本缺失','Token 用量未采集'], ['成本未采集','Token 用量未采集']])
edit('preview/components/AnalysisSuggestion.vue', [[/平均成本 ≤ 0.1\s*Mock CNY/g, '平均单例 Token 用量 ≤ 2000']])
edit('pages/RunCreatePage.vue', [['评分调用可能产生费用并返回非确定性结果','同一输入的评分可能存在差异']])
edit('pages/RunDetailPage.vue', [['成本 / Token','Token 用量']])
edit('data/capabilities.ts', [['大批量成本','大批量 Token 用量'], ['或真实费用',''], ['Token/成本来源','Token 来源'], ['缺成本/Trace','缺用量/Trace'], ['性能和成本','性能和 Token 用量']])
