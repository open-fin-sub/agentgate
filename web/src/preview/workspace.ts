import { inject, provide, reactive, ref, onMounted, onUnmounted } from 'vue'
import type { InjectionKey } from 'vue'
import { ElMessage } from 'element-plus'
import type { PreviewState } from './types'
import { createSeed } from './seed'
import { advanceRuns } from './execution'

export const STORAGE_KEY = 'agentgate.preview.v2'
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            source: 'AgentGate Mock 体验数据',
            generatedAt: new Date().toISOString(),
            notice: '本文件为虚构体验结果，不可用于真实发布决策。',
            data: value,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    ),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
interface Workspace {
  state: PreviewState
  change: (subject: string, action: string, update: () => void) => boolean
  reset: () => void
  setRole: (role: PreviewState['role']) => void
}
const key: InjectionKey<Workspace> = Symbol('preview-workspace')
export function usePreview(): Workspace {
  const context = inject(key)
  if (!context) throw new Error('体验工作区尚未初始化')
  return context
}
function load(): PreviewState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createSeed()
  const value = JSON.parse(raw) as PreviewState
  if (
    value.schema !== 2 ||
    !Array.isArray(value.runs) ||
    !Array.isArray(value.datasets) ||
    !Array.isArray(value.targets) ||
    !Array.isArray(value.evaluators) ||
    !Array.isArray(value.credentials) ||
    !Array.isArray(value.templates) ||
    !Array.isArray(value.suggestions) ||
    !Array.isArray(value.comparisons) ||
    !Array.isArray(value.reviews) ||
    !Array.isArray(value.analyses) ||
    !Array.isArray(value.audit)
  )
    throw new Error('体验数据格式不兼容，请重置体验数据。')
  return value
}
export function providePreview() {
  const warning = ref('')
  let initial: PreviewState
  try {
    initial = load()
  } catch (error) {
    initial = createSeed()
    warning.value = error instanceof Error ? error.message : '无法读取浏览器存储，请重置体验数据。'
  }
  const state = reactive(initial) as PreviewState
  const conflict = ref(false)
  const viewRevision = ref(0)
  function persist() {
    state.revision++
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  function change(subject: string, action: string, update: () => void): boolean {
    if (state.role === 'viewer') {
      ElMessage.warning('当前为只读角色体验，请切换为测评人员后操作。')
      return false
    }
    if (conflict.value || warning.value) {
      ElMessage.error('体验数据需要重新加载或重置，当前修改未保存。')
      return false
    }
    const previous = clone(state)
    try {
      update()
      state.audit.unshift({
        id: uid('audit'),
        subject,
        action,
        time: new Date().toISOString(),
        actor: '当前体验用户',
      })
      state.audit = state.audit.slice(0, 300)
      persist()
      return true
    } catch (error) {
      Object.assign(state, previous)
      ElMessage.error(error instanceof Error ? error.message : '保存失败，修改未生效。')
      return false
    }
  }
  function reset() {
    Object.assign(state, createSeed())
    conflict.value = false
    warning.value = ''
    try {
      for (const name of Object.keys(sessionStorage))
        if (
          name.startsWith('agentgate.preview.preparation.v1:') ||
          name === 'agentgate-preview-run-draft-v1'
        )
          sessionStorage.removeItem(name)
      persist()
      viewRevision.value++
    } catch {
      warning.value = '浏览器存储不可用，体验数据不能持久化。'
    }
  }
  function reload() {
    try {
      Object.assign(state, load())
      conflict.value = false
      warning.value = ''
      viewRevision.value++
    } catch (error) {
      warning.value = String(error)
    }
  }
  function storage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return
    try {
      const incoming = load()
      if (JSON.stringify(incoming.audit) === JSON.stringify(state.audit)) {
        state.runs = incoming.runs
        state.revision = incoming.revision
      } else {
        conflict.value = true
      }
    } catch {
      conflict.value = true
    }
  }
  function setRole(role: PreviewState['role']) {
    if (conflict.value || warning.value) {
      ElMessage.warning('请先重新加载体验数据。')
      return
    }
    const old = state.role
    state.role = role
    try {
      state.audit.unshift({
        id: uid('audit'),
        subject: '体验角色',
        action: `切换角色为 ${role}（仅浏览器交互模拟）`,
        time: new Date().toISOString(),
        actor: '体验控制台',
      })
      persist()
    } catch {
      state.role = old
      ElMessage.error('角色设置未保存。')
    }
  }
  let timer: number | undefined
  onMounted(() => {
    window.addEventListener('storage', storage)
    timer = window.setInterval(() => {
      if (conflict.value || warning.value) return
      const previous = clone(state)
      if (advanceRuns(state, Date.now()))
        try {
          persist()
        } catch {
          Object.assign(state, previous)
          warning.value = '存储空间不足，进度保存已暂停。'
        }
    }, 1000)
  })
  onUnmounted(() => {
    window.removeEventListener('storage', storage)
    clearInterval(timer)
  })
  provide(key, { state, change, reset, setRole })
  return { state, change, reset, reload, warning, conflict, viewRevision }
}
