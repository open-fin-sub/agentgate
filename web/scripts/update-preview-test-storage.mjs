import fs from 'node:fs'
import path from 'node:path'
for (const name of fs.readdirSync('tests/preview')) {
  if (!name.endsWith('.ts')) continue
  const file = path.join('tests/preview', name)
  const source = fs.readFileSync(file, 'utf8')
  if (source.includes('agentgate.preview.v1')) fs.writeFileSync(file, source.replaceAll('agentgate.preview.v1', 'agentgate.preview.v2'))
}
