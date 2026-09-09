import { test, expect, type Page } from '@playwright/test'

async function selectRole(page: Page, role: string) {
  await page.getByRole('combobox', { name: '体验角色' }).press('ArrowDown')
  await page.getByRole('option', { name: role, exact: true }).click()
}

test('evaluation users see resource status while management belongs to the administrator', async ({ page }) => {
  await page.goto('/preview/resources')
  await expect(page.getByRole('heading', { name: '资源状态', exact: true })).toBeVisible()
  const resourceStatus = page.locator('.resource-summary dt').filter({ hasText: /^状态$/ }).first()
  await expect(resourceStatus).toBeVisible()
  const bounds = await resourceStatus.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  for (const name of ['添加体验凭据', '保存公共限制', '导出资源记录', '测试', '停用']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
  }
  await expect(page.getByRole('columnheader', { name: '凭据', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '查看测评配置', exact: true })).toBeVisible()
  await selectRole(page, '资源管理员')
  await expect(page.getByRole('heading', { name: '资源管理', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加体验凭据', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: '保存公共限制', exact: true })).toBeEnabled()
  await expect(page.getByRole('columnheader', { name: '凭据', exact: true })).toBeVisible()
  await selectRole(page, '只读查看者')
  await expect(page.getByRole('button', { name: '添加体验凭据', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '保存公共限制', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '我的等待任务', exact: true })).toBeVisible()
  await page.goto('/targets')
  await expect(page.getByRole('combobox', { name: '体验角色' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '资源与队列', exact: true })).toHaveCount(0)
})
