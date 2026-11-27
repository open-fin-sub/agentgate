import { expect, test } from '@playwright/test';
import { toApiCase, toEditorCase } from '../src/api/datasets';
import type { DatasetVersion, Expectation, SerializedExpectation } from '../src/views/datasets/types';
import { sampleExportBlob } from '../src/views/datasets/utils/sample-export';
import { blankSample, parseSampleFile } from '../src/views/datasets/utils/sample-import';
import {
  expectationFieldsFromText,
  expectationFieldsText,
} from '../src/views/datasets/utils/sample-expectations';

type StateRule = Extract<Expectation, { kind: 'state' }>;
type ToolRule = Extract<Expectation, { kind: 'tool_argument' }>;
const state: StateRule = {
  id: 'state-one', name: '保留检查名称', kind: 'state', path: 'status',
  condition: { kind: 'equals', expected: 'done' },
};
const tool: ToolRule = {
  id: 'tool-one', name: '保留工具检查', kind: 'tool_argument', tool: 'lookup',
  path: 'arguments.limit', occurrence: 'any', condition: { kind: 'equals', expected: 10 },
};

test('state maps preserve metadata and support nested expected JSON values', () => {
  expect(JSON.parse(expectationFieldsText([state]))).toEqual({ status: 'done' });
  const result = expectationFieldsFromText(
    '{"status":"pending","user.profile":{"tier":"gold"}}', [state], () => 'new-rule',
  );
  expect(result[0]).toEqual({ ...state, condition: { kind: 'equals', expected: 'pending' } });
  expect(result[1]).toEqual({
    id: 'new-rule', name: null, path: 'user.profile',
    condition: { kind: 'equals', expected: { tier: 'gold' } },
  });
});

test('tool maps resolve fields under arguments and retain occurrence and identity', () => {
  expect(JSON.parse(expectationFieldsText([tool], 'arguments.'))).toEqual({ limit: 10 });
  const result = expectationFieldsFromText(
    '{"limit":20,"filter":{"status":"active"}}', [tool], () => 'new-rule', 'arguments.',
  );
  expect(result[0]).toEqual({ ...tool, condition: { kind: 'equals', expected: 20 } });
  expect(result[1].path).toBe('arguments.filter');
  expect(result[1].condition).toEqual({ kind: 'equals', expected: { status: 'active' } });
});

test('non-equality, duplicate paths, and nonstandard tool paths roundtrip without conversion', () => {
  const rules: StateRule[] = [
    state,
    { ...state, id: 'state-two', name: '范围检查', condition: { kind: 'within_range', minimum: 1, maximum: 10 } },
    { ...state, id: 'state-three', name: '另一个等值检查' },
  ];
  const text = expectationFieldsText(rules);
  expect(Array.isArray(JSON.parse(text))).toBe(true);
  expect(expectationFieldsFromText(text, rules, () => 'unused')).toEqual(rules);
  const legacyPath = { ...tool, path: 'status' };
  const toolText = expectationFieldsText([legacyPath], 'arguments.');
  expect(expectationFieldsFromText(toolText, [legacyPath], () => 'unused', 'arguments.')).toEqual([legacyPath]);
});

test('blank clears rules while invalid JSON, paths, and conditions reject saving', () => {
  expect(expectationFieldsFromText('  ', [state], () => 'unused')).toEqual([]);
  expect(expectationFieldsFromText('{}', [state], () => 'unused')).toEqual([]);
  for (const text of ['{', 'null', 'true', '"done"', '{"a..b":1}', '[{"path":"status"}]'])
    expect(() => expectationFieldsFromText(text, [state], () => 'unused')).toThrow();
  expect(() => expectationFieldsFromText('{"":10}', [tool], () => 'unused', 'arguments.')).toThrow();
  expect(() => expectationFieldsFromText('[{"path":"score","condition":{"kind":"within_range","minimum":10,"maximum":1}}]', [], () => 'new')).toThrow();
});

for (const format of ['xlsx', 'csv', 'json'] as const) {
  test(format + ' distinguishes an empty-string Skill check from a turn with no Skill check', async () => {
    const stored = toApiCase(blankSample('Skill 空值回归'));
    const rules: SerializedExpectation[] = [
      { id: 'before', name: null, kind: 'tool_call', mode: 'required', tool: 'lookup' },
      { id: 'skill', name: '保留空字符串', kind: 'skill_route', condition: { kind: 'equals', expected: '' } },
      { id: 'another-skill', name: null, kind: 'skill_route', condition: { kind: 'matches_pattern', pattern: '^route' } },
    ];
    stored.turns[0].input = { txt: '首轮' };
    stored.turns.push({ ...stored.turns[0], id: 'second', input: { txt: '次轮' }, expectations: [] });
    stored.turns[0].expectations = rules;
    const sample = toEditorCase(stored);
    expect(sample.turns.map(turn => turn.expected_skill)).toEqual(['', null]);
    expect(toApiCase(sample)).toEqual(stored);
    const blob = await sampleExportBlob({ dataset_name: 'Skill 验收', version: 1, cases: [sample] } as DatasetVersion, undefined, format);
    const [imported] = await parseSampleFile({ name: 'Skill.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer() });
    const turns = toApiCase(imported).turns;
    expect(turns[0].expectations.map(({ id, ...rule }) => rule)).toEqual(rules.map(({ id, ...rule }) => rule));
    expect(turns[1].expectations).toEqual([]);
  });
}
