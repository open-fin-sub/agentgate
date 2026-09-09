<script setup lang="ts">
import ValueView from '../../components/ValueView.vue'
import JsonFallback from '../../components/JsonFallback.vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview, uid, clone } from '../workspace'
import { definitionEvidence, definitionRisks } from './AnalysisDefinition'
const route = useRoute(),
  router = useRouter()
const { state, change } = usePreview()
const targetId = computed({
  get: () => String(route.query.target ?? state.targets[0]?.id ?? ''),
  set: (target: string) => {
    router.replace({
      query: {
        tab: 'static',
        target,
        version: state.targets.find((item) => item.id === target)?.versions[0]?.id,
      },
    })
  },
})
const target = computed(() => state.targets.find((item) => item.id === targetId.value))
const versionId = computed({
  get: () => String(route.query.version ?? target.value?.versions[0]?.id ?? ''),
  set: (version: string) => {
    router.replace({ query: { ...route.query, tab: 'static', version, analysis: undefined } })
  },
})
const version = computed(() => target.value?.versions.find((item) => item.id === versionId.value))
const history = computed(() =>
  state.analyses.filter(
    (item) => item.targetId === targetId.value && item.targetVersion === versionId.value,
  ),
)
const analysisId = computed({
  get: () => String(route.query.analysis ?? history.value[0]?.id ?? ''),
  set: (analysis: string) => {
    router.replace({ query: { ...route.query, analysis } })
  },
})
const analysis = computed(() => history.value.find((item) => item.id === analysisId.value))
const scenario = ref<'normal' | 'failure'>('normal')
const preparedDataset = computed(() =>
  state.datasets.find(
    (item) =>
      item.id === String(route.query.dataset ?? '') &&
      item.versions.some((version) => version.version === Number(route.query.datasetVersion)),
  ),
)
function createAnalysis(failed: boolean, sourceId?: string) {
  const current = version.value,
    asset = target.value
  if (!current || !asset) return
  const id = uid('static')
  const risks = failed ? [] : definitionRisks(current)
  const saved = change(
    id,
    `${sourceId ? `从 ${sourceId} 重试；` : ''}检查 ${asset.name} ${current.id} 固定定义；${failed ? 'Mock 检查服务暂时不可用' : '保存静态风险片段'}`,
    () => {
      state.analyses.unshift({
        id,
        targetId: asset.id,
        targetVersion: current.id,
        createdAt: new Date().toISOString(),
        status: failed ? 'failed' : 'completed',
        risks: clone(risks),
      })
    },
  )
  if (saved)
    router.replace({
      query: { ...route.query, tab: 'static', target: asset.id, version: current.id, analysis: id },
    })
}
function analyze() {
  createAnalysis(scenario.value === 'failure')
}
function retry() {
  const sourceId = analysis.value?.id
  scenario.value = 'normal'
  createAnalysis(false, sourceId)
}
</script>

<template>
  <section class="panel">
    <h2>执行前检查定义风险</h2>
    <div v-if="preparedDataset" class="notice">
      <p>
        已补充验证用例：{{ preparedDataset.name }} · v{{
          route.query.datasetVersion
        }}。静态风险需要通过实际运行验证。
      </p>
      <RouterLink
        class="ag-button primary"
        :to="{
          path: '/preview/runs/new',
          query: {
            target: targetId,
            version: versionId,
            dataset: preparedDataset.id,
            datasetVersion: route.query.datasetVersion,
          },
        }"
        >使用补充用例进行测评</RouterLink
      >
    </div>
    <p class="notice">
      静态检查读取对象定义，不执行用例。下方是可解释的 Mock
      规则检查示例；静态风险不计入运行失败率，也不是已验证根因。
    </p>
    <div class="preview-columns static-grid">
      <label
        >目标资产<el-select v-model="targetId"
          ><el-option
            v-for="item in state.targets"
            :key="item.id"
            :value="item.id"
            :label="item.name" /></el-select></label
      ><label
        >定义版本<el-select v-model="versionId"
          ><el-option
            v-for="item in target?.versions ?? []"
            :key="item.id"
            :value="item.id"
            :label="item.label" /></el-select
      ></label>
    </div>
    <div v-if="!target || !version" role="alert" class="preview-empty">
      <h3>404 · 对象或定义版本不存在</h3>
      <p>请选择有效的对象与版本。</p>
    </div>
    <template v-else>
      <details>
        <summary>本次读取的实际定义形状</summary>
        <JsonFallback :model-value="{ id: target.id, name: target.name, description: target.description, version }" readonly />
      </details>
      <p class="muted">
        本版本包含 {{ version.skillDefinitions?.length ?? 0 }} 份固定 Skill 定义和
        {{ version.toolDefinitions?.length ?? 0 }} 份工具 Schema；检查只使用这些版本内快照。
      </p>
      <p v-if="(version.skillDefinitions?.length ?? 0) < 2" class="muted">
        当前版本不具备多个关联 Skill 的固定定义，不能声称发现跨 Skill 冲突；仍可查看 Prompt
        与工具定义缺口。
      </p>
      <label class="scenario-label"
        >静态检查体验场景<el-select v-model="scenario"
          ><el-option value="normal" label="正常检查固定定义" /><el-option
            value="failure"
            label="模拟检查服务失败" /></el-select
      ></label>
      <el-button type="primary" :disabled="state.role === 'viewer'" @click="analyze"
        >检查此版本定义（Mock）</el-button
      ><RouterLink
        :to="{ path: `/preview/targets/${target.id}`, query: { version: version.id } }"
        class="definition-link"
        >查看源快照</RouterLink
      >
      <p v-if="state.role === 'viewer'" class="muted">只读角色无权创建分析记录。</p>
    </template>
  </section>
  <section class="panel">
    <h2>静态检查历史</h2>
    <p v-if="!history.length" class="preview-empty">此对象版本尚无静态分析记录。</p>
    <template v-else
      ><label
        >选择检查记录<el-select v-model="analysisId"
          ><el-option
            v-for="item in history"
            :key="item.id"
            :value="item.id"
            :label="`${new Date(item.createdAt).toLocaleString()} · ${item.status === 'completed' ? '已完成' : item.status === 'running' ? '检查中' : '失败'}`" /></el-select
      ></label>
      <p v-if="!analysis" role="alert">404 · 静态分析记录不存在或不属于所选对象版本。</p>
      <template v-else
        ><p v-if="analysis.status === 'completed'">
          {{ analysis.risks.length }} 项定义风险 / 证据缺口 · 独立于运行 Badcase
        </p>
        <p v-if="analysis.status !== 'completed'" class="notice warning">
          {{
            analysis.status === 'running'
              ? '检查尚未完成，暂不形成完整结论。'
              : 'Mock 检查服务暂时不可用，本次未返回风险结论；失败不计入运行失败率。'
          }}
        </p>
        <el-button
          v-if="analysis.status === 'failed'"
          :disabled="state.role === 'viewer'"
          @click="retry"
          >重试检查（保留失败记录）</el-button
        >
        <p v-if="!analysis.risks.length && analysis.status === 'completed'" class="notice">
          Mock 规则没有发现所检查的风险；不表示定义已经全面验证。
        </p>
        <article v-for="risk in analysis.risks" :key="risk.id" class="static-risk">
          <h3>
            <span class="badge review">{{ risk.severity }}风险</span> {{ risk.title }}
          </h3>
          <p>{{ risk.reason }}</p>
          <p v-if="risk.skills.length" class="muted">涉及 Skill：{{ risk.skills.join('、') }}</p>
          <dl class="risk-evidence" aria-label="命中的定义字段">
            <div v-for="evidence in definitionEvidence(risk)" :key="evidence.field">
              <dt>{{ evidence.field }}</dt>
              <dd>{{ evidence.value }}</dd>
            </div>
          </dl>
          <details>
            <summary>查看分析时保留的完整定义片段</summary>
            <ValueView :value="risk.fragment" />
          </details>
          <p class="muted">
            下一步：在源平台核对职责与约束，或补充对应测评用例；运行证据形成后再判断。
          </p>
          <RouterLink
            class="ag-button"
            :to="{
              path: '/preview/datasets',
              query: {
                mode: 'manual',
                target: analysis.targetId,
                version: analysis.targetVersion,
                sourceAnalysis: analysis.id,
                risk: risk.id,
                returnTo: route.fullPath,
              },
            }"
            >补充风险验证用例</RouterLink
          >
        </article></template
      ></template
    >
  </section>
</template>

<style scoped>
.static-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0;
}
.static-grid label {
  min-width: 0;
}
.static-risk {
  padding: 20px 0;
  border-top: 1px solid var(--ag-line);
  overflow-wrap: anywhere;
}
.static-risk h3 {
  font-size: 18px;
}
.risk-evidence {
  display: grid;
  gap: 12px;
  padding: 16px;
  background: var(--ag-bg);
  border: 1px solid var(--ag-line);
  border-radius: 8px;
}
.risk-evidence dt {
  font-weight: 600;
  margin-bottom: 4px;
}
.risk-evidence dd {
  margin: 0;
}
.definition-link {
  display: inline-block;
  padding: 10px;
}
.scenario-label {
  display: block;
  margin: 16px 0;
  max-width: 420px;
}
:deep(.el-select) {
  width: 100%;
}
@media (max-width: 650px) {
  .static-grid {
    grid-template-columns: 1fr;
  }
}
</style>
