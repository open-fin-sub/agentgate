import { toApiCase } from '../../../api/datasets';
import { caseCategoryLabels, caseDifficultyLabels, type DatasetVersion } from '../types/index';
import { sampleColumnLabels, type SampleFileFormat } from './sample-import';
import { expectationCells, expectationColumnLabels } from './sample-expectation-columns';
import { variableCells, variableOrderCells, variableOrderHeader } from './sample-variable-columns';

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
        input: turn.input,
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
      input_json: JSON.stringify(turn.input),
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
  if (key === 'case_name' || key === 'case_id') return excelText(value);

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
  const keys = Object.keys(rows[0]);
  sheet.columns = keys.map((key) => {
    const header = sampleColumnLabels[key] ?? key;
    const wide = ['input_json', 'state_value', 'other_expectations'].includes(key);
    return {
      header: excelText(header),
      key,
      width: Math.min(60, Math.max(wide ? 48 : 20, header.length * 2 + 2)),
    };
  });
  for (const row of rows) {
    sheet.addRow(keys.map((key) => excelCell(key, row[key])));
  }
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return new Blob([new Uint8Array(await book.xlsx.writeBuffer())], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
