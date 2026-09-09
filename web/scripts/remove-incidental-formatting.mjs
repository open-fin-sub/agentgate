import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import prettier from 'prettier'
const files = execFileSync('git', ['diff', '--name-only', '--', 'src'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
let restored = 0
for (const gitPath of files) {
  const file = gitPath.replace(/^web\//, '')
  const before = execFileSync('git', ['show', `HEAD:${gitPath}`], { encoding: 'utf8' })
  const after = fs.readFileSync(file, 'utf8')
  const options = { ...(await prettier.resolveConfig(file)), filepath: file }
  if (await prettier.format(before, options) === await prettier.format(after, options)) {
    fs.writeFileSync(file, before)
    restored++
  }
}
console.log(`Removed formatter-only changes from ${restored} files; semantic changes preserved.`)
