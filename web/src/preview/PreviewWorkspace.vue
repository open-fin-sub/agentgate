<script setup lang="ts">
import StatusNotice from '../components/StatusNotice.vue'
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { providePreview } from './workspace'
const { reset, reload, warning, conflict, viewRevision } = providePreview()
const router = useRouter()
async function confirmReset() {
  try {
    await ElMessageBox.confirm(
      '将清除本浏览器中的体验修改并恢复初始样例。真实接入数据不受影响。',
      '重置体验数据',
      { confirmButtonText: '重置体验数据', cancelButtonText: '保留修改', type: 'warning' },
    )
    reset()
    await router.push('/preview')
  } catch {
    /* cancelled */
  }
}
</script>
<template>
  <div class="preview-banner" role="note">
    <div>
      <strong>Mock 体验工作区</strong><span>模拟数据，仅用于体验。修改保存在当前浏览器。</span>
    </div>
    <button class="text-button" @click="confirmReset">重置体验</button>
  </div>
  <StatusNotice
    v-if="warning || conflict"
    class="preview-storage-alert"
    type="warning"
    :title="warning || '另一个标签页已修改体验数据。重新加载将丢弃本页未保存输入，并读取最新版本。'"
    ><el-button @click="reload">重新加载体验数据</el-button
    ><el-button @click="confirmReset">重置体验数据</el-button></StatusNotice
  >
  <RouterView :key="viewRevision" />
</template>
