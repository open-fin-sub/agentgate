import type { ExecutionConfig, PreviewState, Target, TestCase } from './types'
import { buildRun, completeRun } from './execution'

export function createSeed(): PreviewState {
  const targets: Target[] = [
    [
      'agent-service',
      '客户服务助手',
      'Agent',
      '云虾总控',
      '统一识别客户意图并路由贷款办理与常见问题 Skill。',
    ],
    ['agent-loan', '贷款顾问', 'Agent', '单智能体', '核对贷款资格，通过工具完成风险核查。'],
    ['agent-workflow', '授信审批流程', 'Agent', '工作流', '按资格、征信、人工审批节点处理申请。'],
    ['skill-loan', '贷款办理', 'Skill', 'Skill', '办理贷款申请，查询征信并转人工审核。'],
    ['skill-faq', '常见问题', 'Skill', 'Skill', '回答利率和申请条件说明，不代替业务办理。'],
  ].map(([id, name, type, form, description]) => ({
    id: id!,
    name: name!,
    type: type as 'Agent' | 'Skill',
    form: form!,
    platform: '示例 Agent 平台',
    description: description!,
    versions: ['v1', 'v2', 'v3'].map((version, index) => ({
      id: version,
      label: `${version} · ${['当前基线', '候选优化', '历史已停用'][index]}`,
      prompt:
        index === 1
          ? '识别办理与咨询的边界。涉及提交申请或审批时调用贷款办理 Skill；仅说明性问题使用常见问题 Skill；不承诺自动批准。'
          : '你是客户服务助手，解答贷款问题并帮助申请。贷款与常见问题 Skill 均可处理贷款相关问题。',
      tools: ['credit_check', 'application_submit'],
      skills: type === 'Agent' ? ['skill-loan', 'skill-faq'] : [],
      executable: index !== 2,
      note: [
        '2026-08-20 发布，咨询与办理边界待验证',
        '2026-09-05 增加路由边界与人工审核要求',
        '源平台已停用，保留历史快照',
      ][index]!,
    })),
  }))
  for (const target of targets)
    for (const version of target.versions) {
      version.toolDefinitions = version.tools.map((name) => ({
        name,
        inputSchema: JSON.stringify({
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'number', minimum: 1 },
            term: { type: 'integer', minimum: 1 },
          },
        }),
        outputSchema: JSON.stringify({
          type: 'object',
          required: ['decision'],
          properties: { decision: { enum: ['review', 'rejected'] }, reason: { type: 'string' } },
        }),
      }))
      if (target.type === 'Skill')
        version.prompt =
          target.id === 'skill-loan'
            ? version.id === 'v2'
              ? '仅处理明确提交或办理意图。先校验金额期限，调用征信工具，再转人工审核，不承诺自动批准。'
              : '解答贷款问题并帮助申请贷款，调用征信工具后转人工审核。'
            : version.id === 'v2'
              ? '只回答条件与利率说明，不代替提交办理。不明确的意图先澄清。'
              : '解答贷款相关问题并帮助客户了解和申请贷款。'
    }
  for (const target of targets)
    for (const version of target.versions)
      version.skillDefinitions = version.skills.flatMap((id) => {
        const skill = targets.find((item) => item.id === id)
        const fixed = skill?.versions.find((item) => item.id === version.id)
        return skill && fixed
          ? [
              {
                id: skill.id,
                version: fixed.id,
                name: skill.name,
                description: skill.description,
                prompt: fixed.prompt,
                tools: fixed.toolDefinitions ?? [],
              },
            ]
          : []
      })
  const questions = [
    '我想申请80万元贷款',
    '请直接帮我提交贷款申请',
    '我的申请能直接批准吗？',
    '申请房贷需要哪些材料？',
    '征信记录缺失还能继续办理吗？',
    '贷款利率是多少？',
    '上一轮金额改为100万',
    '不提供身份信息可以先了解条件吗？',
    '收入刚好达到最低要求',
    '只询问利率，不调用工具',
    '征信接口暂时不可用',
    '材料信息有矛盾，应当如何处理？',
  ]
  const cases: TestCase[] = questions.map((question, index) => ({
    id: `case-${String(index + 1).padStart(2, '0')}`,
    question,
    turns:
      index === 2 || index === 6
        ? [
            { input: '我想申请贷款', expected: '询问金额和期限' },
            { input: question, expected: '查询征信并转人工审核' },
          ]
        : [],
    expected:
      index === 3 || index === 5 || index === 7 || index === 9
        ? '清楚解释申请条件和利率，不创建申请。'
        : '进入贷款办理流程，调用征信工具，并明确需要人工审核，不承诺自动批准。',
    expectedSkill: [3, 5, 7, 9].includes(index) ? 'skill-faq' : 'skill-loan',
    variables: JSON.stringify({ amount: 800000, term: 30 }),
    files: index === 7 ? ['sample://申请材料说明.pdf'] : [],
    category: index % 3 === 0 ? '正例' : index % 3 === 1 ? '负例' : '边界',
    difficulty: index % 3 === 0 ? '简单' : index % 3 === 1 ? '中等' : '困难',
    priority: index % 3 === 0 ? 'P0' : 'P1',
    tags: [index % 2 ? '办理' : '咨询', index === 2 || index === 6 ? '多轮' : '单轮'],
    note: '虚构业务样例，仅用于 Web 交互体验。',
    sources: [],
  }))
  const changed = JSON.parse(JSON.stringify(cases)) as TestCase[]
  changed[0]!.expected = '核对身份后转人工审核，保留审批记录。'
  changed.pop()
  changed.push({
    ...cases[0]!,
    id: 'case-13',
    question: '申请金额为零时如何提示？',
    category: '边界',
  })
  const state: PreviewState = {
    schema: 2,
    revision: 0,
    targets,
    datasets: [
      {
        id: 'ds-service',
        name: '客户服务 · 端到端回归',
        targetId: 'agent-service',
        archived: false,
        ephemeral: false,
        draft: null,
        draftBase: null,
        versions: [
          {
            version: 1,
            cases: structuredClone(cases),
            note: '首个发布基线，覆盖意图、路由、多轮和工具',
            createdAt: '2026-08-20T02:00:00.000Z',
            sources: ['ds-loan@1', 'ds-faq@1'],
          },
          {
            version: 2,
            cases: changed,
            note: '修正身份核验预期，替换一条边界用例',
            createdAt: '2026-09-05T02:00:00.000Z',
            sources: ['ds-service@1'],
          },
        ],
      },
      {
        id: 'ds-loan',
        name: '贷款办理 · Skill 单元集',
        targetId: 'skill-loan',
        archived: false,
        ephemeral: false,
        draft: null,
        draftBase: null,
        versions: [
          {
            version: 1,
            cases: structuredClone(cases.filter((c) => c.expectedSkill === 'skill-loan')),
            note: '办理场景',
            createdAt: '2026-08-20T02:00:00.000Z',
            sources: [],
          },
        ],
      },
      {
        id: 'ds-faq',
        name: '常见问题 · Skill 单元集',
        targetId: 'skill-faq',
        archived: false,
        ephemeral: false,
        draft: null,
        draftBase: null,
        versions: [
          {
            version: 1,
            cases: structuredClone(cases.filter((c) => c.expectedSkill === 'skill-faq')),
            note: '说明性问答',
            createdAt: '2026-08-20T02:00:00.000Z',
            sources: [],
          },
        ],
      },
      {
        id: 'ds-regression',
        name: '重点问题回归集',
        targetId: 'agent-service',
        archived: false,
        ephemeral: false,
        draft: null,
        draftBase: null,
        versions: [
          {
            version: 1,
            cases: structuredClone(cases.slice(0, 2)),
            note: '重点场景',
            createdAt: '2026-09-05T02:00:00.000Z',
            sources: [],
          },
        ],
      },
    ],
    evaluators: [
      {
        id: 'ev-rule',
        name: '路由与工具校验',
        description: '核对期望 Skill、工具名与必填参数',
        archived: false,
        versions: [1, 2].map((version) => ({
          version,
          kind: 'rule' as const,
          rule: JSON.stringify({ type: 'tool', tool: 'credit_check', required: ['amount'] }),
          prompt: '',
          model: '',
          resourceId: 'public-model',
          children: [],
          threshold: 0.8,
          shortCircuit: true,
          note: version === 1 ? '初始发布' : '补充字段校验',
        })),
      },
      {
        id: 'ev-llm',
        name: '业务回答质量',
        description: '检查事实依据、业务约束和解释完整性',
        archived: false,
        versions: [
          {
            version: 1,
            kind: 'llm',
            rule: '',
            prompt:
              '依据 {{input}} 和 {{expected}}，评估 {{output}} 是否准确，输出0到1分数与理由。',
            model: '体验模型',
            resourceId: 'public-model',
            children: [],
            threshold: 0.8,
            shortCircuit: false,
            note: '初始发布',
          },
        ],
      },
      {
        id: 'ev-composite',
        name: '上线基础标准',
        description: '先检查结构，再按业务质量综合评分',
        archived: false,
        versions: [
          {
            version: 1,
            kind: 'composite',
            rule: '',
            prompt: '',
            model: '体验模型',
            resourceId: 'public-model',
            children: [
              { id: 'ev-rule', version: 1, weight: 0.4 },
              { id: 'ev-llm', version: 1, weight: 0.6 },
            ],
            threshold: 0.8,
            shortCircuit: true,
            note: '子项版本固定，结构错误终止后续评分',
          },
        ],
      },
    ],
    credentials: [
      {
        id: 'public-model',
        name: '团队公共资源',
        kind: 'public',
        model: '体验模型',
        enabled: true,
        healthy: true,
        mask: '示例凭据 · ****pub',
      },
      {
        id: 'private-model',
        name: '我的专用资源',
        kind: 'private',
        model: '体验模型',
        enabled: true,
        healthy: true,
        mask: '示例凭据 · ****own',
      },
      {
        id: 'expired-model',
        name: '已失效的专用资源',
        kind: 'private',
        model: '体验模型',
        enabled: true,
        healthy: false,
        mask: '示例凭据 · ****old',
      },
    ],
    runs: [],
    comparisons: [],
    reviews: [],
    suggestions: [],
    analyses: [],
    templates: [],
    audit: [],
    publicConcurrency: 4,
    role: 'editor',
  }
  const config: ExecutionConfig = {
    targetId: 'agent-service',
    targetVersion: 'v1',
    datasetId: 'ds-service',
    datasetVersion: 1,
    evaluatorRefs: [
      { id: 'ev-rule', version: 1 },
      { id: 'ev-llm', version: 1 },
    ],
    concurrency: 4,
    timeout: 60,
    retries: 1,
    sampling: 100,
    caseIds: cases.map((c) => c.id),
    resourceId: 'public-model',
    resourcePurpose: 'both',
    model: '体验模型',
    scheduledAt: null,
    fault: 'none',
    threshold: 0.8,
  }
  const seeds: [string, string, ExecutionConfig][] = [
    ['run-baseline', '客户服务基线', config],
    ['run-candidate', '路由边界优化验证', { ...config, targetVersion: 'v2' }],
    [
      'run-changed',
      '新测评集下的候选验证',
      { ...config, targetVersion: 'v2', datasetVersion: 2, caseIds: changed.map((c) => c.id) },
    ],
    [
      'run-skill',
      '贷款 Skill 单测',
      { ...config, targetId: 'skill-loan', datasetId: 'ds-loan', caseIds: [] },
    ],
  ]
  for (const [id, name, runConfig] of seeds) {
    const run = buildRun(state, runConfig, name)
    run.id = id
    completeRun(run)
    state.runs.push(run)
  }
  const error = buildRun(state, { ...config, fault: 'infrastructure' }, '执行中断待恢复')
  error.id = 'run-error'
  error.status = 'failed'
  error.error = '体验故障：执行节点中断，尚有未完成用例。'
  error.results = state.runs[0]!.results.slice(0, 3)
  state.runs.push(error)
  state.comparisons.push({
    id: 'cmp-release',
    name: '路由边界优化 · 发布评审',
    mode: 'controlled',
    baselineRunId: 'run-baseline',
    candidateRunIds: ['run-candidate'],
    rules: [
      { metric: 'score', operator: '>=', threshold: 0.8 },
      { metric: 'errorRate', operator: '<=', threshold: 0.02 },
      { metric: 'latency', operator: '<=', threshold: 1500 },
    ],
    createdAt: new Date().toISOString(),
    sourceId: null,
    suggestionId: null,
  })
  state.runs[0]!.comparisonId = 'cmp-release'
  state.runs[1]!.comparisonId = 'cmp-release'
  state.suggestions = [
    {
      id: 'suggest-routing',
      title: '明确贷款办理与常见问题的路由边界',
      kind: 'prompt',
      priority: 'P0',
      targetId: 'agent-service',
      targetVersion: 'v1',
      runId: 'run-baseline',
      caseIds: ['case-02', 'case-03', 'case-07'],
      evidence: '3条办理输入被路由到常见问题，Trace 显示未调用征信工具。',
      hypothesis: 'Agent Prompt 与两个 Skill 的职责描述重叠，可能导致路由偏差；需要回归验证。',
      action: '在源平台补充办理意图优先级及反例，并关联发布后的新版本。',
      decision: 'pending',
      feedback: '',
      linkedVersion: null,
      comparisonId: null,
    },
    {
      id: 'suggest-case',
      title: '补充身份核验的期望说明',
      kind: 'dataset',
      priority: 'P1',
      targetId: 'agent-service',
      targetVersion: 'v1',
      runId: 'run-baseline',
      caseIds: ['case-01'],
      evidence: '用例期望只写人工审核，未说明身份核验前提。',
      hypothesis: '期望描述可能不完整，需业务人员核实。',
      action: '修订测评集期望并发布新版本，再让基线与候选在新版本输入上共同执行。',
      decision: 'pending',
      feedback: '',
      linkedVersion: null,
      comparisonId: null,
    },
  ]
  state.templates = [
    { id: 'template-regression', name: '日常全量回归', config: structuredClone(config) },
    {
      id: 'template-smoke',
      name: '核心场景快速检查',
      config: {
        ...structuredClone(config),
        sampling: 25,
        caseIds: cases.slice(0, 3).map((c) => c.id),
        concurrency: 2,
      },
    },
  ]
  state.audit.push({
    id: 'audit-seed',
    subject: '体验工作区',
    action: '初始化虚构样例；所有记录均为 Mock',
    time: new Date().toISOString(),
    actor: '体验系统',
  })
  return state
}
