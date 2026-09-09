import type { DatasetSummary, DatasetVersion, EvaluationCase } from '../types/dataset'
import type { EvaluationRun } from '../types/run'

export interface Version {
  id: string
  label: string
}
export type DatasetOption = DatasetSummary
export interface EvaluatorSummary {
  id: string
  name: string
  enabled: boolean
  source: 'builtin' | 'user'
  latest_version: string | null
  kind: EvaluatorOption['kind'] | null
  has_draft: boolean
}
export interface EvaluatorOption {
  id: string
  name: string
  kind: 'rule' | 'llm_judge' | 'hybrid'
  version: string
  dimension: string
  metric: string
  severity: 'standard' | 'blocking'
  implementation_id: string
  implementation_version: string
  config: Record<string, unknown>
  content_sha256: string
  children: { evaluator_id: string; evaluator_version: string; weight: number | null }[]
  combination: Record<string, unknown> | null
}
export type Outcome = 'pass' | 'fail' | 'review' | 'not_applicable' | 'error'
export interface CheckResult {
  id: string
  name: string
  turn_id: string | null
  expectation_id: string | null
  outcome: Outcome
  score: number | null
  reason: string
  expected: unknown
  actual: unknown
  actual_missing: boolean
  span_ids: string[]
  failure_stage: string | null
  failure_sequence: number | null
  failure_span_id: string | null
}
export interface EvaluationResult {
  evaluator_version: string
  evaluator_content_sha256: string
  trace_id: string
  case_id: string
  evaluator_id: string
  evaluator_name: string
  evaluator_kind: string
  dimension: string
  metric: string
  severity: 'standard' | 'blocking'
  outcome: Outcome
  score: number | null
  reason: string
  primary_failure_stage?: string
  checks: CheckResult[]
  judge_record: {
    provider_id: string
    requested_model: string
    resolved_model: string | null
    request_sha256: string
    raw_response: string
    request_id: string | null
    input_tokens: number | null
    output_tokens: number | null
    latency_ms: number | null
  } | null
  error_detail: {
    category: 'crash' | 'timeout' | 'invalid_output'
    exception_type: string
    message: string
    retryable: boolean
    reference: string | null
  } | null
}
export type ReleaseGateReason =
  | 'threshold_met'
  | 'score_below_threshold'
  | 'missing_results'
  | 'evaluator_error'
  | 'blocking_failure'
  | 'review_required'
  | 'no_applicable_results'
export interface ReleaseGate {
  outcome: 'pass' | 'fail'
  missing_results: [string, string][]
  score: number | null
  minimum_score: number
  reason_code: ReleaseGateReason
}
export interface Metric {
  key: string
  level: 'overall' | 'kind' | 'dimension' | 'metric'
  score: number | null
  passed: number
  failed: number
  reviewed: number
  not_applicable: number
  errors: number
  applicable: number
  total: number
}
export interface Report {
  run: EvaluationRun
  results: EvaluationResult[]
  release_gate: ReleaseGate
  metrics: Metric[]
}
export interface TraceOutcome {
  input: Record<string, unknown>
  output: Record<string, unknown>
  state: Record<string, unknown>
}
export interface Trace {
  trace_id: string
  case_id: string
  spans: {
    span_id: string
    name: string
    operation_type: string
    sequence: number
    attributes: Record<string, unknown>
  }[]
  turn_outcomes: Record<string, TraceOutcome>
  final_state: Record<string, unknown>
  final_output: Record<string, unknown>
}
export interface Overview {
  pending_runs?: number
  running_runs?: number
  failed_runs?: number
  cancelled_runs?: number
  dataset_count?: number
  total_runs: number
  completed_runs: number
  case_count: number
  latest: Report | null
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(
      Array.isArray(detail)
        ? detail.map((item) => item?.message ?? JSON.stringify(item)).join('；')
        : String(detail ?? `HTTP ${status}`),
    )
    this.status = status
    this.detail = detail
  }
}

export const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init)
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }))
    throw new ApiError(response.status, payload.detail)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

export const api = {
  overview: (signal?: AbortSignal) => request<Overview>('/api/overview', { signal }),
  versions: () => request<Version[]>('/api/versions'),
  datasets: () => request<DatasetSummary[]>('/api/datasets'),
  evaluators: async (signal?: AbortSignal) => {
    const catalog = await request<EvaluatorSummary[]>('/api/evaluators', { signal })
    return Promise.all(catalog.filter(item => item.enabled && item.latest_version).map(item =>
      request<EvaluatorOption>(`/api/evaluators/${encodeURIComponent(item.id)}/versions/${encodeURIComponent(item.latest_version!)}`, { signal }),
    ))
  },
  report: (id: string, signal?: AbortSignal) =>
    request<Report>(`/api/runs/${encodeURIComponent(id)}`, { signal }),
  trace: (runId: string, caseId: string, signal?: AbortSignal) =>
    request<Trace>(`/api/runs/${encodeURIComponent(runId)}/traces/${encodeURIComponent(caseId)}`, {
      signal,
    }),
}

export type { DatasetSummary, DatasetVersion, EvaluationCase }
