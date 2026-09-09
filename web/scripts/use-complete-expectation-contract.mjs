import fs from 'node:fs'
const file = 'src/api/datasets.ts'
let source = fs.readFileSync(file, 'utf8')
source = source.replace(/  CaseTurn,\r?\n|  Condition,\r?\n|  Expectation,\r?\n/g, '')
const start = source.indexOf('interface ApiExpectationBase')
const end = source.indexOf('export const datasetApi', start)
if (start < 0 || end < 0) throw new Error('Expected projection boundary')
source = source.slice(0, start) + source.slice(end)
source = source.replaceAll('ApiDatasetMutation', 'DatasetMutation').replaceAll('ApiDatasetDetail', 'DatasetDetail').replaceAll('ApiDatasetVersion', 'DatasetVersion')
source = source.replace(/\.then\(\(result\) => \(\{ \.\.\.result, draft: toEditorVersion\(result.draft\) \}\)\)/g, '')
source = source.replace(/\.then\(\(result\) => \(\{\s*\.\.\.result,\s*versions: result.versions.map\(toEditorVersion\),\s*\}\)\)/g, '')
source = source.replace(/\.then\(\(versions\) =>\s*versions.map\(toEditorVersion\),\s*\)/g, '')
source = source.replace(/\.then\(\s*toEditorVersion,?\s*\)/g, '')
source = source.replaceAll('JSON.stringify(toApiCase(item))', 'JSON.stringify(item)')
fs.writeFileSync(file, source)
for (const file of ['src/components/dataset/CaseEditor.vue', 'src/pages/DatasetWorkspace.vue']) {
  let source = fs.readFileSync(file, 'utf8')
  source = source.replace(/^\s*(?:expected_skill|required_tools|forbidden_tools|policy_rules):[^\n]+\n/gm, '')
  if (file.endsWith('CaseEditor.vue')) {
    const start = source.indexOf('<FormSection\n            title="路由与工具要求"')
    const crlfStart = source.indexOf('<FormSection\r\n            title="路由与工具要求"')
    const begin = start >= 0 ? start : crlfStart
    const end = source.indexOf('</FormSection', begin)
    if (begin < 0 || end < 0) throw new Error('Expected route form')
    source = source.slice(0, begin) + '<FormSection title="本轮备注" optional><el-form-item label="备注"><el-input v-model="turn.notes" /></el-form-item>' + source.slice(end)
  }
  fs.writeFileSync(file, source)
}
