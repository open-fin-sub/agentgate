<script setup lang="ts">
withDefaults(
  defineProps<{ title: string; description?: string; optional?: boolean; open?: boolean }>(),
  { optional: false, open: false },
)
</script>
<template>
  <details v-if="optional" class="ux-form-section" :open="open">
    <summary>{{ title }}<span class="ux-optional">可选</span></summary>
    <p v-if="description" class="muted">{{ description }}</p>
    <div class="ux-form-body"><slot /></div>
  </details>
  <section v-else class="ux-form-section">
    <h3>{{ title }}</h3>
    <p v-if="description" class="muted">{{ description }}</p>
    <div class="ux-form-body"><slot /></div>
  </section>
</template>
<style scoped>
.ux-form-section {
  border-top: 1px solid var(--ag-line);
  padding: 20px 0;
  margin: 8px 0;
}
.ux-form-section h3 {
  font-size: 20px;
  line-height: 28px;
  margin: 0 0 12px;
}
.ux-form-section summary {
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  padding: 8px 0;
  cursor: pointer;
  min-height: 40px;
}
.ux-optional {
  font-size: 12px;
  font-weight: 400;
  color: var(--ag-muted);
  margin-left: 12px;
}
.ux-form-body {
  padding-top: 12px;
  min-width: 0;
}
</style>
