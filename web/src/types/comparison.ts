import type { Metric, Outcome, ReleaseGate } from '../api/client'

export type ComparisonChange = 'unchanged' | 'improvement' | 'regression' | 'changed'
export interface EvaluationComparison {
  baseline_run_id: string
  candidate_run_id: string
  baseline_target_version: string
  candidate_target_version: string
  baseline_gate: ReleaseGate
  candidate_gate: ReleaseGate
  overall_score_delta: number | null
  metric_deltas: {
    level: Metric['level']
    key: string
    baseline: Metric
    candidate: Metric
    score_delta: number | null
  }[]
  case_deltas: {
    case_id: string
    evaluator_id: string
    baseline_outcome: Outcome | null
    candidate_outcome: Outcome | null
    baseline_score: number | null
    candidate_score: number | null
    score_delta: number | null
    change: ComparisonChange
  }[]
}
