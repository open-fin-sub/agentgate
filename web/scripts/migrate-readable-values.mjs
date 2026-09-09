import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve('src')
const valueFiles = ['preview/pages/AnalysisPage.vue', 'preview/pages/CasePage.vue', 'preview/pages/TargetsPage.vue', 'preview/components/CompareEvidence.vue']
for (const file of valueFiles) {
  const full = path.join(root, file)
  let source = fs.readFileSync(full, 'utf8')
  source = source.replace(/<pre(?: class="[^"]*")?>\{\{\s*([\s\S]*?)\s*\}\}<\/pre>/g, (_, expression) => `<ValueView :value="${expression.replaceAll('"', '&quot;')}" />`)
  source = source.replace('<script setup lang="ts">', '<script setup lang="ts">\nimport ValueView from \'../../components/ValueView.vue\'')
  fs.writeFileSync(full, source)
}
for (const file of ['preview/components/ComparePreflight.vue', 'preview/pages/ComparisonPage.vue', 'preview/pages/RunPage.vue', 'preview/components/AnalysisStatic.vue', 'pages/RunDetailPage.vue']) {
  const full = path.join(root, file)
  let source = fs.readFileSync(full, 'utf8')
  source = source.replace(/<pre class="code-view">\{\{\s*JSON\.stringify\(([\s\S]*?),\s*null,\s*2,?\s*\)\s*\}\}<\/pre>/g, (_, expression) => `<JsonFallback :model-value="${expression.trim().replaceAll('"', '&quot;')}" readonly />`)
  const relative = file.startsWith('preview/') ? '../../' : '../'
  source = source.replace('<script setup lang="ts">', `<script setup lang="ts">\nimport JsonFallback from '${relative}components/JsonFallback.vue'`)
  if (file.endsWith('AnalysisStatic.vue')) {
    source = source.replace('<pre class="code-view">{{ risk.fragment }}</pre>', '<ValueView :value="risk.fragment" />')
    source = source.replace('<script setup lang="ts">', `<script setup lang="ts">\nimport ValueView from '${relative}components/ValueView.vue'`)
  }
  fs.writeFileSync(full, source)
}
