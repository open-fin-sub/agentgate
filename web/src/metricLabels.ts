const metricLabels: Record<string, string> = {
  overall: '综合得分',
  rule: '规则评估',
  llm_judge: '大模型评估',
  hybrid: '复合评估',
  routing: '技能路由',
  tool_use: '工具调用',
  state: '最终状态',
  answer: '回答质量',
  safety: '策略合规',
  efficiency: '效率',
  skill_routing_accuracy: '技能路由正确率',
  tool_coverage: '必需工具覆盖率',
  forbidden_tool_compliance: '禁用工具合规率',
  tool_argument_accuracy: '工具参数准确率',
  final_state_match: '最终状态匹配率',
  final_output_match: '最终输出匹配率',
  policy_compliance: '策略合规率',
}

export const metricLabel = (key: string) => metricLabels[key] ?? key
