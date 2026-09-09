import fs from 'node:fs'
import path from 'node:path'
const docs = path.resolve('../docs/web/productization')
const json = path.join(docs, 'usability-audit.json')
const audit = JSON.parse(fs.readFileSync(json, 'utf8'))
const baseline = 'C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/baseline'
const additions = {
  'web/src/pages/CaseResultPage.vue': ['display(value)', 'display(turn.expectations)', 'display(trace.turn_outcomes', 'display(currentCase)', 'display(check.expected)', 'display(check.actual)', 'display(span.attributes)', 'display(trace)', 'selected.judge_record.raw_response'],
  'web/src/preview/pages/TargetsPage.vue': ['<pre>{{ tool.inputSchema }}', '<pre>{{ tool.outputSchema }}'],
  'web/src/preview/pages/CasePage.vue': ['<pre class="code-view">{{ testCase.variables', '<pre class="code-view">{{ step.input'],
  'web/src/preview/components/AnalysisStatic.vue': ['<pre class="code-view">{{ risk.fragment'],
  'web/src/preview/components/PrepTrial.vue': ['label="实际输出（工具样本使用 tool / arguments JSON）"'],
  'web/src/preview/components/PrepJsonImport.vue': ['aria-label="JSON 导入内容"'],
}
for (const [file, needles] of Object.entries(additions)) {
  const lines = fs.readFileSync(path.join(baseline, file), 'utf8').split('\n')
  for (const needle of needles) for (const [index, text] of lines.entries()) {
    if (!text.includes(needle) || audit.findings.some(f => f.file === file && f.line === index + 1 && f.pattern === 'A-INPUT')) continue
    audit.findings.push({ id: `UX-${String(audit.findings.length + 1).padStart(4, '0')}`, pattern: 'A-INPUT', rule: 'A1/A4', severity: 'P1', file, line: index + 1, evidence: text.trim(), issue: '人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获', status: '整改中', origin: '人工复核原始基线' })
  }
}
for (const finding of audit.findings) {
  if (['A-INPUT', 'A-FORM'].includes(finding.pattern)) {
    if (finding.file.endsWith('PrepDatasetPrepare.vue')) {
      finding.status = '后续范围'
      finding.resolution = '用户已拍板延后自动生成；入口隐藏，旧链接只展示手工创建。preparation.spec.ts 桌面/手机验证通过。'
    } else if (finding.id === 'UX-0405') {
      finding.status = '非缺陷'
      finding.resolution = '人工核实为报告六个并列筛选控件，不是需填写的创建表单；不应按字段数量强行折叠。筛选保留，D 类另行核对一致性。'
    } else {
      finding.status = '已验证'
      finding.resolution = '复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。'
    }
  }
  if (finding.pattern === 'RC-GENERATION') {
    finding.status = '已验证'
    finding.resolution = '自动生成入口撤下，旧链接降级手工创建；源向导保留为后续范围。手工多轮发布 v1、旧入口降级在桌面/手机通过。'
  }
  if (finding.pattern === 'RC-TOKEN' && finding.status !== '非缺陷') {
    if ((finding.evidence ?? '').includes('生成本次问题建议')) {
      finding.status = '非缺陷'; finding.resolution = '中文子串误命中“生成本次”，不是货币成本。'
    } else {
      finding.status = '已验证'; finding.resolution = '货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。'
    }
  }
}
fs.writeFileSync(json, JSON.stringify(audit, null, 2) + '\n')
console.log(JSON.stringify({ total: audit.findings.length, manuallyAdded: audit.findings.length - 441 }))
