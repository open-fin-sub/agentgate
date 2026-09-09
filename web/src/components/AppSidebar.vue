<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
defineProps<{ open: boolean; collapsed: boolean }>()
defineEmits<{ close: [] }>()
const route = useRoute()
const preview = computed(() => route.path.startsWith('/preview'))
const link = (path: string) => (preview.value ? `/preview${path === '/' ? '' : path}` : path)
const icons: Record<string, string> = {
  '/': 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  '/targets': 'M12 3 3 8v9l9 5 9-5V8z M3 8l9 5 9-5 M12 13v9',
  '/datasets': 'M3 6l9-4 9 4-9 4z M3 12l9 4 9-4 M3 18l9 4 9-4',
  '/evaluators':
    'M4 3v5 M4 12v9 M12 3v10 M12 17v4 M20 3v2 M20 9v12 M1 8h6v4H1z M9 13h6v4H9z M17 5h6v4h-6z',
  '/runs': 'M7 4H4v17h16V4h-3 M8 2h8v5H8z M8 11h8 M8 15h5',
  '/capabilities':
    'M9 15l6-6 M8 16l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0 M16 8l2-2a3 3 0 0 1 4 4l-5 5a3 3 0 0 1-4 0',
}
const groups = computed(() => [
  { label: '工作概况', items: [['/', '总览', '览']] },
  {
    label: '测评准备',
    items: [
      ['/targets', '测评对象', '对'],
      ['/datasets', '测评集', '集'],
      ['/evaluators', '评估器', '评'],
    ],
  },
  {
    label: '执行与结果',
    items: [
      ['/runs', '测评任务', '测'],
      ['/comparisons', '版本对比', '比'],
      ...(preview.value ? [['/analysis', '分析与改进', '改']] : []),
    ],
  },
  {
    label: '管理',
    items: [
      ...(preview.value ? [['/resources', '资源与队列', '资']] : []),
      ['/capabilities', '能力与接入', '接'],
    ],
  },
])
const active = (path: string) =>
  path === '/'
    ? route.path === link('/') || route.path === `${link('/')}/`
    : route.path.startsWith(link(path))
</script>
<template>
  <aside id="app-navigation" class="product-sidebar" :class="{ open }" aria-label="主导航">
    <RouterLink class="product-brand" :to="link('/')"
      ><span class="product-mark">AG</span><span v-if="!collapsed">AgentGate</span></RouterLink
    ><button class="nav-close" aria-label="关闭导航" @click="$emit('close')">×</button>
    <nav>
      <section v-for="group in groups" :key="group.label" class="nav-group">
        <span v-if="!collapsed" class="nav-group-label">{{ group.label }}</span
        ><RouterLink
          v-for="item in group.items"
          :key="item[0]"
          :to="link(item[0])"
          :class="{ selected: active(item[0]) }"
          :aria-label="item[1]"
          :aria-current="active(item[0]) ? 'page' : undefined"
          ><svg
            class="nav-mark"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="icons[item[0]] || icons['/runs']" /></svg
          ><span v-if="!collapsed">{{ item[1] }}</span></RouterLink
        >
      </section>
    </nav>
    <div v-if="!collapsed" class="nav-bottom">
      {{ preview ? '模拟体验工作区' : '测评工作区' }}
    </div>
  </aside>
</template>
