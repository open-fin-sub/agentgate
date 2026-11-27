import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import ExcelJS from 'exceljs';
import { passAuthGate } from './auth-gate';

test.beforeEach(async ({ page }) => {
  await page.goto('/agentgate/');
  await expect(page.getByRole('heading', { name: '欢迎页面' })).toBeVisible();
  await passAuthGate(page);
});

test('unavailable dataset link shows a persistent explanation without sample or editing controls', async ({
  page,
}) => {
  await page.route('**/api/datasets/deleted-original', (route) =>
    route.fulfill({
      status: 404,
      json: { code: '-1', data: null, message: 'unknown Dataset: deleted-original' },
    }),
  );
  await page.goto('/agentgate/#/datasets/deleted-original');
  await expect(page.getByRole('alert')).toHaveText('关联的测评集不存在或在当前空间不可见。');
  await expect(page.getByText('当前为已发布版本', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '创建空白草稿' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '手动新增样本', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '导入测评集到样本', exact: true })).toHaveCount(0);
  await expect(page.getByText('0 条样本', { exact: true })).toHaveCount(0);
  await page.getByTestId('back-datasets').click();
  await expect(page.getByTestId('create-dataset')).toBeVisible();
});

for (const failure of [403, 503, 'network'] as const) {
  test('dataset detail handles ' + failure + ' and can retry an empty draft', async ({ page }) => {
    let attempts = 0;
    const id = 'retry-dataset';
    await page.route('**/api/datasets/' + id, (route) => {
      if (++attempts === 1) {
        return failure === 'network'
          ? route.abort('failed')
          : route.fulfill({ status: failure, json: { detail: 'request failed' } });
      }
      return route.fulfill({
        json: {
          dataset: { id, name: '恢复可见的空草稿', description: '', archived: false },
          versions: [{ id: 'draft', status: 'draft', version: null, cases: [] }],
        },
      });
    });
    await page.goto('/agentgate/#/datasets/' + id);
    await expect(page.getByRole('alert')).toHaveText(
      failure === 403 ? '当前用户无权访问此测评集。' : '测评集详情加载失败，请重试。',
    );
    await expect(page.getByText('0 条样本', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '重试', exact: true }).click();
    await expect(page.getByRole('heading', { name: '恢复可见的空草稿' })).toBeVisible();
    await expect(page.getByRole('button', { name: '手动新增样本', exact: true })).toBeEnabled();
    await expect(page.getByText('0 条样本', { exact: true })).toBeVisible();
    expect(attempts).toBe(2);
  });
}

test('dataset detail ignores a previous request after navigation to an archived draft', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const slow = '**/api/datasets/slow-dataset';
  await page.route(slow, async (route) => {
    await pending;
    await route.fulfill({ status: 404, json: { detail: 'unknown dataset' } });
  });
  const id = 'read-only-draft';
  await page.route('**/api/datasets/' + id, (route) =>
    route.fulfill({
      json: {
        dataset: { id, name: '已归档的草稿', description: '', archived: true },
        versions: [{ id: 'draft', status: 'draft', version: null, cases: [] }],
      },
    }),
  );
  const started = page.waitForRequest(slow);
  await page.goto('/agentgate/#/datasets/slow-dataset');
  await started;
  try {
    await expect(page.getByText('正在加载测评集…')).toBeVisible();
    await expect(page.getByRole('button', { name: '创建空白草稿' })).toHaveCount(0);
    await page.evaluate((hash) => {
      location.hash = hash;
    }, '/datasets/' + id);
    await expect(page.getByRole('heading', { name: '已归档的草稿' })).toBeVisible();
    const finished = page.waitForResponse(slow);
    release();
    await finished;
    await expect(page.getByText('测评集已归档，当前版本只读。')).toBeVisible();
    await expect(page.getByRole('button', { name: '手动新增样本', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '导入测评集到样本', exact: true })).toHaveCount(0);
    await expect(page.getByTestId('publish-draft')).toHaveCount(0);
    await expect(page.getByText('当前为已发布版本', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally {
    release();
  }
});

test('dataset detail honors the linked publication when other versions still exist', async ({
  page,
}) => {
  const id = 'retained-dataset';
  await page.route('**/api/datasets/' + id, (route) =>
    route.fulfill({
      json: {
        dataset: { id, name: '多版本测评集', description: '', archived: false },
        versions: [
          { id: 'draft', status: 'draft', version: null, cases: [] },
          { id: 'publication', status: 'published', version: 2, cases: [] },
        ],
      },
    }),
  );
  const path = '/datasets/' + id;
  await page.goto('/agentgate/#' + path + '?version=1');
  await expect(page.getByRole('alert')).toHaveText('关联的测评集版本不存在或在当前空间不可见。');
  await expect(page.getByText('0 条样本', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('version-published-2')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '编辑基本信息' })).toHaveCount(0);
  await expect(page.getByTestId('publish-draft')).toHaveCount(0);
  await page.evaluate((hash) => {
    location.hash = hash;
  }, path + '?version=2');
  await expect(page.getByTestId('version-published-2')).toHaveClass(/active/);
  await expect(page.getByText('当前为已发布版本', { exact: false })).toBeVisible();
  await page.evaluate((hash) => {
    location.hash = hash;
  }, path + '?version=draft');
  await expect(page.getByTestId('version-draft-draft')).toHaveClass(/active/);
  await expect(page.getByTestId('publish-draft')).toBeVisible();
  await page.evaluate((hash) => {
    location.hash = hash;
  }, path);
  await expect(page.getByTestId('version-draft-draft')).toHaveClass(/active/);
  await expect(page.getByRole('button', { name: '手动新增样本', exact: true })).toBeEnabled();
});

test('deletes an unpublished dataset directly after confirmation', async ({ page, request }) => {
  const name = '未发布测评集 ' + randomUUID();
  const created = await request.post('/api/datasets', { data: { name } });
  expect(created.status()).toBe(201);
  const { dataset } = (await created.json()).data;
  const path = '/api/datasets/' + dataset.id;

  try {
    await page.getByRole('link', { name: '测评集', exact: true }).click();
    await page.getByLabel('搜索测评集').fill(dataset.id);
    const card = page.getByTestId('dataset-item-' + dataset.id);
    const more = card.getByRole('button', { name: name + '更多操作', exact: true });
    const remove = page.getByRole('menuitem', { name: '删除', exact: true });
    const dialog = page.getByRole('dialog', { name: '删除测评集', exact: true });

    await more.click();
    await expect(page.getByRole('menuitem', { name: '归档', exact: true })).toHaveCount(0);
    await remove.click();
    await expect(dialog).toContainText('此操作不可恢复');
    await expect(dialog.getByLabel('待删除版本')).toHaveCount(0);
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(card).toBeVisible();
    expect((await request.get(path)).status()).toBe(200);

    await more.click();
    await remove.click();
    const deleted = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === path + '/record' &&
        response.request().method() === 'DELETE',
    );
    await dialog.getByRole('button', { name: '删除', exact: true }).click();
    expect((await deleted).status()).toBe(200);
    await expect(page.getByText('测评集已删除', { exact: true })).toBeVisible();
    await expect(card).toHaveCount(0);
    expect((await request.get(path)).status()).toBe(404);
  } finally {
    await request.delete(path + '/record');
  }
});

test('archives a published dataset with an active draft and preserves both versions', async ({
  page,
  request,
}) => {
  const name = '已发布测评集 ' + randomUUID();
  const created = await request.post('/api/datasets', { data: { name } });
  expect(created.status()).toBe(201);
  const { dataset } = (await created.json()).data;
  const path = '/api/datasets/' + dataset.id;

  try {
    const added = await request.post(path + '/drafts/cases', {
      data: { name: '保留样本', turns: [{ input: { text: '你好' } }] },
    });
    expect(added.status()).toBe(201);
    expect((await request.post(path + '/drafts/publish')).status()).toBe(200);
    expect((await request.post(path + '/drafts', { data: { based_on_version: 1 } })).status()).toBe(
      201,
    );
    const before = (await (await request.get(path)).json()).data;
    expect(before.versions).toHaveLength(2);

    await page.getByRole('link', { name: '测评集', exact: true }).click();
    await page.getByLabel('搜索测评集').fill(dataset.id);
    const card = page.getByTestId('dataset-item-' + dataset.id);
    await expect(card).toContainText('有待发布修改');
    await card.getByRole('button', { name: name + '更多操作', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: '删除', exact: true })).toHaveCount(0);
    await page.getByRole('menuitem', { name: '归档', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '归档测评集', exact: true });
    await expect(dialog).toContainText('历史版本和测评报告仍可查看');
    await expect(dialog.getByLabel('待删除版本')).toHaveCount(0);
    const archived = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === path && response.request().method() === 'DELETE',
    );
    await dialog.getByRole('button', { name: '归档', exact: true }).click();
    expect((await archived).status()).toBe(200);
    await expect(page.getByText('测评集已归档', { exact: true })).toBeVisible();
    await expect(card).toHaveCount(0);

    const detail = await request.get(path);
    expect(detail.status()).toBe(200);
    const after = (await detail.json()).data;
    expect(after.dataset.archived).toBe(true);
    expect(after.versions).toEqual(before.versions);
    expect((await request.get(path + '/versions/1')).status()).toBe(200);

    await page.getByRole('link', { name: '测评任务', exact: true }).click();
    await page.getByRole('button', { name: '新建测评任务', exact: true }).click();
    const creation = page.getByRole('dialog', { name: '新建测评任务', exact: true });
    const picker = creation.getByLabel('任务测评集', { exact: true });
    await expect(picker.getByRole('option').first()).toBeAttached();
    await expect(picker.getByRole('option', { name, exact: true })).toHaveCount(0);
  } finally {
    await request.delete(path);
  }
});

test('a dataset whose publications were removed by an older release still offers archive', async ({
  page,
}) => {
  const dataset = {
    id: 'legacy-publications-removed',
    name: '历史发布版已移除的测评集',
    description: '',
    archived: false,
    deleted_version_high_watermark: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const draft = {
    id: 'remaining-draft', dataset_id: dataset.id, status: 'draft', version: null,
    based_on_version: 2, cases: [], updated_at: dataset.updated_at, notes: '',
  };
  const url = '/api/datasets/' + dataset.id;
  let versions = [draft];
  await page.route('**/api/datasets', (route) => route.fulfill({
    json: [{ ...dataset, version: null, case_count: 0, has_draft: versions.length > 0 }],
  }));
  await page.route('**' + url, (route) => route.fulfill({ json: { dataset, versions } }));
  await page.route('**' + url + '/drafts/current', (route) => {
    expect(route.request().method()).toBe('DELETE');
    versions = [];
    return route.fulfill({ status: 204 });
  });
  await page.getByRole('link', { name: '测评集', exact: true }).click();
  const card = page.getByTestId('dataset-item-' + dataset.id);
  await card.getByRole('button', { name: dataset.name + '更多操作' }).click();
  await expect(page.getByRole('menuitem', { name: '删除', exact: true })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: '归档', exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: '编辑草稿', exact: true }).click();
  await page.getByRole('button', { name: '放弃草稿', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '放弃草稿' });
  await expect(dialog).not.toContainText('删除整个测评集');
  await dialog.getByRole('button').last().click();
  await expect(page.getByText('草稿已放弃', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: dataset.name })).toBeVisible();
  await expect(page.getByText('当前没有可用版本。')).toBeVisible();
  await expect(page.getByText('当前为已发布版本', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '导出样本' })).toHaveCount(0);
  await expect(page.getByTestId('create-draft')).toBeVisible();
});

function sample(id: string, name: string, message: string) {
  return { id, name, turns: [{ input: { query: message } }] };
}

async function readVersion(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}

test('draft toolbar opens manual creation directly from a sample detail', async ({ page, request }) => {
  const created = await request.post('/api/datasets', { data: { name: '手动新增样本回归 ' + randomUUID() } });
  expect(created.status()).toBe(201);
  const { dataset } = (await created.json()).data;
  const path = '/api/datasets/' + dataset.id;
  const existing = sample(randomUUID(), '已有样本', '已有问题');
  expect((await request.post(path + '/drafts/cases', { data: existing })).status()).toBe(201);
  await page.goto('/agentgate/#/datasets/' + dataset.id + '?version=draft');
  await expect(page.getByRole('button', { name: /^(＋|\+)\s*新增样本$/ })).toHaveCount(0);
  await page.getByRole('button', { name: existing.name, exact: true }).click();
  await expect(page.getByRole('button', { name: /^(＋|\+)\s*新增样本$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '导入测评集到草稿', exact: true })).toHaveCount(0);
  const actions = page.locator('.version-actions').getByRole('button');
  await expect(actions).toHaveText(['手动新增样本', '导入测评集到样本', '放弃草稿', '发布']);
  const boxes = await actions.evaluateAll(buttons => buttons.map(button => {
    const { left, right, top, height } = button.getBoundingClientRect();
    return { left, right, top, height };
  }));
  const publish = boxes[3];
  for (const button of boxes.slice(0, 3)) {
    expect(button.height).toBe(publish.height);
    expect(button.top).toBe(publish.top);
  }
  for (let index = 1; index < boxes.length; index++) {
    const previous = boxes[index - 1], current = boxes[index];
    expect(current.left).toBeGreaterThanOrEqual(previous.right);
  }

  await page.getByRole('button', { name: '手动新增样本', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '手动新增样本', exact: true });
  await expect(dialog.getByRole('button', { name: /上一步|下一步|手动创建/ })).toHaveCount(0);
  await dialog.getByLabel('样本名称', { exact: true }).fill('从详情新增的样本');
  await dialog.getByLabel('用户输入', { exact: true }).fill('新增问题');
  await dialog.getByRole('button', { name: '保存样本', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: /创建完成/ })).toBeVisible();
  await dialog.getByRole('button', { name: '返回数据样本', exact: true }).click();
  await expect(page.getByRole('button', { name: '从详情新增的样本', exact: true })).toBeVisible();
  const draft = await readVersion(request, path + '/drafts/current');
  expect(draft.cases).toMatchObject([existing, { name: '从详情新增的样本', turns: [{ input: { txt: '新增问题' } }] }]);
});

test('imports JSON, CSV and Excel into a draft and blocks whole batches with name and ID conflicts', async ({ page, request }) => {
  const created = await request.post('/api/datasets', { data: { name: '文件导入回归 ' + randomUUID() } });
  expect(created.status()).toBe(201);
  const { dataset } = (await created.json()).data;
  const path = '/api/datasets/' + dataset.id;
  const original = sample(randomUUID(), '历史样本', '原始输入');
  const removed = sample(randomUUID(), '仅在发布版本中保留', '历史数据');
  for (const item of [original, removed]) {
    expect((await request.post(path + '/drafts/cases', { data: item })).status()).toBe(201);
  }
  expect((await request.post(path + '/drafts/publish')).status()).toBe(200);
  expect((await request.post(path + '/drafts', { data: { based_on_version: 1 } })).status()).toBe(201);
  const publication = await readVersion(request, path + '/versions/1');
  const draftPath = path + '/drafts/current';
  await page.goto('/agentgate/#/datasets/' + dataset.id + '?version=draft');

  const entry = page.getByRole('button', { name: '导入测评集到样本', exact: true });
  const dialog = page.getByRole('dialog', { name: '导入测评集到样本', exact: true });
  const file = dialog.getByLabel('样本导入文件');
  await entry.click();
  await expect(dialog.getByRole('radio', { name: '覆盖', exact: true })).toBeChecked();
  const replacement = sample(original.id, original.name, '覆盖后的输入');
  await file.setInputFiles({ name: '覆盖.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ cases: [replacement] })) });
  await expect(dialog.getByTestId('import-validation-summary')).toContainText('文件格式校验通过');
  await dialog.getByRole('button', { name: '确认覆盖导入' }).click();
  await expect(dialog).toBeHidden();
  const replaced = await readVersion(request, draftPath);
  expect(replaced.cases).toMatchObject([{ ...replacement, category: null, difficulty: null }]);
  await expect(page.getByText(removed.name, { exact: true })).toHaveCount(0);

  await entry.click();
  await dialog.getByRole('radio', { name: '追加', exact: true }).check();
  const conflictRows = [
    ['样本编号', '样本名称', '输入内容'],
    [randomUUID(), '同批的有效样本', JSON.stringify({ query: '有效' })],
    [randomUUID(), original.name, JSON.stringify({ query: '同名' })],
    [original.id, '与历史编号冲突', JSON.stringify({ query: '同编号' })],
  ];
  const asCsv = (rows: string[][]) => Buffer.from(
    rows.map(row => row.map(cell => '"' + cell.replaceAll('"', '""') + '"').join(',')).join('\n'),
  );
  await file.setInputFiles({ name: '冲突.csv', mimeType: 'text/csv',
    buffer: asCsv(conflictRows) });
  const summary = dialog.getByTestId('import-validation-summary');
  await expect(summary).toContainText('2 个样本与当前草稿冲突');
  const conflicts = dialog.getByRole('list', { name: '与草稿冲突的样本' });
  await expect(conflicts.getByRole('listitem')).toHaveCount(2);
  await expect(conflicts.getByRole('listitem').first()).toContainText(original.name + '：样本名称已存在');
  await expect(conflicts.getByRole('listitem').last()).toContainText('样本编号 ' + original.id);
  await expect(dialog.getByRole('button', { name: '确认追加导入' })).toBeDisabled();
  expect(await readVersion(request, draftPath)).toEqual(replaced);
  const fixedRows = conflictRows.slice(0, 2);
  await file.setInputFiles({ name: '冲突.csv', mimeType: 'text/csv',
    buffer: asCsv(fixedRows) });
  await expect(conflicts).toHaveCount(0);
  await dialog.getByRole('button', { name: '确认追加导入' }).click();
  await expect(dialog).toBeHidden();
  const corrected = await readVersion(request, draftPath);
  expect(corrected.cases).toMatchObject([
    replaced.cases[0], { ...sample(fixedRows[1][0], fixedRows[1][1], '有效'), category: null, difficulty: null },
  ]);

  await entry.click();
  await expect(dialog.getByRole('radio', { name: '覆盖', exact: true })).toBeChecked();
  await dialog.getByRole('radio', { name: '追加', exact: true }).check();
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Cases');
  const appendedId = randomUUID();
  sheet.addRows([
    ['样本编号', '样本名称', '轮次顺序', '输入内容', '样本分类', '难度'],
    [appendedId, '追加的两轮样本', 2, JSON.stringify({ query: '第二轮' }), '', '困难'],
    [appendedId, '追加的两轮样本', 1, JSON.stringify({ query: '第一轮' }), '', ''],
  ]);
  await file.setInputFiles({ name: '追加.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await book.xlsx.writeBuffer()) });
  await expect(summary).toContainText('1 个样本、2 轮对话');
  await dialog.getByRole('button', { name: '确认追加导入' }).click();
  await expect(dialog).toBeHidden();
  const appended = await readVersion(request, draftPath);
  expect(appended.cases).toMatchObject([
    ...corrected.cases, { id: appendedId, name: '追加的两轮样本', category: null, difficulty: 'hard',
      turns: [{ input: { query: '第一轮' } }, { input: { query: '第二轮' } }] },
  ]);
  await expect(page.getByText('追加的两轮样本', { exact: true })).toBeVisible();
  await page.getByTestId('version-published-1').click();
  await expect(entry).toHaveCount(0);
  await expect(page.getByRole('button', { name: '手动新增样本', exact: true })).toHaveCount(0);
  await expect(page.getByText(removed.name, { exact: true })).toBeVisible();
  expect(await readVersion(request, path + '/versions/1')).toEqual(publication);
});

test('a draft changed after file preview cannot be overwritten with the stale preview', async ({ page, request }) => {
  const created = await request.post('/api/datasets', { data: { name: '并发草稿导入 ' + randomUUID() } });
  expect(created.status()).toBe(201);
  const { dataset } = (await created.json()).data;
  const path = '/api/datasets/' + dataset.id;
  await page.goto('/agentgate/#/datasets/' + dataset.id);
  await page.getByRole('button', { name: '导入测评集到样本', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '导入测评集到样本', exact: true });
  await dialog.getByLabel('样本导入文件').setInputFiles({ name: '预览.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ cases: [sample(randomUUID(), '之前预览的样本', '旧预览')] })) });
  const confirm = dialog.getByRole('button', { name: '确认覆盖导入' });
  await expect(confirm).toBeEnabled();
  expect((await request.post(path + '/drafts/cases', { data: sample(randomUUID(), '另一窗口的更新', '并发输入') })).status()).toBe(201);
  const latest = await readVersion(request, path + '/drafts/current');
  await confirm.click();
  await expect(dialog.getByRole('alert')).toContainText('草稿已发生变化');
  await expect(confirm).toBeDisabled();
  expect(await readVersion(request, path + '/drafts/current')).toEqual(latest);
});
