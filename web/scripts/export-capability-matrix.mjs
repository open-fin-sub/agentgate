import { writeFile } from 'node:fs/promises'
import { capabilities } from '../src/data/capabilities.ts'
const escape = (value) => value.replaceAll('|', '\\|').replaceAll('\n', ' ')
const heading =
  '# 需求、故事与接入差距矩阵\n\n由 web/src/data/capabilities.ts 生成，与两种模式的“能力与接入”共用同一事实表。当前能力按 integration/backend-features 78f9dfa 核对；“当前真实能力”列标明已存在的 API，其余拟议/待扩展接口仍需确认实现。Mock 功能入口不等于真实后端交付。\n\n'
const body = capabilities
  .map(
    (c) =>
      `## ${c.id} ${c.title}\n\n| 项目 | 内容 |\n|---|---|\n${[
        ['来源', c.source],
        ['用户故事', c.stories],
        ['真实状态', c.status],
        ['当前能力', c.current],
        ['缺失能力', c.missing],
        ['使用影响', c.impact],
        ['拟议接口/字段（尚未实现）', c.proposal],
        ['真实验收条件', c.acceptance],
        ['体验路由', c.route],
        ['真实入口', c.liveRoute ?? '尚无完整真实入口'],
      ]
        .map(([k, v]) => `| ${k} | ${escape(v)} |`)
        .join('\n')}\n`,
  )
  .join('\n')
await writeFile(
  new URL('../../docs/web/productization/capability-contract-matrix.md', import.meta.url),
  heading + body,
)
console.log(
  `Exported ${capabilities.length} requirements, including ${capabilities.filter((c) => c.id.startsWith('FR-')).length} customer FRs.`,
)
