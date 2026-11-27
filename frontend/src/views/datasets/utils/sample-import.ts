import { toEditorCase } from '../../../api/datasets';
import { sameJson } from '../../evaluation/utils/report-presentation';
import { caseCategoryLabels, caseDifficultyLabels } from '../types/index';
import type { EvaluationCase, JsonObject } from '../types/index';
import { expectationColumnLabels, readExpectationCells } from './sample-expectation-columns';
import { isVariableColumn, readVariableColumns, variableOrderHeader } from './sample-variable-columns';

export const sampleFileFormats = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
] as const;
export type SampleFileFormat = (typeof sampleFileFormats)[number]['value'];

// Older spreadsheets store each type of rule in one JSON column.
const importExpectationColumnLabels = {
  ...expectationColumnLabels,
  final_state: '最终状态',
  tool_arguments: '工具参数',
  final_output: '最终输出',
};
export const sampleColumnLabels: Record<string, string> = {
  case_id: '样本编号',
  case_name: '样本名称',
  category: '样本分类',
  difficulty: '难度',
  tags_json: '标签',
  case_notes: '样本备注',
  initial_state_json: '初始变量',
  turn_id: '轮次编号',
  turn_order: '轮次顺序',
  input_json: '输入内容',
  expectations_json: '期望结果',
  ...importExpectationColumnLabels,
  turn_notes: '轮次备注',
  turn_extensions_json: '轮次扩展',
};

export interface ImportIssue {
  location: string;
  sheet?: string;
  row?: number;
  column?: string;
  sampleName?: string;
  sampleKey?: string;
  turn?: number;
  field: string;
  path?: string;
  message: string;
}
export const MAX_IMPORT_ISSUES = 200;
export class SampleImportError extends Error {
  readonly name = 'SampleImportError';
  constructor(
    message: string,
    readonly issues: ImportIssue[] = [],
    readonly totalIssues = issues.length,
    readonly sampleCount = 0,
    readonly fileLevel = !issues.length,
  ) {
    super(message);
  }
}

interface Source {
  path: string;
  sampleKey: string;
  sampleName?: string;
  turn?: number;
  sheet?: string;
  row?: number;
  columns?: Record<string, string>;
  invalid: Set<string>;
}
interface CaseSource {
  sample: Source;
  turns: Source[];
}
const fieldNames: Record<string, string> = {
  name: '样本名称',
  category: '样本分类',
  difficulty: '难度',
  tags: '标签',
  initial_state: sampleColumnLabels.initial_state_json,
  turns: '轮次',
  turn_order: '轮次顺序',
  input: '输入内容',
  expectations: '期望结果',
  case_id: '样本编号',
  case_notes: '样本备注',
  turn_id: '轮次编号',
  turn_notes: '轮次备注',
  extensions: '轮次扩展',
  expected: '预期输出',
  ...importExpectationColumnLabels,
};
const fieldColumns: Record<string, string> = {
  name: 'case_name',
  tags: 'tags_json',
  initial_state: 'initial_state_json',
  input: 'input_json',
  expectations: 'expectations_json',
  turns: 'turn_order',
  extensions: 'turn_extensions_json',
};
function diagnostics() {
  const issues: ImportIssue[] = [];
  const samples = new Set<string>();
  let totalIssues = 0;
  return {
    add(source: Source, field: string, message: string, suffix = field) {
      totalIssues++;
      samples.add(source.sampleKey);
      const column = source.columns?.[fieldColumns[field] ?? field];
      const path = source.path + (suffix ? '.' + suffix : '');
      const location = source.sheet
        ? column
          ? source.sheet + '!' + column + source.row
          : source.sheet + ' 第 ' + source.row + ' 行'
        : source.row
          ? 'CSV 第 ' + source.row + ' 行'
          : path;
      issues.push({
        location,
        sheet: source.sheet,
        row: source.row,
        column,
        sampleName: source.sampleName,
        sampleKey: source.sampleKey,
        turn: source.turn,
        field: fieldNames[field] ?? field,
        path,
        message,
      });
      issues.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
      if (issues.length > MAX_IMPORT_ISSUES) issues.pop();
    },
    finish() {
      if (totalIssues)
        throw new SampleImportError(
          '发现 ' + totalIssues + ' 处错误：' + issues[0].message,
          issues,
          totalIssues,
          samples.size,
          false,
        );
    },
  };
}
type Diagnostics = ReturnType<typeof diagnostics>;
function fileError(message: string): never {
  throw new SampleImportError(message);
}
function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function blankSample(name = '新样本'): EvaluationCase {
  return {
    id: crypto.randomUUID(),
    name,
    category: null,
    difficulty: null,
    tags: [],
    notes: '',
    initial_state: {},
    turns: [
      {
        id: crypto.randomUUID(),
        input: { query: '' },
        expected_skill: null,
        expectations: [],
        required_tools: [],
        forbidden_tools: [],
        policy_rules: [],
        notes: '',
      },
    ],
  };
}
function object(v: unknown): v is JsonObject {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function json(value: unknown, fallback: unknown) {
  return value == null || value === ''
    ? fallback
    : typeof value === 'string'
      ? JSON.parse(value)
      : value;
}
function validateExpectation(e: any) {
  const nonempty = (v: unknown) => typeof v === 'string' && !!v.trim();
  if (e.name != null && !nonempty(e.name)) throw Error('测评项名称须为非空文本');
  if (e.kind === 'execution_path') {
    if (
      !['workflow', 'tool', 'skill'].includes(e.scope) ||
      !Array.isArray(e.expected) ||
      e.expected.some((v: unknown) => !nonempty(v))
    )
      throw Error('执行路径期望格式错误');
    if (e.scope !== 'tool' && !e.expected.length) throw Error('执行路径不能为空');
    if (e.scope === 'skill') {
      if (
        e.expected.length !== 1 ||
        !Array.isArray(e.allowed_tools) ||
        e.allowed_tools.some((v: unknown) => !nonempty(v))
      )
        throw Error('Skill 检查需要单个技能和允许工具列表');
    } else if (e.allowed_tools != null) throw Error('只有 Skill 检查支持允许工具列表');
    return;
  }
  if (e.kind === 'tool_call') {
    if (!nonempty(e.tool) || !['required', 'forbidden'].includes(e.mode === undefined ? 'required' : e.mode))
      throw Error('工具期望缺少 tool 或 mode');
    return;
  }
  if (e.kind === 'policy') {
    if (!nonempty(e.policy_id)) throw Error('策略期望缺少 policy_id');
    return;
  }
  if (e.kind === 'state' && !nonempty(e.path)) throw Error('状态期望缺少 path');
  if (e.kind === 'output' && e.path != null && !nonempty(e.path))
    throw Error('输出路径须为非空文本，也可留空以检查完整输出');
  if (
    e.kind === 'tool_argument' &&
    (!nonempty(e.tool) ||
      !nonempty(e.path) ||
      !['first', 'last', 'any', 'all'].includes(e.occurrence === undefined ? 'last' : e.occurrence))
  )
    throw Error('工具参数期望格式错误');
  const c = e.condition;
  if (!object(c)) throw Error('期望缺少 condition');
  const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  const epsilon = c.epsilon === undefined ? 1e-6 : c.epsilon;
  const minimum = c.minimum ?? null;
  const maximum = c.maximum ?? null;
  const valid =
    c.kind === 'equals'
      ? 'expected' in c
      : c.kind === 'must_be_missing'
        ? true
        : c.kind === 'within_tolerance'
          ? finite(c.expected) && typeof epsilon === 'number' && finite(epsilon) && epsilon > 0
          : c.kind === 'within_range'
            ? (minimum === null || finite(minimum)) &&
              (maximum === null || finite(maximum)) &&
              (minimum !== null || maximum !== null) &&
              (typeof minimum !== 'number' || typeof maximum !== 'number' || minimum <= maximum)
            : c.kind === 'matches_pattern'
              ? typeof c.pattern === 'string'
              : c.kind === 'one_of'
                ? Array.isArray(c.allowed) && c.allowed.length > 0
                : c.kind === 'matches_json_schema'
                  ? object(c.json_schema)
                  : false;
  if (!valid) throw Error('期望 condition 格式错误');
}
function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}
// Keep the three name columns distinct for the existing per-row priority.
const sampleNameHeaders = ['case_name', 'name', sampleColumnLabels.case_name];
const tableColumnKeys = new Map(
  Object.entries(sampleColumnLabels)
    .filter(([key]) => key !== 'case_name')
    .map(([key, label]) => [label, key]),
);
tableColumnKeys.set('初始状态', 'initial_state_json');
function tableHeaderKey(header: string) {
  const trimmed = header.trim();
  if (isVariableColumn(trimmed)) return trimmed.replace(/｜(?:选填|必填|可选)$/, '');
  // CSV templates put their field instructions after a fullwidth separator.
  const label = trimmed.split('｜', 1)[0].trim();
  if (label === sampleColumnLabels.case_name) return label;
  return tableColumnKeys.get(label) ?? trimmed;
}
function sampleNameHeader(values: Record<string, unknown>) {
  return sampleNameHeaders.find((header) => values[header] != null) ?? 'case_name';
}
function columnsFor(headers: string[]) {
  const columns: Record<string, string> = Object.create(null);
  headers.forEach((header, i) => {
    const key = header.trim();
    if (Object.prototype.hasOwnProperty.call(columns, key))
      fileError('表头重复：' + (sampleColumnLabels[key] ?? header));
    columns[key] = columnName(i);
  });
  if (!columns.input_json && columns.query) columns.input_json = columns.query;
  return columns;
}
interface TableRow {
  values: Record<string, unknown>;
  source: Source;
  formulas?: { field: string; column: string }[];
}
function csvRows(
  text: string,
  report: Diagnostics,
  headerNames: 'original' | 'dataset' = 'original',
): TableRow[] {
  const records: { values: string[]; line: number }[] = [];
  let row: string[] = [],
    field = '',
    quoted = false,
    closed = false,
    line = 1,
    start = 1;
  text = text.replace(/^\uFEFF/, '');
  function endRow() {
    row.push(field);
    if (row.some((value) => value !== '')) records.push({ values: row, line: start });
    row = [];
    field = '';
    closed = false;
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        field += c;
        if (c === '\n' || (c === '\r' && text[i + 1] !== '\n')) line++;
      }
    } else if (c === ',' || c === '\n' || c === '\r') {
      if (c === ',') {
        row.push(field);
        field = '';
        closed = false;
      } else {
        endRow();
        if (c === '\r' && text[i + 1] === '\n') i++;
        line++;
        start = line;
      }
    } else if (c === '"') {
      if (field || closed) fileError('CSV 第 ' + line + ' 行引号位置错误');
      quoted = true;
    } else {
      if (closed) fileError('CSV 第 ' + line + ' 行结束引号后存在非法字符');
      field += c;
    }
  }
  if (quoted) fileError('CSV 第 ' + start + ' 行存在未闭合引号');
  endRow();
  const headers = records.shift()?.values.map((value) => value.trim()) ?? [];
  if (
    !headers.length ||
    headers.some((value) => !value) ||
    new Set(headers).size !== headers.length
  )
    fileError('CSV 表头为空或重复');
  const keys = headerNames === 'dataset' ? headers.map(tableHeaderKey) : headers;
  const columns = columnsFor(keys);
  if (records.length > 2000) fileError('请选择 1—2000 行样本');
  const result: TableRow[] = [];
  records.forEach((record, i) => {
    const values = Object.fromEntries(keys.map((key, j) => [key, record.values[j]]));
    const sampleName = String(values[sampleNameHeader(values)] ?? '').trim();
    const source: Source = {
      path: 'records[' + i + ']',
      row: record.line,
      columns,
      sampleName: sampleName || undefined,
      sampleKey: sampleName && values.turn_order?.trim() ? 'name:' + sampleName : 'row:' + record.line,
      invalid: new Set(),
    };
    if (record.values.length !== headers.length) {
      report.add(
        source,
        '整行',
        '列数与表头不匹配：应为 ' + headers.length + ' 列，实际为 ' + record.values.length + ' 列',
        '',
      );
    } else result.push({ values, source });
  });
  return result;
}
export function parseCsv(text: string): Record<string, string>[] {
  const report = diagnostics();
  const rows = csvRows(text, report);
  report.finish();
  return rows.map((row) => row.values as Record<string, string>);
}
function readJson(
  value: unknown,
  fallback: unknown,
  field: string,
  source: Source,
  report: Diagnostics,
) {
  if (source.invalid.has(field)) return fallback;
  try {
    return json(value, fallback);
  } catch {
    source.invalid.add(field);
    report.add(source, field, 'JSON 格式错误，请使用双引号并检查括号、逗号是否完整');
    return fallback;
  }
}
function readTurnOrder(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  if (value == null) return fallback;
  if (typeof value !== 'string') return NaN;
  const text = value.trim();
  if (!text) return fallback;
  return /^\d+$/.test(text) ? Number(text) : NaN;
}
const splitExpectationKeys = Object.keys(importExpectationColumnLabels);
function filled(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}
function tableExpectations(row: Record<string, unknown>, source: Source, report: Diagnostics) {
  const splitKey = splitExpectationKeys.find((key) => {
    const value = row[key];
    return (typeof value === 'string' ? !!value.trim() : filled(value)) && !source.invalid.has(key);
  });
  if (splitKey) {
    if (filled(row.expectations_json) || filled(row.expected)) {
      report.add(source, splitKey, '同一轮不能同时填写旧版期望结果与拆分后的期望列');
      return [];
    }
    return readExpectationCells(row, (key, message) => {
      if (!source.invalid.has(key)) report.add(source, key, message);
    }, validateExpectation);
  }
  const expectations = readJson(row.expectations_json, [], 'expectations', source, report);
  if (Array.isArray(expectations) && filled(row.expected))
    expectations.push({
      id: crypto.randomUUID(),
      name: '人工期望输出',
      kind: 'output',
      path: null,
      condition: { kind: 'equals', expected: String(row.expected) },
    });
  return expectations;
}

type InitialCells = Map<string, { value: unknown; source: Source }>;
function comparableCell(value: unknown) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function collectInitialCells(cells: InitialCells, row: Record<string, unknown>, source: Source, report: Diagnostics) {
  for (const [key, value] of Object.entries(row)) {
    const initialField = key === 'initial_state_json' || key === variableOrderHeader || isVariableColumn(key);
    if (!initialField || !filled(value)) continue;
    const field = key === 'initial_state_json' ? 'initial_state' : key;
    if (source.invalid.has(field)) continue;
    const previous = cells.get(key);
    if (!previous) cells.set(key, { value, source });
    else if (value !== previous.value && !sameJson(comparableCell(value), comparableCell(previous.value))) {
      const label = key === variableOrderHeader ? variableOrderHeader : '初始变量值';
      report.add(source, field, `同一样本各轮的${label}须一致，与第 ${previous.source.row} 行冲突`);
    }
  }
}
function tableInitialState(cells: InitialCells, report: Diagnostics) {
  const legacy = cells.get('initial_state_json');
  if (legacy) {
    cells.delete('initial_state_json');
    if (cells.size) {
      const [key, firstSplit] = cells.entries().next().value!;
      if (Number(legacy.source.row) > Number(firstSplit.source.row))
        report.add(legacy.source, 'initial_state', '同一样本不能同时填写旧版初始变量与拆分变量列');
      else report.add(firstSplit.source, key, '同一样本不能同时填写旧版初始变量与拆分变量列');
    }
    const value = readJson(legacy.value, {}, 'initial_state', legacy.source, report);
    if (object(value)) return value;
    report.add(legacy.source, 'initial_state', '初始变量必须是 JSON 对象');
    return {};
  }
  const order = cells.get(variableOrderHeader);
  // Values may have been entered on later turns. New variable names follow the file's column order.
  const headers = order ? new Set([...Object.keys(order.source.columns ?? {}), ...cells.keys()]) : cells.keys();
  const row: Record<string, unknown> = Object.create(null);
  for (const key of headers) {
    const cell = cells.get(key);
    if (cell) row[key] = cell.value;
  }
  return readVariableColumns(row, (key, message) => report.add(cells.get(key)!.source, key, message));
}
function tableSamples(
  rows: TableRow[],
  report: Diagnostics,
  draftNames?: ReadonlySet<string>,
): EvaluationCase[] {
  if (rows.length > 2000) fileError('请选择 1—2000 行样本');
  if (!rows.length) {
    report.finish();
    fileError('请选择 1—2000 行样本');
  }
  const legacyCounts = new Map<string, number>();
  for (const { values, source } of rows) {
    const id = String(values.case_id ?? '').trim();
    if (id && !source.invalid.has('case_id')) legacyCounts.set(id, (legacyCounts.get(id) ?? 0) + 1);
  }
  const legacyNames = new Map<string, { name: string; source: Source }>();
  const groups = new Map<string, {
    value: any;
    source: CaseSource;
    legacyId: string;
    orders: Map<number, Source>;
    initialCells: InitialCells;
  }>();
  rows.forEach(({ values: r, source, formulas = [] }) => {
    const nameHeader = sampleNameHeader(r);
    const name = String(r[nameHeader] ?? '').trim();
    if (nameHeader !== 'case_name' && source.columns)
      source.columns = { ...source.columns, case_name: source.columns[nameHeader] };
    source.sampleName = name || undefined;
    const legacyId = source.invalid.has('case_id') ? '' : String(r.case_id ?? '').trim();
    const orderText = source.invalid.has('turn_order') ? '' : String(r.turn_order ?? '').trim();
    const named = !!name && !source.invalid.has('name');
    // Old files could group unnumbered rows with a repeated sample ID.
    const groupByName = named && (orderText !== '' || (legacyCounts.get(legacyId) ?? 0) > 1);
    const key = groupByName ? 'name:' + name : source.sampleKey;
    source.sampleKey = key;
    if (named && legacyId) {
      const previous = legacyNames.get(legacyId);
      if (previous && previous.name !== name) {
        report.add(
          { ...source, sampleKey: previous.source.sampleKey },
          'name',
          `样本名称与第 ${previous.source.row} 行冲突，同一样本编号必须使用相同名称`,
        );
        source.invalid.add('name');
      } else if (!previous) legacyNames.set(legacyId, { name, source });
    }
    let group = groups.get(key);
    if (!group) {
      // Exported rows carry a sample ID. Import templates omit it and supply enum defaults.
      const preserveEmptyEnums = !!legacyId && !('turn_id' in r);
      source.path = 'cases[' + groups.size + ']';
      group = {
        value: {
          ...blankSample(name),
          category: preserveEmptyEnums && !filled(r.category) ? null : r.category,
          difficulty: preserveEmptyEnums && !filled(r.difficulty) ? null : r.difficulty,
          tags: readJson(r.tags_json, [], 'tags', source, report),
          notes: String(r.case_notes ?? ''),
          turns: [],
        },
        source: { sample: source, turns: [] },
        legacyId,
        orders: new Map(),
        initialCells: new Map(),
      };
      groups.set(key, group);
    } else if (legacyId) {
      if (group.legacyId && group.legacyId !== legacyId)
        report.add(source, 'name', '样本名称与其他样本编号冲突，请为不同样本使用不同名称');
      else group.legacyId = legacyId;
    }
    const c = group.value;
    const order = readTurnOrder(orderText, c.turns.length + 1);
    const validOrder = Number.isSafeInteger(order) && order > 0;
    const turnSource: Source = {
      ...source,
      path: group.source.sample.path + '.turns[' + c.turns.length + ']',
      turn: validOrder ? order : c.turns.length + 1,
    };
    collectInitialCells(group.initialCells, r, turnSource, report);
    formulas.forEach(({ field, column }) =>
      report.add(
        {
          ...turnSource,
          columns: { ...turnSource.columns, [fieldColumns[field] ?? field]: column },
        },
        field,
        '请将公式转换为值后导入',
      ),
    );
    if (!source.invalid.has('turn_order')) {
      const previous = group.orders.get(order);
      if (!validOrder) report.add(turnSource, 'turn_order', '轮次顺序必须为正整数');
      else if (previous) report.add(turnSource, 'turn_order', `轮次顺序 ${order} 与第 ${previous.row} 行重复`);
      else group.orders.set(order, turnSource);
    }
    const input = readJson(
      r.input_json,
      String(r.query ?? '').trim() ? { query: String(r.query) } : null,
      'input',
      turnSource,
      report,
    );
    c.turns.push({
      id: String(r.turn_id || crypto.randomUUID()),
      input,
      expectations: tableExpectations(r, turnSource, report),
      notes: String(r.turn_notes ?? ''),
      extensions: readJson(r.turn_extensions_json, undefined, 'extensions', turnSource, report),
      _order: order,
      _source: turnSource,
    });
  });
  const values: unknown[] = [],
    sources: CaseSource[] = [];
  for (const group of groups.values()) {
    group.value.initial_state = tableInitialState(group.initialCells, report);
    if (group.value.turns.length === 1 && group.orders.size === 1) {
      const [turn] = group.value.turns;
      if (turn._order !== 1 && turn._source.sampleName && !turn._source.invalid.has('name'))
        report.add(turn._source, 'turn_order', '单轮样本的轮次顺序必须为 1');
    }
    group.value.turns.sort((a: any, b: any) => a._order - b._order);
    group.source.turns = group.value.turns.map((turn: any) => turn._source);
    group.value.turns = group.value.turns.map(({ _order, _source, ...turn }: any) => turn);
    values.push(group.value);
    sources.push(group.source);
  }
  return normalizedCases(values, report, sources, 'cases', draftNames);
}
export function rowsToSamples(rows: Record<string, unknown>[]): EvaluationCase[] {
  const report = diagnostics();
  return tableSamples(
    rows.map((row, i) => {
      const values = Object.fromEntries(
        Object.entries(row).map(([header, value]) => [tableHeaderKey(header), value]),
      );
      return {
        values,
        source: {
          path: 'records[' + i + ']',
          sampleKey: 'row:' + (i + 2),
          row: i + 2,
          columns: columnsFor(Object.keys(row).map(tableHeaderKey)),
          invalid: new Set(),
        },
      };
    }),
    report,
  );
}
function readEnum(value: unknown, labels: Record<string, string>, fallback: string): unknown {
  if (value === undefined || (typeof value === 'string' && !value.trim())) return fallback;
  if (typeof value !== 'string') return value;
  const text = value.trim();
  return Object.entries(labels).find(([, label]) => label === text)?.[0] ?? text;
}
function orderedTurnIndices(turns: unknown[], source: Source, report: Diagnostics): number[] {
  const indices = turns.map((_, index) => index);
  if (!turns.some((turn) => object(turn) && turn.turn_order !== undefined)) return indices;
  const seen = new Set<number>();
  const orders = turns.map((turn, index) => {
    const order = readTurnOrder(object(turn) ? turn.turn_order : undefined, index + 1);
    const location = { ...source, path: source.path + '.turns[' + index + ']', turn: index + 1 };
    if (!Number.isSafeInteger(order) || order < 1)
      report.add(location, 'turn_order', '轮次顺序必须为正整数');
    else if (turns.length === 1 && order !== 1)
      report.add(location, 'turn_order', '单轮样本的轮次顺序必须为 1');
    else if (seen.has(order)) report.add(location, 'turn_order', `轮次顺序 ${order} 重复`);
    seen.add(order);
    return order;
  });
  return indices.sort((left, right) => orders[left] - orders[right]);
}
function normalizedCases(
  value: unknown,
  report: Diagnostics,
  sources?: CaseSource[],
  prefix = 'cases',
  draftNames?: ReadonlySet<string>,
): EvaluationCase[] {
  if (!Array.isArray(value) || !value.length || value.length > 1000)
    fileError('样本必须是包含 1—1000 项的数组');
  const cases: any[] = [];
  const names = new Map<string, Source>();
  value.forEach((raw, i) => {
    const source = sources?.[i]?.sample ?? {
      path: prefix + '[' + i + ']',
      sampleKey: 'case:' + i,
      sampleName: object(raw) && typeof raw.name === 'string' ? raw.name : undefined,
      invalid: new Set<string>(),
    };
    if (!object(raw)) {
      report.add(source, '样本', '样本必须是 JSON 对象', '');
      return;
    }
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!source.invalid.has('name')) {
      if (!name) report.add(source, 'name', '缺少样本名称，请填写非空名称');
      else {
        const first = names.get(name);
        if (first) {
          const location = first.row === undefined ? first.path : `第 ${first.row} 行`;
          report.add(source, 'name', `样本名称与${location}重复，请为不同样本使用不同名称`);
        } else if (draftNames?.has(name)) {
          report.add(source, 'name', draftSampleNameConflict(name));
        }
        if (!first) names.set(name, source);
      }
    }
    const c = {
      id: crypto.randomUUID(),
      name,
      category: readEnum(raw.category, caseCategoryLabels, 'positive'),
      difficulty: readEnum(raw.difficulty, caseDifficultyLabels, 'medium'),
      initial_state: raw.initial_state === undefined ? {} : raw.initial_state,
      tags: raw.tags === undefined ? [] : raw.tags,
      notes: raw.notes ?? '',
      turns: [] as unknown[],
    };
    if (
      !source.invalid.has('category') &&
      c.category !== null &&
      (typeof c.category !== 'string' || !Object.keys(caseCategoryLabels).includes(c.category))
    )
      report.add(source, 'category', '样本分类须为正例、负例或边界');
    if (!source.invalid.has('difficulty') && c.difficulty !== null &&
        (typeof c.difficulty !== 'string' || !Object.keys(caseDifficultyLabels).includes(c.difficulty)))
      report.add(source, 'difficulty', '难度须为简单、中等或困难');
    if (!source.invalid.has('initial_state') && !object(c.initial_state))
      report.add(source, 'initial_state', '初始变量必须是 JSON 对象');
    if (
      !source.invalid.has('tags') &&
      (!Array.isArray(c.tags) ||
        c.tags.some((tag: unknown) => typeof tag !== 'string' || !tag.trim()) ||
        new Set(c.tags).size !== c.tags.length)
    )
      report.add(source, 'tags', '标签必须是由非空且不重复的字符串组成的 JSON 数组');
    if (typeof c.notes !== 'string') report.add(source, 'case_notes', '样本备注必须是文本');
    if (!Array.isArray(raw.turns) || !raw.turns.length) {
      report.add(source, 'turns', '缺少轮次，请至少填写一轮对话');
      return;
    }
    const turns = raw.turns;
    c.turns = orderedTurnIndices(turns, source, report).map((j) => {
      const turn = turns[j];
      const turnSource = sources?.[i]?.turns[j] ?? {
        ...source,
        path: source.path + '.turns[' + j + ']',
        turn: j + 1,
        invalid: new Set<string>(),
      };
      if (!object(turn)) {
        report.add(turnSource, '轮次', '轮次必须是 JSON 对象', '');
        return turn;
      }
      if (!turnSource.invalid.has('input') && (!object(turn.input) || !Object.keys(turn.input).length))
        report.add(turnSource, 'input', '输入内容必须是非空 JSON 对象，请填写 input_json 或 query');
      if (turn.notes != null && typeof turn.notes !== 'string')
        report.add(turnSource, 'turn_notes', '轮次备注必须是文本', 'notes');
      let extensions: { key: string; value: string }[] | undefined;
      if (turn.extensions !== undefined && !turnSource.invalid.has('extensions')) {
        const entries = turn.extensions;
        if (!Array.isArray(entries) || !entries.every(
          (entry): entry is { key: string; value: string } =>
            object(entry) && typeof entry.key === 'string' && !!entry.key.trim() && typeof entry.value === 'string',
        ) || new Set(entries.map((entry) => entry.key)).size !== entries.length) {
          report.add(turnSource, 'extensions', '轮次扩展必须是包含非空且唯一的 key 和文本 value 的 JSON 数组');
        } else if (entries.length) {
          extensions = entries.map(({ key, value }) => ({ key, value }));
        }
      }
      const expectations = turn.expectations === undefined ? [] : turn.expectations;
      if (!turnSource.invalid.has('expectations')) {
        if (!Array.isArray(expectations))
          report.add(turnSource, 'expectations', '期望结果必须是 JSON 数组');
        else
          expectations.forEach((expectation: any, k: number) => {
            const path = 'expectations[' + k + ']';
            const allowed = [
              'output',
              'state',
              'tool_argument',
              'tool_call',
              'skill_route',
              'policy',
              'execution_path',
            ];
            if (!object(expectation) || !allowed.includes(String(expectation.kind)))
              report.add(turnSource, 'expectations', '存在未知期望类型，请参考模板填写 kind', path);
            else
              try {
                validateExpectation(expectation);
              } catch (error) {
                report.add(turnSource, 'expectations', messageOf(error), path);
              }
          });
      }
      return {
        id: crypto.randomUUID(),
        input: turn.input,
        expectations: Array.isArray(expectations)
          ? expectations.map((expectation: any) => ({
              ...expectation,
              id: crypto.randomUUID(),
              name: expectation?.name ?? null,
              ...(expectation?.kind === 'output' ? { path: expectation.path ?? null } : {}),
              ...(expectation?.kind === 'tool_call' ? { mode: expectation.mode ?? 'required' } : {}),
              ...(expectation?.kind === 'tool_argument' ? { occurrence: expectation.occurrence ?? 'last' } : {}),
            }))
          : [],
        notes: turn.notes ?? '',
        ...(extensions ? { extensions } : {}),
      };
    });
    cases.push(c);
  });
  report.finish();
  return cases.map(toEditorCase);
}
export function normalizeCases(value: unknown): EvaluationCase[] {
  return normalizedCases(value, diagnostics());
}
export function draftSampleNameConflict(name: string) {
  return `草稿已存在同名样本“${name}”，请使用不同的样本名称`;
}
export async function parseSampleFile(
  file: { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  draftNames?: ReadonlySet<string>,
): Promise<EvaluationCase[]> {
  if (file.size > 10 * 1024 * 1024) fileError('文件不能超过10MB');
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/\.json$/i.test(file.name)) {
      const value = JSON.parse(new TextDecoder().decode(bytes));
      const version = object(value) && object(value.version) ? value.version : undefined;
      const prefix = Array.isArray(value)
        ? ''
        : version?.cases != null
          ? 'version.cases'
          : 'cases';
      return normalizedCases(
        Array.isArray(value) ? value : (version?.cases ?? value?.cases),
        diagnostics(),
        undefined,
        prefix,
        draftNames,
      );
    }
    if (/\.csv$/i.test(file.name)) {
      const report = diagnostics();
      return tableSamples(
        csvRows(new TextDecoder('utf-8', { fatal: true }).decode(bytes), report, 'dataset'),
        report,
        draftNames,
      );
    }
    if (/\.xlsx$/i.test(file.name)) {
      const { unzipSync } = await import('fflate');
      let expanded = 0,
        entries = 0;
      unzipSync(bytes, {
        filter(entry) {
          expanded += entry.originalSize;
          if (++entries > 1000 || expanded > 40 * 1024 * 1024)
            fileError('Excel 解压大小或文件数量超限');
          return false;
        },
      });
      const ExcelJS = await import('exceljs');
      const book = new ExcelJS.default.Workbook();
      await book.xlsx.load(bytes as any);
      const sheet = book.getWorksheet('Cases') ?? book.worksheets[0];
      if (!sheet || sheet.rowCount > 2001) fileError('Excel 为空或超过2000行');
      const headers: string[] = [];
      sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, index) => {
        headers[index - 1] = cell.text;
      });
      if (!headers.length || new Set(headers).size !== headers.length)
        fileError('Excel 表头为空或重复');
      const keys = headers.map(tableHeaderKey);
      const columns = columnsFor(keys),
        report = diagnostics(),
        rows: TableRow[] = [];
      sheet.eachRow((row, number) => {
        if (number === 1) return;
        const values: Record<string, unknown> = Object.create(null);
        const source: Source = {
          path: 'records[' + rows.length + ']',
          sampleKey: 'row:' + number,
          sheet: sheet.name,
          row: number,
          columns,
          invalid: new Set(),
        };
        keys.forEach((key, j) => {
          values[key] = row.getCell(j + 1).text;
        });
        const nameHeader = sampleNameHeader(values);
        const formulas: { field: string; column: string }[] = [];
        keys.forEach((key, j) => {
          if (!row.getCell(j + 1).formula) return;
          let field = Object.keys(fieldColumns).find((name) => fieldColumns[name] === key) ?? key;
          if (key === 'query') field = 'input';
          if (sampleNameHeaders.includes(key)) field = 'name';
          formulas.push({ field, column: columnName(j) });
          if (field === 'name' && key !== nameHeader) return;
          if (key !== 'query' || !values.input_json) source.invalid.add(field);
        });
        rows.push({ values, source, formulas });
      });
      return tableSamples(rows, report, draftNames);
    }
    fileError('仅支持 Excel (.xlsx)、JSON、CSV');
  } catch (error) {
    if (error instanceof SampleImportError) throw error;
    const prefix = /\.json$/i.test(file.name)
      ? 'JSON 文件格式错误'
      : /\.xlsx$/i.test(file.name)
        ? 'Excel 文件无法读取'
        : '文件无法读取';
    fileError(prefix + '：' + messageOf(error));
  }
}
