import { test, expect } from '@playwright/test'

test('corrupt storage is explicit and reset restores an actionable workspace', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('corruption-injected')) {
      localStorage.setItem('agentgate.preview.v2', '{broken')
      sessionStorage.setItem('corruption-injected', '1')
    }
  })
  await page.goto('/preview')
  await expect(page.locator('.preview-storage-alert')).toBeVisible()
  await page.getByRole('button', { name: '重置体验', exact: true }).click()
  await page.getByRole('button', { name: '重置体验数据', exact: true }).last().click()
  await expect(page.locator('.preview-storage-alert')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '总览', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.preview-storage-alert')).toHaveCount(0)
})

test('reload after another tab edits a dataset refreshes the editor baseline', async ({
  page,
  context,
}) => {
  await page.goto('/preview/datasets/ds-service?version=1')
  await page.getByRole('button', { name: '新建修订草稿', exact: true }).click()
  const other = await context.newPage()
  await other.goto('/preview/datasets/ds-service?version=1&draft=1')
  await other
    .locator('.prep-case')
    .filter({ hasText: 'case-01' })
    .getByRole('button', { name: '编辑用例', exact: true })
    .click()
  await other
    .getByLabel('期望输出 / 工具及业务要求', { exact: true })
    .fill('其他标签页保存的最新期望')
  await other.getByRole('button', { name: '应用用例修改', exact: true }).click()
  await other.getByRole('button', { name: '保存草稿', exact: true }).click()
  await expect(page.locator('.preview-storage-alert')).toBeVisible()
  await page.getByRole('button', { name: '重新加载体验数据', exact: true }).click()
  await expect(page.locator('.prep-case').filter({ hasText: 'case-01' })).toContainText(
    '其他标签页保存的最新期望',
  )
  await expect(page.locator('.preview-storage-alert')).toHaveCount(0)
})
