import type { TestCase } from '../types'
import { uid } from '../workspace'

export function emptyCase(): TestCase {
  return {
    id: uid('case'),
    question: '',
    turns: [],
    expected: '',
    expectedSkill: '',
    variables: '{}',
    files: [],
    category: '正例',
    difficulty: '中等',
    priority: 'P1',
    tags: [],
    note: '',
    sources: [],
  }
}

export function caseErrors(item: TestCase): string[] {
  const errors: string[] = []
  if (!item.id.trim()) errors.push('用例 ID 不能为空')
  if (!item.turns.length && !item.question.trim()) errors.push('问题不能为空')
  if (item.turns.some((turn) => !turn.input.trim())) errors.push('每轮输入不能为空')
  try {
    const value: unknown = JSON.parse(item.variables)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      errors.push('变量必须是 JSON 对象')
  } catch {
    errors.push('变量 JSON 格式错误')
  }
  if (!['正例', '负例', '边界'].includes(item.category)) errors.push('类别须为正例、负例或边界')
  if (!['简单', '中等', '困难'].includes(item.difficulty)) errors.push('难度须为简单、中等或困难')
  if (!['P0', 'P1', 'P2'].includes(item.priority)) errors.push('优先级须为 P0、P1 或 P2')
  return errors
}

export function caseTitle(item: TestCase): string {
  return item.turns.length ? item.turns.map((turn) => turn.input.trim()).join(' → ') : item.question
}

export function syncCase(item: TestCase): TestCase {
  return { ...item, question: caseTitle(item) }
}

export function datasetErrors(cases: TestCase[]): string[] {
  const seen = new Set<string>()
  return cases.flatMap((item, index) => {
    const errors = caseErrors(item)
    if (seen.has(item.id)) errors.push('用例 ID 重复')
    seen.add(item.id)
    return errors.map((error) => `第 ${index + 1} 行（${item.id}）：${error}`)
  })
}

export function caseDiff(before: TestCase[], after: TestCase[]) {
  const old = new Map(before.map((item) => [item.id, item]))
  const current = new Set(after.map((item) => item.id))
  return {
    added: after.filter((item) => !old.has(item.id)),
    removed: before.filter((item) => !current.has(item.id)),
    changed: after.filter(
      (item) => old.has(item.id) && JSON.stringify(old.get(item.id)) !== JSON.stringify(item),
    ),
  }
}

export function previewReturn(value: unknown, fallback = '/preview/runs/new'): string {
  const path = String(value ?? '')
  return /^\/preview(?:\/[^\\\s]*)?(?:\?[^\\\s]*)?$/.test(path) ? path : fallback
}
