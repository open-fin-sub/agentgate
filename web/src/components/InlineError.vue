<script setup lang="ts">
defineProps<{ message?: string; id?: string }>()
</script>
<template>
  <p v-if="message" :id="id" class="ux-inline-error" role="alert">
    <strong>请检查：</strong>{{ message }}
  </p>
</template>
<style scoped>
.ux-inline-error {
  color: #b42318;
  margin: 8px 0;
  font-size: 14px;
  line-height: 22px;
  overflow-wrap: anywhere;
}
</style>
