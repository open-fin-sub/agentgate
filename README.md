# AgentGate

AgentGate is an open-source evaluation harness for enterprise Agents and Skills. It
runs versioned Cases, captures behavior as OpenTelemetry traces, evaluates business
rules, calculates metrics, and makes release-gate decisions.

## Current Status

Refactor-1 is in progress. The Domain, SQLite, Dataset workflow, deterministic loan
demo, core Run Engine, result calculation, modular FastAPI foundation, and asynchronous
Redis/Celery Run workflow are implemented. Case-level LLM Judge evaluation is available
through an optional OpenAI-compatible model connection. The Web application can submit
Runs, show queued and running progress, stop polling after terminal state, and open
completed reports.

- [Whole-project progress and code locations](docs/project-progress.md)
- [Current architecture](docs/architecture.md)
- [Documentation index](docs/README.md)
- [Product requirements](docs/product-requirements-zh.md)

The current backend regression suite has 508 passing tests. The Web application remains
partially refactored; consult the progress document for the implemented page scope.

## Core Flow

```text
DatasetVersion + TargetSnapshot + EvaluatorSpec
                     |
                     v
                 RunManifest
                     |
                     v
EvaluationRun -> Job dispatcher -> RunEngine
                                    |
                                    v
                           Target adapter -> Agent
                                    |
                                    v
                         Trace -> Evaluators -> Results
                                                |
                                                v
                                  Metrics -> Release Gate -> Report
```

SQLite is authoritative for POC Run state and Results. Redis and Celery provide
asynchronous delivery only; Celery task state is not a business data source.

## Target Layout

```text
src/agentgate/
  domain/          # Immutable business models and invariants
  dataset/         # Dataset loading, formats, export, and version mechanics
  run/             # Case execution engine and Target protocol
  trace/           # Trace normalization and redaction
  evaluator/       # Rule, Judge, and Hybrid evaluation
  result/          # Metrics, release gate, report, and future comparison
  skill_analysis/  # Future static Agent/Skill definition analysis
  optimizer/       # Future badcase analysis and suggestions
  integrations/    # Targets, observability, models, and job dispatchers
  application/     # Use cases shared by HTTP, CLI, and workers
  storage/         # Persistence contracts and SQLite adapter
  cli/             # Deferred command-line transport refactor
  server/          # FastAPI transport

web/               # Vue 3 and TypeScript frontend
docs/              # Active architecture, plans, and progress
examples/          # Example assets and future standalone demo Agents
tests/              # Backend regression suite
```

This is the target layout. Some legacy files remain until their callers are migrated;
the progress checklist records those differences explicitly.

Top-level `case/`, `queue/`, `experiment/`, and `lineage/` packages are not part of the
refactor architecture. Dataset/Case behavior belongs under `domain/`, `dataset/`, and
`application/`. Asynchronous work belongs behind job-dispatch integrations. A/B testing
will compose ordinary Runs and Result comparison when implemented.

## Demo

The current deterministic loan Agent demonstrates real OTel spans and business-policy
evaluation:

- high-risk loans must not be approved directly;
- some decisions require human review;
- Evaluators inspect routing, Tool calls, arguments, policy, and final state;
- a risky Agent version fails while the fixed version passes.

## Local Setup And Operation

Install the Python package and Web dependencies:

```bash
python3 -m pip install -e '.[test]'
cd web
npm install
cd ..
```

### Optional LLM Judge Configuration

The POC can add the built-in `answer-quality` evaluator through one process-level,
OpenAI-compatible model connection. Export the same four values in the API and Celery
worker environments:

```bash
export AGENTGATE_JUDGE_PROVIDER_ID="openai-compatible"
export AGENTGATE_JUDGE_BASE_URL="https://provider.example/v1"
export AGENTGATE_JUDGE_API_KEY="$JUDGE_API_KEY"
export AGENTGATE_JUDGE_MODEL_ID="your-model-id"
```

`AGENTGATE_JUDGE_PROVIDER_ID` is a stable local label. The base URL must use HTTPS and
must exclude `/chat/completions`, which the adapter appends. All four variables absent
keeps the Rule-only catalog; a partial or blank configuration is rejected. The API key
is held only by the process-local model client and is never persisted in an Evaluator
specification or Run manifest.

Persistent provider administration, tenant isolation, and Web model-provider settings
are intentionally deferred beyond this POC configuration path.

### API Key Vault Configuration

API Key management is enabled only when the server receives a persistent encryption
master key:

```bash
export AGENTGATE_API_KEY_ENCRYPTION_KEY="<URL-safe Base64 for exactly 32 random bytes>"
```

Keep the same master key available across server restarts and for every process that
must resolve the same stored API Keys. Changing or losing it makes existing encrypted
entries unreadable. AgentGate does not generate a fallback key. Without this variable,
the rest of the application remains available while API Key endpoints return `503`.

The metadata-only management API is:

- `POST /api/api-keys` creates a shared or private API Key.
- `GET /api/api-keys` lists safe metadata.
- `GET /api/api-keys/{api_key_id}` returns safe metadata.
- `DELETE /api/api-keys/{api_key_id}` deletes the stored API Key.

Plaintext API Keys are accepted only by the create request, encrypted before
persistence with AES-256-GCM, and never returned by the API. This feature provides the
vault management and internal resolution boundary. Selecting a stored API Key in a Run
or Evaluator configuration is not connected yet.

Start each process in its own terminal. The API and worker must use the same absolute
SQLite path and Redis URL. When the optional Judge is enabled, both processes must also
receive the identical four Judge values above.

```bash
redis-server --port 6379
```

```bash
AGENTGATE_DB="$PWD/agentgate-demo.db" \
AGENTGATE_REDIS_URL="redis://127.0.0.1:6379/0" \
PYTHONPATH=src \
python3 -m celery \
  -A agentgate.integrations.job_dispatchers.celery:celery_app worker \
  --loglevel=INFO --concurrency=1
```

For a Redis Cluster broker, give the API, workers, and scheduler the same cluster
settings. The URL names one reachable seed node; redis-py discovers the remaining
topology. Redis Cluster supports only database `0`.

```bash
AGENTGATE_REDIS_MODE=cluster \
AGENTGATE_REDIS_URL="redis://username:password@redis-seed:6379/0" \
AGENTGATE_REDIS_CLUSTER_HASH_TAG="{agentgate}" \
PYTHONPATH=src \
python3 -m celery \
  -A agentgate.integrations.job_dispatchers.celery:celery_app worker \
  --loglevel=INFO --concurrency=1
```

The hash tag keeps Celery queue, binding, and unacknowledged-message keys in one
Redis Cluster slot so Kombu's multi-key operations do not fail with `CROSSSLOT`.
AgentGate does not use Redis as a Celery result backend.

Scheduled Runs additionally require one lightweight scheduler worker and Celery Beat:

```bash
AGENTGATE_DB="$PWD/agentgate-demo.db" \
AGENTGATE_REDIS_URL="redis://127.0.0.1:6379/0" \
PYTHONPATH=src \
python3 -m celery \
  -A agentgate.integrations.job_dispatchers.celery:celery_app worker \
  --loglevel=INFO --concurrency=1 --queues=agentgate.scheduler \
  --hostname=scheduler@%h
```

```bash
AGENTGATE_SCHEDULER_INTERVAL_SECONDS=10 \
PYTHONPATH=src \
python3 -m celery \
  -A agentgate.integrations.job_dispatchers.celery:celery_app beat \
  --loglevel=INFO
```

```bash
AGENTGATE_DB="$PWD/agentgate-demo.db" \
AGENTGATE_REDIS_URL="redis://127.0.0.1:6379/0" \
PYTHONPATH=src \
python3 -m uvicorn agentgate.server.app:app --host 127.0.0.1 --port 8000 --reload
```

```bash
cd web
AGENTGATE_API_TARGET="http://127.0.0.1:8000" npm run dev
```

Open the Vite URL, submit an evaluation, then use **运行队列** to inspect queue position,
Case progress, timing, failures, and recent completed reports.

`scheduled_for` is an optional timezone-aware UTC value on `POST /api/evaluations`.
The default scheduler interval is 10 seconds, so a due Run normally enters the
execution queue within 10 seconds of that value. Worker availability determines its
actual start time.

## Asynchronous Run APIs

- `POST /api/evaluations` persists a pending Run, dispatches only its ID, and returns
  `202 Accepted`.
- `GET /api/runs?status=<status>` lists filterable Run history.
- `GET /api/runs/activity` returns exact lifecycle counts plus queued, running, and
  recent terminal projections.
- `GET /api/runs/{run_id}/status` returns progress, timing, error, and best-effort
  queue position.
- `GET /api/runs/{run_id}` returns the report after completion.

## Verification

```bash
pytest -q
cd web
npm run typecheck
npm run build
npm run test:e2e
```

The Playwright suite starts its own Redis broker, one Celery worker, FastAPI, and Vite.
It requires `redis-server` on `PATH` and a Playwright Chromium installation. Install the
browser once with `npx playwright install chromium` if needed.

---

# 附：AgentGate 工作台（agentgate-web-nh 集成）

以下为 `agentgate-web-nh` 仓库合入本分支的内容说明。合入时已将原 `backend/` 并入仓库根目录，相关路径已同步调整。

# AgentGate 工作台与三模式被测智能体

## 2026-09-20 最新前端测试

本次更新仅同步 `frontend/` 的新版页面、工程规范依赖和测试；后端、三类智能体及历史交付资料保持不变。

**前端测试请优先阅读 [frontend/README.md](frontend/README.md)**：安装后默认访问 `http://127.0.0.1:5198/#/overview`，代理默认连接 8098。若使用下方旧版整套启动脚本，须按前端说明设置 `FRONTEND_PORT=5197` 和 `API_PROXY_TARGET=http://127.0.0.1:8097`。本次没有同步开发者本机数据库或浏览器标注数据。

以下是保留的后端与三模式智能体交接说明。

本仓库包含 Vue 工作台、AgentGate 评测后端，以及独立运行的基础编排、工作流、云虾三模式贷款测试智能体。保留已有前后端目录和历史交付文件，不使用日期文件夹复制整套工程。

**本次交付入口：[安装与端到端验收](docs/bank-agents/README.md)。**

2026-09-18 更新：已集成后端上游 `33db48a`，包括用户/团队上下文、并发参数和旧数据库迁移。前端、被测智能体和 SDK 源码保持原样。已有部署请先阅读[升级与回退说明](docs/bank-agents/upstream-sync-20260918.md#七本次代码交付与升级)。

## 快速开始

准备 Python 3.11、uv、Node.js 22/npm、Redis 和有效的支持工具调用的模型配置。

```bash
bash scripts/setup-bank-integration.sh
cp .env.example .env
chmod 600 .env
# 编辑 .env，填写模型配置；不要上传真实密钥
bash scripts/start-bank-integration.sh
```

打开 http://127.0.0.1:5197/#tasks 。启动后会创建本机数据库并初始化三个数据库评测集，共 24 条用例。前端、API、Worker、Scheduler、Redis、被测服务共同运行；Ctrl+C 关闭本次启动的服务，不删除数据。

## 目录

- `frontend/`：前端与当前真实接口接入。
- 仓库根目录：AgentGate API、执行调度、评估与存储（原 `backend/` 已并入）。
- `tested-agents/`：独立贷款智能体、测试与依赖锁。
- `vendor/trace-sdk/`：必需 SDK 源码与来源摘要。
- `scripts/`：安装、启动、初始化、验收脚本。
- `docs/bank-agents/`：本次交付说明、架构和验证记录。
- `runtime/`：本机生成数据、日志及 Trace，不上传。
- `delivery/2026-09-16/`：保留的历史数据库及 Trace 快照，不自动恢复。

## 新机器验收

保持服务运行，在另一个终端中执行（会真实调用模型并产生费用）：

```bash
(cd frontend && npx playwright install chromium)
node scripts/accept-bank-browser.mjs
.venv/bin/python scripts/verify-bank-traces.py
```

测试从前端发起新任务，不依赖开发者历史任务 ID。输入输出、页面 Trace、平台数据库、业务数据库与 SDK JSONL 互相核对。结果写入 runtime/bank-acceptance/，业务失败不会被伪装为通过。

## 重要边界

这是可执行的本地联调实现，不是客户行内完整源码或生产行为的等价复制。使用合成数据与 test-policy-v1，不连接真实银行征信或放款系统。客户工厂、文件、完整云虾协议和安全围栏仍存在待接入内容，详见交付文档。

三模式启动必须有有效模型配置，无 Mock fallback。旧 Demo 入口 start-macos.command 仍保留；旧日期能力记录是历史资料，不应覆盖本次交付说明。现有历史浏览器测试包含固定数据依赖，新机器请使用上述验收脚本。

后端原基线：open-fin/agentgate 的 refactor-1，提交 e3760d16602c9423b54be968ea97839a5144d691；2026-09-18 集成 open-fin-sub/agentgate 的 refactor-1 提交 33db48afcb83b0331e6e012abbd100c823268313，并保留本地接入与兼容性修复。后端 Apache-2.0 许可保留在根目录 LICENSE；不要自动将其扩展至客户 SDK 和其他目录。SDK 来源声明见 vendor/trace-sdk/PROVENANCE.md。


## 工程自带贷款核心专项测评集

本地 SQLite 模式启动 API 时会自动加载以下三套合成测评集（每套12样本、14轮，发布版本v3），无需模型密钥、贷款服务或个人数据库即可查看：

- 贷款基础编排 · 核心专项测评集：工具顺序、参数、审批分支与多轮处理。
- 贷款工作流 · 核心专项测评集：完整工作流路径和条件分支。
- 贷款云虾 · 核心专项测评集：Skill路由、实际调用、工具归属及切换。

启动前后端后，在“测评集”搜索“核心专项”。种子数据保存在 `src/agentgate/demo/loan-core-datasets.json`，随源码分发；不是 `runtime/` 下的个人数据库。下载或打包工程时必须包含该文件及当前版本源码。相同ID已存在时初始化直接跳过，保留用户编辑、归档、版本与草稿；自动加载只发生在现有SQLite示例启动分支，MySQL/行内部署不自动写入这些测试数据。

这些样本采用 test-policy-v1 和 test-low/test-high/test-blocked 合成客户，不是生产贷款审批规则。查看样本不需要联网；真正执行测评需要启动本地贷款测试服务，LLM评估还需要接收方配置自己的模型连接。历史测评任务、运行结果和密钥不随种子数据分发。

核心专项v3增加199999／200000／200001／300000元金额分支，阻断客户样本调整为50000元。已有数据库不会被种子初始化覆盖，可从最新源码样本导入新草稿；本地验收数据库已发布v3，历史任务仍引用原版本。
