<script setup lang="ts">
import DetailDrawer from '../components/DetailDrawer.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusNotice from '../components/StatusNotice.vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { capabilities } from '../data/capabilities'
import type { Capability } from '../data/capabilities'
const route = useRoute(),
  router = useRouter()
const search = ref(String(route.query.q ?? '')),
  group = ref(String(route.query.group ?? '')),
  status = ref(String(route.query.status ?? ''))
const selected = ref<Capability | null>(null)
const groups = [...new Set(capabilities.map((item) => item.group))]
const visible = computed(() =>
  capabilities.filter(
    (item) =>
      (!group.value || item.group === group.value) &&
      (!status.value || item.status === status.value) &&
      (!search.value ||
        `${item.id} ${item.title} ${item.stories} ${item.missing} ${item.impact}`
          .toLowerCase()
          .includes(search.value.toLowerCase())),
  ),
)
function filters() {
  router.replace({
    query: {
      q: search.value || undefined,
      group: group.value || undefined,
      status: status.value || undefined,
    },
  })
}
function exportMatrix() {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            title: 'AgentGate 需求与接入差距',
            generatedAt: new Date().toISOString(),
            notice: '已核对后端基线 9686d59。各条目分别列出现有接口与联合接入缺口；Mock 入口仅用于模拟体验。',
            filters: { search: search.value, group: group.value, status: status.value },
            requirements: visible.value,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    ),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'agentgate-capability-gaps.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>
<template>
  <div class="page-intro">
    <div>
      <h1>能力与接入</h1>
      <p>从需求和用户故事出发，逐项核对体验范围、后端缺口与真实验收条件。</p>
    </div>
    <el-button @click="exportMatrix">导出当前清单</el-button>
  </div>
  <StatusNotice
    title="按条目查看已具备能力与接入缺口。体验入口使用模拟数据；真实入口连接当前服务。"
    type="info"
  />
  <div class="cap-stats">
    <div>
      <strong>{{ capabilities.length }}</strong
      ><span>需求条目</span>
    </div>
    <div><strong>24 / 24</strong><span>客户功能需求已列入</span></div>
    <div>
      <strong>{{ capabilities.filter((c) => c.status === '部分真实').length }}</strong
      ><span>已具备部分真实能力</span>
    </div>
    <div>
      <strong>{{ capabilities.filter((c) => c.status === '待后端接入').length }}</strong
      ><span>依赖后端接入</span>
    </div>
  </div>
  <section class="panel">
    <div class="action-row cap-filters">
      <el-input
        v-model="search"
        aria-label="搜索需求和用户故事"
        placeholder="搜索需求、故事编号或使用影响"
        clearable
        @input="filters"
      /><el-select
        v-model="group"
        aria-label="业务领域"
        placeholder="全部业务领域"
        clearable
        @change="filters"
        ><el-option v-for="value in groups" :key="value" :value="value" :label="value" /></el-select
      ><el-select
        v-model="status"
        aria-label="接入状态"
        placeholder="全部接入状态"
        clearable
        @change="filters"
        ><el-option
          v-for="value in ['部分真实', '待后端接入', '未来扩展']"
          :key="value"
          :value="value"
          :label="value"
      /></el-select>
    </div>
    <p class="muted">
      共 {{ visible.length }} 项。点击条目查看缺失接口、影响的使用场景和验收条件。
    </p>
    <div class="cap-table-wrap">
      <table class="cap-table">
        <thead>
          <tr>
            <th>功能需求</th>
            <th>接入情况</th>
            <th>缺失能力及使用影响</th>
            <th>入口</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in visible" :key="item.id">
            <td>
              <button class="cap-title" @click="selected = item">{{ item.title }}</button
              ><small>{{ item.id }} · {{ item.group }}</small
              ><small>{{ item.stories }}</small>
            </td>
            <td>
              <el-tag
                :type="
                  item.status === '部分真实'
                    ? 'success'
                    : item.status === '未来扩展'
                      ? 'info'
                      : 'warning'
                "
                >{{ item.status }}</el-tag
              >
              <p>{{ item.current }}</p>
            </td>
            <td>
              <p>{{ item.missing }}</p>
              <span class="muted">影响：{{ item.impact }}</span>
            </td>
            <td>
              <div class="cap-links">
                <RouterLink :to="item.route">{{
                  item.status === '未来扩展' ? '查看规划' : '体验功能'
                }}</RouterLink
                ><RouterLink v-if="item.liveRoute" :to="item.liveRoute">真实入口</RouterLink
                ><button class="text-button" @click="selected = item">接口与验收</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!visible.length"
      title="没有匹配的需求"
      description="调整需求关键词或能力状态，查看相关使用场景与接入要求。"
    ></EmptyState>
  </section>
  <DetailDrawer
    :model-value="!!selected"
    :title="selected?.title ?? '能力详情'"
    :items="visible.map(item => ({ key: item.id, label: item.title }))"
    :current-key="selected?.id"
    @select="id => selected = visible.find(item => item.id === id) ?? null"
    @update:model-value="value => { if (!value) selected = null }"
    ><template v-if="selected"
      ><el-tag>{{ selected.id }}</el-tag>
      <h3 class="cap-detail-heading">需求与用户故事</h3>
      <p>{{ selected.source }}</p>
      <p>{{ selected.stories }}</p>
      <h3>当前真实能力</h3>
      <p>{{ selected.current }}</p>
      <h3>还缺什么</h3>
      <p>{{ selected.missing }}</p>
      <h3>影响谁、怎样使用</h3>
      <p>{{ selected.impact }}</p>
      <h3>现有接口与待接入约定</h3>
      <pre class="cap-contract">{{ selected.proposal }}</pre>
      <h3>转为真实能力的验收条件</h3>
      <p>{{ selected.acceptance }}</p>
      <RouterLink :to="selected.route" @click="selected = null"
        >进入对应体验页面 →</RouterLink
      ></template
    ></DetailDrawer
  >
</template>
<style scoped>
.cap-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.cap-stats > div {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.cap-stats strong {
  font-size: 28px;
}
.cap-stats span {
  color: #6b7280;
}
.cap-filters {
  margin-bottom: 16px;
}
.cap-filters .el-input {
  flex: 2;
  min-width: 200px;
}
.cap-filters .el-select {
  flex: 1;
  min-width: 150px;
}
.cap-table-wrap {
  overflow: auto;
}
.cap-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 790px;
}
.cap-table th,
.cap-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}
.cap-table th {
  background: #f9fafb;
  color: #6b7280;
  font-size: 12px;
}
.cap-table td:first-child {
  width: 25%;
}
.cap-table td:nth-child(2) {
  width: 24%;
}
.cap-table p {
  margin: 8px 0;
}
.cap-table small {
  display: block;
  color: #6b7280;
  margin-top: 6px;
}
.cap-title {
  background: none;
  border: 0;
  padding: 0;
  color: #007d68;
  text-align: left;
  font-weight: 600;
}
.cap-links {
  display: flex;
  gap: 12px;
  flex-direction: column;
  min-width: 85px;
}
.cap-links button {
  text-align: left;
}
.cap-contract {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f3f4f6;
  padding: 16px;
  border-radius: 6px;
}
.cap-detail-heading {
  margin-top: 24px;
}
@media (max-width: 767px) {
  .cap-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .cap-stats > div {
    padding: 12px;
  }
  .cap-stats strong {
    font-size: 24px;
  }
}
</style>
