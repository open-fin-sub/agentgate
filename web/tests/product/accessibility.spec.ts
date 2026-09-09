import { test, expect, type Locator } from '@playwright/test'

async function textContrast(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    const luminance = (color: string) =>
      color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((c) => c / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
        .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
    const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a)
    return (values[0] + 0.05) / (values[1] + 0.05)
  })
}

test('shared controls and teleported dialog keep readable states and keyboard focus', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/datasets')
  await page.getByTestId('create-dataset').click()
  const dialog = page.getByRole('dialog', { name: '新建测评集' })
  const save = dialog.getByTestId('submit-dataset')
  await expect(save).toBeVisible()
  expect((await save.boundingBox())!.height).toBe(40)
  expect(await textContrast(save)).toBeGreaterThanOrEqual(4.5)
  await save.hover()
  expect(await textContrast(save)).toBeGreaterThanOrEqual(4.5)
  await save.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(save).toBeFocused()
  expect(await save.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByTestId('create-dataset')).toBeFocused()
  await page.goto('/runs/new')
  await expect(page.getByRole('button', { name: '提交测评', exact: true })).toBeVisible()
  const heights = await page
    .locator('.el-select__wrapper')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height))
  expect(heights.length).toBeGreaterThan(0)
  expect(heights.every((height) => height === 40)).toBeTruthy()
  const target = page.getByRole('combobox', { name: '对象版本', exact: true })
  await target.press('ArrowDown')
  await expect(page.getByRole('option').filter({ hasText: 'loan-agent-v2-fixed' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(target).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.goto('/capabilities')
  for (const type of ['success', 'warning', 'info']) {
    const tag = page.locator(`.el-tag--${type}`).first()
    await expect(tag).toBeVisible()
    expect(await textContrast(tag)).toBeGreaterThanOrEqual(4.5)
  }
})

test('scheduled input uses local time and survives reload without submitting a task', async ({
  page,
}) => {
  await page.goto('/preview/runs/new')
  const advanced = page.locator('summary').filter({ hasText: '执行参数与预约' })
  await advanced.click()
  await page.getByRole('checkbox', { name: '预约入队' }).press('Space')
  const time = page.getByRole('combobox', { name: '预约日期和时间', exact: true })
  await time.fill('2030-01-02 10:30')
  await time.press('Tab')
  await expect(time).toHaveValue('2030-01-02 10:30')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page.reload()
  await page.getByRole('link', { name: '恢复草稿', exact: true }).click()
  await page.locator('summary').filter({ hasText: '执行参数与预约' }).click()
  await expect(page.getByRole('checkbox', { name: '预约入队' })).toBeChecked()
  await expect(page.getByRole('combobox', { name: '预约日期和时间', exact: true })).toHaveValue(
    '2030-01-02 10:30',
  )
})
