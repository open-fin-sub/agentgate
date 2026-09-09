import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.AGENTGATE_WEB_URL ?? 'http://127.0.0.1:15273'
const output = resolve(process.env.AGENTGATE_CAPTURE_OUTPUT ?? 'test-results/product-visual')
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const response = await page.request.get(`${baseURL}/api/runs?status=completed&limit=200`)
  const runs = await response.json()
  const run =
    runs.find(
      (r) =>
        r.manifest.dataset.dataset_id === 'loan-risk-policy' &&
        r.manifest.target.ref.external_version_id === 'loan-agent-v1-risky' &&
        r.manifest.primary_evaluator_ids.length > 1,
    ) ?? runs[0]
  if (!run) throw new Error('Run a real evaluation before capturing the product UI.')
  const report = await page.request.get(`${baseURL}/api/runs/${run.id}`).then((r) => r.json())
  const result = report.results.find((r) => r.outcome === 'fail') ?? report.results[0]
  const candidate = runs.find(
    (item) =>
      item.id !== run.id &&
      item.manifest.target.ref.external_version_id === 'loan-agent-v2-fixed' &&
      item.manifest.dataset.content_sha256 === run.manifest.dataset.content_sha256 &&
      JSON.stringify(item.manifest.primary_evaluator_ids) ===
        JSON.stringify(run.manifest.primary_evaluator_ids),
  )
  if (!candidate) throw new Error('A compatible candidate run is required for visual verification.')
  const routes = {
    overview: '/',
    configuration: `/runs/new?source=${run.id}`,
    tasks: '/runs',
    report: `/runs/${run.id}`,
    evidence: `/runs/${run.id}/cases/${result.case_id}?evaluator=${result.evaluator_id}&outcome=${result.outcome}`,
    dataset: `/datasets?dataset=${run.manifest.dataset.dataset_id}&version=${run.manifest.dataset.version}&case=${result.case_id}`,
    comparison: `/comparisons?baseline=${run.id}&candidate=${candidate.id}`,
    lineage: `/lineage?kind=run&id=${run.id}&source=${run.manifest.target.ref.source_id}`,
    related: `/lineage?kind=dataset&id=${run.manifest.dataset.dataset_id}&version=${run.manifest.dataset.version}`,
  }
  const checks = []
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const width of [1440, 1280, 1024, 768, 640, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const [name, route] of Object.entries(routes)) {
      await page.goto(`${baseURL}${route}`)
      await page.waitForLoadState('networkidle')
      if (name === 'comparison')
        await page.getByRole('heading', { name: '指标变化', exact: true }).waitFor()
      if (name === 'lineage' || name === 'related')
        await page.getByRole('heading', { name: '引用关系', exact: true }).waitFor()
      await page.locator('.el-loading-mask:visible').waitFor({ state: 'hidden' })
      if (name === 'dataset' && width < 768)
        await page.getByRole('button', { name: '用例详情', exact: true }).click()
      const data = await page.evaluate(() => {
        const heading = document.querySelector('h1')
        const sidebar = document.querySelector('.product-sidebar')
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          titleSize: heading && getComputedStyle(heading).fontSize,
          sidebarWidth: sidebar && getComputedStyle(sidebar).width,
          padding: getComputedStyle(document.querySelector('main')).paddingLeft,
        }
      })
      checks.push({ width, page: name, ...data })
      if (width === 1440 || width === 390)
        await page.screenshot({ path: resolve(output, `${name}-${width}.png`), fullPage: true })
    }
  }
  await writeFile(
    resolve(output, 'visual-checks.json'),
    JSON.stringify({ runId: run.id, candidateId: candidate.id, checks, errors }, null, 2),
  )
  const failures = checks.filter((c) => c.overflow || c.titleSize !== '32px')
  if (errors.length || failures.length) throw new Error(JSON.stringify({ errors, failures }))
  console.log(
    JSON.stringify({
      runId: run.id,
      candidateId: candidate.id,
      checks: checks.length,
      screenshots: Object.keys(routes).length * 2,
      output,
    }),
  )
} finally {
  await browser.close()
}
