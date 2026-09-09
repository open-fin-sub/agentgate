<script setup lang="ts">
import MetadataGroup from '../../components/MetadataGroup.vue'
import { outcomeLabels } from './RunSupport'
import StatusNotice from '../../components/StatusNotice.vue'
import { ref, reactive, watch } from 'vue'
import type { EvaluatorVersion, Outcome } from '../types'
import { usePreview } from '../workspace'
import { evaluateSample, type TrialResult } from './PrepEvaluation'
import PayloadInput from '../../components/PayloadInput.vue'
const props = defineProps<{ version: EvaluatorVersion }>()
const { state } = usePreview()
const sample = reactive({
  input: '我想申请 80 万贷款',
  expected: '人工审核',
  output:
    '{"tool":"credit_check","arguments":{"amount":800000},"approved":false,"amount":800000,"decision":"manual_review","answer":"需要人工审核"}',
})
const example = ref('actual'),
  result = ref<TrialResult | null>(null),
  error = ref('')
const validOutput = ref(true)
function trial() {
  error.value = ''
  result.value = null
  if (!validOutput.value) {
    error.value = '请修正实际输出中的字段名称后再试评。'
    return
  }
  if (!sample.input.trim() || !sample.output.trim()) {
    error.value = '请填写样本输入和实际输出。'
    return
  }
  if (example.value !== 'actual') {
    const outcome = example.value as Outcome
    result.value = {
      name: '显式状态示例',
      outcome,
      score: outcome === 'pass' ? 1 : outcome === 'fail' ? 0.2 : null,
      reason:
        outcome === 'pass'
          ? 'Mock 状态示例：输出满足标准'
          : outcome === 'fail'
            ? 'Mock 状态示例：输出不满足标准'
            : outcome === 'NA'
              ? 'Mock 状态示例：不满足适用条件，无分数'
              : 'Mock 状态示例：评分服务超时，无分数；切回当前配置可重试',
    }
    return
  }
  result.value = evaluateSample(props.version, state, sample)
}
watch(
  () => props.version,
  () => {
    result.value = null
    error.value = ''
  },
  { deep: true },
)
</script>
<template>
  <section class="panel">
    <h2>单样本试评</h2>
    <StatusNotice
      title="检查输入、输出与评分配置是否符合预期。模型评分为模拟结果；正式判定请查看真实测评报告。"
      type="info"
    />
    <el-form label-position="top" class="preview-form"
      ><el-form-item label="样本输入"
        ><el-input v-model="sample.input" type="textarea" /></el-form-item
      ><el-form-item label="实际输出" required
        ><PayloadInput
          v-model="sample.output"
          label="实际输出"
          @validity="validOutput = $event" /></el-form-item
      ><el-form-item label="期望输出（可选）"
        ><el-input v-model="sample.expected" type="textarea" /></el-form-item
      ><el-form-item label="试评方式"
        ><el-select v-model="example"
          ><el-option label="使用当前配置试评" value="actual" /><el-option
            label="pass 状态示例"
            value="pass" /><el-option label="fail 状态示例" value="fail" /><el-option
            label="NA 不适用示例"
            value="NA" /><el-option
            label="error 失败示例"
            value="error" /></el-select></el-form-item></el-form
    ><el-button type="primary" @click="trial">运行单样本试评</el-button
    ><StatusNotice v-if="error" :title="error" type="error" />
    <div v-if="result" class="prep-result" role="status">
      <h3>{{ outcomeLabels[result.outcome] }}</h3>
      <MetadataGroup
        :items="[
          {
            label: '分数',
            value: result.score === null ? '无分数' : `${result.score.toFixed(2)} 分`,
          },
        ]"
      />
      <p>{{ result.reason }}</p>
      <ul v-if="result.children">
        <li v-for="(child, index) in result.children" :key="index">
          <strong>{{ child.name }}</strong>
          <MetadataGroup
            :items="[
              { label: '结果', value: outcomeLabels[child.outcome] },
              { label: '分数', value: child.score ?? '无分数' },
            ]"
          />
          <p>{{ child.reason }}</p>
          <ul v-if="child.children">
            <li v-for="(nested, position) in child.children" :key="position">
              <strong>{{ nested.name }}</strong>
              <MetadataGroup
                :items="[
                  { label: '结果', value: outcomeLabels[nested.outcome] },
                  { label: '分数', value: nested.score ?? '无分数' },
                ]"
              />
              <p>{{ nested.reason }}</p>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>
<style scoped>
.el-alert,
.prep-result {
  margin: 16px 0;
}
.prep-result {
  padding: 20px;
  border: 1px solid var(--ag-line);
  overflow-wrap: anywhere;
}
</style>
