import fs from 'node:fs'
import path from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : entry.name.endsWith('.vue') ? [path.join(dir, entry.name)] : [])
for (const file of [...files('src/pages'), ...files('src/preview')]) {
  const block = parseSfc(fs.readFileSync(file, 'utf8')).descriptor.template
  if (!block) continue
  let index = 0
  function visit(node) {
    if (node.type === 1 && (node.tag === 'el-empty' || node.props.some(prop => prop.type === 6 && prop.name === 'class' && /\b(empty-state|preview-empty)\b/.test(prop.value?.content)))) {
      console.log(`${file.replaceAll('\\', '/')}#${index++} ${node.loc.source.replace(/\s+/g, ' ')}`)
      return
    }
    node.children?.forEach(visit)
  }
  baseParse(block.content).children.forEach(visit)
}
