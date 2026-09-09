<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePreview } from '../workspace'
const { state } = usePreview()
const target = ref('agent-service')
const runs = computed(() => state.runs.filter((r) => r.config.targetId === target.value))
const group = computed(() =>
  runs.value.filter(
    (r) =>
      r.status === 'completed' &&
      r.config.datasetId === 'ds-service' &&
      r.config.datasetVersion === 1 &&
      JSON.stringify(r.config.evaluatorRefs) ===
        JSON.stringify([
          { id: 'ev-rule', version: 1 },
          { id: 'ev-llm', version: 1 },
        ]) &&
      r.config.sampling === 100 &&
      r.config.concurrency === 4 &&
      r.config.timeout === 60 &&
      r.config.retries === 1 &&
      r.config.model === '体验模型' &&
      r.config.resourceId === 'public-model',
  ),
)
const latest = computed(() => runs.value.filter((r) => r.status === 'completed').slice(-1)[0])
const statusLabels: Record<string, string> = {
  completed: '执行完成',
  failed: '执行失败',
  scheduled: '已预约',
  queued: '排队中',
  running: '运行中',
  cancelled: '已取消',
  terminated: '已终止',
}
const pending = computed(() => state.suggestions.filter((s) => s.decision === 'pending').length)
function rate(run: (typeof state.runs)[number]) {
  const eligible = run.results.filter((r) => r.outcome !== 'NA' && r.outcome !== 'error')
  return eligible.length
    ? Math.round((100 * eligible.filter((r) => r.outcome === 'pass').length) / eligible.length)
    : null
}
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>总览</h1>
      <p>先确认质量与待办，再进入具体版本和问题证据。</p>
    </div>
    <RouterLink class="ag-button primary" to="/preview/runs/new">创建测评</RouterLink>
  </div>
  <div class="stats-grid">
    <RouterLink class="stat-box" to="/preview/targets"
      ><div class="stat-label">接入对象 · 体验目录</div>
      <div class="stat-number">
        {{ state.targets.filter((t) => t.type === 'Agent').length }} <small>Agent</small> /
        {{ state.targets.filter((t) => t.type === 'Skill').length }} <small>Skill</small>
      </div>
      <div class="stat-note">查看外部版本及可执行状态</div></RouterLink
    ><RouterLink class="stat-box" to="/preview/datasets"
      ><div class="stat-label">可复用测评集</div>
      <div class="stat-number">
        {{ state.datasets.filter((d) => !d.archived && !d.ephemeral).length }}
      </div>
      <div class="stat-note">发布版本与草稿分开管理</div></RouterLink
    ><RouterLink class="stat-box" to="/preview/runs?status=running"
      ><div class="stat-label">正在执行 / 等待</div>
      <div class="stat-number">
        {{ state.runs.filter((r) => ['running', 'queued', 'scheduled'].includes(r.status)).length }}
      </div>
      <div class="stat-note">刷新后继续查看进度</div></RouterLink
    ><RouterLink class="stat-box" to="/preview/analysis"
      ><div class="stat-label">待处理优化建议</div>
      <div class="stat-number">{{ pending }}</div>
      <div class="stat-note">采纳、修改与验证分别记录</div></RouterLink
    >
  </div>
  <div class="preview-columns">
    <section class="panel">
      <div class="panel-title">
        <h2>版本质量</h2>
        <el-select v-model="target" aria-label="质量范围" style="width: 220px"
          ><el-option
            v-for="item in state.targets"
            :key="item.id"
            :label="item.name"
            :value="item.id"
        /></el-select>
      </div>
      <p class="muted">
        固定输入：端到端回归 v1 · 标准 v1 · 公共体验模型 · 全量 12
        条。通过率以适用且无执行错误的用例为分母，review 不计通过。
      </p>
      <div v-for="run in group" :key="run.id" class="overview-trend">
        <RouterLink :to="`/preview/runs/${run.id}`"
          >{{ run.name }} · {{ run.config.targetVersion }}</RouterLink
        >
        <div class="overview-bar"><span :style="{ width: `${rate(run) ?? 0}%` }"></span></div>
        <strong>{{ rate(run) === null ? '无适用样本' : `${rate(run)}%` }}</strong>
      </div>
      <el-empty v-if="!group.length" description="此对象暂没有上述固定配置的结果。" /><RouterLink
        to="/preview/comparisons"
        >选择固定基线开展版本对比 →</RouterLink
      >
    </section>
    <section class="panel">
      <h2>接下来处理</h2>
      <div class="overview-next">
        <span class="badge fail">执行故障</span
        ><RouterLink to="/preview/runs/run-error">检查中断任务并恢复未完成项</RouterLink>
      </div>
      <div class="overview-next">
        <span class="badge review">待验证</span
        ><RouterLink to="/preview/analysis">处理路由边界与用例期望建议</RouterLink>
      </div>
      <div class="overview-next">
        <span class="badge">接入计划</span
        ><RouterLink to="/preview/capabilities">按需求核对缺失能力和接口</RouterLink>
      </div>
      <p class="muted small">
        以上为体验工作区中的实际待办状态入口；真实能力请切换工作区或查阅接入清单。
      </p>
    </section>
  </div>
  <section class="panel">
    <div class="panel-title">
      <h2>最近测评任务</h2>
      <RouterLink to="/preview/runs">查看全部任务 →</RouterLink>
    </div>
    <div class="table-scroll overview-desktop">
      <table class="data-table">
        <thead>
          <tr>
            <th>任务</th>
            <th>对象版本</th>
            <th>输入版本</th>
            <th>执行状态</th>
            <th>用例</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in [...runs].reverse().slice(0, 5)" :key="run.id">
            <td>
              <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink
              ><small>Mock 体验数据</small>
            </td>
            <td>{{ run.target.name }} {{ run.config.targetVersion }}</td>
            <td>{{ run.config.datasetId }} v{{ run.config.datasetVersion }}</td>
            <td>
              <span class="badge" :class="run.status">{{ statusLabels[run.status] }}</span>
            </td>
            <td>{{ run.results.length }} / {{ run.cases.length }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="overview-mobile">
      <article v-for="run in [...runs].reverse().slice(0, 5)" :key="run.id" class="overview-task">
        <div class="action-row">
          <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink
          ><span class="badge" :class="run.status">{{ statusLabels[run.status] }}</span>
        </div>
        <p>
          {{ run.target.name }} · {{ run.config.targetVersion }}<br />输入 v{{
            run.config.datasetVersion
          }}
          · {{ run.results.length }} / {{ run.cases.length }} 条已返回
        </p>
        <RouterLink :to="`/preview/runs/${run.id}`"
          >{{ run.status === 'completed' ? '查看报告与证据' : '查看进度与处理' }} →</RouterLink
        >
      </article>
    </div>
    <el-empty v-if="!runs.length" description="此对象暂无测评任务"
      ><RouterLink class="ag-button" :to="`/preview/runs/new?target=${target}`"
        >创建首个测评</RouterLink
      ></el-empty
    >
  </section>
  <section v-if="latest" class="panel">
    <h2>当前对象的失败线索</h2>
    <p>统计范围：{{ latest.name }}，每条用例只统计一次。</p>
    <div class="action-row">
      <RouterLink class="ag-button" :to="`/preview/runs/${latest.id}?outcome=fail`"
        >质量未通过 {{ latest.results.filter((r) => r.outcome === 'fail').length }} 条</RouterLink
      ><RouterLink class="ag-button" :to="`/preview/runs/${latest.id}?outcome=error`"
        >执行错误 {{ latest.results.filter((r) => r.outcome === 'error').length }} 条</RouterLink
      ><RouterLink class="ag-button" :to="`/preview/runs/${latest.id}?outcome=review`"
        >需要复核 {{ latest.results.filter((r) => r.outcome === 'review').length }} 条</RouterLink
      >
    </div>
  </section>
</template>
<style scoped>
.overview-mobile {
  display: none;
}
.overview-task {
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}
.overview-task .action-row {
  justify-content: space-between;
  align-items: flex-start;
}
.overview-task .action-row > a {
  font-weight: 600;
  flex: 1;
  min-width: 0;
}
.overview-task p {
  color: #6b7280;
  margin: 8px 0;
}
.overview-trend {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 1fr 55px;
  gap: 12px;
  align-items: center;
  margin: 24px 0;
}
.overview-bar {
  height: 12px;
  background: #edf0f4;
  border-radius: 4px;
  overflow: hidden;
}
.overview-bar span {
  height: 100%;
  display: block;
  background: #07ac8e;
}
.overview-next {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}
.stat-number small {
  font-size: 13px;
  font-weight: 400;
}
@media (max-width: 600px) {
  .overview-desktop {
    display: none;
  }
  .overview-mobile {
    display: block;
  }
  .overview-trend {
    grid-template-columns: 1fr 55px;
  }
  .overview-trend > a {
    grid-column: 1/-1;
  }
}
</style>
