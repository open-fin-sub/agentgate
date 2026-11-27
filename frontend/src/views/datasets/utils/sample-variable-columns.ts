import type { JsonObject, JsonValue } from '../types/index';

const prefix = '初始变量_';
export const variableOrderHeader = '初始变量顺序';
const sourceSuffixes = {
  config_variables: '',
  prompt_variables: '基础编排',
  tool_variables: '工具变量',
  root: '顶层',
} as const;
type Source = keyof typeof sourceSuffixes;
type VariableGroup = Exclude<Source, 'root'>;
const suffixedSources = new Map(
  (Object.keys(sourceSuffixes) as Source[])
    .filter((source) => sourceSuffixes[source])
    .map((source) => [sourceSuffixes[source] as string, source]),
);
const typeLabels: Record<string, string> = {
  str: '字符串',
  image: '图片',
  doc: '文档',
  audio: '音频',
};
const typeCodes = Object.fromEntries(
  Object.entries(typeLabels).map(([code, label]) => [label, code]),
);
const unspecified = '未指定';

function own(object: object, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}
function record(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function group(key: string): key is VariableGroup {
  return key !== 'root' && own(sourceSuffixes, key);
}
function namedVariable(value: JsonValue): value is JsonObject & { name: string } {
  return (
    record(value) && typeof value.name === 'string' && !!value.name.trim() && own(value, 'value')
  );
}

// Keep ordinary names readable. Protect separators, template annotations and significant whitespace.
function escapePart(text: string, escapeUnderscores = false): string {
  return text.replace(/[%｜\r\n\t]|^\s+|\s+$|_/gu, (s) =>
    s === '_' ? (escapeUnderscores ? '%5F' : s) : encodeURIComponent(s),
  );
}
function typeLabel(type: JsonValue | undefined): string {
  if (typeof type !== 'string') return unspecified;
  if (own(typeLabels, type)) return typeLabels[type];
  return (own(typeCodes, type) || type === unspecified || type.startsWith('=') ? '=' : '') + type;
}
function typeCode(label: string): string | undefined {
  if (label === unspecified) return undefined;
  if (label.startsWith('=')) return label.slice(1);
  return own(typeCodes, label) ? typeCodes[label] : label;
}

function variableHeader(name: string, source: Source, attributes: JsonObject): string {
  const { type, required, ...other } = attributes;
  const dataType = typeof type !== 'string' && typeof other.data_type === 'string';
  const label = typeLabel(dataType ? other.data_type : type);
  const requiredLabel =
    typeof required === 'boolean' ? (required ? '必填' : '非必填') : unspecified;
  let header = prefix + escapePart(name) + '_' + escapePart(label, true) + '_' + requiredLabel;
  const suffix = sourceSuffixes[source];
  if (suffix) header += '_' + suffix;
  if (dataType) {
    delete other.data_type;
    header += '_dataType';
  }
  if (type !== undefined && typeof type !== 'string') other.type = type;
  if (required !== undefined && typeof required !== 'boolean') other.required = required;
  if (Object.keys(other).length) {
    const sorted = Object.fromEntries(
      Object.entries(other).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    );
    header += '_扩展=' + escapePart(JSON.stringify(sorted), true);
  }
  return header;
}

function headerParts(header: string): { name: string; source: Source; attributes: JsonObject } {
  const parts = header.slice(prefix.length).split('_');
  let extra: JsonObject = {};
  if (parts[parts.length - 1]?.startsWith('扩展=')) {
    const value: unknown = JSON.parse(decodeURIComponent(parts.pop()!.slice('扩展='.length)));
    if (!record(value) || own(value, 'name') || own(value, 'value'))
      throw new Error('变量扩展属性格式错误');
    extra = value;
  }
  const dataType = parts[parts.length - 1] === 'dataType';
  if (dataType) parts.pop();
  const source = suffixedSources.get(parts[parts.length - 1]) ?? 'config_variables';
  if (source !== 'config_variables') parts.pop();
  const required = parts.pop();
  const label = parts.pop();
  const name = decodeURIComponent(parts.join('_'));
  if (
    (source !== 'root' && !name.trim()) ||
    label === undefined ||
    ![unspecified, '必填', '非必填'].includes(required ?? '')
  ) {
    throw new Error('变量表头应为「初始变量_变量名_类型_必填或非必填」，未知属性可写「未指定」');
  }
  const type = typeCode(decodeURIComponent(label));
  const attributes: JsonObject = {};
  if (type !== undefined) attributes[dataType ? 'data_type' : 'type'] = type;
  if (required !== unspecified) attributes.required = required === '必填';
  return { name, source, attributes: { ...extra, ...attributes } };
}

function cellValue(value: JsonValue): string | number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return JSON.stringify(value);
  if (value.trim() !== value || value === '') return JSON.stringify(value);
  try {
    JSON.parse(value);
    return JSON.stringify(value);
  } catch {
    return value;
  }
}
function valueFromCell(cell: unknown): JsonValue {
  if (typeof cell !== 'string') {
    if (typeof cell === 'number' || typeof cell === 'boolean') return cell;
    throw new Error('变量值应为文本、数值或 JSON');
  }
  try {
    return JSON.parse(cell) as JsonValue;
  } catch {
    return cell;
  }
}

export function isVariableColumn(header: string): boolean {
  return header.startsWith(prefix);
}

export function variableCells(initialState: JsonObject): Record<string, string | number> {
  const cells: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(initialState)) {
    if (group(key) && Array.isArray(value) && value.length && value.every(namedVariable)) {
      const names = new Set(value.map((entry) => entry.name));
      if (names.size === value.length) {
        for (const { name, value: variableValue, ...attributes } of value) {
          cells[variableHeader(name, key, attributes)] = cellValue(variableValue);
        }
        continue;
      }
    }
    // The editor also accepts raw initial-state fields, including unstructured legacy groups.
    cells[variableHeader(key, 'root', {})] = cellValue(value);
  }
  return cells;
}

// A shared header preserves a sample's group order if its column positions are increasing.
export function variableOrderCells(rows: Record<string, string | number>[], headers: string[]) {
  const positions = new Map(
    headers.map((header, index) => [header, { ...headerParts(header), index }]),
  );
  let needed = false;
  const orders = rows.map((row) => {
    const order: Partial<Record<VariableGroup, string[]>> = {};
    const previous = new Map<VariableGroup, number>();
    for (const header of Object.keys(row)) {
      const { name, source, index } = positions.get(header)!;
      if (source === 'root') continue;
      (order[source] ??= []).push(name);
      if ((previous.get(source) ?? -1) > index) needed = true;
      previous.set(source, index);
    }
    return order;
  });
  return needed
    ? orders.map((order) => (Object.keys(order).length ? JSON.stringify(order) : ''))
    : null;
}

function applyVariableOrder(
  state: JsonObject,
  raw: unknown,
  parsedGroups: Map<Source, Set<string>>,
) {
  const order: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!record(order))
    throw new Error('请按变量组填写顺序，例如 {"config_variables":["city","currency"]}');
  for (const [key, names] of Object.entries(order)) {
    if (!group(key)) throw new Error('未知的初始变量组：' + key);
    if (
      !Array.isArray(names) ||
      !names.every((n): n is string => typeof n === 'string' && !!n.trim())
    )
      throw new Error(key + ' 的顺序须为非空变量名组成的数组');
    const rank = new Map(names.map((name, index) => [name, index]));
    if (rank.size !== names.length) throw new Error(key + ' 的变量顺序中有重复名称');
    if (parsedGroups.has(key)) {
      // A stable sort leaves newly added variables in column order. Deleted names have no entry.
      const entries = state[key] as (JsonObject & { name: string })[];
      entries.sort((a, b) => (rank.get(a.name) ?? rank.size) - (rank.get(b.name) ?? rank.size));
    }
  }
}

export function readVariableColumns(
  row: Readonly<Record<string, unknown>>,
  report: (header: string, message: string) => void,
): JsonObject {
  const state: JsonObject = Object.create(null);
  const seen = new Map<Source, Set<string>>();
  for (const [header, cell] of Object.entries(row)) {
    if (!isVariableColumn(header) || cell === '' || cell === undefined || cell === null) continue;
    try {
      const { name, source, attributes } = headerParts(header);
      const names = seen.get(source) ?? new Set<string>();
      if (names.has(name)) throw new Error('同一样本的变量「' + name + '」在多个配置列中有值');
      const value = valueFromCell(cell);
      if (source === 'root') {
        if (own(state, name)) throw new Error('初始变量「' + name + '」同时填写了原始值与分列值');
        state[name] = value;
      } else {
        if (seen.get('root')?.has(source))
          throw new Error('初始变量「' + source + '」同时填写了原始值与分列值');
        const entries = (state[source] ??= []) as JsonValue[];
        entries.push({ name, value, ...attributes });
      }
      names.add(name);
      seen.set(source, names);
    } catch (error) {
      report(header, error instanceof Error ? error.message : '初始变量格式错误');
    }
  }
  const order = row[variableOrderHeader];
  if (order !== undefined && order !== null && order !== '') {
    try {
      applyVariableOrder(state, order, seen);
    } catch (error) {
      report(
        variableOrderHeader,
        error instanceof SyntaxError
          ? '变量顺序须为有效的 JSON 对象'
          : String((error as Error).message),
      );
    }
  }
  return state;
}
