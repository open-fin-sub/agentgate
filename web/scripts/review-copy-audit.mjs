import fs from 'node:fs'
import path from 'node:path'
const auditPath = '../docs/web/productization/usability-audit.json'
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
const baseline = 'C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/baseline'
const review = {
  'web/src/preview/components/PrepEvaluation.ts': ['规则必须是 JSON 对象', '规则 type 仅支持', 'applicableField 必须', '正则 pattern 必须', '正则 flags 必须', 'new RegExp(String(config.pattern)', '字段规则必须填写 path', 'operator 仅支持', '该字段规则必须填写 value', '范围比较 value', '工具规则必须填写 tool', 'required 必须', 'properties 必须', '的配置必须是对象', '仅支持 type、enum', '.enum 必须', '规则无效：', '输出不是有效 JSON', '输出应为 JSON 对象', '工具 arguments 必须'],
  'web/src/preview/components/PrepCases.ts': ['变量必须是 JSON 对象', '变量 JSON 格式错误'],
  'web/src/preview/components/PrepJsonImport.vue': ['JSON 解析失败', 'turns 必须是', '${key} 必须是字符串'],
  'web/src/preview/pages/ResourcesPage.vue': ['真实上线需要接口鉴权', '真实凭据保管服务尚未接入'],
  'web/src/preview/pages/AnalysisPage.vue': ['没有调用语义聚类服务'],
  'web/src/preview/pages/ComparisonPage.vue': ['生产统计方法及最低样本合同尚未接入'],
}
for (const [file, fragments] of Object.entries(review)) {
  const lines = fs.readFileSync(path.join(baseline, file), 'utf8').split(/\r?\n/)
  for (const fragment of fragments) {
    const line = lines.findIndex(value => value.includes(fragment)) + 1
    if (!line) throw Error(`Cannot locate baseline evidence: ${file}: ${fragment}`)
    if (audit.findings.some(item => item.file === file && item.line === line && item.pattern === 'G-COPY')) continue
    audit.findings.push({ id: `UX-${String(audit.findings.length + 1).padStart(4, '0')}`, file, line, rule: 'G1/I3', pattern: 'G-COPY', severity: 'P2', issue: '补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。', evidence: lines[line - 1].trim(), status: '整改中', resolution: '已改为表单名称、可理解原因与修正提示；待本类回归收口。' })
  }
}
for (const item of audit.findings) {
  if (item.pattern.startsWith('G-') && item.status === '待整改') {
    item.status = '整改中'
    item.resolution = '共享 EmptyState/StatusNotice 迁移与任务文案已落实，正在复验该模式。'
  }
  if (item.id === 'UX-0219') {
    item.status = '后续范围'
    item.resolution = '自动生成向导在本轮隐藏；旧链接进入手工创建。用户已拍板延后，本轮不整改隐藏的生成说明。'
  }
}
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n')
console.log(`Copy audit expanded to ${audit.findings.length} findings; G is not closed until verification.`)
