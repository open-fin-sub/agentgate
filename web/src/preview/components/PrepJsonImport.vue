<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { TestCase } from '../types'
import { downloadJson } from '../workspace'
import { datasetErrors, emptyCase, syncCase } from './PrepCases'
import FormSection from '../../components/FormSection.vue'
import type { UploadFile } from 'element-plus'
const emit = defineEmits<{ imported: [cases: TestCase[]] }>()
const raw = ref(''),
  errors = ref<string[]>([]),
  parsed = ref<Record<string, unknown>[]>([]),
  ready = ref(false)
const mapping = reactive({
  question: 'question',
  expected: 'expected',
  turns: 'turns',
  variables: 'variables',
  files: 'files',
  tags: 'tags',
  category: 'category',
  difficulty: 'difficulty',
  priority: 'priority',
  note: 'note',
  expectedSkill: 'expectedSkill',
  id: 'id',
})
const fields = computed(() => [...new Set(parsed.value.flatMap((row) => Object.keys(row)))])
const labels: Record<keyof typeof mapping, string> = {
  question: '问题（必填）',
  expected: '期望',
  turns: '多轮对话',
  variables: '变量',
  files: '文件引用',
  tags: '标签',
  category: '类别',
  difficulty: '难度',
  priority: '优先级',
  note: '备注',
  expectedSkill: '期望 Skill',
  id: '用例 ID',
}
async function loadFile(upload: UploadFile) {
  const file = upload.raw
  if (!file) return
  errors.value = []
  ready.value = false
  if (!file.name.toLowerCase().endsWith('.json')) {
    errors.value = ['请选择 .json 文件。Excel 文件请从测评集页面导入。']
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.value = ['文件超过 5 MB，请拆分后重试。']
    return
  }
  try {
    raw.value = await file.text()
    parse()
  } catch {
    errors.value = ['文件读取失败，请重新选择。']
  }
}
function parse() {
  errors.value = []
  parsed.value = []
  ready.value = false
  try {
    const decoded: unknown = JSON.parse(raw.value)
    const value: unknown =
      decoded && typeof decoded === 'object' && 'source' in decoded && 'data' in decoded
        ? decoded.data
        : decoded
    const rows: unknown = Array.isArray(value)
      ? value
      : value && typeof value === 'object' && 'cases' in value
        ? value.cases
        : null
    if (!Array.isArray(rows) || !rows.length)
      throw new Error('JSON 必须为非空数组或包含 cases 数组的对象')
    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object' || Array.isArray(row))
        errors.value.push(`第 ${index + 1} 行：必须是对象`)
    })
    if (errors.value.length) return
    parsed.value = rows as Record<string, unknown>[]
    ready.value = true
  } catch (error) {
    errors.value = [`JSON 解析失败：${String(error)}`]
  }
}
function validate() {
  errors.value = []
  const cases = parsed.value.map((row, index) => {
    const item = emptyCase()
    for (const key of Object.keys(mapping) as (keyof typeof mapping)[]) {
      const value = row[mapping[key]]
      if (value === undefined) continue
      if (key === 'turns') {
        if (
          !Array.isArray(value) ||
          value.some(
            (turn) =>
              !turn ||
              typeof turn !== 'object' ||
              typeof turn.input !== 'string' ||
              (turn.expected !== undefined && typeof turn.expected !== 'string'),
          )
        )
          errors.value.push(`第 ${index + 1} 行：turns 必须是 {input, expected} 数组`)
        else
          item.turns = value.map((turn) => ({ input: turn.input, expected: turn.expected ?? '' }))
      } else if (key === 'tags' || key === 'files') {
        if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string'))
          errors.value.push(`第 ${index + 1} 行：${key} 必须是字符串数组`)
        else item[key] = value
      } else if (key === 'variables')
        item.variables = typeof value === 'string' ? value : JSON.stringify(value)
      else if (typeof value !== 'string')
        errors.value.push(`第 ${index + 1} 行：${key} 必须是字符串`)
      else Object.assign(item, { [key]: value })
    }
    item.sources = ['JSON 导入']
    return syncCase(item)
  })
  errors.value.push(...datasetErrors(cases))
  if (!errors.value.length) emit('imported', cases)
}
function template() {
  downloadJson('agentgate-cases-template.json', [
    {
      ...emptyCase(),
      id: 'example-01',
      question: '我想申请贷款',
      expected: '询问金额和期限',
      turns: [
        { input: '我想申请贷款', expected: '询问金额和期限' },
        { input: '80 万，30 年', expected: '检查申请条件' },
      ],
      variables: '{"amount":800000}',
      files: ['fixture://application.pdf'],
      tags: ['贷款'],
    },
  ])
}
function sampleExcel() {
  errors.value = [
    '模拟 Excel 校验样例（没有解析任何 Excel 文件）',
    '第 2 行：问题为空',
    '第 4 行：变量 JSON 无法解析',
    '第 5 行：优先级应为 P0、P1 或 P2',
  ]
}
function exportErrors() {
  downloadJson('import-errors.json', errors.value)
}
</script>
<template>
  <section class="panel">
    <h2>导入用例</h2>
    <p class="muted">选择文件后核对字段与错误，再确认导入。支持 .json 文件，最大 5 MB。</p>
    <el-upload :auto-upload="false" :show-file-list="false" accept=".json,application/json" :on-change="loadFile">
      <el-button type="primary">选择用例文件</el-button>
    </el-upload>
    <FormSection title="高级：粘贴文件内容" optional>
      <el-input
      v-model="raw"
      aria-label="JSON 导入内容"
      type="textarea"
      :rows="8"
      placeholder="粘贴 JSON 数组，或包含 cases 的对象"
      @input="ready = false"
    />
      <el-button @click="parse">读取粘贴内容</el-button>
    </FormSection>
    <div class="action-row">
      <el-button @click="template">下载导入模板</el-button>
      <RouterLink to="/datasets">导入 Excel 文件</RouterLink>
    </div>
    <template v-if="ready"
      ><p>已解析 {{ parsed.length }} 行，请核对字段映射。</p>
      <el-form label-position="top" class="preview-grid"
        ><el-form-item v-for="(label, key) in labels" :key="key" :label="label"
          ><el-select v-model="mapping[key]" clearable filterable allow-create
            ><el-option
              v-for="field in fields"
              :key="field"
              :value="field" /></el-select></el-form-item></el-form
      ><el-button type="primary" @click="validate">校验全部行并预览</el-button></template
    >
    <div v-if="errors.length" role="alert">
      <ul>
        <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
      </ul>
      <el-button @click="exportErrors">导出错误明细</el-button>
    </div>
  </section>
</template>
<style scoped>
input[type='file'] {
  display: block;
  max-width: 100%;
  margin: 12px 0;
}
.action-row {
  margin: 16px 0;
}
[role='alert'] {
  color: var(--el-color-danger);
  overflow-wrap: anywhere;
}
</style>
