import fs from 'node:fs'
import path from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'

// Task-specific empty states reviewed against each surrounding page, in source order.
const copy = {
  'pages/CapabilityPage.vue': [
    ['没有匹配的需求', '调整需求关键词或能力状态，查看相关使用场景与接入要求。'],
  ],
  'pages/CaseResultPage.vue': [
    ['本用例缺少评分结果', '请返回报告核对任务进度和缺失结果；已采集的输入与输出仍可查看。'],
    ['未采集到执行步骤', '可先核对输入、输出与评分依据；需要调用详情时，请联系任务负责人。'],
  ],
  'pages/EvaluatorWorkspacePage.vue': [
    ['没有匹配的评估器', '请调整搜索词；仍找不到所需标准时，请联系管理员确认可用评分标准。'],
  ],
  'pages/LineagePage.vue': [
    [
      '没有关联任务',
      '此版本尚无可查看的测评记录。可到任务列表选择其他报告。',
      '/runs',
      '查看测评任务',
    ],
    ['没有更多关联记录', '可先查看上方版本信息与关联任务，或返回原报告核对本次测评。'],
  ],
  'pages/OverviewPage.vue': [
    ['还没有测评记录', '选择测评对象、已发布测评集和评分标准，开始首次测评。'],
  ],
  'pages/RunComparisonPage.vue': [
    ['没有匹配的结果', '调整用例或变化类型筛选，查看其他结果。'],
    ['选择两份报告开始对比', '先在上方选择基线和候选任务，再点击对比，核对指标与用例变化。'],
  ],
  'pages/RunDetailPage.vue': [
    ['没有匹配的评分结果', '调整用例或评估器筛选，查看其他结果；任务进行中时可稍后回来查看。'],
  ],
  'pages/RunListPage.vue': [['没有匹配的测评任务', '清除筛选查看全部任务，或创建一次测评。']],
  'pages/RunWorkspacePage.vue': [['没有匹配的测评任务', '调整上方筛选条件，或创建一次测评。']],
  'preview/components/AnalysisStatic.vue': [
    [
      '找不到对象或定义版本',
      '请选择可查看的对象与版本，再检查定义风险。',
      '/preview/targets',
      '选择测评对象',
    ],
    ['还没有定义检查记录', '点击上方“检查此版本定义”，查看所选版本的潜在风险。'],
  ],
  'preview/components/CompareEvidence.vue': [
    ['此侧缺少用例快照', '请核对另一侧证据，或从原报告检查该用例是否包含在测评范围内。'],
    ['此侧没有评分结果', '请核对原任务进度或错误原因。缺少结果不计为零分。'],
  ],
  'preview/components/PrepCaseEditor.vue': [
    ['没有匹配的用例', '清除筛选查看已有用例，或点击新增用例，填写输入与期望结果。'],
  ],
  'preview/pages/AnalysisPage.vue': [
    [
      '找不到测评任务',
      '请从任务列表重新选择报告；重置体验数据可能移除了原记录。',
      '/preview/runs',
      '选择测评任务',
    ],
    ['缺少路由记录', '当前记录不足以显示路由分布。请查看下方样本证据，或选择其他已完成任务。'],
    ['没有匹配的样本', '请清除筛选查看其他样本；任务进行中时，结果会继续更新。'],
    ['还没有问题建议', '可从当前问题记录生成建议，或先查看样本证据核对原因。'],
    [
      '找不到分析视图',
      '请从测评任务查看问题证据，或从测评对象检查定义风险。',
      '/preview/runs',
      '查看测评任务',
    ],
  ],
  'preview/pages/CasePage.vue': [
    [
      '找不到用例',
      '请从原报告重新选择用例；重置体验数据可能移除了原记录。',
      '/preview/runs',
      '查看测评任务',
    ],
  ],
  'preview/pages/ComparisonPage.vue': [
    [
      '找不到对比报告',
      '请从对比列表重新选择记录；重置体验数据可能移除了原报告。',
      '/preview/comparisons',
      '查看对比列表',
    ],
    [
      '缺少关联任务',
      '请选择其他候选任务，或返回对比列表重新选择报告。',
      '/preview/comparisons',
      '查看对比列表',
    ],
    ['没有匹配的样本', '调整样本分组或搜索词，查看其他变化。'],
  ],
  'preview/pages/ComparisonsPage.vue': [
    ['没有匹配的对比', '调整筛选，或选择已有测评结果创建对比。'],
  ],
  'preview/pages/DatasetsPage.vue': [
    ['没有匹配的测评集', '调整筛选，或手工创建、导入测评集，准备测评输入。'],
  ],
  'preview/pages/EvaluatorsPage.vue': [
    ['没有匹配的评估器', '调整筛选，或新建评估器，定义本次测评的评分标准。'],
  ],
  'preview/pages/OverviewPage.vue': [
    ['还没有此配置的测评结果', '可调整对象与配置筛选，或创建测评后回来查看质量变化。'],
    ['此对象还没有测评任务', '创建首次测评，选择输入和评分标准，查看对象的质量表现。'],
  ],
  'preview/pages/ResourcesPage.vue': [
    [
      '当前没有等待任务',
      '可继续查看资源状态，或到任务列表查看执行结果。',
      '/preview/runs',
      '查看测评任务',
    ],
  ],
  'preview/pages/RunPage.vue': [
    [
      '找不到测评任务',
      '请从列表重新选择记录；重置体验数据可能移除了原任务。',
      '/preview/runs',
      '查看测评任务',
    ],
    ['没有匹配的用例结果', '清除筛选查看全部用例；未返回的评分结果不会计为通过。'],
  ],
  'preview/pages/RunsPage.vue': [['没有符合条件的任务', '清除筛选查看其他任务，或创建首次测评。']],
  'preview/pages/TargetsPage.vue': [
    [
      '还没有关联测评集',
      '可手工创建用例，或从测评集页面导入文件。',
      '/preview/datasets',
      '查看测评集',
    ],
    ['没有匹配的对象', '请调整搜索词，或清除对象类型筛选，查看其他可用对象。'],
  ],
}
let count = 0
for (const [file, entries] of Object.entries(copy)) {
  const target = path.join('src', file)
  let source = fs.readFileSync(target, 'utf8')
  const block = parseSfc(source).descriptor.template
  const edits = []
  let index = 0
  function visit(node) {
    if (
      node.type === 1 &&
      (node.tag === 'el-empty' ||
        node.props.some(
          (prop) =>
            prop.type === 6 &&
            prop.name === 'class' &&
            /\b(empty-state|preview-empty)\b/.test(prop.value?.content),
        ))
    ) {
      const entry = entries[index++]
      if (!entry) throw Error(`Missing reviewed copy: ${file}#${index - 1}`)
      const [title, description, to, label] = entry
      const attrs = node.props
        .filter(
          (prop) =>
            (prop.type === 7 && prop.name !== 'bind') ||
            (prop.type === 7 && ['key'].includes(prop.arg?.content)),
        )
        .map((prop) => prop.loc.source)
        .join(' ')
      const actions = node.children
        .filter(
          (child) =>
            child.type === 1 && ['RouterLink', 'el-button', 'button', 'a'].includes(child.tag),
        )
        .map((child) => child.loc.source)
        .join('\n')
      const next = to ? `<RouterLink class="ag-button" to="${to}">${label}</RouterLink>` : ''
      edits.push({
        start: block.loc.start.offset + node.loc.start.offset,
        end: block.loc.start.offset + node.loc.end.offset,
        replacement: `<EmptyState ${attrs} title="${title}" description="${description}">${actions}${next}</EmptyState>`,
      })
      count++
      return
    }
    node.children?.forEach(visit)
  }
  baseParse(block.content).children.forEach(visit)
  if (index !== entries.length) throw Error(`Reviewed empty-state count changed: ${file}`)
  for (const edit of edits.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.replacement + source.slice(edit.end)
  const relative = path
    .relative(path.dirname(target), 'src/components/EmptyState.vue')
    .replaceAll('\\', '/')
  if (!source.includes('import EmptyState '))
    source = source.replace(
      /<script setup[^>]*>/,
      (match) => `${match}\nimport EmptyState from '${relative}'`,
    )
  fs.writeFileSync(target, source)
}
console.log(`Migrated ${count} reviewed empty states.`)
