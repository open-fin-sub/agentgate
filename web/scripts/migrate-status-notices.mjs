import fs from 'node:fs'
import path from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'

const files = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name))
        : entry.name.endsWith('.vue')
          ? [path.join(dir, entry.name)]
          : [],
    )
let count = 0
for (const file of [...files('src/pages'), ...files('src/preview')]) {
  let source = fs.readFileSync(file, 'utf8')
  const block = parseSfc(source).descriptor.template
  if (!block) continue
  const edits = []
  function visit(node) {
    if (node.type !== 1) {
      node.children?.forEach(visit)
      return
    }
    const cls = node.props.find((prop) => prop.type === 6 && prop.name === 'class')
    const classes = cls?.value?.content.split(/\s+/) ?? []
    const isAlert = node.tag === 'el-alert'
    if (isAlert || classes.includes('notice')) {
      const start = node.loc.start.offset
      const end = node.loc.end.offset
      const raw = block.content.slice(start, end)
      const openEnd = raw.indexOf('>')
      let open = raw.slice(0, openEnd + 1).replace('<' + node.tag, '<StatusNotice')
      const drops = node.props.filter(
        (prop) =>
          (prop.type === 6 && ['role', 'show-icon', 'closable'].includes(prop.name)) ||
          (prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'closable'),
      )
      for (const prop of drops) open = open.replace(prop.loc.source, '')
      if (cls) {
        const remaining = classes.filter(
          (value) => !['notice', 'warning', 'error', 'success'].includes(value),
        )
        open = open.replace(
          cls.loc.source,
          remaining.length ? `class="${remaining.join(' ')}"` : '',
        )
      }
      if (!isAlert) {
        const type = classes.find((value) => ['warning', 'error', 'success'].includes(value))
        if (type) open = open.replace('<StatusNotice', `<StatusNotice type="${type}"`)
      }
      const content = node.isSelfClosing ? '' : raw.slice(openEnd + 1, raw.lastIndexOf('</'))
      // Lists retain their list semantics inside the shared notice.
      const inner = node.tag === 'ul' ? `<ul>${content}</ul>` : content
      const replacement = node.isSelfClosing ? open : open + inner + '</StatusNotice>'
      edits.push({
        start: block.loc.start.offset + start,
        end: block.loc.start.offset + end,
        replacement,
      })
      count++
      return
    }
    node.children?.forEach(visit)
  }
  baseParse(block.content).children.forEach(visit)
  if (!edits.length) continue
  for (const edit of edits.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.replacement + source.slice(edit.end)
  if (!source.includes('import StatusNotice ')) {
    const relative = path
      .relative(path.dirname(file), 'src/components/StatusNotice.vue')
      .replaceAll('\\', '/')
    source = source.replace(
      /<script setup[^>]*>/,
      (match) =>
        `${match}\nimport StatusNotice from '${relative.startsWith('.') ? relative : './' + relative}'`,
    )
  }
  fs.writeFileSync(file, source)
}
console.log(`Migrated ${count} notices; review dynamic notice classes separately.`)
