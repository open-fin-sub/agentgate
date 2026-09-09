import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.AGENTGATE_WEB_URL ?? 'http://127.0.0.1:15473'
const output = resolve(
  'C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal',
  process.argv[2] ?? 'contrast',
)
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const records = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const response = await page.request.get(`${baseURL}/api/runs?status=completed&limit=20`)
  if (!response.ok()) throw new Error('真实报告读取失败，不能用体验数据替代审计。')
  const runs = await response.json()
  const run = runs.find((item) => item.manifest.primary_evaluator_ids.length > 1)
  if (!run) throw new Error('审计需要真实完成的测评任务。')
  const report = await page.request.get(`${baseURL}/api/runs/${run.id}`).then((r) => r.json())
  const result = report.results[0]
  const routes = [
    '/',
    '/targets',
    '/datasets',
    '/evaluators',
    '/runs',
    '/comparisons',
    '/capabilities',
    `/runs/new?source=${run.id}`,
    `/runs/${run.id}`,
    `/runs/${run.id}/cases/${result.case_id}?evaluator=${result.evaluator_id}`,
    `/lineage?kind=run&id=${run.id}`,
    '/preview',
    '/preview/targets/agent-service?version=v1',
    '/preview/datasets/ds-service?version=1',
    '/preview/evaluators/ev-rule?version=1',
    '/preview/runs/new',
    '/preview/runs',
    '/preview/runs/run-baseline',
    '/preview/runs/run-baseline/cases/case-02',
    '/preview/comparisons',
    '/preview/comparisons/cmp-release',
    '/preview/analysis',
    '/preview/resources',
    '/preview/not-found',
  ]
  for (const route of routes) {
    await page.goto(baseURL + route)
    await page.locator('h1').first().waitFor()
    await expect(page.locator('.skeleton:visible,.el-loading-mask:visible')).toHaveCount(0)
    await page.evaluate(() => document.fonts.ready)
    const failures = await page.evaluate(() => {
      const rgba = (text) => {
        const parts = text.match(/[\d.]+/g)?.map(Number)
        return parts && parts.length >= 3
          ? [parts[0], parts[1], parts[2], parts[3] ?? 1]
          : [0, 0, 0, 0]
      }
      const blend = (fg, bg) => [
        ...fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3])),
        1,
      ]
      const luminance = (color) =>
        color
          .slice(0, 3)
          .map((c) => c / 255)
          .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
          .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
      const background = (element) => {
        const layers = []
        for (let node = element; node; node = node.parentElement)
          layers.unshift(rgba(getComputedStyle(node).backgroundColor))
        return layers.reduce((bg, fg) => blend(fg, bg), [255, 255, 255, 1])
      }
      const found = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent.trim(),
          element = node.parentElement
        if (
          !text ||
          !element ||
          !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) ||
          element.closest(
            'script,style,[aria-hidden="true"],[disabled],[aria-disabled="true"],.is-disabled',
          )
        )
          continue
        const style = getComputedStyle(element),
          bg = background(element),
          fg = blend(rgba(style.color), bg)
        const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
        const ratio = (values[0] + 0.05) / (values[1] + 0.05)
        if (ratio < 4.5)
          found.push({
            text: text.slice(0, 90),
            selector:
              element.tagName.toLowerCase() +
              (element.className
                ? '.' + String(element.className).trim().split(/\s+/).join('.')
                : ''),
            foreground: style.color,
            background: bg.slice(0, 3),
            ratio: Math.round(ratio * 100) / 100,
          })
      }
      return found
    })
    const content = await page.evaluate(() => {
      const main = document.querySelector('main') ?? document.body
      return {
        text: main.innerText,
        headings: [...main.querySelectorAll('h1,h2,h3')].filter(node => node.getClientRects().length).map(node => node.textContent.trim()),
        actions: [...main.querySelectorAll('button,a')].filter(node => node.getClientRects().length).map(node => ({ text: node.textContent.trim(), disabled: !!node.disabled })),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    })
    records.push({ route, title: await page.locator('h1').first().innerText(), failures, content })
    if (failures.length || content.overflow) console.log(JSON.stringify({ route, failures: failures.length, overflow: content.overflow }))
  }
  await writeFile(
    resolve(output, 'text-contrast.json'),
    JSON.stringify(
      {
        scope:
          '默认可见文本，按项目文字4.5:1；不含图像、伪元素、占位符、控件边框、悬停与禁用。扫描仅提供候选，不能代替WCAG完整验收。',
        records,
      },
      null,
      2,
    ),
  )
  console.log(JSON.stringify({ pages: records.length, textContrastCandidates: records.reduce((count, item) => count + item.failures.length, 0), overflowingPages: records.filter(item => item.content.overflow).length }))
} finally {
  await browser.close()
}
