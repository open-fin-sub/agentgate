<script setup lang="ts">
defineProps<{ title: string; description: string; actionLabel?: string }>()
defineEmits<{ action: [] }>()
</script>
<template>
  <section class="ux-empty" role="status">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <el-button v-if="actionLabel" type="primary" @click="$emit('action')">{{
      actionLabel
    }}</el-button>
    <div v-if="$slots.default" class="action-row"><slot /></div>
  </section>
</template>
<style scoped>
.ux-empty {
  padding: 32px 24px;
  border: 1px dashed var(--ag-line);
  border-radius: 8px;
  background: var(--ag-surface);
  text-align: center;
  margin: 16px 0;
}
.ux-empty h3 {
  font-size: 20px;
  line-height: 28px;
  margin: 0 0 8px;
}
.ux-empty p {
  color: var(--ag-body);
  margin: 8px 0 16px;
}
.action-row {
  justify-content: center;
}
</style>
