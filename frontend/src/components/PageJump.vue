<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ page: number; pageCount: number }>();
const emit = defineEmits<{ jump: [page: number] }>();
const target = ref<number | string>(props.page);

watch([() => props.page, () => props.pageCount], () => {
  target.value = props.page;
});

function jump() {
  const next = Number(target.value);
  if (Number.isSafeInteger(next) && next >= 1 && next <= props.pageCount && next !== props.page) {
    emit('jump', next);
  }
}
</script>

<template>
  <form class="page-jump" @submit.prevent="jump">
    <label>
      跳至
      <input
        v-model="target"
        aria-label="跳转页码"
        type="number"
        min="1"
        :max="pageCount"
        step="1"
        required
        :disabled="pageCount <= 1"
      />
      页
    </label>
    <button type="submit" class="link" :disabled="pageCount <= 1">跳转</button>
  </form>
</template>

<style scoped>
.page-jump,
.page-jump label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.page-jump input {
  width: 4.5em;
  padding: 4px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: inherit;
}
</style>
