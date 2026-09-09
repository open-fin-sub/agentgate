import type { LocationQuery } from 'vue-router'
import type {
  CaseResult,
  ExecutionConfig,
  HumanReview,
  Outcome,
  PreviewState,
  Run,
  RunStatus,
} from '../types'

export const outcomeLabels: Record<Outcome, string> = {
  pass: '通过',
  fail: '不通过',
  review: '需复核',
  NA: '不适用',
  error: '执行错误',
}
export const statusLabels: Record<RunStatus, string> = {
  scheduled: '已预约',
  queued: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '执行失败',
  cancelled: '已取消',
  terminated: '已终止',
}
export const outcomes = Object.keys(outcomeLabels) as Outcome[]
export const statuses = Object.keys(statusLabels) as RunStatus[]
export const retryScopeLabels: Record<NonNullable<Run['retryScope']>, string> = {
  all: '全部用例',
  unfinished: '未完成用例',
  failed: '失败用例',
  single: '单条用例',
}
export const isActive = (run: Run) => ['scheduled', 'queued', 'running'].includes(run.status)
export const formatTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'
export const scoreText = (value: number | null | undefined) =>
  value == null ? '无分数' : value.toFixed(3)
export const percent = (value: number | null) =>
  value == null ? '缺少适用样本' : `${(value * 100).toFixed(1)}%`
export const tokenText = (value: number | null | undefined) =>
  value == null ? '未采集' : value.toLocaleString()
export const queryText = (query: LocationQuery, key: string) => String(query[key] ?? '')

export function validateConfig(state: PreviewState, config: ExecutionConfig): string[] {
  const errors: string[] = []
  const target = state.targets.find((item) => item.id === config.targetId)
  const version = target?.versions.find((item) => item.id === config.targetVersion)
  if (!target) errors.push('测评对象不存在，请重新选择。')
  else if (!version?.executable) errors.push('对象固定版本不存在或不可执行，请选择可执行版本。')
  const dataset = state.datasets.find((item) => item.id === config.datasetId)
  const input = dataset?.versions.find((item) => item.version === config.datasetVersion)
  if (!dataset || dataset.archived || !input)
    errors.push('测评集固定发布版本不存在或已归档；草稿不能执行。')
  if (!config.caseIds.length) errors.push('至少选择一条固定样本。')
  if (new Set(config.caseIds).size !== config.caseIds.length) errors.push('样本 ID 不能重复。')
  if (input && config.caseIds.some((id) => !input.cases.some((item) => item.id === id)))
    errors.push('所选样本不属于当前固定发布版本，请重新选择样本。')
  if (!config.evaluatorRefs.length) errors.push('至少选择一个评估器固定版本。')
  if (new Set(config.evaluatorRefs.map((ref) => ref.id)).size !== config.evaluatorRefs.length)
    errors.push('评估器不能重复选择。')
  function checkEvaluator(id: string, version: number, visiting: Set<string>) {
    const key = `${id}@${version}`
    const evaluator = state.evaluators.find((item) => item.id === id)
    const item = evaluator?.versions.find((entry) => entry.version === version)
    if (!item || evaluator?.archived) {
      errors.push(`评估器 ${key} 不存在或已归档。`)
      return
    }
    if (visiting.has(key)) {
      errors.push(`复合评估器 ${key} 存在循环引用。`)
      return
    }
    if (item.kind === 'llm') {
      const credential = state.credentials.find(
        (entry) => entry.id === (config.scoringResourceId ?? item.resourceId),
      )
      if (!credential?.enabled || !credential.healthy)
        errors.push(`评估器 ${evaluator?.name} 的评分资源失效，请修订评分配置。`)
      if (!item.model.trim()) errors.push(`评估器 ${evaluator?.name} 缺少模型。`)
    }
    if (item.kind === 'composite') {
      if (!item.children.length) errors.push(`复合评估器 ${key} 没有子评估器。`)
      for (const child of item.children)
        checkEvaluator(child.id, child.version, new Set([...visiting, key]))
    }
  }
  for (const ref of config.evaluatorRefs) checkEvaluator(ref.id, ref.version, new Set())
  const resource = state.credentials.find((item) => item.id === config.resourceId)
  if (!resource?.enabled || !resource.healthy) errors.push('执行配置的资源不存在、已停用或已失效。')
  for (const [label, id] of [
    ['对象执行', config.executionResourceId],
    ['模型评分', config.scoringResourceId],
  ]) {
    if (!id) continue
    const credential = state.credentials.find((item) => item.id === id)
    if (!credential?.enabled || !credential.healthy)
      errors.push(`${label}资源不存在、已停用或已失效。`)
  }
  if (!config.model.trim()) errors.push('请选择资源对应的模型。')
  if (resource && config.model !== resource.model)
    errors.push('模型与所选资源不匹配，请重新选择资源。')
  if (!['execution', 'scoring', 'both'].includes(config.resourcePurpose))
    errors.push('请选择资源用途。')
  if (!Number.isInteger(config.concurrency) || config.concurrency < 1 || config.concurrency > 32)
    errors.push('并发须为 1～32 的整数。')
  if (!Number.isFinite(config.timeout) || config.timeout < 1 || config.timeout > 3600)
    errors.push('单条超时须为 1～3600 秒。')
  if (!Number.isInteger(config.retries) || config.retries < 0 || config.retries > 5)
    errors.push('自动重试须为 0～5 次。')
  if (!Number.isFinite(config.sampling) || config.sampling <= 0 || config.sampling > 100)
    errors.push('采样率须大于 0 且不超过 100%。')
  if (!Number.isFinite(config.threshold) || config.threshold < 0 || config.threshold > 1)
    errors.push('质量分数门槛须在 0～1 之间。')
  if (
    config.scheduledAt &&
    (!Number.isFinite(Date.parse(config.scheduledAt)) ||
      Date.parse(config.scheduledAt) <= Date.now())
  )
    errors.push('预约时间须晚于当前时间，请重新选择。')
  return [...new Set(errors)]
}

export interface ReportFilters {
  q: string
  outcome: string
  tag: string
  difficulty: string
  category: string
  evaluator: string
}
export function reportFilters(query: LocationQuery): ReportFilters {
  return {
    q: queryText(query, 'q'),
    outcome: queryText(query, 'outcome'),
    tag: queryText(query, 'tag'),
    difficulty: queryText(query, 'difficulty'),
    category: queryText(query, 'category'),
    evaluator: queryText(query, 'evaluator'),
  }
}
export function reportQuery(filters: ReportFilters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
}
export function evaluatorCheck(run: Run, result: CaseResult | undefined, id: string) {
  const ref = run.config.evaluatorRefs.find((item) => item.id === id)
  return result?.checks.find(
    (check) => check.evaluatorId === id && check.evaluatorVersion === ref?.version,
  )
}
export function reviewedRun(run: Run, reviews: HumanReview[]): Run {
  return {
    ...run,
    results: run.results.map((result) => {
      const review = reviews
        .filter((item) => item.runId === run.id && item.caseId === result.caseId)
        .sort((a, b) => b.time.localeCompare(a.time))[0]
      if (!review || result.outcome === 'NA' || result.outcome === 'error') return result
      return {
        ...result,
        outcome:
          review.decision === 'confirmed'
            ? 'fail'
            : review.decision === 'dismissed'
              ? 'pass'
              : 'review',
        score: review.score ?? result.score,
      }
    }),
  }
}
export function reportRows(run: Run, filters: ReportFilters) {
  return run.cases
    .map((testCase) => ({
      testCase,
      result: run.results.find((item) => item.caseId === testCase.id),
    }))
    .filter(({ testCase, result }) => {
      const check = filters.evaluator ? evaluatorCheck(run, result, filters.evaluator) : undefined
      const outcome = filters.evaluator ? check?.outcome : result?.outcome
      return (
        (!filters.q ||
          `${testCase.id} ${testCase.question} ${testCase.expected} ${result?.reason ?? ''}`
            .toLowerCase()
            .includes(filters.q.toLowerCase())) &&
        (!filters.outcome ||
          (filters.outcome === 'pending' ? !result : outcome === filters.outcome)) &&
        (!filters.tag || testCase.tags.includes(filters.tag)) &&
        (!filters.difficulty || testCase.difficulty === filters.difficulty) &&
        (!filters.category || testCase.category === filters.category) &&
        (!filters.evaluator || Boolean(check))
      )
    })
}
export function runMetrics(run: Run) {
  const results = run.cases.flatMap((testCase) => {
    const result = run.results.find((item) => item.caseId === testCase.id)
    return result ? [result] : []
  })
  const counts = Object.fromEntries(
    outcomes.map((outcome) => [outcome, results.filter((item) => item.outcome === outcome).length]),
  ) as Record<Outcome, number>
  const scored = results.filter(
    (item) =>
      item.outcome !== 'NA' &&
      item.outcome !== 'error' &&
      item.score != null &&
      Number.isFinite(item.score),
  )
  const score = scored.length
    ? scored.reduce((sum, item) => sum + item.score!, 0) / scored.length
    : null
  const applicable = counts.pass + counts.fail + counts.review
  const latencies = results
    .flatMap((item) => (item.latency == null ? [] : [item.latency]))
    .sort((a, b) => a - b)
  const routing = results.filter(
    (item) =>
      item.outcome !== 'error' &&
      item.outcome !== 'NA' &&
      item.actualSkill &&
      run.cases.find((entry) => entry.id === item.caseId)?.expectedSkill,
  )
  const routingPass = routing.filter(
    (item) =>
      item.actualSkill === run.cases.find((entry) => entry.id === item.caseId)?.expectedSkill,
  ).length
  const tokensMissing = results.filter((item) => item.tokens == null).length
  return {
    counts,
    scored: scored.length,
    score,
    applicable,
    passRate: applicable ? counts.pass / applicable : null,
    completed: results.length,
    pending: run.cases.length - results.length,
    errorRate: results.length ? counts.error / results.length : null,
    tokensMissing,
    tokens:
      !results.length || tokensMissing
        ? null
        : results.reduce((sum, item) => sum + item.tokens!, 0),
    inputTokens:
      !results.length || results.some((item) => item.inputTokens == null)
        ? null
        : results.reduce((sum, item) => sum + item.inputTokens!, 0),
    outputTokens:
      !results.length || results.some((item) => item.outputTokens == null)
        ? null
        : results.reduce((sum, item) => sum + item.outputTokens!, 0),
    latency: latencies.length
      ? latencies.reduce((sum, item) => sum + item, 0) / latencies.length
      : null,
    p95: latencies.length ? latencies[Math.ceil(latencies.length * 0.95) - 1] : null,
    latencyCount: latencies.length,
    routingCount: routing.length,
    routingRate: routing.length ? routingPass / routing.length : null,
  }
}
export function qualityConclusion(run: Run) {
  const metrics = runMetrics(run)
  if (run.status !== 'completed') return '报告尚不完整，暂不判定质量达标'
  if (metrics.pending || metrics.counts.error) return '存在执行错误或缺失结果，质量证据不足'
  if (metrics.counts.review) return '存在待复核结果，请查看证据'
  if (metrics.score == null) return '没有适用分数，无法判定质量'
  if (metrics.counts.fail || metrics.score < run.config.threshold) return '未达到本次质量条件'
  return '达到本次质量条件（Mock 示例）'
}

export function runQueue(state: PreviewState, run: Run) {
  const usesPublic = (item: Run) =>
    [
      item.config.executionResourceId ?? item.config.resourceId,
      item.config.scoringResourceId ?? item.config.resourceId,
    ].some((id) => state.credentials.find((entry) => entry.id === id)?.kind === 'public')
  const resource = state.credentials.find(
    (item) => item.id === (run.config.executionResourceId ?? run.config.resourceId),
  )
  const queue = state.runs
    .filter(
      (item) =>
        item.status === 'queued' &&
        (usesPublic(run) ? usesPublic(item) : item.config.resourceId === run.config.resourceId),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  const position = queue.findIndex((item) => item.id === run.id) + 1
  return {
    position,
    resource: resource?.name ?? '资源记录缺失',
    kind: usesPublic(run) ? '涉及公共资源的阶段排队' : '私有资源执行容量',
    wait: Math.max(2, position * 2),
  }
}
