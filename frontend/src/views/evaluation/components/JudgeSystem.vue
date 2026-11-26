<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  api,
  kindLabel,
  pretty,
  request,
  type Definition,
  type EvaluatorDetail,
  type EvaluatorSummary,
} from '../../../api/evaluations';
import { ApiError } from '../../../utils/request';
import RuleEvaluatorCreate from './RuleEvaluatorCreate.vue';
import CodeRuleDialog from './CodeRuleDialog.vue';
import { dimensionNames, isLlmEvaluator, ruleExamples } from '../utils/evaluator-display';
import { evaluatorScenarios, evaluatorTechnicalChecks } from '../utils/evaluator-guidance';
import EvaluatorModelSelect from './EvaluatorModelSelect.vue';
import EvaluatorTaskHistory from './EvaluatorTaskHistory.vue';
import PromptEvaluatorEditor from './PromptEvaluatorEditor.vue';
import LLMGroupEditor from './LLMGroupEditor.vue';
import LLMGroupTemplateCard from './LLMGroupTemplateCard.vue';
import LLMGroupTemplatePreview from './LLMGroupTemplatePreview.vue';
import {
  copyEvaluatorDefinition,
  llmGroupTemplates,
  type LLMGroupDetail,
} from '../utils/evaluator-group';
import { isPromptEvaluator } from '../utils/evaluator-templates';
import { useAuthStore } from '../../../stores/modules/auth';
import {
  evaluatorCatalog,
  evaluatorDetails,
  loadReviewAssets,
  assetsLoading,
  assetsError,
  copy,
} from '../../../stores/review-assets';
import {
  evaluatorDesignError,
  evaluatorDraftDefinition,
  hasDimensionScoring,
  readEvaluatorDesign,
  weightError,
  type EvaluatorDesign,
} from '../utils/evaluator-design';
import '../../../styles/review-assets.scss';
const props = defineProps<{ initialId?: string; initialVersion?: string }>(),
  emit = defineEmits<{ dirtyChange: [value: boolean]; launch: [id: string] }>();
const auth = useAuthStore();
const linkLoading = ref(!!props.initialId);
const linkError = ref('');
const linkCanRetry = ref(false);
const linkedVersion = ref<{
  name: string;
  archived: boolean;
  definition: Definition | null;
} | null>(null);
const showLinkedState = computed(
  () => linkLoading.value || !!linkError.value || !!linkedVersion.value,
);
const identity = computed(() => [
  auth.loginMode,
  auth.token,
  auth.teamId,
  auth.userId,
  auth.platformReady,
]);
const category = ref<'rule' | 'llm_judge'>('rule'),
  query = ref(''),
  creatingRule = ref(false),
  rule = ref<EvaluatorSummary | null>(null);
const codeOpen = ref(false),
  codeDirty = ref(false),
  codeId = ref<string>(),
  initialRulePreset = ref<EvaluatorSummary>();
const ruleTemplatesOpen = ref(false),
  ruleTemplateQuery = ref('');
const design = ref<EvaluatorDesign | null>(null),
  detail = ref<EvaluatorDetail | null>(null),
  definition = ref<Definition | null>(null);
const editing = ref(false),
  selected = ref(0),
  viewingDraft = ref(false),
  busy = ref(false),
  deleting = ref(false),
  error = ref(''),
  notice = ref(''),
  baseline = ref('');
const promptOpen = ref(false),
  promptDirty = ref(false),
  promptInitialDetail = ref<EvaluatorDetail | null>(null),
  promptTemplateDetail = ref<EvaluatorDetail | null>(null);
const groupOpen = ref(false),
  groupChoosing = ref(false),
  groupDirty = ref(false),
  groupInitialId = ref<string>();
const previewTemplateId = ref('');
const previewTemplate = computed(() =>
  llmGroupTemplates.find((template) => template.id === previewTemplateId.value),
);
const historyOpen = ref(false),
  historyLoading = ref(false),
  historyError = ref(''),
  versions = ref<Definition[]>([]);
const active = computed(() => design.value?.dimensions[selected.value]);
const dirty = computed(() => editing.value && JSON.stringify(design.value) !== baseline.value);
const ownDesign = computed(
  () => detail.value?.evaluator.source === 'user' && hasDimensionScoring(definition.value),
);
// Preserve this demo dependency for existing hybrid evaluators, without a standalone page entry.
const hiddenEvaluatorId = 'a99302af-54b0-45ba-b2a1-0f643488c4b1';
const builtinNames: Record<string, string> = {
  skill_routing: '技能路由',
  required_tool: '必需工具调用',
  forbidden_tool: '禁止工具调用',
  tool_arguments: '工具参数',
  final_state: '最终状态',
  final_output: '最终输出',
};
function displayName(evaluator: EvaluatorSummary) {
  return evaluator.source === 'builtin'
    ? (builtinNames[evaluator.implementation_id] ?? evaluator.name)
    : evaluator.name;
}
function hiddenEvaluator(evaluator: EvaluatorSummary) {
  return (
    evaluator.id === hiddenEvaluatorId ||
    (evaluator.source === 'builtin' && evaluator.implementation_id === 'policy_compliance')
  );
}
const rulePresets = computed(() =>
  evaluatorCatalog.value
    .filter(
      (e) => e.source === 'builtin' && e.kind === 'rule' && e.latest_version && !hiddenEvaluator(e),
    )
    .map((e) => ({ ...e, name: displayName(e) })),
);
const visibleRuleTemplates = computed(() => {
  const keyword = ruleTemplateQuery.value.trim().toLowerCase();
  return rulePresets.value.filter((preset) =>
    [preset.name, preset.description, evaluatorScenarios[preset.implementation_id]].some(
      (text) => text?.toLowerCase().includes(keyword),
    ),
  );
});
const entries = computed(() =>
  evaluatorCatalog.value.filter(
    (e) =>
      (category.value === 'rule' ? e.kind === 'rule' : isLlmEvaluator(e.kind)) &&
      !(e.source === 'builtin' && isLlmEvaluator(e.kind)) &&
      !e.owner_evaluator_id &&
      !hiddenEvaluator(e) &&
      (e.latest_version ||
        ((isLlmEvaluator(e.kind) || e.implementation_id === 'code_rule') && e.has_draft)) &&
      `${displayName(e)} ${e.name}`.toLowerCase().includes(query.value.trim().toLowerCase()),
  ),
);
const visibleGroupTemplates = computed(() =>
  category.value === 'llm_judge'
    ? llmGroupTemplates.filter((template) =>
        (template.name + template.description).includes(query.value.trim()),
      )
    : [],
);
const models = computed(() =>
  Array.from(
    new Map(
      Object.values(evaluatorDetails.value)
        .flatMap((d) => [d.latest, d.draft])
        .filter((d) => d?.kind === 'llm_judge')
        .map((d) => d!.config.model as { provider_id: string; model_id: string })
        .filter(Boolean)
        .map((m) => [JSON.stringify(m), m]),
    ).entries(),
  ),
);
const total = computed(
  () => design.value?.dimensions.reduce((sum, d) => sum + (d.weight ?? 0), 0) ?? 0,
);
const canLaunch = computed(
  () =>
    !!detail.value?.latest &&
    detail.value.evaluator.enabled &&
    !viewingDraft.value &&
    design.value?.version === detail.value.latest.version,
);
watch([dirty, busy, promptDirty, groupDirty, codeDirty], (values) =>
  emit('dirtyChange', values.some(Boolean)),
);
let openSequence = 0;
let disposed = false;
function chooseRuleTemplate() {
  ruleTemplateQuery.value = '';
  ruleTemplatesOpen.value = true;
}
function createRule(preset?: EvaluatorSummary) {
  ruleTemplatesOpen.value = false;
  codeId.value = undefined;
  initialRulePreset.value = preset;
  codeOpen.value = true;
}
function create() {
  openSequence++;
  groupInitialId.value = undefined;
  groupChoosing.value = true;
  groupOpen.value = true;
}
function useCustomTemplate(value: EvaluatorDetail) {
  const source = value.draft ?? value.latest;
  if (!source) return;
  groupOpen.value = false;
  groupChoosing.value = false;
  if (isPromptEvaluator(source)) {
    promptInitialDetail.value = null;
    promptTemplateDetail.value = copy(value);
    promptOpen.value = true;
  } else if (hasDimensionScoring(source)) {
    detail.value = null;
    definition.value = copyEvaluatorDefinition(source);
    design.value = {
      ...readEvaluatorDesign(value.evaluator, definition.value),
      id: '',
      version: null,
      name: value.evaluator.name.slice(0, 46) + '（副本）',
    };
    viewingDraft.value = true;
    beginEdit();
  }
}
function canRemoveEvaluator(evaluator: EvaluatorSummary) {
  return (
    evaluator.source === 'user' &&
    !evaluator.owner_evaluator_id &&
    (isLlmEvaluator(evaluator.kind) || (evaluator.kind === 'rule' && !!evaluator.latest_version))
  );
}
async function removeEvaluator(evaluator: EvaluatorSummary) {
  if (
    disposed ||
    !auth.authenticated ||
    busy.value ||
    deleting.value ||
    !canRemoveEvaluator(evaluator)
  )
    return;
  const currentIdentity = identity.value;
  let action = evaluator.latest_version ? '归档' : '删除';
  deleting.value = true;
  error.value = '';
  try {
    const path = `/evaluators/${encodeURIComponent(evaluator.id)}`;
    const group =
      evaluator.kind === 'llm_group' ? await request<LLMGroupDetail>(path + '/llm-group') : null;
    if (disposed || currentIdentity !== identity.value) return;
    if (group) action = group.latest_version ? '归档' : '删除';
    await ElMessageBox.confirm(
      action === '归档'
        ? `归档评估器“${evaluator.name}”？归档后将从评估器列表和新建任务的可选项中移除，历史测评报告和已发布版本将保留。`
        : `删除未发布评估器“${evaluator.name}”及其草稿？此操作不可恢复。`,
      action + '评估器',
      { type: 'warning', confirmButtonText: action, cancelButtonText: '取消' },
    );
    if (disposed || currentIdentity !== identity.value) return;
    if (group && !group.latest_version) {
      await request(path + '/llm-group/draft', 'DELETE', {
        expected_draft_id: group.definition.id,
        expected_draft_updated_at: group.definition.updated_at,
      });
    } else {
      await request(path, 'DELETE');
    }
    if (disposed || currentIdentity !== identity.value) return;
    evaluatorCatalog.value = evaluatorCatalog.value.filter((item) => item.id !== evaluator.id);
    delete evaluatorDetails.value[evaluator.id];
    await loadReviewAssets();
    if (!disposed && currentIdentity === identity.value) ElMessage.success('评估器已' + action);
  } catch (cause) {
    if (!disposed && currentIdentity === identity.value && cause !== 'cancel' && cause !== 'close')
      error.value = action + '失败。' + String(cause);
  } finally {
    deleting.value = false;
  }
}
function beginEdit() {
  editing.value = true;
  selected.value = 0;
  error.value = '';
  notice.value = '';
  baseline.value = JSON.stringify(design.value);
}
function showDefinition(value: EvaluatorDetail, source: Definition, draft: boolean) {
  detail.value = value;
  definition.value = copy(source);
  design.value = readEvaluatorDesign(value.evaluator, source);
  viewingDraft.value = draft;
  editing.value = false;
  selected.value = 0;
  baseline.value = JSON.stringify(design.value);
}
async function refreshDetail(id: string) {
  if (disposed || !auth.authenticated) return;
  const currentIdentity = identity.value;
  const value = await api.evaluator(id);
  if (disposed || currentIdentity !== identity.value) return;
  evaluatorDetails.value[id] = value;
  const source = value.draft ?? value.latest;
  if (!source) throw new Error('此评估器暂无草稿或发布版本。');
  showDefinition(value, source, !!value.draft);
  await loadReviewAssets();
}
async function open(e: EvaluatorSummary, loaded?: EvaluatorDetail) {
  if (disposed || !auth.authenticated || busy.value) return;
  if (e.implementation_id === 'code_rule') {
    codeId.value = e.id;
    initialRulePreset.value = undefined;
    codeOpen.value = true;
    return;
  }
  if (e.kind === 'llm_group') {
    openSequence++;
    groupInitialId.value = e.id;
    groupChoosing.value = false;
    groupOpen.value = true;
    return;
  }
  if (e.kind === 'rule') {
    rule.value = e;
    return;
  }
  const sequence = ++openSequence;
  const currentIdentity = identity.value;
  error.value = '';
  notice.value = '';
  busy.value = true;
  try {
    const value = loaded ?? (await api.evaluator(e.id));
    if (sequence !== openSequence || currentIdentity !== identity.value) return;
    const source = value.draft ?? value.latest;
    if (!source) throw new Error('此评估器暂无草稿或发布版本。');
    if (isPromptEvaluator(source)) {
      promptTemplateDetail.value = null;
      promptInitialDetail.value = value;
      promptOpen.value = true;
    } else showDefinition(value, source, !!value.draft);
  } catch (e) {
    if (sequence === openSequence && currentIdentity === identity.value) error.value = String(e);
  } finally {
    if (sequence === openSequence) busy.value = false;
  }
}
async function edit() {
  if (!design.value || busy.value) return;
  if (!ownDesign.value) {
    design.value = {
      ...copy(design.value),
      id: '',
      name: design.value.name + '（副本）',
      version: null,
    };
    if (!hasDimensionScoring(definition.value))
      design.value.dimensions.forEach((d) => (d.weight = 100));
    detail.value = null;
    definition.value = null;
    viewingDraft.value = true;
    beginEdit();
    return;
  }
  if (viewingDraft.value) {
    beginEdit();
    return;
  }
  if (detail.value!.draft) {
    showDefinition(detail.value!, detail.value!.draft, true);
    beginEdit();
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const id = design.value.id;
    const draft = await request<Definition>(
      '/evaluators/' + encodeURIComponent(id) + '/drafts',
      'POST',
      {
        based_on_version: design.value.version,
      },
    );
    showDefinition({ ...detail.value!, draft }, draft, true);
    beginEdit();
    await loadReviewAssets();
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
function close() {
  if (busy.value || (dirty.value && !window.confirm('放弃未保存的评估器修改？'))) return;
  openSequence++;
  design.value = null;
  detail.value = null;
  definition.value = null;
  editing.value = false;
  error.value = '';
  notice.value = '';
}
async function save() {
  const d = design.value;
  if (!d || busy.value) return;
  error.value = evaluatorDesignError(d);
  if (error.value) return;
  busy.value = true;
  notice.value = '';
  try {
    const draft = evaluatorDraftDefinition(d, definition.value);
    if (!d.id) {
      const created = await request<{ evaluator: { id: string } }>('/evaluators', 'POST', {
        name: d.name,
        description: d.description,
        draft,
      });
      d.id = created.evaluator.id;
    } else {
      const path = '/evaluators/' + encodeURIComponent(d.id);
      if (
        d.name !== detail.value?.evaluator.name ||
        d.description !== detail.value?.evaluator.description
      )
        await request(path, 'PATCH', { name: d.name, description: d.description });
      await request(path + '/drafts/current', 'PUT', draft);
    }
    await refreshDetail(d.id);
    notice.value = '草稿已保存到服务器；发布后可用于测评。';
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
async function publish() {
  if (!detail.value?.draft || editing.value || busy.value) return;
  busy.value = true;
  error.value = '';
  notice.value = '';
  const id = detail.value.evaluator.id,
    path = '/evaluators/' + encodeURIComponent(id);
  let published: Definition | null = null;
  try {
    published = await request<Definition>(path + '/drafts/publish', 'POST');
    showDefinition(
      {
        ...detail.value,
        latest: published,
        draft: null,
      },
      published,
      false,
    );
    if (!detail.value!.evaluator.enabled) {
      await request(path, 'PATCH', { enabled: true });
      detail.value!.evaluator.enabled = true;
    }
    await refreshDetail(id);
    notice.value = `v${published.version} 已发布并启用，可用于测评。`;
  } catch (e) {
    if (published) {
      try {
        await refreshDetail(id);
      } catch {
        /* Keep the successful publication distinct from a failed refresh. */
      }
      error.value = `v${published.version} 已发布，但启用或刷新失败：${String(e)}。请刷新后检查启用状态。`;
    } else error.value = String(e);
  } finally {
    busy.value = false;
  }
}
async function enable() {
  if (!detail.value || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const id = detail.value.evaluator.id;
    await request('/evaluators/' + encodeURIComponent(id), 'PATCH', { enabled: true });
    await refreshDetail(id);
    notice.value = '评估器已启用。';
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
async function showHistory() {
  if (!detail.value || busy.value) return;
  historyOpen.value = true;
  historyLoading.value = true;
  historyError.value = '';
  versions.value = [];
  try {
    versions.value = await request<Definition[]>(
      '/evaluators/' + encodeURIComponent(detail.value.evaluator.id) + '/versions',
    );
  } catch (e) {
    historyError.value = String(e);
  } finally {
    historyLoading.value = false;
  }
}
function viewVersion(value: Definition) {
  if (!detail.value) return;
  showDefinition(detail.value, value, false);
  historyOpen.value = false;
  error.value = '';
  notice.value = '已发布版本只读；编辑会创建草稿，原版本保持不变。';
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || busy.value) {
    event.preventDefault();
    event.returnValue = '';
  }
}
async function loadLinkedEvaluator() {
  if (!props.initialId) return;
  const context = identity.value;
  const isCurrent = () => !disposed && context === identity.value;
  linkLoading.value = true;
  linkError.value = '';
  linkCanRetry.value = false;
  let resource = '评估器';
  try {
    const id = decodeURIComponent(props.initialId);
    const value = await api.evaluator(id);
    if (!isCurrent()) return;
    if (props.initialVersion || value.evaluator.archived) {
      let published = value.latest;
      if (props.initialVersion && published?.version !== props.initialVersion) {
        resource = '评估器版本';
        published = await request<Definition>(
          '/evaluators/' +
            encodeURIComponent(id) +
            '/versions/' +
            encodeURIComponent(props.initialVersion),
        );
      }
      if (isCurrent())
        linkedVersion.value = {
          name: published?.name ?? value.evaluator.name,
          archived: !!value.evaluator.archived,
          definition: published,
        };
      return;
    }
    await loadReviewAssets();
    if (!isCurrent()) return;
    if (assetsError.value) throw new Error(assetsError.value);
    const entry = evaluatorCatalog.value.find((item) => item.id === id);
    if (!entry || hiddenEvaluator(entry) || entry.kind === 'hybrid') {
      linkError.value = '当前空间没有可单独查看的评估器详情。';
      return;
    }
    category.value = entry.kind === 'rule' ? 'rule' : 'llm_judge';
    await open(entry, value);
  } catch (cause) {
    if (!isCurrent()) return;
    if (cause instanceof ApiError && cause.status === 404) {
      linkError.value = `关联的${resource}不存在或在当前空间不可见。`;
    } else if (cause instanceof ApiError && cause.status === 403) {
      linkError.value = `当前没有权限查看该${resource}。`;
    } else {
      linkError.value = `暂时无法读取${resource}，请重试。`;
      linkCanRetry.value = true;
    }
  } finally {
    if (isCurrent()) linkLoading.value = false;
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload);
  if (props.initialId) void loadLinkedEvaluator();
  else void loadReviewAssets();
});
onUnmounted(() => {
  disposed = true;
  openSequence++;
  window.removeEventListener('beforeunload', beforeUnload);
  emit('dirtyChange', false);
});
const templateLabels1: Record<string, string> = {
  final_output: '最终回答',
  output_and_tools: '回答与工具',
  full_trajectory: '完整轨迹',
};
</script>
<template>
  <section v-if="showLinkedState" class="card" aria-label="关联评估器详情">
    <p v-if="linkLoading" role="status">正在读取关联评估器…</p>
    <p v-else-if="linkError" role="alert">
      {{ linkError }}
      <button v-if="linkCanRetry" class="asset-link" @click="loadLinkedEvaluator">重试</button>
    </p>
    <template v-else-if="linkedVersion">
      <h1 class="page-title">
        {{ linkedVersion.name
        }}<template v-if="linkedVersion.definition">
          · v{{ linkedVersion.definition.version }}</template
        >
      </h1>
      <p v-if="linkedVersion.archived">此评估器已归档。</p>
      <template v-if="linkedVersion.definition">
        <p>{{ kindLabel(linkedVersion.definition.kind) }} · 已发布版本（只读）</p>
        <details>
          <summary>查看版本定义与执行配置</summary>
          <pre class="linked-definition">{{ pretty(linkedVersion.definition) }}</pre>
        </details>
      </template>
      <p v-else>此评估器暂无可查看的发布版本。</p>
    </template>
    <a class="link" href="#/evaluators">返回评估器列表</a>
  </section>
  <LLMGroupEditor
    v-if="groupOpen"
    :initial-id="groupInitialId"
    :choose-template-first="groupChoosing"
    :models="models"
    @started="groupChoosing = false"
    @use-template="useCustomTemplate"
    @close="groupOpen = false"
    @dirty-change="groupDirty = $event"
    @launch="
      groupOpen = false;
      emit('launch', $event);
    "
  />
  <PromptEvaluatorEditor
    v-if="promptOpen"
    :initial-detail="promptInitialDetail"
    :template-detail="promptTemplateDetail"
    :models="models"
    @close="promptOpen = false"
    @dirty-change="promptDirty = $event"
    @launch="
      promptOpen = false;
      emit('launch', $event);
    "
  />
  <div v-if="!showLinkedState && !promptOpen && (!groupOpen || groupChoosing)" class="page-head">
    <h1 id="evaluator-catalog-title" class="page-title">评估器</h1>
  </div>
  <section
    v-if="!showLinkedState && !promptOpen && (!groupOpen || groupChoosing)"
    class="review-assets"
    aria-labelledby="evaluator-catalog-title"
  >
    <div class="evaluator-toolbar">
      <div class="asset-tabs">
        <button :class="{ active: category === 'rule' }" @click="category = 'rule'">规则评估</button
        ><button :class="{ active: category === 'llm_judge' }" @click="category = 'llm_judge'">
          LLM 评估
        </button>
      </div>
      <button
        v-if="category === 'rule'"
        class="asset-primary"
        :disabled="busy"
        @click="chooseRuleTemplate"
      >
        ＋ 新建规则评估器
      </button>
      <button
        v-if="category === 'llm_judge'"
        class="asset-primary"
        :disabled="busy"
        @click="create"
      >
        ＋ 新建 LLM 评估器
      </button>
    </div>
    <p v-if="assetsError" role="alert" class="asset-error">{{ assetsError }}</p>
    <p v-if="error && !design" role="alert" class="asset-error">{{ error }}</p>
    <div class="asset-filters">
      <input v-model="query" aria-label="搜索评估器" placeholder="搜索评估器名称" />
    </div>
    <p v-if="assetsLoading">正在读取…</p>
    <div v-else class="asset-grid" :class="{ 'llm-catalogue-grid': category === 'llm_judge' }">
      <LLMGroupTemplateCard
        v-for="template in visibleGroupTemplates"
        :key="'template:' + template.id"
        class="catalogue-template-card"
        :template="template"
        action="view"
        :disabled="busy"
        @view="previewTemplateId = $event"
      />
      <template v-for="e in entries" :key="e.id">
        <LLMGroupTemplateCard
          v-if="isLlmEvaluator(e.kind)"
          class="asset-card custom-evaluator-card"
          :evaluator="e"
          action="view"
          :disabled="busy || deleting"
          @view="open(e)"
        >
          <template #menu>
            <el-dropdown v-if="canRemoveEvaluator(e)" trigger="click" :disabled="busy || deleting">
              <button
                type="button"
                class="asset-link evaluator-more"
                :aria-label="e.name + '更多操作'"
                :disabled="busy || deleting"
              >
                …
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :disabled="busy || deleting" @click="removeEvaluator(e)">
                    {{ e.latest_version ? '归档' : '删除' }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </LLMGroupTemplateCard>
        <article v-else class="asset-card rule-evaluator-card">
          <span class="asset-chip"
            >{{ e.source === 'builtin' ? '预置' : '自建' }} ·
            {{ e.latest_version ? 'v' + e.latest_version : '未发布' }}</span
          >
          <span v-if="e.has_draft" class="asset-chip preview">草稿</span>
          <el-tooltip
            :content="displayName(e)"
            placement="top"
            :show-after="200"
            popper-class="full-text-popper"
          >
            <h2>{{ displayName(e) }}</h2>
          </el-tooltip>
          <el-tooltip
            v-if="e.source !== 'builtin'"
            :content="e.description || e.metric"
            :disabled="!(e.description || e.metric)"
            placement="top"
            :show-after="200"
            popper-class="full-text-popper"
          >
            <p class="rule-evaluator-description">{{ e.description || e.metric }}</p>
          </el-tooltip>
          <div class="asset-card-actions">
            <button class="asset-link" :disabled="busy" @click="open(e)">查看详情</button
            ><span class="asset-small">{{
              e.latest_version ? (e.enabled ? '已启用' : '已停用') : '发布后可用'
            }}</span>
            <el-dropdown v-if="canRemoveEvaluator(e)" trigger="click" :disabled="busy || deleting">
              <button
                type="button"
                class="asset-link evaluator-more"
                :aria-label="e.name + '更多操作'"
                :disabled="busy || deleting"
              >
                …
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :disabled="busy || deleting" @click="removeEvaluator(e)">
                    归档
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </article>
      </template>
    </div>
  </section>
  <LLMGroupTemplatePreview
    v-if="previewTemplate"
    :key="previewTemplate.id"
    :template="previewTemplate"
    @close="previewTemplateId = ''"
  />
  <el-dialog
    :model-value="!!design"
    :before-close="close"
    :close-on-click-modal="false"
    title="LLM 评估器设计"
    width="min(800px,96vw)"
    class="asset-dialog judge-design-dialog"
  >
    <template v-if="design"
      ><fieldset class="design-fields" :disabled="busy">
        <header class="design-header">
          <div>
            <h2 v-if="!editing">
              {{ design.name }}
              <span class="asset-chip">{{ viewingDraft ? '草稿' : 'v' + design.version }}</span>
            </h2>
            <input
              v-else
              v-model="design.name"
              aria-label="评估器名称"
              placeholder="评估器名称"
            /><input
              v-if="editing"
              v-model="design.description"
              aria-label="评估器描述"
              placeholder="描述"
            />
            <p v-else>{{ design.description }}</p>
          </div>
          <div class="actions">
            <button v-if="detail?.latest && !editing" class="asset-secondary" @click="showHistory">
              版本历史</button
            ><button v-if="!editing" class="asset-primary" @click="edit">
              {{
                ownDesign
                  ? viewingDraft || detail?.draft
                    ? '编辑草稿'
                    : '创建新版本草稿'
                  : '复制并编辑'
              }}
            </button>
          </div>
        </header>
        <EvaluatorTaskHistory
          :evaluator-id="detail?.evaluator.id ?? ''"
          :latest-version="detail?.latest?.version"
          :current-version="viewingDraft ? null : definition?.version"
          :enabled="!!detail && !editing"
        >
          <p class="asset-small">
            {{
              !definition || hasDimensionScoring(definition)
                ? '各维度由模型评分，总分由系统按权重计算。'
                : '此版本按整体评分；复制后可配置维度评分与权重。'
            }}
          </p>
          <EvaluatorModelSelect
            :key="design.id"
            v-model="design.modelKey"
            :editable="editing"
            :models="models"
          />
          <section class="execution-config">
            <div v-if="editing" class="asset-form-grid">
              <label
                >评审输入范围<select v-model="design.scope" aria-label="评审输入范围">
                  <option value="final_output">最终回答</option>
                  <option value="output_and_tools">回答与工具</option>
                  <option value="full_trajectory">完整轨迹</option>
                </select></label
              ><label
                >通过分数（0—100）<input
                  type="number"
                  v-model.number="design.threshold"
                  min="0"
                  max="100"
                  aria-label="评估器通过分数"
              /></label>
            </div>
            <p v-else class="asset-small">
              评审范围：{{ templateLabels1[design.scope] ?? design.scope }} · 通过分数
              {{ design.threshold }}
            </p>
          </section>
          <div class="dimension-design">
            <aside>
              <h3>评估维度（{{ design.dimensions.length }}）</h3>
              <button
                v-for="(d, i) in design.dimensions"
                :key="i"
                class="dimension-item"
                :class="{ active: selected === i }"
                @click="selected = i"
              >
                <strong>{{ dimensionNames[d.name] ?? d.name ?? '未命名维度' }}</strong
                ><span>{{ d.weight == null ? '未定义' : d.weight + '%' }}</span></button
              ><button
                v-if="editing"
                class="asset-link"
                @click="
                  design.dimensions.push({
                    id: 'dimension_' + (design.dimensions.length + 1),
                    name: '新维度',
                    description: '',
                    prompt: '',
                    weight: 0,
                  });
                  selected = design.dimensions.length - 1;
                "
              >
                ＋ 添加维度
              </button>
              <p v-if="editing" :class="{ 'asset-error': !!weightError(design.dimensions) }">
                权重合计 {{ total }}% / 100%
              </p>
            </aside>
            <section v-if="active" class="dimension-content">
              <header>
                <h3>{{ dimensionNames[active.name] ?? active.name ?? '评估维度' }}</h3>
                <div class="actions">
                  <button
                    v-if="editing"
                    class="asset-link"
                    @click="
                      design.dimensions.splice(selected, 1);
                      selected = Math.max(0, selected - 1);
                    "
                  >
                    移除维度
                  </button>
                </div>
              </header>
              <div v-if="editing" class="asset-form-grid">
                <label>维度名称<input v-model="active.name" aria-label="维度名称" /></label
                ><label>标识<input v-model="active.id" aria-label="维度标识" /></label
                ><label
                  >权重（%）<input
                    v-model.number="active.weight"
                    type="number"
                    min="0.01"
                    max="100"
                    step=".01"
                    aria-label="维度权重" /></label
                ><label>说明<input v-model="active.description" aria-label="维度说明" /></label>
              </div>
              <p v-else>{{ active.description }}</p>
              <textarea
                v-if="editing"
                v-model="active.prompt"
                aria-label="维度评分提示词"
                rows="10"
                placeholder="填写评分标准、指导说明和扣分条件；这是本维度的提示词。"
              />
              <pre v-else>{{ active.prompt }}</pre>
            </section>
          </div>
        </EvaluatorTaskHistory>
      </fieldset>
      <p v-if="notice" role="status">{{ notice }}</p>
      <p v-if="error" role="alert" class="asset-error">{{ error }}</p></template
    >
    <template #footer
      ><button class="asset-secondary" :disabled="busy" @click="close">关闭</button
      ><button v-if="editing" class="asset-primary" :disabled="busy" @click="save">
        {{ busy ? '保存中…' : '保存' }}</button
      ><button
        v-if="!editing && viewingDraft && ownDesign"
        class="asset-primary"
        :disabled="busy"
        @click="publish"
      >
        发布并启用
      </button>
      <button
        v-if="
          !editing &&
          detail?.latest &&
          !detail.evaluator.enabled &&
          detail.evaluator.source === 'user'
        "
        class="asset-secondary"
        :disabled="busy"
        @click="enable"
      >
        启用
      </button>
      <button
        v-if="canLaunch && !editing"
        class="asset-primary"
        :disabled="busy"
        @click="
          emit('launch', detail!.evaluator.id);
          design = null;
        "
      >
        打开测评配置
      </button></template
    ></el-dialog
  >
  <el-dialog v-model="historyOpen" title="已发布版本" class="asset-dialog"
    ><p>已发布版本只读，历史任务始终使用运行时保存的版本。</p>
    <p v-if="historyLoading">正在读取版本…</p>
    <p v-if="historyError" role="alert" class="asset-error">{{ historyError }}</p>
    <p v-for="v in versions" :key="v.version">
      <button class="asset-link" @click="viewVersion(v)">查看 v{{ v.version }}</button>
      <small class="asset-small"> · {{ v.content_sha256 }}</small>
    </p>
    <p v-if="!historyLoading && !historyError && !versions.length">暂无发布版本。</p></el-dialog
  >
  <el-dialog
    :model-value="!!rule"
    @close="rule = null"
    title="规则评估器详情"
    width="min(860px, 96vw)"
    class="asset-dialog rule-detail-dialog"
  >
    <template v-if="rule">
      <h2 class="rule-detail-name">{{ displayName(rule) }}</h2>
      <EvaluatorTaskHistory :evaluator-id="rule.id" :latest-version="rule.latest_version" divider>
        <div class="asset-chips">
          <span class="asset-chip">{{ rule.source === 'builtin' ? '预置' : '自建' }}</span>
          <span class="asset-chip">代码</span>
          <span class="asset-chip">仅看结果</span>
        </div>
        <p>{{ evaluatorScenarios[rule.implementation_id] || rule.description || rule.metric }}</p>
        <section class="rule-explanation">
          <h3>检查方式</h3>
          <p v-for="text in evaluatorTechnicalChecks(rule, [])" :key="text">{{ text }}</p>
        </section>
        <section v-if="ruleExamples[rule.implementation_id]" class="rule-example">
          <h3>使用案例</h3>
          <p>{{ ruleExamples[rule.implementation_id].expectation }}</p>
          <p class="example-pass">{{ ruleExamples[rule.implementation_id].passed }}</p>
          <p class="example-fail">{{ ruleExamples[rule.implementation_id].failed }}</p>
        </section>
        <details v-if="Object.keys(evaluatorDetails[rule.id]?.latest?.config ?? {}).length">
          <summary>规则配置</summary>
          <pre>{{ JSON.stringify(evaluatorDetails[rule.id]?.latest?.config, null, 2) }}</pre>
        </details>
      </EvaluatorTaskHistory>
    </template>
    <template #footer>
      <button class="asset-secondary" @click="rule = null">关闭</button>
    </template>
  </el-dialog>
  <RuleEvaluatorCreate
    v-if="creatingRule"
    @close="creatingRule = false"
    @created="
      creatingRule = false;
      loadReviewAssets();
    "
  />
  <el-dialog
    v-if="ruleTemplatesOpen"
    :model-value="true"
    title="评估器模板"
    width="min(1180px,94vw)"
    class="rule-template-dialog"
    :close-on-click-modal="false"
    @close="ruleTemplatesOpen = false"
  >
    <div class="rule-template-layout">
      <aside class="rule-template-sidebar">
        <h3>类型</h3>
        <span>规则</span>
      </aside>
      <div class="rule-template-main">
        <div class="rule-template-toolbar">
          <input
            v-model="ruleTemplateQuery"
            class="input"
            aria-label="搜索评估器模板"
            placeholder="搜索评估器模板"
          />
          <button type="button" class="asset-primary" @click="createRule()">
            ＋ 自定义创建规则评估器
          </button>
        </div>
        <p v-if="assetsLoading" role="status">正在读取模板…</p>
        <p v-else-if="assetsError" role="alert" class="asset-error">{{ assetsError }}</p>
        <p v-else-if="!visibleRuleTemplates.length" class="muted">
          {{ ruleTemplateQuery.trim() ? '没有匹配的模板，请调整搜索。' : '当前没有可用的规则模板。' }}
        </p>
        <div v-else class="rule-template-cards">
          <article v-for="preset in visibleRuleTemplates" :key="preset.id" class="asset-card">
            <span class="asset-chip">预置模板</span>
            <h2>{{ preset.name }}</h2>
            <p>{{ evaluatorScenarios[preset.implementation_id] ?? preset.description }}</p>
            <div class="asset-card-actions">
              <button type="button" class="asset-primary" @click="createRule(preset)">
                使用此模板创建
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </el-dialog>
  <CodeRuleDialog
    v-if="codeOpen"
    :initial-id="codeId"
    :initial-preset="initialRulePreset"
    @close="codeOpen = false"
    @dirty-change="codeDirty = $event"
    @changed="loadReviewAssets()"
    @launch="
      codeOpen = false;
      emit('launch', $event);
    "
  />
</template>
<style scoped>
:global(.el-overlay .el-dialog.rule-template-dialog:not(.is-fullscreen)) {
  height: min(840px, 92vh);
  max-height: 92vh;
  margin: 4vh auto !important;
}
:global(.el-overlay .el-dialog.rule-template-dialog:not(.is-fullscreen) .el-dialog__body) {
  flex: 1;
  max-height: none;
}
.rule-template-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
}
.rule-template-sidebar {
  padding: 12px 22px 20px 4px;
  border-right: 1px solid var(--el-border-color-lighter);
}
.rule-template-sidebar h3 {
  margin: 6px 0 18px;
}
.rule-template-sidebar span {
  display: block;
  padding: 10px;
  text-align: center;
  border-radius: 7px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.rule-template-main {
  min-width: 0;
  padding: 10px 0 0 22px;
}
.rule-template-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.rule-template-toolbar input {
  flex: 1 1 220px;
  min-width: 0;
}
.rule-template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 18px;
}
@media (max-width: 760px) {
  .rule-template-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .rule-template-sidebar {
    display: none;
  }
  .rule-template-main {
    padding-inline-start: 0;
  }
}
.evaluator-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px 24px 20px;
}
.evaluator-toolbar .asset-tabs {
  flex: 1;
  margin: 0;
}
.evaluator-toolbar > .asset-primary {
  flex-shrink: 0;
}
.evaluator-more {
  font-size: 24px;
  line-height: 1;
  padding: 0 8px;
}
.asset-grid.llm-catalogue-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 320px));
  grid-auto-rows: 1fr;
  align-items: stretch;
}
.llm-catalogue-grid > .catalogue-template-card {
  align-self: stretch;
}
.rule-evaluator-card h2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: normal;
}
.rule-evaluator-description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  min-height: 3.4em;
  overflow-wrap: anywhere;
}

.design-fields {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.rule-explanation,
.rule-example {
  margin: 20px 0;
  padding: 18px;
  background: #f6faf8;
  border: 1px solid #e0ebe5;
  border-radius: 10px;
  line-height: 1.8;
}
.rule-example h3,
.rule-explanation h3 {
  margin-bottom: 10px;
}
.example-pass {
  color: #008b76;
}
.example-fail {
  color: #a76438;
}
.execution-config {
  padding: 14px 0;
}
.design-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.design-header > div:first-child {
  flex: 1;
  min-width: 0;
}
.dimension-design {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  border-top: 1px solid #e4eaf4;
  margin-top: 22px;
}
.dimension-design aside {
  padding: 20px 16px 20px 0;
  border-right: 1px solid #e4eaf4;
}
.dimension-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 10px;
  border: 1px solid #e2e8f5;
  border-radius: 10px;
  background: #f7f9fd;
  color: #34415a;
}
.dimension-item.active {
  border-color: #2868ff;
  box-shadow: 0 0 0 3px #2868ff15;
}
.dimension-content {
  padding: 20px;
  min-width: 0;
}
.dimension-content header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.linked-definition,
.dimension-content pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
  background: #f7f9fb;
  padding: 18px;
  border-radius: 10px;
  min-height: 240px;
}
.design-header .actions {
  align-items: flex-start;
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .evaluator-toolbar {
    padding: 18px;
  }
}
@media (max-width: 720px) {
  .dimension-design {
    grid-template-columns: 1fr;
  }
  .dimension-design aside {
    border: 0;
    padding: 16px 0;
  }
  .dimension-content {
    padding: 12px 0;
  }
  .design-header {
    flex-wrap: wrap;
  }
}
</style>
<style>
.el-overlay .el-dialog.rule-detail-dialog:not(.is-fullscreen) {
  max-height: 88vh;
}
.el-overlay .el-dialog.rule-detail-dialog > .el-dialog__header {
  padding-bottom: 4px;
}
.el-overlay .el-dialog.rule-detail-dialog > .el-dialog__body {
  max-height: none;
  padding-block: 0 10px;
}
.rule-detail-dialog .rule-detail-name {
  flex-shrink: 0;
  margin: 0 0 6px;
  font-size: 18px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.rule-detail-dialog .history-content {
  padding-block: 0;
}
.rule-detail-dialog .history-toolbar {
  margin-bottom: 8px;
}
.rule-detail-dialog .history-toolbar label {
  margin-bottom: 0;
}
.rule-detail-dialog .history-toolbar select {
  margin-top: 0;
  padding-block: 6px;
}
.rule-detail-dialog .history-scroll {
  max-height: none;
}
.rule-detail-dialog .history-table :is(th, td) {
  padding-block: 5px;
}
.rule-detail-dialog .history-pagination {
  margin-top: 10px;
}
@media (min-height: 440px) {
  .el-overlay .el-dialog.rule-detail-dialog > .el-dialog__body:has(> .showing-history),
  .rule-detail-dialog .showing-history,
  .rule-detail-dialog .showing-history > .el-tabs__content,
  .rule-detail-dialog .history-pane,
  .rule-detail-dialog .history-content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .rule-detail-dialog .el-tabs__header,
  .rule-detail-dialog .history-toolbar,
  .rule-detail-dialog .history-pagination {
    flex-shrink: 0;
  }
  .rule-detail-dialog .history-scroll {
    min-height: 0;
  }
}
.el-overlay .el-dialog.judge-design-dialog .el-dialog__body {
  padding: 16px 24px;
  max-height: 68vh;
}
.el-overlay .el-dialog.judge-design-dialog .asset-form-grid {
  gap: 12px;
}
.el-overlay .el-dialog.judge-design-dialog .asset-dialog label,
.el-overlay .el-dialog.judge-design-dialog label {
  margin-bottom: 10px;
}
</style>
