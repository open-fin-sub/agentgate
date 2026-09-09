import { request } from './client'
import type { LineageGraph, LineageSubject } from '../types/lineage'

export function readLineage(subject: LineageSubject, limit = 50, signal?: AbortSignal) {
  const encode = (value?: string) => encodeURIComponent(value ?? '')
  const id = encode(subject.id),
    version = encode(subject.version)
  const paths = {
    run: `/runs/${id}/lineage`,
    dataset: `/datasets/${id}/versions/${version}/lineage`,
    case: `/datasets/${id}/versions/${version}/cases/${encode(subject.caseId)}/lineage`,
    target: `/targets/${encode(subject.sourceId)}/${encode(subject.targetType)}/${id}/versions/${version}/lineage`,
    skill: `/skills/${encode(subject.sourceId)}/${id}/versions/${version}/lineage`,
    evaluator: `/evaluators/${id}/versions/${version}/lineage`,
  }
  const query = new URLSearchParams({ limit: String(limit) })
  if (subject.hash) query.set('content_sha256', subject.hash)
  return request<LineageGraph>(`/api${paths[subject.kind]}?${query}`, { signal })
}
