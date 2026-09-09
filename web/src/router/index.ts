import { createRouter, createWebHistory } from 'vue-router'
export default createRouter({
  history: createWebHistory(),
  scrollBehavior: (to, from, saved) => saved ?? (to.path === from.path ? false : { top: 0 }),
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
