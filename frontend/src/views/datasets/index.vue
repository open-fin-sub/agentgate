<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
import { computed, onMounted, onUnmounted, watch, ref, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiError } from '../../api/client';
import { statusLabel } from '../../api/evaluations';
import { datasetApi, type DatasetRelatedTaskPage } from '../../api/datasets';
import { useAuthStore } from '../../stores/modules/auth';
import { taskPath } from '../evaluation/utils/summary-query';
import { formatTaskTime } from '../evaluation/utils/task-timing';
import DatasetCatalog from './components/DatasetCatalog.vue';
import DatasetCreateForm from './components/DatasetCreateForm.vue';
import DatasetExportDialog from './components/DatasetExportDialog.vue';
import VersionSelector from './components/VersionSelector.vue';
import CaseEditor from './components/SampleEditor.vue';
import SampleImportWizard from './components/SampleImportWizard.vue';
import { blankSample } from './utils/sample-import';
import { caseCategoryLabels, caseDifficultyLabels, hasPublicationHistory } from './types/index';
import type {
  DatasetExport,
  DatasetSummary,
  DatasetVersion,
  EvaluationCase,
  ValidationIssue,
} from './types/index';

const exportTarget = ref(''),
  exportVersionId = ref(''),
  selectedSampleIds = ref<string[]>([]);
function openExport(id: string, versionId = '', ids: string[] = []) {
  exportTarget.value = id;
  exportVersionId.value = versionId;
  selectedSampleIds.value = ids;
}
const props = defineProps<{ initialId?: string }>();
const linkedVersion = computed(() => {
  const version = router.currentRoute.value.query.version;
  return typeof version === 'string' ? version : '';
});
watch([() => props.initialId, linkedVersion], ([id, version], [previousId, previousVersion]) => {
  if (!id && showingDetail.value) {
    void showCatalog();
  } else if (
    id &&
    (!showingDetail.value ||
      id !== activeDatasetId.value ||
      (id === previousId && version !== previousVersion))
  ) {
    void openDataset(id);
  }
});
const emit = defineEmits<{
  dirtyChange: [dirty: boolean];
  runVersion: [selection: { id: string; version: number; caseIds?: string[]; caseName?: string }];
}>();
function requestVersionRun(eventOrSingle: boolean | Event = false) {
  const single = eventOrSingle === true;
  if (activeDataset.value?.archived || activeVersion.value?.version == null || busy.value) return;
  if (single && !activeCaseId.value) return;
  emit('runVersion', {
    id: activeDatasetId.value,
    version: activeVersion.value.version,
    ...(single ? { caseIds: [activeCaseId.value], caseName: editedCase.value?.name } : {}),
  });
}

const datasets = shallowRef<DatasetSummary[]>([]);
const versions = shallowRef<DatasetVersion[]>([]);
const activeDatasetId = ref(props.initialId ?? '');
const showingDetail = ref(Boolean(props.initialId));
const detailState = ref<
  'loading' | 'ready' | 'missing' | 'missing-version' | 'forbidden' | 'error'
>('loading');
let loadSequence = 0;
const removingDataset = ref(false);
async function openById() {
  try {
    const { value } = await ElMessageBox.prompt('输入测评集 ID，可打开已归档资产。', '按 ID 打开', {
      inputValidator: (v) => !!v?.trim() || '请输入 ID',
    });
    await openDataset(value.trim());
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') showError(e, '无法打开');
  }
}
async function openDataset(id: string, editDraft = true) {
  if (props.initialId !== id && id !== activeDatasetId.value && !canDiscard()) return false;
  showingDetail.value = true;
  if (props.initialId !== id) void router.replace('/datasets/' + encodeURIComponent(id));
  try {
    if (!(await selectDataset(id))) return false;
    if (!editDraft) {
      const published = versions.value.find((v) => v.status !== 'draft');
      if (published) selectVersion(published);
    }
    return true;
  } catch {
    // selectDataset exposes the request outcome on the detail page.
    return false;
  }
}
async function showCatalog() {
  setDatasetId('');
  showingDetail.value = false;
  const ticket = ++loadSequence;
  loading.value = true;
  try {
    const list = await datasetApi.list();
    if (ticket === loadSequence) datasets.value = list;
  } catch (error) {
    if (ticket === loadSequence) showError(error, '无法刷新测评集');
  } finally {
    if (ticket === loadSequence) loading.value = false;
  }
}
function backToList() {
  if (!canDiscard()) return;
  void showCatalog();
  void router.replace('/datasets');
}
const activeVersionId = ref('');
const activeCaseId = ref('');
const editedCase = ref<EvaluationCase | null>(null);
const busy = ref(false);
const caseEditor = ref<InstanceType<typeof CaseEditor> | null>(null);
async function restoreDataset(item: DatasetSummary) {
  try {
    await datasetApi.update(item.id, { archived: false });
    datasets.value = await datasetApi.list();
    ElMessage.success('测评集已恢复');
  } catch (e) {
    showError(e, '恢复失败');
  }
}
const detailTab = ref('samples'),
  versionHistoryDialog = ref(false);
const auth = useAuthStore();
let historyRequest: AbortController | undefined;
const history = shallowRef<DatasetRelatedTaskPage | null>(null);
const historyCursors = ref<(string | null)[]>([null]);
const historyLoading = ref(false);
const historyError = ref(false);
watch(activeDatasetId, () => {
  detailTab.value = 'samples';
  sampleView.value = false;
});

async function loadHistory() {
  historyRequest?.abort();
  history.value = null;
  historyError.value = false;
  historyLoading.value = false;
  const datasetId = activeDatasetId.value;
  const selected = activeVersion.value;
  if (
    !auth.authenticated ||
    !showingDetail.value ||
    detailTab.value !== 'history' ||
    !datasetId ||
    selected?.status !== 'published' ||
    selected.version == null
  )
    return;
  const request = (historyRequest = new AbortController());
  const cursor = historyCursors.value[historyCursors.value.length - 1];
  historyLoading.value = true;
  try {
    const result = await datasetApi.relatedTasks(datasetId, selected.version, cursor, request.signal);
    if (!request.signal.aborted) history.value = result;
  } catch {
    if (!request.signal.aborted) historyError.value = true;
  } finally {
    if (!request.signal.aborted) historyLoading.value = false;
  }
}

function previousHistoryPage() {
  historyCursors.value.pop();
  void loadHistory();
}
function nextHistoryPage() {
  const cursor = history.value?.next_cursor;
  if (!cursor) return;
  historyCursors.value.push(cursor);
  void loadHistory();
}
function creationTime(value: string) {
  const time = formatTaskTime(value);
  return time ? `${time.date} ${time.time}` : '—';
}
const loading = ref(true);
const validationIssues = ref<ValidationIssue[]>([]);
const datasetDialog = ref(false);
const createV2Dialog = ref(false);
const sampleWizard = ref<'choose' | 'manual' | null>(null),
  sampleView = ref(false),
  sampleQuery = ref('');
const draftImportTarget = shallowRef<DatasetVersion | null>(null);
watch([showingDetail, activeVersionId, () => auth.loginMode, () => auth.teamId, () => auth.userId], () => {
  draftImportTarget.value = null;
  if (sampleWizard.value === 'manual') sampleWizard.value = null;
});
const filteredSamples = computed(
  () =>
    activeVersion.value?.cases.filter((c) =>
      c.name.toLowerCase().includes(sampleQuery.value.toLowerCase()),
    ) ?? [],
);
async function createdDataset(id: string, withImport: boolean) {
  createV2Dialog.value = false;
  if (!(await openDataset(id))) return;
  sampleView.value = false;
  sampleWizard.value = withImport ? 'choose' : null;
}
async function samplesImported() {
  if (!(await selectDataset(activeDatasetId.value))) return;
  detailTab.value = 'samples';
  sampleView.value = false;
  sampleQuery.value = '';
  editorDirty.value = false;
}
function openManualSample() {
  if (!editable.value || busy.value || !canDiscard()) return;
  sampleWizard.value = 'manual';
}
function openDraftImport() {
  if (!editable.value || busy.value) return;
  if (dirty.value) {
    ElMessage.warning('请先保存当前样本或放弃未保存的修改，再导入测评集。');
    return;
  }
  draftImportTarget.value = activeVersion.value;
}
function finishDraftImport(draft: DatasetVersion) {
  if (draftImportTarget.value?.id !== draft.id || draft.dataset_id !== activeDatasetId.value) return;
  draftImportTarget.value = null;
  versions.value = versions.value.map((version) => (version.id === draft.id ? draft : version));
  datasets.value = datasets.value.map((item) =>
    item.id === draft.dataset_id ? { ...item, draft_case_count: draft.cases.length } : item,
  );
  showVersion(draft);
  detailTab.value = 'samples';
  sampleQuery.value = '';
  ElMessage.success(`导入成功，草稿现有 ${draft.cases.length} 条样本`);
}
const dialogMode = ref<'create' | 'copy' | 'edit'>('create');
const copyVersion = ref<number | null>(null);
const copySources = computed(() => versions.value.filter((v) => v.status === 'published'));
const dialogName = ref('');
const dialogDescription = ref('');
const importInput = ref<HTMLInputElement | null>(null);
const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const activeVersion = computed<DatasetVersion | null>(
  () => versions.value.find((item) => item.id === activeVersionId.value) ?? null,
);
watch(
  [
    detailTab,
    showingDetail,
    activeDatasetId,
    activeVersionId,
    () => activeVersion.value?.version,
    () => auth.loginMode,
    () => auth.platformReady,
    () => auth.token,
    () => auth.teamId,
    () => auth.userId,
  ],
  () => {
    historyCursors.value = [null];
    void loadHistory();
  },
);
const editable = computed(
  () => activeVersion.value?.status === 'draft' && !activeDataset.value?.archived,
);
const publishedVersions = computed(() =>
  versions.value.filter((item) => item.status === 'published'),
);
const activeDataset = computed(
  () => datasets.value.find((item) => item.id === activeDatasetId.value) ?? null,
);
const activeCaseIssues = computed(() => {
  const caseIndex =
    activeVersion.value?.cases.findIndex((item) => item.id === activeCaseId.value) ?? -1;
  if (caseIndex < 0) return [];
  const prefix = `cases[${caseIndex}]`;
  return validationIssues.value.filter((issue) => issue.path.startsWith(prefix));
});

const editorDirty = ref(false);
const dirty = computed(
  () =>
    editable.value &&
    (editorDirty.value ||
      (editedCase.value !== null &&
        JSON.stringify(editedCase.value) !==
          JSON.stringify(
            activeVersion.value?.cases.find((c) => c.id === editedCase.value?.id) ?? null,
          ))),
);
watch(dirty, (v) => emit('dirtyChange', v));
function canDiscard() {
  return !dirty.value || window.confirm('当前样本有未保存的修改，确定放弃？');
}
function backSamples() {
  if (!canDiscard()) return;
  sampleView.value = false;
  editedCase.value = null;
  activeCaseId.value = '';
  editorDirty.value = false;
}
function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = '';
  }
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload));
onUnmounted(() => {
  loadSequence++;
  historyRequest?.abort();
  window.removeEventListener('beforeunload', warnBeforeUnload);
  emit('dirtyChange', false);
});
function chooseVersion(preferredId = '', publication = '') {
  const selected =
    versions.value.find((item) => item.id === preferredId) ??
    (publication
      ? publishedVersions.value.find((item) => item.version === Number(publication))
      : (versions.value.find((item) => item.status === 'draft') ?? publishedVersions.value[0])) ??
    null;
  activeVersionId.value = selected?.id ?? '';
  selectFirstCase(selected);
  return selected;
}

function selectFirstCase(version: DatasetVersion | null) {
  const selected =
    version?.cases.find((item) => item.id === activeCaseId.value) ??
    version?.cases.find(
      (item) => item.id === new URLSearchParams(location.hash.split('?')[1] ?? '').get('case'),
    ) ??
    version?.cases[0] ??
    null;
  activeCaseId.value = selected?.id ?? '';
  editedCase.value = selected ? cloneJson(selected) : null;
}

function setDatasetId(datasetId: string) {
  if (activeDatasetId.value === datasetId) return;
  activeDatasetId.value = datasetId;
  versions.value = [];
  chooseVersion();
  selectedSampleIds.value = [];
  validationIssues.value = [];
  editorDirty.value = false;
  versionHistoryDialog.value = false;
  datasetDialog.value = false;
  sampleWizard.value = null;
  sampleQuery.value = '';
  exportTarget.value = '';
}

async function selectDataset(datasetId: string, preferredVersionId = '') {
  const ticket = ++loadSequence;
  setDatasetId(datasetId);
  detailState.value = 'loading';
  try {
    const detail = await datasetApi.detail(datasetId);
    if (ticket !== loadSequence) return false;
    const published = detail.versions
        .filter((v) => v.status === 'published')
        .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0],
      draft = detail.versions.find((v) => v.status === 'draft');
    const summary = {
      ...detail.dataset,
      version: published?.version ?? null,
      case_count: published?.cases.length ?? 0,
      has_draft: !!draft,
      draft_case_count: draft?.cases.length ?? null,
      draft_based_on_version: draft?.based_on_version ?? null,
    };
    datasets.value = [...datasets.value.filter((d) => d.id !== datasetId), summary];
    versions.value = detail.versions;
    const publication =
      props.initialId === datasetId && linkedVersion.value !== 'draft' ? linkedVersion.value : '';
    const selected = chooseVersion(preferredVersionId, publication);
    detailState.value = publication && !selected ? 'missing-version' : 'ready';
    return detailState.value === 'ready';
  } catch (error) {
    if (ticket !== loadSequence) return false;
    if (error instanceof ApiError && error.status === 404) detailState.value = 'missing';
    else if (error instanceof ApiError && error.status === 403) detailState.value = 'forbidden';
    else detailState.value = 'error';
    throw error;
  }
}

function selectVersion(version: DatasetVersion) {
  if (!canDiscard()) return;
  showVersion(version);
}

function showVersion(version: DatasetVersion) {
  activeVersionId.value = version.id;
  sampleView.value = false;
  selectedSampleIds.value = [];
  editorDirty.value = false;
  validationIssues.value = [];
  selectFirstCase(version);
}

function selectCase(item: EvaluationCase) {
  if (!canDiscard()) return;
  sampleView.value = true;
  activeCaseId.value = item.id;
  editedCase.value = cloneJson(item);
}

function addCase() {
  if (!canDiscard()) return;
  sampleView.value = true;
  const item = blankSample('新用例');
  activeCaseId.value = item.id;
  editedCase.value = item;
  validationIssues.value = [];
}

async function refreshAfterMutation(version: DatasetVersion, caseId = activeCaseId.value) {
  datasets.value = await datasetApi.list();
  versions.value = await datasetApi.versions(activeDatasetId.value);
  activeVersionId.value = version.id;
  activeCaseId.value = caseId;
  const current = versions.value.find((item) => item.id === version.id) ?? version;
  const selected = current.cases.find((item) => item.id === caseId) ?? current.cases[0] ?? null;
  editedCase.value = selected ? cloneJson(selected) : null;
}

async function saveCase(item: EvaluationCase) {
  if (!activeDatasetId.value || !editable.value) return;
  busy.value = true;
  try {
    const exists = activeVersion.value?.cases.some((entry) => entry.id === item.id) ?? false;
    const version = exists
      ? await datasetApi.updateCase(
          activeDatasetId.value,
          item,
          activeVersion.value!.content_sha256,
        )
      : await datasetApi.addCase(activeDatasetId.value, item, activeVersion.value!.content_sha256);
    await refreshAfterMutation(version, item.id);
    validationIssues.value = [];
    editorDirty.value = false;
    ElMessage.success('当前用例已保存到草稿');
  } catch (error) {
    if (error instanceof ApiError && error.status === 409)
      ElMessage.error('其他用户已修改此草稿。本次修改未覆盖服务器，请复制保留本地内容后刷新。');
    else showError(error, '保存用例失败');
  } finally {
    busy.value = false;
  }
}

async function copyCase(item: EvaluationCase) {
  if (!editable.value || !canDiscard()) return;
  const version = await datasetApi.copyCase(
    activeDatasetId.value,
    item.id,
    activeVersion.value!.content_sha256,
  );
  const copied = version.cases.find(
    (entry) => !activeVersion.value?.cases.some((old) => old.id === entry.id),
  );
  await refreshAfterMutation(version, copied?.id);
  ElMessage.success('已复制用例');
}

async function removeCase(item: EvaluationCase) {
  if (!canDiscard()) return;
  await ElMessageBox.confirm(`删除草稿中的“${item.name}”？已发布版本不会受影响。`, '删除用例', {
    type: 'warning',
  });
  const version = await datasetApi.removeCase(
    activeDatasetId.value,
    item.id,
    activeVersion.value!.content_sha256,
  );
  activeCaseId.value = '';
  await refreshAfterMutation(version);
  ElMessage.success('用例已从草稿移除');
}

async function reorderCases(ids: string[]) {
  if (!canDiscard()) return;
  const version = await datasetApi.reorderCases(
    activeDatasetId.value,
    ids,
    activeVersion.value!.content_sha256,
  );
  await refreshAfterMutation(version);
}

function openCreate() {
  if (!canDiscard()) return;
  createV2Dialog.value = true;
}

function openCopy(item: DatasetSummary) {
  if (!canDiscard()) return;
  if (!copySources.value.length) return ElMessage.warning('发布首个版本后才可复制测评集');
  copyVersion.value = activeVersion.value?.version ?? copySources.value[0]?.version ?? null;
  dialogMode.value = 'copy';
  dialogName.value = `${item.name}（副本）`;
  dialogDescription.value = item.description;
  datasetDialog.value = true;
}

function openMetadata(item: DatasetSummary) {
  if (!canDiscard()) return;
  dialogMode.value = 'edit';
  dialogName.value = item.name;
  dialogDescription.value = item.description;
  datasetDialog.value = true;
}

async function submitDatasetDialog() {
  if (!dialogName.value.trim()) return ElMessage.warning('请输入测评集名称');
  busy.value = true;
  try {
    if (dialogMode.value === 'edit') {
      await datasetApi.update(activeDatasetId.value, {
        name: dialogName.value.trim(),
        description: dialogDescription.value,
      });
      datasetDialog.value = false;
      await selectDataset(activeDatasetId.value);
      ElMessage.success('基本信息已保存');
      return;
    }
    if (
      dialogMode.value === 'copy' &&
      !copySources.value.some((v) => v.version === copyVersion.value)
    )
      throw Error('请选择已发布的来源版本');
    const result =
      dialogMode.value === 'create'
        ? await datasetApi.create(dialogName.value, dialogDescription.value)
        : await datasetApi.copy(activeDatasetId.value, dialogName.value, copyVersion.value);
    datasetDialog.value = false;
    if (!(await openDataset(result.dataset.id))) return;
    ElMessage.success(dialogMode.value === 'create' ? '测评集已创建' : '测评集已复制');
  } catch (error) {
    showError(error, '操作失败');
  } finally {
    busy.value = false;
  }
}

async function removeDataset(item: DatasetSummary) {
  if (removingDataset.value || !canDiscard()) return;
  const published = hasPublicationHistory(item);
  const action = published ? '归档' : '删除';
  removingDataset.value = true;
  try {
    await ElMessageBox.confirm(
      published
        ? `归档测评集“${item.name}”？归档后将从测评集列表和新建任务的可选项中移除，历史版本和测评报告仍可查看。`
        : `删除未发布测评集“${item.name}”及其草稿？此操作不可恢复。`,
      action + '测评集',
      { type: 'warning', confirmButtonText: action, cancelButtonText: '取消' },
    );
    if (published) await datasetApi.archive(item.id);
    else await datasetApi.deleteRecord(item.id);

    datasets.value = datasets.value.filter((dataset) => dataset.id !== item.id);
    if (activeDatasetId.value === item.id) {
      activeDatasetId.value = '';
      versions.value = [];
      chooseVersion();
    }
    ElMessage.success('测评集已' + action);
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error, action + '失败');
  } finally {
    removingDataset.value = false;
  }
}

async function createDraft(base: number | null) {
  if (!canDiscard()) return;
  busy.value = true;
  try {
    const draft = await datasetApi.createDraft(activeDatasetId.value, base);
    await selectDataset(activeDatasetId.value, draft.id);
    datasets.value = await datasetApi.list();
    ElMessage.success('新版本草稿已创建');
  } catch (error) {
    showError(error, '创建草稿失败');
  } finally {
    busy.value = false;
  }
}

async function discardDraft() {
  if (!activeDataset.value) return;
  const hasPublished = hasPublicationHistory(activeDataset.value);
  await ElMessageBox.confirm(hasPublished
    ? '放弃当前草稿？草稿中的修改将无法恢复。'
    : '该测评集没有已发布版本，放弃草稿将同时删除整个测评集。确认删除？', '放弃草稿', {
    type: 'warning',
  });
  await datasetApi.discardDraft(activeDatasetId.value);
  editorDirty.value = false;
  if (hasPublished) await selectDataset(activeDatasetId.value);
  else {
    showingDetail.value = false;
    activeDatasetId.value = '';
    versions.value = [];
    chooseVersion();
    await router.replace('/datasets');
  }
  datasets.value = await datasetApi.list();
  ElMessage.success(hasPublished ? '草稿已放弃' : '测评集已删除');
}

async function publishDraft() {
  if (dirty.value) {
    ElMessage.warning('请先保存当前样本，再发布测评集');
    return;
  }
  busy.value = true;
  validationIssues.value = [];
  try {
    const published = await datasetApi.publish(
      activeDatasetId.value,
      activeVersion.value!.content_sha256,
    );
    await selectDataset(activeDatasetId.value, published.id);
    datasets.value = await datasetApi.list();
    ElMessage.success(`已发布 v${published.version}`);
  } catch (error) {
    if (error instanceof ApiError && Array.isArray(error.detail)) {
      validationIssues.value = error.detail as ValidationIssue[];
    } else if (
      error instanceof ApiError &&
      error.status === 422 &&
      error.detail === 'published DatasetVersion requires at least one Case'
    ) {
      validationIssues.value = [{ path: 'cases', message: '测评集至少需要一个用例' }];
    }
    showError(error, '发布失败，请检查用例');
  } finally {
    busy.value = false;
  }
}

async function importDataset(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text()) as DatasetExport;
    const result = await datasetApi.importDataset(payload);
    if (!(await openDataset(result.dataset.id))) return;
    ElMessage.success('测评集已导入');
  } catch (error) {
    showError(error, '导入失败');
  } finally {
    input.value = '';
  }
}

function showError(error: unknown, fallback: string) {
  ElMessage.error(error instanceof Error ? error.message : fallback);
}

onMounted(() => {
  if (props.initialId) void openDataset(props.initialId);
  else void showCatalog();
});
</script>

<template>
  <div v-if="!showingDetail" class="page-head">
    <h1 id="dataset-workspace-title" class="page-title">测评集</h1>
  </div>
  <section class="dataset-workspace" aria-labelledby="dataset-workspace-title">
    <div v-if="showingDetail" class="workspace-heading">
      <div class="workspace-title-block">
        <button class="link" data-testid="back-datasets" @click="backToList">
          ← 返回测评集列表
        </button>
        <div class="workspace-title-row">
          <h1 id="dataset-workspace-title">
            {{ detailState === 'ready' ? activeDataset?.name : '测评集详情' }}
          </h1>
          <p
            v-if="detailState === 'ready' && activeDataset?.description?.trim()"
            class="dataset-description"
          >
            {{ activeDataset.description }}
          </p>
        </div>
      </div>
      <div v-if="detailState === 'ready' && activeDataset" class="actions">
        <span v-if="activeDataset.archived">已归档 · 只读</span
        ><button
          v-if="activeDataset.archived"
          class="secondary"
          @click="restoreDataset(activeDataset)"
        >
          恢复测评集</button
        ><button
          class="secondary"
          :disabled="busy || activeDataset.archived"
          @click="openMetadata(activeDataset)"
        >
          编辑基本信息</button
        ><button v-if="activeVersion" class="secondary" @click="versionHistoryDialog = true">
          版本记录</button
        ><button
          v-if="activeVersion"
          class="secondary"
          @click="openExport(activeDataset.id, activeVersionId)"
        >
          导出样本
        </button>
      </div>
    </div>

    <DatasetCatalog
      v-show="!showingDetail"
      :items="datasets"
      :loading="loading"
      @select="openDataset($event, true)"
      @edit="openDataset($event, true)"
      @remove="removeDataset"
    >
      <template #actions>
        <button class="primary" data-testid="create-dataset" :disabled="busy" @click="openCreate">
          ＋ 创建测评集
        </button>
      </template>
    </DatasetCatalog>
    <DatasetCreateForm
      v-if="createV2Dialog"
      @close="createV2Dialog = false"
      @created="createdDataset"
    />
    <DatasetExportDialog
      v-if="exportTarget"
      :dataset-id="exportTarget"
      :initial-version-id="exportVersionId"
      :initial-ids="selectedSampleIds"
      @close="exportTarget = ''"
    />
    <SampleImportWizard
      v-if="draftImportTarget && showingDetail && editable"
      :key="draftImportTarget.id"
      :dataset-id="draftImportTarget.dataset_id"
      :dataset-name="activeDataset?.name ?? ''"
      :draft-import-target="draftImportTarget"
      @close="draftImportTarget = null"
      @draft-imported="finishDraftImport"
    />
    <SampleImportWizard
      v-if="sampleWizard"
      :dataset-id="activeDatasetId"
      :dataset-name="activeDataset?.name ?? ''"
      :draft-cases="activeVersion?.cases"
      :manual-only="sampleWizard === 'manual'"
      @close="sampleWizard = null"
      @imported="samplesImported"
    />
    <section v-if="showingDetail && detailState !== 'ready'" class="card">
      <p v-if="detailState === 'loading'" role="status">正在加载测评集…</p>
      <p v-else-if="detailState === 'missing'" role="alert">
        关联的测评集不存在或在当前空间不可见。
      </p>
      <p v-else-if="detailState === 'missing-version'" role="alert">
        关联的测评集版本不存在或在当前空间不可见。
      </p>
      <template v-else>
        <p role="alert">
          {{
            detailState === 'forbidden'
              ? '当前用户无权访问此测评集。'
              : '测评集详情加载失败，请重试。'
          }}
        </p>
        <button type="button" class="secondary" @click="openDataset(activeDatasetId)">重试</button>
      </template>
    </section>
    <template v-else-if="showingDetail">
      <VersionSelector
        v-if="activeDatasetId && !activeDataset?.archived"
        :versions="versions"
        :active-id="activeVersionId"
        :busy="busy"
        @select="selectVersion"
        @create-draft="createDraft"
        @publish="publishDraft"
        @discard="discardDraft"
        @add-sample="openManualSample"
        @import-draft="openDraftImport"
      />

      <p v-if="!activeVersion" role="status">当前没有可用版本。</p>
      <div v-else class="dataset-detail-tabs tabs" role="group" aria-label="测评集详情">
        <button
          type="button"
          :class="['tab', { active: detailTab === 'samples' }]"
          :aria-pressed="detailTab === 'samples'"
          @click="detailTab = 'samples'"
        >
          数据样本
        </button>
        <button
          type="button"
          :class="['tab', { active: detailTab === 'history' }]"
          :aria-pressed="detailTab === 'history'"
          @click="detailTab = 'history'"
        >
          关联测评历史
        </button>
      </div>
      <el-dialog v-model="versionHistoryDialog" title="版本记录" width="min(850px,94vw)"
        ><section class="dataset-tab-content">
          <table class="data-table">
            <thead>
              <tr>
                <th>版本</th>
                <th>状态</th>
                <th>样本数量</th>
                <th>发布时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in versions" :key="v.id">
                <td>{{ v.version == null ? '草稿' : 'v' + v.version }}</td>
                <td>{{ v.status === 'draft' ? '草稿' : '已发布' }}</td>
                <td>{{ v.cases.length }}</td>
                <td>{{ v.published_at ?? '—' }}</td>
                <td>
                  <button
                    class="link"
                    @click="
                      selectVersion(v);
                      detailTab = 'samples';
                      versionHistoryDialog = false;
                    "
                  >
                    查看样本
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section></el-dialog
      >
      <section
        v-if="activeVersion && detailTab === 'history'"
        class="dataset-tab-content"
        aria-label="关联测评历史"
      >
        <p v-if="activeVersion?.status === 'draft'" class="empty" role="status">
          草稿尚未发布，暂无关联测评任务
        </p>
        <template v-else-if="activeVersion?.status === 'published'">
          <p v-if="historyLoading" role="status">正在加载关联测评任务…</p>
          <p v-else-if="historyError" role="alert">
            无法加载测评历史。
            <button type="button" class="link" @click="loadHistory">重试</button>
          </p>
          <template v-else>
            <div class="history-table-wrap" role="region" aria-label="关联测评任务表格" tabindex="0">
              <table class="data-table history-table" aria-label="关联测评任务">
                <thead>
                  <tr>
                    <th scope="col">任务名称</th>
                    <th scope="col">版本</th>
                    <th scope="col">状态</th>
                    <th scope="col" aria-sort="descending">创建时间</th>
                    <th scope="col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="task in history?.items"
                    :key="task.task_id === null ? 'run:' + task.run_id : 'task:' + task.task_id"
                  >
                    <th scope="row">{{ task.name }}</th>
                    <td><span class="history-version">v{{ task.dataset_version }}</span></td>
                    <td>
                      <span class="history-status" :data-status="task.status">
                        {{ task.status === 'waiting' ? '等待中' : statusLabel(task.status) }}
                      </span>
                    </td>
                    <td>
                      <time :datetime="task.created_at">{{ creationTime(task.created_at) }}</time>
                    </td>
                    <td>
                      <RouterLink
                        class="link"
                        :to="'/' + taskPath(task)"
                        :aria-label="'查看任务 ' + task.name"
                        >查看任务</RouterLink
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="!history?.items.length" class="empty" role="status">当前版本暂无关联测评任务</p>
          </template>
          <div class="history-pagination">
            <span class="muted" aria-live="polite">第 {{ historyCursors.length }} 页</span>
            <button
              type="button"
              class="secondary"
              :disabled="historyLoading || historyCursors.length === 1"
              @click="previousHistoryPage"
            >
              上一页
            </button>
            <button
              type="button"
              class="secondary"
              :disabled="historyLoading || !history?.next_cursor"
              @click="nextHistoryPage"
            >
              下一页
            </button>
          </div>
        </template>
      </section>

      <el-alert
        v-if="validationIssues.length"
        class="validation-alert"
        title="草稿尚不能发布"
        type="error"
        :closable="false"
        show-icon
      >
        <ul>
          <li v-for="issue in validationIssues" :key="`${issue.path}-${issue.message}`">
            <code>{{ issue.path }}</code
            >：{{ issue.message }}
          </li>
        </ul>
      </el-alert>

      <section v-if="activeVersion && detailTab === 'samples'" class="samples-panel">
        <div class="sample-toolbar">
          <button v-if="sampleView" class="link" @click="backSamples">← 数据样本</button
          ><input
            v-else
            v-model="sampleQuery"
            class="input"
            aria-label="搜索数据样本"
            placeholder="搜索样本名称"
          /><span>{{ activeVersion?.cases.length ?? 0 }} 条样本</span
          ><button
            v-if="selectedSampleIds.length"
            class="secondary"
            @click="openExport(activeDatasetId, activeVersionId, selectedSampleIds)"
          >
            导出已选（{{ selectedSampleIds.length }}）
          </button>
        </div>
        <p v-if="activeDataset?.archived" class="muted">测评集已归档，当前版本只读。</p>
        <p v-else-if="!editable" class="muted">
          当前为已发布版本；如需修改或导入，请先创建草稿，已发布历史不会被覆盖。
        </p>
        <table v-if="!sampleView" class="samples-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="全选当前搜索样本"
                  :checked="
                    !!filteredSamples.length &&
                    filteredSamples.every((c) => selectedSampleIds.includes(c.id))
                  "
                  @change="
                    selectedSampleIds = ($event.target as HTMLInputElement).checked
                      ? filteredSamples.map((c) => c.id)
                      : []
                  "
                />
              </th>
              <th>样本名称</th>
              <th>用户输入</th>
              <th>轮次</th>
              <th>分类</th>
              <th>难度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredSamples" :key="c.id">
              <td>
                <input
                  type="checkbox"
                  v-model="selectedSampleIds"
                  :value="c.id"
                  :aria-label="'选择样本 ' + c.name"
                />
              </td>
              <td>
                <button class="link" @click="selectCase(c)">{{ c.name }}</button>
              </td>
              <td class="input-preview">{{ JSON.stringify(c.turns[0]?.input ?? {}) }}</td>
              <td>{{ c.turns.length }}</td>
              <td>{{ c.category ? caseCategoryLabels[c.category] : '—' }}</td>
              <td>{{ c.difficulty ? caseDifficultyLabels[c.difficulty] : '—' }}</td>
              <td>
                <button class="link" @click="selectCase(c)">{{ editable ? '编辑' : '查看' }}</button
                ><button v-if="editable" class="link" @click="copyCase(c)">复制</button
                ><button v-if="editable" class="link" @click="removeCase(c)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!sampleView && !filteredSamples.length" class="empty">
          {{ sampleQuery || !editable ? '暂无匹配的样本。' : '暂无样本。可点击「手动新增样本」或「导入测评集到样本」。' }}
        </p>
        <CaseEditor
          v-if="sampleView"
          ref="caseEditor"
          :item="editedCase"
          :editable="editable"
          :draft-cases="activeVersion?.cases"
          :saving="busy"
          :persisted="!!activeVersion?.cases.some((c) => c.id === editedCase?.id)"
          :validation-issues="activeCaseIssues"
          @save="saveCase"
          @dirty-change="editorDirty = $event"
        />
      </section>
    </template>

    <el-dialog
      v-model="datasetDialog"
      :title="
        dialogMode === 'create'
          ? '新建测评集'
          : dialogMode === 'edit'
            ? '编辑基本信息'
            : '复制测评集'
      "
      width="min(460px, 92vw)"
    >
      <el-form label-position="top">
        <el-form-item label="名称"
          ><el-input v-model="dialogName" data-testid="dataset-name"
        /></el-form-item>
        <el-form-item v-if="dialogMode !== 'copy'" label="描述"
          ><el-input v-model="dialogDescription" type="textarea" :rows="3"
        /></el-form-item>
        <el-form-item v-if="dialogMode === 'copy'" label="来源版本"
          ><select class="input" aria-label="复制来源版本" v-model="copyVersion">
            <option v-for="v in copySources" :key="v.version!" :value="v.version">
              v{{ v.version }} · {{ v.cases.length }} 条用例
            </option></select
          ><small>生成独立测评集草稿，不包含当前未发布修改。</small></el-form-item
        >
      </el-form>
      <template #footer
        ><el-button @click="datasetDialog = false">取消</el-button
        ><el-button
          type="primary"
          :loading="busy"
          data-testid="submit-dataset"
          @click="submitDatasetDialog"
          >{{
            dialogMode === 'create' ? '保存草稿' : dialogMode === 'edit' ? '保存' : '保存副本'
          }}</el-button
        ></template
      >
    </el-dialog>
  </section>
</template>

<style scoped>
.history-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.history-table {
  min-width: 390px;
}
.history-table tbody th {
  width: 100%;
  background: transparent;
  color: var(--el-text-color-primary);
  white-space: normal;
  overflow-wrap: anywhere;
}
.history-table time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: normal;
}
.history-table td {
  white-space: nowrap;
}
.history-status,
.history-version {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
}
.history-status[data-status='completed'] {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
}
.history-status[data-status='running'] {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
}
.history-status[data-status='failed'] {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger-dark-2);
}
.history-pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.history-pagination > span {
  margin-inline-end: auto;
}
.sample-toolbar {
  flex-wrap: wrap;
}
.samples-panel {
  padding: 20px 24px;
  overflow: auto;
}
.sample-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}
.sample-toolbar input {
  max-width: 360px;
}
.sample-toolbar span {
  margin-right: auto;
  color: #8190a6;
  font-size: 12px;
}
.samples-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.samples-table th,
.samples-table td {
  padding: 14px;
  border-bottom: 1px solid #e4eaf3;
  text-align: left;
}
.samples-table th {
  background: #f7f9fd;
  color: #8190a6;
}
.input-preview {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.samples-table td:last-child {
  white-space: nowrap;
}
.samples-table button {
  margin-right: 8px;
}
.ux-preview-drafts {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e9f1;
}
.ux-preview-drafts > h3 {
  font-size: 15px;
}
.ux-preview-drafts small {
  font-size: 12px;
  color: #8793a7;
  font-weight: 400;
  margin-left: 12px;
}
.ux-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
.ux-preview-grid article {
  border: 1px dashed #91aeef;
  border-radius: 12px;
  padding: 20px;
  background: #f8faff;
  overflow-wrap: anywhere;
}
.ux-preview-grid h3 {
  font-size: 17px;
}
.ux-preview-grid p {
  color: #78869d;
  font-size: 13px;
}
.ux-preview-label,
.ux-preview-tags span {
  font-size: 11px;
  color: #3c70dc;
  background: #edf2ff;
  border-radius: 6px;
  padding: 4px 8px;
}
.ux-preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
section.dataset-workspace {
  overflow: visible;
}
.dataset-workspace .dataset-layout {
  grid-template-columns: minmax(220px, 0.7fr) minmax(360px, 2fr);
  height: auto;
  max-height: none;
  align-items: start;
  overflow: visible;
}
.case-editor-container {
  min-width: 0;
}
.dataset-workspace :deep(.case-editor-panel) {
  overflow: visible;
  max-height: none;
}
.dataset-workspace :deep(.case-editor-panel > .dataset-panel-heading) {
  top: 64px;
}
.dataset-workspace :deep(.case-list-panel) {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 96px);
  overflow: auto;
}
.workspace-heading .link {
  margin-bottom: 12px;
}
.workspace-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}
.workspace-title-block {
  flex: 1 1 320px;
  min-width: 0;
}
.workspace-title-row {
  overflow-wrap: anywhere;
}
.workspace-title-row h1 {
  margin: 0;
}
.workspace-title-row .dataset-description {
  margin: 8px 0 0;
  white-space: pre-wrap;
}
.workspace-heading .actions {
  flex: 0 0 auto;
  max-width: 100%;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.workspace-heading .actions button {
  flex-shrink: 0;
  white-space: nowrap;
}
@media (max-width: 760px) {
  .workspace-title-block {
    flex: initial;
    width: 100%;
  }
  .workspace-heading .actions {
    align-self: stretch;
    justify-content: flex-start;
  }
  .dataset-workspace .dataset-layout {
    display: block;
    min-height: 0;
  }
  .dataset-workspace :deep(.case-list-panel) {
    position: static;
    max-height: 320px;
  }
  .dataset-workspace :deep(.case-editor-panel > .dataset-panel-heading) {
    position: static;
  }
}
</style>
