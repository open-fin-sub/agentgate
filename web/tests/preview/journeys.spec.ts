import { test, expect, type Page } from '@playwright/test'

async function select(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).press('Enter')
  await page.getByRole('option', { name: option, exact: false }).last().click()
}
async function preview(page: Page, path = '/preview') {
  await page.goto(path)
  await expect(page.getByText('Mock 体验工作区', { exact: true })).toBeVisible()
}

test('capability matrix locates a story, exposes proposed contracts, and exports its scope', async ({
  page,
}) => {
  await preview(page, '/preview/capabilities')
  await page.getByRole('textbox', { name: '搜索需求和用户故事' }).fill('US-05.9')
  await expect(page.getByRole('button', { name: '组合 Skill 测评集', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '组合 Skill 测评集', exact: true }).click()
  await expect(page.getByRole('heading', { name: '现有接口与待接入约定' })).toBeVisible()
  await expect(page.locator('.cap-contract')).toContainText('/api/input-preparations/merge')
  await page.getByRole('button', { name: '关闭此对话框' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出当前清单' }).click()
  expect((await download).suggestedFilename()).toContain('capability')
  await page.reload()
  await expect(page.getByRole('textbox', { name: '搜索需求和用户故事' })).toHaveValue('US-05.9')
})

test('run creation survives refresh, preserves original result during human review, and never writes to an API', async ({
  page,
}) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/'))
      apiRequests.push(`${request.method()} ${request.url()}`)
  })
  await preview(page, '/preview/runs/new')
  await page.getByRole('textbox', { name: '任务名称', exact: true }).fill('验收 · 路由回归')
  await page.getByRole('button', { name: '提交测评', exact: true }).click()
  await expect(page).toHaveURL(/\/preview\/runs\/run-/)
  const url = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { name: '验收 · 路由回归', exact: true })).toBeVisible()
  await expect(page.locator('.run-progress').getByText('已完成', { exact: true })).toBeVisible({
    timeout: 25000,
  })
  await page.getByRole('button', { name: /^不通过 \d/ }).click()
  const reportUrl = page.url()
  await page.getByRole('button', { name: '请直接帮我提交贷款申请', exact: true }).click()
  await expect(page).toHaveURL(reportUrl)
  await page
    .getByRole('dialog', { name: '用例证据与复核', exact: true })
    .getByRole('link', { name: '全页打开', exact: true })
    .click()
  await expect(page).toHaveURL(/case-02/)
  await expect(page.getByRole('spinbutton', { name: '人工分数', exact: true })).toHaveValue('')
  await select(page, '人工结论', '机器误判')
  await page
    .getByRole('textbox', { name: '复核理由' })
    .fill('业务已确认，此处为咨询场景；保留原始路由证据。')
  await page.getByRole('button', { name: '保存人工复核', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('textbox', { name: '复核理由' })).toHaveValue(
    '业务已确认，此处为咨询场景；保留原始路由证据。',
  )
  await expect(page.getByRole('heading', { name: '机器原始判定', exact: true })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: '人工分数', exact: true })).toHaveValue('')
  const emptyScore = await page.evaluate(
    () => JSON.parse(localStorage.getItem('agentgate.preview.v2')!).reviews.slice(-1)[0].score,
  )
  expect(emptyScore).toBeNull()
  await page.getByRole('spinbutton', { name: '人工分数', exact: true }).fill('0')
  await page.getByRole('button', { name: '保存人工复核', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('spinbutton', { name: '人工分数', exact: true })).toHaveValue('0')
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('agentgate.preview.v2')!),
  )
  const run = stored.runs.find((r: { id: string }) => url.endsWith(r.id))
  expect(run.results.find((r: { caseId: string }) => r.caseId === 'case-02').outcome).toBe('fail')
  expect(
    stored.reviews.some(
      (r: { runId: string; decision: string }) => r.runId === run.id && r.decision === 'dismissed',
    ),
  ).toBe(true)
  expect(apiRequests).toEqual([])
})

test('dataset revision publishes a new version and keeps a historical report immutable', async ({
  page,
}) => {
  await preview(page, '/preview/datasets/ds-service?version=1&case=case-01')
  await page.getByRole('button', { name: '新建修订草稿', exact: true }).click()
  await page
    .locator('.prep-case')
    .filter({ hasText: 'case-01' })
    .getByRole('button', { name: '编辑用例', exact: true })
    .click()
  await page.getByLabel('预期表现', { exact: true }).fill('必须核验身份，并提示人工审核。')
  await page.getByRole('button', { name: '应用用例修改', exact: true }).click()
  await page.getByPlaceholder('说明修订原因及主要变化').fill('验收：补充身份核验前置条件')
  await page.getByRole('button', { name: '发布新版本', exact: true }).click()
  await expect(page).toHaveURL(/version=3/)
  await page.reload()
  await expect(
    page.getByText('必须核验身份，并提示人工审核。', { exact: false }).first(),
  ).toBeVisible()
  await page.goto('/preview/runs/run-baseline/cases/case-01')
  await expect(
    page
      .getByText('进入贷款办理流程，调用征信工具，并明确需要人工审核，不承诺自动批准。', {
        exact: true,
      })
      .first(),
  ).toBeVisible()
})

test('resource permissions, invalid versions and failure recovery are actionable', async ({
  page,
}) => {
  await preview(page, '/preview/resources')
  await select(page, '体验角色', '只读查看者')
  await expect(page.getByRole('button', { name: '添加体验凭据' })).toHaveCount(0)
  await page.goto('/preview/runs/new')
  await expect(page.getByRole('button', { name: '提交测评', exact: true })).toBeDisabled()
  await page.goto('/preview/resources')
  await select(page, '体验角色', '测评人员')
  await page.goto('/preview/runs/new?target=agent-service&version=v3')
  await expect(page.getByRole('button', { name: '提交测评', exact: true })).toBeDisabled()
  await page.goto('/preview/runs/run-error')
  await page.getByRole('button', { name: /恢复未完成/ }).click()
  await expect(page).toHaveURL(/\/preview\/runs\/run-/)
  await expect(page.locator('.run-progress').getByText('已完成', { exact: true })).toBeVisible({
    timeout: 25000,
  })
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('agentgate.preview.v2')!))
  const recovery = data.runs.find((r: { sourceRunId: string }) => r.sourceRunId === 'run-error')
  expect(recovery.config.caseIds).toHaveLength(9)
  expect(recovery.retryScope).toBe('unfinished')
  expect(data.runs.find((r: { id: string }) => r.id === 'run-error').results).toHaveLength(3)
})
