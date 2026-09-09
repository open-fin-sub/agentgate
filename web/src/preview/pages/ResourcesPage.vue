<script setup lang="ts">
import MetadataGroup from '../../components/MetadataGroup.vue'
import EmptyState from '../../components/EmptyState.vue'
import StatusNotice from '../../components/StatusNotice.vue'
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePreview, uid, downloadJson } from '../workspace'
import type { PreviewState, Credential } from '../types'
const { state, change, setRole } = usePreview()
const dialog = ref(false),
  name = ref(''),
  model = ref('体验模型'),
  simulateFailure = ref(false),
  testing = ref(''),
  limit = ref(state.publicConcurrency)
const pending = computed(() =>
  state.runs.filter((r) => ['scheduled', 'queued', 'running'].includes(r.status)),
)
function role(value: unknown) {
  setRole(value as PreviewState['role'])
}
function add() {
  if (!name.value.trim()) {
    ElMessage.warning('请填写凭据名称。')
    return
  }
  if (/sk-|api[_ -]?key|secret/i.test(name.value)) {
    ElMessage.warning('体验模式只填写别名，请勿输入真实密钥。')
    return
  }
  if (
    change('模型凭据', '新增虚构凭据别名', () =>
      state.credentials.push({
        id: uid('credential'),
        name: name.value.trim(),
        model: model.value,
        kind: 'private',
        enabled: true,
        healthy: true,
        mask: '示例凭据 · ****demo',
      }),
    )
  ) {
    dialog.value = false
    name.value = ''
  }
}
async function test(item: Credential) {
  const failThisTest = simulateFailure.value
  testing.value = item.id
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (change(item.id, '模拟连通性测试', () => (item.healthy = !failThisTest)))
    ElMessage({
      type: item.healthy ? 'success' : 'error',
      message: item.healthy
        ? 'Mock 测试通过，未调用模型服务。'
        : 'Mock 测试失败：授权已失效，请更新资源。',
    })
  testing.value = ''
}
async function toggle(item: Credential) {
  if (item.kind === 'public' && state.role !== 'admin') {
    ElMessage.warning('公共资源启停需要管理员角色。')
    return
  }
  const using = pending.value.filter((r) =>
    [r.config.executionResourceId, r.config.scoringResourceId, r.config.resourceId].includes(
      item.id,
    ),
  )
  if (item.enabled)
    try {
      await ElMessageBox.confirm(
        `停用后 ${using.length} 个待运行或运行中任务需要检查资源。此处模拟停止新调用；已有记录保留。`,
        '停用资源',
        { confirmButtonText: '停用', cancelButtonText: '取消', type: 'warning' },
      )
    } catch {
      return
    }
  change(item.id, item.enabled ? '停用资源' : '启用资源', () => (item.enabled = !item.enabled))
}
function saveLimit() {
  if (state.role !== 'admin') {
    ElMessage.warning('调整公共限制需要管理员角色。')
    return
  }
  if (!Number.isInteger(limit.value) || limit.value < 1 || limit.value > 100) {
    ElMessage.warning('公共并发上限必须为1～100的整数。')
    return
  }
  change('公共资源', '更新体验并发上限', () => (state.publicConcurrency = limit.value))
}
function exportAudit() {
  downloadJson('mock-resource-audit.json', {
    scope: '资源管理',
    records: state.audit.filter(
      (a) =>
        a.subject.includes('资源') ||
        a.subject.includes('credential') ||
        a.subject.includes('体验角色'),
    ),
  })
}
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>资源管理</h1>
      <p>管理资源别名、可用性与公共队列，明确每个调用阶段的使用来源。</p>
    </div>
    <el-button type="primary" :disabled="state.role === 'viewer'" @click="dialog = true"
      >添加体验凭据</el-button
    >
  </div>
  <section class="panel">
    <div class="panel-title">
      <h2>权限体验</h2>
      <el-select :model-value="state.role" aria-label="体验角色" style="width: 200px" @change="role"
        ><el-option label="测评人员" value="editor" /><el-option
          label="只读查看者"
          value="viewer" /><el-option label="资源管理员" value="admin"
      /></el-select>
    </div>
    <p class="muted">选择体验角色，查看不同角色可进行的操作。此选择仅用于模拟体验。</p>
  </section>
  <section class="panel">
    <div class="panel-title">
      <h2>可用模型资源</h2>
      <el-checkbox v-model="simulateFailure">模拟连通性失败</el-checkbox>
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>资源属性</th>
            <th>状态</th>
            <th>凭据</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in state.credentials" :key="item.id">
            <td>{{ item.name }}<small>Mock 体验凭据</small></td>
            <td>
              <MetadataGroup
                :items="[
                  { label: '使用范围', value: item.kind === 'public' ? '团队公共' : '本人专用' },
                  { label: '模型', value: item.model },
                ]"
              />
            </td>
            <td>
              <span class="badge" :class="item.enabled && item.healthy ? 'pass' : 'fail'">{{
                !item.enabled ? '已停用' : item.healthy ? '可用' : '测试失败'
              }}</span>
            </td>
            <td>{{ item.mask }}</td>
            <td>
              <div class="action-row">
                <el-button
                  :loading="testing === item.id"
                  :disabled="state.role === 'viewer'"
                  @click="test(item)"
                  >测试</el-button
                ><el-button
                  :disabled="
                    state.role === 'viewer' || (item.kind === 'public' && state.role !== 'admin')
                  "
                  @click="toggle(item)"
                  >{{ item.enabled ? '停用' : '启用' }}</el-button
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="muted small">
      体验模式只保存虚构别名与掩码，没有真实密钥输入框；不会向模型服务发送测试请求。
    </p>
  </section>
  <div class="preview-columns">
    <section class="panel">
      <h2>公共资源限制</h2>
      <p>
        仅使用公共资源的调用阶段受共享限制；私有执行、公共评分可以组合。私有资源仍可能等待执行节点。
      </p>
      <el-form label-position="top"
        ><el-form-item label="公共调用并发上限"
          ><el-input-number
            v-model="limit"
            :min="1"
            :max="100"
            :disabled="state.role !== 'admin'" /></el-form-item
        ><el-button :disabled="state.role !== 'admin'" @click="saveLimit"
          >保存公共限制</el-button
        ></el-form
      >
      <p class="muted small">Mock 限额用于体验队列说明，不构成生产调度性能承诺。</p>
    </section>
    <section class="panel">
      <h2>我的等待任务</h2>
      <p class="muted">
        只展示当前体验用户的任务。预计时间为本地模拟进度；真实 ETA 需要调度器反馈。
      </p>
      <div v-for="run in pending" :key="run.id" class="resource-queue">
        <RouterLink :to="`/preview/runs/${run.id}`">{{ run.name }}</RouterLink>
        <MetadataGroup
          :items="[
            {
              label: '状态',
              value:
                run.status === 'scheduled'
                  ? '等待预约时间'
                  : run.status === 'queued'
                    ? '等待可用执行位置'
                    : '正在处理用例',
            },
            {
              label: '预约时间',
              value: run.config.scheduledAt
                ? new Date(run.config.scheduledAt).toLocaleString()
                : '未预约',
            },
          ]"
        />
      </div>
      <EmptyState
        v-if="!pending.length"
        title="当前没有等待任务"
        description="可继续查看资源状态，或到任务列表查看执行结果。"
        ><RouterLink class="ag-button" to="/preview/runs">查看测评任务</RouterLink></EmptyState
      >
    </section>
  </div>
  <section class="panel">
    <div class="panel-title">
      <h2>近期操作留痕</h2>
      <el-button @click="exportAudit">导出资源记录</el-button>
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>对象</th>
            <th>操作</th>
            <th>操作者</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in state.audit.slice(0, 12)" :key="item.id">
            <td>{{ new Date(item.time).toLocaleString() }}</td>
            <td>{{ item.subject }}</td>
            <td>{{ item.action }}</td>
            <td>{{ item.actor }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <el-dialog v-model="dialog" title="添加体验凭据" width="min(520px, calc(100vw - 32px))"
    ><StatusNotice title="请填写虚构别名体验添加过程，不要输入真实密钥。" type="info" /><el-form
      label-position="top"
      class="preview-form"
      ><el-form-item label="凭据名称" required
        ><el-input
          v-model="name"
          placeholder="例如：我的回归专用资源"
          maxlength="40" /></el-form-item
      ><el-form-item label="模型"
        ><el-select v-model="model"
          ><el-option value="体验模型" label="体验模型" /><el-option
            value="体验模型 Lite"
            label="体验模型 Lite" /></el-select></el-form-item></el-form
    ><template #footer
      ><el-button @click="dialog = false">取消</el-button
      ><el-button type="primary" @click="add">添加体验凭据</el-button></template
    ></el-dialog
  >
</template>
<style scoped>
.resource-queue {
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.resource-queue small {
  color: #6b7280;
}
</style>
