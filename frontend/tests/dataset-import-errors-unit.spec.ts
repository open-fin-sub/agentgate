import { test, expect } from '@playwright/test';
import { webcrypto } from 'node:crypto';
import ExcelJS from 'exceljs';
import { strToU8 } from 'fflate';
import { parseSampleFile, rowsToSamples } from '../src/views/datasets/utils/sample-import';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

const file = (name: string, bytes: Uint8Array) => ({
  name,
  size: bytes.length,
  arrayBuffer: async () => Uint8Array.from(bytes).buffer,
});
const jsonFile = (value: unknown) => file('samples.json', strToU8(JSON.stringify(value)));
const csvFile = (rows: string[][]) => file('samples.csv', strToU8(rows.map((row) =>
  row.map((value) => '"' + value.replace(/"/g, '""') + '"').join(','),
).join('\r\n')));
type ImportError = Error & {
  issues: { location: string; sheet?: string; row?: number; column?: string; sampleName?: string;
    turn?: number; field: string; path?: string; message: string }[];
  totalIssues: number;
  sampleCount: number;
  fileLevel: boolean;
};
async function validationError(input: ReturnType<typeof file>): Promise<ImportError> {
  let error: unknown;
  try { await parseSampleFile(input); } catch (caught) { error = caught; }
  expect(error, 'invalid file must reject with structured import diagnostics').toBeInstanceOf(Error);
  expect(error).toHaveProperty('issues');
  expect(error).toHaveProperty('totalIssues');
  return error as ImportError;
}
const validTurn = () => ({ input: { query: '你好' }, expectations: [] });

test('aggregates independent input errors across samples without exposing partial results', async () => {
  const error = await validationError(csvFile([
    ['case_id', 'case_name', 'turn_order', 'input_json'],
    ['loan', '贷款申请', '1', '[1]'],
    ['loan', '贷款申请', '2', 'not JSON'],
    ['account', '账户查询', '1', ''],
  ]));
  expect(error.fileLevel).toBe(false);
  expect(error.totalIssues).toBe(3);
  expect(error.sampleCount).toBe(2);
  expect(error.issues.map((issue) => issue.row)).toEqual([2, 3, 4]);
  expect(error.issues.map((issue) => issue.sampleName)).toEqual(['贷款申请', '贷款申请', '账户查询']);
  expect(error.issues.map((issue) => issue.turn)).toEqual([1, 2, 1]);
  expect(error.issues.every((issue) => issue.field === '输入内容' && !!issue.message)).toBe(true);
});

test('collects independent fields in one row and separate invalid expectations', async () => {
  const error = await validationError(csvFile([
    ['case_name', 'category', 'input_json', 'expectations_json'],
    ['多项错误', 'unknown', '[]', JSON.stringify([
      { kind: 'tool_call', tool: '', mode: 'required' },
      { kind: 'policy', policy_id: '' },
    ])],
  ]));
  expect(error.totalIssues).toBe(4);
  expect(error.sampleCount).toBe(1);
  expect(error.issues.filter((issue) => issue.field === '期望结果')).toHaveLength(2);
  expect(error.issues.filter((issue) => issue.field === '期望结果').map((issue) => issue.path)).toEqual([
    expect.stringContaining('expectations[0]'), expect.stringContaining('expectations[1]'),
  ]);
});

test('keeps Excel physical rows and cells after blank rows and multi-turn sorting', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['case_id', 'case_name', 'turn_order', 'input_json', 'expectations_json']);
  sheet.getRow(3).values = ['shared', '贷款申请', 2, '{"query":"第二轮"}', JSON.stringify([
    { kind: 'policy', policy_id: '' },
  ])];
  sheet.getRow(7).values = ['shared', '贷款申请', 1, 'not JSON', '[]'];
  const error = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(error.totalIssues).toBe(2);
  expect(error.sampleCount).toBe(1);
  expect(error.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ sheet: 'Cases', row: 3, column: 'E', location: 'Cases!E3', turn: 2, field: '期望结果' }),
    expect.objectContaining({ sheet: 'Cases', row: 7, column: 'D', location: 'Cases!D7', turn: 1, field: '输入内容' }),
  ]));
});

test('Excel uses actual selected worksheet name and formula cell location', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('业务样本');
  sheet.addRow(['case_name', 'input_json']);
  sheet.addRow(['公式样本', { formula: '1+1', result: 2 }]);
  const error = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(error.totalIssues).toBe(1);
  expect(error.issues[0]).toMatchObject({ sheet: '业务样本', row: 2, column: 'B', location: '业务样本!B2' });
  expect(error.issues[0].message).toContain('公式');
});

test('Excel groups Chinese headers and reports invalid JSON and formula cells at their physical positions', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['样本编号', '输入内容', '样本名称', '轮次顺序']);
  sheet.getRow(3).values = ['shared', 'not JSON', '中文样本', 2];
  sheet.getRow(7).values = ['shared', { formula: '1+1', result: 2 }, '中文样本', 1];

  const error = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(error.totalIssues).toBe(2);
  expect(error.sampleCount).toBe(1);
  expect(error.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ location: 'Cases!B3', field: '输入内容', turn: 2, message: expect.stringContaining('JSON') }),
    expect.objectContaining({ location: 'Cases!B7', field: '输入内容', turn: 1, message: expect.stringContaining('公式') }),
  ]));
});

test('Excel and CSV import populated initial variables using the new template header', async () => {
  const initial = { config_variables: [{ name: 'customer', value: 'test-low' }] };
  const row = ['中文样本', '{"txt":"你好"}', JSON.stringify(initial)];
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Cases');
  sheet.addRows([['样本名称', '输入内容', '初始变量'], row]);
  const inputs = [
    file('samples.xlsx', new Uint8Array(await book.xlsx.writeBuffer())),
    csvFile([['样本名称｜必填', '输入内容｜必填', '初始变量｜选填'], row]),
  ];
  for (const input of inputs) {
    const [sample] = await parseSampleFile(input);
    expect(sample.initial_state).toEqual(initial);
  }
});

test('CSV locates records by starting physical line through blanks and quoted multiline cells', async () => {
  const text = 'case_name,query,input_json\r\n\r\n正常,"第一行\r\n第二行",\r\n错误,,not-json\r\n';
  const error = await validationError(file('samples.csv', strToU8(text)));
  expect(error.totalIssues).toBe(1);
  expect(error.issues[0]).toMatchObject({ row: 5, column: 'C', sampleName: '错误', field: '输入内容' });
  expect(error.issues[0].location).toContain('5');
});

test('JSON diagnostics keep sample index, turn index and nested expectation index', async () => {
  const error = await validationError(jsonFile({ cases: [
    { name: '贷款申请', turns: [validTurn(), { input: [], expectations: [] }] },
    { name: '账户查询', turns: [{ input: { txt: '你好' }, expectations: [
      { kind: 'policy', policy_id: '' }, { kind: 'tool_call', tool: '', mode: 'required' },
    ] }] },
  ] }));
  expect(error.totalIssues).toBe(3);
  expect(error.sampleCount).toBe(2);
  expect(error.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ sampleName: '贷款申请', turn: 2, path: 'cases[0].turns[1].input' }),
    expect.objectContaining({ sampleName: '账户查询', turn: 1, path: expect.stringContaining('cases[1].turns[0].expectations[0]') }),
    expect.objectContaining({ sampleName: '账户查询', turn: 1, path: expect.stringContaining('cases[1].turns[0].expectations[1]') }),
  ]));
});

test('JSON rejects duplicate sample names and accepts a named sample with two turns', async () => {
  const first = { name: ' 贷款申请 ', turns: [validTurn(), validTurn()] };
  await expect(parseSampleFile(jsonFile({ cases: [first] }))).resolves.toMatchObject([
    { name: '贷款申请', turns: [expect.any(Object), expect.any(Object)] },
  ]);
  const error = await validationError(jsonFile({
    cases: [first, { name: '贷款申请', turns: [validTurn()] }],
  }));
  expect(error.issues).toEqual([expect.objectContaining({
    field: '样本名称',
    path: 'cases[1].name',
    message: expect.stringContaining('cases[0]重复'),
  })]);
});

test('import preview rejects a sample name already present in the destination draft', async () => {
  const input = csvFile([
    ['样本名称', '轮次顺序', '输入内容'],
    [' 贷款申请 ', '2', '{"txt":"第二轮"}'],
    ['贷款申请', '1', '{"txt":"第一轮"}'],
  ]);
  await expect(parseSampleFile(input, new Set(['贷款申请']))).rejects.toMatchObject({
    issues: [expect.objectContaining({
      field: '样本名称',
      row: 2,
      message: expect.stringContaining('草稿已存在同名样本“贷款申请”'),
    })],
  });
});

test('one malformed JSON cell produces one actionable error without dependent cascades', async () => {
  const error = await validationError(csvFile([
    ['case_name', 'input_json', 'expectations_json'],
    ['损坏单元格', '{broken', '[]'],
  ]));
  expect(error.totalIssues).toBe(1);
  expect(error.issues).toHaveLength(1);
  expect(error.issues[0]).toMatchObject({ row: 2, field: '输入内容' });
});

for (const [name, content] of [
  ['samples.json', '{"cases":['],
  ['samples.xlsx', 'not-an-excel-file'],
  ['samples.csv', 'case_name,input_json\n"unclosed'],
] as const) test(name + ' unreadable syntax is a file error without misleading sample locations', async () => {
  const error = await validationError(file(name, strToU8(content)));
  expect(error.fileLevel).toBe(true);
  expect(error.issues).toEqual([]);
  expect(error.message.length).toBeGreaterThan(0);
});

test('caps displayed errors at 200 while retaining total and affected sample counts', async () => {
  const rows = [['case_name', 'input_json'], ...Array.from({ length: 205 }, (_, i) => ['样本' + i, '[]'])];
  const error = await validationError(csvFile(rows));
  expect(error.totalIssues).toBe(205);
  expect(error.sampleCount).toBe(205);
  expect(error.issues).toHaveLength(200);
  expect(error.issues[199].row).toBe(201);
});

test('import requires nonempty input and fills omitted fields as a new manual sample', async () => {
  const error = await validationError(jsonFile({ cases: [{
    name: '空输入', turns: [{ input: {} }],
  }] }));
  expect(error.issues.map((issue) => issue.field)).toEqual(['输入内容']);
  const [sample] = await parseSampleFile(jsonFile({ cases: [{
    id: 'source-case', name: '最少字段', internal_metadata: 'ignored',
    turns: [{ id: 'source-turn', input: { custom: false } }],
  }] }));
  expect(sample).toMatchObject({ category: 'positive', difficulty: 'medium', initial_state: {}, tags: [], notes: '',
    turns: [{ input: { custom: false }, expectations: [], notes: '' }] });
  expect(sample).not.toHaveProperty('internal_metadata');
  expect(sample.id).not.toBe('source-case');
  expect(sample.turns[0].id).not.toBe('source-turn');
});

test('existing file and row size caps remain enforced', async () => {
  await expect(parseSampleFile({ name: 'large.csv', size: 10 * 1024 * 1024 + 1,
    arrayBuffer: async () => { throw Error('oversized file should not be read'); },
  })).rejects.toThrow('10MB');
  expect(() => rowsToSamples(Array.from({ length: 2001 }, () => ({ case_name: 'a', query: 'hello' })))).toThrow('2000');
});

test('formula coordinates use the original query column when input_json is also present', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['case_name', 'query', 'input_json']);
  sheet.addRow(['真实公式位置', { formula: '1+1', result: 2 }, '{"txt":"有效"}']);
  const error = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(error.totalIssues).toBe(1);
  expect(error.issues[0]).toMatchObject({ location: 'Cases!B2', column: 'B', field: '输入内容', turn: 1 });
});

test('Excel formula diagnostics infer the next turn for shared samples without turn_order', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['case_id', 'case_name', 'input_json']);
  sheet.addRow(['shared', '连续轮次', '{"query":"第一轮"}']);
  sheet.addRow(['shared', '连续轮次', { formula: '1+1', result: 2 }]);
  const error = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(error.totalIssues).toBe(1);
  expect(error.issues[0]).toMatchObject({
    location: 'Cases!C3', sampleName: '连续轮次', turn: 2, field: '输入内容',
  });
});

test('valid Excel still accepts an extra unused empty header cell', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['case_name', 'input_json', '']);
  sheet.addRow(['有效样本', '{"query":"你好"}', '']);
  const samples = await parseSampleFile(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(samples).toHaveLength(1);
  expect(samples[0].turns[0].input).toEqual({ query: '你好' });
});

test('distinct name headers retain the existing precedence in CSV and Excel', async () => {
  const rows = [
    ['样本名称', 'case_name', 'name', 'query'],
    ['中文名称', '主名称', '备用名称', '你好'],
  ];
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Cases').addRows(rows);

  for (const input of [
    csvFile(rows),
    file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())),
  ]) {
    const samples = await parseSampleFile(input);
    expect(samples).toHaveLength(1);
    expect(samples[0].name).toBe('主名称');
  }
});

test('missing sample name locates its alias column', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['query', '样本名称']);
  sheet.addRow(['你好', '']);
  const error = await validationError(
    file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())),
  );
  expect(error.issues[0]).toMatchObject({ location: 'Cases!B2', column: 'B', field: '样本名称' });
});

test('JSON diagnostics locate a sample directly under a top-level array', async () => {
  const error = await validationError(jsonFile([
    { name: '顶层数组样本', turns: [{ input: null, expectations: [] }] },
  ]));
  expect(error.issues[0]).toMatchObject({
    location: '[0].turns[0].input',
    path: '[0].turns[0].input',
  });
});

test('CSV aggregates recoverable column count errors and later field errors at original rows', async () => {
  const error = await validationError(csvFile([
    ['case_id', 'case_name', 'input_json'],
    ['a', '缺列'],
    ['b', '多列', '{"txt":"有效"}', 'extra'],
    ['c', '非法输入', '[]'],
  ]));
  expect(error.fileLevel).toBe(false);
  expect(error.totalIssues).toBe(3);
  expect(error.sampleCount).toBe(3);
  expect(error.issues.map((issue) => issue.row)).toEqual([2, 3, 4]);
  expect(error.issues[0].message).toContain('列数');
  expect(error.issues[1].message).toContain('列数');
  expect(error.issues[2]).toMatchObject({ row: 4, column: 'C', field: '输入内容' });
});

test('shared sample name conflicts and duplicate turn orders keep corresponding CSV columns', async () => {
  const error = await validationError(csvFile([
    ['case_id', 'case_name', 'turn_order', 'input_json'],
    ['shared', '原名称', '1', '{"txt":"有效"}'],
    ['shared', '冲突名称', '2', '{"txt":"有效"}'],
    ['shared', '原名称', '1', '{"txt":"有效"}'],
  ]));
  expect(error.totalIssues).toBe(2);
  expect(error.sampleCount).toBe(1);
  expect(error.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ row: 3, column: 'B', field: '样本名称' }),
    expect.objectContaining({ row: 4, column: 'C', field: '轮次顺序', turn: 1 }),
  ]));
});

test('Excel and CSV locate same-name collisions and invalid or repeated turn numbers', async () => {
  const rows = [
    ['样本编号', '样本名称', '轮次顺序', '输入内容'],
    ['', '客户咨询', '01', '{"txt":"有效"}'],
    ['', ' 客户咨询 ', '1', '{"txt":"重复轮次"}'],
    ['old-a', '旧样本重名', '1', '{"txt":"有效"}'],
    ['old-b', '旧样本重名', '2', '{"txt":"不同旧编号"}'],
    ['', '非法顺序', '1e2', '{"txt":"科学记数法"}'],
    ['', '顺序超范围', '9007199254740992', '{"txt":"超过安全整数"}'],
  ];
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Cases').addRows(rows);
  const inputs = [
    csvFile(rows),
    file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())),
  ];
  for (const input of inputs) {
    const error = await validationError(input);
    expect(error.fileLevel).toBe(false);
    expect(error.totalIssues).toBe(4);
    expect(error.issues).toEqual([
      expect.objectContaining({ row: 3, column: 'C', field: '轮次顺序', turn: 1 }),
      expect.objectContaining({ row: 5, column: 'B', field: '样本名称', sampleName: '旧样本重名' }),
      expect.objectContaining({ row: 6, column: 'C', field: '轮次顺序' }),
      expect.objectContaining({ row: 7, column: 'C', field: '轮次顺序' }),
    ]);
  }
});

test('Excel and CSV locate a single-turn sample with a turn number other than 1', async () => {
  const header = ['样本名称', '轮次顺序', '输入内容'];
  const row = ['单轮咨询', '2', '{"txt":"你好"}'];
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Cases').addRows([header, row]);
  const inputs = [
    { input: csvFile([header, row]), location: 'CSV 第 2 行' },
    {
      input: file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())),
      location: 'Cases!B2',
    },
  ];
  for (const { input, location } of inputs) {
    const error = await validationError(input);
    expect(error.totalIssues).toBe(1);
    expect(error.issues[0]).toMatchObject({
      location, row: 2, column: 'B', field: '轮次顺序', sampleName: '单轮咨询',
      message: expect.stringMatching(/单轮.*1/),
    });
  }
});
