import { isAlias, isMap, isNode, isScalar, isSeq, parseDocument, stringify } from 'yaml';
import type { JsonObject, JsonValue } from '../types/index';

const blockHeader = '【输入字段】';
const headerLine = /^【输入字段】(?:\r\n|[\n\r]|$)/u;
const fieldLabels = new Map([
  ['amount', '金额'],
  ['months', '期数'],
  ['application_id', '申请编号'],
  ['skill', '技能'],
]);
const labelFields = new Map([...fieldLabels].map(([field, label]) => [label, field]));

function displayKey(key: string): string {
  if (key.startsWith('\\') || labelFields.has(key)) return '\\' + key;
  return fieldLabels.get(key) ?? key;
}

function originalKey(key: string): string {
  const rest = key.slice(1);
  if (key.startsWith('\\') && (rest.startsWith('\\') || labelFields.has(rest))) return rest;
  return labelFields.get(key) ?? key;
}

function isLegacyObjectText(text: string): boolean {
  if (!text.trimStart().startsWith('{')) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function formatSampleInput(input: JsonObject): string {
  const fields = Object.entries(input);
  if (fields.length === 1 && fields[0][0] === 'txt') {
    const value = fields[0][1];
    if (
      typeof value === 'string' &&
      value.trim() &&
      !headerLine.test(value) &&
      !isLegacyObjectText(value)
    )
      return value;
  }
  const labelled = Object.fromEntries(fields.map(([key, value]) => [displayKey(key), value]));
  const body = stringify(labelled, {
    schema: 'core',
    // The library formats numbers via JSON.stringify, which changes -0 into 0.
    customTags: (tags) => [
      {
        default: true,
        tag: 'tag:yaml.org,2002:int',
        identify: (value) => Object.is(value, -0),
        resolve: () => -0,
        stringify: () => '-0',
      },
      ...tags,
    ],
    aliasDuplicateObjects: false,
    // A literal U+FEFF at the start of the first unquoted key is consumed as a BOM.
    defaultKeyType: fields.some(([key]) => key.startsWith('\uFEFF')) ? 'QUOTE_DOUBLE' : null,
    lineWidth: 0,
    blockQuote: false,
    doubleQuotedAsJSON: true,
  });
  return blockHeader + '\n' + body.slice(0, -1);
}

function readValue(node: unknown, root = false): JsonValue {
  if (node === null) return null;
  if (!isNode(node) || isAlias(node) || node.tag || node.anchor)
    throw new Error('输入字段不能使用标签、锚点或别名');
  if (isScalar(node)) {
    const value = node.value;
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    )
      return value;
    throw new Error('输入字段只支持文本、有限数值、布尔值、空值、列表和对象');
  }
  if (isSeq(node)) return node.items.map((child) => readValue(child));
  const seen = new Set<string>();
  return Object.fromEntries(
    node.items.map((pair) => {
      const key = pair.key;
      if (!isScalar(key) || typeof key.value !== 'string' || key.anchor || key.tag)
        throw new Error('输入字段的字段名必须是文本，数值或布尔值用作字段名时请加引号');
      const field = root ? originalKey(key.value) : key.value;
      if (seen.has(field)) throw new Error('输入字段的字段名重复：' + key.value);
      seen.add(field);
      return [field, readValue(pair.value)];
    }),
  );
}

export function parseSampleInputBlock(text: string): JsonObject | undefined {
  const header = headerLine.exec(text);
  if (!header) return undefined;
  try {
    // Check key uniqueness after resolving display labels. Build objects from entries
    // so arbitrary JSON keys, including "__proto__", remain ordinary own properties.
    const doc = parseDocument(text.slice(header[0].length), {
      version: '1.2',
      schema: 'core',
      merge: false,
      resolveKnownTags: false,
      uniqueKeys: false,
    });
    if (doc.errors.length || doc.warnings.length || doc.directives?.yaml.version !== '1.2')
      throw new Error('输入字段格式错误，请使用单个 YAML 1.2 文档并检查冒号、引号和缩进');
    if (!isMap(doc.contents)) throw new Error('输入字段必须是字段名与值组成的对象');
    return readValue(doc.contents, true) as JsonObject;
  } catch (error) {
    if (error instanceof RangeError) throw new Error('输入字段的嵌套层级过深');
    throw error;
  }
}
