import { test, expect } from '@playwright/test'
test('editing a real case preserves all six expectation types, identities and typed conditions', async ({ page, request }) => {
  const created = await request.post('/api/datasets', { data: { name: `完整预期保留-${Date.now()}`, description: '' } })
  expect(created.ok()).toBeTruthy()
  const { dataset } = await created.json()
  const expectations = [
    { id: 'route', name: '允许两个业务流程', kind: 'skill_route', condition: { kind: 'one_of', allowed: ['loan_approval', 'faq'] } },
    { id: 'required', name: '需要信用查询', kind: 'tool_call', tool: 'credit_inquiry', mode: 'required' },
    { id: 'policy', name: '保留高风险策略', kind: 'policy', policy_id: 'high_risk_requires_review' },
    { id: 'state', name: '不应批准', kind: 'state', path: 'approved', condition: { kind: 'equals', expected: false } },
    { id: 'argument', name: '零次重试', kind: 'tool_argument', tool: 'credit_inquiry', path: 'retries', occurrence: 'any', condition: { kind: 'equals', expected: 0 } },
    { id: 'output', name: '允许空输出', kind: 'output', path: null, condition: { kind: 'equals', expected: null } },
  ]
  const response = await request.post(`/api/datasets/${dataset.id}/drafts/cases`, { data: {
    id: 'complete-case', name: '复杂预期', category: 'boundary', difficulty: 'hard', tags: [], notes: '', initial_state: {},
    turns: [{ id: 'turn-1', input: { message: '请核对申请' }, expectations, notes: '' }],
  } })
  expect(response.ok()).toBeTruthy()
  await page.goto(`/datasets?dataset=${dataset.id}&case=complete-case`)
  await expect(page.getByTestId('case-name')).toHaveValue('复杂预期')
  await page.getByTestId('case-name').fill('复杂预期（仅修改名称）')
  await page.getByTestId('save-case').click()
  await expect(page.getByText('用例已保存到草稿', { exact: true })).toBeVisible()
  const draft = await (await request.get(`/api/datasets/${dataset.id}/drafts/current`)).json()
  expect(draft.cases[0].turns[0].expectations).toEqual(expectations)
  expect(draft.cases[0].turns[0]).not.toHaveProperty('expected_skill')
  expect(draft.cases[0].turns[0]).not.toHaveProperty('required_tools')
  await page.reload()
  await expect(page.getByTestId('case-name')).toHaveValue('复杂预期（仅修改名称）')
  await expect(page.getByRole('combobox', { name: '检查1判断方式', exact: true })).toHaveAttribute('aria-expanded', 'false')
})
