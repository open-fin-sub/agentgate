import assert from 'node:assert/strict'
import { test } from '@playwright/test'
import { createSeed } from '../../src/preview/seed'
import { completeRun, buildRun } from '../../src/preview/execution'
import {
  comparisonConclusion,
  defaultGateRules,
  executionIssues,
  formatMetric,
  measureGates,
  metricChange,
  mockStatistics,
  pairSamples,
  preflight,
  runMetrics,
} from '../../src/preview/comparison'
import {
  definitionEvidence,
  definitionRisks,
} from '../../src/preview/components/AnalysisDefinition'
const copy = (value) => JSON.parse(JSON.stringify(value))
function fixture() {
  const state = createSeed()
  return {
    state,
    a: state.runs.find((item) => item.id === 'run-baseline'),
    b: state.runs.find((item) => item.id === 'run-candidate'),
    changed: state.runs.find((item) => item.id === 'run-changed'),
  }
}

test('same asset versions are comparable; dataset revisions stay descriptive', () => {
  const { a, b, changed } = fixture()
  assert.equal(preflight(a, b).controlled, true)
  assert.equal(preflight(a, changed).controlled, false)
  assert.equal(comparisonConclusion(a, changed, defaultGateRules(), 'sufficient'), '仅描述性比较')
})
test('both execution and scoring resources are control variables', () => {
  const { a, b } = fixture()
  for (const field of ['executionResourceId', 'scoringResourceId']) {
    const candidate = copy(b)
    candidate.config[field] = 'private-model'
    assert.equal(preflight(a, candidate).controlled, false, field)
  }
})
test('preflight sees evaluator dependency snapshots and missing snapshots', () => {
  const { a, b } = fixture()
  const candidate = copy(b)
  candidate.evaluators[0].versions[0].threshold = 0.91
  assert.equal(preflight(a, candidate).controlled, false)
  a.evaluators = []
  b.evaluators = []
  assert.equal(preflight(a, b).controlled, false)
})
test('pairing preserves changes, additions, deletions and execution errors', () => {
  const { a, b, changed } = fixture()
  const pairs = pairSamples(a, b)
  assert.deepEqual(
    pairs.filter((item) => item.kind === 'improved').map((item) => item.id),
    ['case-02', 'case-03', 'case-07'],
  )
  assert.equal(pairs.find((item) => item.id === 'case-05').kind, 'sharedfail')
  assert.equal(pairs.find((item) => item.id === 'case-11').kind, 'error')
  const changedPairs = pairSamples(a, changed)
  assert.equal(changedPairs.find((item) => item.id === 'case-01').kind, 'unpaired')
  assert.equal(changedPairs.find((item) => item.id === 'case-12').kind, 'onlyA')
  assert.equal(changedPairs.find((item) => item.id === 'case-13').kind, 'onlyB')
})
test('pass rate uses applicable cases and usage uses the shared Token unit', () => {
  const { a } = fixture()
  const applicable = a.results.filter((item) => ['pass', 'fail', 'review'].includes(item.outcome))
  assert.equal(
    runMetrics(a).passRate.value,
    applicable.filter((item) => item.outcome === 'pass').length / applicable.length,
  )
  assert.equal(
    runMetrics(a).errorRate.value,
    a.results.filter((item) => item.outcome === 'error').length / a.results.length,
  )
  assert.match(formatMetric('tokens', 2000), /2000.0 Token/)
  assert.match(formatMetric('passRate', 0.1, true), /10.0 个百分点/)
})
test('metric directions distinguish quality from token usage and latency', () => {
  assert.equal(metricChange('score', 0.7, 0.8).label, '改善')
  assert.equal(metricChange('tokens', 3000, 2000).label, '改善')
  assert.equal(metricChange('latency', 800, 1200).label, '退化')
  assert.equal(metricChange('tokens', null, 0).label, '证据不足')
})
test('missing metrics never become zero or pass under a sufficient Mock response', () => {
  const { a, b } = fixture()
  b.results.forEach((item) => {
    item.tokens = null
  })
  assert.equal(runMetrics(b).tokens.value, null)
  assert.equal(
    measureGates(a, b, [{ metric: 'tokens', operator: '<=', threshold: 2000 }])[0].status,
    'insufficient',
  )
  assert.equal(
    comparisonConclusion(a, b, [{ metric: 'tokens', operator: '<=', threshold: 2000 }], 'sufficient'),
    '指标证据不足',
  )
})
test('complete, controlled passing samples exercise both statistical response scenarios', () => {
  const { state, a } = fixture()
  const config = { ...copy(a.config), caseIds: ['case-01', 'case-02', 'case-03'], fault: 'none' }
  const baseline = buildRun(state, config, 'fixture A')
  const candidate = buildRun(state, { ...config, targetVersion: 'v2' }, 'fixture B')
  completeRun(baseline)
  completeRun(candidate)
  assert.equal(
    measureGates(baseline, candidate, defaultGateRules()).every((item) => item.status === 'met'),
    true,
  )
  assert.match(
    comparisonConclusion(baseline, candidate, defaultGateRules(), 'insufficient'),
    /证据不足/,
  )
  assert.match(
    comparisonConclusion(baseline, candidate, defaultGateRules(), 'sufficient'),
    /样例判定通过/,
  )
  assert.match(
    comparisonConclusion(
      baseline,
      candidate,
      [{ metric: 'latency', operator: '<=', threshold: 1 }],
      'sufficient',
    ),
    /未通过/,
  )
})
test('unfinished and single-case runs cannot pass a release-shaped sample verdict', () => {
  const { a, b } = fixture()
  b.status = 'failed'
  assert.match(comparisonConclusion(a, b, defaultGateRules(), 'sufficient'), /证据不足/)
  a.cases = a.cases.slice(0, 1)
  b.cases = b.cases.slice(0, 1)
  a.results = a.results.slice(0, 1)
  b.results = b.results.slice(0, 1)
  a.config.caseIds = b.config.caseIds = ['case-01']
  b.status = 'completed'
  assert.match(comparisonConclusion(a, b, defaultGateRules(), 'sufficient'), /单例/)
})
test('comparison functions are pure and preserve immutable run snapshots', () => {
  const { a, b } = fixture()
  const before = JSON.stringify([a, b])
  preflight(a, b)
  pairSamples(a, b)
  runMetrics(a)
  measureGates(a, b, defaultGateRules())
  comparisonConclusion(a, b, defaultGateRules())
  assert.equal(JSON.stringify([a, b]), before)
})
test('invalid targets, expired mixed resources and duplicate evaluators fail preflight', () => {
  const { state, a } = fixture()
  assert.ok(executionIssues(state, { ...a.config, targetVersion: 'v3' }).length)
  assert.ok(executionIssues(state, { ...a.config, scoringResourceId: 'expired-model' }).length)
  assert.ok(
    executionIssues(state, {
      ...a.config,
      evaluatorRefs: [a.config.evaluatorRefs[0], a.config.evaluatorRefs[0]],
    }).length,
  )
})
test('statistical n excludes NA, execution errors, review and missing scores', () => {
  const { a, b } = fixture()
  const response = mockStatistics(a, b, 'sufficient')
  assert.equal(response.actualPairedCount, 9)
  assert.ok(response.actualScoreDelta > 0)
  assert.ok(response.confidenceInterval.every((value) => value > 0))
  b.results[0].score = null
  assert.equal(mockStatistics(a, b, 'sufficient').actualPairedCount, 8)
})
test('mock confidence interval and p-value scenarios follow actual paired direction', () => {
  const { a, b } = fixture()
  const negative = mockStatistics(b, a, 'sufficient')
  assert.ok(negative.actualScoreDelta < 0)
  assert.ok(negative.confidenceInterval.every((value) => value < 0))
  const unchanged = mockStatistics(a, a, 'sufficient')
  assert.equal(unchanged.actualScoreDelta, 0)
  assert.equal(unchanged.pValue, 1)
  assert.ok(unchanged.confidenceInterval[0] < 0 && unchanged.confidenceInterval[1] > 0)
  assert.equal(mockStatistics(a, b, 'insufficient').confidenceInterval, null)
})
test('static risk evidence uses fixed Skill definitions and retains old fragments', () => {
  const { a } = fixture()
  const version = copy(a.target.versions[0])
  const risks = definitionRisks(version)
  assert.ok(version.skillDefinitions.length >= 2)
  assert.equal(
    risks.some((item) => item.id === 'skill-versions'),
    false,
  )
  const overlap = risks.find((item) => item.id === 'scope-overlap')
  assert.ok(overlap)
  const snapshot = JSON.parse(overlap.fragment)
  assert.deepEqual(snapshot.skillDefinitions, version.skillDefinitions)
  version.skillDefinitions[0].prompt = 'changed after analysis'
  assert.notEqual(JSON.parse(overlap.fragment).skillDefinitions[0].prompt, 'changed after analysis')
  const readable = definitionEvidence(overlap)
  assert.ok(readable.some((item) => item.field.includes('职责描述')))
  assert.ok(readable.every((item) => !item.value.includes('changed after analysis')))
  assert.ok(readable.every((item) => !item.value.includes('inputSchema')))
})
test('static risks report missing fixed definitions and malformed schemas without inventing them', () => {
  const { a } = fixture()
  const version = copy(a.target.versions[0])
  version.skillDefinitions = []
  version.toolDefinitions = []
  const risks = definitionRisks(version)
  assert.ok(risks.some((item) => item.id === 'skill-versions'))
  assert.ok(risks.some((item) => item.id === 'tool-schema'))
  assert.ok(
    definitionEvidence(risks.find((item) => item.id === 'tool-schema')).every((item) =>
      item.value.includes('缺少固定工具定义'),
    ),
  )
  assert.equal(
    risks.some((item) => item.id === 'scope-overlap'),
    false,
  )
})
