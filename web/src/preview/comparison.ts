import type { CaseResult, ExecutionConfig, GateRule, PreviewState, Run, TestCase } from './types'

export type Metric = GateRule['metric']
export type PairKind =
  | 'improved'
  | 'regressed'
  | 'sharedfail'
  | 'sharedpass'
  | 'changed'
  | 'error'
  | 'onlyA'
  | 'onlyB'
  | 'unpaired'
export const metricDefinitions: Record<
  Metric,
  { label: string; direction: 'higher' | 'lower'; unit: string }
> = {
  score: { label: '平均分', direction: 'higher', unit: '分（0–1）' },
  passRate: { label: '适用 Case 通过率', direction: 'higher', unit: '%' },
  errorRate: { label: '执行错误率', direction: 'lower', unit: '%' },
  latency: { label: '平均耗时', direction: 'lower', unit: 'ms' },
  tokens: { label: '平均单例 Token 用量', direction: 'lower', unit: 'Token' },
}
export const pairLabels: Record<PairKind, string> = {
  improved: '改善',
  regressed: '退化',
  sharedfail: '共同失败',
  sharedpass: '共同通过',
  changed: '其他变化 / 待复核',
  error: '执行错误',
  onlyA: '仅 A',
  onlyB: '仅 B',
  unpaired: '未配对',
}
export const runStatusLabels: Record<Run['status'], string> = {
  scheduled: '已预约',
  queued: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '执行失败',
  cancelled: '已取消',
  terminated: '已终止',
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function caseContent(item: TestCase): string {
  return canonical({
    question: item.question,
    turns: item.turns,
    expected: item.expected,
    expectedSkill: item.expectedSkill,
    variables: item.variables,
    files: item.files,
  })
}

export interface PreflightCheck {
  label: string
  a: string
  b: string
  matches: boolean
}
export function preflight(a: Run, b: Run) {
  const checks: PreflightCheck[] = []
  function check(label: string, left: unknown, right: unknown) {
    checks.push({
      label,
      a: typeof left === 'string' ? left : canonical(left),
      b: typeof right === 'string' ? right : canonical(right),
      matches: canonical(left) === canonical(right),
    })
  }
  check('目标资产', a.config.targetId, b.config.targetId)
  check('测评集 ID', a.config.datasetId, b.config.datasetId)
  check('测评集版本', a.config.datasetVersion, b.config.datasetVersion)
  check('评估器与版本（有序）', a.config.evaluatorRefs, b.config.evaluatorRefs)
  const evaluatorSnapshots = (run: Run) =>
    run.evaluators
      .flatMap((item) => item.versions.map((version) => ({ id: item.id, ...version })))
      .sort((left, right) =>
        `${left.id}@${left.version}`.localeCompare(`${right.id}@${right.version}`),
      )
  check('评估器配置快照', evaluatorSnapshots(a), evaluatorSnapshots(b))
  const completeSnapshots = (run: Run) =>
    run.target.id === run.config.targetId &&
    run.target.versions.some((item) => item.id === run.config.targetVersion) &&
    run.config.evaluatorRefs.length > 0 &&
    run.config.evaluatorRefs.every((ref) =>
      run.evaluators.some(
        (item) =>
          item.id === ref.id && item.versions.some((version) => version.version === ref.version),
      ),
    ) &&
    run.evaluators.every((item) =>
      item.versions.every((version) =>
        version.children.every((child) =>
          run.evaluators.some(
            (childSnapshot) =>
              childSnapshot.id === child.id &&
              childSnapshot.versions.some((childVersion) => childVersion.version === child.version),
          ),
        ),
      ),
    )
  checks.push({
    label: '对象 / 评估器依赖快照完整性',
    a: completeSnapshots(a) ? '完整' : '缺失',
    b: completeSnapshots(b) ? '完整' : '缺失',
    matches: completeSnapshots(a) && completeSnapshots(b),
  })
  check(
    '并发 / 超时 / 重试 / 采样',
    [a.config.concurrency, a.config.timeout, a.config.retries, a.config.sampling],
    [b.config.concurrency, b.config.timeout, b.config.retries, b.config.sampling],
  )
  check(
    '资源 / 用途 / 模型',
    [a.config.resourceId, a.config.resourcePurpose, a.config.model],
    [b.config.resourceId, b.config.resourcePurpose, b.config.model],
  )
  check(
    '执行阶段资源',
    a.config.executionResourceId ?? a.config.resourceId,
    b.config.executionResourceId ?? b.config.resourceId,
  )
  check(
    '评分阶段资源',
    a.config.scoringResourceId ?? a.config.resourceId,
    b.config.scoringResourceId ?? b.config.resourceId,
  )
  check(
    '评分阈值 / 故障模拟',
    [a.config.threshold, a.config.fault],
    [b.config.threshold, b.config.fault],
  )
  check('预约时间', a.config.scheduledAt, b.config.scheduledAt)
  check('配置用例范围', [...a.config.caseIds].sort(), [...b.config.caseIds].sort())
  check(
    '实际用例范围',
    a.cases.map((item) => item.id).sort(),
    b.cases.map((item) => item.id).sort(),
  )
  check(
    '输入和期望快照',
    a.cases.map((item) => [item.id, caseContent(item)]).sort(),
    b.cases.map((item) => [item.id, caseContent(item)]).sort(),
  )
  return {
    sameAsset: a.config.targetId === b.config.targetId,
    controlled: checks.every((item) => item.matches),
    checks,
  }
}

export interface SamplePair {
  id: string
  aCase?: TestCase
  bCase?: TestCase
  a?: CaseResult
  b?: CaseResult
  kind: PairKind
  exact: boolean
  reason: string
}
export function pairSamples(a: Run, b: Run): SamplePair[] {
  const aCases = new Map(a.cases.map((item) => [item.id, item]))
  const bCases = new Map(b.cases.map((item) => [item.id, item]))
  const aResults = new Map(a.results.map((item) => [item.caseId, item]))
  const bResults = new Map(b.results.map((item) => [item.caseId, item]))
  return [
    ...new Set([...aCases.keys(), ...bCases.keys(), ...aResults.keys(), ...bResults.keys()]),
  ].map((id) => {
    const aCase = aCases.get(id),
      bCase = bCases.get(id),
      left = aResults.get(id),
      right = bResults.get(id)
    const exact = !!aCase && !!bCase && caseContent(aCase) === caseContent(bCase)
    let kind: PairKind = 'changed',
      reason = '同一用例的机器原判；人工复核在证据页单独保留。'
    if (!aCase && !left) {
      kind = 'onlyB'
      reason = '基线未包含此用例。'
    } else if (!bCase && !right) {
      kind = 'onlyA'
      reason = '候选未包含此用例。'
    } else if (!exact) {
      kind = 'unpaired'
      reason = '用例快照缺失，或输入 / 期望发生变化；不能按 ID 静默配对。'
    } else if (!left || !right) {
      kind = 'unpaired'
      reason = '至少一侧没有返回结果。'
    } else if (left.outcome === 'error' || right.outcome === 'error') {
      kind = 'error'
      reason = '执行错误独立于业务失败；缺失分数不填零。'
    } else if (left.outcome === 'fail' && right.outcome === 'pass') kind = 'improved'
    else if (left.outcome === 'pass' && right.outcome === 'fail') kind = 'regressed'
    else if (left.outcome === 'fail' && right.outcome === 'fail') kind = 'sharedfail'
    else if (left.outcome === right.outcome && left.outcome === 'pass') {
      kind =
        left.score !== null && right.score !== null && left.score !== right.score
          ? right.score > left.score
            ? 'improved'
            : 'regressed'
          : 'sharedpass'
    } else reason = '含待复核 / 不适用或其他状态；不强行判断改善与退化。'
    return { id, aCase, bCase, a: left, b: right, kind, exact, reason }
  })
}

export interface MetricValue {
  value: number | null
  observed: number
  total: number
}
export function runMetrics(run: Run): Record<Metric, MetricValue> {
  const results = run.results.filter((item) => run.cases.some((test) => test.id === item.caseId))
  const total = run.cases.length
  function average(key: 'score' | 'latency' | 'tokens'): MetricValue {
    const values = results
      .filter((item) => key !== 'score' || !['error', 'NA'].includes(item.outcome))
      .map((item) => item[key])
      .filter((value): value is number => value !== null && Number.isFinite(value))
    return {
      value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
      observed: values.length,
      total:
        key === 'score'
          ? total - results.filter((item) => ['error', 'NA'].includes(item.outcome)).length
          : total,
    }
  }
  function rate(outcome: 'pass' | 'error'): MetricValue {
    const applicable =
      outcome === 'pass'
        ? results.filter((item) => ['pass', 'fail', 'review'].includes(item.outcome))
        : results
    return {
      value: applicable.length
        ? applicable.filter((item) => item.outcome === outcome).length / applicable.length
        : null,
      observed: applicable.length,
      total:
        outcome === 'pass'
          ? total - results.filter((item) => ['error', 'NA'].includes(item.outcome)).length
          : total,
    }
  }
  return {
    score: average('score'),
    passRate: rate('pass'),
    errorRate: rate('error'),
    latency: average('latency'),
    tokens: average('tokens'),
  }
}

export function formatMetric(metric: Metric, value: number | null, delta = false): string {
  if (value === null || !Number.isFinite(value)) return '未采集'
  const sign = delta && value > 0 ? '+' : ''
  if (metric === 'passRate' || metric === 'errorRate')
    return `${sign}${(value * 100).toFixed(1)}${delta ? ' 个百分点' : '%'}`
  return `${sign}${value.toFixed(metric === 'tokens' ? 1 : metric === 'latency' ? 0 : 3)}${metric === 'latency' ? ' ms' : metric === 'tokens' ? ' Token' : ''}`
}

export function metricChange(metric: Metric, a: number | null, b: number | null) {
  if (a === null || b === null) return { delta: null, label: '证据不足' }
  const delta = b - a
  return {
    delta,
    label:
      delta === 0
        ? '持平'
        : (metricDefinitions[metric].direction === 'higher' ? delta > 0 : delta < 0)
          ? '改善'
          : '退化',
  }
}

export function mockStatistics(
  baseline: Run,
  candidate: Run,
  scenario: 'sufficient' | 'insufficient',
) {
  const pairs = pairSamples(baseline, candidate).filter(
    (item) =>
      item.exact &&
      item.a &&
      item.b &&
      ['pass', 'fail'].includes(item.a.outcome) &&
      ['pass', 'fail'].includes(item.b.outcome) &&
      item.a.score !== null &&
      Number.isFinite(item.a.score) &&
      item.b.score !== null &&
      Number.isFinite(item.b.score),
  )
  const delta = pairs.length
    ? pairs.reduce((sum, item) => sum + item.b!.score! - item.a!.score!, 0) / pairs.length
    : null
  const sufficient = scenario === 'sufficient' && pairs.length >= 2
  const direction =
    delta === null || Math.abs(delta) < 1e-12 ? 'unchanged' : delta > 0 ? 'improved' : 'regressed'
  const exampleRadius = delta === null ? 0.05 : Math.min(0.05, Math.abs(delta) / 2)
  return {
    source: 'Mock 统计响应体验场景（用户选择，非统计计算）',
    evidence: sufficient ? 'sufficient' : 'insufficient',
    method: sufficient ? '预置响应：按实际配对差值方向选择示例，非生产统计方法' : null,
    pValue: sufficient ? (direction === 'unchanged' ? 1 : 0.04) : null,
    confidenceInterval: sufficient
      ? direction === 'unchanged'
        ? [-0.05, 0.05]
        : [Math.max(-1, delta! - exampleRadius), Math.min(1, delta! + exampleRadius)]
      : null,
    minimumSampleContract: null,
    actualPairedCount: pairs.length,
    actualScoreDelta: delta,
    direction,
    note: 'n / delta 取自输入一致、两侧 pass/fail 且有有限分数的配对；NA/error/review/缺失不计入。p 为预置值，CI 为围绕差值构造的展示区间，均未通过统计检验计算。单例仅供个例复验，生产统计门槛未接入。',
  }
}

export interface GateMeasurement {
  rule: GateRule
  measurement: MetricValue
  status: 'met' | 'failed' | 'insufficient'
  reason: string
}
export function measureGates(baseline: Run, candidate: Run, rules: GateRule[]): GateMeasurement[] {
  const metrics = runMetrics(candidate),
    baseMetrics = runMetrics(baseline),
    controlled = preflight(baseline, candidate).controlled
  return rules.map((rule) => {
    const measurement = metrics[rule.metric]
    let status: GateMeasurement['status'] = 'insufficient'
    let reason = '仅为本次 Mock 样本实测阈值；不等于统计或发布结论。'
    if (!controlled) reason = '控制变量不一致，仅描述性展示数值。'
    else if (baseline.status !== 'completed' || candidate.status !== 'completed')
      reason = '基线或候选未完整完成。'
    else if (
      !measurement.total ||
      measurement.value === null ||
      measurement.observed !== measurement.total ||
      baseMetrics[rule.metric].value === null ||
      baseMetrics[rule.metric].observed !== baseMetrics[rule.metric].total
    )
      reason = '基线或候选样本不足，或该指标存在缺失，不能判为通过。'
    else if (!Number.isFinite(rule.threshold)) reason = '阈值无效。'
    else {
      status = (
        rule.operator === '>='
          ? measurement.value >= rule.threshold
          : measurement.value <= rule.threshold
      )
        ? 'met'
        : 'failed'
      if (status === 'failed') reason = '候选实测值未达到这一条预设阈值。'
    }
    return { rule, measurement, status, reason }
  })
}

export function comparisonConclusion(
  baseline: Run,
  candidate: Run,
  rules: GateRule[],
  statistics: 'sufficient' | 'insufficient' = 'insufficient',
) {
  if (!preflight(baseline, candidate).controlled) return '仅描述性比较'
  if (
    ['failed', 'cancelled', 'terminated'].includes(baseline.status) ||
    ['failed', 'cancelled', 'terminated'].includes(candidate.status)
  )
    return '执行未完成 · 证据不足'
  if (baseline.status !== 'completed' || candidate.status !== 'completed') return '等待运行完成'
  const gates = measureGates(baseline, candidate, rules)
  if (gates.some((item) => item.status === 'failed')) return 'Mock 样例判定未通过'
  if (!gates.length || gates.some((item) => item.status === 'insufficient')) return '指标证据不足'
  if (mockStatistics(baseline, candidate, statistics).actualPairedCount < 2)
    return '单例 / 空样本证据不足'
  if (statistics === 'sufficient') return 'Mock 样例判定通过（模拟统计响应）'
  return '统计响应示例：证据不足'
}

export function defaultGateRules(): GateRule[] {
  return [
    { metric: 'score', operator: '>=', threshold: 0.8 },
    { metric: 'passRate', operator: '>=', threshold: 0.8 },
    { metric: 'errorRate', operator: '<=', threshold: 0 },
    { metric: 'latency', operator: '<=', threshold: 3000 },
    { metric: 'tokens', operator: '<=', threshold: 2000 },
  ]
}

export function executionIssues(state: PreviewState, config: ExecutionConfig): string[] {
  const issues: string[] = []
  const target = state.targets.find((item) => item.id === config.targetId)
  if (!target?.versions.find((item) => item.id === config.targetVersion)?.executable)
    issues.push('目标版本不存在或不可执行。')
  const dataset = state.datasets.find((item) => item.id === config.datasetId)
  const version = dataset?.versions.find((item) => item.version === config.datasetVersion)
  if (!dataset || dataset.archived || !version) issues.push('选择可用的已发布测评集版本。')
  if (!version?.cases.length) issues.push('测评集版本没有用例。')
  if (config.caseIds.some((id) => !version?.cases.some((item) => item.id === id)))
    issues.push('用例范围含所选版本中不存在的用例。')
  if (!config.evaluatorRefs.length) issues.push('至少选择一个评估器版本。')
  if (new Set(config.evaluatorRefs.map((item) => item.id)).size !== config.evaluatorRefs.length)
    issues.push('同一评估器只能选择一个固定版本。')
  for (const reference of config.evaluatorRefs) {
    const evaluator = state.evaluators.find((item) => item.id === reference.id)
    if (
      !evaluator ||
      evaluator.archived ||
      !evaluator.versions.some((item) => item.version === reference.version)
    )
      issues.push(`评估器 ${reference.id} v${reference.version} 不可用。`)
  }
  for (const id of new Set([
    config.resourceId,
    config.executionResourceId ?? config.resourceId,
    config.scoringResourceId ?? config.resourceId,
  ])) {
    const credential = state.credentials.find((item) => item.id === id)
    if (!credential?.enabled || !credential.healthy)
      issues.push(`资源 ${id} 已停用、过期或不可用；请到资源管理处理。`)
  }
  if (!config.model.trim()) issues.push('模型不能为空。')
  const executionResource = state.credentials.find(
    (item) => item.id === (config.executionResourceId ?? config.resourceId),
  )
  if (executionResource && config.model !== executionResource.model)
    issues.push('执行模型与所选执行资源不匹配。')
  if (
    !Number.isInteger(config.concurrency) ||
    config.concurrency < 1 ||
    !Number.isFinite(config.timeout) ||
    config.timeout <= 0 ||
    !Number.isInteger(config.retries) ||
    config.retries < 0
  )
    issues.push('并发和超时必须为正数，重试须为非负整数。')
  if (!Number.isFinite(config.sampling) || config.sampling <= 0 || config.sampling > 100)
    issues.push('采样率范围是大于 0 且不超过 100%。')
  if (!Number.isFinite(config.threshold) || config.threshold < 0 || config.threshold > 1)
    issues.push('评分阈值范围是 0–1。')
  if (config.scheduledAt && !Number.isFinite(Date.parse(config.scheduledAt)))
    issues.push('预约时间格式无效。')
  return issues
}
