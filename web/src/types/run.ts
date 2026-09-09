import type { DatasetVersion } from './dataset'
import type { EvaluatorOption } from '../api/client'

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface EvaluationRun {
  id: string
  status: RunStatus
  manifest: {
    target: {
      display_name: string
      ref: {
        source_id: string
        target_type: 'agent' | 'skill'
        external_target_id: string
        external_version_id: string
      }
      descriptor_sha256: string
    }
    dataset: DatasetVersion
    evaluator_specs: EvaluatorOption[]
    primary_evaluator_ids: string[]
    gate_spec: { minimum_score: number }
    metric_plan: { id: string; version: string }
    timeout_seconds: number
  }
  created_at: string
  started_at: string | null
  completed_at: string | null
  error: string | null
}

export interface RunProgress {
  run_id: string
  status: RunStatus
  dataset_id: string
  dataset_version: number
  dataset_name: string
  target_name: string
  target_version: string
  total_cases: number
  completed_cases: number
  progress: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  error: string | null
  queue_position: number | null
}

export type RunStatusCounts = Record<RunStatus, number>

export interface RunActivity {
  status_counts: RunStatusCounts
  queued: RunProgress[]
  running: RunProgress[]
  recent: RunProgress[]
}
