<script setup lang="ts">
import EntityRef from '../../components/EntityRef.vue'
import MetadataGroup from '../../components/MetadataGroup.vue'
import { useDetailState } from '../../components/detailState'
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import ValueView from '../../components/ValueView.vue'
import { computed, ref } from 'vue'
import CaseEvidenceDrawer from '../components/CaseEvidenceDrawer.vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreview, uid } from '../workspace'
import type { CaseResult, Suggestion, TestCase } from '../types'
import AnalysisStatic from '../components/AnalysisStatic.vue'
import AnalysisSuggestion from '../components/AnalysisSuggestion.vue'
import { runStatusLabels } from '../comparison'

const route = useRoute(),
  router = useRouter()
const { state, change } = usePreview()
const evidenceCase = useDetailState('analysis-evidence', '')
const tab = computed(() =>
  String(
    route.query.tab ??
      (route.query.target && !route.query.run && !route.query.suggestion ? 'static' : 'runtime'),
  ),
)
const requestedSuggestion = computed(() =>
  state.suggestions.find((item) => item.id === String(route.query.suggestion ?? '')),
)
const runId = computed({
  get: () => String(route.query.run ?? requestedSuggestion.value?.runId ?? state.runs[0]?.id ?? ''),
  set: (run: string) => {
    router.replace({ query: { tab: 'runtime', run } })
  },
})
const run = computed(() => state.runs.find((item) => item.id === runId.value))
const group = computed(() => String(route.query.group ?? ''))
const tag = computed({
  get: () => String(route.query.tag ?? ''),
  set: (tag: string) => {
    router.replace({ query: { ...route.query, tag: tag || undefined } })
  },
})
const search = computed({
  get: () => String(route.query.q ?? ''),
  set: (q: string) => {
    router.replace({ query: { ...route.query, q: q || undefined } })
  },
})
const expected = computed(() => String(route.query.expected ?? ''))
const actual = computed(() => String(route.query.actual ?? ''))
const groupLabels = {
  routing: '路由偏差',
  execution: '工具 / 执行异常',
  quality: '输出 / 规则未通过',
  review: '待人工复核',
}
type IssueGroup = keyof typeof groupLabels
function issueGroup(sample: TestCase, result: CaseResult): IssueGroup | '' {
  if (result.outcome === 'error') return 'execution'
  if (result.outcome === 'review') return 'review'
  if (result.outcome !== 'fail') return ''
  if (sample.expectedSkill && result.actualSkill && sample.expectedSkill !== result.actualSkill)
    return 'routing'
  if (result.trace.some((step) => step.error)) return 'execution'
  return 'quality'
}
const records = computed(
  () =>
    run.value?.cases.flatMap((sample) => {
      const result = run.value!.results.find((item) => item.caseId === sample.id)
      return result ? [{ sample, result, group: issueGroup(sample, result) }] : []
    }) ?? [],
)
const clusters = computed(() =>
  (Object.keys(groupLabels) as IssueGroup[]).map((key) => ({
    key,
    label: groupLabels[key],
    records: records.value.filter((item) => item.group === key),
  })),
)
const tags = computed(() => [...new Set(records.value.flatMap((item) => item.sample.tags))])
const tagDistribution = computed(() =>
  tags.value
    .map((tag) => ({
      tag,
      count: records.value.filter(
        (item) => item.result.outcome === 'fail' && item.sample.tags.includes(tag),
      ).length,
    }))
    .filter((item) => item.count > 0),
)
const routed = computed(() =>
  records.value.filter(
    (item) =>
      item.sample.expectedSkill &&
      item.result.actualSkill &&
      item.result.outcome !== 'NA' &&
      item.result.outcome !== 'error',
  ),
)
const expectedSkills = computed(() => [
  ...new Set(routed.value.map((item) => item.sample.expectedSkill)),
])
const actualSkills = computed(() => [
  ...new Set(routed.value.map((item) => item.result.actualSkill)),
])
function matrixCount(expected: string, actual: string) {
  return routed.value.filter(
    (item) => item.sample.expectedSkill === expected && item.result.actualSkill === actual,
  ).length
}
const filtered = computed(() =>
  records.value.filter(
    (item) =>
      (!group.value || item.group === group.value) &&
      (!tag.value || item.sample.tags.includes(tag.value)) &&
      (!expected.value || item.sample.expectedSkill === expected.value) &&
      (!actual.value || item.result.actualSkill === actual.value) &&
      `${item.sample.id} ${item.sample.question} ${item.result.reason}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
)
const suggestions = computed(() =>
  state.suggestions
    .filter((item) => item.targetId === run.value?.config.targetId)
    .sort((a, b) => a.priority.localeCompare(b.priority)),
)
const selectedSuggestion = computed(() =>
  route.query.suggestion ? requestedSuggestion.value : suggestions.value[0],
)
const labels = { pass: '通过', fail: '失败', review: '待复核', NA: '不适用', error: '执行错误' }
function showRuntime() {
  router.replace({ query: { tab: 'runtime', run: runId.value } })
}
function showStatic() {
  router.replace({
    query: {
      tab: 'static',
      target: run.value?.config.targetId,
      version: run.value?.config.targetVersion,
    },
  })
}
function selectCluster(key: IssueGroup) {
  router.replace({
    query: {
      ...route.query,
      tab: 'runtime',
      run: runId.value,
      group: key,
      expected: undefined,
      actual: undefined,
    },
    hash: '#analysis-evidence',
  })
}
function selectMatrix(expected: string, actual: string) {
  router.replace({
    query: {
      ...route.query,
      tab: 'runtime',
      run: runId.value,
      expected,
      actual,
      group: undefined,
      tag: undefined,
      q: undefined,
    },
    hash: '#analysis-evidence',
  })
}
function clearFilters() {
  router.replace({
    query: { tab: 'runtime', run: runId.value, suggestion: route.query.suggestion },
    hash: '#analysis-evidence',
  })
}
function selectSuggestion(id: string) {
  router.replace({ query: { ...route.query, suggestion: id }, hash: '#analysis-suggestion' })
}
function generateSuggestions() {
  const current = run.value
  if (!current) return
  const issues = clusters.value.filter(
    (item) =>
      item.records.length &&
      !state.suggestions.some(
        (suggestion) =>
          suggestion.runId === current.id &&
          suggestion.caseIds.join(',') === item.records.map((row) => row.sample.id).join(','),
      ),
  )
  if (!issues.length) return
  const created: Suggestion[] = issues.map((cluster) => {
    const first = cluster.records[0]
    const kind: Suggestion['kind'] =
      cluster.key === 'routing'
        ? 'skill'
        : cluster.key === 'execution'
          ? 'tool'
          : cluster.key === 'review'
            ? 'dataset'
            : 'prompt'
    return {
      id: uid('suggest'),
      title: `${cluster.label} · 核对 ${first.sample.id} 等样本`,
      kind,
      priority: cluster.key === 'routing' || cluster.key === 'execution' ? 'P0' : 'P1',
      targetId: current.config.targetId,
      targetVersion: current.config.targetVersion,
      runId: current.id,
      caseIds: cluster.records.map((item) => item.sample.id),
      evidence: `${cluster.records.length} 条本地 Mock 发生记录。代表 ${first.sample.id}：${first.result.reason}`,
      hypothesis:
        cluster.key === 'routing'
          ? '职责描述或触发边界可能存在歧义，需要核对实际 Prompt 与 Skill 定义。此为待验证假设。'
          : cluster.key === 'execution'
            ? '工具连接、节点参数或执行环境可能异常；当前 Trace 不能单独证明根因。'
            : cluster.key === 'review'
              ? '用例期望可能不充分，建议先由业务人员核对；不能仅凭机器不确定性判为错误。'
              : '输出约束或业务边界描述可能不完整，需要先查看输入、期望和 Trace。',
      action:
        kind === 'dataset'
          ? '核对并修订测评用例，发布新输入版本后使用原 Agent 复验。'
          : '在源平台核对并修改对应定义或工具，关联同一资产新版本后执行受控回归。',
      decision: 'pending',
      feedback: '',
      linkedVersion: null,
      comparisonId: null,
    }
  })
  const saved = change(current.id, '依据本次 Mock 运行分组生成可审阅建议（根因仅为假设）', () => {
    state.suggestions.unshift(...created)
  })
  if (saved) selectSuggestion(created[0].id)
}
</script>

<template>
  <div class="page-intro">
    <div>
      <h1>分析与改进</h1>
      <p>从发生记录定位证据，再分别处理定义、工具或用例问题。所有数据与分析均为 Mock。</p>
    </div>
  </div>
  <nav class="local-tabs" aria-label="分析来源">
    <button :class="{ active: tab === 'runtime' }" @click="showRuntime">运行证据与改进</button
    ><button :class="{ active: tab === 'static' }" @click="showStatic">静态定义风险</button>
  </nav>
  <AnalysisStatic v-if="tab === 'static'" />
  <template v-else-if="tab === 'runtime'">
    <section class="panel">
      <label
        >分析运行<el-select v-model="runId"
          ><el-option v-for="item in state.runs" :key="item.id" :value="item.id" :label="item.name"
            ><EntityRef :name="item.name" type="测评任务" compact /><MetadataGroup
              :items="[
                { label: '对象版本', value: item.config.targetVersion },
                { label: '状态', value: runStatusLabels[item.status] },
              ]" /></el-option></el-select
      ></label>
    </section>
    <EmptyState
      v-if="!run"
      title="找不到测评任务"
      description="请从任务列表重新选择报告；重置体验数据可能移除了原记录。"
      ><RouterLink class="ag-button" to="/preview/runs">选择测评任务</RouterLink></EmptyState
    >
    <template v-else>
      <section class="panel">
        <div class="panel-title">
          <h2>{{ run.name }}</h2>
          <RouterLink :to="`/preview/runs/${run.id}`">查看完整报告 →</RouterLink>
        </div>
        <EntityRef
          :name="run.target.name"
          :type="run.target.type"
          :version="run.config.targetVersion"
          compact
        />
        <MetadataGroup
          :items="[
            { label: '任务状态', value: runStatusLabels[run.status] },
            { label: '已返回结果数', value: records.length },
            { label: '用例总数', value: run.cases.length },
            {
              label: '机器判定不通过',
              value: records.filter((item) => item.result.outcome === 'fail').length,
            },
            {
              label: '执行错误',
              value: records.filter((item) => item.result.outcome === 'error').length,
            },
            {
              label: '需复核',
              value: records.filter((item) => item.result.outcome === 'review').length,
            },
          ]"
        />
        <StatusNotice type="warning" v-if="run.status !== 'completed'">
          这是当前部分结果，不是完成后的完整分布。运行继续时此页自动更新。
        </StatusNotice>
        <p class="muted">
          问题按错误类型与标签分组。请选择一组查看证据，再核对可能原因；分组结果本身不是根因结论。
        </p>
        <div class="preview-grid cluster-grid">
          <button
            v-for="cluster in clusters"
            :key="cluster.key"
            class="preview-kpi cluster"
            @click="selectCluster(cluster.key)"
          >
            <span>{{ cluster.label }}</span
            ><strong>{{ cluster.records.length }}</strong
            ><small>{{ cluster.records[0] ? '查看代表用例的证据' : '暂无发生记录' }}</small>
          </button>
        </div>
        <h3>业务失败的场景标签</h3>
        <p v-if="!tagDistribution.length" class="muted">当前没有带标签的业务失败。</p>
        <div class="action-row">
          <el-button v-for="item in tagDistribution" :key="item.tag" @click="tag = item.tag"
            >{{ item.tag }}（{{ item.count }} 条）</el-button
          >
        </div>
        <p class="muted">一个样本可含多个标签，标签计数不相加为总失败数。</p>
      </section>
      <section class="panel">
        <h2>观测路由混淆矩阵</h2>
        <p>
          行 = 预期 Skill；列 = 实际 Skill。{{ routed.length }} 条有路由证据，排除
          {{ records.length - routed.length }} 条 NA / error 或缺失路由记录。点击格子筛选样本。
        </p>
        <EmptyState
          v-if="!routed.length"
          title="缺少路由记录"
          description="当前记录不足以显示路由分布。请查看下方样本证据，或选择其他已完成任务。"
        ></EmptyState>
        <div v-else class="table-scroll" tabindex="0" aria-label="路由混淆矩阵，可横向滚动">
          <table class="preview-table data-table matrix">
            <thead>
              <tr>
                <th>预期 ↓ / 实际 →</th>
                <th v-for="skill in actualSkills" :key="skill">{{ skill }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expect in expectedSkills" :key="expect">
                <th scope="row">{{ expect }}</th>
                <td v-for="act in actualSkills" :key="act">
                  <button
                    :class="{ mismatch: expect !== act && matrixCount(expect, act) > 0 }"
                    :aria-label="`预期 ${expect} 实际 ${act}，${matrixCount(expect, act)} 条样本`"
                    @click="selectMatrix(expect, act)"
                  >
                    {{ matrixCount(expect, act) }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section id="analysis-evidence" class="panel">
        <h2>筛选发生记录 → 输出与 Trace</h2>
        <StatusNotice v-if="group || expected || actual">
          <MetadataGroup
            :items="[
              { label: '问题类型', value: groupLabels[group as IssueGroup] ?? '全部类型' },
              ...(expected
                ? [
                    { label: '预期 Skill', value: expected },
                    { label: '实际 Skill', value: actual },
                  ]
                : []),
            ]"
          />
        </StatusNotice>
        <div class="action-row evidence-filters">
          <label>搜索用例<el-input v-model="search" clearable /></label
          ><label
            >场景标签<el-select v-model="tag" clearable placeholder="全部"
              ><el-option
                v-for="item in tags"
                :key="item"
                :value="item"
                :label="item" /></el-select></label
          ><el-button @click="clearFilters">清除筛选</el-button>
        </div>
        <p class="muted">{{ filtered.length }} 条匹配发生记录，筛选已保存在 URL。</p>
        <EmptyState
          v-if="!filtered.length"
          title="没有匹配的样本"
          description="请清除筛选查看其他样本；任务进行中时，结果会继续更新。"
        ></EmptyState>
        <article v-for="item in filtered" :key="item.sample.id" class="evidence-row">
          <div class="action-row">
            <strong>{{ item.sample.id }}</strong
            ><span :class="['badge', item.result.outcome]">{{ labels[item.result.outcome] }}</span
            ><span class="muted">{{ item.sample.tags.join(' / ') }}</span>
          </div>
          <h3>{{ item.sample.question }}</h3>
          <p>{{ item.result.reason }}</p>
          <details>
            <summary>展开期望与实际输出</summary>
            <strong>期望</strong>
            <ValueView :value="item.sample.expected" />
            <strong>实际输出</strong>
            <ValueView :value="item.result.output" />
          </details>
          <button class="text-button" @click="evidenceCase = item.sample.id">
            查看样本与 Trace{{ item.result.trace.length ? '' : '（Trace 未采集）' }} →
          </button>
        </article>
      </section>
      <section id="analysis-suggestion" class="panel">
        <div class="panel-title">
          <h2>可审阅改进建议</h2>
          <el-button
            :disabled="state.role === 'viewer' || !clusters.some((item) => item.records.length)"
            @click="generateSuggestions"
            >生成本次问题建议（Mock）</el-button
          >
        </div>
        <p class="muted">
          展示同一资产的建议；每条保留原运行与固定版本。采纳、外部修改、关联版本、验证结果分别记录。
        </p>
        <p v-if="state.role === 'viewer'">只读角色无权生成或修改建议。</p>
        <EmptyState
          v-if="!suggestions.length"
          title="还没有问题建议"
          description="可从当前问题记录生成建议，或先查看样本证据核对原因。"
        ></EmptyState>
        <div class="suggestion-list">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            :class="{ active: selectedSuggestion?.id === suggestion.id }"
            @click="selectSuggestion(suggestion.id)"
          >
            <MetadataGroup
              inline
              :items="[
                { label: '优先级', value: suggestion.priority },
                { label: '对象版本', value: suggestion.targetVersion },
                {
                  label: '处理状态',
                  value:
                    suggestion.decision === 'adopted'
                      ? '已采纳'
                      : suggestion.decision === 'ignored'
                        ? '已忽略'
                        : '待确认',
                },
              ]"
            /><strong>{{ suggestion.title }}</strong
            ><small
              >来源
              {{
                state.runs.find((item) => item.id === suggestion.runId)?.name ?? suggestion.runId
              }}</small
            >
          </button>
        </div>
      </section>
      <StatusNotice type="error" v-if="route.query.suggestion && !requestedSuggestion">
        找不到这条建议，请从上方建议列表重新选择。
      </StatusNotice>
      <AnalysisSuggestion
        v-if="selectedSuggestion"
        :key="selectedSuggestion.id"
        :suggestion="selectedSuggestion"
      />
    </template>
  </template>
  <EmptyState
    v-else
    title="找不到分析视图"
    description="请从测评任务查看问题证据，或从测评对象检查定义风险。"
    ><RouterLink class="ag-button" to="/preview/runs">查看测评任务</RouterLink></EmptyState
  >
  <CaseEvidenceDrawer
    v-if="run"
    v-model="evidenceCase"
    :run-id="run.id"
    :items="filtered.map((item) => ({ key: item.sample.id, label: item.sample.question }))"
  />
</template>

<style scoped>
.cluster-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 24px;
}
.cluster {
  text-align: left;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--ag-line);
  border-radius: 6px;
  color: var(--ag-body);
  background: var(--ag-surface);
}
.cluster:hover {
  border-color: var(--ag-link);
}
.cluster strong {
  display: block;
  font-size: 28px;
  margin: 6px 0;
}
.cluster small {
  display: block;
}
.matrix button {
  min-width: 60px;
  min-height: 42px;
  border: 1px solid var(--ag-line);
  border-radius: 4px;
  color: #006b58;
  background: #e7f6f2;
}
.matrix button.mismatch {
  color: #a52316;
  background: #ffede9;
  border-color: #d44f42;
}
.evidence-filters {
  align-items: center;
}
.evidence-filters label {
  width: 250px;
  max-width: 100%;
}
.evidence-row {
  border-top: 1px solid var(--ag-line);
  padding: 20px 0;
  overflow-wrap: anywhere;
}
.evidence-row h3 {
  font-size: 17px;
  margin: 10px 0;
}
.evidence-row a {
  display: inline-block;
  padding-block: 8px;
}
.suggestion-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.suggestion-list button {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: left;
  border: 1px solid var(--ag-line);
  background: var(--ag-surface);
  color: var(--ag-body);
  padding: 16px;
  border-radius: 6px;
}
.suggestion-list strong,
.suggestion-list span,
.suggestion-list small {
  display: block;
}
.suggestion-list strong {
  margin: 8px 0;
}
.suggestion-list .active {
  border-color: var(--ag-link);
  background: #e7f6f2;
}
:deep(.el-select) {
  width: 100%;
}
@media (max-width: 800px) {
  .cluster-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 450px) {
  .cluster-grid,
  .suggestion-list {
    grid-template-columns: 1fr;
  }
}
</style>
