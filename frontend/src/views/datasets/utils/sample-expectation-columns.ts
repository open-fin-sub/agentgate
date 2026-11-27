import {
  conditionLabels,
  toolOccurrenceLabels,
  type Condition,
  type Expectation,
  type SerializedExpectation,
} from '../types';

const groupLabels = {
  expected_skill: '期望skill',
  required_tools: '必须工具',
  forbidden_tools: '禁止工具',
  final_state: '最终状态',
  tool_arguments: '工具参数',
  final_output: '最终输出',
  other_expectations: '其他期望',
} as const;

const ruleFields = {
  final_state: { path: 'state_path', method: 'state_method', value: 'state_value' },
  tool_arguments: {
    tool: 'tool_argument_tool',
    path: 'tool_argument_path',
    occurrence: 'tool_argument_occurrence',
    method: 'tool_argument_method',
    value: 'tool_argument_value',
  },
  final_output: { path: 'output_path', method: 'output_method', value: 'output_value' },
} as const;
const methodOperands = {
  equals: { expected: '期望值' },
  within_tolerance: { expected: '期望值', epsilon: '容差' },
  within_range: { minimum: '最小值', maximum: '最大值' },
  matches_pattern: { pattern: '正则表达式' },
  one_of: { allowed: '允许值' },
  must_be_missing: {},
  matches_json_schema: { json_schema: 'JSON Schema' },
} as const satisfies Record<Condition['kind'], Record<string, string>>;

function methodColumns(group: 'tool_arguments' | 'final_output') {
  const prefix = group === 'tool_arguments' ? 'tool_argument' : 'output';
  return (Object.keys(methodOperands) as Condition['kind'][]).flatMap((method) =>
    Object.entries(methodOperands[method]).map(([field, label]) => ({
      method,
      field,
      key: `${prefix}_${method}_${field}`,
      label: `${groupLabels[group]}_${conditionLabels[method]}_${label}`,
    })),
  );
}

const operandColumns = {
  final_state: [],
  tool_arguments: methodColumns('tool_arguments'),
  final_output: methodColumns('final_output'),
};
export const expectationColumnLabels = {
  expected_skill: groupLabels.expected_skill,
  required_tools: groupLabels.required_tools,
  forbidden_tools: groupLabels.forbidden_tools,
  state_path: '最终状态_字段路径',
  state_method: '最终状态_判定方式',
  state_value: '最终状态_期望值',
  tool_argument_tool: '工具参数_工具名',
  tool_argument_path: '工具参数_字段路径',
  tool_argument_occurrence: '工具参数_调用范围',
  tool_argument_method: '工具参数_判定方式',
  ...Object.fromEntries(operandColumns.tool_arguments.map(({ key, label }) => [key, label])),
  tool_argument_value: '工具参数_期望值',
  output_path: '最终输出_输出路径',
  output_method: '最终输出_判定方式',
  ...Object.fromEntries(operandColumns.final_output.map(({ key, label }) => [key, label])),
  output_value: '最终输出_期望值',
  other_expectations: groupLabels.other_expectations,
} as const;
type RuleGroup = keyof typeof ruleFields;
const ruleKinds = {
  final_state: 'state',
  tool_arguments: 'tool_argument',
  final_output: 'output',
} as const satisfies Record<RuleGroup, Expectation['kind']>;
type Column = keyof typeof groupLabels;
type Fields = Record<string, unknown>;
const columns = Object.keys(groupLabels) as Column[];
const labelToColumn = new Map<string, Column>(columns.map((c) => [groupLabels[c], c]));

function isRuleGroup(column: Column | undefined): column is RuleGroup {
  return column !== undefined && column in ruleFields;
}

export const expectationColumnGroups = new Map<string, Column>(
  columns.flatMap((group): [string, Column][] => {
    const keys = isRuleGroup(group)
      ? [...Object.values(ruleFields[group]), ...operandColumns[group].map(({ key }) => key)]
      : [group];
    return keys.map((key) => [key, group]);
  }),
);

function columnFor(check: SerializedExpectation): Column {
  switch (check.kind) {
    case 'skill_route':
      return 'expected_skill';
    case 'tool_call':
      return check.mode === 'required' ? 'required_tools' : 'forbidden_tools';
    case 'state':
      return 'final_state';
    case 'tool_argument':
      return 'tool_arguments';
    case 'output':
      return 'final_output';
    default:
      return 'other_expectations';
  }
}

function cellItem(check: SerializedExpectation): string | Fields {
  const { id: _id, name, kind, ...config } = check;
  const named = name == null ? {} : { name };
  if (check.kind === 'tool_call') return name == null ? check.tool : { name, tool: check.tool };
  if (
    check.kind === 'skill_route' &&
    name == null &&
    check.condition.kind === 'equals' &&
    typeof check.condition.expected === 'string' &&
    check.condition.expected.trim()
  ) {
    return check.condition.expected;
  }
  if (kind === 'policy' || kind === 'execution_path') return { kind, ...named, ...config };
  return { ...named, ...config };
}

function encodeCell(column: Column, items: (Fields | string)[]): string {
  if (!items.length) return '';
  const isTools = column === 'required_tools' || column === 'forbidden_tools';
  // Quote ambiguous names as JSON, including prefixes a spreadsheet could evaluate as a formula.
  const plainNames = items.every(
    (value) =>
      typeof value === 'string' &&
      value.length > 0 &&
      value === value.trim() &&
      !'[{=+-@'.includes(value[0]) &&
      !(isTools && /[,，\r\n]/.test(value)),
  );
  if (plainNames && (items.length === 1 || isTools)) return items.join(', ');
  if (items.length === 1 && typeof items[0] !== 'string') return JSON.stringify(items[0]);
  return JSON.stringify(items);
}

function operand(condition: Condition): unknown {
  switch (condition.kind) {
    case 'equals':
      return condition.expected;
    case 'matches_pattern':
      return condition.pattern;
    case 'one_of':
      return condition.allowed;
    case 'matches_json_schema':
      return condition.json_schema;
    case 'must_be_missing':
      return undefined;
    default: {
      const { kind: _kind, ...bounds } = condition;
      return bounds;
    }
  }
}

function singleCell(value: unknown): string | number {
  if (value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return JSON.stringify(value);
  // Quote text that could be interpreted as JSON, a spreadsheet formula or a number.
  if (
    !value ||
    value.trim() !== value ||
    /^[[{"=+@\-\t\r]/.test(value) ||
    /^(?:true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)$/.test(value)
  )
    return JSON.stringify(value);
  return value;
}

function ruleCells(group: RuleGroup, rules: Expectation[]): Record<string, string | number> {
  const fields = ruleFields[group];
  const cells: Record<string, string | number> = {};
  for (const [field, key] of Object.entries(fields)) {
    if (field === 'value' && group !== 'final_state') continue;
    const values = rules.map((rule) => {
      if (field === 'path') return rule.path ?? undefined;
      if (field === 'method') return conditionLabels[rule.condition.kind];
      if (field === 'value') return operand(rule.condition);
      if (rule.kind === 'tool_argument')
        return field === 'tool' ? rule.tool : toolOccurrenceLabels[rule.occurrence];
    });
    if (field === 'path' && values.every((value) => value === undefined)) cells[key] = '';
    else cells[key] = values.length > 1 ? JSON.stringify(values) : singleCell(values[0]);
  }
  for (const { method, field, key } of operandColumns[group]) {
    if (!rules.some(({ condition }) => condition.kind === method)) continue;
    const values = rules.map(({ condition }) => {
      if (condition.kind !== method) return undefined;
      const value = (condition as Fields)[field];
      if (method === 'within_tolerance' && field === 'epsilon') return value ?? 1e-6;
      if (method === 'within_range') return value ?? undefined;
      return value;
    });
    cells[key] = values.length > 1 ? JSON.stringify(values) : singleCell(values[0]);
  }
  return cells;
}

export function expectationCells(
  expectations: readonly SerializedExpectation[],
): Record<string, string | number> {
  const grouped = new Map<Column, (Fields | string)[]>();
  const order = expectations.map((check) => {
    const col = columnFor(check);
    if (!grouped.has(col)) grouped.set(col, []);
    grouped.get(col)!.push(cellItem(check));
    return col;
  });
  const result: Record<string, string | number> = {};
  const names: Record<string, (string | null)[]> = {};
  for (const col of columns) {
    const items = grouped.get(col);
    if (!items) continue;
    if (isRuleGroup(col)) {
      const rules = expectations.filter(
        (check): check is Expectation => check.kind === ruleKinds[col],
      );
      Object.assign(result, ruleCells(col, rules));
      if (rules.some((rule) => rule.name != null))
        names[groupLabels[col]] = rules.map((rule) => rule.name);
    } else result[col] = encodeCell(col, items);
  }
  // Custom evaluators can consume the original check sequence across columns.
  const needsOrder = order.some(
    (col, i) => i > 0 && columns.indexOf(order[i - 1]) > columns.indexOf(col),
  );
  if (needsOrder || Object.keys(names).length) {
    result.other_expectations = JSON.stringify({
      ...(needsOrder ? { 期望顺序: order.map((col) => groupLabels[col]) } : {}),
      ...(Object.keys(names).length ? { 检查名称: names } : {}),
      检查项: grouped.get('other_expectations') ?? [],
    });
  }
  return result;
}

function object(value: unknown): value is Fields {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fromCellItem(column: Column, value: unknown): Fields {
  if (typeof value === 'string' && value.trim()) {
    if (column === 'expected_skill')
      return { kind: 'skill_route', condition: { kind: 'equals', expected: value } };
    if (column === 'required_tools' || column === 'forbidden_tools')
      return {
        kind: 'tool_call',
        tool: value,
        mode: column === 'required_tools' ? 'required' : 'forbidden',
      };
  }
  if (!object(value)) throw Error('请填写名称或与本列对应的 JSON 配置对象');
  if (column === 'other_expectations') {
    if (value.kind !== 'execution_path' && value.kind !== 'policy')
      throw Error('其他期望仅支持 execution_path 和 policy 配置');
    return value;
  }
  const kinds = {
    expected_skill: 'skill_route',
    required_tools: 'tool_call',
    forbidden_tools: 'tool_call',
    ...ruleKinds,
  };
  const kind = kinds[column];
  if (value.kind != null && value.kind !== kind) throw Error('期望类型与列不一致');
  if (column === 'required_tools' || column === 'forbidden_tools') {
    const mode = column === 'required_tools' ? 'required' : 'forbidden';
    if (value.mode != null && value.mode !== mode) throw Error('工具模式与列不一致');
    return { ...value, kind, mode };
  }
  return { ...value, kind };
}

function decodeCell(column: Column, raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const text = raw.trim();
  if (!text) return [];
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      return JSON.parse(text);
    } catch {
      throw Error('JSON 格式有误，请检查引号、逗号和括号');
    }
  }
  if (column === 'required_tools' || column === 'forbidden_tools')
    return text
      .split(/[,，\r\n]+/)
      .map((name) => name.trim())
      .filter(Boolean);
  if (column === 'expected_skill') return text;
  throw Error('请填写 JSON 对象或对象数组');
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && (typeof value !== 'string' || !!value.trim());
}
function jsonValue(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw Error('JSON 格式有误，请检查引号、括号和逗号');
  }
}
function textField(value: unknown, vector: boolean): string {
  if (!vector && typeof value === 'string' && value.trim().startsWith('[')) {
    // An unquoted JSON array of paths or names indicates that the methods must also be an array.
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      /* literal path, e.g. [0].status */
    }
    if (Array.isArray(parsed)) throw Error('同类多项检查的判定方式也须填写等长的 JSON 数组');
  }
  const text =
    !vector && typeof value === 'string' && value.trim().startsWith('"') ? jsonValue(value) : value;
  if (typeof text !== 'string' || !text.trim()) throw Error('请填写非空文本');
  return text;
}
function enumCode<K extends string>(value: unknown, labels: Readonly<Record<K, string>>): K {
  const code = (Object.keys(labels) as K[]).find((k) => labels[k] === value || k === value);
  if (!code) throw Error('可填写：' + Object.values(labels).join('、'));
  return code;
}

function readOperand(kind: Condition['kind'], raw: unknown, vector: boolean): Fields {
  if (kind === 'must_be_missing') {
    if (raw !== undefined && raw !== null && (vector || raw !== ''))
      throw Error('「字段不存在」的期望值应留空，多项时使用 null 占位');
    return { kind };
  }
  if (raw === undefined || (!vector && raw === '')) throw Error('请填写该判定方式的期望值');
  let value: unknown = raw;
  if (!vector && typeof raw === 'string') {
    const text = raw.trim();
    if (kind === 'matches_pattern') value = text.startsWith('"') ? jsonValue(text) : raw;
    else if (kind === 'equals') {
      try {
        value = JSON.parse(raw);
      } catch {
        value = /^[[{"]/.test(text) ? jsonValue(text) : raw;
      }
    } else value = jsonValue(raw);
  }
  switch (kind) {
    case 'equals':
      return { kind, expected: value };
    case 'matches_pattern':
      if (typeof value !== 'string') throw Error('正则表达式须为文本');
      return { kind, pattern: value };
    case 'one_of':
      if (!Array.isArray(value) || !value.length) throw Error('允许值须为非空 JSON 数组');
      return { kind, allowed: value };
    case 'matches_json_schema':
      if (!object(value)) throw Error('JSON Schema 须为 JSON 对象');
      return { kind, json_schema: value };
    case 'within_tolerance':
    case 'within_range': {
      const fields = kind === 'within_tolerance' ? ['expected', 'epsilon'] : ['minimum', 'maximum'];
      if (!object(value) || Object.keys(value).some((key) => !fields.includes(key)))
        throw Error('请填写含 ' + fields.join('、') + ' 的 JSON 对象');
      return { ...value, kind };
    }
  }
}

function numericOperand(raw: unknown, vector: boolean, optional: boolean): number | null {
  if (!hasValue(raw)) {
    if (optional) return null;
    throw Error('请填写数值');
  }
  const value = !vector && typeof raw === 'string' ? Number(raw) : raw;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw Error('请填写有限数值');
  return value;
}

// The method cell selects scalar or parallel-array mode. An array-valued expected
// operand (for example a membership check) never determines the number of rules.
function readRuleCells(
  group: RuleGroup,
  row: Readonly<Fields>,
  onError: (key: string, message: string) => void,
  validate?: (check: Fields) => void,
): Fields[] {
  const fields = ruleFields[group];
  const operands = operandColumns[group];
  const rules: Fields[] = [];
  let column: string = fields.method;
  let ordinal = '';
  try {
    const methodCell = row[fields.method];
    const methods =
      typeof methodCell === 'string' && methodCell.trim().startsWith('[')
        ? jsonValue(methodCell)
        : methodCell;
    const vector = Array.isArray(methods);
    const methodList = vector ? methods : [methods];
    if (!methodList.length) throw Error('请填写至少一个判定方式');
    const cells = new Map<string, unknown[]>();
    const configuredOperand = operands.find(({ key }) => hasValue(row[key]));
    if (configuredOperand && hasValue(row[fields.value])) {
      column = configuredOperand.key;
      throw Error('同一轮不能同时填写通用期望值列与判定方式专属列');
    }
    // Older files may contain the generic value header even for operand-free checks.
    const generic = group === 'final_state' || (!configuredOperand && fields.value in row);
    for (const key of [...Object.values(fields), ...operands.map(({ key }) => key)]) {
      if (key === fields.method) continue;
      column = key;
      const raw = row[key];
      if (vector && hasValue(raw)) {
        const array = typeof raw === 'string' ? jsonValue(raw) : raw;
        if (!Array.isArray(array) || array.length !== methodList.length)
          throw Error('同类多项检查须填写与判定方式等长的 JSON 数组');
        cells.set(key, array);
      } else if (!vector) cells.set(key, [raw]);
    }
    for (const [i, method] of methodList.entries()) {
      ordinal = vector ? '第 ' + (i + 1) + ' 项：' : '';
      column = fields.method;
      const kind = enumCode(method, conditionLabels);
      column = fields.path;
      const rawPath = cells.get(column)?.[i];
      const path =
        group === 'final_output' && !hasValue(rawPath) ? null : textField(rawPath, vector);
      const check: Fields = { kind: ruleKinds[group], path };
      if (group === 'tool_arguments') {
        column = ruleFields.tool_arguments.tool;
        check.tool = textField(cells.get(column)?.[i], vector);
        column = ruleFields.tool_arguments.occurrence;
        const scope = cells.get(column)?.[i];
        check.occurrence = hasValue(scope) ? enumCode(scope, toolOccurrenceLabels) : 'last';
      }
      if (generic) {
        column = fields.value;
        check.condition = readOperand(kind, cells.get(column)?.[i], vector);
      } else {
        let condition: Fields = { kind };
        for (const { method, field, key } of operands) {
          const value = cells.get(key)?.[i];
          if (method !== kind) {
            if (vector ? value == null : !hasValue(value)) continue;
            column = key;
            throw Error('本列与该项判定方式不一致，非对应位置应留空或用 null 占位');
          }
          column = key;
          if (kind === 'within_tolerance' || kind === 'within_range') {
            const number = numericOperand(value, vector, kind === 'within_range');
            if (field === 'epsilon' && number !== null && number <= 0) throw Error('容差须大于 0');
            condition[field] = number;
          } else condition = readOperand(kind, value, vector);
        }
        check.condition = condition;
      }
      validate?.(check);
      rules.push(check);
    }
  } catch (error) {
    onError(column, ordinal + (error instanceof Error ? error.message : String(error)));
  }
  return rules;
}

export function readExpectationCells(
  row: Readonly<Record<string, unknown>>,
  onError: (column: string, message: string) => void,
  validate?: (check: Fields) => void,
): Fields[] {
  const grouped = new Map<Column, Fields[]>();
  let order: Column[] | undefined;
  let names: Fields | undefined;
  for (const column of columns) {
    const raw = row[column];
    if (isRuleGroup(column)) {
      const keys = [
        ...Object.values(ruleFields[column]),
        ...operandColumns[column].map(({ key }) => key),
      ];
      const splitKey = keys.find((key) => hasValue(row[key]));
      if (splitKey) {
        if (hasValue(raw))
          onError(splitKey, '同一轮不能同时填写「' + groupLabels[column] + '」整列及其拆分列');
        else grouped.set(column, readRuleCells(column, row, onError, validate));
        continue;
      }
    }
    if (raw == null || raw === '') continue;
    let value: unknown;
    try {
      value = decodeCell(column, raw);
      if (object(value) && ('期望顺序' in value || '检查名称' in value)) {
        if (!Array.isArray(value.检查项)) throw Error('检查项须为数组');
        if ('期望顺序' in value) {
          if (order) throw Error('同一轮只能指定一次期望顺序');
          if (!Array.isArray(value.期望顺序)) throw Error('期望顺序须为数组');
          order = value.期望顺序.map((label) => {
            const c = labelToColumn.get(label);
            if (!c) throw Error('期望顺序中存在未知列名');
            return c;
          });
        }
        if ('检查名称' in value) {
          if (column !== 'other_expectations' || !object(value.检查名称))
            throw Error('检查名称须在「其他期望」列填写');
          const entries = Object.entries(value.检查名称);
          if (
            entries.some(
              ([group, list]) =>
                !isRuleGroup(labelToColumn.get(group)) ||
                !Array.isArray(list) ||
                !list.every((item) => item === null || typeof item === 'string'),
            )
          )
            throw Error('检查名称须按检查类型填写名称数组');
          names = value.检查名称;
        }
        value = value.检查项;
      }
    } catch (error) {
      onError(column, error instanceof Error ? error.message : String(error));
      continue;
    }
    const items = Array.isArray(value) ? value : [value];
    const checks: Fields[] = [];
    items.forEach((item, i) => {
      try {
        const check = fromCellItem(column, item);
        validate?.(check);
        checks.push(check);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(column, items.length === 1 ? message : `第 ${i + 1} 项：${message}`);
      }
    });
    grouped.set(column, checks);
  }
  for (const [label, list] of Object.entries(names ?? {})) {
    const group = labelToColumn.get(label)!;
    grouped.get(group)?.forEach((rule, i) => {
      if (Array.isArray(list) && list[i] != null) rule.name = list[i];
    });
  }
  const result: Fields[] = [];
  const offsets = new Map<Column, number>();
  for (const col of order ?? []) {
    const offset = offsets.get(col) ?? 0;
    const check = grouped.get(col)?.[offset];
    if (check) {
      result.push(check);
      offsets.set(col, offset + 1);
    }
  }
  // Offline edits can add or remove checks after export.
  return result.concat(
    ...columns.map((col) => grouped.get(col)?.slice(offsets.get(col) ?? 0) ?? []),
  );
}
