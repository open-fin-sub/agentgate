import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : entry.name.endsWith('.vue') ? [path.join(dir, entry.name)] : [])
let total = 0
for (const file of files('src/preview')) {
  const source = fs.readFileSync(file, 'utf8')
  const template = parse(source).descriptor.template
  if (!template) continue
  const edits = []
  function visit(node) {
    if (node.type === 1 && node.tag === 'EntityLink' && !node.props.some(prop => prop.name === 'context-key')) {
      edits.push({ offset: template.loc.start.offset + node.loc.start.offset + '<EntityLink'.length, text: ` context-key="${file.replaceAll('\\', '/')}:${node.loc.start.line}"` })
    }
    node.children?.forEach(visit)
  }
  baseParse(template.content).children.forEach(visit)
  let next = source
  for (const edit of edits.sort((a, b) => b.offset - a.offset)) next = next.slice(0, edit.offset) + edit.text + next.slice(edit.offset)
  if (edits.length) fs.writeFileSync(file, next)
  total += edits.length
}
console.log(`Assigned ${total} stable asset entry identities.`)
