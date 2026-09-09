import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const output = process.env.AGENTGATE_CAPTURE_OUTPUT ?? path.resolve('test-results/preview-visual')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const checks = []
const routes = [
  '',
  'targets',
  'targets/agent-service',
  'datasets',
  'datasets/ds-service',
  'evaluators',
  'evaluators/ev-rule',
  'runs',
  'runs/new',
  'runs/run-baseline',
  'runs/run-baseline/cases/case-02',
  'comparisons',
  'comparisons/cmp-release',
  'analysis',
  'analysis?tab=static&target=agent-service&version=v1',
  'resources',
  'capabilities',
]
for (const width of [1440, 1280, 1024, 768, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } })
  const page = await context.newPage()
  for (const route of routes) {
    const errors = []
    const listener = (error) => errors.push(String(error))
    page.on('pageerror', listener)
    await page.goto(`http://127.0.0.1:15273/preview${route ? '/' + route : ''}`)
    await page.waitForLoadState('networkidle')
    if (route.includes('tab=static')) {
      await page.getByRole('button', { name: '检查此版本定义（Mock）', exact: true }).click()
      await page.locator('.static-risk').first().waitFor()
    }
    const heading = await page
      .locator('h1')
      .first()
      .innerText({ timeout: 10000 })
      .catch(() => '(missing)')
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: path.join(
          output,
          `${route.replace(/[^a-zA-Z0-9-]/g, '-') || 'overview'}-${width}.png`,
        ),
        fullPage: true,
      })
    checks.push({ route, width, heading, overflow: sizes.scroll > sizes.width + 1, errors })
    page.off('pageerror', listener)
  }
  await context.close()
}
await browser.close()
await writeFile(path.join(output, 'checks.json'), JSON.stringify(checks, null, 2))
console.log(JSON.stringify(checks, null, 2))
if (checks.some((c) => c.overflow || c.errors.length || c.heading === '(missing)'))
  process.exitCode = 1
