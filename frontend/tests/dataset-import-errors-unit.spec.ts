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

async function spreadsheetInputs(rows: string[][]) {
  const book = new ExcelJS.Workbook();
  book.addWorksheet('Cases').addRows(rows);
  return [csvFile(rows), file('samples.xlsx', new Uint8Array(await book.xlsx.writeBuffer()))];
}

test('old and new output cells can describe different turns in the same Excel or CSV sample', async () => {
  const old = { name: '历史输出', path: 'answer', condition: { kind: 'equals', expected: false } };
  const rows = [
    ['样本名称', 'query', '轮次顺序', '最终输出', '最终输出_输出路径', '最终输出_判定方式', '最终输出_期望值'],
    ['查询', '普通查询', '1', JSON.stringify(old), '', '', ''],
    ['查询', '查询详情', '2', '', '[null,"answer"]', '["等于","属于集合"]', '[null,["已完成","处理中"]]'],
    ['查询', '整体验证', '3', '', '', '["等于","字段不存在"]', '[false,null]'],
    ['查询', '字段验证', '4', '', 'data.answer', '等于', '[1,2]'],
    ['查询', '无检查', '5', '', '', '', ''],
  ];
  for (const input of await spreadsheetInputs(rows)) {
    const [sample] = await parseSampleFile(input);
    expect(sample.turns.map((turn) => turn.expectations.map(({ id, kind, path, condition }) =>
      ({ kind, path, condition })))).toEqual([
      [{ kind: 'output', path: 'answer', condition: old.condition }],
      [
        { kind: 'output', path: null, condition: { kind: 'equals', expected: null } },
        { kind: 'output', path: 'answer', condition: { kind: 'one_of', allowed: ['已完成', '处理中'] } },
      ],
      [
        { kind: 'output', path: null, condition: { kind: 'equals', expected: false } },
        { kind: 'output', path: null, condition: { kind: 'must_be_missing' } },
      ],
      [{ kind: 'output', path: 'data.answer', condition: { kind: 'equals', expected: [1, 2] } }],
      [],
    ]);
    expect(sample.turns[0].expectations[0].name).toBe('历史输出');
  }
});

test('mixed legacy output cells and invalid split output checks identify the editable row and column', async () => {
  const rows = [
    ['样本名称', 'query', '最终输出', '最终输出_输出路径', '最终输出_判定方式', '最终输出_期望值'],
    ['新旧混填', '问', '{"condition":{"kind":"equals","expected":0}}', '', '等于', '1'],
    ['路径数不匹配', '问', '', '["answer"]', '["等于","等于"]', '[1,2]'],
    ['缺少判定方式', '问', '', 'answer', '', 'yes'],
    ['缺少期望值', '问', '', '', '等于', ''],
    ['非法输出路径', '问', '', '[null,7]', '["等于","等于"]', '[1,2]'],
  ];
  const coordinates = [
    [2, 'E', '最终输出_判定方式'], [3, 'D', '最终输出_输出路径'], [4, 'E', '最终输出_判定方式'],
    [5, 'F', '最终输出_期望值'], [6, 'D', '最终输出_输出路径'],
  ] as const;
  for (const input of await spreadsheetInputs(rows)) {
    const error = await validationError(input);
    expect(error.issues).toEqual(coordinates.map(([row, column, field]) => expect.objectContaining({
      row, column, field, location: input.name.endsWith('.xlsx') ? 'Cases!' + column + row : 'CSV 第 ' + row + ' 行',
    })));
  }
});

test('offline edits in method-specific columns preserve one-sided ranges, numeric zero and legacy rows', async () => {
  const headers = [
    '样本名称', 'query', '轮次顺序', '最终输出_判定方式', '最终输出_期望值',
    '最终输出_数值容差_期望值', '最终输出_数值容差_容差', '最终输出_数值范围_最小值', '最终输出_数值范围_最大值',
  ];
  const rows = [headers,
    ['编辑示例', '历史', '1', '等于', '"0"', '', '', '', ''],
    ['编辑示例', '混合检查', '2', '["数值范围","数值容差","数值范围"]', '',
      '[null,0,null]', '[null,0.5,null]', '[null,null,0]', '[8,null,null]'],
    ['编辑示例', '无参数', '3', '字段不存在', '', '', '', '', ''],
  ];
  for (const input of await spreadsheetInputs(rows)) {
    const [sample] = await parseSampleFile(input);
    expect(sample.turns.map((turn) => turn.expectations.map((rule) => rule.condition))).toEqual([
      [{ kind: 'equals', expected: '0' }],
      [{ kind: 'within_range', minimum: null, maximum: 8 }, { kind: 'within_tolerance', expected: 0, epsilon: 0.5 },
        { kind: 'within_range', minimum: 0, maximum: null }],
      [{ kind: 'must_be_missing' }],
    ]);
  }
});

test('method-specific fields reject mismatched methods, duplicate values and invalid numeric tolerance', async () => {
  const rows = [
    ['样本名称', 'query', '最终输出_判定方式', '最终输出_期望值', '最终输出_数值容差_期望值', '最终输出_数值容差_容差'],
    ['方法不符', '问', '字段不存在', '', '', '1'],
    ['重复输入', '问', '数值容差', '{"expected":2,"epsilon":1}', '2', '1'],
    ['非法容差', '问', '数值容差', '', '0', '0'],
    ['多项数量冲突', '问', '["数值容差","数值容差"]', '', '[0,1]', '[0.5]'],
  ];
  for (const input of await spreadsheetInputs(rows)) {
    const { issues } = await validationError(input);
    expect(new Set(issues.map(({ row }) => row))).toEqual(new Set([2, 3, 4, 5]));
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, column: 'F', field: '最终输出_数值容差_容差' }),
      expect.objectContaining({ row: 4, column: 'F', field: '最终输出_数值容差_容差' }),
      expect.objectContaining({ row: 5, column: 'F', field: '最终输出_数值容差_容差' }),
    ]));
  }
});

test('spreadsheet rule fields preserve multiple checks per turn and allow legacy cells of a different kind', async () => {
  const header = ['样本名称', 'query', '轮次顺序', '最终状态_字段路径', '最终状态_判定方式', '最终状态_期望值',
    '工具参数_工具名', '工具参数_字段路径', '工具参数_调用范围', '工具参数_判定方式', '工具参数_期望值',
    '最终状态', '工具参数'];
  const previousTool = JSON.stringify({ tool: 'quote', path: 'fee', occurrence: 'first',
    condition: { kind: 'equals', expected: 0 } });
  const previousState = JSON.stringify({
    期望顺序: ['工具参数', '最终状态'],
    检查项: [{ name: '审批状态', path: 'ready', condition: { kind: 'equals', expected: false } }],
  });
  const rows = [header,
    ['报价', '审核', '2', '', '', '', 'book', 'currency', '任意一次通过', '属于集合',
      '["CNY","USD"]', previousState, ''],
    ['报价', '查询', '1', '["status","payload"]', '["等于","等于"]', '["open",[0,false]]',
      '', '', '', '', '', '', previousTool],
  ];
  for (const input of await spreadsheetInputs(rows)) {
    const [sample] = await parseSampleFile(input);
    expect(sample.turns[0].expectations).toHaveLength(3);
    expect(sample.turns[0].expectations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'state', path: 'status', condition: { kind: 'equals', expected: 'open' } }),
      expect.objectContaining({ kind: 'state', path: 'payload', condition: { kind: 'equals', expected: [0, false] } }),
      expect.objectContaining({ kind: 'tool_argument', tool: 'quote', path: 'fee', occurrence: 'first',
        condition: { kind: 'equals', expected: 0 } }),
    ]));
    expect(sample.turns[1].expectations).toEqual([
      expect.objectContaining({ kind: 'tool_argument', tool: 'book', path: 'currency', occurrence: 'any',
        condition: { kind: 'one_of', allowed: ['CNY', 'USD'] } }),
      expect.objectContaining({ kind: 'state', name: '审批状态', path: 'ready', condition: { kind: 'equals', expected: false } }),
    ]);
  }
});

test('mixed rule encodings and mismatched lists are reported at the affected spreadsheet cells', async () => {
  const rows = [
    ['样本名称', 'query', '最终状态', '最终状态_字段路径', '最终状态_判定方式', '最终状态_期望值', '工具参数',
      '工具参数_工具名', '工具参数_字段路径', '工具参数_调用范围', '工具参数_判定方式', '工具参数_期望值', '期望结果'],
    ['新旧状态混填', '问', '{"path":"x","condition":{"kind":"equals","expected":0}}', 'x', '等于', '1', '', '', '', '', '', '', ''],
    ['新旧参数混填', '问', '', '', '', '', '{"tool":"t","path":"x","condition":{"kind":"equals","expected":0}}', 't', 'x', '最后一次调用', '等于', '22', ''],
    ['缺少对应值', '问', '', '["count","fee"]', '["等于","等于"]', '[1]', '', '', '', '', '', '', ''],
    ['最早版混填', '问', '', 'count', '等于', '9', '', '', '', '', '', '', '[]'],
    ['范围非法', '问', '', '', '', '', '', 'quote', 'currency', '每隔一次', '等于', 'CNY', ''],
    ['多路径仅一个判定', '问', '', '["count","fee"]', '等于', '[1,2]', '', '', '', '', '', '', ''],
  ];
  for (const input of await spreadsheetInputs(rows)) {
    const error = await validationError(input);
    expect(error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, column: 'D', field: '最终状态_字段路径' }),
      expect.objectContaining({ row: 3, column: 'H', field: '工具参数_工具名' }),
      expect.objectContaining({ row: 4, column: 'F', field: '最终状态_期望值' }),
      expect.objectContaining({ row: 5, column: 'D', field: '最终状态_字段路径' }),
      expect.objectContaining({ row: 6, column: 'J', field: '工具参数_调用范围' }),
      expect.objectContaining({ row: 7, column: 'D', field: '最终状态_字段路径' }),
    ]));
  }
});

test('Excel and CSV reject a partially filled tool argument check', async () => {
  const rows = [
    ['样本名称', '输入内容', '工具参数_工具名', '工具参数_字段路径', '工具参数_判定方式', '工具参数_等于_期望值'],
    ['仅填工具名', '查订单', 'lookup', '', '', ''],
    ['缺少路径', '查订单', 'lookup', '', '等于', '已完成'],
    ['未配置检查', '查订单', '', '', '', ''],
  ];
  for (const input of await spreadsheetInputs(rows)) {
    const error = await validationError(input);
    expect(error.issues).toEqual([
      expect.objectContaining({ row: 2, column: 'E', field: '工具参数_判定方式' }),
      expect.objectContaining({ row: 3, column: 'D', field: '工具参数_字段路径' }),
    ]);
  }
});

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

test('Excel reports blank input and formula cells at their physical positions with Chinese headers', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  sheet.addRow(['样本编号', '输入内容', '样本名称', '轮次顺序']);
  sheet.getRow(3).values = ['shared', '', '中文样本', 2];
  sheet.getRow(7).values = ['shared', { formula: '1+1', result: 2 }, '中文样本', 1];

  const error = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(error.totalIssues).toBe(2);
  expect(error.sampleCount).toBe(1);
  expect(error.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ location: 'Cases!B3', field: '输入内容', turn: 2 }),
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

test('split variables merge across turns and annotated headers preserve punctuation in names', async () => {
  const rows = [
    ['样本名称｜必填', '轮次顺序', 'query', '初始变量_客(户)｜组_字符串_必填｜选填', '初始变量___proto___未指定_未指定_顶层', '期望skill｜选填'],
    ['咨询', '2', '确认', '', '{"b":2,"a":1}', '确认技能'],
    ['咨询', '1', '你好', '测试用户', '{ "a": 1, "b": 2 }', '接待技能'],
  ];
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Cases').addRows(rows);
  for (const input of [csvFile(rows), file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer()))]) {
    const [sample] = await parseSampleFile(input);
    expect(sample.initial_state.config_variables).toEqual([
      { name: '客(户)｜组', type: 'str', required: true, value: '测试用户' },
    ]);
    expect(Object.prototype.hasOwnProperty.call(sample.initial_state, '__proto__')).toBe(true);
    expect(sample.initial_state.__proto__).toEqual({ a: 1, b: 2 });
    expect(sample.turns.map((turn) => turn.expected_skill)).toEqual(['接待技能', '确认技能']);
  }
});

test('reports incompatible initial values, split expectation validation and mixed formats at the offending cells', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cases');
  const city = '初始变量_城市_字符串_非必填';
  sheet.addRow(['样本名称', '轮次顺序', 'query', city, '最终状态', '初始状态', '期望结果', '期望skill']);
  sheet.getRow(3).values = ['甲', '1', '你好', '上海'];
  sheet.getRow(6).values = ['甲', '2', '确认', '北京', '{"condition":{"kind":"must_be_missing"}}'];
  sheet.getRow(8).values = ['乙', '1', '你好', '', '', '{"legacy":1}'];
  sheet.getRow(9).values = ['乙', '2', '确认', '上海', '', '', '[]', '确认'];
  const err = await validationError(file('samples.xlsx', new Uint8Array(await workbook.xlsx.writeBuffer())));
  expect(err.totalIssues).toBe(4);
  expect(err.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ location: 'Cases!D6', field: city, message: expect.stringContaining('第 3 行') }),
    expect.objectContaining({ location: 'Cases!E6', field: '最终状态', message: expect.stringContaining('path') }),
    expect.objectContaining({ location: 'Cases!D9', field: city, message: expect.stringContaining('旧版初始变量') }),
    expect.objectContaining({ location: 'Cases!H9', field: '期望skill', message: expect.stringContaining('旧版期望结果') }),
  ]));
});

test('old and split columns may coexist when only one representation is filled for each sample or turn', async () => {
  const [old, split] = await parseSampleFile(csvFile([
    ['样本名称', '轮次顺序', 'query', '初始变量', '初始变量_城市_字符串_非必填', '期望结果', '必须工具'],
    ['旧样本', '1', '你好', '{"legacy":1}', '', '[]', ''],
    ['新样本', '1', '开始', '', '上海', '', '天气'],
    ['新样本', '2', '确认', '', '', '[{"kind":"tool_call","tool":"出行"}]', ''],
  ]));
  expect(old.initial_state).toEqual({ legacy: 1 });
  expect(split.initial_state.config_variables).toEqual([
    { name: '城市', type: 'str', required: false, value: '上海' },
  ]);
  expect(split.turns.map((turn) => turn.required_tools)).toEqual([['天气'], ['出行']]);
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
  expect(sample).toMatchObject({ category: null, difficulty: null, initial_state: {}, tags: [], notes: '',
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
