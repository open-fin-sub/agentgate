import { ApiError } from './api/client'

export function userError(error: unknown, fallback = '暂时无法完成操作，请稍后重试。'): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return '无法确认访问权限，请联系管理员后重试。'
    if (error.status === 403) return '你没有执行此操作的权限，请联系管理员。'
    if (error.status === 404) return '找不到这项内容，请返回列表重新选择。'
    if (error.status === 409) return '内容或状态已变化，请重新加载后核对再试。'
    if (error.status === 400 || error.status === 422)
      return '填写内容未通过校验，请核对必填项和取值后重试。'
    if (error.status === 429) return '当前请求较多，请稍等片刻再试。'
  }
  return fallback
}
