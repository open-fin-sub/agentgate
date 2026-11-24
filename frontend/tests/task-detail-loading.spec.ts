import { test, expect, type Locator, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
async function workbookText(path: string) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(path);
  return JSON.stringify(book.worksheets[0].getSheetValues());
}


let server: ViteDevServer;
let url: string;
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="app"></div><script type="module">
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import ElementPlus from 'element-plus';
import { pinia } from '/src/stores/index.ts';
import { useAuthStore } from '/src/stores/modules/auth.ts';
import { embeddedMode } from '/src/integration/platform-url-context.ts';
import App from '/src/App.vue';
import Root from '/src/views/evaluation/index.vue';
import '/node_modules/element-plus/dist/index.css';
const params = new URL(location.href).searchParams;
if (params.has('responsive')) {
  await import('/src/styles/main.scss');
  await import('/src/styles/revision.scss');
}
const auth = useAuthStore(pinia);
if (params.has('bank')) auth.loginBank('test-token', 'team-a', 'Team A');
else if (!embeddedMode) auth.loginExternal();
const router = createRouter({history:createWebHashHistory(),routes:[{path:'/:pathMatch(.*)*',component:Root}]});
const app = createApp(App).use(pinia).use(router).use(ElementPlus);
window.detailHarness = {router, auth, unmount: () => app.unmount()};
app.mount('#app');
</script></body></html>`;

test.beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api') },
    plugins: [
      vue(),
      {
        name: 'task-detail-loading-test',
        configureServer(instance) {
          instance.middlewares.use('/__task-detail', async (_req, res, next) => {
            try {
              res.setHeader('Content-Type', 'text/html');
              res.end(await instance.transformIndexHtml('/__task-detail', html));
            } catch (error) {
              next(error);
            }
          });
        },
      },
    ],
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw Error('No test server');
  url = `http://127.0.0.1:${address.port}/__task-detail`;
});
test.afterAll(async () => {
  await server?.close();
});

const now = '2026-10-23T02:00:00Z';
const cases = Array.from({ length: 7 }, (_, i) => ({
  id: `case-${i + 1}`,
  name: `样本 ${i + 1}`,
  tags: [i % 2 ? 'B' : 'A'],
  turns: [{ id: 'turn-1', input: `问题 ${i + 1}`, expectations: [] }],
}));
const manifest = {
  target: {
    display_name: '智能体',
    ref: {
      source_id: 'bank',
      target_type: 'agent',
      external_target_id: 'agent',
      external_version_id: 'v1',
    },
  },
  dataset: {
    dataset_id: 'dataset',
    dataset_name: '测评集',
    version: 1,
    content_sha256: 'a'.repeat(64),
    cases,
  },
  selected_case_ids: null,
  evaluator_specs: [
    {
      id: 'rule',
      name: '规则',
      version: '1',
      kind: 'rule',
      content_sha256: 'b'.repeat(64),
      config: {},
    },
  ],
  primary_evaluator_ids: ['rule'],
  metric_plan: {},
  gate_spec: {},
  max_parallel_cases: 1,
  timeout_seconds: 300,
  max_retries: 0,
};
const results = cases.map((c) => ({
  case_id: c.id,
  evaluator_id: 'rule',
  evaluator_name: '规则',
  evaluator_version: '1',
  evaluator_kind: 'rule',
  metric: 'overall',
  outcome: 'pass',
  score: 1,
  reason: '通过',
  checks: [],
  details: {},
  evidence: [],
}));
const task = (id: string) => ({
  id,
  name: `任务 ${id}`,
  kind: id === 'ab' ? 'ab' : 'single',
  run_ids: id === 'ab' ? ['run-a', 'run-b'] : [`${id}-run`],
  static_report_ids: [],
});
const run = (id: string, status: string) => ({
  id,
  status,
  created_at: now,
  manifest,
  completed_at: status === 'completed' ? now : null,
});

const wideEvaluators = Array.from({ length: 12 }, (_, index) => ({
  ...manifest.evaluator_specs[0],
  id: `rule-${index + 1}`,
  name: `规则 ${index + 1}`,
}));
const wideManifest = {
  ...manifest,
  evaluator_specs: wideEvaluators,
  primary_evaluator_ids: wideEvaluators.map(({ id }) => id),
};
const wideResults = results.flatMap((result) =>
  wideEvaluators.map(({ id, name }) => ({ ...result, evaluator_id: id, evaluator_name: name })),
);
const taskSummary = {
  id: 'task',
  task_id: 'task',
  name: '任务 task',
  kind: 'single',
  created_at: now,
  status: 'completed',
  summary_pending: false,
  total_cases: 7,
  completed_cases: 7,
  previous_run_count: 0,
  runs: [
    {
      run_id: 'task-run',
      status: 'completed',
      summary_pending: false,
      target_name: '智能体',
      target_version: 'v1',
      dataset_name: '测评集',
      dataset_version: 1,
      evaluator_kinds: ['rule'],
      scoring_mode: null,
      total_cases: 7,
      completed_cases: 7,
      overall_score: 1,
      gate_reason: null,
    },
  ],
};
const event = {
  id: 'event-1',
  request_id: null,
  run_id: 'task-run',
  stage: 'submission',
  name: '接收任务配置',
  status: 'completed',
  case_id: null,
  turn_id: null,
  evaluator_id: null,
  attempt: 1,
  started_at: now,
  ended_at: now,
  duration_ms: 0,
  error_code: null,
  message: '测评任务已接收并记录配置快照。',
};

async function setup(
  page: Page,
  options: { status?: string; associationStatus?: number; responsive?: boolean } = {},
) {
  const calls: { path: string; headers: Record<string, string> }[] = [];
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let status = options.status ?? 'completed';
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    calls.push({ path, headers: route.request().headers() });
    const reply = (data: unknown) =>
      route.fulfill({ json: { code: '0', message: 'success', data } });
    if (options.responsive && path === '/api/evaluation-task-summaries')
      return reply({ items: [taskSummary], total: 1, page: 1, page_size: 20 });
    if (
      options.responsive &&
      ['/api/datasets', '/api/evaluators', '/api/bank-targets', '/api/local-targets'].includes(path)
    )
      return reply([]);
    if (path.startsWith('/api/stability-experiments/'))
      return reply({
        experiment: { id: 'stable', run_ids: ['stable-run'], created_at: now },
        runs: [
          {
            progress: { run_id: 'stable-run', status, total_cases: 7, completed_cases: 1 },
            score: null,
            outcome: null,
          },
        ],
        measured_runs: 0,
        mean: null,
        sample_variance: null,
        sample_stddev: null,
        min: null,
        max: null,
        complete: ['completed', 'failed', 'cancelled'].includes(status),
      });
    // Bulk reads are deliberately unavailable: detail rendering must not depend on them.
    if (path === '/api/runs' || path === '/api/evaluation-tasks')
      return route.fulfill({
        status: 500,
        json: { detail: 'Unrelated bulk query must not be called' },
      });
    if (path.startsWith('/api/evaluation-tasks/')) {
      if (options.associationStatus)
        return route.fulfill({
          status: options.associationStatus,
          json: { detail: 'Task unavailable' },
        });
      const detail = task(path.split('/').pop()!);
      return reply(detail);
    }
    if (path === '/api/run-comparisons')
      return reply({
        baseline_run_id: 'run-a',
        candidate_run_id: 'run-b',
        overall_score_delta: 0,
        metric_deltas: [],
        case_deltas: [],
      });
    const id = path.split('/')[3];
    if (path.endsWith('/manifest')) return reply(manifest);
    if (path.endsWith('/events')) return reply(options.responsive ? [event] : []);
    if (path.endsWith('/status'))
      return reply({
        run_id: id,
        status,
        total_cases: 7,
        completed_cases: status === 'completed' ? 7 : 1,
        progress: status === 'completed' ? 1 : 1 / 7,
        created_at: now,
      });
    if (path.endsWith('/samples')) return reply({ run: run(id, status), results, complete: false });
    if (path.endsWith('/sample-resource-usage')) return reply({items: cases.map(c => ({case_id: c.id, total_tokens: null, token_status: 'unavailable', duration_ms: 2000, duration_source: 'case_span'}))});
    if (path.includes('/traces/')) {
      const caseId = path.split('/').pop()!;
      const caseSpanId = '1000000000000001';
      const turnSpanId = '1000000000000002';
      const timing = { started_at: now, ended_at: '2026-10-23T02:00:02Z' };
      return reply({
        trace_id: `trace-${id}-${caseId}`,
        run_id: id,
        case_id: caseId,
        turn_outcomes: {
          'turn-1': {
            input: cases.find((sample) => sample.id === caseId)?.turns[0].input,
            output: `回答 ${caseId}`,
            state: {},
          },
        },
        final_output: { response: `完整回答 ${id}/${caseId}` },
        final_state: {},
        spans: [
          {
            span_id: caseSpanId,
            name: `样本执行 ${caseId}`,
            operation_type: 'case',
            sequence: 0,
            status: 'ok',
            attributes: {},
            ...timing,
          },
          {
            span_id: turnSpanId,
            parent_span_id: caseSpanId,
            name: `对话轮次 ${caseId}`,
            operation_type: 'turn',
            sequence: 1,
            status: 'ok',
            attributes: { 'agentgate.turn.id': 'turn-1' },
            ...timing,
          },
          {
            span_id: '1000000000000003',
            parent_span_id: turnSpanId,
            name: `检索节点 ${caseId}`,
            operation_type: 'tool',
            sequence: 2,
            status: 'error',
            attributes: {
              'trace_sdk.input': JSON.stringify({ query: `检索查询 ${id}/${caseId}` }),
              'trace_sdk.output': { result: `检索结果 ${id}/${caseId}` },
              'trace_sdk.error': { message: `检索错误 ${id}/${caseId}` },
            },
            ...timing,
          },
        ],
      });
    }
    if (/^\/api\/runs\/[^/]+$/.test(path))
      return reply({
        run: options.responsive ? { ...run(id, status), manifest: wideManifest } : run(id, status),
        results: options.responsive ? wideResults : results,
        metrics: [{ level: 'overall', key: 'overall', score: 1 }],
        release_gate: { outcome: 'pass' },
      });
    return route.fulfill({ status: 404, json: { detail: `Unexpected API ${path}` } });
  });
  return {
    calls,
    errors,
    setStatus: (next: string) => {
      status = next;
    },
  };
}
const count = (calls: { path: string }[], path: string) =>
  calls.filter((c) => c.path === path).length;
async function visibility(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}
const traces = (calls: { path: string }[]) => calls.filter((c) => c.path.includes('/traces/'));
async function open(page: Page, path = '/tasks/task', bank = false) {
  await page.goto(`${url}${bank ? '?bank=1' : ''}#${path}`);
}

async function expectPageToFit(main: Locator) {
  await expect
    .poll(() =>
      main.evaluate(
        ({ ownerDocument: { documentElement } }) =>
          documentElement.scrollWidth - documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

for (const layout of [
  { mode: 'external', width: 1092, height: 614 },
  { mode: 'external', width: 1366, height: 768 },
  { mode: 'bank', width: 1440, height: 1000 },
  { mode: 'bank', width: 1920, height: 1080 },
  { mode: 'external', width: 3840, height: 2160 },
  { mode: 'integrated', width: 640, height: 480 },
] as const) {
  test(`responsive task workflow at ${layout.width}×${layout.height} (${layout.mode})`, async ({
    page,
  }) => {
    const state = await setup(page, { responsive: true });
    const embedded = layout.mode === 'integrated';
    const destination = new URL(url);
    destination.searchParams.set('responsive', '1');
    destination.hash = '/tasks';
    if (layout.mode === 'bank') destination.searchParams.set('bank', '1');
    await page.setViewportSize(embedded ? { width: 1440, height: 1000 } : layout);
    const workspace = embedded ? page.frameLocator('#evaluation-frame') : page;
    if (embedded) {
      destination.searchParams.set('embedded', '1');
      destination.searchParams.set('token', 'test-token');
      destination.searchParams.set('teamId', 'team-a');
      destination.searchParams.set('userId', 'test-user');
      const host = new URL('/__responsive-task-host', url);
      await page.route(host.href, (route) =>
        route.fulfill({
          contentType: 'text/html; charset=utf-8',
          body: `<!doctype html><iframe id="evaluation-frame" title="测评工作区" width="${layout.width}" height="${layout.height}" src="${destination.href.replaceAll('&', '&amp;')}"></iframe>`,
        }),
      );
      await page.goto(host.href);
    } else {
      await page.goto(destination.href);
    }

    const main = workspace.getByRole('main').first();
    const name = main.getByRole('button', { name: '任务 task', exact: true });
    const logout = workspace.getByRole('button', { name: '登出 Logout', exact: true });
    await expect(name).toBeVisible({ timeout: 10000 });
    await expectPageToFit(main);
    if (embedded) {
      await expect(logout).toHaveCount(0);
      const navigation = workspace.getByRole('button', { name: '导航菜单' });
      await expect(navigation).toBeVisible();
      await expect(navigation).toHaveAttribute('aria-expanded', 'false');
      await navigation.click();
      await workspace.getByRole('link', { name: '测评集', exact: true }).click();
      await expect(main.getByRole('heading', { name: '测评集', exact: true })).toBeVisible();
      await expect(navigation).toHaveAttribute('aria-expanded', 'false');
      await navigation.click();
      await workspace.getByRole('link', { name: '测评任务', exact: true }).click();
      await expect(name).toBeVisible();
      await expect(navigation).toHaveAttribute('aria-expanded', 'false');
      await expect(name.locator('xpath=ancestor::tr')).toHaveCSS('display', 'grid');
    } else {
      await expect(logout).toBeVisible();
      await expect(main.getByRole('columnheader', { name: '任务名称' })).toBeInViewport();
    }
    if (layout.width === 1092) {
      const more = main.getByRole('button', { name: '更多', exact: true });
      await more.click();
      await expect(workspace.getByRole('menuitem', { name: '删除', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
    }
    if (layout.width === 3840) {
      const geometry = await main.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const sidebar = element.previousElementSibling!.getBoundingClientRect();
        return { width: box.width, left: sidebar.left, right: innerWidth - box.right };
      });
      expect(geometry.width).toBeGreaterThanOrEqual(2000);
      expect(geometry.width).toBeLessThanOrEqual(2200);
      expect(Math.abs(geometry.left - geometry.right)).toBeLessThanOrEqual(2);
    }
    await name.click();

    await expect(main.getByRole('heading', { name: '任务 task', exact: true })).toBeVisible();
    const scoreTable = main.getByRole('region', { name: '执行结果表格' });
    await expect(
      scoreTable.getByRole('columnheader', { name: '规则 12', exact: true }),
    ).toBeVisible();
    await expectPageToFit(main);
    if (layout.width >= 1920) {
      await expect
        .poll(() => scoreTable.evaluate((table) => table.scrollWidth - table.clientWidth))
        .toBeLessThanOrEqual(1);
    } else {
      const scroll = await scoreTable.evaluate((table) => {
        const first = table.querySelector('thead th')!;
        const left = first.getBoundingClientRect().left;
        table.scrollLeft = 300;
        return {
          distance: table.scrollLeft,
          offset: Math.abs(first.getBoundingClientRect().left - left),
        };
      });
      expect(scroll.distance).toBeGreaterThan(0);
      expect(scroll.offset).toBeLessThanOrEqual(2);
    }
    if (embedded) {
      await scoreTable.getByRole('button', { name: '样本详情', exact: true }).first().click();
      await expect(main.getByText('回答 case-1', { exact: true })).toBeVisible();
      const conversation = await main.getByRole('heading', { name: '单轮对话' }).boundingBox();
      const evaluation = await main.getByRole('heading', { name: '测评结果' }).boundingBox();
      expect(evaluation!.y).toBeGreaterThan(conversation!.y + conversation!.height);
      const trace = main.getByRole('region', { name: '执行轨迹追踪', exact: true });
      const tree = trace.getByRole('region', { name: '调用树', exact: true });
      const detail = trace.getByRole('region', { name: '轨迹详情', exact: true });
      await expect(tree).toBeVisible();
      await expect(detail).toBeVisible();
      const [treeBox, detailBox] = await Promise.all([tree.boundingBox(), detail.boundingBox()]);
      expect(detailBox!.y).toBeGreaterThanOrEqual(treeBox!.y + treeBox!.height);
      expect(Math.abs(detailBox!.x - treeBox!.x)).toBeLessThan(1);
      await tree.getByRole('button', { name: '全部展开', exact: true }).click();
      await tree.getByRole('button', { name: /^检索节点 case-1/ }).click();
      await expect(detail.getByLabel('节点元数据', { exact: true })).toContainText('检索节点 case-1');
      await expectPageToFit(main);
      await main.getByRole('button', { name: '任务详情', exact: true }).click();
    }

    const tabs = main.getByRole('navigation', { name: '测评任务详情页签' });
    await tabs.getByRole('button', { name: '任务快照', exact: true }).click();
    await expect(main.getByRole('heading', { name: '被测智能体', exact: true })).toBeVisible();
    await expectPageToFit(main);
    await tabs.getByRole('button', { name: '任务日志', exact: true }).click();
    const step = main.getByRole('button', { name: '提交任务', exact: true });
    await expect(step).toBeVisible();
    await step.click();
    await expect(main.getByText(event.message, { exact: true })).toBeVisible();
    await expectPageToFit(main);
    await main.getByRole('button', { name: '测评任务', exact: true }).click();
    await expect(name).toBeVisible();
    if (embedded) {
      await main.getByRole('button', { name: '新建测评任务', exact: true }).click();
      const dialog = workspace.getByRole('dialog', { name: '新建测评任务', exact: true });
      const cancel = dialog.getByRole('button', { name: '取消', exact: true });
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await expect(dialog.getByRole('button', { name: '开始测评', exact: true })).toBeInViewport({
        ratio: 1,
      });
      const bodyScroll = await dialog.locator('.el-dialog__body').evaluate((body) => {
        body.scrollTop = body.scrollHeight;
        return body.scrollTop;
      });
      expect(bodyScroll).toBeGreaterThan(0);
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await cancel.click();
      await expect(dialog).toHaveCount(0);
      await expect(name).toBeVisible();
    }

    const summaryRead = state.calls.find((call) => call.path === '/api/evaluation-task-summaries');
    expect(summaryRead).toBeDefined();
    expect(summaryRead?.headers['token']).toBe(
      layout.mode === 'external' ? undefined : 'test-token',
    );
    expect(summaryRead?.headers['x-user-id']).toBe(
      embedded ? 'test-user' : layout.mode === 'bank' ? '' : undefined,
    );
    expect(state.errors).toEqual([]);
  });
}

for (const bank of [false, true]) {
  test(`detail reads only the selected task and run (${bank ? 'bank' : 'external'})`, async ({
    page,
  }) => {
    const state = await setup(page);
    await open(page, '/tasks/task', bank);
    await expect(page.getByRole('heading', { name: '任务 task', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '样本详情', exact: true })).toHaveCount(7);
    await expect.poll(() => state.calls.map((c) => c.path)).toEqual([
      '/api/evaluation-tasks/task',
      '/api/runs/task-run/status',
      '/api/runs/task-run',
      '/api/runs/task-run/sample-resource-usage',
    ]);
    if (bank)
      expect(
        state.calls.every(
          (c) => c.headers['token'] === 'test-token' && c.headers['x-team-id'] === 'team-a',
        ),
      ).toBe(true);
    else
      expect(state.calls.every((c) => !c.headers['token'] && !c.headers['x-team-id'])).toBe(true);
    expect(state.errors).toEqual([]);
  });

  test(`sample trace tree and evidence stay local to the selected sample (${bank ? 'bank' : 'external'})`, async ({
    page,
  }) => {
    const state = await setup(page);
    await open(page, '/tasks/task', bank);
    await page.getByRole('button', { name: '样本详情', exact: true }).first().click();

    const explorer = page.getByRole('region', { name: '执行轨迹追踪', exact: true });
    const tree = explorer.getByRole('region', { name: '调用树', exact: true });
    const detail = explorer.getByRole('region', { name: '轨迹详情', exact: true });
    const metadata = detail.getByLabel('节点元数据', { exact: true });
    const panel = detail.getByRole('tabpanel');
    const turn = tree.getByRole('button', { name: /^对话轮次 case-1/ });
    const tool = tree.getByRole('button', { name: /^检索节点 case-1/ });
    const ioTab = detail.getByRole('tab', { name: '输入 / 输出', exact: true });
    await expect(tree.getByLabel('轨迹摘要', { exact: true })).toContainText('trace-task-run-case-1');
    await expect(detail.getByRole('heading', { name: '整条轨迹', exact: true })).toBeVisible();
    await expect(ioTab).toHaveAttribute('aria-selected', 'true');
    await expect(panel).toContainText('完整回答 task-run/case-1');
    await expect(turn).toHaveCount(0);
    const [treeBox, detailBox] = await Promise.all([tree.boundingBox(), detail.boundingBox()]);
    expect(detailBox!.x).toBeGreaterThanOrEqual(treeBox!.x + treeBox!.width);
    expect(Math.abs(detailBox!.y - treeBox!.y)).toBeLessThan(1);
    const initialReads = state.calls.length;

    await tree.getByRole('button', { name: '展开 样本执行 case-1', exact: true }).click();
    await expect(turn).toBeVisible();
    await expect(tool).toHaveCount(0);
    await tree.getByRole('button', { name: '折叠 样本执行 case-1', exact: true }).click();
    await expect(turn).toHaveCount(0);
    await tree.getByRole('button', { name: '全部展开', exact: true }).click();
    await expect(tool).toBeVisible();
    await tree.getByRole('button', { name: '全部折叠', exact: true }).click();
    await expect(tool).toHaveCount(0);
    await tree.getByRole('button', { name: '全部展开', exact: true }).click();

    await tool.click();
    await expect(tool).toHaveAttribute('aria-pressed', 'true');
    await expect(metadata).toBeVisible();
    await expect(metadata).toContainText('tool');
    await expect(metadata).toContainText('检索节点 case-1');
    await expect(metadata).toContainText('2.00 s');
    await expect(metadata).toContainText('错误');
    await expect(panel).toContainText('检索查询 task-run/case-1');
    await expect(panel).toContainText('检索结果 task-run/case-1');
    await expect(panel).toContainText('检索错误 task-run/case-1');
    await detail.getByRole('tab', { name: 'Formatted JSON', exact: true }).click();
    await expect(panel).toContainText(/"query":\s*"检索查询 task-run\/case-1"/);
    await turn.click();
    await expect(metadata).toContainText('turn');
    await expect(detail.getByRole('heading', { name: '对话轮次 case-1', exact: true })).toBeVisible();
    await expect(metadata).not.toContainText('检索节点 case-1');
    await expect(metadata).toContainText('成功');
    await expect(metadata).not.toContainText('错误');
    await expect(panel).toContainText('回答 case-1');
    await expect(panel).not.toContainText('检索查询 task-run/case-1');
    await tool.click();
    await detail.getByRole('tab', { name: '完整 Trace JSON', exact: true }).click();
    await expect(
      panel.locator('.trace-json-highlight').filter({ hasText: '检索节点 case-1' }),
    ).toBeVisible();
    await tree.getByRole('button', { name: '整条轨迹', exact: true }).click();
    await expect(metadata).toBeHidden();

    expect(state.calls).toHaveLength(initialReads);
    expect(traces(state.calls).map((call) => call.path)).toEqual(['/api/runs/task-run/traces/case-1']);
    await page.getByRole('button', { name: '下一条', exact: true }).click();
    await expect(panel).toContainText('完整回答 task-run/case-2');
    await expect(ioTab).toHaveAttribute('aria-selected', 'true');
    await expect(detail.getByRole('heading', { name: '整条轨迹', exact: true })).toBeVisible();
    await expect(tree.getByRole('button', { name: /^对话轮次 case-2/ })).toHaveCount(0);
    await page.getByRole('button', { name: '上一条', exact: true }).click();
    await expect(panel).toContainText('完整回答 task-run/case-1');
    await expect(turn).toHaveCount(0);
    expect(traces(state.calls).map((call) => call.path)).toEqual([
      '/api/runs/task-run/traces/case-1',
      '/api/runs/task-run/traces/case-2',
    ]);
    expect(state.errors).toEqual([]);
  });
}

test('sample navigation loads selected traces only and reuses task, report and trace', async ({
  page,
}) => {
  const state = await setup(page);
  await open(page);
  await page.getByRole('button', { name: '样本详情', exact: true }).first().click();
  await expect(page.getByText('回答 case-1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '下一条', exact: true }).click();
  await expect(page.getByText('回答 case-2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '上一条', exact: true }).click();
  await expect(page.getByText('回答 case-1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '任务详情', exact: true }).click();
  await expect(page.getByRole('heading', { name: '任务 task', exact: true })).toBeVisible();
  expect(traces(state.calls).map((c) => c.path)).toEqual([
    '/api/runs/task-run/traces/case-1',
    '/api/runs/task-run/traces/case-2',
  ]);
  expect(count(state.calls, '/api/evaluation-tasks/task')).toBe(1);
  expect(count(state.calls, '/api/runs/task-run')).toBe(1);
  expect(state.errors).toEqual([]);
});

test('direct sample link reads only its trace and can retry an unavailable trace', async ({
  page,
}) => {
  const state = await setup(page);
  await page.route('**/api/runs/task-run/traces/case-3', (route) =>
    route.fulfill({ status: 503, json: { detail: 'temporary trace failure' } }),
  );
  await open(page, '/tasks/task/samples/case-3');
  await expect(page.getByRole('button', { name: '重试读取轨迹' })).toBeVisible();
  await page.unroute('**/api/runs/task-run/traces/case-3');
  await page.getByRole('button', { name: '重试读取轨迹' }).click();
  await expect(page.getByText('回答 case-3', { exact: true })).toBeVisible();
  expect(traces(state.calls).map((c) => c.path)).toEqual(['/api/runs/task-run/traces/case-3']);
  expect(state.errors).toEqual([]);
});

test('full Excel automatically previews five rows and exports all executed samples regardless of the visible filter', async ({ page }) => {
  const state = await setup(page);
  await open(page);
  await page.getByLabel('样本场景', { exact: true }).selectOption('A');
  await page.getByRole('button', { name: '导出 Excel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '导出 Excel' });
  await expect(dialog.getByRole('table', { name: 'Excel 内容预览' }).locator('tbody tr')).toHaveCount(5);
  await expect(dialog.getByRole('button', { name: '预览前 5 行' })).toHaveCount(0);
  await expect(dialog).toContainText('共 7 行');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '开始导出', exact: true }).click();
  const excel = await workbookText((await (await download).path())!);
  expect(excel).toContain('实际输出');
  expect(excel).toContain('样本综合得分（样本级含多轮）');
  for (const c of cases) expect(excel).toContain(c.name);
  expect(traces(state.calls).map((c) => c.path.split('/').pop()).sort()).toEqual(cases.map((c) => c.id));
  expect(state.errors).toEqual([]);
});

test('missing trace is disclosed in Excel and a new export retries the evidence', async ({ page }) => {
  const state = await setup(page);
  await page.route('**/api/runs/task-run/traces/case-1', (route) =>
    route.fulfill({ status: 503, json: { detail: 'trace unavailable' } }),
  );
  await open(page);
  await page.getByRole('button', { name: '导出 Excel', exact: true }).click();

  const first = page.waitForEvent('download');
  await page.getByRole('button', { name: '开始导出', exact: true }).click();
  const partialExcel = await workbookText((await (await first).path())!);
  expect(partialExcel).toContain('执行轨迹读取失败');
  await expect(page.getByText('部分证据未取得，缺失说明已写入对应行；关闭弹窗后重新导出可重试。')).toBeVisible();
  await page.unroute('**/api/runs/task-run/traces/case-1');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '导出 Excel', exact: true }).click();

  const retry = page.waitForEvent('download');
  await page.getByRole('button', { name: '开始导出', exact: true }).click();
  const completeExcel = await workbookText((await (await retry).path())!);
  expect(completeExcel).not.toContain('执行轨迹读取失败');
  expect(completeExcel).toContain('回答 case-1');
  expect(state.errors).toEqual([]);
});

test('running task keeps polling current run and stops when completed', async ({ page }) => {
  const state = await setup(page, { status: 'running' });
  await page.clock.install();
  await open(page);
  await expect(page.getByRole('heading', { name: '任务 task', exact: true })).toBeVisible();
  expect(count(state.calls, '/api/runs/task-run/samples')).toBe(1);
  state.setStatus('completed');
  await page.clock.fastForward(5100);
  await expect(page.getByText('运行完成', { exact: true })).toBeVisible();
  const requests = state.calls.length;
  await page.clock.fastForward(15000);
  expect(state.calls).toHaveLength(requests);
  expect(count(state.calls, '/api/evaluation-tasks/task')).toBe(1);
  expect(traces(state.calls)).toHaveLength(0);
  expect(state.errors).toEqual([]);
});

for (const detail of [
  { name: 'single', route: '/tasks/task', endpoint: '/api/runs/task-run/status' },
  { name: 'ab', route: '/tasks/ab', endpoint: '/api/runs/run-a/status' },
  { name: 'stability', route: '/stability/stable', endpoint: '/api/stability-experiments/stable' },
]) {
  for (const bank of [false, true]) {
    test(`${detail.name} polls at 5s, pauses hidden, resumes, stops and cleans up (${bank ? 'bank' : 'external'})`, async ({
      page,
    }) => {
      const state = await setup(page, { status: 'running' });
      await page.clock.install();
      await open(page, detail.route, bank);
      await expect.poll(() => count(state.calls, detail.endpoint)).toBe(1);
      await page.clock.fastForward(4000);
      expect(count(state.calls, detail.endpoint)).toBe(1);
      await page.clock.fastForward(1100);
      await expect.poll(() => count(state.calls, detail.endpoint)).toBe(2);
      await visibility(page, true);
      await page.clock.fastForward(30000);
      expect(count(state.calls, detail.endpoint)).toBe(2);
      await visibility(page, false);
      await expect.poll(() => count(state.calls, detail.endpoint)).toBe(3);
      state.setStatus('completed');
      // The resumed request can finish and schedule its next poll after the clock jump.
      await expect.poll(async () => {
        if (count(state.calls, detail.endpoint) === 3) await page.clock.fastForward(5100);
        return count(state.calls, detail.endpoint);
      }).toBe(4);
      await page.clock.fastForward(30000);
      expect(count(state.calls, detail.endpoint)).toBe(4);
      if (bank) expect(state.calls.every((c) => c.headers['token'] === 'test-token')).toBe(true);
      else expect(state.calls.every((c) => !c.headers['token'])).toBe(true);
      await page.evaluate(() => (window as any).detailHarness.unmount());
      await visibility(page, true);
      await visibility(page, false);
      await page.clock.fastForward(30000);
      expect(count(state.calls, detail.endpoint)).toBe(4);
      expect(state.errors).toEqual([]);
    });
  }

  test(`${detail.name} ignores a response from before the tab was hidden`, async ({ page }) => {
    const state = await setup(page, { status: 'running' });
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let delayed = false;
    await page.route(`**${detail.endpoint}`, async (route) => {
      if (delayed) return route.fallback();
      delayed = true;
      await hold;
      const data =
        detail.name === 'stability'
          ? {
              experiment: { id: 'stable', run_ids: [], created_at: now },
              runs: [],
              measured_runs: 0,
              mean: null,
              min: null,
              max: null,
              complete: true,
            }
          : {
              run_id: detail.name === 'ab' ? 'run-a' : 'task-run',
              status: 'completed',
              total_cases: 7,
              completed_cases: 7,
              progress: 1,
              created_at: now,
            };
      await route.fulfill({ json: { code: '0', message: 'success', data } });
    });
    await page.clock.install();
    await open(page, detail.route);
    await expect.poll(() => delayed).toBe(true);
    await visibility(page, true);
    await page.clock.fastForward(30000);
    expect(count(state.calls, detail.endpoint)).toBe(0);
    await visibility(page, false);
    await expect.poll(() => count(state.calls, detail.endpoint)).toBe(1);
    release();
    // Network completion can schedule the next poll after a clock jump has finished.
    for (const minimum of [2, 3]) {
      await expect.poll(async () => {
        await page.clock.fastForward(5100);
        return count(state.calls, detail.endpoint);
      }).toBeGreaterThanOrEqual(minimum);
    }
    if (detail.name === 'single') expect(count(state.calls, '/api/runs/task-run')).toBe(0);
    await page.evaluate(() => (window as any).detailHarness.unmount());
    expect(state.errors).toEqual([]);
  });
}

test('embedded A/B reads only the two associated runs and both side details still open', async ({
  page,
}) => {
  const state = await setup(page);
  await open(page, '/tasks/ab');
  await expect(page.getByTestId('comparison-results')).toBeVisible();
  for (const side of ['A', 'B']) {
    await page.getByRole('button', { name: `实验 ${side} · 运行完成`, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '实验运行详情' });
    await expect(dialog.getByRole('button', { name: '样本详情', exact: true })).toHaveCount(7);
    await dialog.getByRole('button', { name: 'Close this dialog' }).click();
  }
  expect(
    state.calls.some((c) => c.path === '/api/runs' || c.path === '/api/evaluation-tasks'),
  ).toBe(false);
  expect(traces(state.calls)).toHaveLength(0);
  expect(state.errors).toEqual([]);
});

test('A/B candidate sample navigation retains candidate run identity', async ({ page }) => {
  const state = await setup(page);
  await open(page, '/tasks/ab');
  await page.getByRole('button', { name: '实验 B · 运行完成', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '实验运行详情' });
  await dialog.getByRole('button', { name: '样本详情', exact: true }).first().click();
  await expect(page.getByText('回答 case-1', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/tasks\/ab\/samples\/case-1\?run=run-b$/);
  await expect(
    page.getByRole('region', { name: '轨迹详情', exact: true }).getByRole('tabpanel'),
  ).toContainText('完整回答 run-b/case-1');
  expect(traces(state.calls).map((c) => c.path)).toEqual(['/api/runs/run-b/traces/case-1']);
  await page.getByRole('button', { name: '任务详情', exact: true }).click();
  await expect(page.getByTestId('comparison-results')).toBeVisible();
  expect(
    state.calls.some((c) => c.path === '/api/runs' || c.path === '/api/evaluation-tasks'),
  ).toBe(false);
  expect(state.errors).toEqual([]);
});

test('task and team changes reload context and run with current identity', async ({ page }) => {
  const state = await setup(page);
  await open(page);
  await expect(page.getByRole('button', { name: '样本详情', exact: true })).toHaveCount(7);
  await page.evaluate(() => (window as any).detailHarness.router.push('/tasks/other'));
  await expect(page.getByRole('heading', { name: '任务 other', exact: true })).toBeVisible();
  expect(count(state.calls, '/api/evaluation-tasks/other')).toBe(1);
  expect(count(state.calls, '/api/runs/other-run')).toBe(1);
  await page.evaluate(() =>
    (window as any).detailHarness.auth.loginBank('new-token', 'team-b', 'Team B'),
  );
  await expect.poll(() => count(state.calls, '/api/runs/other-run')).toBe(2);
  expect(state.calls.at(-1)?.headers['token']).toBe('new-token');
  expect(state.calls.at(-1)?.headers['x-team-id']).toBe('team-b');
  expect(state.errors).toEqual([]);
});

test('query-only tab navigation updates the tab without reloading the report', async ({ page }) => {
  const state = await setup(page);
  await open(page);
  await expect(page.getByRole('button', { name: '样本详情', exact: true })).toHaveCount(7);
  const tabs = page.getByRole('navigation', { name: '测评任务详情页签', exact: true });
  await expect(tabs.getByRole('button')).toHaveText([
    '执行结果',
    '低分样本',
    '优化迭代',
    '任务快照',
    '任务日志',
  ]);
  await page.evaluate(() =>
    (window as any).detailHarness.router.push('/tasks/task?tab=low-samples'),
  );
  await expect(page.getByRole('button', { name: '低分样本', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.evaluate(() => (window as any).detailHarness.router.push('/tasks/task'));
  await expect(page.getByRole('button', { name: '执行结果', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const taskLog = tabs.getByRole('button', { name: '任务日志', exact: true });
  await taskLog.click();
  await expect(taskLog).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/暂无执行流程记录/)).toBeVisible();
  expect(count(state.calls, '/api/runs/task-run/events')).toBeGreaterThan(0);
  expect(count(state.calls, '/api/runs/task-run')).toBe(1);
  expect(state.errors).toEqual([]);
});

test('detail rerun opens editable creation and cancellation preserves the original binding', async ({
  page,
}) => {
  const state = await setup(page);
  await page.route('**/api/datasets**', (route) => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.fallback();
    return route.fulfill({
      json: {
        code: '0',
        message: 'success',
        data:
          new URL(route.request().url()).pathname === '/api/datasets'
            ? [{ id: 'dataset', name: '测评集', version: 1 }]
            : { versions: [{ version: 1, cases }] },
      },
    });
  });
  await page.route('**/api/evaluators**', (route) => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.fallback();
    return route.fulfill({ json: { code: '0', message: 'success', data: [] } });
  });
  await open(page);
  await page.getByRole('button', { name: '任务快照', exact: true }).click();
  await page.getByRole('button', { name: '使用原配置重跑', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '新建测评任务', exact: true });
  await expect(dialog.getByLabel('任务名称', { exact: true })).toHaveValue('任务 task_重跑');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#\/tasks\/task$/);
  expect(count(state.calls, '/api/evaluation-tasks/task/rerun')).toBe(0);
  expect(count(state.calls, '/api/runs/new-run')).toBe(0);
  await page.getByRole('button', { name: '执行结果', exact: true }).click();
  await page.getByRole('button', { name: '样本详情', exact: true }).first().click();
  await expect(page.getByText('回答 case-1', { exact: true })).toBeVisible();
  expect(traces(state.calls).map((c) => c.path)).toEqual(['/api/runs/task-run/traces/case-1']);
  expect(state.errors).toEqual([]);
});

test('a late trace response cannot replace the newly selected sample', async ({ page }) => {
  const state = await setup(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started = false;
  await page.route('**/api/runs/task-run/traces/case-1', async (route) => {
    started = true;
    await held;
    await route.fallback();
  });
  try {
    await open(page);
    await page.getByRole('button', { name: '样本详情', exact: true }).first().click();
    await expect.poll(() => started).toBe(true);
    await page.getByRole('button', { name: '下一条', exact: true }).click();
    await expect(page.getByText('回答 case-2', { exact: true })).toBeVisible();
    release();
    await expect.poll(() => count(state.calls, '/api/runs/task-run/traces/case-1')).toBe(1);
    await expect(page.getByText('回答 case-2', { exact: true })).toBeVisible();
    await expect(page.getByText('回答 case-1', { exact: true })).toHaveCount(0);
    expect(state.errors).toEqual([]);
  } finally {
    release();
  }
});

test('403 is surfaced without bypassing task access checks; standalone 404 still uses run authorization', async ({
  page,
}) => {
  const state = await setup(page, { associationStatus: 403 });
  await open(page);
  await expect(page.getByRole('alert')).toContainText('Task unavailable');
  expect(state.calls.map((c) => c.path)).toEqual(['/api/evaluation-tasks/task']);
  await page.unroute('**/api/**');
  const standalone = await setup(page, { associationStatus: 404 });
  await open(page, '/results/standalone');
  await expect(page.getByRole('button', { name: '样本详情', exact: true })).toHaveCount(7);
  await expect.poll(() => standalone.calls.map((c) => c.path)).toEqual([
    '/api/evaluation-tasks/standalone',
    '/api/runs/standalone/status',
    '/api/runs/standalone',
    '/api/runs/standalone/sample-resource-usage',
  ]);
  expect(standalone.errors).toEqual([]);
});
