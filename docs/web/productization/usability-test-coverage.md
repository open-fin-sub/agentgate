# A–I 整改验证范围

默认命令在 `web` 目录运行 `npm run test:e2e`，覆盖 `tests/product` 与 `tests/preview` 全部测试，桌面1440×1000和Pixel 7，共110项（2026-09-09 B类，真实26项、体验84项）。B类新增来源资产固定版本、同类切换、父页保留及返回焦点2项；C类历史收口为108项。可用 `AGENTGATE_WEB_URL` 指向独立验证环境，当前默认15473。API、Celery worker、Redis需预先启动且使用同一工作树和隔离数据库；该命令不清理数据库、不启动或停止已有服务。当前环境为API18473、Redis19379数据库2、`usability-ui.db`，不得指向生产环境运行写入型旅程。

原默认配置依赖 Bash、`/tmp` 和旧Demo主页，不适用于当前Windows产品页面。保留三个旧根目录测试文件作为历史参考；其中有效行为由下列现行测试承担，而非静默跳过需求：

|原测试|现行覆盖|
|---|---|
|`tests/demo.spec.ts` 配置测评、真实结果与证据|`product/journey.spec.ts` 真实发布→执行→门禁→证据→修订；`product/backend.spec.ts` 服务端对比与Trace/评分缺失|
|`tests/dataset.spec.ts` 创建发布与历史版本|`product/journey.spec.ts` 结构化手工创建、发布v1/v2、重载与历史证据；`product/expectation-preservation.spec.ts` 六类预期完整保留|
|`tests/dataset.spec.ts` 空草稿不能发布|`product/journey.spec.ts` 空测评集发布失败、用户提示及仍可继续编辑|
|`tests/runs.spec.ts` 队列/运行状态与结束后停止轮询|`product/backend.spec.ts` 轻量活动查询、生命周期变化重读列表、完成后停止轮询；真实journey验证实际异步任务完成|

主真实旅程连接真实后端，不拦截业务响应。契约异常、缺失数据、轮询节奏测试在名称中注明contract fixture；这些响应只在测试浏览器拦截，不进入`src/pages`。Mock纯计算与体验交互均位于preview测试中。

C类新增验证包括：父报告不重复读取、过滤顺序上一条/下一条、复核/版本草稿离开保护、全页来源返回与外部地址拒绝、刷新后的版本选择、报告滚动和选择恢复、入口焦点返回、嵌套关联和只读发布版本边界。

全套E2E、typecheck与build不替代25页逐页清单、A–G非开发者走查及关键页面视觉检查。实际执行结果记于`usability-implementation.md`；本文件只描述范围，不声明通过。
