export type Outcome = 'pass' | 'fail' | 'review' | 'NA' | 'error'
export type RunStatus =
  'scheduled' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'terminated'
export interface TargetVersion {
  toolDefinitions?: { name: string; inputSchema: string; outputSchema: string }[]
  skillDefinitions?: {
    id: string
    version: string
    name: string
    description: string
    prompt: string
    tools: { name: string; inputSchema: string; outputSchema: string }[]
  }[]
  id: string
  label: string
  prompt: string
  tools: string[]
  skills: string[]
  executable: boolean
  note: string
}
export interface Target {
  id: string
  name: string
  type: 'Agent' | 'Skill'
  form: string
  platform: string
  description: string
  versions: TargetVersion[]
}
export interface TestCase {
  id: string
  question: string
  turns: { input: string; expected: string }[]
  expected: string
  expectedSkill: string
  variables: string
  files: string[]
  category: '正例' | '负例' | '边界'
  difficulty: '简单' | '中等' | '困难'
  priority: 'P0' | 'P1' | 'P2'
  tags: string[]
  note: string
  sources: string[]
}
export interface DatasetVersion {
  version: number
  cases: TestCase[]
  note: string
  createdAt: string
  sources: string[]
}
export interface Dataset {
  id: string
  name: string
  targetId: string
  archived: boolean
  ephemeral: boolean
  versions: DatasetVersion[]
  draft: TestCase[] | null
  draftBase: number | null
}
export interface EvaluatorVersion {
  version: number
  kind: 'rule' | 'llm' | 'composite'
  rule: string
  prompt: string
  model: string
  resourceId: string
  children: { id: string; version: number; weight: number }[]
  threshold: number
  shortCircuit: boolean
  note: string
}
export interface Evaluator {
  id: string
  name: string
  description: string
  archived: boolean
  versions: EvaluatorVersion[]
}
export interface ExecutionConfig {
  targetId: string
  targetVersion: string
  datasetId: string
  datasetVersion: number
  evaluatorRefs: { id: string; version: number }[]
  concurrency: number
  timeout: number
  retries: number
  sampling: number
  caseIds: string[]
  resourceId: string
  resourcePurpose: 'execution' | 'scoring' | 'both'
  executionResourceId?: string
  scoringResourceId?: string
  model: string
  scheduledAt: string | null
  fault: 'none' | 'infrastructure' | 'missing-trace' | 'missing-usage'
  threshold: number
}
export interface TraceStep {
  id: string
  title: string
  input: string
  output: string
  duration: number | null
  tokens: number | null
  error: string | null
}
export interface CaseResult {
  caseId: string
  outcome: Outcome
  score: number | null
  reason: string
  output: string
  actualSkill: string
  latency: number | null
  tokens: number | null
  inputTokens: number | null
  outputTokens: number | null
  trace: TraceStep[]
  checks: {
    evaluatorId: string
    evaluatorVersion: number
    dimension: string
    name: string
    outcome: Outcome
    score: number | null
    reason: string
  }[]
}
export interface HumanReview {
  runId: string
  caseId: string
  decision: 'confirmed' | 'dismissed' | 'pending'
  score: number | null
  reason: string
  actor: string
  time: string
}
export interface AuditEntry {
  id: string
  subject: string
  action: string
  time: string
  actor: string
}
export interface Run {
  phase?: 'execution' | 'waiting-scoring' | 'scoring'
  phaseStartedAt?: string
  id: string
  name: string
  config: ExecutionConfig
  cases: TestCase[]
  target: Target
  evaluators: Evaluator[]
  status: RunStatus
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  results: CaseResult[]
  sourceRunId: string | null
  comparisonId: string | null
  error: string | null
  retryScope?: 'all' | 'unfinished' | 'failed' | 'single'
  attempt?: number
}
export interface GateRule {
  metric: 'score' | 'passRate' | 'errorRate' | 'latency' | 'tokens'
  operator: '>=' | '<='
  threshold: number
}
export interface Comparison {
  id: string
  name: string
  mode: 'controlled' | 'historical'
  baselineRunId: string
  candidateRunIds: string[]
  rules: GateRule[]
  createdAt: string
  sourceId: string | null
  suggestionId: string | null
}
export interface Suggestion {
  id: string
  title: string
  kind: 'prompt' | 'skill' | 'tool' | 'dataset'
  priority: 'P0' | 'P1' | 'P2'
  targetId: string
  targetVersion: string
  runId: string
  caseIds: string[]
  evidence: string
  hypothesis: string
  action: string
  decision: 'pending' | 'adopted' | 'ignored'
  feedback: string
  linkedVersion: string | null
  comparisonId: string | null
}
export interface StaticAnalysis {
  id: string
  targetId: string
  targetVersion: string
  createdAt: string
  status: 'running' | 'completed' | 'failed'
  risks: {
    id: string
    title: string
    skills: string[]
    fragment: string
    reason: string
    severity: '高' | '中' | '低'
  }[]
}
export interface Credential {
  id: string
  name: string
  kind: 'public' | 'private'
  model: string
  enabled: boolean
  healthy: boolean
  mask: string
}
export interface RunTemplate {
  id: string
  name: string
  config: ExecutionConfig
}
export interface PreviewState {
  schema: 2
  revision: number
  targets: Target[]
  datasets: Dataset[]
  evaluators: Evaluator[]
  runs: Run[]
  comparisons: Comparison[]
  reviews: HumanReview[]
  suggestions: Suggestion[]
  analyses: StaticAnalysis[]
  credentials: Credential[]
  templates: RunTemplate[]
  audit: AuditEntry[]
  publicConcurrency: number
  role: 'editor' | 'viewer' | 'admin'
}
