<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import SampleEditor from './SampleEditor.vue';
import { datasetApi } from '../../../api/datasets';
import { request } from '../../../api/evaluations';
import { annotationTasks } from '../../../stores/review-assets';
import {
  parseSampleFile,
  blankSample,
  sampleFileFormats,
  SampleImportError,
  draftSampleNameConflict,
} from '../utils/sample-import';
import importTemplateUrl from '../../../assets/dataset-import-template.xlsx?url';
import jsonTemplateUrl from '../../../assets/dataset-import-template.json?url';
import csvTemplateUrl from '../../../assets/dataset-import-template.csv?url';
import type { EvaluationCase } from '../types/index';
import type { Trace } from '../../../api/client';
import type { EvaluationRun } from '../../evaluation/types/run';
const props = defineProps<{
  datasetId: string;
  datasetName: string;
  draftCases?: readonly Pick<EvaluationCase, 'id' | 'name'>[];
}>();
const acceptedFiles = sampleFileFormats.map((format) => '.' + format.value).join(',');
const formatDescription = sampleFileFormats.map((format) => format.label).join(' / ');
const emit = defineEmits<{ close: []; manual: []; imported: [] }>();
const method = ref('manual'),
  step = ref(1),
  busy = ref(false),
  error = ref(''),
  items = ref<EvaluationCase[]>([]),
  taskId = ref(''),
  selected = ref<string[]>([]),
  saved = ref(0);
const selectedFile = ref<{ name: string; size: number } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const validationSummary = ref<HTMLElement | null>(null);
const importFailure = ref<SampleImportError | null>(null);
const fileFailure = ref('');
const hasImportErrors = computed(() => !!importFailure.value || !!fileFailure.value);
const importIssues = computed(() => importFailure.value?.issues ?? []);
const totalImportIssues = computed(() => importFailure.value?.totalIssues ?? 0);
const fileLevelFailure = computed(() => fileFailure.value || importFailure.value?.fileLevel);
const turnCount = computed(() => items.value.reduce((n, item) => n + item.turns.length, 0));
const fileDescription = computed(() => {
  if (!selectedFile.value) return '';
  const format = selectedFile.value.name.split('.').pop()?.toUpperCase() || '文件';
  const size = Math.max(1, Math.ceil(selectedFile.value.size / 1024));
  return format + ' · ' + size + ' KB';
});
const task = computed(() =>
  annotationTasks.value.find((t) => t.id === taskId.value && !t.deletedAt),
);
const sessions = computed(() => [
  ...new Set(
    Object.keys(task.value?.annotations ?? {}).map((k) => k.split('/').slice(0, 2).join('/')),
  ),
]);
const done = new Set<string>();
async function downloadTemplate(url: string, format: string) {
  error.value = '';
  try {
    const response = await fetch(url);
    if (!response.ok) throw Error('模板下载失败，请稍后重试');
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = '测评集导入模板.' + format;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (e) {
    error.value = String(e);
  }
}
function reset() {
  items.value = [];
  error.value = '';
  saved.value = 0;
  selectedFile.value = null;
  importFailure.value = null;
  fileFailure.value = '';
  done.clear();
}
const manualItem = ref<EvaluationCase>(blankSample(''));
const manualDirty = ref(false);
const manualEditor = ref<InstanceType<typeof SampleEditor> | null>(null);
function next() {
  reset();
  manualItem.value = blankSample('');
  manualDirty.value = false;
  step.value = 2;
}
async function saveManual(item: EvaluationCase) {
  items.value = [item];
  await save();
  if (step.value === 3) manualDirty.value = false;
}
function previous() {
  if (manualDirty.value && !window.confirm('放弃未保存的样本？')) return;
  manualDirty.value = false;
  step.value = 1;
  reset();
}
async function fileChanged(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  // Allow selecting a corrected file with the same name on the next attempt.
  input.value = '';
  reset();
  selectedFile.value = { name: file.name, size: file.size };
  busy.value = true;
  try {
    const names = new Set(props.draftCases?.map((item) => item.name.trim()));
    items.value = await parseSampleFile(file, names);
  } catch (e) {
    if (e instanceof SampleImportError) importFailure.value = e;
    else fileFailure.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
    await nextTick();
    if (hasImportErrors.value) {
      validationSummary.value?.focus({ preventScroll: true });
      validationSummary.value?.scrollIntoView({ block: 'nearest' });
    }
  }
}
async function readAnnotations() {
  reset();
  if (!task.value || !selected.value.length) {
    error.value = '请选择标注模板和会话';
    return;
  }
  busy.value = true;
  try {
    const result: EvaluationCase[] = [];
    for (const key of selected.value) {
      const [run, caseId] = key.split('/');
      const trace = await request<Trace>(
        '/runs/' + encodeURIComponent(run) + '/traces/' + encodeURIComponent(caseId),
      );
      const report = await request<{ run: EvaluationRun }>('/runs/' + encodeURIComponent(run));
      const source = report.run.manifest.dataset.cases.find((c) => c.id === caseId);
      if (!source) throw Error('来源测评缺少样本快照，无法保留初始状态');
      const sample = blankSample(task.value.name + ' · ' + caseId.slice(0, 8));
      sample.initial_state = JSON.parse(JSON.stringify(source.initial_state));
      sample.category = source.category;
      sample.difficulty = source.difficulty;
      sample.tags = [...source.tags];
      sample.notes =
        '标注来源：模板 ' +
        task.value.id +
        '；测评 ' +
        run +
        '；样本 ' +
        caseId +
        '；Trace ' +
        trace.trace_id;
      sample.turns = source.turns.map((sourceTurn) => {
        const id = sourceTurn.id,
          outcome = trace.turn_outcomes?.[id];
        if (!outcome) throw Error('来源会话轮次缺少 Trace 输入，无法完整导入');
        const a = task.value!.annotations[key + '/' + id];
        if (!outcome.input || typeof outcome.input !== 'object' || Array.isArray(outcome.input))
          throw Error('Trace 输入不是对象，无法安全导入');
        const turn = blankSample().turns[0];
        turn.input = JSON.parse(JSON.stringify(outcome.input));
        if (a) {
          if (Object.values(a.scores).some((s) => s == null || !Number.isFinite(s)))
            throw Error('会话存在未完成评分');
          turn.notes =
            '来源轮次 ' + id + '；人工评分 ' + JSON.stringify(a.scores) + '；备注 ' + a.note;
          sample.tags.push(...a.tags);
          if (a.expected.trim())
            turn.expectations.push({
              id: crypto.randomUUID(),
              name: '人工期望输出',
              kind: 'output',
              path: null,
              condition: { kind: 'equals', expected: a.expected },
            });
        } else turn.notes = '来源轮次 ' + id + '；保留会话上下文，此轮未标注';
        return turn;
      });
      if (!sample.turns.length) throw Error('Trace 未提供轮次，无法导入');
      sample.tags = [...new Set(sample.tags)];
      result.push(sample);
    }
    items.value = result;
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!items.value.length || busy.value || hasImportErrors.value) return;
  busy.value = true;
  error.value = '';
  try {
    let draft = await datasetApi.currentDraft(props.datasetId);
    const existingIds = new Set(draft.cases.map((item) => item.id));
    const names = new Set(draft.cases.map((item) => item.name.trim()));
    for (const item of items.value) {
      if (done.has(item.id) || existingIds.has(item.id)) continue;
      const name = item.name.trim();
      if (names.has(name)) throw Error(draftSampleNameConflict(name));
      names.add(name);
    }
    for (const item of items.value) {
      if (done.has(item.id)) continue;
      if (existingIds.has(item.id)) {
        done.add(item.id);
        saved.value = done.size;
        continue;
      }
      draft = await datasetApi.addCase(props.datasetId, item, draft.content_sha256);
      done.add(item.id);
      saved.value = done.size;
    }
    step.value = 3;
    emit('imported');
  } catch (e) {
    error.value =
      String(e) +
      '；已确认保存 ' +
      done.size +
      ' 条。未清除成功记录，可重试；重试先核对服务器样本ID。';
  } finally {
    busy.value = false;
  }
}
function close() {
  if (busy.value) return;
  if (manualDirty.value && !window.confirm('放弃未保存的样本？')) return;
  emit('close');
}
</script>
<template>
  <el-dialog
    :model-value="true"
    title="新增样本"
    class="sample-wizard-dialog"
    :width="method === 'file' && step === 2 ? 'min(1040px,96vw)' : 'min(800px,96vw)'"
    :close-on-click-modal="false"
    :show-close="!busy"
    :close-on-press-escape="!busy"
    :before-close="close"
  >
    <div class="sample-wizard">
      <div class="steps">
        <b :class="{ active: step === 1 }">1 选择方式</b><span>—</span
        ><b :class="{ active: step === 2 }">2 配置填写</b><span>—</span
        ><b :class="{ active: step === 3 }">3 完成</b>
      </div>
      <h3>{{ datasetName }} · 新增样本</h3>
      <section v-if="method === 'file' && step === 2" class="file-import">
        <div v-if="selectedFile" class="uploaded-file">
          <div class="uploaded-file-info">
            <strong>{{ selectedFile.name }}</strong
            ><span>{{ fileDescription }}</span>
          </div>
          <button class="secondary" :disabled="busy || saved > 0" @click="fileInput?.click()">
            重新上传
          </button>
        </div>
        <label v-show="!selectedFile" class="file-picker">
          选择文件
          <input
            ref="fileInput"
            type="file"
            :accept="acceptedFiles"
            aria-label="样本导入文件"
            :disabled="busy || saved > 0"
            @change="fileChanged"
          />
        </label>
        <p v-if="!selectedFile" class="file-hint">
          支持 Excel (.xlsx)、JSON、CSV，也可上传导出的样本文件。文件不超过 10MB，最多 1000
          个样本；Excel / CSV 最多 2000 行数据。
        </p>
        <div
          v-if="hasImportErrors || (items.length && !busy)"
          ref="validationSummary"
          data-testid="import-validation-summary"
          class="import-summary"
          tabindex="-1"
          :class="hasImportErrors ? 'import-summary-error' : 'import-summary-success'"
          :role="hasImportErrors ? 'alert' : 'status'"
        >
          <template v-if="hasImportErrors">
            <strong v-if="fileLevelFailure">无法读取这个文件</strong>
            <strong v-else
              >发现 {{ totalImportIssues }} 处错误，涉及
              {{ importFailure?.sampleCount ?? 0 }} 个样本</strong
            >
            <p v-if="fileLevelFailure">{{ fileFailure || importFailure?.message }}</p>
            <p v-else>请按下方位置修正文件后重新上传，当前文件尚未写入草稿。</p>
          </template>
          <template v-else>
            <strong>文件格式校验通过</strong>
            <p>已解析 {{ items.length }} 个样本、{{ turnCount }} 轮对话，可以确认导入。</p>
          </template>
        </div>
        <template v-if="importIssues.length">
          <p class="mobile-issues-hint">左右滑动表格可查看字段和问题。</p>
          <div class="import-issues-scroll" tabindex="0" aria-label="导入错误列表，可滚动查看更多">
            <table aria-label="导入错误明细" class="import-issues-table">
              <thead>
                <tr>
                  <th>样本错误位置</th>
                  <th>样本及轮次</th>
                  <th>字段</th>
                  <th>问题与修改建议</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(issue, index) in importIssues" :key="index">
                  <td>
                    <code>{{ issue.location }}</code>
                  </td>
                  <td>
                    <span>{{ issue.sampleName || issue.sampleKey || '未命名样本' }}</span
                    ><small v-if="issue.turn != null">第 {{ issue.turn }} 轮</small>
                  </td>
                  <td>{{ issue.field }}</td>
                  <td>{{ issue.message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="totalImportIssues > importIssues.length" class="issue-limit">
            共 {{ totalImportIssues }} 处错误，仅展示前
            {{ importIssues.length }} 处。请修正后重新上传，继续查看剩余问题。
          </p>
          <p class="file-hint">
            行号与原文件一致，可直接在 Excel 中定位对应单元格；JSON 使用字段路径定位。
          </p>
        </template>
      </section>
      <details v-if="method === 'file' && step === 2" class="import-template" :open="!selectedFile">
        <summary>模板下载与填写说明</summary>
        <div class="template-downloads">
          <a
            :href="importTemplateUrl"
            download="测评集导入模板.xlsx"
            class="template-download"
            @click.prevent="downloadTemplate(importTemplateUrl, 'xlsx')"
          >
            下载测评集模板（Excel）
          </a>
          <a
            :href="jsonTemplateUrl"
            download="测评集导入模板.json"
            class="template-download"
            @click.prevent="downloadTemplate(jsonTemplateUrl, 'json')"
          >
            下载测评集模板（JSON）
          </a>
          <a
            :href="csvTemplateUrl"
            download="测评集导入模板.csv"
            class="template-download"
            @click.prevent="downloadTemplate(csvTemplateUrl, 'csv')"
          >
            下载测评集模板（CSV）
          </a>
        </div>
        <p class="file-hint">
          每个模板包含一条单轮示例和字段填写说明。样本名称和每轮输入必填，其他字段可留空。
          导入后会在草稿中补齐默认值，并生成样本、轮次和测评项编号。
        </p>
        <p class="file-hint">
          Excel 和 CSV 中，单轮样本的轮次顺序填 1，留空按 1 导入。多轮样本各行填写相同名称和不重复的正整数轮次顺序。不同样本使用不同名称。
        </p>
      </details>
      <div v-if="step === 1" class="methods">
        <button
          v-for="m in [
            { id: 'file', name: '⇧ 导入测评集', description: formatDescription },
            { id: 'manual', name: '＋ 手动创建', description: '多轮对话、期望输出与工具调用' },
            {
              id: 'annotation',
              name: '✓ 从标注导入',
              description: '选择标注模板，再选择已标注会话',
            },
          ]"
          :key="m.id"
          :class="{ selected: method === m.id }"
          :disabled="m.id === 'annotation'"
          @click="method = m.id"
        >
          <strong>{{ m.name }}</strong
          ><span>{{ m.description }}</span></button
        ><button disabled><strong>✦ AI 生成数据</strong><span>生成接口尚未接通</span></button>
      </div>
      <template v-if="step === 2">
        <SampleEditor
          v-if="method === 'manual'"
          ref="manualEditor"
          hide-save-button
          hide-basic-expected-output
          :item="manualItem"
          :draft-cases="draftCases"
          :editable="true"
          :saving="busy"
          :persisted="false"
          :validation-issues="[]"
          @save="saveManual"
          @dirty-change="manualDirty = $event"
        />
        <template v-else-if="method === 'annotation'"
          ><label
            >标注模板<select
              v-model="taskId"
              aria-label="导入标注模板"
              :disabled="busy || saved > 0"
              @change="
                selected = [];
                reset();
              "
            >
              <option value="">请选择标注模板</option>
              <option
                v-for="t in annotationTasks.filter((t) => !t.deletedAt)"
                :key="t.id"
                :value="t.id"
              >
                {{ t.name }} · {{ t.app.external_target_id }}
              </option>
            </select></label
          >
          <p>
            读取当前页面已保存的标注；独立标注服务尚未接通。导入后的样本会保存到数据库，标注源本身仍为页面内存。
          </p>
          <label v-for="key in sessions" :key="key" class="session"
            ><input
              type="checkbox"
              v-model="selected"
              :value="key"
              :disabled="busy || saved > 0"
              @change="reset()"
            />测评 / 会话：{{ key }}</label
          >
          <p v-if="!sessions.length">暂无已保存的标注会话，请先在标注中完成评分并保存。</p>
          <button
            class="secondary"
            :disabled="!selected.length || busy || saved > 0"
            @click="readAnnotations"
          >
            读取所选会话
          </button></template
        >
        <p v-if="busy" role="status">正在处理，请勿关闭…</p>
        <table v-if="items.length && method !== 'manual'">
          <thead>
            <tr>
              <th>样本名称</th>
              <th>轮次</th>
              <th>期望检查</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.turns.length }}</td>
              <td>
                {{
                  item.turns.reduce(
                    (n, t) =>
                      n +
                      t.expectations.length +
                      t.required_tools.length +
                      t.forbidden_tools.length +
                      t.policy_rules.length +
                      Number(Boolean(t.expected_skill)) +
                      (t.preserved_skill_routes?.length ?? 0) +
                      (t.original_expectations?.filter((e) => e.kind === 'execution_path').length ??
                        0),
                    0,
                  )
                }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="items.length && method !== 'manual'">
          预览
          {{ items.length }}
          条；导入只新增草稿样本，不覆盖已有样本、不自动发布。批量接口尚未提供，逐条写入并报告成功数量。
        </p>
      </template>
      <div v-if="step === 3" class="complete">
        <h2>✓ {{ method === 'manual' ? '创建完成' : '导入完成' }}</h2>
        <p>{{ saved }} 条样本已保存到数据库草稿，可继续管理、编辑和发布。</p>
      </div>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
    </div>
    <template #footer
      ><div class="wizard-actions">
        <span
          v-if="step === 2 && method === 'file' && hasImportErrors"
          class="import-footer-error"
          role="status"
        >
          {{
            fileLevelFailure
              ? '请重新上传可读取的文件'
              : '请先修正 ' + totalImportIssues + ' 处错误'
          }}
        </span>
        <button class="secondary" :disabled="busy" @click="close">
          {{ step === 3 ? '返回数据样本' : '取消' }}</button
        ><button v-if="step === 1" class="primary" @click="next">下一步</button
        ><template v-if="step === 2"
          ><button class="secondary" :disabled="busy || saved > 0" @click="previous">上一步</button
          ><button
            v-if="method === 'manual'"
            class="primary"
            :disabled="busy || manualEditor?.fetchingVariables"
            :title="manualEditor?.fetchingVariables ? '正在获取初始化变量，请稍候' : ''"
            @click="manualEditor?.save()"
          >
            {{ busy ? '保存中…' : '保存样本' }}</button
          ><button
            v-else
            class="primary"
            :disabled="busy || !items.length || hasImportErrors"
            @click="save"
          >
            {{ saved ? '继续导入' : '确认导入到草稿' }}
          </button></template
        >
      </div></template
    >
  </el-dialog>
</template>
<style scoped>
.file-import {
  margin: 16px 0;
}
.uploaded-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #dce4e7;
  border-radius: 8px;
  background: #f8fafb;
}
.uploaded-file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.uploaded-file strong {
  font-size: 14px;
  overflow-wrap: anywhere;
}
.uploaded-file span,
.import-issues-table small {
  color: #7b8aa0;
  font-size: 12px;
}
.uploaded-file button {
  flex-shrink: 0;
}
.import-summary {
  position: sticky;
  top: -14px;
  z-index: 2;
  margin: 14px 0;
  padding: 14px 16px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 14px;
}
.import-summary:focus-visible {
  outline: 2px solid #008b76;
  outline-offset: 2px;
}
.import-summary-error {
  color: #a52f35;
  background: #fff3f3;
  border-color: #f1c3c6;
}
.import-summary-success {
  color: #087665;
  background: #effaf6;
  border-color: #bde5d7;
}
.sample-wizard .import-summary p {
  margin: 5px 0 0;
  color: inherit;
}
.import-issues-scroll {
  overflow: auto;
  max-height: min(260px, 28vh);
  border: 1px solid #e5e8ec;
  border-radius: 8px;
  overscroll-behavior: contain;
}
.mobile-issues-hint {
  display: none;
}
.sample-wizard .import-issues-table {
  margin-top: 0;
  table-layout: fixed;
}
.import-issues-table th,
.import-issues-table td {
  overflow-wrap: anywhere;
  vertical-align: top;
  line-height: 1.6;
}
.import-issues-table th {
  position: sticky;
  top: 0;
  background: #f6f8fa;
}
.import-issues-table th:nth-child(1) {
  width: 20%;
}
.import-issues-table th:nth-child(2) {
  width: 20%;
}
.import-issues-table th:nth-child(3) {
  width: 16%;
}
.import-issues-table small {
  display: block;
  margin-top: 4px;
}
.import-issues-table code {
  font-size: 12px;
}
.sample-wizard .issue-limit,
.import-footer-error {
  color: #a52f35;
  font-size: 12px;
}
.import-footer-error {
  margin-right: auto;
  text-align: left;
  align-self: center;
}
.import-template {
  padding: 14px 18px;
  margin: 14px 0;
  border: 1px solid #cce9e3;
  border-radius: 8px;
  background: #f2faf7;
}
.template-download {
  color: #008b76;
  font-weight: 600;
}
.template-downloads {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}
.import-template > summary {
  margin: 0 0 8px;
}
.import-template:not([open]) > summary {
  margin-bottom: 0;
}
.import-template summary {
  cursor: pointer;
  color: #008b76;
  font-weight: 600;
}
.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.wizard-actions button + button {
  margin-left: 0;
}
.wizard-actions button {
  flex-shrink: 0;
}
.sample-wizard {
  color: #344158;
}
.sample-wizard h3 {
  margin: 10px 0 14px;
}
.steps {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 14px 0;
  color: #99a3b4;
  font-size: 14px;
}
.steps .active {
  color: #008b76;
}
.methods {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.methods button {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  padding: 16px 24px;
  min-height: 104px;
  border: 1px solid #dce4ef;
  border-radius: 10px;
  background: white;
  color: #41516d;
}
.methods button.selected {
  border-color: #008b76;
  background: #f3f6ff;
}
.methods strong {
  font-size: 17px;
}
.methods span {
  font-size: 13px;
}
.methods button:disabled {
  opacity: 0.5;
}
.sample-wizard p {
  font-size: 12px;
  color: #7b8aa0;
  line-height: 1.8;
}
.sample-wizard label {
  display: block;
  margin: 14px 0;
}
.sample-wizard select,
.sample-wizard input[type='file'] {
  display: block;
  width: 100%;
  padding: 12px;
  border: 1px solid #dce4ef;
  border-radius: 8px;
  margin-top: 8px;
}
.session {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.sample-wizard table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th,
td {
  padding: 12px;
  border-bottom: 1px solid #e4eaf2;
  text-align: left;
  font-size: 13px;
}
.error {
  color: #c33 !important;
}
.complete {
  text-align: center;
  padding: 30px;
}
@media (max-width: 760px) {
  .mobile-issues-hint {
    display: block;
  }
  .wizard-actions {
    flex-wrap: wrap;
  }
  .import-footer-error {
    flex-basis: 100%;
  }
  .import-issues-table {
    min-width: 620px;
  }
  .uploaded-file {
    padding: 10px;
  }
  .wizard-actions button {
    padding: 0 10px;
  }
  .methods {
    grid-template-columns: 1fr;
  }
  .steps {
    gap: 8px;
    padding: 16px 0;
  }
}
</style>
