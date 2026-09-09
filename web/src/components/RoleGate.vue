<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{ role?: 'admin' | 'evaluator' | 'reviewer' | 'viewer' | null; allow?: string[] }>(),
  { allow: () => ['admin'] },
)
const allowed = computed(() => !!props.role && props.allow.includes(props.role))
</script>
<template><slot v-if="allowed" /><slot v-else name="readonly" /></template>
