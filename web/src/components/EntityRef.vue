<script setup lang="ts">
import MetadataGroup from './MetadataGroup.vue'
defineProps<{
  name: string
  type: string
  version?: string | number | null
  id?: string
  compact?: boolean
}>()
</script>
<template>
  <div class="ux-entity" :class="{ compact }">
    <strong>{{ name || '未命名' }}</strong
    ><MetadataGroup
      :items="[
        { label: '类型', value: type },
        ...(version !== undefined ? [{ label: '版本', value: version ?? '草稿' }] : []),
      ]"
    />
    <details v-if="id">
      <summary>查看编号</summary>
      <code>{{ id }}</code>
    </details>
    <slot />
  </div>
</template>
<style scoped>
.ux-entity {
  min-width: 0;
  overflow-wrap: anywhere;
}
.ux-entity > strong {
  font-size: 16px;
  line-height: 24px;
  color: var(--ag-text);
}
.ux-entity.compact > strong {
  font-size: 14px;
}
.ux-entity :deep(.ux-metadata) {
  margin: 4px 0;
}
.ux-entity summary {
  color: var(--ag-link);
  font-size: 12px;
  line-height: 24px;
  min-height: 24px;
  cursor: pointer;
}
.ux-entity code {
  display: block;
  overflow-wrap: anywhere;
  font-size: 12px;
}
</style>
