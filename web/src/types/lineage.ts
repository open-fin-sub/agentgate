export type LineageKind = 'run' | 'dataset' | 'case' | 'agent' | 'skill' | 'evaluator'
export interface LineageNode {
  id: string
  kind: LineageKind
  external_id: string
  label: string
  version: string | null
  content_sha256: string | null
}
export interface LineageGraph {
  root_node_id: string
  nodes: LineageNode[]
  edges: {
    source_id: string
    target_id: string
    relation:
      | 'uses_dataset'
      | 'contains_case'
      | 'evaluates_agent'
      | 'evaluates_skill'
      | 'includes_skill'
      | 'uses_evaluator'
  }[]
}
export interface LineageSubject {
  kind: 'run' | 'dataset' | 'case' | 'target' | 'skill' | 'evaluator'
  id: string
  version?: string
  caseId?: string
  sourceId?: string
  targetType?: 'agent' | 'skill'
  hash?: string
}
