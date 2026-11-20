import { test, expect } from '@playwright/test';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { zipSync, strToU8 } from 'fflate';
import {
  parseCsv,
  rowsToSamples,
  normalizeCases,
  parseSampleFile,
} from '../src/views/datasets/utils/sample-import';
import { toApiCase } from '../src/api/datasets';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const file = (name: string, bytes: Uint8Array) => ({
  name,
  size: bytes.length,
  arrayBuffer: async () => Uint8Array.from(bytes).buffer,
});
const chineseHeaders = [
  '样本编号', '样本名称', '样本分类', '难度', '标签', '样本备注', '初始状态',
  '轮次编号', '轮次顺序', '输入内容', '期望结果', '轮次备注',
];
const templateHeaders = ['样本名称', '输入内容', '样本分类', '难度', '初始变量', '期望结果', '轮次顺序'];
const englishHeaders = [
  'case_id', 'case_name', 'category', 'difficulty', 'tags_json', 'case_notes',
  'initial_state_json', 'turn_id', 'turn_order', 'input_json', 'expectations_json', 'turn_notes',
];
async function tableFile(format: 'xlsx' | 'csv', headers: string[], rows: (string | number)[][]) {
  if (format === 'csv') {
    const text = [headers, ...rows]
      .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    return file('sample.csv', strToU8('\uFEFF' + text));
  }
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Cases').addRows([headers, ...rows]);
  return file('sample.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer()));
}

for (const format of ['xlsx', 'csv'] as const) {
  test(format + ' Chinese headers preserve all fields and sorted multi-turn expectations', async () => {
    const expectations = [{
      name: '嵌套输出', kind: 'output', path: null,
      condition: { kind: 'equals', expected: { values: [0, false, null, '中文'] } },
    }];
    const row = (order: number) => [
      'case-shared', '中文样本', 'boundary', 'hard', '["中文","多轮"]', '样本备注',
      '{"config_variables":[{"name":"enabled","value":false}]}', 'turn-' + order, order,
      JSON.stringify({ txt: '第' + order + '轮', nested: { amount: 0, enabled: false } }),
      JSON.stringify(expectations), '轮次备注' + order,
    ];
    const rows = [row(2), row(1)];
    const english = await parseSampleFile(await tableFile(format, englishHeaders, rows));
    const chinese = await parseSampleFile(await tableFile(format, chineseHeaders, rows));
    const content = (samples: typeof english) => samples.map(toApiCase).map(({ id, turns, ...sample }) => ({
      ...sample,
      turns: turns.map(({ id, expectations, ...turn }) => ({
        ...turn,
        expectations: expectations.map(({ id, ...expectation }) => expectation),
      })),
    }));
    expect(content(chinese)).toEqual(content(english));
    expect(chinese).toHaveLength(1);
    expect(chinese[0]).toMatchObject({
      name: '中文样本', category: 'boundary', difficulty: 'hard', tags: ['中文', '多轮'],
      notes: '样本备注', initial_state: { config_variables: [{ name: 'enabled', value: false }] },
    });
    expect(chinese[0].turns.map((turn) => turn.input.txt)).toEqual(['第1轮', '第2轮']);
    expect(chinese[0].turns.map((turn) => turn.notes)).toEqual(['轮次备注1', '轮次备注2']);
    expect(content(chinese)[0].turns[0].expectations).toEqual(expectations);
  });

  test(format + ' rejects duplicate Chinese and English input columns', async () => {
    const input = await tableFile(format, ['样本名称', 'input_json', '输入内容'], [
      ['中文样本', '{"txt":"hello"}', '{"txt":"你好"}'],
    ]);
    await expect(parseSampleFile(input)).rejects.toThrow(/表头.*重复/);
  });

  test(format + ' groups numbered rows by trimmed sample name and keeps a different unnumbered sample', async () => {
    const input = await tableFile(format, ['样本名称', '轮次顺序', '输入内容'], [
      [' 客户咨询 ', 3, '{"txt":"第三轮"}'],
      ['借记卡咨询', '', '{"txt":"独立样本"}'],
      ['开户咨询', 1, '{"txt":"另一个样本"}'],
      ['客户咨询', 1, '{"txt":"第一轮"}'],
    ]);
    const samples = await parseSampleFile(input);
    expect(samples.map((sample) => ({
      name: sample.name,
      texts: sample.turns.map((turn) => turn.input.txt),
    }))).toEqual([
      { name: '客户咨询', texts: ['第一轮', '第三轮'] },
      { name: '借记卡咨询', texts: ['独立样本'] },
      { name: '开户咨询', texts: ['另一个样本'] },
    ]);
  });

  test(format + ' locates a second independent sample with the same trimmed name', async () => {
    const input = await tableFile(format, ['样本名称', '轮次顺序', '输入内容'], [
      [' 客户咨询 ', 1, '{"txt":"第一条"}'],
      ['客户咨询', '', '{"txt":"第二条"}'],
    ]);
    await expect(parseSampleFile(input)).rejects.toMatchObject({
      issues: [expect.objectContaining({
        row: 3,
        field: '样本名称',
        message: expect.stringContaining('第 2 行重复'),
      })],
    });
  });
}

test('parseCsv preserves the original trimmed Chinese headers', () => {
  expect(parseCsv(' 样本名称 , 输入内容 \n中文样本,"{""txt"":""你好""}"')).toEqual([
    { 样本名称: '中文样本', 输入内容: '{"txt":"你好"}' },
  ]);
});

test('CSV handles BOM, quotes, commas, multiline and rejects malformed input', () => {
  expect(parseCsv('\uFEFFcase_name,query\r\na,"hello,\n""world"""')[0]).toEqual({
    case_name: 'a',
    query: 'hello,\n"world"',
  });
  for (const text of ['a,a\n1,2', 'a,b\n1', 'a\n"bad']) expect(() => parseCsv(text)).toThrow();
});
test('blank case ids remain distinct while shared ids form sorted multi-turn cases', () => {
  expect(
    rowsToSamples([
      { case_id: '', case_name: 'a', query: 'one' },
      { case_id: '', case_name: 'b', query: 'two' },
    ]),
  ).toHaveLength(2);
  const sample = rowsToSamples([
    { case_id: 'x', case_name: 'a', query: 'two', turn_order: 2 },
    { case_id: 'x', case_name: 'a', query: 'one', turn_order: 1 },
  ])[0];
  expect(sample.turns.map((t) => t.input.query)).toEqual(['one', 'two']);
  expect(() =>
    rowsToSamples([
      { case_id: 'x', case_name: 'a', query: 'one', turn_order: 1 },
      { case_id: 'x', case_name: 'a', query: 'two', turn_order: 1 },
    ]),
  ).toThrow();
});
test('canonical JSON preserves route, tools, policy, output and complex checks', () => {
  const expectations = [
    { kind: 'skill_route', condition: { kind: 'one_of', allowed: ['a', 'b'] } },
    { kind: 'tool_call', tool: 'lookup', mode: 'required' },
    { kind: 'policy', policy_id: 'p' },
    { kind: 'output', path: null, condition: { kind: 'equals', expected: 'yes' } },
  ];
  const sample = normalizeCases([
    { name: 'a', turns: [{ input: { query: 'hi' }, expectations }] },
  ])[0];
  expect(toApiCase(sample).turns[0].expectations.map(({ id, name, ...e }) => e)).toEqual(
    expectations,
  );
  expect(() =>
    normalizeCases([
      { name: 'bad', turns: [{ input: { txt: '你好' }, expectations: [{ kind: 'skill_route' }] }] },
    ]),
  ).toThrow('condition');
});
test('JSON and CSV parse into editable samples with human expectations', async () => {
  const csv = await parseSampleFile(
    file('sample.csv', strToU8('case_name,query,expected\na,hi,hello')),
  );
  expect(csv[0].turns[0].expectations[0].condition).toEqual({ kind: 'equals', expected: 'hello' });
  const json = await parseSampleFile(
    file('sample.json', strToU8(JSON.stringify({ version: { cases: [toApiCase(csv[0])] } }))),
  );
  expect(json[0].turns[0].input).toEqual({ query: 'hi' });
});
test('Excel Cases worksheet imports values but rejects formulas', async () => {
  const book = new ExcelJS.Workbook(),
    sheet = book.addWorksheet('Cases');
  sheet.addRow(['case_name', 'query', 'expected']);
  sheet.addRow(['excel', 'hi', 'hello']);
  let bytes = await book.xlsx.writeBuffer();
  expect((await parseSampleFile(file('sample.xlsx', new Uint8Array(bytes))))[0].name).toBe('excel');
  sheet.getCell('B2').value = { formula: '1+1', result: 2 };
  bytes = await book.xlsx.writeBuffer();
  await expect(parseSampleFile(file('sample.xlsx', new Uint8Array(bytes)))).rejects.toThrow('公式');
});
test('ZIP imports are rejected even when they contain a valid supported sample', async () => {
  const csv = strToU8('case_name,query\na,hi');
  await expect(parseSampleFile(file('a.zip', zipSync({ 'a.csv': csv })))).rejects.toThrow(
    '仅支持 Excel (.xlsx)、JSON、CSV',
  );
});

test('downloadable Excel template contains one single-turn sample and field instructions', async () => {
  const bytes = readFileSync(
    new URL('../src/assets/dataset-import-template.xlsx', import.meta.url),
  );
  const samples = await parseSampleFile(file('template.xlsx', bytes));
  expect(samples).toHaveLength(1);
  expect(samples[0].turns).toHaveLength(1);
  expect(samples[0]).toMatchObject({ category: 'positive', difficulty: 'medium', initial_state: {} });
  expect(samples[0].turns[0]).toMatchObject({ input: { txt: '你好' },
    expectations: [{ kind: 'output', path: null }] });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const data = workbook.getWorksheet('Cases')!;
  const guide = workbook.getWorksheet('填写说明')!;
  const examples = workbook.getWorksheet('测评项示例')!;
  expect((data.getRow(1).values as string[]).slice(1)).toEqual(templateHeaders);
  expect(data.getCell('C2').text).toBe('正例');
  expect(data.getCell('D2').text).toBe('中等');
  expect(data.getCell('G2').value).toBe(1);
  const emptyRowHeight = data.getRow(7).height ?? data.properties.defaultRowHeight;
  for (const number of [3, 4, 5, 6]) {
    const row = data.getRow(number);
    expect(row.hasValues).toBe(false);
    expect(row.height ?? data.properties.defaultRowHeight).toBe(emptyRowHeight);
  }
  expect(guide).toBeTruthy();
  expect(examples).toBeTruthy();
  const guidance = JSON.stringify(guide.getSheetValues());
  data.getRow(1).eachCell((cell) => expect(guidance).toContain(cell.text));
  for (const status of ['必填', '可选', '系统生成']) expect(guidance).toContain(status);
  expect(guide.getCell('B7').text).toContain('同一多轮样本的各行填写相同的样本名称');
  expect(guide.getCell('B8').text).toContain('从表格顶部往下首次出现的一行');
  expect(guide.getCell('B23').text).toContain('单轮填 1，留空按 1 导入');
  expect(JSON.parse(examples.getCell('C5').text)).toMatchObject({
    kind: 'output', path: 'output', condition: { kind: 'matches_pattern' },
  });
});

test('downloaded Excel template sorts turns while reading case fields from the first physical row', async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(readFileSync(new URL('../src/assets/dataset-import-template.xlsx', import.meta.url)));
  const data = workbook.getWorksheet('Cases')!;
  data.getRow(3).values = ['乱序多轮示例', '{"txt":"第二轮"}', '边界', '困难', '{"ready":true}', '', 2];
  data.getRow(4).values = ['乱序多轮示例', '{"txt":"第一轮"}', '', '', '', '', 1];
  const bytes = await workbook.xlsx.writeBuffer();
  const samples = await parseSampleFile(file('filled-template.xlsx', new Uint8Array(bytes)));
  const multiTurn = samples.find((sample) => sample.name === '乱序多轮示例');
  expect(multiTurn).toMatchObject({ category: 'boundary', difficulty: 'hard', initial_state: { ready: true } });
  expect(multiTurn?.turns.map((turn) => turn.input.txt)).toEqual(['第一轮', '第二轮']);
});

test('downloadable CSV template documents required fields and defaults in the Chinese headers', () => {
  const csv = readFileSync(
    new URL('../src/assets/dataset-import-template.csv', import.meta.url), 'utf8',
  );
  const headers = csv.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0]
    .split(',').map((header) => header.replace(/^"|"$/g, ''));
  expect(headers.map((header) => header.split('｜')[0])).toEqual(templateHeaders);
  expect(headers.filter((header) => header.includes('必填'))).toHaveLength(2);
  expect(headers).toContain('期望结果｜选填，默认 []');
  const orderHeader = headers.find((header) => header.startsWith('轮次顺序｜'))!;
  expect(parseCsv(csv)[0][orderHeader]).toBe('1');
});

test('JSON and CSV templates match the complete Excel sample content', async () => {
  const content = (samples: ReturnType<typeof normalizeCases>) =>
    samples.map(toApiCase).map(({ id, turns, ...sample }) => ({
      ...sample,
      turns: turns.map(({ id, expectations, ...turn }) => ({
        ...turn,
        expectations: expectations.map(({ id, ...expectation }) => expectation),
      })),
    }));
  const excel = await parseSampleFile(
    file(
      'template.xlsx',
      readFileSync(new URL('../src/assets/dataset-import-template.xlsx', import.meta.url)),
    ),
  );
  for (const format of ['json', 'csv']) {
    const bytes = readFileSync(
      new URL('../src/assets/dataset-import-template.' + format, import.meta.url),
    );
    const parsed = await parseSampleFile(file('template.' + format, bytes));
    expect(content(parsed)).toEqual(content(excel));
  }
});
