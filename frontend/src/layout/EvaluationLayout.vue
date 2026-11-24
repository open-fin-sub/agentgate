<script setup lang="ts">
import { ref } from 'vue';

withDefaults(defineProps<{
  page: string;
  online: boolean | null;
  hideHeader?: boolean;
}>(), { hideHeader: false });
defineEmits<{ logout: [] }>();
const navigationOpen = ref(false);
const navigation = [
  ['overview', '测评总览'],
  ['evaluators', '评估器'],
  ['datasets', '测评集'],
  ['tasks', '测评任务'],
];
</script>
<template>
  <div
    class="app revision-app"
    :class="{ 'review-layout': ['annotations', 'evaluators'].includes(page), 'header-hidden': hideHeader }"
  >
    <header v-if="!hideHeader" class="topbar">
      <div class="brand">智能体测评中心</div>
      <div class="topbar-right">
        <button type="button" class="logout-btn" @click="$emit('logout')">登出 Logout</button>
      </div>
    </header>
    <div class="shell">
      <aside class="sidebar">
        <button
          type="button"
          class="secondary navigation-toggle"
          aria-controls="evaluation-navigation"
          :aria-expanded="navigationOpen"
          @click="navigationOpen = !navigationOpen"
        >
          导航菜单
        </button>
        <nav
          id="evaluation-navigation"
          class="evaluation-navigation"
          :class="{ 'is-open': navigationOpen }"
          aria-label="测评中心导航"
        >
          <RouterLink
            v-for="item in navigation"
            :key="item[0]"
            :to="'/' + item[0]"
            class="nav-item"
            :class="{ active: page === item[0] || (page === 'stability' && item[0] === 'tasks') }"
            @click="navigationOpen = false"
          >
            {{ item[1] }}
          </RouterLink>
          <div class="nav-group sidebar-status">
            连接状态：{{
              online === null ? '正在连接服务…' : online ? '测评后端已连接' : '服务未连接'
            }}
          </div>
        </nav>
      </aside>
      <main class="content" :class="{ 'content-wide': ['tasks', 'results', 'stability'].includes(page) }">
        <slot />
      </main>
    </div>
    <slot name="dialogs" />
  </div>
</template>

<style scoped>
.revision-app {
  --task-content-max: 2200px;
  --desktop-sidebar-width: 160px;
  container: evaluation-shell / inline-size;
}
.shell {
  max-width: calc(var(--task-content-max) + var(--desktop-sidebar-width));
  margin-inline: auto;
}
.revision-app .sidebar {
  width: var(--desktop-sidebar-width);
}
.revision-app .content-wide {
  max-width: var(--task-content-max);
}
.evaluation-navigation {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.navigation-toggle {
  display: none;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.logout-btn {
  background: #fff;
  color: #076b5d;
  border: none;
  border-radius: 6px;
  height: 34px;
  padding: 0 14px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.logout-btn:hover {
  background: #eafffb;
}
.sidebar-status {
  margin-top: auto;
  color: #9ca3af;
}
@container evaluation-shell (max-width: 768px) {
  .shell {
    flex-direction: column;
  }
  .revision-app .sidebar,
  .revision-app.header-hidden .sidebar {
    position: static;
    width: 100%;
    height: auto;
    padding: 8px 12px;
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .navigation-toggle {
    display: block;
    align-self: flex-start;
    height: 36px;
  }
  .evaluation-navigation {
    display: none;
  }
  .evaluation-navigation.is-open {
    display: flex;
    margin-top: 8px;
  }
  .revision-app .content {
    flex: auto;
    width: 100%;
    padding: 12px;
  }
}
</style>
