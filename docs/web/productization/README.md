# Web 产品化重构

最新进展：[A–I 实施记录](usability-implementation.md)。A 类与已定变更完成本批验证，台账459条中剩余363条；下一类为G文案与状态反馈。最新验证入口 [Web15473](http://127.0.0.1:15473/)，连接当前源码后端18473。全站验收尚未完成，下面此前阶段记录不作为本轮完成声明。

> **当前优先状态（2026-09-09）：A–I 可用性 Goal 执行中，尚未验收完成。** 当前后端基线为 `9686d59`，下文 `78f9dfa` 交付描述是历史记录。用户已显式授权自主整改与每模式类本地提交，禁止 push、PR、合并；不再联系原评审任务。
>
> [全站缺陷台账](usability-audit.md) · [逐页验收清单](usability-page-checklist.md)。初始扫描 441 个候选实例，正在完成 A 类共享输入和可读展示迁移。共享组件已建立不等于全站复用完成。新目录 API 映射和本批结构化输入 typecheck 通过；本轮 build、完整 E2E、场景 A–G 与改后截图待完成。
>
> 已定口径：不再显示货币成本，改用 Token 与耗时；自动生成测评集推迟到后续，场景 A 通过手工创建或导入保存 Dataset v1。历史文档中相反描述由此覆盖。

更新：2026-09-09。当前状态：**已将最新后端 `integration/backend-features`（78f9dfa）合并至开发分支，接入真实历史运行对比、固定版本来源与关联任务、Judge/错误证据。完整 Mock 工作区继续保留。** 最新合同、评审、测试和上游遗留问题见 [WEB-BE-001 接入记录](backend-integration-design.md)，旧阶段记录仅代表当时状态。

- [完整体验入口](http://127.0.0.1:15273/preview)：对象→准备→测评→报告/复核→对比→分析/建议回归，浏览器内持久化。
- [逐项能力与接入](http://127.0.0.1:15273/preview/capabilities)：33 条需求，含全部 24 条客户功能需求，列出受影响故事、缺失能力/拟议接口和真实验收条件。
- [Mock 整体/详细设计与评审取舍](mock-workspace-design.md)；[实施及验证记录](mock-implementation.md)；[可协作的接入差距矩阵](capability-contract-matrix.md)。

用户授权：“你俩继续，直到给我合理的实现效果”，并补充缺失后端先 Mock、完整实现 Web。主任务协调三个分离文件范围的实现 agent，“web端优化评审”独立检查并提出整改；在已讨论的前端范围继续实现，不再重复逐文件确认。没有创建自主 Goal，也没有自动提交或推送。

## 直接查看

- 本地预览：[打开总览](http://127.0.0.1:15273/)。API18273、独立Redis19379、真实Celery worker、任务独立SQLite；数据包含验收样例，不是外部客户资产。
- [真实示例报告](http://127.0.0.1:15273/runs/b86c1d5f-2644-4dfa-981f-f39229197013)：新后端真实执行的高风险贷款策略评估，支持按维度/结果下钻证据。
- [真实版本对比](http://127.0.0.1:15273/comparisons?baseline=b86c1d5f-2644-4dfa-981f-f39229197013&candidate=6ff64b8e-c65d-468e-b131-f05c420535c3)：同输入的风险/修正版本、指标变化和双方证据。
- [来源与关联任务](http://127.0.0.1:15273/lineage?kind=run&id=b86c1d5f-2644-4dfa-981f-f39229197013)：固定测评集、对象、Skill 与评分标准关系。
- [最新接入、验收与环境](backend-integration-design.md)；[首次真实接入记录](live-implementation.md)保留历史。当前使用新的 `backend-features-ui.db`；旧 `product-ui.db` 保持原样，旧报告链接不属于当前预览数据库。
- [联合决策 WEB-UX-003](joint-design-resolution.md) → [修订用户故事](user-stories-revised.md) → [整体体验设计](webui-overall-design.md) → [逐页设计](webui-page-design.md)。v0.1历史原型已撤销推进资格，不能据其认定覆盖或实现。

## 分支与工作区

初始基线是 `refactor-1` 的 `c3353b1`；按用户要求已快进合并 `upstream/integration/backend-features` 至 `78f9dfa56f8494e8f3836cbd709f6933f17d389e`。继续使用 `codex/web-productization`，工作区 `D:\Develop\myCode_win\agentgate\.worktrees\web-productization`，未另开分支。

父工作区 `integration/p2` 及 `open-fin@agentgate` 中他人的未提交工作均保留。后续 agent 必须先核对分支与目录；不要在父目录运行本任务修改或加入 `.worktrees/`。本工作区代码和文档尚未提交、推送。

## 当前交付边界

实现了总览、真实内置对象版本目录、可用评估器目录、测评集草稿/用例/发布/JSON与Excel、任务配置与真实队列进度、完成报告、用例与Trace证据、版本回填、历史固定输入回看。已修复筛选往返、未保存保护、NA解释、移动导航焦点、窄屏分段编辑。

本轮新增真实历史运行对比和正反向来源查询，真实结果可显示 Judge 调用记录；这不等于完整受控实验或评估器管理。外部 Agent/Skill 执行、生成合并、LLM/复合评估器编辑试评、资源管理、预约恢复、受控实验和分析改进仍由隔离 Mock 展示交互。真实后端缺口以“能力与接入”逐项状态为准；未来 CI/CD 和多模态产物仍为规划项。后端全回归为 550 通过、1 项 Trace 同时间戳排序失败，不能宣称完整生产验收。

## 协同与依据

**[WebUI 设计规则（强制）](ux-design-rules.md)**：设计或修改任何 `web/` 界面前必读；每个页面必须逐条对照其规则并通过逐页检查清单才算完成。根目录 [AGENTS.md](../../../AGENTS.md) 的 `Web UI Design` 段指向该规则。

1. [来源与接口差异](source-baseline.md)
2. [UI规范核对](ui-spec-audit.md)
3. [评审决策台账](review-ledger.md)
4. [实施计划与后续依赖](implementation-plan.md)
5. [复用清单](reuse-inventory.md)
6. [需求与故事实质审查](requirements-and-story-review.md)
7. [用户旅程原稿副本](../../user-journeys-and-webui-zh.md)

当前实现记录优先说明“已落地”事实；其他文档中的旧阶段和“未开始”仅保留为评审历史。完整需求不会因当前后端只有内置演示接入而被删除。
