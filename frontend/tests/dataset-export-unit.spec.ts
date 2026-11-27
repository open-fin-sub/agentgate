import { test, expect } from '@playwright/test';
import { webcrypto } from 'node:crypto';
import ExcelJS from 'exceljs';
import {
  blankSample,
  parseCsv,
  parseSampleFile,
  sampleFileFormats,
} from '../src/views/datasets/utils/sample-import';
import { exportSamples, sampleExportBlob } from '../src/views/datasets/utils/sample-export';
import type { Condition, DatasetVersion, Expectation } from '../src/views/datasets/types/index';
import { http, httpRequest, ApiError } from '../src/utils/request';
if (!globalThis.crypto)
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const a = blankSample('样本甲'),
  b = blankSample('样本乙');
a.category = 'positive';
a.difficulty = 'medium';
a.turns[0].input = { query: '输入甲' };
a.turns[0].required_tools = ['lookup'];
b.turns[0].input = { query: '输入乙' };
const version = {
  dataset_name: '导出测试',
  version: 3,
  status: 'published',
  cases: [a, b],
  content_sha256: 'original',
} as DatasetVersion;
const ruleHeaders = [
  '最终状态_字段路径', '最终状态_判定方式', '最终状态_期望值',
  '工具参数_工具名', '工具参数_字段路径', '工具参数_调用范围', '工具参数_判定方式', '工具参数_等于_期望值',
  '最终输出_输出路径', '最终输出_判定方式', '最终输出_等于_期望值',
  '最终输出_数值范围_最小值', '最终输出_数值范围_最大值',
];
async function readTableRows(format: 'csv' | 'xlsx', blob: Blob): Promise<Record<string, string>[]> {
  if (format === 'csv') return parseCsv(await blob.text());
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await blob.arrayBuffer());
  const sheet = book.getWorksheet('Cases')!;
  const headers = (sheet.getRow(1).values as string[]).slice(1);
  return Array.from({ length: sheet.rowCount - 1 }, (_, i) =>
    Object.fromEntries(headers.map((header, j) => [header, sheet.getRow(i + 2).getCell(j + 1).text])));
}
for (const { value: format } of sampleFileFormats)
  test('workflow initialization and typed multi-turn inputs survive ' + format, async () => {
    const sample = blankSample('Workflow business inputs');
    sample.category = 'boundary';
    sample.difficulty = 'hard';
    sample.tags = ['中文', '多轮'];
    sample.notes = '样本备注';
    sample.turns[0].notes = '第一轮备注';
    sample.turns[0].extensions = [{ key: '原始请求 ID', value: 'request-123' }];
    sample.initial_state = {
      config_variables: [
        { name: 'centreId', value: '810000' },
        { name: 'options', value: { enabled: false, count: 0 } },
      ],
    };
    sample.turns[0].input = {
      user_input_text: '请翻译',
      menuId: 'TRANSLATE',
      form: { values: [0, false, null, { amount: 12.5 }] },
    };
    sample.turns.push({
      ...structuredClone(sample.turns[0]),
      id: crypto.randomUUID(),
      input: { user_input_text: '第二轮', collected_data: {} },
      notes: '第二轮备注',
    });
    const before = JSON.stringify(sample);
    const blob = await sampleExportBlob({ ...version, cases: [sample] }, undefined, format);
    const parsed = await parseSampleFile({
      name: 'workflow.' + format,
      size: blob.size,
      arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(parsed[0].initial_state).toEqual(sample.initial_state);
    expect(parsed[0]).toMatchObject({
      name: sample.name, category: 'boundary', difficulty: 'hard', tags: [], notes: '',
    });
    expect(parsed[0].turns.map((turn) => turn.input)).toEqual(
      sample.turns.map((turn) => turn.input),
    );
    expect(parsed[0].turns.map((turn) => turn.notes)).toEqual(['', '']);
    expect(parsed[0].turns.every((turn) => turn.extensions === undefined)).toBe(true);
    expect(JSON.stringify(sample)).toBe(before);
  });

for (const format of ['xlsx', 'csv'] as const)
  test(format + ' exports only editing fields and presents enum values in Chinese', async () => {
    const expected = [
      '样本编号', '样本名称', '样本分类', '难度', '轮次顺序', '输入内容',
      '必须工具',
    ];
    const blob = await sampleExportBlob(version, [a.id], format);
    if (format === 'csv') {
      const [headerRow, sampleRow] = (await blob.text()).replace(/^\uFEFF/, '').split(/\r?\n/, 2);
      const headers = headerRow.split(',').map((header) => header.replace(/^"|"$/g, ''));
      expect(headers).toEqual(expected);
      expect(sampleRow).toContain('"正例","中等"');
      expect(parseCsv(await blob.text())[0]['轮次顺序']).toBe('1');
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await blob.arrayBuffer());
      const sheet = workbook.getWorksheet('Cases')!;
      expect((sheet.getRow(1).values as string[]).slice(1)).toEqual(expected);
      expect(sheet.getCell('C2').value).toBe('正例');
      expect(sheet.getCell('D2').value).toBe('中等');
      expect(sheet.getCell('E2').value).toBe(1);
    }
  });

for (const format of ['xlsx', 'csv'] as const) {
  test(format + ' exports basic input alone and adds only the columns needed by selected checks', async () => {
    const bare = blankSample('最少信息');
    bare.turns[0].input = { txt: '你好' };
    const configured = blankSample('检查返回值');
    configured.difficulty = 'easy';
    configured.turns[0].input = { txt: '查订单' };
    configured.turns[0].expectations = [
      { id: 'price', kind: 'tool_argument', name: null, tool: 'lookup', path: 'price', occurrence: 'last',
        condition: { kind: 'within_tolerance', expected: 0, epsilon: 0.25 } },
      { id: 'secret', kind: 'output', name: null, path: 'private', condition: { kind: 'must_be_missing' } },
    ];
    const source = { ...version, cases: [bare, configured] };
    const basic = ['样本编号', '样本名称', '轮次顺序', '输入内容'];
    const [basicRow] = await readTableRows(format, await sampleExportBlob(source, [bare.id], format));
    expect(Object.keys(basicRow)).toEqual(basic);
    const blob = await sampleExportBlob(source, undefined, format);
    const [empty, edited] = await readTableRows(format, blob);
    expect(Object.keys(edited)).toEqual([
      '样本编号', '样本名称', '难度', '轮次顺序', '输入内容',
      '工具参数_工具名', '工具参数_字段路径', '工具参数_调用范围', '工具参数_判定方式',
      '工具参数_数值容差_期望值', '工具参数_数值容差_容差', '最终输出_输出路径', '最终输出_判定方式',
    ]);
    expect(edited).toMatchObject({
      '工具参数_数值容差_期望值': '0', '工具参数_数值容差_容差': '0.25', '最终输出_判定方式': '字段不存在',
    });
    if (format === 'xlsx') {
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(await blob.arrayBuffer());
      const sheet = book.getWorksheet('Cases')!;
      for (const [header, value] of [['工具参数_数值容差_期望值', 0], ['工具参数_数值容差_容差', 0.25]] as const) {
        expect(sheet.getRow(3).getCell(Object.keys(edited).indexOf(header) + 1).value).toBe(value);
      }
    }
    expect(empty).toMatchObject({ '难度': '', '工具参数_数值容差_期望值': '', '最终输出_判定方式': '' });
    const [first, second] = await parseSampleFile({
      name: 'mixed.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(first).toMatchObject({ category: null, difficulty: null });
    expect(second).toMatchObject({ category: null, difficulty: 'easy' });
    expect(second.turns[0].expectations.map(({ id, ...check }) => check)).toEqual(
      configured.turns[0].expectations.map(({ id, ...check }) => check),
    );
    second.turns[0].expectations[0].condition = { kind: 'matches_pattern', pattern: '^CNY$' };
    const [changed] = await readTableRows(format, await sampleExportBlob({ ...version, cases: [second] }, undefined, format));
    expect(Object.keys(changed).filter((key) => key.startsWith('工具参数_'))).toEqual([
      '工具参数_工具名', '工具参数_字段路径', '工具参数_调用范围', '工具参数_判定方式', '工具参数_正则匹配_正则表达式',
    ]);
    expect(changed['工具参数_正则匹配_正则表达式']).toBe('^CNY$');
  });

  test(format + ' splits variables across the selected samples and keeps expectations on their own turn', async () => {
    const first = blankSample('工作流样本');
    first.initial_state = { config_variables: [{ name: 'city', type: 'str', required: false, value: '上海' }] };
    const turn = first.turns[0];
    turn.input = { txt: '查天气' };
    turn.expected_skill = 'weather';
    turn.required_tools = ['forecast', 'geo'];
    turn.forbidden_tools = ['update'];
    turn.expectations = [
      { id: 'st', kind: 'state', name: null, path: 'status', condition: { kind: 'equals', expected: 'done' } },
      { id: 'ta', kind: 'tool_argument', name: null, tool: 'forecast', occurrence: 'first', path: 'city', condition: { kind: 'equals', expected: '上海' } },
      { id: 'out', kind: 'output', name: null, path: null, condition: { kind: 'equals', expected: false } },
    ];
    const secondTurn = blankSample().turns[0];
    secondTurn.input = { txt: '明天天气' };
    first.turns.push(secondTurn);
    const second = blankSample('基础编排样本');
    second.initial_state = { prompt_variables: [{ name: 'account_id', value: '001', type: 'str', required: true }] };
    second.turns[0].input = { txt: '查账户' };
    second.turns[0].expectations = [{
      id: 'balance', kind: 'output', name: null, path: 'account.balance',
      condition: { kind: 'within_range', minimum: 0, maximum: 100 },
    }];
    const source = { ...version, cases: [first, second] };
    const city = '初始变量_city_字符串_非必填';
    const account = '初始变量_account_id_字符串_必填_基础编排';
    const blob = await sampleExportBlob(source, undefined, format);
    const rows = await readTableRows(format, blob);
    expect(Object.keys(rows[0])).toEqual(['样本编号', '样本名称', city, account,
      '轮次顺序', '输入内容', '期望skill', '必须工具', '禁止工具', ...ruleHeaders]);
    expect(rows[0]).toMatchObject({ [city]: '上海', [account]: '', '轮次顺序': '1', '期望skill': 'weather', '必须工具': 'forecast, geo', '禁止工具': 'update' });
    expect(ruleHeaders.map((header) => rows[0][header])).toEqual([
      'status', '等于', 'done', 'forecast', 'city', '第一次调用', '等于', '上海', '', '等于', 'false', '', '',
    ]);
    expect(ruleHeaders.map((header) => rows[1][header])).toEqual(ruleHeaders.map(() => ''));
    expect(rows[1]).toMatchObject({ [city]: '', '轮次顺序': '2' });
    expect(rows[2]).toMatchObject({
      [account]: '001', [city]: '', '最终输出_输出路径': 'account.balance', '最终输出_判定方式': '数值范围',
    });
    expect(rows[2]).toMatchObject({ '最终输出_数值范围_最小值': '0', '最终输出_数值范围_最大值': '100' });
    const selected = await readTableRows(format, await sampleExportBlob(source, [second.id], format));
    expect(Object.keys(selected[0])).toEqual([
      '样本编号', '样本名称', account, '轮次顺序', '输入内容',
      '最终输出_输出路径', '最终输出_判定方式', '最终输出_数值范围_最小值', '最终输出_数值范围_最大值',
    ]);
    const imported = await parseSampleFile({ name: 'split.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer() });
    expect(imported.map((sample) => sample.initial_state)).toEqual([first.initial_state, second.initial_state]);
    expect(imported[0].turns[0]).toMatchObject({ expected_skill: 'weather', required_tools: ['forecast','geo'],
      forbidden_tools: ['update'], expectations: turn.expectations.map(({ id, ...rest }) => rest) });
    expect(imported[0].turns[1].expectations).toEqual([]);
    expect(imported[1].turns[0].expectations).toMatchObject([{
      kind: 'output', path: 'account.balance', condition: { kind: 'within_range', minimum: 0, maximum: 100 },
    }]);
  });

  test(format + ' round-trips interleaved named state, tool and output checks with all condition types', async () => {
    const sample = blankSample('混合多项检查');
    const turn = sample.turns[0];
    turn.input = { txt: '核对订单' };
    const conditions: Condition[] = [
      { kind: 'equals', expected: '0012' },
      { kind: 'equals', expected: [] },
      { kind: 'equals', expected: null },
      { kind: 'equals', expected: false },
      { kind: 'equals', expected: '' },
      { kind: 'within_range', minimum: 0, maximum: null },
      { kind: 'within_tolerance', expected: 10, epsilon: 0.01 },
      { kind: 'matches_pattern', pattern: '订单[,，]\\d+' },
      { kind: 'one_of', allowed: [0, false, null, '待确认'] },
      { kind: 'must_be_missing' },
      { kind: 'matches_json_schema', json_schema: { type: 'object', required: ['order'] } },
    ];
    const scopes = ['last', 'first', 'any', 'all'] as const;
    turn.expectations = conditions.flatMap((condition, i): Expectation[] => [
      { id: 'tool-' + i, kind: 'tool_argument', name: '参数检查 ' + i, tool: 'lookup_order',
        occurrence: scopes[i % scopes.length], path: 'request.field' + i, condition },
      { id: 'state-' + i, kind: 'state', name: '状态检查 ' + i, path: 'order.field' + i, condition },
      { id: 'output-' + i, kind: 'output', name: '结果检查 ' + i, path: i % 2 ? null : 'answer.field' + i, condition },
    ]);
    const blob = await sampleExportBlob({ ...version, cases: [sample] }, undefined, format);
    const [row] = await readTableRows(format, blob);
    expect(JSON.parse(row['最终输出_输出路径'])).toEqual(conditions.map((_, i) => i % 2 ? null : 'answer.field' + i));
    expect(JSON.parse(row['最终输出_判定方式'])).toEqual([
      '等于', '等于', '等于', '等于', '等于', '数值范围', '数值容差', '正则匹配', '属于集合', '字段不存在', 'JSON Schema',
    ]);
    for (const group of ['工具参数', '最终输出']) {
      expect(Object.keys(row).filter((key) => key.startsWith(group + '_')).slice(group === '工具参数' ? 4 : 2)).toEqual(
        ['等于_期望值', '数值容差_期望值', '数值容差_容差', '数值范围_最小值', '数值范围_最大值',
          '正则匹配_正则表达式', '属于集合_允许值', 'JSON Schema_JSON Schema'].map((field) => group + '_' + field),
      );
      expect(JSON.parse(row[group + '_等于_期望值']))
        .toEqual(['0012', [], null, false, '', null, null, null, null, null, null]);
      expect(JSON.parse(row[group + '_数值容差_期望值'])).toEqual(conditions.map((_, i) => i === 6 ? 10 : null));
      expect(JSON.parse(row[group + '_数值容差_容差'])).toEqual(conditions.map((_, i) => i === 6 ? 0.01 : null));
      expect(JSON.parse(row[group + '_数值范围_最小值'])).toEqual(conditions.map((_, i) => i === 5 ? 0 : null));
      expect(JSON.parse(row[group + '_属于集合_允许值'])).toEqual(conditions.map((_, i) => i === 8 ? [0, false, null, '待确认'] : null));
    }
    const [imported] = await parseSampleFile({
      name: 'rules.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(imported.turns).toHaveLength(1);
    expect(imported.turns[0].expectations.map(({ id, ...check }) => check)).toEqual(
      turn.expectations.map(({ id, ...check }) => check),
    );
  });

  test(format + ' distinguishes a single structured expected value from a list of checks', async () => {
    const rules: Condition[] = [
      { kind: 'equals', expected: [1, 2] },
      { kind: 'equals', expected: '["一","二"]' },
      { kind: 'equals', expected: 0 },
      { kind: 'equals', expected: '0' },
      { kind: 'equals', expected: null },
      { kind: 'equals', expected: 'null' },
      { kind: 'equals', expected: '' },
      { kind: 'one_of', allowed: [false, 0] },
      { kind: 'must_be_missing' },
      { kind: 'matches_pattern', pattern: '[a-z]+' },
    ];
    const cases = rules.map((condition, i) => {
      const sample = blankSample('独立样本 ' + i);
      sample.turns[0].input = { txt: '查询' };
      sample.turns[0].expectations = [
        { id: 'check-' + i, kind: 'state', path: 'result', name: null, condition },
        { id: 'out-' + i, kind: 'output', path: null, name: null, condition },
      ];
      return sample;
    });
    const blob = await sampleExportBlob({ ...version, cases }, undefined, format);
    const imported = await parseSampleFile({
      name: 'single.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(imported.map((sample) => sample.turns[0].expectations.map((check) => check.condition)))
      .toEqual(rules.map((rule) => [rule, rule]));
  });

  test(format + ' exports both same-name samples and reimport reports a conflict', async () => {
    const single = blankSample('同名样本');
    single.turns[0].input = { txt: '独立样本' };
    const multi = blankSample(single.name);
    multi.turns[0].input = { txt: '第一轮' };
    const second = blankSample().turns[0];
    second.input = { txt: '第二轮' };
    multi.turns.push(second);
    const blob = await sampleExportBlob({ ...version, cases: [single, multi] }, undefined, format);
    await expect(parseSampleFile({
      name: 'export.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer(),
    })).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ field: '样本名称', row: 3 }),
        expect.objectContaining({ field: '轮次顺序', row: 3, turn: 1 }),
      ]),
    });
  });
}

test('selected exports preserve expectations and never impersonate published version hashes', () => {
  const before = JSON.stringify(version),
    data = exportSamples(version, [a.id]);
  expect(data.cases).toHaveLength(1);
  expect(data.cases[0]).toMatchObject({ id: a.id, category: '正例', difficulty: '中等' });
  expect(Object.keys(data.cases[0])).toEqual(['id', 'name', 'category', 'difficulty', 'initial_state', 'turns']);
  expect(Object.keys(data.cases[0].turns[0])).toEqual(['turn_order', 'input', 'expectations']);
  expect(data.cases[0].turns[0].turn_order).toBe(1);
  expect(data.cases[0].turns[0].expectations).toEqual([
    expect.objectContaining({ kind: 'tool_call', tool: 'lookup' }),
  ]);
  expect(data).not.toHaveProperty('content_sha256');
  expect(JSON.stringify(version)).toBe(before);
  expect(exportSamples(version).cases).toHaveLength(2);
  expect(() => exportSamples(version, [])).toThrow('至少');
  expect(() => exportSamples(version, ['unknown'])).toThrow('至少');
});
for (const { value: format } of sampleFileFormats)
  test(format + ' export can be imported preserving samples and tool checks', async () => {
    const blob = await sampleExportBlob(version, [a.id], format);
    const parsed = await parseSampleFile({
      name: 'export.' + format,
      size: blob.size,
      arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe(a.name);
    expect(parsed[0].turns[0].input).toEqual(a.turns[0].input);
    expect(parsed[0].turns[0].required_tools).toEqual(['lookup']);
  });
for (const { value: format } of sampleFileFormats)
  test(format + ' keeps unset classification and difficulty empty after import', async () => {
    const sample = { ...a, category: null, difficulty: null };
    const blob = await sampleExportBlob({ ...version, cases: [sample] }, undefined, format);
    const [imported] = await parseSampleFile({
      name: 'blank.' + format, size: blob.size, arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(imported).toMatchObject({ category: null, difficulty: null });
  });

test('JSON imports reordered turns using turn_order and reports conflicting positions', async () => {
  const data = exportSamples(version, [a.id]);
  const turns = data.cases[0].turns;
  turns.unshift({ ...turns[0], turn_order: 2, input: { query: '后续轮次' } });
  const read = () => {
    const blob = new Blob([JSON.stringify(data)]);
    return parseSampleFile({ name: 'order.json', size: blob.size, arrayBuffer: () => blob.arrayBuffer() });
  };
  expect((await read())[0].turns.map((t) => t.input.query)).toEqual(['输入甲', '后续轮次']);
  turns[0].turn_order = 1;
  await expect(read()).rejects.toThrow('轮次顺序 1 重复');
  turns[0].turn_order = 0;
  await expect(read()).rejects.toThrow('轮次顺序必须为正整数');
  turns.pop();
  turns[0].turn_order = 2;
  await expect(read()).rejects.toThrow('单轮样本的轮次顺序必须为 1');
});

test('shared Axios handles raw/envelope/204 responses and does not double the API prefix', async () => {
  const previous = http.defaults.adapter;
  try {
    let data: unknown = { value: 3 };
    http.defaults.adapter = async (config) => {
      expect(config.url).toBe('/datasets');
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    expect(await httpRequest('/api/datasets')).toEqual({ value: 3 });
    data = { code: '0', message: 'ok', data: [1] };
    expect(await httpRequest('/datasets')).toEqual([1]);
    http.defaults.adapter = async (config) => ({
      data: '',
      status: 204,
      statusText: 'No Content',
      headers: {},
      config,
    });
    expect(await httpRequest('/datasets')).toBe('');
    http.defaults.adapter = async (config) => ({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
    data = { code: 'error', message: 'blocked', data: null };
    await expect(httpRequest('/datasets')).rejects.toBeInstanceOf(ApiError);
  } finally {
    http.defaults.adapter = previous;
  }
});
test('shared Axios preserves validation details and never retries a timed-out write', async () => {
  const previous = http.defaults.adapter;
  try {
    let calls = 0;
    http.defaults.adapter = async () => {
      calls++;
      throw { isAxiosError: true, code: 'ECONNABORTED', message: 'timeout' };
    };
    await expect(
      httpRequest('/datasets', { method: 'POST', data: { name: 'test' } }),
    ).rejects.toMatchObject({ status: 0 });
    expect(calls).toBe(1);
    const detail = [{ message: 'version conflict' }];
    http.defaults.adapter = async () => {
      throw { isAxiosError: true, response: { status: 422, data: { detail } } };
    };
    await expect(httpRequest('/datasets')).rejects.toMatchObject({ status: 422, detail });
  } finally {
    http.defaults.adapter = previous;
  }
});

test('execution expectations survive editing and every supported export-import format', async () => {
  const { toEditorCase, toApiCase } = await import('../src/api/datasets');
  const raw: any = {
    ...blankSample('路径专项'),
    turns: [
      {
        id: 'turn-path',
        input: { txt: '测试' },
        notes: '',
        expectations: [
          {
            id: 'path-1',
            name: '完整节点',
            kind: 'execution_path',
            scope: 'workflow',
            expected: ['extract', 'end'],
            allowed_tools: null,
          },
          {
            id: 'path-2',
            name: '实际技能',
            kind: 'execution_path',
            scope: 'skill',
            expected: ['general_help'],
            allowed_tools: [],
          },
        ],
      },
    ],
  };
  const edited = toEditorCase(raw);
  edited.turns[0].notes = '修改备注';
  expect(toApiCase(edited).turns[0].expectations).toEqual(raw.turns[0].expectations);
  for (const { value: format } of sampleFileFormats) {
    const blob = await sampleExportBlob({ ...version, cases: [edited] }, [edited.id], format);
    const imported = await parseSampleFile({
      name: 'path.' + format,
      size: blob.size,
      arrayBuffer: () => blob.arrayBuffer(),
    });
    expect(toApiCase(imported[0]).turns[0].expectations).toEqual(
      raw.turns[0].expectations.map((e: any) => ({ ...e, id: expect.any(String) })),
    );
  }
});

test('CSV preserves Chinese text, commas, quotes, multiline inputs and every expectation type', async () => {
  const { toApiCase, toEditorCase } = await import('../src/api/datasets');
  const raw = {
    ...toApiCase(blankSample('中文, "引号"\n多行样本')),
    notes: '第一行\r\n第二行,备注',
    turns: [
      {
        id: 'turn',
        input: { txt: '你好, "世界"\n下一行', empty: '', zero: 0, flag: false, missing: null },
        notes: '轮次\n备注',
        expectations: [
          {
            id: 'output',
            name: '回答',
            kind: 'output',
            path: null,
            condition: { kind: 'equals', expected: '你好, "世界"\n下一行' },
          },
          {
            id: 'state',
            name: null,
            kind: 'state',
            path: 'status',
            condition: { kind: 'one_of', allowed: ['approved', 'review'] },
          },
          {
            id: 'arg',
            name: null,
            kind: 'tool_argument',
            tool: 'lookup',
            path: 'amount',
            occurrence: 'all',
            condition: { kind: 'within_range', minimum: 0, maximum: 10 },
          },
          { id: 'required', name: null, kind: 'tool_call', tool: 'lookup', mode: 'required' },
          { id: 'forbidden', name: null, kind: 'tool_call', tool: 'delete', mode: 'forbidden' },
          {
            id: 'skill',
            name: null,
            kind: 'skill_route',
            condition: { kind: 'equals', expected: 'help' },
          },
          { id: 'policy', name: null, kind: 'policy', policy_id: 'safe' },
          {
            id: 'path',
            name: null,
            kind: 'execution_path',
            scope: 'tool',
            expected: ['lookup'],
            allowed_tools: null,
          },
        ],
      },
    ],
  };
  const sample = toEditorCase(raw as any);
  const blob = await sampleExportBlob({ ...version, cases: [sample, b] }, [sample.id], 'csv');
  expect(blob.type).toBe('text/csv;charset=utf-8');
  expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)]).toEqual([239, 187, 191]);
  const parsed = await parseSampleFile({
    name: 'samples.csv',
    size: blob.size,
    arrayBuffer: () => blob.arrayBuffer(),
  });
  expect(parsed).toHaveLength(1);
  const normalized = (item: ReturnType<typeof toApiCase>) => ({
    ...item,
    id: 'case',
    turns: item.turns.map((t) => ({
      ...t,
      id: 'turn',
      expectations: t.expectations.map((e) => ({ ...e, id: 'expectation' })),
    })),
  });
  const expected = normalized(toApiCase(sample));
  expected.notes = '';
  expected.turns[0].notes = '';
  expect(normalized(toApiCase(parsed[0]))).toEqual(expected);
});

test('expectation snapshots remain independent without native structuredClone', async () => {
  const { toEditorCase, toApiCase } = await import('../src/api/datasets');
  const raw = toApiCase(blankSample('旧浏览器样本'));
  raw.turns[0].expectations = [
    {
      id: 'nested-output',
      name: '嵌套期望',
      kind: 'output',
      path: null,
      condition: {
        kind: 'equals',
        expected: { values: [0, false, null, '中文'], nested: { status: 'ready' } },
      },
    },
    {
      id: 'execution-path',
      name: null,
      kind: 'execution_path',
      scope: 'workflow',
      expected: ['start', 'end'],
      allowed_tools: null,
    },
  ];
  const original = JSON.parse(JSON.stringify(raw.turns[0].expectations));
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'structuredClone');
  try {
    Reflect.deleteProperty(globalThis, 'structuredClone');
    const edited = toEditorCase(raw);
    expect(toApiCase(edited).turns[0].expectations).toEqual(original);
    const editable = edited.turns[0].expectations[0];
    if (editable.condition.kind !== 'equals') throw Error('Expected an equality condition');
    const expected = editable.condition.expected as {
      values: unknown[];
      nested: { status: string };
    };
    expected.values[0] = 'changed';
    expected.nested.status = 'changed';
    raw.turns[0].expectations.reverse();
    const path = raw.turns[0].expectations[0];
    if (path.kind !== 'execution_path') throw Error('Expected an execution path');
    path.expected.push('changed');
    expect(edited.turns[0].original_expectations).toEqual(original);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'structuredClone', descriptor);
  }
});

test('dataset reads and sample write responses work without native structuredClone', async () => {
  const { datasetApi, toApiCase } = await import('../src/api/datasets');
  const raw = toApiCase(blankSample('兼容性样本'));
  const dataset = {
    id: 'compatibility',
    name: '兼容性测评集',
    description: '',
    archived: false,
    created_at: '2026-11-10T00:00:00Z',
    updated_at: '2026-11-10T00:00:00Z',
  };
  const draft = {
    id: 'compatibility-draft',
    dataset_id: dataset.id,
    dataset_name: dataset.name,
    dataset_description: '',
    version: null,
    status: 'draft',
    based_on_version: null,
    cases: [raw],
    notes: '',
    created_at: dataset.created_at,
    updated_at: dataset.updated_at,
    published_at: null,
    content_sha256: 'original',
  };
  const previousAdapter = http.defaults.adapter;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'structuredClone');
  try {
    Reflect.deleteProperty(globalThis, 'structuredClone');
    http.defaults.adapter = async (config) => ({
      data: config.url === '/datasets/compatibility' ? { dataset, versions: [draft] } : draft,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
    const detail = await datasetApi.detail('compatibility');
    const current = await datasetApi.currentDraft('compatibility');
    const added = await datasetApi.addCase('compatibility', a, 'original');
    const updated = await datasetApi.updateCase('compatibility', a, 'original');
    for (const result of [detail.versions[0], current, added, updated]) {
      expect(result.cases).toHaveLength(1);
      expect(toApiCase(result.cases[0])).toEqual(raw);
    }
  } finally {
    http.defaults.adapter = previousAdapter;
    if (descriptor) Object.defineProperty(globalThis, 'structuredClone', descriptor);
  }
});

test('request diagnostics omit credentials, payloads and URL query values', async () => {
  const previous = http.defaults.adapter;
  const previousWarn = console.warn;
  const logs: unknown[][] = [];
  console.warn = (...args: unknown[]) => { logs.push(args); };
  try {
    http.defaults.adapter = async (config) => {
      throw { isAxiosError: true, code: 'ECONNABORTED', message: 'private-secret',
        config: { ...config, headers: { token: 'private-secret' }, data: 'private-secret' } };
    };
    await expect(httpRequest('/datasets?token=private-secret', {method: 'POST'}))
      .rejects.toMatchObject({status: 0});
    expect(logs).toHaveLength(1);
    expect(JSON.stringify(logs)).not.toContain('private-secret');
    expect(logs[0][1]).toMatchObject({path: '/datasets', method: 'post', status: 0});
  } finally {
    http.defaults.adapter = previous;
    console.warn = previousWarn;
  }
});

test('XLSX preserves exact text in variable headers, input JSON and scalar expectations', async () => {
  const sample = blankSample('查询 a_x000D_b');
  const text = '第一行\r\n第二行\r第三行\f末尾\t普通换行\n文字串 _x005F_、_x000D_x0041_、_x0041\r尾声🌱';
  const variable = { name: '编号_x000D_校验', type: 'str', required: false, value: text };
  sample.initial_state = { config_variables: [variable] };
  sample.turns[0].input = { txt: '请查询 a_x000D_b 的状态', literal: '_x005F_x000D_' };
  sample.turns[0].expected_skill = '技能_x0041_标准';
  sample.turns[0].required_tools = ['query_x000D_lookup', 'helper'];
  sample.turns[0].expectations = [
    { id: 'output', name: null, kind: 'output', path: '属性_x0041_字段', condition: { kind: 'equals', expected: text } },
  ];
  const blob = await sampleExportBlob({ ...version, cases: [sample] }, undefined, 'xlsx');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await blob.arrayBuffer());
  const sheet = book.getWorksheet('Cases')!;
  const headers = (sheet.getRow(1).values as string[]).slice(1);
  const valueAt = (header: string) => {
    expect(headers).toContain(header);
    return sheet.getRow(2).getCell(headers.indexOf(header) + 1).value;
  };
  expect(valueAt('样本名称')).toBe(sample.name);
  expect(valueAt('轮次顺序')).toBe(1);
  expect(JSON.parse(String(valueAt('输入内容')))).toEqual(sample.turns[0].input);
  expect(JSON.parse(String(valueAt('初始变量_编号_x000D_校验_字符串_非必填')))).toBe(text);
  expect(JSON.parse(String(valueAt('最终输出_等于_期望值')))).toBe(text);

  const [copy] = await parseSampleFile({ name: '特殊字符.xlsx', size: blob.size, arrayBuffer: () => blob.arrayBuffer() });
  expect(copy).toMatchObject({ name: sample.name, initial_state: sample.initial_state });
  expect(copy.turns[0].input).toEqual(sample.turns[0].input);
  expect(copy.turns[0].expected_skill).toBe(sample.turns[0].expected_skill);
  expect(copy.turns[0].required_tools).toEqual(sample.turns[0].required_tools);
  expect(copy.turns[0].expectations[0].path).toBe(sample.turns[0].expectations[0].path);
  expect(copy.turns[0].expectations[0].condition).toEqual(sample.turns[0].expectations[0].condition);
});
