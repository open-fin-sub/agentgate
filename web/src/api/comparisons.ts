import { request } from './client'
import type { EvaluationComparison } from '../types/comparison'

export function compareRuns(baseline: string, candidate: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ baseline_run_id: baseline, candidate_run_id: candidate })
  return request<EvaluationComparison>(`/api/run-comparisons?${query}`, { signal })
}
