import { createRouter, createWebHistory, type LocationQuery } from 'vue-router'
const positions = new Map<string, { left: number; top: number }>()
const positionStorage = 'agentgate.ui.scroll-positions.v1'
const positionKey = (route: { path: string; query: LocationQuery }) => `${route.path}?${JSON.stringify(Object.entries(route.query).sort(([a], [b]) => a.localeCompare(b)))}`
try {
  const stored: unknown = JSON.parse(sessionStorage.getItem(positionStorage) ?? '[]')
  if (Array.isArray(stored)) for (const entry of stored.slice(-50)) {
    if (Array.isArray(entry) && typeof entry[0] === 'string' && entry[1] && Number.isFinite(entry[1].left) && Number.isFinite(entry[1].top)) positions.set(entry[0], entry[1])
  }
} catch { /* Browser storage may be unavailable; in-memory navigation still works. */ }
let navigation = 0
const router = createRouter({
  history: createWebHistory(),
  async scrollBehavior(to, from, saved) {
    const ticket = ++navigation
    if (!saved && to.path === from.path) return false
    const position = saved ?? positions.get(positionKey(to)) ?? { left: 0, top: 0 }
    // Reports load asynchronously; wait for their content before restoring a lower position.
    const deadline = performance.now() + 3000
    let interrupted = false
    const interrupt = () => { interrupted = true }
    const events = ['wheel', 'touchstart', 'keydown'] as const
    events.forEach(event => window.addEventListener(event, interrupt, { passive: true }))
    try {
      do {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        if (ticket !== navigation || interrupted) return false
        if (document.documentElement.scrollHeight - window.innerHeight >= position.top) break
      } while (performance.now() < deadline)
      return position
    } finally {
      events.forEach(event => window.removeEventListener(event, interrupt))
    }
  },
  routes: [
    {
      path: '/preview',
      component: () => import('../preview/PreviewWorkspace.vue'),
      children: [
        {
          path: '',
          component: () => import('../preview/pages/OverviewPage.vue'),
          meta: { title: '总览' },
        },
        {
          path: 'targets/:id?',
          component: () => import('../preview/pages/TargetsPage.vue'),
          meta: { title: '测评对象' },
        },
        {
          path: 'datasets/:id?',
          component: () => import('../preview/pages/DatasetsPage.vue'),
          meta: { title: '测评集' },
        },
        {
          path: 'evaluators/:id?',
          component: () => import('../preview/pages/EvaluatorsPage.vue'),
          meta: { title: '评估器' },
        },
        {
          path: 'runs/new',
          component: () => import('../preview/pages/RunCreatePage.vue'),
          meta: { title: '创建测评' },
        },
        {
          path: 'runs',
          component: () => import('../preview/pages/RunsPage.vue'),
          meta: { title: '测评任务' },
        },
        {
          path: 'runs/:id',
          component: () => import('../preview/pages/RunPage.vue'),
          meta: { title: '任务报告' },
        },
        {
          path: 'runs/:id/cases/:caseId',
          component: () => import('../preview/pages/CasePage.vue'),
          meta: { title: '用例证据与复核' },
        },
        {
          path: 'comparisons',
          component: () => import('../preview/pages/ComparisonsPage.vue'),
          meta: { title: '版本对比' },
        },
        {
          path: 'comparisons/:id',
          component: () => import('../preview/pages/ComparisonPage.vue'),
          meta: { title: '对比报告' },
        },
        {
          path: 'analysis',
          component: () => import('../preview/pages/AnalysisPage.vue'),
          meta: { title: '分析与改进' },
        },
        {
          path: 'resources',
          component: () => import('../preview/pages/ResourcesPage.vue'),
          meta: { title: '资源管理' },
        },
        {
          path: 'capabilities',
          component: () => import('../pages/CapabilityPage.vue'),
          meta: { title: '能力与接入' },
        },
        {
          path: ':pathMatch(.*)*',
          component: () => import('../preview/pages/NotFoundPage.vue'),
          meta: { title: '页面不存在' },
        },
      ],
    },
    { path: '/', component: () => import('../pages/OverviewPage.vue'), meta: { title: '总览' } },
    {
      path: '/targets',
      component: () => import('../pages/TargetListPage.vue'),
      meta: { title: '测评对象' },
    },
    {
      path: '/datasets',
      component: () => import('../pages/DatasetWorkspace.vue'),
      meta: { title: '测评集' },
    },
    {
      path: '/evaluators',
      component: () => import('../pages/EvaluatorWorkspacePage.vue'),
      meta: { title: '评估器' },
    },
    {
      path: '/runs',
      component: () => import('../pages/RunListPage.vue'),
      meta: { title: '测评任务' },
    },
    {
      path: '/runs/new',
      component: () => import('../pages/RunCreatePage.vue'),
      meta: { title: '创建测评' },
    },
    {
      path: '/runs/:runId',
      component: () => import('../pages/RunDetailPage.vue'),
      meta: { title: '任务详情' },
    },
    {
      path: '/runs/:runId/cases/:caseId',
      component: () => import('../pages/CaseResultPage.vue'),
      meta: { title: '用例证据' },
    },
    {
      path: '/capabilities',
      component: () => import('../pages/CapabilityPage.vue'),
      meta: { title: '能力与接入' },
    },
    {
      path: '/comparisons',
      component: () => import('../pages/RunComparisonPage.vue'),
      meta: { title: '版本对比' },
    },
    {
      path: '/lineage',
      component: () => import('../pages/LineagePage.vue'),
      meta: { title: '来源与关联任务' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/capabilities' },
  ],
})
router.beforeResolve((to, from) => {
  if (!from.matched.length) return
  positions.delete(positionKey(from))
  positions.set(positionKey(from), { left: window.scrollX, top: window.scrollY })
  const origin = to.query.origin ?? to.query.returnTo
  if (typeof origin === 'string' && /^\/(?!\/)[^\\\s]*$/.test(origin)) {
    const source = router.resolve(origin)
    if (source.path === from.path) positions.set(positionKey(source), { left: window.scrollX, top: window.scrollY })
  }
  if (positions.size > 50) positions.delete(positions.keys().next().value!)
  try { sessionStorage.setItem(positionStorage, JSON.stringify([...positions])) } catch { /* Memory-only fallback. */ }
})
export default router
