// Localize only the built-in catalog names; custom names retain their own wording.
const names: Record<string, string> = {
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
