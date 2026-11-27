import { toApiCase } from '../../../api/datasets';
import {
  caseCategoryLabels, caseDifficultyLabels, type DatasetVersion,
} from '../types/index';
import { sampleColumnLabels, type SampleFileFormat } from './sample-import';
import { formatSampleInput } from './sample-input-text';
import {
  expectationCells, expectationColumnGroups, expectationColumnLabels,
} from './sample-expectation-columns';
import { variableCells, variableOrderCells, variableOrderHeader } from './sample-variable-columns';

const headerColors = {
  required: 'FFFFF2CC',
  expected_skill: 'FFE8DDF5',
  required_tools: 'FFDDEED9',
  forbidden_tools: 'FFF8DCDD',
  final_state: 'FFDCEAF8',
  tool_arguments: 'FFFBE3CD',
  final_output: 'FFD5EFED',
  other_expectations: 'FFE3E6EB',
};

export function exportSamples(version: DatasetVersion, ids?: string[]) {
  const selected = ids ? new Set(ids) : null;
  const cases = version.cases
    .filter((item) => !selected || selected.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category == null ? null : caseCategoryLabels[item.category],
      difficulty: item.difficulty == null ? null : caseDifficultyLabels[item.difficulty],
      initial_state: item.initial_state,
      turns: toApiCase(item).turns.map((turn, index) => ({
        turn_order: index + 1,
        input: formatSampleInput(turn.input),
        expectations: turn.expectations,
      })),
    }));
  if (!cases.length) throw new Error('请选择至少一个样本');
  // A subset is a sample collection, not a published version with its original content hash.
  return { dataset_name: version.dataset_name, source_version: version.version, cases };
}
export function sampleRows(
  version: DatasetVersion,
  ids?: string[],
): Record<string, string | number>[] {
  const cases = exportSamples(version, ids).cases.map((item) => ({
    item,
    variables: variableCells(item.initial_state),
    turns: item.turns.map((turn) => ({ turn, checks: expectationCells(turn.expectations) })),
  }));
  const variableHeaders = [...new Set(cases.flatMap(({ variables }) => Object.keys(variables)))];
  const variableOrders = variableOrderCells(cases.map(({ variables }) => variables), variableHeaders);
  const includeCategory = cases.some(({ item }) => item.category !== null);
  const includeDifficulty = cases.some(({ item }) => item.difficulty !== null);
  const usedCheckKeys = new Set(
    cases.flatMap(({ turns }) => turns.flatMap(({ checks }) => Object.keys(checks))),
  );
  const checkKeys = Object.keys(expectationColumnLabels).filter((key) => usedCheckKeys.has(key));
  return cases.flatMap(({ item, variables, turns }, caseIndex) =>
    turns.map(({ turn, checks }, index) => ({
      case_id: item.id,
      case_name: item.name,
      ...(includeCategory && { category: item.category ?? '' }),
      ...(includeDifficulty && { difficulty: item.difficulty ?? '' }),
      ...Object.fromEntries(
        variableHeaders.map((key) => [key, index === 0 ? (variables[key] ?? '') : '']),
      ),
      ...(variableOrders && { [variableOrderHeader]: index === 0 ? variableOrders[caseIndex] : '' }),
      turn_order: turn.turn_order,
      input_text: turn.input,
      ...Object.fromEntries(checkKeys.map((key) => [key, checks[key] ?? ''])),
    })),
  );
}
// Match just the leading underscore so adjacent OOXML escapes cannot overlap.
const excelEscapes =
  // eslint-disable-next-line no-control-regex
  /_(?=[xX][0-9a-fA-F]{4})|[\u0000-\u0008\u000b-\u001f\u007f\ud800-\udfff\ufffe\uffff]/gu;

function hexCode(char: string) {
  return char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
}

function excelText(value: string): string {
  return value.replace(excelEscapes, (char) => '_x' + hexCode(char) + '_');
}

function excelCell(key: string, value: string | number): string | number {
  if (typeof value !== 'string' || value.search(excelEscapes) < 0) return value;
  if (key === 'case_name' || key === 'case_id' || key === 'input_text') return excelText(value);

  // An office editor can normalize CRs when saving again. Use the importer's
  // existing JSON cell syntax to keep these characters out of the XML text.
  let data: unknown;
  const nameList =
    key === 'required_tools' || key === 'forbidden_tools' || key === 'expected_skill';
  if (nameList && !value.startsWith('{') && !value.startsWith('[')) {
    data = key === 'expected_skill' ? [value] : value.split(', ');
  } else {
    try {
      data = JSON.parse(value);
    } catch {
      data = value;
    }
  }
  return JSON.stringify(data).replace(excelEscapes, (char) => '\\u' + hexCode(char));
}

export async function sampleExportBlob(
  version: DatasetVersion,
  ids: string[] | undefined,
  format: SampleFileFormat,
): Promise<Blob> {
  if (format === 'json')
    return new Blob([JSON.stringify(exportSamples(version, ids), null, 2)], {
      type: 'application/json',
    });
  const rows = sampleRows(version, ids);
  if (format === 'csv') {
    const headers = Object.keys(rows[0]);
    const cell = (value: string | number) => '"' + String(value).replace(/"/g, '""') + '"';
    const lines = [
      headers.map((key) => sampleColumnLabels[key] ?? key),
      ...rows.map((row) => headers.map((key) => row[key])),
    ];
    return new Blob(['\uFEFF' + lines.map((line) => line.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
  }
  const ExcelJS = await import('exceljs');
  const book = new ExcelJS.default.Workbook();
  const sheet = book.addWorksheet('Cases');
  const requiredKeys = ['case_name', 'input_text'];
  const leadingKeys = ['case_id', ...requiredKeys];
  const keys = [...leadingKeys, ...Object.keys(rows[0]).filter((key) => !leadingKeys.includes(key))];
  sheet.columns = keys.map((key) => {
    const header = sampleColumnLabels[key] ?? key;
    const wide = ['input_text', 'state_value', 'other_expectations'].includes(key);
    return {
      header: excelText(header),
      key,
      width: Math.min(60, Math.max(wide ? 48 : 20, header.length * 2 + 2)),
    };
  });
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  for (const key of keys) {
    const group = requiredKeys.includes(key) ? 'required' : expectationColumnGroups.get(key);
    if (group) {
      headerRow.getCell(key).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: headerColors[group] },
      };
    }
  }
  for (const row of rows) {
    const saved = sheet.addRow(keys.map((key) => excelCell(key, row[key])));
    if (String(row.input_text).includes('\n')) {
      saved.getCell('input_text').alignment = { wrapText: true, vertical: 'top' };
    }
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const guide = book.addWorksheet('填写说明');
  guide.columns = [
    { header: '填写项', width: 20 },
    { header: '填写规则（在 Cases 页编辑，淡黄色表头表示每行必填）', width: 80 },
  ];
  guide.addRows([
    ['样本编号', '可以留空，导入时自动生成。复制现有样本来新增样本时，清空编号并改用新名称。'],
    ['样本名称', '每行必填。同一样本的多轮对话使用同一名称，不同样本使用不同名称。'],
    ['轮次顺序', '一行一轮。单轮填 1，多轮填写不重复的正整数，导入时按数字从小到大排列。'],
    ['输入内容', '每轮必填，可直接写用户原话。若已有【输入字段】，保留其格式并修改对应的值。'],
    ['样本分类、难度', '两项均可留空。分类可填正例、负例、边界，难度可填简单、中等、困难。'],
    ['初始变量', '每个变量对应一个「初始变量_…」列，值在该列填写，每个样本只需填一次。'],
    ['期望结果', '同色表头属于同一类期望结果。每轮按需选择检查项，按所选判定方式填写对应参数。可选字段可留空。'],
  ]);
  guide.getColumn(2).alignment = { vertical: 'middle', wrapText: true };
  guide.getColumn(1).alignment = { vertical: 'middle' };
  guide.properties.defaultRowHeight = 36;
  guide.getRow(1).font = { bold: true };
  guide.getRow(1).height = 24;
  return new Blob([new Uint8Array(await book.xlsx.writeBuffer())], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
