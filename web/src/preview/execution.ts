import type { CaseResult, ExecutionConfig, PreviewState, Run, TestCase } from './types'

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export function buildRun(
  state: PreviewState,
  config: ExecutionConfig,
  name: string,
  sourceRunId: string | null = null,
): Run {
  const target = state.targets.find((item) => item.id === config.targetId)
  const version = target?.versions.find((item) => item.id === config.targetVersion)
  const dataset = state.datasets.find((item) => item.id === config.datasetId)
  const input = dataset?.versions.find((item) => item.version === config.datasetVersion)
  const resourceIds = [
    ...new Set([
      config.resourceId,
      config.executionResourceId ?? config.resourceId,
      config.scoringResourceId ?? config.resourceId,
    ]),
  ]
  if (!version?.executable || !target || !input || dataset?.archived)
    throw new Error('对象或测评集版本不可执行，请重新检查固定版本。')
  if (
    resourceIds.some((id) => {
      const item = state.credentials.find((entry) => entry.id === id)
      return !item?.enabled || !item.healthy
    })
  )
    throw new Error('模型资源不可用，请重新选择可用资源。')
  if (
    !config.evaluatorRefs.length ||
    config.evaluatorRefs.some(
      (ref) =>
        !state.evaluators
          .find((e) => e.id === ref.id && !e.archived)
          ?.versions.some((v) => v.version === ref.version),
    )
  )
    throw new Error('评分标准版本不存在或已停用。')
  if (
    config.concurrency < 1 ||
    config.timeout < 1 ||
    config.retries < 0 ||
    config.sampling <= 0 ||
    config.sampling > 100
  )
    throw new Error('执行参数不合法。')
  if (config.scheduledAt && !Number.isFinite(Date.parse(config.scheduledAt)))
    throw new Error('预约时间无效。')
  const cases = config.caseIds.length
    ? input.cases.filter((item) => config.caseIds.includes(item.id))
    : input.cases.slice(0, Math.max(1, Math.ceil((input.cases.length * config.sampling) / 100)))
  if (!cases.length || (config.caseIds.length && cases.length !== new Set(config.caseIds).size))
    throw new Error('用例范围为空或包含当前版本不存在的用例。')
  const exactRefs = [...config.evaluatorRefs]
  for(let i=0;i<exactRefs.length;i++) {
    const ref=exactRefs[i]!
    const evaluator=state.evaluators.find(item=>item.id===ref.id)?.versions.find(item=>item.version===ref.version)
    if(!evaluator)throw new Error('子评估器固定版本不存在。')
    for(const child of evaluator.children)if(!exactRefs.some(item=>item.id===child.id&&item.version===child.version))exactRefs.push({id:child.id,version:child.version})
  }
  const snapshots = exactRefs.map((ref) => {
    const item = state.evaluators.find((entry) => entry.id === ref.id)!
    return { ...item, versions: item.versions.filter((v) => v.version === ref.version) }
  })
  return {
    id: `run-${crypto.randomUUID()}`,
    name: name.trim() || `${target.name} ${version.label} 测评`,
    config: copy({
      ...config,
      executionResourceId: config.executionResourceId ?? config.resourceId,
      scoringResourceId: config.scoringResourceId ?? config.resourceId,
      caseIds: cases.map((item) => item.id),
    }),
    cases: copy(cases),
    target: copy({ ...target, versions: [version] }),
    evaluators: copy(snapshots),
    status:
      config.scheduledAt && Date.parse(config.scheduledAt) > Date.now() ? 'scheduled' : 'queued',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    results: [],
    sourceRunId,
    comparisonId: null,
    error: null,
    attempt: sourceRunId
      ? (state.runs.find((item) => item.id === sourceRunId)?.attempt ?? 1) + 1
      : 1,
    retryScope: 'all',
  }
}

export function caseResult(run: Run, item: TestCase, index: number): CaseResult {
  index = /^case-\d+$/.test(item.id)
    ? Number(item.id.slice(5)) - 1
    : [...item.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 12
  const improved = run.config.targetVersion === 'v2'
  const outcome =
    index === 9
      ? 'NA'
      : index === 10
        ? 'error'
        : index === 11
          ? 'review'
          : (improved ? index === 4 : [1, 2, 4, 6].includes(index))
            ? 'fail'
            : 'pass'
  const score =
    outcome === 'NA' || outcome === 'error'
      ? null
      : outcome === 'pass'
        ? 1
        : outcome === 'review'
          ? 0.6
          : 0.2
  const actualSkill = outcome === 'fail' ? 'skill-faq' : item.expectedSkill || 'skill-loan'
  const output =
    outcome === 'error'
      ? '执行中断：上游工具超时，未获得有效输出。'
      : outcome === 'fail'
        ? '您的问题属于常见问题咨询，建议查看帮助中心。'
        : outcome === 'NA'
          ? '当前样本不包含所选工具调用，工具参数标准不适用。'
          : outcome === 'review'
            ? '已给出解释，边界条件是否充分需要业务人员复核。'
            : item.expected
  const reason =
    outcome === 'fail'
      ? '预期进入业务办理流程，实际路由到常见问题；未执行所需工具。'
      : outcome === 'error'
        ? '执行错误不计为零分；应排查工具连接后重跑。'
        : outcome === 'NA'
          ? '缺少该标准的适用条件，计入不适用数量。'
          : outcome === 'review'
            ? '机器结论存在不确定性，建议人工核对业务规则。'
            : '输出符合期望，路由与工具检查通过。'
  const missing = run.config.fault === 'missing-usage'
  return {
    caseId: item.id,
    outcome,
    score,
    reason,
    output,
    actualSkill,
    latency: missing ? null : improved ? 820 + index * 37 : 980 + index * 51,
    tokens: missing ? null : 400 + index * 23,
    inputTokens: missing ? null : 240 + index * 13,
    outputTokens: missing ? null : 160 + index * 10,
    trace:
      run.config.fault === 'missing-trace'
        ? []
        : [
            {
              id: 'intent',
              title: '意图识别 · 第1轮',
              input: item.turns[0]?.input || item.question,
              output: outcome === 'fail' ? '咨询帮助' : '办理贷款',
              duration: 120,
              tokens: 90,
              error: null,
            },
            {
              id: 'route',
              title: 'Skill 路由',
              input: `期望：${item.expectedSkill}`,
              output: actualSkill,
              duration: 65,
              tokens: 80,
              error: outcome === 'fail' ? '路由与预期不一致' : null,
            },
            {
              id: 'tool',
              title: '工具调用 · credit_check',
              input: item.variables || '{"amount":800000}',
              output:
                outcome === 'error' ? '连接超时' : outcome === 'fail' ? '未调用' : '需要人工审核',
              duration: outcome === 'error' ? null : 220,
              tokens: null,
              error: outcome === 'error' ? 'TimeoutError' : null,
            },
            ...item.turns
              .slice(1)
              .map((turn, i) => ({
                id: `turn-${i + 2}`,
                title: `对话 · 第${i + 2}轮`,
                input: turn.input,
                output: outcome === 'pass' ? turn.expected : output,
                duration: 170,
                tokens: 120,
                error: null,
              })),
            {
              id: 'answer',
              title: '最终输出',
              input: '汇总执行结果',
              output,
              duration: 350,
              tokens: 200,
              error: null,
            },
          ],
    checks: run.config.evaluatorRefs.map((ref) => ({
      evaluatorId: ref.id,
      evaluatorVersion: ref.version,
      dimension: ref.id === 'ev-rule' ? '路由与工具' : '业务质量',
      name: `${run.evaluators.find((e) => e.id === ref.id)?.name ?? ref.id} v${ref.version}`,
      outcome,
      score,
      reason,
    })),
  }
}

export function completeRun(run: Run) {
  run.results = run.cases.map((item, index) => caseResult(run, item, index))
  run.status = 'completed'
  run.startedAt ||= run.createdAt
  run.completedAt = new Date().toISOString()
}

export function advanceRuns(state: PreviewState, now: number): boolean {
  let changed = false
  const publicResource=(id:string)=>state.credentials.find(item=>item.id===id)?.kind==='public'
  const publicBusy=()=>state.runs.filter(item=>item.status==='running' && (item.phase==='scoring'?publicResource(item.config.scoringResourceId??item.config.resourceId):item.phase==='waiting-scoring'?false:publicResource(item.config.executionResourceId??item.config.resourceId))).length
  for (const run of state.runs) {
    if (run.status === 'scheduled' && Date.parse(run.config.scheduledAt!) <= now) {
      run.status = 'queued'
      changed = true
    }
    const origin = Math.max(
      Date.parse(run.createdAt),
      run.config.scheduledAt ? Date.parse(run.config.scheduledAt) : 0,
    )
    if (run.status === 'queued' && now - origin >= 2000) {
      if(publicResource(run.config.executionResourceId??run.config.resourceId)&&publicBusy()>=state.publicConcurrency)continue
      run.status = 'running'
      run.startedAt = new Date(now).toISOString()
      run.phase='execution'
      run.phaseStartedAt=run.startedAt
      changed = true
    }
    if (run.status !== 'running') continue
    const elapsed = now - Date.parse(run.startedAt!)
    const resourceId=run.phase==='execution'?(run.config.executionResourceId??run.config.resourceId):(run.config.scoringResourceId??run.config.resourceId)
    const credential=state.credentials.find(item=>item.id===resourceId)
    if(!credential?.enabled||!credential.healthy){run.status='failed';run.error='Mock 资源不可用：所需凭据已停用或测试失败。请恢复资源后继续未完成用例。';run.completedAt=new Date(now).toISOString();changed=true;continue}
    if (run.config.fault === 'infrastructure' && elapsed >= 1800) {
      run.status = 'failed'
      run.error = 'Mock 故障：执行节点连接中断。已完成结果保留，可恢复未完成部分。'
      run.completedAt = new Date(now).toISOString()
      changed = true
      continue
    }
    if(elapsed>=2000 && run.phase==='execution'){run.phase='waiting-scoring';changed=true}
    if(run.phase==='waiting-scoring'){
      if(publicResource(run.config.scoringResourceId??run.config.resourceId)&&publicBusy()>=state.publicConcurrency)continue
      run.phase='scoring';run.phaseStartedAt=new Date(now).toISOString();changed=true
    }
    if(run.phase!=='scoring')continue
    const count = Math.min(run.cases.length, Math.floor((now-Date.parse(run.phaseStartedAt!))/600))
    if (count > run.results.length) {
      run.results = run.cases.slice(0, count).map((item, index) => caseResult(run, item, index))
      changed = true
    }
    if (run.results.length === run.cases.length) {
      run.status = 'completed'
      run.completedAt = new Date(now).toISOString()
      changed = true
    }
  }
  return changed
}
