<script setup lang="ts">
defineProps<{
  items: { label: string; value: string | number | boolean | null | undefined }[]
  title?: string
  inline?: boolean
}>()
</script>
<template>
  <component :is="inline ? 'span' : 'div'" class="ux-metadata" :class="{ inline }">
    <component :is="inline ? 'span' : 'h4'" v-if="title" class="metadata-title">{{
      title
    }}</component>
    <component :is="inline ? 'span' : 'dl'" class="metadata-list">
      <component
        :is="inline ? 'span' : 'div'"
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="metadata-item"
      >
        <component :is="inline ? 'span' : 'dt'" class="metadata-label">{{ item.label }}</component>
        <component :is="inline ? 'span' : 'dd'" class="metadata-value">
          {{
            item.value === null || item.value === undefined || item.value === ''
              ? '未提供'
              : item.value === true
                ? '是'
                : item.value === false
                  ? '否'
                  : item.value
          }}
        </component>
      </component>
    </component>
  </component>
</template>
<style scoped>
.ux-metadata {
  margin: 12px 0;
  min-width: 0;
}
.ux-metadata.inline {
  display: inline-flex;
  margin: 0;
}
.metadata-title {
  margin: 0 0 8px;
}
.metadata-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin: 0;
}
.metadata-item {
  min-width: 0;
  max-width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.metadata-label {
  font-size: 12px;
  line-height: 20px;
  color: var(--ag-muted-on-tint);
  flex-shrink: 0;
}
.metadata-value {
  font-size: 14px;
  line-height: 22px;
  color: var(--ag-body);
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
