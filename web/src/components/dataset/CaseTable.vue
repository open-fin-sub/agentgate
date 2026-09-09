<script setup lang="ts">
import MetadataGroup from '../MetadataGroup.vue'
import EmptyState from '../EmptyState.vue'
import type { EvaluationCase } from '../../types/dataset'

const props = defineProps<{
  items: EvaluationCase[]
  selectedId: string
  editable: boolean
}>()
const emit = defineEmits<{
  select: [item: EvaluationCase]
  add: []
  copy: [item: EvaluationCase]
  remove: [item: EvaluationCase]
  reorder: [ids: string[]]
}>()

const labels = {
  positive: '正例',
  negative: '负例',
  boundary: '边界',
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

function move(index: number, offset: number) {
  const ids = props.items.map((item) => item.id)
  const next = index + offset
  if (next < 0 || next >= ids.length) return
  ;[ids[index], ids[next]] = [ids[next], ids[index]]
  emit('reorder', ids)
}
</script>

<template>
  <section class="dataset-column case-list-panel">
    <div class="dataset-panel-heading">
      <div>
        <span class="step">CASES</span>
        <h2>用例</h2>
      </div>
      <el-button
        type="primary"
        size="small"
        :disabled="!editable"
        data-testid="add-case"
        @click="emit('add')"
        >新增用例</el-button
      >
    </div>
    <div class="case-list">
      <article
        v-for="(item, index) in items"
        :key="item.id"
        class="case-list-item"
        :class="{ selected: item.id === selectedId }"
        :data-testid="`case-item-${item.id}`"
        @click="emit('select', item)"
      >
        <button
          class="case-list-main case-select-button"
          @click.stop="emit('select', item)"
          :aria-current="item.id === selectedId ? 'true' : undefined"
        >
          <b>{{ item.name }}</b>
        </button>
        <MetadataGroup
          :items="[
            { label: '分类', value: labels[item.category] },
            { label: '难度', value: labels[item.difficulty] },
            { label: '轮次', value: item.turns.length },
          ]"
        />
        <p v-if="item.notes" class="muted small">备注：{{ item.notes }}</p>
        <MetadataGroup
          v-if="item.tags.length"
          :items="[{ label: '标签', value: item.tags.join('、') }]"
        />
        <div v-if="editable" class="case-row-actions" @click.stop>
          <el-button
            link
            size="small"
            :disabled="index === 0"
            aria-label="上移用例"
            @click="move(index, -1)"
            >↑</el-button
          >
          <el-button
            link
            size="small"
            :disabled="index === items.length - 1"
            aria-label="下移用例"
            @click="move(index, 1)"
            >↓</el-button
          >
          <el-button link size="small" @click="emit('copy', item)">复制</el-button>
          <el-button link size="small" type="danger" @click="emit('remove', item)">删除</el-button>
        </div>
      </article>
      <EmptyState
        v-if="!items.length"
        title="还没有用例"
        description="可新增用例，填写输入与期望结果；也可以返回测评集导入文件。"
      />
    </div>
  </section>
</template>
