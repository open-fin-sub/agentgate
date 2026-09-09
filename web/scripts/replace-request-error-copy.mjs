import fs from 'node:fs'
import path from 'node:path'
for (const name of fs.readdirSync('src/pages')) {
  if (!name.endsWith('.vue') || name === 'CapabilityPage.vue') continue
  const file = path.join('src/pages', name)
  let source = fs.readFileSync(file, 'utf8')
  if (!/String\(e\)/.test(source)) continue
  source = source.replaceAll('String(e)', 'userError(e)')
  source = source.replace('<script setup lang="ts">', '<script setup lang="ts">\nimport { userError } from \'../apiErrors\'')
  fs.writeFileSync(file, source)
}
