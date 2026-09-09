# AgentGate Project Progress

Last updated: 2026-09-09

## Active Web usability Goal — WEB-UX-GOAL-001

最新：A/G类已本地提交 `05efa54` / `d578cac`。C类40项已验证收口，包含共享抽屉、刷新位置与选择恢复、资产来源返回、只读发布版本及创建/编辑往返。当前typecheck/build、默认完整回归108/108通过。台账523条：221已验证、19非缺陷、3后续范围、280待整改。接下来实施B类元数据与信息层级；D/E/H/I及全站逐页、场景A–G和关键页面最终截图验收继续，Goal尚未完成。详见 [实施记录](web/productization/usability-implementation.md)。独立验证环境Web15473/API18473，旧环境保留。

用户显式授权按 A–I 模式类自主整改，完成条件以 `docs/web/productization/ux-design-rules.md` 与 Goal 请求为准。仅 Web 可用性与现有 API 映射；禁止 push、PR、合并。保留原有未提交工作，不与原评审任务协调。

全站初始扫描登记 441 个候选实例、25 个页面；候选必须经人工核实，不能直接等同于已确认缺陷。台账见 [usability-audit.md](web/productization/usability-audit.md)，逐页检查见 [usability-page-checklist.md](web/productization/usability-page-checklist.md)。P10/P11/P12/P08 的桌面与移动改前截图已保存。

已完成的 A 类覆盖共享结构化输入、规则、字段组、可读值和原始内容折叠；嵌套变量校验向父表单传递，更改非空字段类型需确认。新后端评估器目录采用摘要和精确版本接口。当前继续C类及后续模式，逐页与场景最终验收仍未完成。

需求变更已拍板：货币成本全部移除，使用输入/输出/总 Token 与耗时；测评集自动生成本轮延后，只验收手工创建和导入。后续记录不得重新将这两条列为未决产品规则。

## Latest upstream source sync — WEB-BE-002

SSH fetch succeeded after HTTPS connection failures. User-requested `integration/backend-features` fast-forwarded from `78f9dfa` to `9686d595b5970eebf83a09017108cb525196c614` on the existing `codex/web-productization` branch (six commits, 44 changed files). New upstream work includes the persistent Evaluator Catalog and Skill analysis workflow, persistence and HTTP APIs.

Pre-sync local changes, including AGENTS.md and ux-design-rules.md, were preserved in stash `2b1ea919c3f48d4655a944ab0404c9d8769abfb0` and restored; the backup remains. Audited 119 pre-existing modified/untracked files: 117 retained their content (Git normalized line endings in five documents); architecture.md merged automatically and project-progress.md was resolved to retain both current backend facts and Web history. No backend source/test edits, no Web implementation changes, no commit/push, no coordination with the former review task.

Local full backend regression at 9686d59: **627 passed, 2 failed, 1 warning**. Failures: `tests/test_in_memory_observability.py::test_resolve_builds_complete_domain_trace_from_real_sdk_spans` (case/routing/turn order) and `tests/test_rule_evaluators.py::test_seven_rules_keep_details_and_trace_ordered_primary_failure` (final_state versus tool_selection). These failures are recorded, not fixed or hidden by repeated runs in this source-sync task. The prior WEB-BE-001 results below belong to 78f9dfa.

Frontend adaptation is pending the user's next optimization rules. In particular, GET `/api/evaluators` now returns catalog summaries with `latest_version` and optional kind/implementation metadata, rather than the previous complete specification with `version` and `config`; pages and historical configuration reuse must adopt the new identity/version endpoints. Existing capability-matrix claims about missing evaluator management and Skill analysis APIs are now historical and need reconciliation during that adaptation. Existing preview processes/databases were not restarted or migrated during this source sync; this is not a new UI integration acceptance.

## Latest backend integration — WEB-BE-001

User-requested `upstream/integration/backend-features` merged by fast-forward to `78f9dfa` on `codex/web-productization`. All prior Web changes restored; stash `0045573ef6c67c5a1a5d9d6469ff1ff4848bb0bc` retained. Only the project progress document required a text-conflict resolution. No Web commit or push, no parent-worktree changes. Current design, review and verification: [backend integration](web/productization/backend-integration-design.md).

Real pages now expose compatible historical Run comparison, forward/reverse fixed-version lineage and Judge/error provenance. Explicit evaluator selection, light activity polling and the 33-item capability matrix distinguish callable APIs from internal modules and Mock-only behavior. This uses backend capabilities already available; it does not change PRD priorities or complete general Agent/Skill execution, automatic generation, evaluator editing, resource management, writeback or static analysis. Previous Web test counts below describe their own stages.

WEB-BE-001 verification: product configuration 18/18, final affected tests 10/10, post-merge Mock 68/68 and affected Mock 12/12, final layout checks 54/54, typecheck/build/diff-check passed. Backend: 550 passed, one reproduced upstream tool-span ordering failure. Independent mobile comparison/lineage visual findings were corrected and rechecked. These are separate verification scopes, not one combined acceptance total.

## Web Mock workspace — WEB-MOCK-001

The user explicitly authorized implementing missing backend behavior as Mock and listing requirement/story impacts with missing APIs. The isolated `/preview` workspace now has all core page modules and local persistence; real routes remain independent with no error fallback to Mock. See `docs/web/productization/mock-workspace-design.md` and `mock-implementation.md`. The shared capability matrix covers 24/24 customer functional requirements plus nine PRD/cross-cutting/future entries. Acceptance passed: full Mock regression 68/68 (34 distinct tests in two projects), final affected comparison/improvement regression 34/34, existing real API/Celery/Redis regression 8/8, and 85/85 page/viewport checks including static analysis results. Final typecheck/build passed, with the existing bundle-size warning retained. Independent review findings were corrected, including optional human score semantics, readable preflight/static evidence, and the static-risk-to-published-input-to-run return path. No production backend contracts were changed, and no commit/push was made.

## Web Productization — first real slice (historical WEB-IMPL-001)

Worktree `.worktrees/web-productization`, branch `codex/web-productization`, upstream
baseline `c3353b1`. The user's latest instruction authorizes continued implementation
and independent review in the discussed frontend scope. No commit/push was performed.

- [x] Vue Router, light product layout, desktop/collapsed/mobile navigation and focus handling.
- [x] Real overview/catalogs, create evaluation, active progress, completed report and Case/Trace evidence.
- [x] Dataset draft/edit/save/publish, fixed-version deep links, JSON and Excel import/export.
- [x] Preserve report filters and exact evaluator across evidence/dataset return paths; preserve historical input.
- [x] Guard unsaved Case edits; replace disconnected launch action with configuration and exact Run navigation.
- [x] Desktop two-column Case workspace with collapsible dataset picker; mobile list/detail sections.
- [x] Independent browser review and eight desktop/mobile product E2E checks passed with real API/Celery/Redis.
- [x] Typecheck/build and 36 responsive page inspections passed; explicit NA and result-count semantics.
- [ ] Full customer/PRD scope: external targets, generated/merged inputs, managed LLM evaluators/resources,
      scheduling/cancellation/resume, persisted comparisons, review/analysis/optimization and collaboration.
- [ ] Production acceptance, performance optimization and remaining backend contracts.

Current source of truth: [implementation and acceptance](web/productization/live-implementation.md),
[productization index](web/productization/README.md), and [joint design decisions](web/productization/joint-design-resolution.md).
The former v0.1 prototype is withdrawn as the delivery baseline. This first implemented
slice does not claim full product-requirements coverage. Historical backend checklists
below retain their existing meaning; their earlier test totals are not this Web round's results.

## Status Legend

- `[x]`: implemented and covered by the current test suite.
- `[ ]`: not implemented or not yet accepted as complete.
- Paths marked **new** do not exist yet.
- This checklist tracks the complete POC direction. Deferred production work is
  listed separately and is not required to finish the initial demo.

## Work Ownership

| Tag | Scope | Status |
|---|---|---|
| `[CODEX-EVALUATOR]` | Persistent Evaluator Catalog | Complete and merged into the backend integration branch |
| `[CODEX-SKILL]` | Static Skill Analysis backend and API | Complete; commit and integration pending |
| `[UNASSIGNED]` | A/B orchestration, Web pages, and Optimizer | Not started |

## Core Foundation

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Domain models | Define Dataset, Case, Run, Trace, Result, Target, and Evaluator concepts | `src/agentgate/domain/` |
| [x] | SQLite storage | Persist the POC domain objects | `src/agentgate/storage/sqlite.py` |
| [x] | Repository contract | Isolate application workflows from storage implementations | `src/agentgate/storage/repository.py` |
| [ ] | Artifact storage | Store files, screenshots, reports, and generated outputs | `src/agentgate/storage/artifacts.py` **new** |
| [x] | Storage cleanup | Remove obsolete or empty storage code after migration | `src/agentgate/storage/` |

## Dataset

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Dataset management | Create, edit, archive, publish, and version Datasets | `src/agentgate/application/dataset_management.py` |
| [x] | Dataset loading | Convert external data into Dataset and Case models | `src/agentgate/dataset/loader.py` |
| [x] | JSON format | Import and export complete Dataset structures | `src/agentgate/dataset/formats/json.py` |
| [x] | Excel format | Import existing single-sheet customer files | `src/agentgate/dataset/formats/xlsx.py` |
| [x] | Multi-turn Cases | Store multiple conversation turns in one Case | `src/agentgate/domain/case.py` |
| [ ] | Dataset sampling | Select reproducible smoke, regression, tagged, or risk-based subsets | `src/agentgate/dataset/sampling.py` **new**; planned after 2026-09-15 |
| [ ] | Dataset generation | Generate positive, negative, and boundary Cases from Agent metadata | `src/agentgate/dataset/generation/` **new**; planned after 2026-09-15 |
| [ ] | Public benchmarks | Import selected public evaluation datasets | `src/agentgate/dataset/benchmarks/` **new**; planned after 2026-09-15 |

## Evaluator And Result

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Rule evaluation | Evaluate routing, Tool use, state, policy, and output | `src/agentgate/evaluator/rule/` |
| [x] | Metrics | Aggregate Case Results into Run metrics | `src/agentgate/result/metrics.py` |
| [x] | Release gate | Decide whether a version passes evaluation | `src/agentgate/result/gate.py` |
| [x] | Report | Build the complete evaluation report | `src/agentgate/result/report.py` |
| [x] | Evaluator structure | Separate protocol, executor, runtime models, and Rule responsibilities | `src/agentgate/evaluator/` |
| [x] | JSON Schema Rule evaluation | Validate structured values with Draft 2020-12 structure, required-field, value, and composition keywords; allow safe local JSON Pointers; and reject invalid schemas during Run preflight for output, state, routing, and Tool-argument expectations | `src/agentgate/evaluator/rule/json_schema.py`, `src/agentgate/evaluator/rule/operators.py`, `src/agentgate/application/evaluator_management.py` |
| [x] | LLM Judge | Perform redacted case-level semantic answer-quality evaluation through configured models | `src/agentgate/evaluator/judge/` |
| [x] | OpenAI-compatible model transport | Call preconfigured public or private Chat Completions endpoints using resolved credentials | `src/agentgate/integrations/model_providers/` |
| [x] | POC Judge environment configuration | Build one optional process-level model connection from four environment variables, remain Rule-only when absent, and reject partial configuration | `src/agentgate/integrations/model_providers/environment.py` |
| [ ] | Persistent model provider configuration | Store allowlisted endpoints, managed secrets, and production credential resolution for application use | Design required before implementation |
| [ ] | Multimodal evaluation | Evaluate files, images, and other Artifacts | `src/agentgate/evaluator/judge/multimodal.py` **new**; planned after 2026-09-15 |
| [x] | Result comparison | Read deterministic differences of two compatible completed Runs; no experiment orchestration or statistical significance | `src/agentgate/result/comparison.py`, GET `/api/run-comparisons` |

## Trace And Target Execution

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Trace model | Represent normalized Agent behavior | `src/agentgate/domain/trace.py` |
| [x] | OTel capture | Capture real demo Agent spans | `src/agentgate/integrations/observability/in_memory.py` |
| [x] | OTLP receiver | Receive external OTLP JSON traces | `src/agentgate/integrations/observability/otlp_http_receiver.py` |
| [x] | Demo Agent adapter | Execute the Loan Agent | `src/agentgate/integrations/targets/demo_loan.py` |
| [x] | Target protocol | Standardize one Case execution | `src/agentgate/run/target_protocol.py` |
| [x] | Trace redaction | Remove secrets and private data before evaluation or display | `src/agentgate/trace/redaction.py` |
| [ ] | HTTP Agent adapter | Invoke Dify, Coze, or customer Agents | `src/agentgate/integrations/targets/http_agent.py` **new** |
| [ ] | Local process adapter | Execute CLI-based Agents | `src/agentgate/integrations/targets/process_agent.py` **new** |
| [ ] | Trace replay adapter | Evaluate an existing Trace without reinvoking an Agent | `src/agentgate/integrations/targets/trace_replay.py` **new** |
| [x] | Trace cleanup | Remove obsolete Trace scaffolds after migration | `src/agentgate/trace/` |

## Run, Queue, And Scheduler

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Run Engine | Execute every Case and invoke selected Evaluators | `src/agentgate/run/engine.py` |
| [x] | Worker claiming | Prevent two workers from executing the same Run | `src/agentgate/storage/sqlite.py` |
| [x] | Incremental persistence | Save each Case's Results as soon as evaluation finishes | `src/agentgate/run/engine.py` |
| [x] | Dispatcher protocol | Define whole-Run submission through `submit(run_id)` | `src/agentgate/integrations/job_dispatchers/protocol.py` |
| [x] | Dispatch workflow | Submit persisted Runs and fail dispatch errors safely | `src/agentgate/application/run_management.py` |
| [x] | Stale-Run recovery | Fail Runs abandoned by an expired worker | `src/agentgate/application/run_management.py` |
| [x] | Progress projection | Calculate completed Cases and Run progress from Results | `src/agentgate/application/result_reader.py` |
| [x] | Activity projection | Return queued, running, and recent terminal Runs | `src/agentgate/application/result_reader.py` |
| [x] | Celery dispatcher | Submit `run_id` through Redis | `src/agentgate/integrations/job_dispatchers/celery.py` |
| [x] | Celery worker | Load and execute the persisted Run with the same optional Judge catalog and task-local client cleanup | `src/agentgate/integrations/job_dispatchers/celery.py` |
| [ ] | Customer scheduler integration | Accept work from an external Java scheduler through the shared Run boundary | `src/agentgate/server/routes/runs.py` or `src/agentgate/integrations/job_dispatchers/`; planned after POC |
| [ ] | Retry mechanics | Retry classified infrastructure failures only | `src/agentgate/run/retry.py` **new** |
| [ ] | Local process management | Start, monitor, limit, and stop local Agent processes | `src/agentgate/run/process_manager.py` **new** |
| [ ] | Run Artifact collection | Register files and reports produced during execution | `src/agentgate/run/artifacts.py` **new** |
| [x] | Run cleanup | Remove legacy core, scheduler, lifecycle, model, and adapter placeholder files | `src/agentgate/run/` |

## Application And Server

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Dataset application service | Coordinate Dataset workflows | `src/agentgate/application/dataset_management.py` |
| [x] | Run application service | Coordinate Run creation, dispatch, and execution | `src/agentgate/application/run_management.py` |
| [x] | Result reader foundation | Read persisted Runs, Results, Traces, and reports | `src/agentgate/application/result_reader.py` |
| [x] | FastAPI foundation | Expose current Dataset, Run, Result, and Trace APIs | `src/agentgate/server/` |
| [x] | Target catalog | Register, list, and resolve exact immutable Target descriptors | `src/agentgate/application/target_catalog.py` |
| [ ] | External Target metadata adapters | Read Agent and Skill metadata from Dify, Coze, or customer platforms | `src/agentgate/integrations/targets/`; planned after POC |
| [x] | Evaluator management | Persist user identities and drafts, publish immutable versions, control availability, select exact specifications, and compose supported implementations | `src/agentgate/application/evaluator_management.py`, `src/agentgate/evaluator/versioning.py`, `src/agentgate/storage/sqlite.py` |
| [x] | Evaluator Catalog API | Expose built-in and user identities, drafts, publication, exact versions, enable state, and constrained deletion | `src/agentgate/server/routes/evaluators.py` |
| [x] | Judge API/worker wiring | Create API manifests and reconstruct worker execution from identical optional Judge configuration with process/task lifecycle cleanup | `src/agentgate/application/evaluator_management.py`, `src/agentgate/server/`, `src/agentgate/integrations/job_dispatchers/celery.py` |
| [ ] | Model provider management API | Configure provider endpoints, model options, and secret references without exposing credentials | Design required before implementation |
| [x] | Skill analysis workflow and API | Resolve exact Targets, run static analysis, persist reports, review findings, and expose HTTP endpoints | `src/agentgate/application/skill_analysis.py`, `src/agentgate/server/routes/skill_analysis.py` |
| [x] | Lineage queries | Find Runs by Dataset, Case, Target, Skill, or Evaluator version and construct relationship graphs | `src/agentgate/application/lineage_queries.py`, `src/agentgate/server/routes/lineage.py` |
| [ ] | Extended lineage | Experiment/generation/Prompt/model lineage, authorization and complete reverse pagination/summaries | Additional contracts required |
| [x] | Asynchronous Run API | Create a Run, dispatch it, and return `202 Accepted` | `src/agentgate/server/routes/runs.py` |
| [x] | Run activity API | Expose queue, running status, progress, and history | `src/agentgate/server/routes/runs.py` |
| [ ] | API contract review | Finalize response models and sanitized error behavior | `src/agentgate/server/` |

## CLI

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | CLI refactor | Call the same application services used by FastAPI | `src/agentgate/cli/` |
| [x] | Dataset commands | Import, export, list, publish, and inspect Datasets | `src/agentgate/cli/dataset_commands.py` |
| [x] | Run commands | Execute Runs and inspect queue or execution status | `src/agentgate/cli/run_commands.py` |
| [x] | Result commands | Retrieve reports, metrics, failed Cases, protected Traces, and Gate conclusions | `src/agentgate/cli/result_commands.py` |
| [x] | Legacy cleanup | Remove CLI dependencies on the old Control Plane and Run core | `src/agentgate/cli/`, `src/agentgate/application/` |
| [x] | CLI tests | Verify commands through application boundaries | `tests/test_cli.py`, `tests/test_cli_*_commands.py` |

The CLI now composes the same Dataset, Run, and Result application boundaries used by
the server. Removing the remaining legacy Control Plane test callers is separate cleanup.

## Web

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Dataset workspace foundation | Browse and edit Dataset content | `web/src/pages/DatasetWorkspace.vue` |
| [x] | Web routing | Provide Vue Router navigation for implemented pages | web/src/router/, web/src/layouts/AppLayout.vue |
| [x] | Overview | Show available Dataset, catalog and Run activity summaries; no claim of complete historical analytics | `web/src/pages/OverviewPage.vue` |
| [x] | Run workspace | Browse queued, running, completed and failed work; create and inspect Runs | `web/src/pages/RunListPage.vue`, `RunCreatePage.vue`, `RunDetailPage.vue` |
| [x] | Progress polling | Run list polls light activity every five seconds while active; refreshes history on lifecycle changes and stops at terminal state | `web/src/api/runs.ts`, `web/src/pages/RunListPage.vue` |
| [x] | Result browsing | Filter completed/failed Runs within the common task list and open reports | `web/src/pages/RunListPage.vue` |
| [x] | Result detail | Show metrics, gate, badcases, Case/Trace evidence and nullable Judge/error provenance | `web/src/pages/RunDetailPage.vue`, `CaseResultPage.vue` |
| [x] | Evaluator catalog | Read available Rule and environment-configured Judge standards, inspect version lineage and explicitly select standards for a Run | `web/src/pages/EvaluatorWorkspacePage.vue`, `RunCreatePage.vue` |
| [ ] | Evaluator management | Persist Rule/Judge/Hybrid editing, publishing and trial evaluation; currently Mock only | `web/src/preview/pages/EvaluatorsPage.vue`; management APIs missing |
| [x] | Source and related tasks | Follow fixed Run/Dataset/Case/Target/Skill/Evaluator references; reverse results capped by API, locally paged | `web/src/pages/LineagePage.vue` |
| [ ] | Model provider settings | Configure provider connections and available Judge models | `web/src/pages/ModelProviderSettingsPage.vue` **new** |
| [ ] | Skill analysis | Display Skill conflicts and prompt mismatches | `web/src/pages/SkillAnalysisPage.vue` **new** |
| [ ] | Optimizer | Display failure clusters and suggestions | `web/src/pages/OptimizerPage.vue` **new** |
| [x] | Browser verification | Verify desktop and mobile workflows against Redis, Celery, FastAPI, and SQLite | `web/tests/` |

Visible Web labels remain Chinese. Source identifiers, API fields, TypeScript names,
and comments remain English.

## A/B Testing

| Status | Capability | Function | Code location |
|---|---|---|---|
| [ ] | A/B definition | Bind two Target versions to one Dataset and evaluation configuration | `src/agentgate/application/ab_testing.py` **new** |
| [ ] | A/B execution | Create two ordinary EvaluationRuns through RunManagement | `src/agentgate/application/ab_testing.py` **new** |
| [x] | Historical Run comparison | Read score/count/outcome deltas for two compatible completed Runs; not controlled experiment execution | `src/agentgate/result/comparison.py` |
| [ ] | Significance | Calculate confidence and statistical significance | `src/agentgate/result/statistics.py` **new** |
| [x] | Comparison read API | GET `/api/run-comparisons`; rejects incompatible inputs with 409 | `src/agentgate/server/routes/comparisons.py` |
| [ ] | Experiment orchestration API | Persist controlled experiments, launch variants and replay frozen configurations | Additional contracts required |
| [x] | Historical comparison Web page | Select completed Runs, inspect differences by Case/standard, reach both evidence paths and return with filters | `web/src/pages/RunComparisonPage.vue` |
| [ ] | Complete A/B Web integration | Controlled/multi-variant execution, confidence, performance/cost, persistence and exports remain Mock or unavailable | `web/src/preview/pages/ComparisonPage.vue`; backend contracts missing |

A/B testing composes ordinary Runs. It does not require a broad top-level
`experiment/` package for the POC.

## Skill Analysis And Optimizer

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Skill analysis domain | Define static analysis findings and reports | `src/agentgate/domain/skill_analysis.py` |
| [x] | `[CODEX-SKILL]` Skill relationships | Detect overlap, conflict, duplication, and routing ambiguity through bounded pairwise LLM checks | `src/agentgate/skill_analysis/relationships.py` |
| [x] | `[CODEX-SKILL]` Persistence and review | Store immutable reports and one current human review per finding | `src/agentgate/storage/repository.py`, `src/agentgate/storage/sqlite.py` |
| [x] | `[CODEX-SKILL]` Application and API | Run analysis for exact Target descriptors and expose report and review workflows | `src/agentgate/application/skill_analysis.py`, `src/agentgate/server/routes/skill_analysis.py` |
| [ ] | Automatic invocation | Optionally run static checks during Agent creation or evaluation setup | Deferred until external Target integration is designed |
| [ ] | Prompt alignment and deterministic description checks | Compare Agent Prompt, Skill descriptions, Tools, and capability boundaries | Deferred after the simple POC |
| [ ] | Failure clustering | Group similar badcases | `src/agentgate/optimizer/clustering.py` |
| [ ] | Confusion matrix | Measure expected versus actual Skill routing | `src/agentgate/optimizer/clustering.py` |
| [ ] | Root-cause analysis | Explain common failure causes | `src/agentgate/optimizer/root_cause.py` |
| [ ] | Suggestions | Produce reviewable optimization recommendations | `src/agentgate/optimizer/suggestions.py` |
| [x] | Optimizer cleanup | Remove the rejected generic service wrapper | `src/agentgate/optimizer/service.py` |

Optimizer work is the final POC feature group and will receive a separate detailed
plan before implementation.

## Verification And Delivery

| Status | Capability | Function | Code location |
|---|---|---|---|
| [x] | Upstream backend regression record | Upstream reports 629 passing at 9686d59; not a local verification result | Upstream integration record |
| [ ] | Current local backend regression | At 9686d59: 627 passed, two Trace-order/primary-failure assertions failed; prior 78f9dfa result remains historical | WEB-BE-002 above |
| [x] | Redis/Celery integration | Verify broker, worker, state, queue visibility, and progress end to end | `tests/test_celery_dispatcher.py`, `web/tests/`, operational smoke |
| [x] | Real browser regression | 18 passing across desktop/mobile: 14 real API workflow checks and four explicit Judge-rendering/activity-poll contract fixture checks | `web/tests/product/`; WEB-BE-001 |
| [x] | Mock browser regression | 68 passing after backend merge; 12 affected journey/improvement checks passed after shared navigation refinements | `web/tests/preview/`; counts are separate from real integration |
| [x] | Responsive layout checks | 54 checks across nine real pages and six widths; 18 screenshots reviewed with mobile table refinement | `web/scripts/capture-product-ui.mjs`; WEB-BE-001 final evidence |
| [x] | Documentation | Explain setup, APIs, Redis, Celery, and demo operation | `README.md`, `web/README.md`, `docs/` |
| [ ] | Repository cleanup | Delete obsolete placeholders and compatibility code | Entire repository |
| [ ] | Demo packaging cleanup | Move standalone demo behavior out of the reusable AgentGate package if still appropriate | `src/agentgate/demo/`, `examples/` |
| [x] | Async slice regression | Run backend, frontend, and browser suites for the asynchronous vertical slice | Entire repository |
| [ ] | Delivery | Commit, push, and tag the completed refactor POC | Git repository |

## Deferred Production Capabilities

- PostgreSQL migration and high-availability Redis.
- Authentication, authorization, tenant isolation, quotas, and audit integration.
- Dependency-based evaluator short-circuiting with explicit blocked/skipped Results and
  `blocked_by_evaluator_id` provenance.
- Priority queues, tenant fairness, multiple worker pools, and resource-aware routing.
- Time-based reservations and recurring schedules.
- Cooperative cancellation of active local and remote Agent executions.
- Customer-specific Java scheduler and Agent-platform adapters.
- Production observability platform integrations and external Result callbacks.
- Automated resume or retry of partially completed Runs.
