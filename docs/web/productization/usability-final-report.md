# WEB-UX-GOAL-001 可用性整改收尾报告

2026-09-09。当前分支codex/web-productization，后端基线9686d59。本轮A–I可用性整改完成，按用户批准的真实能力降级口径验收；不代表全部产品需求的后端能力已交付。

## 台账改前与改后

初扫441个候选，冻结前核实补齐至539个实例；以下以冻结539条为可比口径，候选不等于确认缺陷。改后514条已验证、22条非缺陷、3条后续范围，待整改0。冻结后的6条parking lot已集中修复验证，原539条不扩张。每批只记一次resolution及代码提交号；JSON唯一源，MD由脚本生成。

|模式|冻结实例|改后未关闭|改动摘要|
|---|---:|---:|---|
|A 输入/表单|39|0|默认结构化消息、键值、规则、预期与业务内容；高级原始视图；保留0/false/null和六类预期。|
|G 文案/空态|107|0|移除实现说明；状态、空态、错误保留任务原因与下一步。|
|C 上下文|41|0|抽屉下钻、上一条/下一条、焦点/筛选/滚动恢复；复杂证据允许补充全页打开。|
|B 元数据|214|0|实体名称/版本/类型、分组标签；报告结论优先、数量单位明确。|
|D 控件/设计系统|42|0|统一Element Plus尺寸、tokens、主题对比度、焦点及移动布局。|
|E 角色|1|0|复用RoleGate；测评用户看资源摘要，真实管理身份缺失时隐藏管理写入口。|
|H 术语|12|0|词表与模板脚本辅助；区分无分数、不适用、需复核、执行错误。|
|I 反馈/控制|25|0|发布/删除/移除确认，取消保留草稿，行内错误与可恢复状态。|
|F 验收|1|0|逐页/场景例外报告、最终回归、关键图及接入缺口核对。|
|已拍板范围变更|57|0|56处Token口径；自动生成延后，手工/导入v1为本轮路径。|

批次提交与文件清单由[生成台账](usability-audit.md)统一提供。F同时修复手机资源摘要、结果/业务词、真实轮次移除确认、报告对象身份、创建说明/能力清单和异步CSS标签对比度六组parking lot。

## 已落地共享组件

|职责|复用组件（web/src/components）|
|---|---|
|有维度的元数据与实体引用|MetadataGroup、EntityRef、LineageLink、dataset/DatasetVersionLink|
|上下文下钻及返回|DetailDrawer、DetailNavigation、TaskBackLink；preview的EntityLink/资产抽屉复用这些模式|
|结构化输入与规则|KeyValueEditor、MessageInput、PayloadInput、JsonValueInput、RuleBuilder、SchemaBuilder、FormSection|
|可读证据与高级内容|ValueView、JsonFallback、dataset/ExpectationSummary、TokenUsage|
|状态、错误、空态|EmptyState、StatusNotice、InlineError|
|尺寸、角色、系统样式|ConfigProvider、RoleGate、既有tokens.css/base.css|

复用当前Vue/Element Plus/router/API；旧goal/p1-demo只参考输入/结果行为，integration/p1-new参考轻根组件与路由职责，未复制旧合同或新增并行产品。原始数据与机器结果不因显示翻译而变化。

## 验证结果及证据边界

- 冻结代码后依次执行npm run typecheck、npm run build、npm run test:e2e，全部通过；默认E2E **116/116，10.5分钟**，桌面与手机各58项。
- F定向8/8：真实轮次确认/取消、六类预期与版本保留、真实执行旅程、手机只读资源摘要等；共享标签对比度/键盘/弹层定向2/2。H完整116/116、I定向18/18和完整116/116已分别收口。
- 最终24个可达页面文字对比度扫描0候选、整页横向溢出0；最终10张1440/390宽截图已审阅。控件键盘、焦点、减弱动效等沿用共享模式与定向验收，不以一份扫描声称全面WCAG认证。
- A–G按终端用户任务审阅页面入口、数据意义、动作反馈、返回与失败恢复；只报告[例外与未完整真实接入项](usability-page-checklist.md)，不重复通过清单。D另实走采纳→关联外部v2→回归→未通过证据→导出→建议回溯，结果保留Mock标识。
- 真实发布→执行→报告→证据→修订v2与Excel导入/导出使用隔离真实API和worker。测试fixture仅用于缺失/异常合同验证，不进入src/pages。默认测试范围及旧测试替代关系见[验证范围](usability-test-coverage.md)。

## 遗留联合工作项与假设

31条接入快照按原需求逐项登记在JSON的jointWorkItems（不计新增审计实例），每项含已有能力、缺失能力、用户故事/场景、使用影响、当前降级、拟议接口与真实验收条件；[能力与接入](http://127.0.0.1:15473/capabilities)提供同一需求的产品内入口。

主要范围为外部对象与授权定义、评估器真实Web管理/独立试评、组合测评输入、资源预约与恢复、人工复核及建议回归、受控实验/统计/多维门槛、规模/协作/审计。已有评估器创建/草稿/发布/精确版本API和静态分析服务明确记录为已有能力，不误写成后端全部缺失；评分调用Token与对象总用量分开。

AS-01～AS-12完整编号保留于[生成台账的assumptions](usability-audit.md#当前-assumptions-与联合工作项)，JSON为唯一编辑源。历史J-01/J-02已核实并指向具体JW条目。货币成本移除与自动生成延后为RC-01/RC-02已拍板需求，不再列作未决假设。没有新增未经授权的业务范围或后端合同。

## 最终改前/改后截图

见下方双端对照。P08同时包含真实只读目录与Mock结构化编辑，二者权限和数据边界不同。原始before图保持不变；P10原图误捕获加载态，改用原始baseline/web/src、原API18273和原报告引用补拍的before-verified图，未修改基线源码；仅复用index壳与已安装依赖，临时渲染服务已关闭。改后使用15473/18473隔离环境。

截图中的任务、对象版本及分数不同；对照用于判断布局、信息和操作变化，不可将分数变化解释为产品优化效果。所有原始截图和采集元数据均保留。

|页面/宽度|改前|改后|
|---|---|---|
|P08真实评估器目录 / 1440|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P08-evaluators-1440.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P08-evaluators-1440.png)|
|P08真实评估器目录 / 390|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P08-evaluators-390.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P08-evaluators-390.png)|
|P08规则编辑/试评（Mock） / 1440|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P08-mock-editor-1440.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P08-mock-editor-1440.png)|
|P08规则编辑/试评（Mock） / 390|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P08-mock-editor-390.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P08-mock-editor-390.png)|
|P10创建测评 / 1440|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before-verified/P10-create-1440.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P10-create-1440.png)|
|P10创建测评 / 390|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before-verified/P10-create-390.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P10-create-390.png)|
|P11测评报告 / 1440|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P11-report-1440.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P11-report-1440.png)|
|P11测评报告 / 390|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P11-report-390.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P11-report-390.png)|
|P12用例证据 / 1440|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P12-evidence-1440.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P12-evidence-1440.png)|
|P12用例证据 / 390|[改前](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/before/P12-evidence-390.png)|[改后](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/P12-evidence-390.png)|

[打开全部图片对照](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/comparison.html)；[最终采集清单](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/capture.json)；[24页文字/布局审阅证据](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/text-contrast.json)；[D走查状态](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/walkthrough-evidence.json)；[D导出与回溯](C:/Users/yandong/.codex/visualizations/2026/09/08/01a07fca-edc8-73a2-9442-bdc1a59f1dc5/usability-goal/final/walkthrough-export-history.json)。
