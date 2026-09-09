import { expect, test } from '@playwright/test'

test('an empty dataset draft cannot be published and remains editable', async ({ page }) => {
  await page.goto('/datasets')
  await page.getByTestId('create-dataset').click()
  await page.getByTestId('dataset-name').fill(`空测评集-${Date.now()}`)
  await page.getByTestId('submit-dataset').click()
  await expect(page.getByText('测评集已创建')).toBeVisible()
  await page.getByTestId('publish-draft').click()
  await page.getByRole('button', { name: '确认发布', exact: true }).click()
  await expect(page.getByText('草稿尚不能发布')).toBeVisible()
  await expect(page.getByText('测评集至少需要一个用例')).toBeVisible()
  await expect(page.getByTestId('add-case')).toBeEnabled()
})

test('real published input → queued run → report → evidence → version correction', async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const name = `产品验收-${testInfo.project.name}-${Date.now()}`
  await page.goto('/datasets')
  await page.getByTestId('create-dataset').click()
  await page.getByTestId('dataset-name').fill(name)
  await page.getByTestId('submit-dataset').click()
  await expect(page.getByText('测评集已创建')).toBeVisible()
  await page.getByTestId('add-case').click()
  await page.getByTestId('case-name').fill('高风险申请应进入人工审核')
  for (const [index, [name, value]] of Object.entries({
    skill: 'loan_approval',
    application_id: 'PRODUCT-1',
    risk: 'high',
    amount: 80000,
  }).entries()) {
    if (index > 0) await page.getByRole('button', { name: '添加变量', exact: true }).click()
    await page.getByRole('textbox', { name: `变量 ${index + 1} 名称`, exact: true }).fill(name)
    if (typeof value === 'number') {
      await page
        .getByRole('combobox', { name: `变量 ${index + 1} 值类型`, exact: true })
        .press('Enter')
      await page.getByRole('option', { name: '数字', exact: true }).click()
      await page
        .getByRole('spinbutton', { name: `变量 ${index + 1} 值`, exact: true })
        .fill(String(value))
    } else
      await page.getByRole('textbox', { name: `变量 ${index + 1} 值`, exact: true }).fill(value)
  }
  await page.getByTestId('add-expectation').click()
  await page.getByRole('menuitem', { name: '最终状态' }).click()
  await page.getByTestId('expectation-path-1').fill('status')
  await page.getByRole('textbox', { name: '检查2期望值', exact: true }).fill('pending_review')
  await page.getByRole('textbox', { name: '检查2期望值', exact: true }).press('Tab')
  await page.getByTestId('publish-draft').click()
  await expect(page.getByText('请先保存当前用例，再验证并发布测评集。')).toBeVisible()
  await page.getByTestId('save-case').click()
  await expect(page.getByText('用例已保存到草稿')).toBeVisible()
  await page.getByTestId('publish-draft').click()
  await page.getByRole('button', { name: '继续编辑', exact: true }).click()
  await expect(page.getByTestId('version-draft-draft')).toHaveClass(/active/)
  await expect(page.getByTestId('version-published-1')).toHaveCount(0)
  await expect(page.getByTestId('case-name')).toHaveValue('高风险申请应进入人工审核')
  await page.getByTestId('publish-draft').click()
  await page.getByRole('button', { name: '确认发布', exact: true }).click()
  await expect(page.getByText('已发布 v1', { exact: true })).toBeVisible()
  await page.getByTestId('run-dataset-version').click()
  await expect(page).toHaveURL(/\/runs\/new\?dataset=.*version=1/)
  const datasetId = new URL(page.url()).searchParams.get('dataset')!
  await page.getByRole('combobox', { name: '对象版本', exact: true }).press('ArrowDown')
  await page.getByRole('option').filter({ hasText: 'loan-agent-v1-risky' }).click()
  const catalogs = await (await request.get('/api/evaluators')).json()
  await expect(page.getByRole('checkbox')).toHaveCount(catalogs.length)
  for (const checkbox of await page.getByRole('checkbox').all())
    if (!(await checkbox.isChecked())) await checkbox.press('Space')
  await page.getByRole('button', { name: '提交测评', exact: true }).click()
  await expect(page).toHaveURL(/\/runs\/[\w-]+$/)
  const runId = new URL(page.url()).pathname.split('/').pop()!
  await expect(page.getByRole('button', { name: '总体结果', exact: true })).toBeVisible({
    timeout: 45_000,
  })
  const report = await (await request.get(`/api/runs/${runId}`)).json()
  expect(report.run.status).toBe('completed')
  expect(report.run.manifest.dataset.dataset_id).toBe(datasetId)
  expect(report.run.manifest.dataset.version).toBe(1)
  expect(report.release_gate.outcome).toBe('fail')
  expect(report.results.some((r: { outcome: string }) => r.outcome === 'fail')).toBeTruthy()
  await page.getByRole('button', { name: '评估结果与用例', exact: true }).click()
  await page.getByRole('combobox', { name: '结果状态' }).press('ArrowDown')
  await page.getByRole('option', { name: '不通过', exact: true }).click()
  await expect(page).toHaveURL(/outcome=fail/)
  const reportUrl = page.url()
  await page.getByRole('button', { name: '查看证据', exact: true }).first().click()
  await expect(page).toHaveURL(reportUrl)
  await page
    .getByRole('dialog', { name: '用例证据', exact: true })
    .getByRole('link', { name: '全页打开', exact: true })
    .click()
  await expect(page).toHaveURL(/\/cases\//)
  const evidenceUrl = page.url()
  await expect(page.getByRole('heading', { name: '执行轨迹', exact: true })).toBeVisible()
  await expect(page.locator('.trace-step').first()).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: '高风险申请应进入人工审核', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: '查看用例与修订版本' }).click()
  await expect(page.getByTestId('version-published-1')).toHaveClass(/active/)
  await page.getByTestId('create-draft').click()
  await expect(page.getByText('新版本草稿已创建')).toBeVisible()
  await page.getByTestId('case-name').fill('高风险申请应进入人工审核（已修订）')
  await page.getByRole('link', { name: '返回原任务的用例证据' }).click()
  await expect(
    page.getByText('当前用例有未保存的修改。离开将放弃这些修改，请先保存或确认放弃。'),
  ).toBeVisible()
  await page.getByRole('button', { name: '继续编辑', exact: true }).click()
  await page.getByTestId('save-case').click()
  await expect(page.getByText('用例已保存到草稿')).toBeVisible()
  await page.getByTestId('publish-draft').click()
  await page.getByRole('button', { name: '确认发布', exact: true }).click()
  await expect(page.getByText('已发布 v2', { exact: true })).toBeVisible()
  await page.getByTestId('run-dataset-version').click()
  await expect(
    page
      .locator('.el-select')
      .filter({ has: page.getByRole('combobox', { name: '固定发布版本' }) }),
  ).toContainText('版本 2')
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.goto(evidenceUrl)
  await page.getByRole('link', { name: '查看用例与修订版本' }).click()
  await expect(page.getByTestId('version-published-1')).toHaveClass(/active/)
  await expect(page.getByTestId('case-name')).toHaveValue('高风险申请应进入人工审核')
  await page.getByRole('link', { name: '返回原任务的用例证据' }).click()
  await expect(page).toHaveURL(evidenceUrl)
  await page.getByRole('link', { name: '返回报告与筛选结果' }).click()
  const restoredEvidence = page.getByRole('dialog', { name: '用例证据', exact: true })
  await expect(restoredEvidence).toBeVisible()
  await restoredEvidence.getByRole('button', { name: '关闭此对话框' }).click()
  await expect(
    page.locator('.el-select').filter({ has: page.getByRole('combobox', { name: '结果状态' }) }),
  ).toContainText('不通过')
  await page.reload()
  await expect(
    page.locator('.el-select').filter({ has: page.getByRole('combobox', { name: '结果状态' }) }),
  ).toContainText('不通过')
  expect(errors).toEqual([])
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(overflow).toBe(false)
})

test('real Excel export/import and readable validation errors', async ({
  page,
  request,
}, testInfo) => {
  const datasets = await request.get('/api/datasets').then((r) => r.json())
  const source = datasets.find((d: { version: number | null }) => d.version !== null)
  await page.goto(`/datasets?dataset=${source.id}&version=${source.version}`)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 Excel', exact: true }).click()
  const file = await download
  const filePath = testInfo.outputPath('dataset-export.xlsx')
  await file.saveAs(filePath)
  await page.getByLabel('选择 JSON 或 Excel 测评集文件').setInputFiles(filePath)
  const dialog = page.getByRole('dialog', { name: '导入 Excel', exact: true })
  await dialog.getByRole('textbox').fill(`Excel验收-${testInfo.project.name}-${Date.now()}`)
  await dialog.getByRole('button', { name: '导入', exact: true }).click()
  await expect(page.getByText('测评集已导入', { exact: true })).toBeVisible()
  await expect(page.getByTestId('version-draft-draft')).toHaveClass(/active/)
  await page.getByTestId('publish-draft').click()
  await page.getByRole('button', { name: '确认发布', exact: true }).click()
  await expect(page.getByText('已发布 v1', { exact: true })).toBeVisible()
  await expect(page.getByTestId('version-published-1')).toHaveClass(/active/)
  await page.getByLabel('选择 JSON 或 Excel 测评集文件').setInputFiles({
    name: 'invalid.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('not a workbook'),
  })
  await dialog.getByRole('button', { name: '导入', exact: true }).click()
  const validation = page.getByRole('alert').filter({ hasText: '文件校验未通过' })
  await expect(validation).toBeVisible()
  await expect(validation).toContainText('列')
})

test('navigation and list filters preserve keyboard focus', async ({ page }, testInfo) => {
  await page.goto('/runs')
  await expect(page.getByRole('heading', { name: '测评任务', exact: true })).toBeVisible()
  const state = page.getByRole('combobox')
  await state.focus()
  await state.press('ArrowDown')
  await page.getByRole('option', { name: '已完成', exact: true }).click()
  await expect(page).toHaveURL(/status=completed/)
  await expect(state).toBeFocused()
  if (testInfo.project.name === 'mobile') {
    const toggle = page.getByRole('button', { name: '打开导航', exact: true })
    await toggle.click()
    await expect(page.getByRole('button', { name: '关闭导航', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await toggle.click()
    await page.getByRole('link', { name: '测评集', exact: true }).click()
    await expect(page).toHaveURL(/\/datasets$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('button', { name: '用例列表', exact: false })).toBeVisible()
  }
})

test('failed requests have recovery; missing version is never silently replaced', async ({
  page,
}) => {
  await page.route('**/api/overview', (route) =>
    route.fulfill({ status: 503, json: { detail: '验收网络错误' } }),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('暂时无法完成操作，请稍后重试。')
  await expect(page.getByRole('alert')).not.toContainText('验收网络错误')
  await expect(page.locator('.stat-number')).toHaveCount(0)
  await page.unroute('**/api/overview')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.locator('.stat-number')).toHaveCount(4)
  const first = await page.request.get('/api/datasets').then((r) => r.json())
  await page.goto(`/datasets?dataset=${first[0].id}&version=99999`)
  await expect(page.getByRole('alert')).toContainText('指定的测评集版本不存在')
  await expect(page.getByTestId('run-dataset-version')).toHaveCount(0)
})
