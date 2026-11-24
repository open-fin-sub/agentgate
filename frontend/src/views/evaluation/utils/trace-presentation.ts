import { jsonLanguage } from '@codemirror/lang-json';
import type { SampleResourceUsage, Trace } from '../../../api/evaluations';

type ObservedSpan = Trace['spans'][number] & {
  parent_span_id?: string | null;
  started_at?: string;
  ended_at?: string;
  status?: string;
  events?: readonly Record<string, unknown>[];
};

export interface TraceNode {
  id: string;
  name: string;
  operationType: string;
  status: string;
  durationMs: number | null;
  depth: number;
  parentIndex: number | null;
  orphan: boolean;
  offsetPercent: number | null;
  durationPercent: number | null;
}

export interface TracePresentation {
  nodes: TraceNode[];
  json: string;
  spanRanges: Map<string, { from: number; to: number }>;
}

export interface TraceEvidence {
  input?: unknown;
  output?: unknown;
  error?: unknown;
}

export interface TraceSummaryContext {
  agentName?: string | null;
  expectedTurnIds?: readonly string[];
  resourceUsage?: Pick<SampleResourceUsage, 'total_tokens' | 'duration_ms' | 'token_status'> | null;
}

export interface TraceSummary {
  traceId: string;
  agentName: string | null;
  status: 'ok' | 'error' | 'unset';
  durationMs: number | null;
  totalTokens: number | null;
  tokenStatus: SampleResourceUsage['token_status'];
  reactStepCount: number | null;
}

function turnId(span: ObservedSpan): string | undefined {
  const id = span.attributes['agentgate.turn.id'];
  return typeof id === 'string' && id ? id : undefined;
}

function ownValue(object: object, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(object, key)
    ? (object as Record<string, unknown>)[key]
    : undefined;
}

function firstDefined(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined);
}

function turnInput(span: ObservedSpan | undefined): unknown {
  return firstDefined(
    span?.attributes['agentgate.turn.input'],
    span?.attributes['trace_sdk.input'],
  );
}

function spanError(span: ObservedSpan): unknown {
  const errors = span.events?.filter((event) => event.name === 'exception');
  return firstDefined(
    span.attributes['agentgate.execution.error'],
    span.attributes['trace_sdk.error'],
    errors?.length === 1
      ? (errors[0].attributes ?? errors[0])
      : errors?.length
        ? errors
        : undefined,
  );
}

function byTurn(values: [string, unknown][], turnCount = values.length): unknown {
  if (!values.length) return undefined;
  return turnCount > 1 ? Object.fromEntries(values) : values[0][1];
}

export function traceEvidence(trace: Trace, spanId?: string | null): TraceEvidence {
  const outcomes = trace.turn_outcomes ?? {};
  if (spanId != null) {
    const span: ObservedSpan | undefined = trace.spans.find((item) => item.span_id === spanId);
    if (!span) return {};
    const attrs = span.attributes;
    const id = span.operation_type === 'turn' ? turnId(span) : undefined;
    const outcome =
      id && Object.prototype.hasOwnProperty.call(outcomes, id) ? outcomes[id] : undefined;
    return {
      input: firstDefined(
        outcome?.input,
        span.operation_type === 'turn' ? turnInput(span) : attrs['trace_sdk.input'],
        span.operation_type === 'tool' ? attrs.arguments : undefined,
      ),
      output: firstDefined(
        outcome?.output,
        span.operation_type === 'turn' ? attrs['agentgate.turn.output'] : undefined,
        span.operation_type === 'case' ? attrs['agentgate.final.output'] : undefined,
        attrs['trace_sdk.output'],
      ),
      error: firstDefined(outcome && ownValue(outcome, 'error'), spanError(span)),
    };
  }

  const turns = new Map<string, ObservedSpan>();
  const errors = new Map<string, unknown>();
  for (const [id, outcome] of Object.entries(outcomes)) {
    const error = ownValue(outcome, 'error');
    if (error !== undefined) errors.set(id, error);
  }
  const cases: ObservedSpan[] = [];
  for (const span of trace.spans) {
    if (span.operation_type === 'case') cases.push(span);
    if (span.operation_type !== 'turn') continue;
    const id = turnId(span);
    if (id) turns.set(id, span);
    const error = spanError(span);
    const errorId = id ?? span.span_id;
    if (error !== undefined && !errors.has(errorId)) errors.set(errorId, error);
  }
  const order = [...turns.entries()].sort(([, a], [, b]) => a.sequence - b.sequence);
  const ids = new Set([...order.map(([id]) => id), ...Object.keys(outcomes)]);
  const inputs: [string, unknown][] = [];
  for (const id of ids) {
    const outcome = Object.prototype.hasOwnProperty.call(outcomes, id) ? outcomes[id] : undefined;
    const input = firstDefined(outcome?.input, turnInput(turns.get(id)));
    if (input !== undefined) inputs.push([id, input]);
  }
  return {
    input: byTurn(inputs, ids.size),
    output: trace.final_output,
    error: firstDefined(cases.length === 1 ? spanError(cases[0]) : undefined, byTurn([...errors])),
  };
}

function unwrapJson(value: unknown, depth: number): unknown {
  if (depth >= 8) return value;
  if (typeof value === 'string') {
    const prefix = value.trimStart()[0];
    if (prefix !== '{' && prefix !== '[') return value;
    try {
      return unwrapJson(JSON.parse(value), depth + 1);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map((item) => unwrapJson(item, depth + 1));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, unwrapJson(item, depth + 1)]),
    );
  }
  return value;
}

export function formatTraceEvidence(evidence: TraceEvidence): string {
  return JSON.stringify(unwrapJson(evidence, 0), null, 2);
}

function spanTiming(span: ObservedSpan): { start: number; end: number } | null {
  if (typeof span.started_at !== 'string' || typeof span.ended_at !== 'string') return null;
  const start = Date.parse(span.started_at);
  const end = Date.parse(span.ended_at);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? { start, end } : null;
}

function completeTurns(trace: Trace, expectedTurnIds: readonly string[]): readonly ObservedSpan[] {
  const expected = new Set(expectedTurnIds);
  const turns: ObservedSpan[] = trace.spans.filter((span) => span.operation_type === 'turn');
  if (!expected.size || turns.length !== expected.size) return [];
  for (const turn of turns) {
    const id = turnId(turn);
    if (id === undefined || !expected.delete(id)) return [];
  }
  return turns;
}

function executionStatus(
  caseSpan: ObservedSpan | undefined,
  turns: readonly ObservedSpan[],
): TraceSummary['status'] {
  if (caseSpan?.status === 'ok' || caseSpan?.status === 'error') return caseSpan.status;
  if (turns.some((turn) => turn.status === 'error')) return 'error';
  return turns.length && turns.every((turn) => turn.status === 'ok') ? 'ok' : 'unset';
}

function turnTiming(turns: readonly ObservedSpan[]): ReturnType<typeof spanTiming> {
  if (!turns.length) return null;
  let start = Infinity;
  let end = -Infinity;
  for (const turn of turns) {
    const timing = spanTiming(turn);
    if (!timing) return null;
    start = Math.min(start, timing.start);
    end = Math.max(end, timing.end);
  }
  return { start, end };
}

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function observationSubtotal(trace: Trace): number | null {
  const observations = new Map<string, readonly [number | null, number | null]>();
  const conflicts = new Set<string>();
  const spans: readonly ObservedSpan[] = trace.spans;
  for (const span of spans) {
    for (const event of span.events ?? []) {
      if (event.event_type !== 'observation') continue;
      const id = event.event_id;
      if (typeof id !== 'string' || !id.trim()) continue;
      const source = event.trace_id || span.attributes['trace_sdk.trace_id'] || trace.trace_id;
      const prompt = tokenCount(event.prompt_tokens);
      const completion = tokenCount(event.completion_tokens);
      const key = JSON.stringify([source, id]);
      const previous = observations.get(key);
      if (previous && (previous[0] !== prompt || previous[1] !== completion)) conflicts.add(key);
      observations.set(key, [prompt, completion]);
    }
  }
  let total: number | null = null;
  for (const [key, values] of observations) {
    if (conflicts.has(key)) continue;
    for (const value of values) {
      if (value !== null) total = (total ?? 0) + value;
    }
  }
  return tokenCount(total);
}

export function summarizeTrace(trace: Trace, context: TraceSummaryContext = {}): TraceSummary {
  const cases: ObservedSpan[] = trace.spans.filter(
    (span) => span.operation_type === 'case' && span.attributes['platform.simulated'] !== true,
  );
  const caseSpan = cases.length === 1 ? cases[0] : undefined;
  const turns = completeTurns(trace, context.expectedTurnIds ?? Object.keys(trace.turn_outcomes));
  const timing = (caseSpan ? spanTiming(caseSpan) : null) ?? turnTiming(turns);
  const resource = context.resourceUsage;
  const totalTokens = resource ? resource.total_tokens : observationSubtotal(trace);
  return {
    traceId: trace.trace_id,
    agentName: context.agentName?.trim() || null,
    status: executionStatus(caseSpan, turns),
    durationMs: resource ? resource.duration_ms : timing ? timing.end - timing.start : null,
    totalTokens,
    tokenStatus: resource?.token_status ?? (totalTokens === null ? 'unavailable' : 'partial'),
    reactStepCount: null,
  };
}

function spanRanges(json: string, spans: readonly ObservedSpan[]): TracePresentation['spanRanges'] {
  const ranges: TracePresentation['spanRanges'] = new Map();
  const root = jsonLanguage.parser.parse(json).topNode.getChild('Object');
  const property = root?.getChildren('Property').find((item) => {
    const key = item.getChild('PropertyName');
    return key && JSON.parse(json.slice(key.from, key.to)) === 'spans';
  });
  // Only direct objects in the top-level spans array identify execution nodes.
  const objects = property?.getChild('Array')?.getChildren('Object') ?? [];
  objects.forEach((object, index) => {
    ranges.set(spans[index].span_id, { from: object.from, to: object.to });
  });
  return ranges;
}

function parentIndices(spans: readonly ObservedSpan[]): (number | null)[] {
  const byId = new Map(spans.map((span, index) => [span.span_id, index]));
  const parents = spans.map((span) => byId.get(span.parent_span_id ?? '') ?? null);
  const visited = new Uint8Array(spans.length);
  for (let start = 0; start < spans.length; start++) {
    if (visited[start]) continue;
    const path: number[] = [];
    let current: number | null = start;
    while (current !== null && visited[current] === 0) {
      visited[current] = 1;
      path.push(current);
      current = parents[current];
    }
    // Cut one edge per cycle without dropping any node or changing the source Trace.
    if (current !== null && visited[current] === 1) parents[current] = null;
    path.forEach((index) => (visited[index] = 2));
  }
  return parents;
}

export function buildTracePresentation(trace: Trace): TracePresentation {
  const json = JSON.stringify(trace, null, 2);
  const spans: readonly ObservedSpan[] = trace.spans;
  const spanIds = new Set(spans.map((span) => span.span_id));
  const parents = parentIndices(spans);
  const ordered = spans
    .map((_, index) => index)
    .sort((a, b) => spans[a].sequence - spans[b].sequence || a - b);
  const children = new Map<number | null, number[]>();
  for (const index of ordered) {
    const siblings = children.get(parents[index]);
    if (siblings) siblings.push(index);
    else children.set(parents[index], [index]);
  }

  const timings = spans.map(spanTiming);
  let first = Infinity;
  let last = -Infinity;
  for (const timing of timings) {
    if (!timing) continue;
    first = Math.min(first, timing.start);
    last = Math.max(last, timing.end);
  }
  const elapsed = last - first;
  const nodes: TraceNode[] = [];
  const pending = [...(children.get(null) ?? [])].reverse().map((index) => ({
    index,
    depth: 0,
    parentIndex: null as number | null,
  }));
  while (pending.length) {
    const { index, depth, parentIndex } = pending.pop()!;
    const span = spans[index];
    const timing = timings[index];
    const offset = timing ? (elapsed > 0 ? ((timing.start - first) / elapsed) * 100 : 0) : null;
    const width = timing ? (elapsed > 0 ? ((timing.end - timing.start) / elapsed) * 100 : 0) : null;
    const displayIndex = nodes.length;
    nodes.push({
      id: span.span_id,
      name: span.name,
      operationType: span.operation_type,
      status: span.status ?? 'unset',
      durationMs: timing ? timing.end - timing.start : null,
      depth,
      parentIndex,
      orphan: !!span.parent_span_id && !spanIds.has(span.parent_span_id),
      offsetPercent: offset,
      durationPercent: width === null ? null : Math.min(width, 100 - (offset ?? 0)),
    });
    const descendants = children.get(index) ?? [];
    for (let i = descendants.length - 1; i >= 0; i--)
      pending.push({ index: descendants[i], depth: depth + 1, parentIndex: displayIndex });
  }
  return { nodes, json, spanRanges: spanRanges(json, spans) };
}
