import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const stage = process.argv[2] ?? 'after'
const baseURL = process.env.AGENTGATE_WEB_URL ?? 'http://127.0.0.1:15273'
const output = resolve('C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal', stage)
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const records = []
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  const response = await page.request.get(`${baseURL}/api/runs?status=completed&limit=20`)
  const runs = response.ok() ? await response.json() : []
  const run = runs.find(item => item.manifest.primary_evaluator_ids.length > 1)
  if (!run) throw new Error('A real completed evaluation is required for before/after evidence.')
  const report = await page.request.get(`${baseURL}/api/runs/${run.id}`).then(r => r.json())
  const result = report.results.find(item => item.outcome === 'fail') ?? report.results[0]
  const routes = {
    'P10-create': `/runs/new?source=${run.id}`,
    'P11-report': `/runs/${run.id}`,
    'P12-evidence': `/runs/${run.id}/cases/${result.case_id}?evaluator=${result.evaluator_id}`,
    'P08-evaluators': '/evaluators',
    'P08-mock-editor': '/preview/evaluators/ev-rule?version=1',
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const [name, route] of Object.entries(routes)) {
      await page.goto(baseURL + route)
      await page.locator('h1').first().waitFor()
      await page.locator('.el-loading-mask').waitFor({ state: 'hidden' }).catch(() => {})
      await page.screenshot({ path: resolve(output, `${name}-${width}.png`), fullPage: true })
      records.push({ name, width, route, title: await page.locator('h1').first().innerText(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth) })
    }
  }
  await writeFile(resolve(output, 'capture.json'), JSON.stringify({ stage, baseURL, runId: run.id, records }, null, 2))
  console.log(JSON.stringify({ output, screenshots: records.length, runId: run.id }))
} finally { await browser.close() }
