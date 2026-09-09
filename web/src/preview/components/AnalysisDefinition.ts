import type { StaticAnalysis, TargetVersion } from '../types'

/** Read the saved analysis fragment, never the current target definition. */
export function definitionEvidence(risk: StaticAnalysis['risks'][number]) {
  const excerpt = (value: string) => (value.length > 160 ? `${value.slice(0, 160)}…` : value)
  const matched = (value: string) =>
    excerpt(
      value
        .split(/(?<=[。！？\n])/)
        .filter((line) => /均可|相关问题|帮助申请|贷款|办理|咨询/.test(line))
        .join('') || value,
    )
  try {
    if (risk.id === 'scope-overlap') {
      const saved = JSON.parse(risk.fragment) as Pick<TargetVersion, 'prompt' | 'skillDefinitions'>
      return [
        { field: 'Agent Prompt', value: matched(saved.prompt) },
        ...(saved.skillDefinitions ?? []).flatMap((skill) => [
          { field: `${skill.name} ${skill.version} · 职责描述`, value: matched(skill.description) },
          { field: `${skill.name} ${skill.version} · Prompt`, value: matched(skill.prompt) },
        ]),
      ]
    }
    if (risk.id === 'skill-versions')
      return risk.skills.map((id) => ({
        field: id,
        value: '此分析版本缺少固定 Skill 定义，无法核对职责。',
      }))
    if (risk.id.startsWith('skill-description-')) {
      const saved = JSON.parse(risk.fragment) as NonNullable<
        TargetVersion['skillDefinitions']
      >[number]
      return [
        {
          field: `${saved.name} ${saved.version} · 职责描述`,
          value: excerpt(saved.description) || '未填写',
        },
        {
          field: `${saved.name} ${saved.version} · Prompt`,
          value: excerpt(saved.prompt) || '未填写',
        },
      ]
    }
    if (risk.id === 'tool-schema') {
      const saved = JSON.parse(risk.fragment) as {
        missingTools: string[]
        toolDefinitions: NonNullable<TargetVersion['toolDefinitions']>
      }
      return saved.missingTools.flatMap((name) => {
        const tool = saved.toolDefinitions.find((item) => item.name === name)
        if (!tool) return [{ field: name, value: '缺少固定工具定义，无法检查输入和输出约束。' }]
        return (['inputSchema', 'outputSchema'] as const).flatMap((field) => {
          try {
            const schema: unknown = JSON.parse(tool[field])
            if (schema && typeof schema === 'object' && !Array.isArray(schema)) return []
          } catch {
            /* The invalid field is the evidence. */
          }
          return [
            {
              field: `${name} · ${field === 'inputSchema' ? '输入' : '输出'} Schema`,
              value: '缺失或不是有效 JSON 对象，无法核对参数约束。',
            },
          ]
        })
      })
    }
  } catch {
    /* Keep malformed saved evidence inspectable in the full fragment. */
  }
  return [
    {
      field: risk.id === 'fallback' ? 'Agent Prompt · 检查范围摘要' : '已保存的证据摘要',
      value: excerpt(risk.fragment),
    },
  ]
}

export function definitionRisks(version: TargetVersion): StaticAnalysis['risks'] {
  const risks: StaticAnalysis['risks'] = []
  const fixedSkills = (version.skillDefinitions ?? []).filter(
    (item) => version.skills.includes(item.id) && item.version,
  )
  const missingSkills = version.skills.filter((id) => !fixedSkills.some((item) => item.id === id))
  if (fixedSkills.length > 1 && /均可|相关问题|帮助申请/.test(version.prompt)) {
    risks.push({
      id: 'scope-overlap',
      title: '办理与咨询边界可能重叠',
      skills: fixedSkills.map((item) => item.id),
      fragment: JSON.stringify({ prompt: version.prompt, skillDefinitions: fixedSkills }, null, 2),
      reason:
        'Mock 规则在该版本 Prompt 中识别到宽泛职责描述；依据为此版本内嵌的固定 Skill 描述与 Prompt，未读取目录的最新版本。需要运行样本验证边界假设。',
      severity: '高',
    })
  }
  if (!/不承诺|兜底|转人工|人工审核|无法处理|拒绝/.test(version.prompt)) {
    risks.push({
      id: 'fallback',
      title: '定义中未发现明确兜底约束',
      skills: [...version.skills],
      fragment: version.prompt || '（Prompt 为空）',
      reason: '仅检查本版本 Prompt 的兜底措辞；不能据此认定运行必然失败。',
      severity: '中',
    })
  }
  for (const skill of fixedSkills) {
    if (!skill.description.trim() || !skill.prompt.trim())
      risks.push({
        id: `skill-description-${skill.id}`,
        title: `${skill.name} ${skill.version} 的职责证据不完整`,
        skills: [skill.id],
        fragment: JSON.stringify(skill, null, 2),
        reason: '固定 Skill 快照中缺少描述或 Prompt，不能补用目录中其他版本的定义。',
        severity: '中',
      })
  }
  if (missingSkills.length)
    risks.push({
      id: 'skill-versions',
      title: '关联 Skill 固定版本缺失',
      skills: missingSkills,
      fragment: JSON.stringify(
        { skills: version.skills, skillDefinitions: version.skillDefinitions ?? [] },
        null,
        2,
      ),
      reason: '仅列出本版本内缺少固定定义的 Skill；不能将当前目录的任意版本当作本次依赖快照。',
      severity: '中',
    })
  const validSchema = (value: string) => {
    try {
      const schema: unknown = JSON.parse(value)
      return !!schema && typeof schema === 'object' && !Array.isArray(schema)
    } catch {
      return false
    }
  }
  const missingTools = version.tools.filter(
    (name) =>
      !version.toolDefinitions?.some(
        (item) =>
          item.name === name && validSchema(item.inputSchema) && validSchema(item.outputSchema),
      ),
  )
  if (missingTools.length)
    risks.push({
      id: 'tool-schema',
      title: '工具参数证据不足',
      skills: [],
      fragment: JSON.stringify(
        { missingTools, toolDefinitions: version.toolDefinitions ?? [] },
        null,
        2,
      ),
      reason:
        '上述工具缺少可读的输入输出 Schema；只报告实际缺口，不虚构参数定义。Schema 存在也不代表工具行为已验证。',
      severity: '低',
    })
  return risks
}
