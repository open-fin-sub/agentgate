<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ items: { key: string; label: string }[]; currentKey?: string; busy?: boolean }>()
const emit = defineEmits<{ select: [key: string] }>()
const index = computed(() => props.items.findIndex(item => item.key === props.currentKey))
</script>
<template>
  <nav v-if="items.length" class="ux-detail-nav" aria-label="详情切换">
    <el-button :disabled="index <= 0 || busy" @click="emit('select', items[index - 1]!.key)">上一条</el-button>
    <span aria-live="polite">{{ index >= 0 ? `第 ${index + 1} 条，共 ${items.length} 条` : '此项不在当前筛选内' }}</span>
    <el-button :disabled="index < 0 || index >= items.length - 1 || busy" @click="emit('select', items[index + 1]!.key)">下一条</el-button>
  </nav>
</template>
<style scoped>
.ux-detail-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.ux-detail-nav span { text-align: center; }
</style>
