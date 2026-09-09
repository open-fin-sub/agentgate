import { test, expect } from '@playwright/test'
import { createSeed } from '../../src/preview/seed'
import { buildRun, advanceRuns, completeRun } from '../../src/preview/execution'
import { pairSamples, preflight, runMetrics } from '../../src/preview/comparison'

test('immutable snapshots and subset reruns preserve case result identity', () => {
  const state = createSeed(),
    baseline = state.runs[0]!
  const next = buildRun(
    state,
    { ...baseline.config, caseIds: ['case-02'] },
    '单条复验',
    baseline.id,
  )
  completeRun(next)
  expect(next.results[0]!.outcome).toBe(
    baseline.results.find((r) => r.caseId === 'case-02')!.outcome,
  )
  state.targets[0]!.versions[0]!.prompt = '新修改'
  state.datasets[0]!.versions[0]!.cases[0]!.question = '新问题'
  state.evaluators[0]!.versions[0]!.rule = '新规则'
  expect(baseline.target.versions).toHaveLength(1)
  expect(baseline.target.versions[0]!.prompt).not.toBe('新修改')
  expect(baseline.cases[0]!.question).not.toBe('新问题')
  expect(baseline.evaluators[0]!.versions[0]!.rule).not.toBe('新规则')
  expect(next.config.caseIds).toEqual(['case-02'])
  expect(next.sourceRunId).toBe(baseline.id)
})

test('comparison checks controls and retains changed, missing and erroneous cases', () => {
  const state = createSeed(),
    [a, b, changed] = state.runs
  expect(preflight(a!, b!).controlled).toBe(true)
  expect(preflight(a!, changed!).controlled).toBe(false)
  const pairs = pairSamples(a!, changed!)
  expect(pairs.some((p) => p.kind === 'onlyA')).toBe(true)
  expect(pairs.some((p) => p.kind === 'onlyB')).toBe(true)
  expect(pairs.some((p) => p.kind === 'unpaired')).toBe(true)
  expect(pairs.some((p) => p.kind === 'error')).toBe(true)
  expect(a!.results.find((r) => r.outcome === 'NA')!.score).toBeNull()
  expect(a!.results.find((r) => r.outcome === 'error')!.score).toBeNull()
  expect(runMetrics(a!).passRate.value).toBeCloseTo(0.5)
})

test('public stages respect limits and private execution can bypass a busy public queue', () => {
  const state = createSeed()
  state.publicConcurrency = 1
  const config = state.runs[0]!.config
  const first = buildRun(state, config, '公共一'),
    second = buildRun(state, config, '公共二')
  const mixed = buildRun(
    state,
    { ...config, executionResourceId: 'private-model', scoringResourceId: 'public-model' },
    '混合',
  )
  state.runs.push(first, second, mixed)
  const start = Date.now() + 2500
  advanceRuns(state, start)
  expect(first.status).toBe('running')
  expect(second.status).toBe('queued')
  expect(mixed.status).toBe('running')
  advanceRuns(state, start + 2500)
  expect(first.phase).toBe('scoring')
  expect(mixed.phase).toBe('waiting-scoring')
  state.credentials.find((c) => c.id === 'public-model')!.enabled = false
  advanceRuns(state, start + 3500)
  expect(first.status).toBe('failed')
  expect(first.error).toContain('资源不可用')
})
