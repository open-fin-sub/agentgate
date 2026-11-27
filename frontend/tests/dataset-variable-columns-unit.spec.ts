import { test, expect } from '@playwright/test';
import { webcrypto } from 'node:crypto';
import { sampleExportBlob, sampleRows } from '../src/views/datasets/utils/sample-export';
import {
  blankSample,
  parseSampleFile,
  rowsToSamples,
} from '../src/views/datasets/utils/sample-import';
import {
  variableCells,
  readVariableColumns,
} from '../src/views/datasets/utils/sample-variable-columns';
import type { DatasetVersion, JsonObject } from '../src/views/datasets/types/index';

if (!globalThis.crypto)
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

function read(cells: Record<string, unknown>) {
  const errors: [string, string][] = [];
  const state = readVariableColumns(cells, (header, message) => errors.push([header, message]));
  return { state, errors };
}

test('variable name, type and required form one editable column and the cell holds its value', () => {
  const state = {
    config_variables: [{ name: 'city', type: 'str', required: false, value: '北京' }],
    prompt_variables: [{ name: 'city', type: 'str', required: true, value: '上海' }],
    tool_variables: [{ name: 'city', type: 'str', required: true, value: '杭州' }],
  };
  const cells = variableCells(state);
  expect(cells).toEqual({
    初始变量_city_字符串_非必填: '北京',
    初始变量_city_字符串_必填_基础编排: '上海',
    初始变量_city_字符串_必填_工具变量: '杭州',
  });
  expect(read(cells)).toEqual({ state, errors: [] });
});

test('initial variables preserve old field names, extensions, separator characters and raw state keys', () => {
  const state: JsonObject = {
    '': 0,
    '  ': false,
    '  user｜账号\n': ['中文', 1],
    config_variables: [
      {
        name: 'user_id_扩展=｜%5F',
        data_type: 'custom_type',
        value: 0,
        description: '旧｜说明_%\n',
      },
      { name: '校验', type: '字符串', required: null, value: { 'a,b': [null, false] } },
    ],
    prompt_variables: [],
  };
  const cells = variableCells(state);
  expect(Object.keys(cells).every((key) => !key.includes('｜'))).toBeTruthy();
  expect(read(cells)).toEqual({ state, errors: [] });
});

test('a blank cell omits the variable and explicit nulls and JSON-looking strings keep their types', () => {
  const values = ['', null, false, 0, 'true', '42', 'null', '""', '  ', {}, [], 'a,b'];
  const state = { config_variables: values.map((value, index) => ({ name: 'v' + index, value })) };
  const cells = variableCells(state);
  // CSV and the Excel importer both pass strings into the variable parser.
  const textCells = Object.fromEntries(
    Object.entries(cells).map(([header, value]) => [header, String(value)]),
  );
  expect(read({ ...textCells, 初始变量_缺省_字符串_非必填: '' })).toEqual({ state, errors: [] });
});

test('same-name configurations from different sample rows can share a table but conflict within a sample', () => {
  const required = '初始变量_city_字符串_必填';
  const optional = '初始变量_city_字符串_非必填';
  expect(read({ [required]: '北京', [optional]: '' }).errors).toEqual([]);
  expect(read({ [required]: '', [optional]: '上海' }).errors).toEqual([]);
  const { errors } = read({ [required]: '北京', [optional]: '上海' });
  expect(errors).toHaveLength(1);
  expect(errors[0][0]).toBe(optional);
  expect(errors[0][1]).toContain('city');
  expect(read({ 初始变量_错误: 1 }).errors[0][0]).toBe('初始变量_错误');
});

test('tool variables accept raw legacy values and distinguish empty from absent', () => {
  for (const value of [[], { catalog: 'default' }, [{ tool: 'lookup' }]]) {
    const state: JsonObject = { tool_variables: value };
    const cells = variableCells(state);
    expect(Object.keys(cells)).toEqual(['初始变量_tool_variables_未指定_未指定_顶层']);
    expect(read(cells)).toEqual({ state, errors: [] });
  }
  const cells = variableCells({ tool_variables: [{ name: 'catalog', value: 'test' }] });
  expect(cells).toEqual({ 初始变量_catalog_未指定_未指定_工具变量: 'test' });
  expect(read({ ...cells, 初始变量_tool_variables_未指定_未指定_顶层: '' }).errors).toEqual([]);
  expect(read({ ...cells, 初始变量_tool_variables_未指定_未指定_顶层: '[]' }).errors).toHaveLength(
    1,
  );
});

for (const format of ['xlsx', 'csv'] as const) {
  test(
    format + ' retains each selected sample’s variable declaration order across turns and groups',
    async () => {
      const samples = [blankSample('甲'), blankSample('乙')];
      for (const [i, sample] of samples.entries()) {
        const vars = ['city', 'currency'].map((name) => ({ name, value: name + i }));
        sample.initial_state = {
          config_variables: i ? vars.slice().reverse() : vars,
          tool_variables: i ? vars : vars.slice().reverse(),
          prompt_variables: [{ tool: 'legacy' }],
        };
        sample.turns[0].input = { txt: '开始' };
        sample.turns.push({ ...sample.turns[0], id: crypto.randomUUID(), input: { txt: '继续' } });
      }
      const version = { dataset_name: '次序', cases: samples } as DatasetVersion;
      const rows = sampleRows(version);
      expect(rows.map((r) => r['初始变量顺序'])).toEqual([
        JSON.stringify({
          config_variables: ['city', 'currency'],
          tool_variables: ['currency', 'city'],
        }),
        '',
        JSON.stringify({
          config_variables: ['currency', 'city'],
          tool_variables: ['city', 'currency'],
        }),
        '',
      ]);
      const [subset] = sampleRows(version, [samples[1].id]);
      expect(subset).not.toHaveProperty('初始变量顺序');
      const blob = await sampleExportBlob(version, undefined, format);
      const imported = await parseSampleFile({
        name: '变量.' + format,
        size: blob.size,
        arrayBuffer: () => blob.arrayBuffer(),
      });
      expect(imported.map((s) => s.initial_state)).toEqual(samples.map((s) => s.initial_state));
    },
  );
}

test('offline edits skip deleted declarations and append new variables in column order across turns', () => {
  const base = {
    case_name: '编辑',
    query: '输入',
    初始变量顺序: '',
    初始变量_newA_未指定_未指定: '',
    初始变量_newB_未指定_未指定: '',
    初始变量_currency_未指定_未指定: '',
    初始变量_city_未指定_未指定: '',
  };
  const order = { config_variables: ['city', 'deleted', 'currency'] };
  const [sample] = rowsToSamples([
    {
      ...base,
      turn_order: '1',
      初始变量顺序: JSON.stringify(order),
      初始变量_newB_未指定_未指定: 'B',
      初始变量_currency_未指定_未指定: 'CNY',
      初始变量_city_未指定_未指定: '上海',
    },
    { ...base, turn_order: '2', 初始变量_newA_未指定_未指定: 'A' },
  ]);
  expect(sample.initial_state.config_variables).toEqual([
    { name: 'city', value: '上海' },
    { name: 'currency', value: 'CNY' },
    { name: 'newA', value: 'A' },
    { name: 'newB', value: 'B' },
  ]);
  const cells = { 初始变量_b_未指定_未指定: 1, 初始变量_a_未指定_未指定: 2 };
  expect(read(cells).state.config_variables).toEqual([
    { name: 'b', value: 1 },
    { name: 'a', value: 2 },
  ]);
});

test('malformed or conflicting variable order has an error at its own column', () => {
  const base = {
    case_name: '顺序错误',
    query: '问',
    初始变量顺序: '',
    初始变量_A_未指定_未指定: '1',
  };
  for (const order of [
    'invalid',
    '[]',
    '{"other":[]}',
    '{"config_variables":[3]}',
    '{"config_variables":["A","A"]}',
  ]) {
    expect(() => rowsToSamples([{ ...base, 初始变量顺序: order }])).toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ field: '初始变量顺序', column: 'C', row: 2 })],
      }),
    );
  }
  expect(() =>
    rowsToSamples([
      { ...base, turn_order: 1, 初始变量顺序: '{"config_variables":["A","B"]}' },
      { ...base, turn_order: 2, 初始变量顺序: '{"config_variables":["B","A"]}' },
    ]),
  ).toThrow(
    expect.objectContaining({
      issues: [expect.objectContaining({ field: '初始变量顺序', column: 'C', row: 3 })],
    }),
  );
});
