import { computed, inject, provide, reactive, watch, type InjectionKey } from 'vue'
import { useRoute } from 'vue-router'

const detailStateKey: InjectionKey<Map<string, unknown>> = Symbol('detail-state')
const storageKey = 'agentgate.ui.detail-selection.v1'

// Owned by the application layout; only navigation references, never drafts or result payloads.
export function provideDetailState() {
  const state = reactive(new Map<string, unknown>())
  try {
    const entries: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')
    if (Array.isArray(entries)) for (const entry of entries.slice(-100)) {
      if (Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string') state.set(entry[0], entry[1])
    }
  } catch { /* Selection remains available in memory when browser storage is unavailable. */ }
  watch(state, () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify([...state])) } catch { /* Memory-only fallback. */ }
  }, { deep: true, flush: 'sync' })
  provide(detailStateKey, state)
}

export function useDetailState<T>(name: string | (() => string), initial: T) {
  const state = inject(detailStateKey)
  if (!state) throw new Error('Detail selection requires the application layout')
  const route = useRoute()
  const stateKey = () => `${route.path}?${JSON.stringify(Object.entries(route.query).sort(([a], [b]) => a.localeCompare(b)))}:${typeof name === 'string' ? name : name()}`
  return computed<T>({
    get: () => (state.get(stateKey()) as T | undefined) ?? initial,
    set: value => {
      const key = stateKey()
      state.delete(key)
      state.set(key, value)
      if (state.size > 100) state.delete(state.keys().next().value!)
    },
  })
}
