<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { foldedRanges, unfoldEffect } from '@codemirror/language';
import {
  CircleCheck,
  CircleClose,
  Cpu,
  InfoFilled,
  PriceTag,
  Timer,
  Tools,
} from '@element-plus/icons-vue';
import type { Trace } from '../../../api/evaluations';
import {
  buildTracePresentation,
  formatTraceEvidence,
  summarizeTrace,
  traceEvidence,
  type TraceSummaryContext,
} from '../utils/trace-presentation';

const props = defineProps<{ trace: Trace } & TraceSummaryContext>();
const simulated = computed(() =>
  props.trace.spans.some((span) => span.attributes['platform.simulated'] === true),
);
const presentation = computed(() => buildTracePresentation(props.trace));
const summary = computed(() => summarizeTrace(props.trace, props));
const selectedId = ref<string | null>(null);
const expanded = ref(new Set<string>());
const tab = ref('io');
const tree = ref<HTMLDivElement>();
const editorContainer = ref<HTMLDivElement>();
let editor: EditorView | undefined;
let editorDocument: string | undefined;

const nodes = computed(() => presentation.value.nodes);
const parents = computed(() => {
  const ids = new Set<string>();
  for (const node of nodes.value) {
    if (node.parentIndex !== null) ids.add(nodes.value[node.parentIndex].id);
  }
  return ids;
});
const visibleNodes = computed(() => {
  const visible: boolean[] = [];
  return nodes.value.filter((node, index) => {
    const parent = node.parentIndex;
    visible[index] =
      parent === null || (visible[parent] && expanded.value.has(nodes.value[parent].id));
    return visible[index];
  });
});
const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedId.value));
const selectedModel = computed(() => {
  const span = props.trace.spans.find((item) => item.span_id === selectedId.value);
  const model = span?.attributes['trace_sdk.model'];
  return typeof model === 'string' ? model.trim() : '';
});
const evidence = computed(() => traceEvidence(props.trace, selectedId.value));
const fields = computed(() => [
  { label: '输入', value: evidence.value.input },
  { label: '输出', value: evidence.value.output },
  { label: '错误', value: evidence.value.error },
]);

function toggleNode(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
}

const highlight = StateEffect.define<{ from: number; to: number } | null>();
const highlightedSpan = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, transaction) {
    if (transaction.docChanged) value = Decoration.none;
    for (const effect of transaction.effects) {
      if (!effect.is(highlight)) continue;
      const range = effect.value;
      value = range
        ? Decoration.set([
            Decoration.mark({ class: 'trace-json-highlight' }).range(range.from, range.to),
          ])
        : Decoration.none;
    }
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function createEditorState(doc: string) {
  return EditorState.create({
    doc,
    extensions: [
      basicSetup,
      json(),
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      EditorView.lineWrapping,
      highlightedSpan,
      EditorView.contentAttributes.of({
        'aria-label': '完整 Trace JSON',
        'aria-readonly': 'true',
        tabindex: '0',
      }),
      EditorView.theme({
        '&': { height: '100%', fontSize: '13px' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-gutters': { backgroundColor: '#f7f9f8', color: '#64766e' },
        '.trace-json-highlight': { backgroundColor: '#fff0b3' },
        '&.cm-focused': { outline: '2px solid #00a88b', outlineOffset: '-2px' },
      }),
    ],
  });
}

function locateInJson(view: EditorView, id: string | null) {
  const range = id === null ? null : (presentation.value.spanRanges.get(id) ?? null);
  const effects: StateEffect<unknown>[] = [];
  if (range) {
    foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
      if (from < range.to && to > range.from) effects.push(unfoldEffect.of({ from, to }));
    });
  }
  const anchor = range?.from ?? 0;
  effects.push(highlight.of(range), EditorView.scrollIntoView(anchor, { y: 'start', yMargin: 24 }));
  view.dispatch({ selection: { anchor }, effects });
}

function durationLabel(duration: number | null, unknownLabel = '—') {
  if (duration === null) return unknownLabel;
  return duration < 1000 ? duration.toFixed(1) + ' ms' : (duration / 1000).toFixed(2) + ' s';
}

function statusLabel(status: string) {
  return status === 'ok' ? '成功' : status === 'error' ? '错误' : '未记录';
}

function displayField(value: unknown) {
  if (typeof value === 'string') return value === '' ? '""' : value;
  return JSON.stringify(value, null, 2);
}

watch(
  [editorContainer, tab, selectedId, () => presentation.value.json],
  ([container, activeTab, id, document]) => {
    if (!container || activeTab !== 'raw') return;
    if (!editor) editor = new EditorView({ parent: container, state: createEditorState(document) });
    else if (editorDocument !== document) editor.setState(createEditorState(document));
    editorDocument = document;
    locateInJson(editor, id);
  },
  { flush: 'post' },
);

watch(
  () => props.trace,
  () => {
    selectedId.value = null;
    expanded.value.clear();
    tab.value = 'io';
    tree.value?.scrollTo({ top: 0 });
  },
);
onBeforeUnmount(() => editor?.destroy());
</script>

<template>
  <section class="trace-explorer" aria-label="执行轨迹追踪">
    <header class="explorer-heading">
      <h2>执行轨迹追踪<span v-if="simulated"> · 模拟轨迹</span></h2>
      <span>{{ nodes.length }} 个环节</span>
    </header>
    <div class="explorer-panes">
      <section class="trace-pane tree-pane" aria-label="调用树">
        <dl class="trace-summary" aria-label="轨迹摘要">
          <div class="summary-id">
            <dt>Trace ID</dt>
            <dd>
              <code>{{ summary.traceId }}</code>
            </dd>
          </div>
          <div>
            <dt>Agent</dt>
            <dd>{{ summary.agentName ?? '—' }}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd :class="['node-status', summary.status]">
              {{ summary.status === 'unset' ? '—' : statusLabel(summary.status) }}
            </dd>
          </div>
          <div>
            <dt>耗时</dt>
            <dd>{{ durationLabel(summary.durationMs) }}</dd>
          </div>
          <div>
            <dt>Token</dt>
            <dd>
              {{ summary.totalTokens?.toLocaleString() ?? '—'
              }}<span v-if="summary.tokenStatus === 'partial' && summary.totalTokens !== null"
                >（部分）</span
              >
            </dd>
          </div>
          <div>
            <dt>ReAct 步数</dt>
            <dd>{{ summary.reactStepCount ?? '—' }}</dd>
          </div>
        </dl>
        <header class="pane-heading">
          <h3>调用树</h3>
          <div class="tree-actions">
            <button type="button" :disabled="!parents.size" @click="expanded = new Set(parents)">
              全部展开
            </button>
            <button type="button" :disabled="!parents.size" @click="expanded.clear()">
              全部折叠
            </button>
          </div>
        </header>
        <div ref="tree" class="tree-scroll" tabindex="0" aria-label="调用树，可滚动">
          <button
            type="button"
            class="trace-overview"
            :aria-pressed="selectedId === null"
            @click="selectedId = null"
          >
            整条轨迹
          </button>
          <p v-if="!nodes.length" class="empty-trace">尚未记录执行环节</p>
          <ul v-else class="trace-nodes">
            <li
              v-for="node in visibleNodes"
              :key="node.id"
              class="trace-branch"
              :class="{ nested: node.depth > 0 }"
              :style="{ '--node-indent': node.depth * 14 + 'px' }"
            >
              <button
                v-if="parents.has(node.id)"
                type="button"
                class="tree-toggle"
                :aria-expanded="expanded.has(node.id)"
                :aria-label="(expanded.has(node.id) ? '折叠 ' : '展开 ') + node.name"
                @click="toggleNode(node.id)"
              >
                <span class="tree-caret" aria-hidden="true" />
              </button>
              <span v-else class="tree-toggle-space" aria-hidden="true" />
              <button
                type="button"
                class="trace-node"
                :aria-pressed="selectedId === node.id"
                :aria-label="
                  [
                    node.name,
                    node.operationType,
                    statusLabel(node.status),
                    durationLabel(node.durationMs, '未记录耗时'),
                  ].join('，')
                "
                @click="selectedId = node.id"
              >
                <span class="node-label">
                  <strong :title="node.name">{{ node.name }}</strong>
                  <span class="node-meta">
                    <span>{{ node.operationType }}</span>
                    <span :class="['node-status', node.status]">{{
                      statusLabel(node.status)
                    }}</span>
                    <span v-if="node.orphan" class="orphan-note">未找到父环节</span>
                  </span>
                </span>
                <span class="node-duration">{{ durationLabel(node.durationMs) }}</span>
              </button>
            </li>
          </ul>
        </div>
      </section>
      <section class="trace-pane detail-pane" aria-label="轨迹详情">
        <header class="pane-heading">
          <h3 :title="selectedNode?.name">{{ selectedNode?.name ?? '整条轨迹' }}</h3>
        </header>
        <div v-if="selectedNode" class="detail-metadata" role="group" aria-label="节点元数据">
          <span class="detail-chip" title="节点类型">
            <el-icon aria-hidden="true"><PriceTag /></el-icon>
            <span>{{ selectedNode.operationType }}</span>
          </span>
          <span v-if="selectedModel" class="detail-chip" :title="'模型 ' + selectedModel">
            <el-icon aria-hidden="true"><Cpu /></el-icon>
            <span>{{ selectedModel }}</span>
          </span>
          <span
            v-if="selectedNode.operationType === 'tool'"
            class="detail-chip"
            :title="'工具 ' + selectedNode.name"
          >
            <el-icon aria-hidden="true"><Tools /></el-icon>
            <span>{{ selectedNode.name }}</span>
          </span>
          <span v-if="selectedNode.durationMs !== null" class="detail-chip" title="节点耗时">
            <el-icon aria-hidden="true"><Timer /></el-icon>
            <span>{{ durationLabel(selectedNode.durationMs) }}</span>
          </span>
          <span :class="['detail-chip', 'node-status', selectedNode.status]" title="节点状态">
            <el-icon aria-hidden="true">
              <CircleCheck v-if="selectedNode.status === 'ok'" />
              <CircleClose v-else-if="selectedNode.status === 'error'" />
              <InfoFilled v-else />
            </el-icon>
            <span>{{ statusLabel(selectedNode.status) }}</span>
          </span>
        </div>
        <el-tabs v-model="tab" class="trace-tabs">
          <el-tab-pane label="输入 / 输出" name="io">
            <div :key="selectedId ?? ''" class="detail-scroll">
              <section v-for="field in fields" :key="field.label" class="evidence-field">
                <h4>{{ field.label }}</h4>
                <p v-if="field.value === undefined" class="no-evidence">未记录</p>
                <pre v-else>{{ displayField(field.value) }}</pre>
              </section>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Formatted JSON" name="formatted" lazy>
            <div :key="selectedId ?? ''" class="detail-scroll">
              <pre class="formatted-json" tabindex="0">{{ formatTraceEvidence(evidence) }}</pre>
            </div>
          </el-tab-pane>
          <el-tab-pane label="完整 Trace JSON" name="raw" lazy>
            <div class="raw-json">
              <p class="raw-caption" role="status">
                {{ selectedNode ? '已定位：' + selectedNode.name : '只读 · 支持搜索和折叠' }}
              </p>
              <div ref="editorContainer" class="trace-editor" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>
  </section>
</template>

<style scoped>
.trace-explorer {
  margin-top: 20px;
  min-width: 0;
  border: 1px solid #dfe8e5;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}
.explorer-heading,
.pane-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #e8edea;
}
.explorer-heading h2,
.pane-heading h3 {
  margin: 0;
}
.explorer-heading h2 {
  font-size: 18px;
}
.explorer-heading > span,
.raw-caption {
  color: #60746a;
  font-size: 12px;
}
.explorer-heading > span {
  flex-shrink: 0;
}
.explorer-panes {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  height: clamp(470px, 65vh, 760px);
}
.trace-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.detail-pane {
  border-left: 1px solid #e8edea;
}
.trace-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  margin: 0;
  padding: 14px 16px;
  border-bottom: 1px solid #e8edea;
  background: #f7faf8;
  font-size: 13px;
}
.summary-id {
  grid-column: 1 / -1;
}
.trace-summary dt {
  margin-bottom: 2px;
  color: #60746a;
  font-size: 12px;
}
.trace-summary dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.pane-heading {
  flex: none;
  min-height: 44px;
  padding-block: 8px;
  box-sizing: border-box;
}
.pane-heading h3 {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 4px;
}
.tree-actions button,
.tree-toggle,
.trace-overview,
.trace-node {
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.tree-actions button {
  padding: 4px 6px;
  color: #00715e;
  font-size: 12px;
}
.tree-actions button:disabled {
  color: #64766e;
  cursor: default;
  opacity: 0.65;
}
.trace-explorer button:not(:disabled):hover {
  background: #eef6f2;
}
.trace-explorer button:focus-visible,
.tree-scroll:focus-visible {
  outline: 2px solid #008670;
  outline-offset: -2px;
}
.tree-scroll {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: auto;
}
.trace-overview {
  display: block;
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  text-align: start;
}
.trace-overview[aria-pressed='true'],
.trace-node[aria-pressed='true'] {
  background: #e4f4ec;
  color: #164f41;
}
.trace-nodes {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.trace-branch {
  display: flex;
  position: relative;
  align-items: center;
  padding-inline-start: min(var(--node-indent), 24%);
}
.trace-branch.nested::before {
  position: absolute;
  top: 0;
  bottom: 50%;
  inset-inline-start: min(var(--node-indent), 24%);
  width: 8px;
  border-inline-start: 1px solid #c9d8d1;
  border-bottom: 1px solid #c9d8d1;
  content: '';
  pointer-events: none;
}
.tree-toggle,
.tree-toggle-space {
  display: grid;
  flex: 0 0 24px;
  width: 24px;
  height: 28px;
  place-items: center;
}
.tree-caret {
  width: 7px;
  height: 7px;
  transform: rotate(-45deg);
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
}
.tree-toggle[aria-expanded='true'] .tree-caret {
  transform: translateY(-2px) rotate(45deg);
}
.trace-node {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  text-align: start;
}
.node-label {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.node-label strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 2px 6px;
  overflow-wrap: anywhere;
}
.node-meta,
.node-duration {
  color: #60746a;
  font-size: 11px;
}
.node-duration {
  flex: none;
}
.node-status.ok {
  color: #00715e;
}
.node-status.error {
  color: #b02e2e;
}
.orphan-note {
  color: #8c5b16;
}
.detail-metadata {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 6px 8px;
  padding: 10px 16px 4px;
}
.detail-chip {
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  padding: 4px 9px;
  border: 1px solid #e0e9e4;
  border-radius: 999px;
  background: #f7faf8;
  color: #425d53;
  font-size: 12px;
  line-height: 1.25;
}
.detail-chip .el-icon {
  flex: none;
}
.detail-chip > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trace-tabs {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.trace-tabs :deep(.el-tabs__header) {
  flex: none;
  margin: 0;
  padding-inline: 16px;
}
.trace-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}
.trace-tabs :deep(.el-tab-pane),
.detail-scroll,
.raw-json {
  height: 100%;
}
.detail-scroll {
  box-sizing: border-box;
  padding: 14px 16px;
  overflow: auto;
}
.evidence-field {
  margin-bottom: 14px;
}
.evidence-field h4 {
  margin: 0 0 6px;
  font-size: 13px;
}
.evidence-field pre,
.formatted-json {
  margin: 0;
  padding: 9px 10px;
  border: 1px solid #e8edea;
  border-radius: 6px;
  background: #f7faf8;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.no-evidence,
.empty-trace {
  margin: 0;
  padding: 6px 10px;
  color: #60746a;
  font-size: 12px;
}
.raw-json {
  display: flex;
  flex-direction: column;
}
.raw-caption {
  flex: none;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid #e8edea;
  overflow-wrap: anywhere;
}
.trace-editor {
  flex: 1;
  min-height: 0;
}
@container task-results (max-width: 760px) {
  .explorer-panes {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
  }
  .tree-scroll {
    max-height: 40vh;
  }
  .detail-pane {
    height: clamp(360px, 55vh, 600px);
    border-top: 1px solid #e8edea;
    border-left: 0;
  }
}
</style>
