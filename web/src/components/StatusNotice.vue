<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    busy?: boolean
  }>(),
  { type: 'info' },
)
</script>
<template>
  <div
    class="ux-notice"
    :class="type"
    :role="type === 'error' ? 'alert' : 'status'"
    :aria-busy="busy"
  >
    <strong v-if="title">{{ title }}</strong>
    <p v-if="message">{{ message }}</p>
    <slot />
    <div v-if="$slots.actions" class="action-row"><slot name="actions" /></div>
  </div>
</template>
<style scoped>
.ux-notice {
  padding: 16px;
  border-left: 4px solid #00745f;
  background: #e7f6f2;
  color: #17594c;
  margin: 16px 0;
  overflow-wrap: anywhere;
}
.ux-notice p {
  margin: 4px 0;
}
.warning {
  background: #fff4dc;
  color: #805000;
  border-color: #996000;
}
.error {
  background: #fff0ee;
  color: #a5251c;
  border-color: #b42318;
}
.success {
  background: #e5f5ed;
  color: #166344;
  border-color: #16704b;
}
</style>
