import assert from 'node:assert/strict';
import { test } from '@playwright/test';
import type { Trace } from '../src/api/evaluations';
import {
  buildTracePresentation as build,
  formatTraceEvidence,
  summarizeTrace,
  traceEvidence,
} from '../src/views/evaluation/utils/trace-presentation';
type Span = Trace['spans'][number] & { parent_span_id: string | null };
const span = (
  id: string,
  parent: string | null = null,
  sequence = 0,
  extra: Record<string, unknown> = {},
): Span => ({
  span_id: id,
  parent_span_id: parent,
  name: id,
  operation_type: 'tool',
  sequence,
  attributes: {},
  ...extra,
});
const trace = (spans: Span[]): Trace => ({
  trace_id: 'test',
  case_id: 'case',
  spans,
  turn_outcomes: {},
  final_output: {},
  final_state: {},
});
function verify(source: Trace, result: ReturnType<typeof build>) {
  assert.deepEqual(JSON.parse(result.json), source);
  assert.equal(result.json, JSON.stringify(source, null, 2));
  assert.equal(result.nodes.length, source.spans.length);
  assert.equal(new Set(result.nodes.map((n) => n.id)).size, source.spans.length);
  result.nodes.forEach((n, i) => {
    if (n.parentIndex !== null) {
      assert.ok(n.parentIndex < i);
      assert.equal(n.depth, result.nodes[n.parentIndex].depth + 1);
    } else assert.equal(n.depth, 0);
  });
  source.spans.forEach((s) => {
    const r = result.spanRanges.get(s.span_id);
    assert.ok(r);
    assert.deepEqual(JSON.parse(result.json.slice(r.from, r.to)), s);
  });
}
test('父子顺序、多根、原始 spans 不重排', () => {
  const input = trace([
    span('child', 'parent', 0),
    span('parent', null, 9),
    span('sibling', 'parent', 3),
    span('other', null, 2),
  ]);
  const result = build(input);
  verify(input, result);
  assert.deepEqual(
    result.nodes.map((n) => n.id),
    ['other', 'parent', 'child', 'sibling'],
  );
  assert.deepEqual(
    result.nodes.map((n) => n.parentIndex),
    [null, null, 1, 1],
  );
});
test('缺失父节点、自环和多节点循环', () => {
  const input = trace([
    span('orphan', 'missing'),
    span('self', 'self'),
    span('a', 'b'),
    span('b', 'c'),
    span('c', 'a'),
    span('leaf', 'a'),
  ]);
  const result = build(input);
  verify(input, result);
  assert.equal(result.nodes.find((n) => n.id === 'orphan').orphan, true);
  assert.equal(result.nodes.find((n) => n.id === 'self').orphan, false);
  assert.equal(result.nodes.filter((n) => n.parentIndex === null).length, 3);
});
test('同级同 sequence 保留原顺序', () => {
  const input = trace([span('p', null, 8), span('b', 'p', 1), span('a', 'p', 1)]);
  const result = build(input);
  verify(input, result);
  assert.deepEqual(
    result.nodes.map((n) => n.id),
    ['p', 'b', 'a'],
  );
});
test('定位忽略嵌套同名字段、转义、换行及 Unicode', () => {
  const input = {
    prefix: { spans: [{ span_id: 'b' }] },
    ...trace([
      span('a', null, 1, {
        attributes: { span_id: 'b', spans: [{ span_id: 'a' }], text: '中文😀\n"span_id":"b"\\' },
      }),
      span('b', null, 0),
    ]),
    unknown_field: { preserved: true },
  };
  verify(input, build(input));
});
test('时间归一化和错误状态', () => {
  const input = trace([
    span('p', null, 0, {
      started_at: '2026-09-29T00:00:00Z',
      ended_at: '2026-09-29T00:00:10Z',
      status: 'ok',
    }),
    span('c', 'p', 1, {
      started_at: '2026-09-29T00:00:02Z',
      ended_at: '2026-09-29T00:00:05Z',
      status: 'error',
    }),
  ]);
  const result = build(input);
  verify(input, result);
  assert.deepEqual(
    result.nodes.map((n) => [n.durationMs, n.offsetPercent, n.durationPercent, n.status]),
    [
      [10000, 0, 100, 'ok'],
      [3000, 20, 30, 'error'],
    ],
  );
});
test('缺失、非法及倒置时间不伪造耗时', () => {
  const input = trace([
    span('none'),
    span('missing', null, 1, { started_at: '2026-09-29T00:00:00Z' }),
    span('bad', null, 2, { started_at: 'bad', ended_at: 'bad' }),
    span('reverse', null, 3, {
      started_at: '2026-09-29T00:00:03Z',
      ended_at: '2026-09-29T00:00:02Z',
    }),
  ]);
  const result = build(input);
  verify(input, result);
  for (const n of result.nodes) {
    assert.equal(n.durationMs, null);
    assert.equal(n.offsetPercent, null);
    assert.equal(n.durationPercent, null);
  }
});
test('零耗时与跨时区', () => {
  const result = build(
    trace([
      span('zero', null, 0, {
        started_at: '2026-09-29T08:00:00+08:00',
        ended_at: '2026-09-29T00:00:00Z',
      }),
    ]),
  );
  assert.deepEqual(
    [result.nodes[0].durationMs, result.nodes[0].offsetPercent, result.nodes[0].durationPercent],
    [0, 0, 0],
  );
});
test('空 Trace 和未知字段保留', () => {
  const input = { ...trace([]), unknown: { text: '保留' } };
  const result = build(input);
  verify(input, result);
  assert.equal(result.spanRanges.size, 0);
});
test('冻结输入不被修改', () => {
  const input = trace([span('b', 'a'), span('a')]);
  function freeze(v: unknown) {
    if (v && typeof v === 'object') {
      Object.values(v).forEach(freeze);
      Object.freeze(v);
    }
  }
  freeze(input);
  const snapshot = JSON.stringify(input);
  verify(input, build(input));
  assert.equal(JSON.stringify(input), snapshot);
});
test('6000 层无递归栈溢出且均可定位', () => {
  const input = trace(
    Array.from({ length: 6000 }, (_, i) => span(String(i), i ? String(i - 1) : null, i)),
  );
  const result = build(input);
  verify(input, result);
  assert.equal(result.nodes.at(-1).depth, 5999);
});
test('混合关系所有节点保留且父节点先于子节点', () => {
  let seed = 17;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed;
  };
  for (let run = 0; run < 60; run++) {
    const spans = Array.from({ length: 50 }, (_, i) =>
      span(String(i), String(random() % 55), random() % 6),
    );
    const input = trace(spans);
    const result = build(input);
    verify(input, result);
    assert.deepEqual(build(input).nodes, result.nodes);
  }
});

test('Trace 与 Turn 使用已保存的结果，内部工具错误仅属于所选节点', () => {
  const source = trace([
    span('turn-span', null, 0, {
      operation_type: 'turn',
      attributes: { 'agentgate.turn.id': 'turn-a', 'trace_sdk.input': '劣后来源' },
    }),
    span('tool-span', 'turn-span', 1, {
      attributes: {
        'trace_sdk.input': null,
        arguments: { ignored: true },
        'trace_sdk.output': false,
        'trace_sdk.error': { message: '工具已自行重试' },
      },
    }),
  ]);
  source.turn_outcomes['turn-a'] = { input: { question: '' }, output: { answer: 0 }, state: {} };
  source.turn_outcomes['turn-b'] = { input: {}, output: {}, state: {} };
  source.final_output = { answer: '最终回复' };
  assert.deepEqual(JSON.parse(formatTraceEvidence(traceEvidence(source))), {
    input: { 'turn-a': { question: '' }, 'turn-b': {} },
    output: { answer: '最终回复' },
  });
  assert.deepEqual(JSON.parse(formatTraceEvidence(traceEvidence(source, 'turn-span'))), {
    input: { question: '' },
    output: { answer: 0 },
  });
  assert.deepEqual(JSON.parse(formatTraceEvidence(traceEvidence(source, 'tool-span'))), {
    input: null,
    output: false,
    error: { message: '工具已自行重试' },
  });
  assert.deepEqual(traceEvidence(source, 'missing'), {});
});

test('回放轨迹按轮次顺序补齐已记录的整条输入，缺失输入继续缺省', () => {
  const turn = (id: string, sequence: number, attributes: Record<string, unknown> = {}) =>
    span(`span-${id}`, null, sequence, {
      operation_type: 'turn',
      attributes: { 'agentgate.turn.id': id, ...attributes },
    });
  const source = trace([
    turn('missing', 3),
    turn('third', 2, { 'trace_sdk.input': '较低优先级' }),
    turn('second', 1, { 'agentgate.turn.input': '', 'trace_sdk.input': '较低优先级' }),
    turn('first', 0, { 'trace_sdk.input': '{"question":"回放数据"}' }),
  ]);
  Object.assign(source.turn_outcomes, {
    missing: { output: {} },
    third: { input: null, output: {} },
    second: { output: {} },
    first: { output: {} },
  });
  const input = JSON.parse(formatTraceEvidence(traceEvidence(source))).input;
  assert.deepEqual(Object.keys(input), ['first', 'second', 'third']);
  assert.deepEqual(input, { first: { question: '回放数据' }, second: '', third: null });
  assert.deepEqual(
    traceEvidence(
      trace([
        turn('missing', 3),
        turn('known', 0, {
          'trace_sdk.input': false,
        }),
      ]),
    ).input,
    { known: false },
  );
  assert.equal(traceEvidence(trace([turn('missing', 3)])).input, undefined);
});

test('只从目标环节读取工具参数、显式错误和异常事件', () => {
  const source = trace([
    span('turn', null, 0, {
      operation_type: 'turn',
      attributes: {
        'agentgate.turn.id': 'failed-turn',
        'agentgate.execution.error': { code: 'timeout' },
      },
    }),
    span('tool', 'turn', 1, {
      attributes: { arguments: {} },
      events: [
        { name: 'progress', attributes: { message: '普通事件' } },
        { name: 'exception', attributes: { 'exception.message': '工具超时' } },
      ],
    }),
    span('unrelated', 'turn', 2, { attributes: { input: '无语义契约' } }),
  ]);
  assert.deepEqual(traceEvidence(source).error, { code: 'timeout' });
  assert.deepEqual(JSON.parse(formatTraceEvidence(traceEvidence(source, 'tool'))), {
    input: {},
    error: { 'exception.message': '工具超时' },
  });
  assert.equal(formatTraceEvidence(traceEvidence(source, 'unrelated')), '{}');
});

test('Formatted JSON 解包对象或数组，保留标量文本、原始对象及嵌套上限', () => {
  let nested: unknown = '{"inner":true}';
  for (let depth = 0; depth < 8; depth++) nested = [nested];
  const evidence = {
    input: '{"payload":"[0,false,null]", "plain":"123", "invalid":"{unfinished"}',
    output: nested,
    error: '',
  };
  const original = JSON.stringify(evidence);
  assert.deepEqual(JSON.parse(formatTraceEvidence(evidence)), {
    input: { payload: [0, false, null], plain: '123', invalid: '{unfinished' },
    output: nested,
    error: '',
  });
  assert.equal(JSON.stringify(evidence), original);
});

test('摘要采用唯一明确 Case，已加载资源统计优先并保留零值', () => {
  const source = trace([
    span('case', null, 0, {
      operation_type: 'case',
      started_at: '2026-11-24T08:00:00+08:00',
      ended_at: '2026-11-24T08:00:02+08:00',
      status: 'ok',
    }),
    span('tool', 'case', 1, { status: 'error' }),
  ]);
  assert.deepEqual(
    summarizeTrace(source, {
      agentName: '智能体 A',
      resourceUsage: { duration_ms: 0, total_tokens: 0, token_status: 'available' },
    }),
    {
      traceId: 'test',
      agentName: '智能体 A',
      status: 'ok',
      durationMs: 0,
      totalTokens: 0,
      tokenStatus: 'available',
      reactStepCount: null,
    },
  );
  assert.equal(summarizeTrace(source).durationMs, 2000);
});

test('无 Case 时只使用齐全且按 ID 确认的 Turn 计算状态和耗时', () => {
  const source = trace([
    span('synthesized', null, 0, {
      operation_type: 'case',
      attributes: { 'platform.simulated': true },
      status: 'ok',
    }),
    span('b', null, 1, {
      operation_type: 'turn',
      attributes: { 'agentgate.turn.id': 'b' },
      started_at: '2026-11-24T00:00:03Z',
      ended_at: '2026-11-24T00:00:04Z',
      status: 'error',
    }),
    span('a', null, 2, {
      operation_type: 'turn',
      attributes: { 'agentgate.turn.id': 'a' },
      started_at: '2026-11-24T00:00:00Z',
      ended_at: '2026-11-24T00:00:01Z',
      status: 'ok',
    }),
  ]);
  const complete = summarizeTrace(source, { expectedTurnIds: ['a', 'b'] });
  assert.equal(complete.status, 'error');
  assert.equal(complete.durationMs, 4000);
  const incomplete = summarizeTrace(source, { expectedTurnIds: ['a', 'missing'] });
  assert.equal(incomplete.status, 'unset');
  assert.equal(incomplete.durationMs, null);
});

test('无缓存时 Token 使用去重的观测小计，冲突项、真实请求和非法计数不计入', () => {
  const observation = {
    event_type: 'observation',
    event_id: 'observation-id',
    trace_id: 'source',
    prompt_tokens: 4,
    completion_tokens: 0,
  };
  const conflicting = { ...observation, event_id: 'conflict' };
  const source = trace([
    span('one', null, 0, {
      events: [
        observation,
        conflicting,
        { ...observation, event_type: 'llm_request', prompt_tokens: 500 },
        { ...observation, event_id: undefined, prompt_tokens: 600 },
      ],
    }),
    span('two', null, 1, {
      events: [
        observation,
        { ...conflicting, prompt_tokens: 90 },
        { ...observation, event_id: 'partial', prompt_tokens: -1, completion_tokens: 2 },
        { ...observation, event_id: undefined, prompt_tokens: 600 },
      ],
    }),
  ]);
  assert.equal(summarizeTrace(source).totalTokens, 6);
  assert.equal(summarizeTrace(source).tokenStatus, 'partial');
  assert.equal(summarizeTrace(trace([])).tokenStatus, 'unavailable');
  const cached = summarizeTrace(source, {
    resourceUsage: { duration_ms: null, total_tokens: null, token_status: 'unavailable' },
  });
  assert.equal(cached.totalTokens, null);
  assert.equal(cached.tokenStatus, 'unavailable');
});
