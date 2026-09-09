import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const docs = new URL('../../docs/web/productization/', import.meta.url)
const audit = JSON.parse(fs.readFileSync(new URL('usability-audit.json', docs), 'utf8'))
const closed = new Set(['已验证', '非缺陷', '前后端联合工作项', '后续范围', 'parking lot'])
const escape = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const table = (headers, rows) => [
  `|${headers.join('|')}|`, `|${headers.map(() => '---').join('|')}|`,
  ...rows.map(row => `|${row.map(escape).join('|')}|`),
].join('\n')
const patterns = [...new Set(audit.findings.map(item => item.pattern))]
const remaining = audit.findings.filter(item => !closed.has(item.status)).length
const markdown = [
  '# A–I 全站可用性整改台账 WEB-UX-GOAL-001',
  '> 由 usability-audit.json 生成；运行 node web/scripts/update-usability-ledger.mjs，禁止手工编辑此文件。',
  audit.introduction,
  '## 授权与已拍板变更', ...(audit.decisions ?? []).map(item => `- ${item}`),
  `## 模式统计\n\n冻结 ${audit.frozenTotal} 条；当前剩余 ${remaining} 条。新发现进入 parking lot，F 集中处理。`,
  table(['模式类', '实例数', '剩余'], patterns.map(pattern => {
    const rows = audit.findings.filter(item => item.pattern === pattern)
    return [pattern, rows.length, rows.filter(item => !closed.has(item.status)).length]
  })),
  '## 缺陷明细',
  table(['ID', '文件:原始行', '规则', '模式类', '严重度', '问题', '状态与证据'], audit.findings.map(item => [
    item.id, `${item.file}:${item.line}`, item.rule, item.pattern, item.severity, item.issue,
    `${item.status}${item.batchId ? `；批次 ${item.batchId}` : item.resolution ? `：${item.resolution}` : ''}`,
  ])),
  '## 批量收口记录',
  table(['批次', '模式类', '提交', '文件', '处理与验证'], (audit.batches ?? []).map(item => [
    item.id, item.pattern, item.commit, item.files.join('、'), `${item.resolution} ${item.verification}`,
  ])),
  '## Parking lot（F 处理）',
  table(['编号', '位置', '问题', '状态', '处理'], (audit.parkingLot ?? []).map(item => [item.id, item.file, item.issue, item.status, item.batchId ? `批次 ${item.batchId}` : item.resolution])),
  '## 前后端联合工作项（F 接入快照）',
  table(['编号/需求', '用户故事/场景', '当前能力与缺口', '用户影响与降级', '接口方向与验收'], (audit.jointWorkItems ?? []).map(item => [
    `${item.id} ${item.title}；${item.status}`, `${item.stories}；${item.scenarios}`,
    `已有：${item.current} 缺口：${item.missing}`, `${item.impact} 降级：${item.fallback}`,
    `拟议方向（非已实现合同）：${item.proposal} 验收：${item.acceptance}`,
  ])),
  '## 当前 assumptions 与联合工作项', ...(audit.assumptions ?? []).map(item => `- ${item}`),
  '## 复用与改动保护', audit.reuse,
].filter(Boolean).join('\n\n') + '\n'
fs.writeFileSync(new URL('usability-audit.md', docs), markdown)
console.log(JSON.stringify({ source: fileURLToPath(new URL('usability-audit.json', docs)), total: audit.findings.length, remaining, parkingLot: audit.parkingLot?.length ?? 0 }))
