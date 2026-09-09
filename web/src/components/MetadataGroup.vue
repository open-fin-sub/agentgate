<script setup lang="ts">
defineProps<{
  items: { label: string; value: string | number | boolean | null | undefined }[]
  title?: string
}>()
</script>
<template>
  <div class="ux-metadata">
    <h4 v-if="title">{{ title }}</h4>
    <dl>
      <div v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <dt>{{ item.label }}</dt>
        <dd>
          {{
            item.value === null || item.value === undefined || item.value === ''
              ? '未提供'
              : item.value === true
                ? '是'
                : item.value === false
                  ? '否'
                  : item.value
          }}
        </dd>
      </div>
    </dl>
  </div>
</template>
<style scoped>
.ux-metadata {
  margin: 12px 0;
  min-width: 0;
}
.ux-metadata h4 {
  margin: 0 0 8px;
}
.ux-metadata dl {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin: 0;
}
.ux-metadata dl > div {
  min-width: 0;
  max-width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.ux-metadata dt {
  font-size: 12px;
  line-height: 20px;
  color: var(--ag-muted);
  flex-shrink: 0;
}
.ux-metadata dd {
  font-size: 14px;
  line-height: 22px;
  color: var(--ag-body);
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
