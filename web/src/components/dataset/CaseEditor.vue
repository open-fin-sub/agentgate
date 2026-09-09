<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { EvaluationCase, ValidationIssue } from '../../types/dataset'
import ExpectationEditor from './ExpectationEditor.vue'
import MessageInput from '../MessageInput.vue'
import KeyValueEditor from '../KeyValueEditor.vue'
import FormSection from '../FormSection.vue'
import InlineError from '../InlineError.vue'
import EmptyState from '../EmptyState.vue'
const props = defineProps<{
  item: EvaluationCase | null
  editable: boolean
  saving?: boolean
  validationIssues?: ValidationIssue[]
}>()
const emit = defineEmits<{ save: [item: EvaluationCase]; dirty: [value: boolean] }>()
const form = ref<EvaluationCase | null>(null),
  savedState = ref(''),
  error = ref('')
const invalid = ref<Record<string, boolean>>({})
const editorState = computed(() => JSON.stringify(form.value))
watch(editorState, (value) => emit('dirty', props.editable && value !== savedState.value))
watch(
  () => props.item,
  (item) => {
    form.value = item ? JSON.parse(JSON.stringify(item)) : null
    savedState.value = editorState.value
    error.value = ''
    invalid.value = {}
    emit('dirty', false)
  },
  { immediate: true, deep: true },
)
function addTurn() {
  form.value?.turns.push({
    id: crypto.randomUUID(),
    input: {},
    expectations: [],
    notes: '',
  })
}
function removeTurn(index: number) {
  if (!form.value) return
  if (form.value.turns.length === 1) {
    ElMessage.warning('至少保留一轮对话。')
    return
  }
  delete invalid.value[form.value.turns[index]!.id]
  form.value.turns.splice(index, 1)
}
function save() {
  if (!form.value?.name.trim()) {
    error.value = '请输入用例名称，便于在报告中找到它。'
    return
  }
  if (Object.values(invalid.value).some(Boolean)) {
    error.value = '请先修正标出的变量名称，再保存用例。'
    return
  }
  if (form.value.turns.some((turn) => !Object.keys(turn.input).length)) {
    error.value = '每轮至少填写消息内容或一项输入变量。'
    return
  }
  error.value = ''
  emit('save', JSON.parse(JSON.stringify(form.value)))
}
</script>
<template>
  <section class="dataset-column case-editor-panel">
    <div class="dataset-panel-heading">
      <h2>{{ editable ? '用例编辑' : '用例详情' }}</h2>
      <el-button
        v-if="item && editable"
        type="primary"
        :loading="saving"
        data-testid="save-case"
        @click="save"
        >保存用例</el-button
      >
    </div>
    <EmptyState
      v-if="!form"
      title="选择一个用例"
      description="从用例列表选择要查看的内容，或新增用例填写问题和期望结果。"
    /><el-form
      v-else
      label-position="top"
      class="case-editor-form"
      :class="{ 'readonly-view': !editable }"
      :disabled="!editable"
      ><FormSection title="用例信息"
        ><el-form-item label="用例名称" required :error="error && !form.name.trim() ? error : ''"
          ><el-input
            v-model="form.name"
            data-testid="case-name"
            placeholder="例如：高风险申请应转人工审核" /></el-form-item></FormSection
      ><FormSection title="分类与备注" optional
        ><div class="case-meta-grid">
          <el-form-item label="分类"
            ><el-select v-model="form.category"
              ><el-option label="正例" value="positive" /><el-option
                label="负例"
                value="negative" /><el-option
                label="边界"
                value="boundary" /></el-select></el-form-item
          ><el-form-item label="难度"
            ><el-select v-model="form.difficulty"
              ><el-option label="简单" value="easy" /><el-option
                label="中等"
                value="medium" /><el-option label="困难" value="hard" /></el-select></el-form-item
          ><el-form-item label="标签"
            ><el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入标签后回车"
          /></el-form-item>
        </div>
        <el-form-item label="备注"
          ><el-input v-model="form.notes" type="textarea" /></el-form-item></FormSection
      ><FormSection title="对话内容"
        ><div v-for="(turn, index) in form.turns" :key="turn.id" class="turn-form">
          <h4>第 {{ index + 1 }} 轮</h4>
          <el-form-item label="用户输入" required
            ><MessageInput
              v-model="turn.input"
              :disabled="!editable"
              :label="`第${index + 1}轮消息内容`"
              @validity="invalid[turn.id] = !$event" /></el-form-item
          ><ExpectationEditor v-model="turn.expectations" :disabled="!editable" /><FormSection title="本轮备注" optional><el-form-item label="备注"><el-input v-model="turn.notes" /></el-form-item></FormSection
          ><el-button
            v-if="editable"
            text
            type="danger"
            :disabled="form.turns.length === 1"
            @click="removeTurn(index)"
            >移除第 {{ index + 1 }} 轮</el-button
          >
        </div>
        <el-button v-if="editable" data-testid="add-turn" @click="addTurn"
          >添加轮次</el-button
        ></FormSection
      ><FormSection title="会话初始变量" optional
        ><KeyValueEditor
          v-model="form.initial_state"
          :disabled="!editable"
          label="初始变量"
          @validity="invalid.initial = !$event" /></FormSection
      ><InlineError :message="error" /><InlineError
        v-for="issue in validationIssues ?? []"
        :key="issue.path"
        :message="issue.message"
      />
      <div v-if="editable" class="editor-save-footer">
        <el-button type="primary" :loading="saving" data-testid="save-case-bottom" @click="save"
          >保存用例</el-button
        >
      </div></el-form
    >
  </section>
</template>
