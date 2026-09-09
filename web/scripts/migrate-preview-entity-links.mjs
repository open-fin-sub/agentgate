import fs from 'node:fs'
import path from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : entry.name.endsWith('.vue') ? [path.join(dir, entry.name)] : [])
let count = 0
for (const file of files('src/preview')) {
  if (file.endsWith('EntityLink.vue')) continue
  let source = fs.readFileSync(file, 'utf8')
  const block = parseSfc(source).descriptor.template
  if (!block) continue
  const edits = []
  function visit(node) {
    if (node.type === 1 && node.tag === 'RouterLink' && node.props.some(prop => prop.type === 7 && prop.arg?.content === 'to' && /\/preview\/(targets|datasets|evaluators)\/(?:\$\{|['"]\s*\+)/.test(prop.exp?.content))) {
      edits.push({ start: block.loc.start.offset + node.loc.start.offset, end: block.loc.start.offset + node.loc.end.offset, text: node.loc.source.replace('<RouterLink', '<EntityLink').replace('</RouterLink', '</EntityLink') })
      count++
    } else node.children?.forEach(visit)
  }
  baseParse(block.content).children.forEach(visit)
  if (!edits.length) continue
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  let relative = path.relative(path.dirname(file), 'src/preview/components/EntityLink.vue').replaceAll('\\', '/')
  if (!relative.startsWith('.')) relative = './' + relative
  if (!source.includes('import EntityLink ')) source = source.replace('<script setup lang="ts">', `<script setup lang="ts">\nimport EntityLink from '${relative}'`)
  fs.writeFileSync(file, source)
}
console.log(`Migrated ${count} asset detail entries; creation and revision tasks stay independent.`)
