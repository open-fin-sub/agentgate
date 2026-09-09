// Localize only the built-in catalog names; custom names retain their own wording.
const names: Record<string, string> = {
  'Loan Agent': '信贷助手',
  'loan_agent.invoke': '处理信贷请求',
  'skill-routing': '选择业务处理场景',
  'choose-action': '选择处理方式',
  'credit_inquiry': '查询征信',
  'approve_loan': '审批贷款',
  'case.execute': '执行用例',
  'turn.execute': '执行对话轮次',
  'business_state': '更新业务状态',
  '最终状态：status': '审批状态检查',
  'Skill Routing': '技能路由检查',
  'Required Tool': '必需工具检查',
  'Forbidden Tool': '禁用工具检查',
  'Tool Arguments': '工具参数检查',
  'Final State': '最终状态检查',
  'Final Output': '最终输出检查',
  'Policy Compliance': '策略合规检查',
  'Risky version': '风险版本',
  'Fixed version': '修正版本',
}
export const catalogLabel = (name: string) => names[name] ?? name

const operations: Record<string, string> = {
  agent: '智能体处理', tool: '工具调用', decision: '业务决策', routing: '场景选择',
  turn: '对话轮次', state: '状态更新', case: '用例执行',
}
export const operationLabel = (value: string) => operations[value] ?? '其他操作'
const values: Record<string, Record<string, string>> = {
  status: { approved: '已批准', pending_review: '待人工审核', rejected: '已拒绝' },
  risk: { high: '高风险', medium: '中风险', low: '低风险' },
  skill: { loan_approval: '贷款办理', repayment_plan: '还款方案', complaint: '投诉处理', credit_inquiry: '征信查询', faq: '常见问题' },
  kind: { equals: '等于', contains: '包含', exists: '存在', matches_regex: '匹配表达式' },
}
export const businessValueLabel = (field: string | undefined, value: unknown) =>
  field && typeof value === 'string' ? values[field]?.[value] ?? value : value
export function conditionField(value: unknown): string | undefined {
  return value && typeof value === 'object' && 'path' in value && typeof value.path === 'string'
    ? value.path : undefined
}
