import { test, expect, type Page } from '@playwright/test'
import { createSeed } from '../../src/preview/seed'
import type { PreviewState } from '../../src/preview/types'
import { parseRule } from '../../src/preview/components/PrepEvaluation'

test('unsupported rule fields and malformed schema constraints cannot silently pass validation', () => {
  expect(() =>
    parseRule(JSON.stringify({ type: 'regex', pattern: 'ok', applicableField: 'missing' })),
  ).toThrow('未支持的规则字段')
  expect(() => parseRule(JSON.stringify({ type: 'json', required: 'amount' }))).toThrow(
    '必填字段需逐项填写名称',
  )
  expect(() =>
    parseRule(
      JSON.stringify({ type: 'json', properties: { amount: { minimum: 10, maximum: 1 } } }),
    ),
  ).toThrow('最小值不能大于最大值')
})

async function seedPage(page: Page, state = createSeed()) {
  await page.addInitScript((seed) => {
    if (!localStorage.getItem('agentgate.preview.v2')) {
      localStorage.setItem('agentgate.preview.v2', JSON.stringify(seed))
    }
  }, state)
}
async function stored(page: Page): Promise<PreviewState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('agentgate.preview.v2')!))
}
async function select(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).press('Enter')
  await page.getByRole('option', { name: option, exact: false }).last().click()
}
async function checkbox(page: Page, label: string, checked = true) {
  await page.locator('label.el-checkbox').filter({ hasText: label }).click()
  await expect(page.getByRole('checkbox', { name: label, exact: true })).toBeChecked({ checked })
}

test('manual multi-turn input survives refresh and publishes Dataset v1', async ({ page }) => {
  await seedPage(page)
  await page.goto('/preview/datasets?mode=manual&target=agent-service&targetVersion=v2')
  await page.getByRole('button', { name: '新增用例', exact: true }).click()
  await page.getByLabel('用户输入（必填）', { exact: true }).fill('我想申请 80 万贷款')
  await page.getByLabel('预期表现', { exact: true }).fill('询问期限并核对申请条件')
  await page.getByRole('button', { name: '添加对话轮次', exact: true }).click()
  await page.getByRole('button', { name: '添加对话轮次', exact: true }).click()
  await page.getByLabel('第 2 轮输入', { exact: true }).fill('金额改成 90 万，期限不变')
  await page.getByLabel('第 2 轮期望', { exact: true }).fill('更新金额并保留期限')
  await page.getByRole('button', { name: '应用用例修改', exact: true }).click()
  await page.getByLabel('测评集名称（必填）', { exact: true }).fill('验收手工多轮测评集')
  await page.reload()
  await expect(page.getByLabel('测评集名称（必填）', { exact: true })).toHaveValue(
    '验收手工多轮测评集',
  )
  await expect(page.locator('.prep-case')).toContainText('金额改成 90 万')
  await page.getByRole('button', { name: '保存草稿，继续发布', exact: true }).click()
  await expect(page.getByText('请审阅问题、期望和上下文适配后勾选确认。')).toBeVisible()
  await checkbox(page, '已审阅全部用例，并核对期望、变量、文件和 Agent 上下文适配')
  await page.getByRole('button', { name: '保存草稿，继续发布', exact: true }).click()
  await page.getByPlaceholder('说明修订原因及主要变化').fill('已审阅多轮输入')
  await page.getByRole('button', { name: '发布新版本', exact: true }).click()
  await expect(page).toHaveURL(/version=1/)
  const dataset = (await stored(page)).datasets.find((item) => item.name === '验收手工多轮测评集')!
  expect(dataset.draft).toBeNull()
  expect(dataset.versions[0].cases).toHaveLength(1)
  expect(dataset.versions[0].cases[0].turns[1].expected).toBe('更新金额并保留期限')
})

test('automatic generation is deferred and an old link offers manual creation', async ({
  page,
}) => {
  await seedPage(page)
  await page.goto('/preview/datasets')
  await expect(page.getByRole('link', { name: '根据定义生成', exact: true })).toHaveCount(0)
  await page.goto('/preview/datasets?mode=generate&target=agent-service&version=v2')
  await expect(page.getByRole('button', { name: '生成可编辑预览', exact: true })).toHaveCount(0)
  await expect(page.getByText(/自动生成本轮范围外/)).toBeVisible()
  await expect(page.getByRole('button', { name: '新增用例', exact: true })).toBeVisible()
  await expect(page.locator('.prep-case')).toHaveCount(0)
})

test('merge deduplicates fixed versions and requires explicit conflict resolution with recoverable provenance', async ({
  page,
}) => {
  const state = createSeed()
  const loan = state.datasets.find((item) => item.id === 'ds-loan')!
  const candidate = structuredClone(loan)
  candidate.id = 'ds-loan-other'
  candidate.name = '另一套办理标准'
  candidate.versions[0].cases[0].expected = '新的办理期望：先核验身份'
  state.datasets.push(candidate)
  await seedPage(page, state)
  await page.goto('/preview/datasets?mode=merge&target=agent-service&version=v1')
  const sources = page.getByRole('combobox', { name: '来源测评集固定版本', exact: true })
  await sources.press('Enter')
  await page
    .getByRole('option')
    .filter({ hasText: '贷款办理 · Skill 单元集' })
    .filter({ has: page.locator('dd').filter({ hasText: /^1$/ }) })
    .click()
  await page
    .getByRole('option')
    .filter({ hasText: '另一套办理标准' })
    .filter({ has: page.locator('dd').filter({ hasText: /^1$/ }) })
    .click()
  await sources.press('Escape')
  await page.getByRole('button', { name: '检查来源与冲突', exact: true }).click()
  await expect(
    page.locator('.metadata-item').filter({ has: page.getByText('已去重用例数', { exact: true }) }),
  ).toHaveText('已去重用例数7')
  await expect(
    page.locator('.metadata-item').filter({ has: page.getByText('冲突组数', { exact: true }) }),
  ).toHaveText('冲突组数1')
  await expect(
    page.locator('.metadata-item').filter({ has: page.getByText('无冲突用例数', { exact: true }) }),
  ).toHaveText('无冲突用例数7')
  await page.getByRole('button', { name: '应用冲突方案并预览', exact: true }).click()
  await expect(page.getByText('请逐项选择冲突解决方案，不会自动丢弃差异。')).toBeVisible()
  await select(page, '冲突 1 解决方案', '保留全部差异用例')
  await page.getByRole('button', { name: '应用冲突方案并预览', exact: true }).click()
  await expect(page.getByRole('heading', { name: '用例（9）', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '用例（9）', exact: true })).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: '冲突 1 解决方案', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false')
  await checkbox(page, '保存为可长期复用的命名测评集', false)
  await checkbox(page, '已审阅全部用例，并核对期望、变量、文件和 Agent 上下文适配')
  await page.getByRole('button', { name: '保存草稿，继续发布', exact: true }).click()
  await expect(page).toHaveURL(/\/preview\/datasets\/ds-/)
  const data = await stored(page)
  const merged = data.datasets.find((item) => item.name === '客户服务助手 · Skill 用例组合')!
  expect(merged.ephemeral).toBe(true)
  expect(merged.draft).toHaveLength(9)
  expect(new Set(merged.draft!.map((item) => item.id)).size).toBe(9)
  expect(merged.draft!.flatMap((item) => item.sources)).toContain('ds-loan-other@1:case-01')
  expect(merged.draft!.flatMap((item) => item.sources)).toContain('ds-loan@1:case-01')
})

test('fixed Skill versions are visible while dataset versions remain independent with coverage information', async ({
  page,
}) => {
  await seedPage(page)
  await page.goto('/preview/targets/agent-service?version=v2')
  const parentUrl = page.url()
  const skillRef = page
    .locator('.ux-entity')
    .filter({ has: page.getByRole('button', { name: '贷款办理', exact: true }) })
  await expect(skillRef.locator('dd').filter({ hasText: /^v2$/ })).toBeVisible()
  await skillRef.getByRole('button', { name: '贷款办理', exact: true }).click()
  const detail = page.getByRole('dialog', { name: '测评对象详情' })
  await expect(detail.getByRole('heading', { name: '贷款办理', exact: true })).toBeVisible()
  await expect(detail.getByRole('link', { name: '全页打开', exact: true })).toHaveAttribute(
    'href',
    /^\/preview\/targets\/skill-loan\?version=v2&origin=/,
  )
  await expect(page).toHaveURL(parentUrl)
  await detail.getByRole('button', { name: '关闭此对话框' }).click()
  await page.getByRole('link', { name: '合并关联 Skill 用例', exact: true }).click()
  await page.getByRole('combobox', { name: '来源测评集固定版本', exact: true }).press('Enter')
  await expect(
    page.getByRole('option', { name: /贷款办理.*版本 1.*尚无 v2 单测记录/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('option', { name: /常见问题.*版本 1.*尚无 v2 单测记录/ }),
  ).toBeVisible()
})

test('JSON mapping rejects invalid rows and accepts the exported Mock envelope', async ({
  page,
}) => {
  await seedPage(page)
  await page.goto('/preview/datasets?mode=import&target=skill-loan')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify([
        { question: '', variables: '{}' },
        { question: '有效问题', variables: [] },
      ]),
    ),
  })
  await page.getByRole('button', { name: '校验全部行并预览', exact: true }).click()
  await expect(page.getByText(/第 1 行.*问题不能为空/)).toBeVisible()
  await expect(page.getByText(/第 2 行.*变量需要成组填写字段名与值/)).toBeVisible()
  await expect(page.locator('.prep-case')).toHaveCount(0)
  await page.locator('input[type="file"]').setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        source: 'AgentGate Mock 体验数据',
        data: [
          {
            prompt: '导入后核验申请条件',
            expected: '先说明资格',
            variables: { amount: 10 },
            tags: ['导入'],
          },
        ],
      }),
    ),
  })
  await select(page, '问题（必填）', 'prompt')
  await page.getByRole('button', { name: '校验全部行并预览', exact: true }).click()
  await expect(page.locator('.prep-case')).toHaveCount(1)
  await expect(page.locator('.prep-case')).toContainText('导入后核验申请条件')
  await expect(page.getByRole('link', { name: '导入 Excel 文件' })).toHaveAttribute(
    'href',
    '/datasets',
  )
})

test('rule trial, validation and version upgrades preserve evaluator and historical run snapshots', async ({
  page,
}) => {
  await seedPage(page)
  await page.goto('/preview/evaluators/ev-rule?version=1')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(
    page.locator('.prep-result').getByRole('heading', { name: '通过', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.prep-result')).toContainText('分数1.00 分')
  await page.getByRole('button', { name: '编辑并发布新版本', exact: true }).click()
  await page.getByRole('button', { name: '正则模板', exact: true }).click()
  await page.getByLabel('匹配表达式', { exact: true }).fill('[')
  await page.getByLabel('版本说明（发布时必填）', { exact: true }).fill('校验新规则')
  await page.getByRole('button', { name: '发布新版本', exact: true }).click()
  await expect(page.getByText(/文本匹配表达式或匹配选项无效/)).toBeVisible()
  await page.getByRole('button', { name: '正则模板', exact: true }).click()
  await page.getByRole('radio', { name: '文本', exact: true }).press('Space')
  await expect(page.getByRole('radio', { name: '文本', exact: true })).toBeChecked()
  await page.getByRole('textbox', { name: '实际输出', exact: true }).fill('直接批准')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(
    page.locator('.prep-result').getByRole('heading', { name: '不通过', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.prep-result')).toContainText('分数0.00 分')
  await page.getByRole('textbox', { name: '实际输出', exact: true }).fill('提交人工审核')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(
    page.locator('.prep-result').getByRole('heading', { name: '通过', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.prep-result')).toContainText('分数1.00 分')
  await page.getByRole('button', { name: '发布新版本', exact: true }).click()
  await expect(page).toHaveURL(/version=3/)
  await page.reload()
  const data = await stored(page)
  const rule = data.evaluators.find((item) => item.id === 'ev-rule')!
  expect(JSON.parse(rule.versions[0].rule).type).toBe('tool')
  expect(JSON.parse(rule.versions[2].rule).type).toBe('regex')
  const baseline = data.runs.find((item) => item.id === 'run-baseline')!
  expect(
    JSON.parse(baseline.evaluators.find((item) => item.id === 'ev-rule')!.versions[0].rule).type,
  ).toBe('tool')
})

test('LLM and composite single-sample outcomes separate NA, resource errors and short-circuited children', async ({
  page,
}) => {
  await seedPage(page)
  await page.goto('/preview/evaluators/ev-llm?version=1')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(page.locator('.prep-result')).toContainText('Mock 词面匹配评分示例')
  await page.getByLabel('期望输出（可选）', { exact: true }).fill('')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(
    page.locator('.prep-result').getByRole('heading', { name: '不适用', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.prep-result')).toContainText('分数无分数')
  await page.getByRole('button', { name: '编辑并发布新版本', exact: true }).click()
  await select(page, 'LLM 评分资源', '已失效的专用资源')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(
    page.locator('.prep-result').getByRole('heading', { name: '执行错误', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.prep-result')).toContainText('分数无分数')
  await page.goto('/preview/evaluators/ev-composite?version=1')
  await page.getByRole('textbox', { name: '实际输出 1 值', exact: true }).fill('wrong_tool')
  await page.getByRole('button', { name: '运行单样本试评', exact: true }).click()
  await expect(page.locator('.prep-result')).toContainText('未执行：前序失败触发短路')
  await expect(
    page.locator('.prep-result').getByRole('heading', { name: '不通过', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.prep-result')).toContainText('分数无分数')
})
