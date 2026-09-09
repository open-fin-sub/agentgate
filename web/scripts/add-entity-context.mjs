import fs from 'node:fs'
for (const name of ['TargetsPage', 'DatasetsPage', 'EvaluatorsPage']) {
  const file = `src/preview/pages/${name}.vue`
  let source = fs.readFileSync(file, 'utf8')
  if (source.includes('const pageQuery =')) throw Error(`${name} already has explicit context`)
  const end = source.indexOf('</script>')
  source = source.slice(0, end).replaceAll('route.query', 'pageQuery.value') + source.slice(end).replaceAll('route.query', 'pageQuery')
  source = source.replace('<script setup lang="ts">', `<script setup lang="ts">\nimport type { LocationQuery, LocationQueryRaw } from 'vue-router'`)
  source = source.replace("const id = computed(() => String(route.params.id ?? ''))", `const props = defineProps<{ context?: { id: string; query: LocationQuery } }>()
const emit = defineEmits<{ 'change-query': [query: LocationQuery] }>()
const pageQuery = computed(() => props.context?.query ?? route.query)
const id = computed(() => props.context?.id ?? String(route.params.id ?? ''))
function applyQuery(query: LocationQueryRaw, replace = false) {
  if (props.context) emit('change-query', router.resolve({ path: '/preview/${name === 'TargetsPage' ? 'targets' : name === 'DatasetsPage' ? 'datasets' : 'evaluators'}/' + encodeURIComponent(id.value), query }).query)
  else void router[replace ? 'replace' : 'push']({ query })
}`)
  source = source.replaceAll("void router.push({ query: { ...pageQuery.value, draft: '1' } })", "applyQuery({ ...pageQuery.value, draft: '1' })")
  source = source.replaceAll("void router.replace({ query: { ...pageQuery.value, version: String(number), draft: undefined } })", "applyQuery({ ...pageQuery.value, version: String(number), draft: undefined }, true)")
  source = source.replaceAll("void router.push({ query: { ...pageQuery.value, version: value, draft: undefined } })", "applyQuery({ ...pageQuery.value, version: value, draft: undefined })")
  source = source.replaceAll("void router.push({ query: { ...pageQuery.value, version: value } })", "applyQuery({ ...pageQuery.value, version: value })")
  source = source.replaceAll("void router.replace({ query: { ...pageQuery.value, version: value } })", "applyQuery({ ...pageQuery.value, version: value }, true)")
  source = source.replace('function selectVersion(value: string) {', 'async function selectVersion(value: string) {\n  if (props.context && !(await guard())) return')
  source = source.replace('onBeforeRouteLeave(guard)', 'defineExpose({ beforeClose: guard })\nonBeforeRouteLeave(guard)')
  source = source.replace('v-if="id" to="/preview/targets"', 'v-if="id && !context" to="/preview/targets"')
  source = source.replace('v-if="id || pageQuery.mode" to="/preview/datasets"', 'v-if="!context && (id || pageQuery.mode)" to="/preview/datasets"')
  source = source.replace('v-if="id || creating" to="/preview/evaluators"', 'v-if="!context && (id || creating)" to="/preview/evaluators"')
  fs.writeFileSync(file, source)
}
