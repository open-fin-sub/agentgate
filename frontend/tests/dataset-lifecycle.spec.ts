import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
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
  await expect(page.getByRole('button', { name: '＋ 新增样本' })).toHaveCount(0);
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
    await expect(page.getByRole('button', { name: '＋ 新增样本' })).toBeEnabled();
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
    await expect(page.getByRole('button', { name: '＋ 新增样本' })).toBeDisabled();
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
  await expect(page.getByRole('button', { name: '＋ 新增样本' })).toBeEnabled();
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
