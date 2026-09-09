import type { Outcome, ReleaseGateReason } from './api/client'
export const outcomeLabels: Record<Outcome, string> = {
  pass: '通过',
  fail: '不通过',
  review: '需复核',
  not_applicable: '不适用',
  error: '执行错误',
}
export const gateLabels: Record<ReleaseGateReason, string> = {
  threshold_met: '达到本次测评门槛',
  score_below_threshold: '总分未达到最低要求',
  missing_results: '缺少预期评估结果',
  evaluator_error: '存在评估器执行错误',
  blocking_failure: '存在阻断项不通过',
  review_required: '存在需要复核的评估结果',
  no_applicable_results: '没有可用于判定的适用分数',
}
export const scoreText = (value: number | null | undefined) =>
  value == null ? '无分数' : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
