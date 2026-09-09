import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises'
import { resolve, relative, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse } from '@vue/compiler-sfc'

const root = resolve('..')
const docs = resolve(root, 'docs/web/productization')
try {
  const existing = JSON.parse(await readFile(resolve(docs, 'usability-audit.json'), 'utf8'))
  if (existing.frozenTotal) throw new Error('台账已冻结。新问题写入JSON parkingLot；MD仅由update-usability-ledger.mjs生成。')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const artifacts = 'C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal'
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(resolve(directory, entry.name)) : resolve(directory, entry.name)))).flat()
}
const sources = (await files(resolve('src'))).filter(path => /\.(vue|ts|css)$/.test(path))
const findings = []
const pages = []
const patterns = [
  ['A-INPUT', 'A1/A4', 'P1', /JSON\.stringify|(?:输入|变量|状态|规则|期望值).*JSON|JSON.*(?:输入|变量|状态|规则)/, '默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口'],
  ['B-META', 'A2/B1/B2', 'P2', /·|(?:质量维度|问题|输出|输入|规则|期望|模型|凭据|对象|任务|版本)\s*\/\s*(?:指标|场景|工具|输出|期望|评分|状态|执行|版本|输入)|\{\{\s*(?:row|item|run|node|root)\.id\s*\}\}/, '实体或异质元数据需带维度标签并统一实体引用'],
  ['G-COPY', 'G1/G3/G4', 'P1', /尚未开放|尚不支持|未实现|当前接口|后端|前端|API|HTTP|持久化|契约|固定指纹|内容指纹|环境配置|Demo|demo|不调用|Mock CNY|费用/, '开发/实现说明改为用户任务语言，能力说明集中到能力页'],
  ['C-CONTEXT', 'C1/C2/C3', 'P1', /(?:RouterLink|router\.(?:push|replace)).*(?:cases|lineage)|(?:\/cases\/|\/lineage\?)/, '工作流下钻应复用抽屉并支持按当前过滤顺序前后查看'],
  ['D-CONTROL', 'D1/D2/D3', 'P2', /<(?:input|select|textarea)\b|size="small"/, '统一控件与尺寸、可访问名称和焦点'],
  ['G-EMPTY', 'G5/I3', 'P2', /(?:empty-state|preview-empty|el-empty)|(?:暂无|没有|无匹配|未找到).*(?:数据|记录|结果|用例|任务|版本|评估)/, '核对空态说明、可行下一步及统一模式'],
  ['I-FEEDBACK', 'I1/I2/I3/I4/I5', 'P2', /(?:@click|@confirm)="[^"]*(?:publish|remove|delete|terminate|reset)|v-if="error"|:title="error"/, '危险动作确认、行内错误、操作反馈与可取消性统一检查'],
  ['H-TERMS', 'H1/H2/H3', 'P2', /Badcase|badcase|数据集|失败用例轨迹|需人工复核|待人工复核|运行记录|LLM Judge/, '统一业务词汇与状态含义，源码标识不改业务合同'],
]
for (const path of sources) {
  const file = relative(root, path).replaceAll('\\', '/')
  const source = await readFile(path, 'utf8')
  if (path.endsWith('.vue')) {
    const { descriptor } = parse(source)
    const content = descriptor.template?.content ?? ''
    const lineOffset = (descriptor.template?.loc.start.line ?? 1) - 1
    if (/web\/src\/(pages|preview\/pages)\//.test(file)) pages.push({ file, line: 1, checks: Array(19).fill('待核验'), audience: '测评人员', task: '待逐页记录' })
    if (!file.endsWith('/CapabilityPage.vue')) {
      content.split('\n').forEach((line, index) => {
        for (const [pattern, rule, severity, match, issue] of patterns) {
          if (match.test(line)) findings.push({ pattern, rule, severity, file, line: index + lineOffset + 1, evidence: line.trim().slice(0, 230), issue, status: '待整改' })
        }
      })
      const fields = [...content.matchAll(/<el-form-item\b|class="field"/g)].length
      if (fields >= 6 && !content.includes('FormSection')) findings.push({ pattern: 'A-FORM', rule: 'A3', severity: 'P1', file, line: lineOffset + 1, evidence: `${fields} fields; no shared FormSection`, issue: '必填/可选及高级分区需要收敛', status: '待整改' })
      if (file.includes('ResourcesPage')) findings.push({ pattern: 'E-ROLE', rule: 'E1/E2', severity: 'P1', file, line: lineOffset + 1, evidence: 'resource management surface', issue: '普通用户只读摘要，管理入口复用RoleGate', status: '待整改' })
    }
  }
  if (!file.includes('/data/capabilities')) source.split('\n').forEach((line, index) => {
    if (/\bcost\b|costDelta|Cost|currency|CNY|missing-cost|币种|费率|货币|成本|费用/.test(line)) findings.push({ pattern: 'RC-TOKEN', rule: '需求变更(已拍板)', severity: 'P1', file, line: index + 1, evidence: line.trim().slice(0, 230), issue: '去除货币成本，以Token输入/输出/总量及耗时表达', status: '待整改' })
  })
}
findings.push(
  { pattern: 'RC-GENERATION', rule: '需求变更(已拍板)', severity: 'P1', file: 'web/src/preview/components/PrepDatasetPrepare.vue', line: 1, issue: '自动生成本轮延后；隐藏入口及向导，场景A改手工/导入', status: '待整改' },
  { pattern: 'D-SYSTEM', rule: 'D1/D3', severity: 'P1', file: 'web/src/App.vue', line: 1, issue: '全局ConfigProvider、状态对比度/键盘/减弱动效统一核验', status: '待整改' },
  { pattern: 'F-PAGES', rule: 'F1/F2/F3', severity: 'P1', file: 'docs/web/productization/usability-page-checklist.md', line: 1, issue: `${pages.length}页面的19项检查和场景A–G走查`, status: '待整改' },
)
findings.forEach((finding, index) => { finding.id = `UX-${String(index + 1).padStart(4, '0')}` })
await mkdir(resolve(artifacts, 'baseline'), { recursive: true })
for (const path of [...sources, resolve('package.json'), resolve('playwright.config.ts'), resolve(root, 'AGENTS.md')]) {
  const target = resolve(artifacts, 'baseline', relative(root, path))
  await mkdir(dirname(target), { recursive: true })
  await copyFile(path, target)
}
await writeFile(resolve(artifacts, 'pre-goal-status.txt'), execFileSync('git', ['status', '--porcelain=v1', '-uall'], { cwd: root }))
await writeFile(resolve(artifacts, 'audit-baseline.json'), JSON.stringify({ head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), findings, pages }, null, 2))
await writeFile(resolve(docs, 'usability-audit.json'), JSON.stringify({ findings, pages }, null, 2))
const counts = Object.fromEntries([...new Set(findings.map(x => x.pattern))].map(pattern => [pattern, findings.filter(x => x.pattern === pattern).length]))
const esc = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
await writeFile(resolve(docs, 'usability-audit.md'), `# A–I 全站可用性整改台账 WEB-UX-GOAL-001\n\n基线 9686d59。先完成静态全站定位，再逐实例核对上下文并整改；每个定位是一个可追踪实例，同一行可能同时违反多条独立模式。非缺陷须写明依据，不能因正则不再匹配而自动关闭。原始行号与原始计数保持不变，当前状态存于同名 JSON。\n\n## 授权与已拍板变更\n\n- 用户显式 Goal：逐模式设计、实施、验证与本地提交，无逐文件确认；不 push/PR/合并，不联系旧评审任务。\n- RC-01：货币成本全部移除，改为输入/输出/总 Token 与耗时；历史文档未决项由本决定覆盖。\n- RC-02：自动生成测评集本轮延后；只保留手工/导入，场景 A 第2步按新口径。\n- 真实页面只连接真实 API；缺口登记联合工作项并做用户侧降级。\n\n## 模式统计（改前）\n\n|模式类|实例数|剩余|\n|---|---:|---:|\n${Object.entries(counts).map(([key,value]) => `|${key}|${value}|${value}|`).join('\n')}\n\n## 缺陷明细\n\n|ID|文件:原始行|规则|模式类|严重度|问题|状态|\n|---|---|---|---|---|---|---|\n${findings.map(x => `|${x.id}|${x.file}:${x.line}|${x.rule}|${x.pattern}|${x.severity}|${esc(x.issue)}|${x.status}|`).join('\n')}\n\n## 当前 assumptions 与联合工作项\n\n- AS-01：不适用/执行错误保持无分数，不将待复核计作已人工复核；真实判定只使用服务返回。\n- AS-02：预约按最早入队时间；私有凭据不占公共队列但可等待执行容量；仅在Mock里演示缺失接口。\n- AS-03：合并结果仍保存并发布真实测评集版本，不新增临时领域契约。\n- AS-04：真实应用未提供角色身份接口；不得从localStorage伪造管理员权限。管理写操作默认隐藏，现有测评业务操作按现有合同保留。\n- AS-05：旧的保存视图/快捷键/三范围批量选择等不实现。已有报告/用例全页深链只作可选大空间入口。\n- J-01：评估器目录已变更，须适配新摘要与精确版本读取；真实管理/试评是否可用按实际已有HTTP边界。\n- J-02：外部执行、资源凭据、调度恢复、分析回写等需各页核对实际路由与降级，不以Mock代替。\n\n## 复用与改动保护\n\n复用当前Vue/Element Plus/router/tokens与既有API边界。goal/p1-demo的单体App仅保留输入/结果行为参照；integration/p1-new的轻根组件/路由布局思想已在本分支落地；不复制旧snapshot合同、不增兼容层或并行前端。原始源码、状态与截图存任务产物 usability-goal/baseline。AGENTS.md、原始规则与其他未认领文档修改保留在工作树，不纳入模式提交。\n`)
await writeFile(resolve(docs, 'usability-page-checklist.md'), `# 逐页检查清单\n\n${pages.length}个页面；每页对应ux-design-rules §6的19项，必须记录证据或有理由的N/A。当前均待实测，不能用单元测试替代。\n\n|页面|使用者|任务|19项状态|\n|---|---|---|---|\n${pages.map(x=>`|${x.file}|${x.audience}|${x.task}|待核验|`).join('\n')}\n`)
console.log(JSON.stringify({ files: sources.length, pages: pages.length, findings: findings.length, counts, artifacts }))
