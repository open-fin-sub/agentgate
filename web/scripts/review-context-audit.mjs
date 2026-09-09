import fs from 'node:fs'
import path from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
const auditPath = '../docs/web/productization/usability-audit.json'
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
const baseline = 'C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/baseline'
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : entry.name.endsWith('.vue') ? [path.join(dir, entry.name)] : [])
let added = 0
for (const absolute of [...files(path.join(baseline, 'web/src/pages')), ...files(path.join(baseline, 'web/src/preview'))]) {
  const file = path.relative(baseline, absolute).replaceAll('\\', '/')
  const source = fs.readFileSync(absolute, 'utf8')
  const block = parseSfc(source).descriptor.template
  if (!block) continue
  function visit(node) {
    if (node.type === 1 && node.tag === 'RouterLink') {
      const to = node.props.find(prop => prop.type === 7 && prop.arg?.content === 'to')?.exp?.content ?? ''
      const drill = to.includes("path: '/lineage'") || (to.includes("path: '/datasets'") && node.loc.source.includes('查看发布版本')) || /(?:evidence|caseLink)\(/.test(to) || /\/preview\/(targets|datasets|evaluators)\/(?:\$\{|['"]\s*\+)/.test(to) || /path:.*\/cases\//.test(to)
      if (drill) {
        const line = block.loc.start.line + node.loc.start.line - 1
        const end = block.loc.start.line + node.loc.end.line - 1
        if (!audit.findings.some(item => item.pattern === 'C-CONTEXT' && item.file === file && item.line >= line && item.line <= end)) {
          audit.findings.push({ id: `UX-${String(audit.findings.length + 1).padStart(4, '0')}`, file, line, rule: 'C1/C2/C3', pattern: 'C-CONTEXT', severity: 'P1', issue: '补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。', evidence: node.loc.source.replace(/\s+/g, ' '), status: '整改中', resolution: '已迁入共享抽屉并复用现有详情，待完整回归与返回位置验证。' })
          added++
        }
      }
    }
    node.children?.forEach(visit)
  }
  baseParse(block.content).children.forEach(visit)
}
for (const item of audit.findings) if (item.pattern === 'C-CONTEXT' && item.status === '待整改') item.status = '整改中'
for (const finding of [
  { file: 'web/src/preview/pages/CasePage.vue', line: 71, issue: '补查：证据全页的返回固定指向报告，丢失分析或对比来源。', evidence: 'reportLink 固定构造 /preview/runs/:id，未读取 returnTo。', resolution: '使用校验后的来源路径返回，外部地址退回原报告；context.spec.ts 来源返回测试桌面/手机2项通过。' },
  { file: 'web/src/router/index.ts', line: 4, issue: '补查：点击返回链接按新导航回到顶部，异步报告恢复时丢失阅读位置。', evidence: 'scrollBehavior 对路径变化固定返回 { top: 0 }。', resolution: '会话内保留最近50个路径滚动位置，等待异步内容撑开页面再恢复；用户滚动或新导航中断恢复。context.spec.ts 滚动返回桌面/手机2项通过。' },
]) {
  if (!audit.findings.some(item => item.issue === finding.issue)) {
    audit.findings.push({ id: `UX-${String(audit.findings.length + 1).padStart(4, '0')}`, pattern: 'C-CONTEXT', rule: 'C3/I5', severity: 'P1', status: '已验证', ...finding })
    added++
  }
}
for (const finding of [
  { file: 'web/src/pages/RunCreatePage.vue', line: 184, issue: '补查：从资产或历史报告进入创建任务后，返回入口固定去任务列表，未保留实际来源。', evidence: '<RouterLink class="back-link" to="/runs">← 测评任务</RouterLink>' },
  { file: 'web/src/preview/pages/RunCreatePage.vue', line: 299, issue: '补查：体验创建任务的返回固定去任务列表，未表达原资产或报告来源。', evidence: '<RouterLink class="back-link" to="/preview/runs">← 测评任务</RouterLink>' },
  { file: 'web/src/pages/DatasetWorkspace.vue', line: 59, issue: '补查：测评集工作区进入创建任务时未携带当前用例位置；创建页编辑往返的用户配置保留仍需补齐。', evidence: 'createLink 只带 dataset/version/source；编辑返回创建页重新初始化本地配置。' },
]) {
  if (!audit.findings.some(item => item.issue === finding.issue)) {
    audit.findings.push({ id: `UX-${String(audit.findings.length + 1).padStart(4, '0')}`, pattern: 'C-CONTEXT', rule: 'C3/I5', severity: 'P1', status: '整改中', resolution: '独立任务往返扩查发现，需共享来源返回与前端填写状态保留；尚未收口。', ...finding })
    added++
  }
}
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n')
console.log(`Added ${added} context findings; total ${audit.findings.length}.`)
