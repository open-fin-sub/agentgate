import type { EvaluatorVersion, Outcome, PreviewState } from '../types'

export const ruleExamples: Record<string, object> = {
  json: {
    type: 'json',
    required: ['approved', 'amount'],
    properties: {
      approved: { type: 'boolean', enum: [false] },
      amount: { type: 'number', minimum: 1, maximum: 1000000 },
    },
  },
  regex: { type: 'regex', pattern: '人工审核', flags: 'u' },
  field: { type: 'field', path: 'decision', operator: 'equals', value: 'manual_review' },
  tool: {
    type: 'tool',
    tool: 'credit_check',
    required: ['amount'],
    properties: { amount: { type: 'number', minimum: 1 } },
  },
}
type JsonObject = Record<string, unknown>
export interface TrialResult {
  name: string
  outcome: Outcome
  score: number | null
  reason: string
  children?: TrialResult[]
}
export interface TrialSample {
  input: string
  output: string
  expected: string
}
function object(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function fail(message: string): never {
  throw new Error(message)
}
function result(
  name: string,
  outcome: Outcome,
  reason: string,
  score: number | null = outcome === 'pass' ? 1 : outcome === 'fail' ? 0 : null,
): TrialResult {
  return { name, outcome, score, reason }
}
function field(value: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        object(current) && Object.prototype.hasOwnProperty.call(current, key)
          ? current[key]
          : undefined,
      value,
    )
}

export function parseRule(text: string): JsonObject {
  const config: unknown = JSON.parse(text)
  if (!object(config)) return fail('规则必须是 JSON 对象')
  if (!['json', 'regex', 'field', 'tool'].includes(String(config.type)))
    fail('规则 type 仅支持 json、regex、field、tool')
  const common = config.type === 'regex' ? ['type'] : ['type', 'applicableField']
  const supported =
    config.type === 'regex'
      ? ['pattern', 'flags']
      : config.type === 'field'
        ? ['path', 'operator', 'value']
        : ['required', 'properties', ...(config.type === 'tool' ? ['tool'] : [])]
  const unknown = Object.keys(config).filter((key) => ![...common, ...supported].includes(key))
  if (unknown.length) fail(`未支持的规则字段：${unknown.join(', ')}；请使用模板内字段`)
  if (config.applicableField !== undefined && typeof config.applicableField !== 'string')
    fail('applicableField 必须是字段路径字符串')
  if (config.type === 'regex') {
    if (typeof config.pattern !== 'string' || !config.pattern || config.pattern.length > 300)
      fail('正则 pattern 必须是 1～300 字符的字符串')
    if (config.flags !== undefined && typeof config.flags !== 'string')
      fail('正则 flags 必须是字符串')
    if (/\([^)]*[+*][^)]*\)[+*{]/.test(String(config.pattern)))
      fail('体验正则不支持嵌套重复量词，请简化表达式')
    new RegExp(String(config.pattern), String(config.flags ?? 'u'))
  }
  if (config.type === 'field') {
    if (typeof config.path !== 'string' || !config.path.trim()) fail('字段规则必须填写 path')
    if (!['equals', 'contains', 'exists', 'gte', 'lte'].includes(String(config.operator)))
      fail('operator 仅支持 equals、contains、exists、gte、lte')
    if (config.operator !== 'exists' && config.value === undefined) fail('该字段规则必须填写 value')
    if (['gte', 'lte'].includes(String(config.operator)) && typeof config.value !== 'number')
      fail('范围比较 value 必须是数字')
  }
  if (config.type === 'tool' && (typeof config.tool !== 'string' || !config.tool.trim()))
    fail('工具规则必须填写 tool 名称')
  if (
    config.required !== undefined &&
    (!Array.isArray(config.required) || config.required.some((name) => typeof name !== 'string'))
  )
    fail('required 必须是字符串数组')
  if (config.properties !== undefined) {
    if (!object(config.properties)) fail('properties 必须是对象')
    for (const [name, schema] of Object.entries(config.properties as JsonObject)) {
      if (!object(schema)) fail(`${name} 的配置必须是对象`)
      const entry = schema as JsonObject
      if (Object.keys(entry).some((key) => !['type', 'enum', 'minimum', 'maximum'].includes(key)))
        fail(`${name} 仅支持 type、enum、minimum、maximum`)
      if (
        entry.type !== undefined &&
        !['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'].includes(
          String(entry.type),
        )
      )
        fail(`${name} 的字段类型不支持`)
      if (entry.enum !== undefined && (!Array.isArray(entry.enum) || !entry.enum.length))
        fail(`${name}.enum 必须为非空数组`)
      if (
        ['minimum', 'maximum'].some(
          (key) => entry[key] !== undefined && typeof entry[key] !== 'number',
        )
      )
        fail(`${name} 的范围必须是数字`)
      if (
        typeof entry.minimum === 'number' &&
        typeof entry.maximum === 'number' &&
        entry.minimum > entry.maximum
      )
        fail(`${name} 最小值不能大于最大值`)
    }
  }
  return config
}

export function evaluatorErrors(
  version: EvaluatorVersion,
  state: PreviewState,
  ownerId = '',
): string[] {
  const errors: string[] = []
  if (!Number.isFinite(version.threshold) || version.threshold < 0 || version.threshold > 1)
    errors.push('通过阈值须在 0～1 之间')
  if (version.kind === 'rule') {
    try {
      parseRule(version.rule)
    } catch (error) {
      errors.push(`规则无效：${String(error)}`)
    }
  }
  if (version.kind === 'llm') {
    if (!version.prompt.trim()) errors.push('评分 Prompt 不能为空')
    const variables = [...version.prompt.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((match) =>
      match[1].trim(),
    )
    if (!variables.includes('output')) errors.push('评分 Prompt 必须引用 {{output}}')
    if (variables.some((name) => !['input', 'output', 'expected'].includes(name)))
      errors.push('仅支持 {{input}}、{{output}} 和 {{expected}} 变量')
    if (!version.model.trim()) errors.push('请选择模型名称')
    const resource = state.credentials.find((item) => item.id === version.resourceId)
    if (!resource?.healthy || !resource.enabled)
      errors.push('评分资源不可用，请选择可用的公共或私有资源')
  }
  if (version.kind === 'composite') {
    if (!version.children.length) errors.push('复合评估器至少需要一个固定版本子项')
    const seen = new Set<string>()
    for (const child of version.children) {
      const key = `${child.id}@${child.version}`
      if (seen.has(key)) errors.push(`子项 ${key} 重复`)
      seen.add(key)
      if (child.id === ownerId) errors.push('不能将自身作为子评估器')
      if (
        !state.evaluators
          .find((item) => item.id === child.id && !item.archived)
          ?.versions.some((entry) => entry.version === child.version)
      )
        errors.push(`子项 ${key} 不存在或已归档`)
      if (!Number.isFinite(child.weight) || child.weight <= 0)
        errors.push(`子项 ${key} 权重必须大于 0`)
    }
  }
  return errors
}

function checkObject(value: JsonObject, config: JsonObject): string[] {
  const issues: string[] = []
  for (const name of (config.required ?? []) as string[])
    if (!Object.prototype.hasOwnProperty.call(value, name)) issues.push(`缺少必填字段 ${name}`)
  for (const [name, schema] of Object.entries(
    (config.properties ?? {}) as Record<string, JsonObject>,
  )) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue
    const current = value[name]
    const matches =
      schema.type === undefined ||
      (schema.type === 'array'
        ? Array.isArray(current)
        : schema.type === 'null'
          ? current === null
          : schema.type === 'integer'
            ? Number.isInteger(current)
            : schema.type === 'object'
              ? object(current)
              : typeof current === schema.type)
    if (!matches) issues.push(`${name} 类型应为 ${schema.type}`)
    if (
      Array.isArray(schema.enum) &&
      !schema.enum.some((entry) => JSON.stringify(entry) === JSON.stringify(current))
    )
      issues.push(`${name} 不在允许枚举内`)
    if (
      typeof schema.minimum === 'number' &&
      (typeof current !== 'number' || current < schema.minimum)
    )
      issues.push(`${name} 小于下限 ${schema.minimum}`)
    if (
      typeof schema.maximum === 'number' &&
      (typeof current !== 'number' || current > schema.maximum)
    )
      issues.push(`${name} 大于上限 ${schema.maximum}`)
  }
  return issues
}

export function evaluateSample(
  version: EvaluatorVersion,
  state: PreviewState,
  sample: TrialSample,
  name = '当前评估器',
  chain: string[] = [],
): TrialResult {
  try {
    if (chain.length > 12) return result(name, 'error', '子评估器递归过深或存在循环')
    if (version.kind === 'llm') {
      const errors = evaluatorErrors(version, state)
      if (errors.length) return result(name, 'error', errors.join('；'))
      if (!sample.expected.trim())
        return result(name, 'NA', 'Mock 词面示例需要期望文本，未调用真实 LLM')
      const score = sample.output.includes(sample.expected.trim()) ? 1 : 0.35
      return result(
        name,
        score >= version.threshold ? 'pass' : 'fail',
        'Mock 词面匹配评分示例，不代表 LLM 语义判断；实际模型未调用',
        score,
      )
    }
    if (version.kind === 'composite') {
      if (!version.children.length) return result(name, 'error', '未选择子评估器')
      const children: TrialResult[] = []
      let stopped = false
      let sum = 0
      let weight = 0
      for (const child of version.children) {
        const evaluator = state.evaluators.find((item) => item.id === child.id)
        const current = evaluator?.versions.find((entry) => entry.version === child.version)
        const key = `${child.id}@${child.version}`,
          label = `${evaluator?.name ?? child.id} v${child.version} · 权重 ${child.weight}`
        if (stopped) {
          children.push(result(label, 'NA', '未执行：前序失败触发短路'))
          continue
        }
        const row =
          !current || chain.includes(key) || child.weight <= 0
            ? result(label, 'error', '子项缺失、循环引用或权重无效')
            : evaluateSample(current, state, sample, label, [...chain, key])
        children.push(row)
        if (row.score !== null) {
          sum += row.score * child.weight
          weight += child.weight
        }
        if (version.shortCircuit && (row.outcome === 'fail' || row.outcome === 'error'))
          stopped = true
      }
      if (children.some((row) => row.outcome === 'error'))
        return { ...result(name, 'error', '子项执行错误；不将错误计为零分'), children }
      if (stopped)
        return {
          ...result(name, 'fail', '前序子项失败触发短路；后续未执行，不产生综合分数', null),
          children,
        }
      if (children.some((row) => row.score === null) || !weight)
        return {
          ...result(name, 'NA', '部分子项不适用，缺少完整聚合证据；不重新分摊权重'),
          children,
        }
      const score = Number((sum / weight).toFixed(4))
      return {
        ...result(
          name,
          score >= version.threshold ? 'pass' : 'fail',
          `按权重归一化聚合，通过阈值 ${version.threshold}`,
          score,
        ),
        children,
      }
    }
    const config = parseRule(version.rule)
    if (sample.output.length > 20000) return result(name, 'error', '单样本试评输出最多 20000 字符')
    if (config.type === 'regex') {
      const passed = new RegExp(String(config.pattern), String(config.flags ?? 'u')).test(
        sample.output,
      )
      return result(
        name,
        passed ? 'pass' : 'fail',
        passed ? '输出匹配正则表达式' : '输出未匹配正则表达式',
      )
    }
    let output: unknown
    try {
      output = JSON.parse(sample.output)
    } catch {
      return result(name, 'fail', '输出不是有效 JSON')
    }
    if (config.applicableField && field(output, String(config.applicableField)) === undefined)
      return result(name, 'NA', `缺少适用条件字段 ${config.applicableField}`)
    if (config.type === 'field') {
      const value = field(output, String(config.path))
      const passed =
        config.operator === 'exists'
          ? value !== undefined
          : config.operator === 'equals'
            ? JSON.stringify(value) === JSON.stringify(config.value)
            : config.operator === 'contains'
              ? typeof value === 'string' && value.includes(String(config.value))
              : config.operator === 'gte'
                ? typeof value === 'number' && value >= Number(config.value)
                : typeof value === 'number' && value <= Number(config.value)
      return result(
        name,
        passed ? 'pass' : 'fail',
        `${config.path} ${config.operator} 检查${passed ? '通过' : '失败'}`,
      )
    }
    if (!object(output)) return result(name, 'fail', '输出应为 JSON 对象')
    if (config.type === 'tool') {
      if (output.tool !== config.tool)
        return result(
          name,
          'fail',
          `期望工具 ${config.tool}，实际 ${String(output.tool ?? '缺失')}`,
        )
      if (!object(output.arguments)) return result(name, 'fail', '工具 arguments 必须是 JSON 对象')
      output = output.arguments
    }
    const issues = checkObject(output as JsonObject, config)
    return result(
      name,
      issues.length ? 'fail' : 'pass',
      issues.join('；') || '必填字段、类型、枚举及范围校验通过',
    )
  } catch (error) {
    return result(name, 'error', String(error))
  }
}
