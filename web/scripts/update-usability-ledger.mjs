import fs from 'node:fs'
import path from 'node:path'
const docs = path.resolve('../docs/web/productization')
const jsonPath = path.join(docs, 'usability-audit.json')
const audit = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const migrated = ['CaseEditor.vue', 'ExpectationEditor.vue', 'EvaluatorWorkspacePage.vue', 'CaseResultPage.vue', 'PrepEvaluatorEditor.vue', 'PrepCaseEditor.vue', 'PrepTrial.vue', 'PrepJsonImport.vue', 'AnalysisPage.vue', 'CasePage.vue', 'CompareEvidence.vue', 'TargetsPage.vue', 'AnalysisStatic.vue', 'RunPage.vue', 'RunDetailPage.vue', 'ComparePreflight.vue', 'ComparisonPage.vue']
for (const finding of audit.findings) {
  if (['A-INPUT', 'A-FORM'].includes(finding.pattern) && migrated.some(file => finding.file.endsWith('/' + file)) && finding.status === '待整改') {
    finding.status = '整改中'
    finding.resolution = '已迁移共享结构化输入或可读展示；完整页面与用户旅程验证后才关闭。'
  }
  if (finding.pattern === 'RC-TOKEN' && /concurrency/.test(finding.evidence ?? '') && !/\bcost\b|costDelta|Cost|\bcurrency\b|CNY|missing-cost|币种|费率|货币|成本|费用/.test(finding.evidence)) {
    finding.status = '非缺陷'
    finding.resolution = '原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。'
  }
}
fs.writeFileSync(jsonPath, JSON.stringify(audit, null, 2) + '\n')
const counts = [...new Set(audit.findings.map(item => item.pattern))].map(pattern => {
  const rows = audit.findings.filter(item => item.pattern === pattern)
  const remaining = rows.filter(item => !['已验证', '非缺陷', '前后端联合工作项', '后续范围'].includes(item.status)).length
  return `|${pattern}|${rows.length}|${remaining}|`
})
const escape = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
let markdown = fs.readFileSync(path.join(docs, 'usability-audit.md'), 'utf8')
markdown = markdown.replace(/\|模式类\|实例数\|剩余\|[\s\S]*?(?=\n\n## 缺陷明细)/, '|模式类|实例数|剩余|\n|---|---:|---:|\n' + counts.join('\n'))
const table = '|ID|文件:原始行|规则|模式类|严重度|问题|状态与证据|\n|---|---|---|---|---|---|---|\n' + audit.findings.map(item => `|${item.id}|${item.file}:${item.line}|${item.rule}|${item.pattern}|${item.severity}|${escape(item.issue)}|${item.status}${item.resolution ? '：' + escape(item.resolution) : ''}|`).join('\n')
markdown = markdown.replace(/\|ID\|文件:原始行\|[\s\S]*?(?=\n\n## 当前 assumptions)/, table)
fs.writeFileSync(path.join(docs, 'usability-audit.md'), markdown)
console.log(JSON.stringify({ total: audit.findings.length, statuses: Object.fromEntries([...new Set(audit.findings.map(x => x.status))].map(status => [status, audit.findings.filter(x => x.status === status).length])) }))
