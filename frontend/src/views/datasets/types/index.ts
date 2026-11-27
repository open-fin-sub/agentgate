export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export const caseCategoryLabels = {
  positive: '正例',
  negative: '负例',
  boundary: '边界',
} as const;
export type CaseCategory = keyof typeof caseCategoryLabels;

export const caseDifficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
} as const;
export type CaseDifficulty = keyof typeof caseDifficultyLabels;
export type DatasetVersionStatus = 'draft' | 'published';

export type Condition =
  | { kind: 'equals'; expected: JsonValue }
  | { kind: 'within_tolerance'; expected: number; epsilon: number }
  | { kind: 'within_range'; minimum: number | null; maximum: number | null }
  | { kind: 'matches_pattern'; pattern: string }
  | { kind: 'one_of'; allowed: JsonValue[] }
  | { kind: 'must_be_missing' }
  | { kind: 'matches_json_schema'; json_schema: JsonObject };

export const conditionLabels = {
  equals: '等于',
  within_tolerance: '数值容差',
  within_range: '数值范围',
  matches_pattern: '正则匹配',
  one_of: '属于集合',
  must_be_missing: '字段不存在',
  matches_json_schema: 'JSON Schema',
} as const satisfies Record<Condition['kind'], string>;

export const toolOccurrenceLabels = {
  last: '最后一次调用',
  first: '第一次调用',
  any: '任意一次通过',
  all: '所有调用通过',
} as const;

interface ExpectationBase {
  id: string;
  name: string | null;
  condition: Condition;
}

export type Expectation =
  | (ExpectationBase & { kind: 'state'; path: string })
  | (ExpectationBase & {
      kind: 'tool_argument';
      tool: string;
      path: string;
      occurrence: keyof typeof toolOccurrenceLabels;
    })
  | (ExpectationBase & { kind: 'output'; path: string | null });

export type SerializedExpectation =
  | {
      id: string;
      name: string | null;
      kind: 'execution_path';
      scope: 'workflow' | 'tool' | 'skill';
      expected: string[];
      allowed_tools: string[] | null;
    }
  | Expectation
  | { id: string; name: string | null; kind: 'skill_route'; condition: Condition }
  | {
      id: string;
      name: string | null;
      kind: 'tool_call';
      tool: string;
      mode: 'required' | 'forbidden';
    }
  | { id: string; name: string | null; kind: 'policy'; policy_id: string };
export interface CaseTurn {
  id: string;
  input: JsonObject;
  extensions?: { key: string; value: string }[];
  expected_skill: string | null;
  expectations: Expectation[];
  required_tools: string[];
  forbidden_tools: string[];
  policy_rules: string[];
  notes: string;
  original_expectations?: SerializedExpectation[];
  preserved_skill_routes?: {
    id: string;
    name: string | null;
    kind: 'skill_route';
    condition: Condition;
  }[];
}

export interface EvaluationCase {
  id: string;
  name: string;
  turns: CaseTurn[];
  initial_state: JsonObject;
  category: CaseCategory | null;
  difficulty: CaseDifficulty | null;
  tags: string[];
  notes: string;
}

export interface DatasetRecord {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  deleted_version_high_watermark?: number;
  created_at: string;
  updated_at: string;
}

export interface DatasetSummary extends DatasetRecord {
  version: number | null;
  case_count: number;
  has_draft: boolean;
  draft_case_count?: number | null;
  draft_based_on_version?: number | null;
}

export function hasPublicationHistory(dataset: DatasetSummary): boolean {
  return dataset.version != null || (dataset.deleted_version_high_watermark ?? 0) > 0;
}

export interface DatasetVersion {
  id: string;
  dataset_id: string;
  dataset_name: string;
  dataset_description: string;
  version: number | null;
  status: DatasetVersionStatus;
  based_on_version: number | null;
  cases: EvaluationCase[];
  notes: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  content_sha256: string;
}

export interface DatasetDetail {
  dataset: DatasetRecord;
  versions: DatasetVersion[];
}

export interface DatasetMutation {
  dataset: DatasetRecord;
  draft: DatasetVersion;
}

export interface DatasetExport {
  format: 'agentgate.dataset';
  format_version: '1';
  dataset: DatasetRecord;
  version: DatasetVersion;
}

export interface ValidationIssue {
  path: string;
  message: string;
}
