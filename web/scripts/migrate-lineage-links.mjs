import fs from 'node:fs'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
let count = 0
for (const name of fs.readdirSync('src/pages').filter(name => name.endsWith('.vue'))) {
  const file = `src/pages/${name}`
  let source = fs.readFileSync(file, 'utf8')
  const block = parseSfc(source).descriptor.template
  if (!block) continue
  const edits = []
  function visit(node) {
    if (node.type === 1 && node.tag === 'RouterLink' && node.props.some(prop => prop.type === 7 && prop.arg?.content === 'to' && prop.exp?.content.includes("path: '/lineage'"))) {
      edits.push({ start: block.loc.start.offset + node.loc.start.offset, end: block.loc.start.offset + node.loc.end.offset, text: node.loc.source.replace('<RouterLink', '<LineageLink').replace('</RouterLink', '</LineageLink') })
      count++
    } else node.children?.forEach(visit)
  }
  baseParse(block.content).children.forEach(visit)
  if (!edits.length) continue
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  source = source.replace('<script setup lang="ts">', '<script setup lang="ts">\nimport LineageLink from \'../components/LineageLink.vue\'')
  fs.writeFileSync(file, source)
}
console.log(`Migrated ${count} lineage drill-down entries.`)
