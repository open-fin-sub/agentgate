import { test, expect, type APIRequestContext } from '@playwright/test'
import type { Report } from '../../src/api/client'
import type { EvaluationComparison } from '../../src/types/comparison'

let baseline: string,
  candidate: string,
  incompatible: string,
  report: Report,
  comparison: EvaluationComparison
async function run(request: APIRequestContext, version: string, ids: string[]) {
  const response = await request.post('/api/evaluations', {
    data: { version, dataset_id: 'loan-risk-policy', dataset_version: 1, evaluator_ids: ids },
  })
  expect(response.status()).toBe(202)
  const { run_id } = await response.json()
  await expect
    .poll(async () => (await (await request.get(`/api/runs/${run_id}/status`)).json()).status, {
      timeout: 45000,
    })
    .toBe('completed')
  return run_id as string
}
test.beforeAll(async ({ request }) => {
  const catalog = await (await request.get('/api/evaluators')).json()
  const rules = catalog
    .filter((item: { kind: string }) => item.kind === 'rule')
    .map((item: { id: string }) => item.id)
  baseline = await run(request, 'loan-agent-v1-risky', rules)
  candidate = await run(request, 'loan-agent-v2-fixed', rules)
  incompatible = await run(request, 'loan-agent-v2-fixed', ['final-output'])
  report = await (await request.get(`/api/runs/${baseline}`)).json()
  const response = await request.get('/api/run-comparisons', {
    params: { baseline_run_id: baseline, candidate_run_id: candidate },
  })
  expect(response.ok()).toBeTruthy()
  comparison = await response.json()
})

test('real comparison uses server deltas, exposes counts, and preserves both evidence paths', async ({
  page,
}) => {
  await page.goto(`/comparisons?baseline=${baseline}`)
  await page.getByRole('combobox', { name: '候选运行 B', exact: true }).press('ArrowDown')
  await page.getByRole('option').filter({ hasText: candidate }).click()
  await page.getByRole('button', { name: '比较结果', exact: true }).click()
  await expect(page.getByRole('heading', { name: '指标变化', exact: true })).toBeVisible()
  await expect(page.getByText(/输入内容哈希一致/)).toBeVisible()
  await expect(page.getByText(/未核对：并发、超时/)).toBeVisible()
  if (page.viewportSize()!.width < 768) {
    const metrics = page.getByRole('region', { name: '指标变化明细' })
    expect(await metrics.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
      true,
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    await metrics.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => metrics.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  }
  await page.getByText('查看数量变化', { exact: true }).first().click()
  await expect(page.locator('.metric-counts').first()).toContainText('执行错误')
  const improvements = comparison.case_deltas.filter((item) => item.change === 'improvement')
  expect(improvements.length).toBeGreaterThan(0)
  await page.getByRole('button', { name: `改善 ${improvements.length} 项`, exact: true }).click()
  await page.reload()
  await expect(page).toHaveURL(/change=improvement/)
  await expect(page.locator('.comparison-case')).toHaveCount(
    Math.min(10, new Set(improvements.map((item) => item.case_id)).size),
  )
  await expect(page.locator('.comparison-evaluation')).toHaveCount(improvements.length)
  const parentUrl = page.url()
  await page.getByRole('button', { name: '查看基线证据', exact: true }).first().click()
  const before = page.getByRole('dialog', { name: '基线用例证据', exact: true })
  await expect(before.getByRole('link', { name: '全页打开' })).toHaveAttribute(
    'href',
    new RegExp(`/runs/${baseline}/cases/`),
  )
  const evaluatorRef = before
    .locator('.ux-entity')
    .filter({ has: page.getByRole('heading', { level: 3 }) })
  await expect(evaluatorRef.locator('dt').filter({ hasText: /^版本$/ })).toBeVisible()
  await expect(evaluatorRef.locator('dd').filter({ hasText: /^评估器$/ })).toBeVisible()
  await expect(page).toHaveURL(parentUrl)
  await before.getByRole('button', { name: '关闭此对话框' }).click()
  await expect(page).toHaveURL(/change=improvement/)
  await page.getByRole('button', { name: '查看候选证据', exact: true }).first().click()
  const after = page.getByRole('dialog', { name: '候选用例证据', exact: true })
  await expect(after.getByRole('link', { name: '全页打开' })).toHaveAttribute(
    'href',
    new RegExp(`/runs/${candidate}/cases/`),
  )
  await expect(page).toHaveURL(parentUrl)
})

test('incompatible and unknown runs show real errors without stale successful comparison', async ({
  page,
}) => {
  await page.goto(`/comparisons?baseline=${baseline}&candidate=${candidate}`)
  await expect(page.getByRole('heading', { name: '指标变化', exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: '候选运行 B', exact: true }).press('ArrowDown')
  await page.getByRole('option').filter({ hasText: incompatible }).click()
  await expect(page.getByRole('heading', { name: '指标变化', exact: true })).toHaveCount(0)
  await expect(page.getByText(/运行选择已更改/)).toBeVisible()
  await page.getByRole('button', { name: '比较结果', exact: true }).click()
  await expect(page.getByText('这两次运行不满足比较条件', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '指标变化', exact: true })).toHaveCount(0)
  await page.goto(`/comparisons?baseline=${baseline}&candidate=does-not-exist`)
  await expect(page.getByText('暂时无法读取对比', { exact: true })).toBeVisible()
})

test('real forward and reverse lineage preserve exact content and reach reports', async ({
  page,
}) => {
  await page.goto(`/runs/${baseline}`)
  await page.getByRole('button', { name: '来源与关联任务', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: '来源与关联任务', exact: true })
  await expect(page.getByRole('heading', { name: '引用关系', exact: true })).toBeVisible()
  await page.getByText(/查看 \d+ 条引用关系/, { exact: true }).click()
  await expect(drawer.locator('table')).toContainText('使用测评集')
  await page.locator('.asset-group > summary').filter({ hasText: '评估器' }).click()
  const evaluator = page.locator('.related-list article').filter({ hasText: 'final-state' })
  await evaluator.getByRole('button', { name: '查看此版本关联任务', exact: true }).click()
  await expect(drawer.getByRole('link', { name: '全页打开' })).toHaveAttribute(
    'href',
    /kind=evaluator/,
  )
  expect(
    new URL(
      (await drawer.getByRole('link', { name: '全页打开' }).getAttribute('href'))!,
      page.url(),
    ).searchParams.get('hash'),
  ).toMatch(/^[a-f0-9]{64}$/)
  await expect(page.getByText(/结果可能不是全部；可扩大查询上限/)).toBeVisible()
  await expect(page.getByRole('link', { name: '查看任务与报告' }).first()).toBeVisible()
  await page.goto(`/lineage?kind=dataset&id=loan-risk-policy&version=1`)
  await expect(page.getByRole('heading', { name: '关联测评任务', exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: '查询上限', exact: true }).press('ArrowDown')
  await page.getByRole('option', { name: '最多 200 条', exact: true }).click()
  await expect(page).toHaveURL(/limit=200/)
  const caseId = report.run.manifest.dataset.cases[0].id
  await page.goto(`/lineage?kind=case&id=loan-risk-policy&version=1&case=${caseId}`)
  await expect(page.getByRole('heading', { name: '关联测评任务', exact: true })).toBeVisible()
  await page.goto(`/runs/${baseline}`)
  await expect(drawer.getByRole('link', { name: '全页打开' })).toHaveAttribute(
    'href',
    /kind=evaluator/,
  )
  await drawer.getByRole('button', { name: '关闭此对话框' }).click()
  await page.getByRole('button', { name: '此对象版本的关联任务', exact: true }).click()
  await expect(drawer.getByRole('link', { name: '全页打开' })).toHaveAttribute(
    'href',
    /kind=target/,
  )
  expect(
    new URL(
      (await drawer.getByRole('link', { name: '全页打开' }).getAttribute('href'))!,
      page.url(),
    ).searchParams.get('hash'),
  ).toBe(report.run.manifest.target.descriptor_sha256)
  await expect(page.getByRole('heading', { name: '引用关系', exact: true })).toBeVisible()
  await page.goto('/lineage?kind=dataset&id=unknown&version=1')
  await expect(page.getByText('关系读取失败', { exact: true })).toBeVisible()
})

test('Judge response rendering distinguishes missing usage and sanitized execution errors (contract fixture)', async ({
  page,
}) => {
  const sample = structuredClone(report)
  const result = sample.results[0]
  result.judge_record = {
    provider_id: 'contract-provider',
    requested_model: 'requested-test-model',
    resolved_model: 'resolved-test-model',
    request_sha256: 'a'.repeat(64),
    raw_response: '{"score":0.8}',
    request_id: 'contract-request',
    input_tokens: null,
    output_tokens: 0,
    latency_ms: null,
  }
  result.error_detail = {
    category: 'invalid_output',
    exception_type: 'ValueError',
    message: '评分响应未满足当前结构',
    retryable: false,
    reference: null,
  }
  await page.route(`**/api/runs/${baseline}`, (route) => route.fulfill({ json: sample }))
  await page.goto(`/runs/${baseline}/cases/${result.case_id}?evaluator=${result.evaluator_id}`)
  const call = page.getByRole('region', { name: 'LLM 评分调用信息' })
  await expect(
    call.locator('dl > div').filter({ has: page.getByText('请求模型', { exact: true }) }),
  ).toHaveText('请求模型requested-test-model')
  await expect(
    call.locator('dl > div').filter({ has: page.getByText('实际模型', { exact: true }) }),
  ).toHaveText('实际模型resolved-test-model')
  await expect(call.locator('.ux-token-usage')).toContainText('输入 Token未采集')
  await expect(call.locator('.ux-token-usage')).toContainText('输出 Token0')
  await expect(call.locator('.ux-token-usage')).toContainText('总 Token未采集')
  await expect(page.getByRole('alert')).toContainText('评分响应未满足当前结构')
})

test('active task polling uses light activity until lifecycle changes (contract fixture)', async ({
  page,
}) => {
  await page.clock.install()
  let listReads = 0,
    activityReads = 0,
    completed = false
  const current = structuredClone(report.run)
  current.status = 'pending'
  await page.route('**/api/runs?*', (route) => {
    listReads++
    return route.fulfill({ json: [{ ...current, status: completed ? 'completed' : 'pending' }] })
  })
  await page.route('**/api/runs/activity?*', (route) => {
    activityReads++
    return route.fulfill({
      json: {
        status_counts: {},
        queued: completed ? [] : [{ run_id: current.id, status: 'pending' }],
        running: [],
        recent: [],
      },
    })
  })
  await page.goto('/runs')
  await expect(page.locator('.data-table .badge').filter({ hasText: /^排队中$/ })).toBeVisible()
  await page.clock.fastForward(5001)
  await expect.poll(() => activityReads).toBe(1)
  expect(listReads).toBe(1)
  completed = true
  await page.clock.fastForward(5001)
  await expect.poll(() => listReads).toBe(2)
  await expect(page.getByRole('link', { name: '查看报告', exact: true })).toBeVisible()
  await page.clock.fastForward(10001)
  expect(listReads).toBe(2)
  expect(activityReads).toBe(2)
})
