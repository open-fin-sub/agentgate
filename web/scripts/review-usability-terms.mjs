import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'

const web = fileURLToPath(new URL('../', import.meta.url))
const apply = process.argv.includes('--apply')
const words = { Case: '用例', Trace: '执行轨迹', Prompt: '提示词', LLM: '大模型', Badcase: '问题用例' }
const files = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)],
)
const candidates = []
for (const file of [...files(path.join(web, 'src/pages')), ...files(path.join(web, 'src/preview'))]) {
  if (!file.endsWith('.vue') || file.endsWith('PrepDatasetPrepare.vue')) continue
  const original = fs.readFileSync(file, 'utf8')
  const template = parse(original).descriptor.template
  if (!template) continue
  const nextTemplate = template.content.replace(/\b(Case|Trace|Prompt|LLM|Badcase)\b/g, term => words[term])
    .replaceAll('大模型 评分', '大模型评分').replaceAll('评分 提示词', '评分提示词')
    .replaceAll('执行 执行轨迹', '执行轨迹').replaceAll('执行轨迹 缺失', '执行轨迹缺失')
    .replaceAll('平均 用例', '平均用例').replaceAll('用例 分数', '用例分数')
    .replaceAll('用例 通过率', '用例通过率').replaceAll('提示词 快照', '提示词快照')
  if (nextTemplate === template.content) continue
  candidates.push({ file: path.relative(web, file).replaceAll('\\', '/'), terms: [...new Set(template.content.match(/\b(Case|Trace|Prompt|LLM|Badcase)\b/g))] })
  if (apply) fs.writeFileSync(file, original.slice(0, template.loc.start.offset) + nextTemplate + original.slice(template.loc.end.offset))
}
console.log(JSON.stringify({ mode: apply ? 'apply reviewed glossary' : 'candidates only', candidates }, null, 2))
