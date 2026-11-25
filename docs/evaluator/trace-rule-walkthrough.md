# 用 Trace 规则评估贷款工作流的工具调用顺序

本案例在本机行外环境使用合成样本，检查同一条 Trace 里是否存在一次成功的申请录入，随后有一次成功的征信查询。完成操作后，可以在测评任务中看到评估器版本、分数、判定理由，并把两条证据定位到该次执行的工具节点。

2026-11-25 实跑 1 条样本，任务已完成，规则评估器 v1 得到 **100.0 / 100，通过**。评估器、正式任务、评分和执行轨迹可在本机工作台回看。 [实跑样本结果](http://127.0.0.1:5197/agentgate/#/tasks/ca1b1f73-84be-45fd-9a5d-a2f096ff8b03/samples/workflow-core-low)

## 实操准备

启动本地工作台，选择 **行外 Login**。本案例使用项目内置的合成贷款服务。正式任务会调用本机配置的被测模型，本次选用规则评估器进行评分。样本直达链接如打开欢迎页，可在登录后从「测评任务」搜索下文的完整任务名称。 [工程启动说明](../../README.md#新机器快速开始)

| 项目 | 选择 |
| --- | --- |
| 被测智能体 | 贷款智能体 · 工作流，`loan-workflow`，版本 `v1` |
| 测评集 | 贷款工作流 · 核心专项测评集，版本 `v3` |
| 样本 | 01 低风险正常通过，`workflow-core-low` |
| 历史 Trace | `ec91d36af640467daae1071a14141418` |

本机已经有一条可用于试运行的历史 Trace。若在新装环境操作且 Trace 下拉框为空，先在「测评任务」新建一个单任务，使用上述智能体、测评集和指定样本，选择预置的「必需工具调用」评估器。等任务完成后，打开样本详情，记下「执行轨迹追踪」中的 Trace ID。 [本机历史样本](http://127.0.0.1:5197/agentgate/#/tasks/0681df9d-55b7-4523-b635-e36ea2b384cf/samples/workflow-core-low)

## 1. 从 Trace 设计规则

历史 Trace 中的两个工具节点均为 `tool` 类型，状态均为 `ok`。

| 工具节点 | 序号 | 历史 Span ID |
| --- | ---: | --- |
| `submit_application`，录入申请 | 5 | `4aa8fd1a3db8ccbb` |
| `credit_inquiry`，查询征信 | 7 | `30783854bedc886a` |

在 `trace["spans"]` 中分别找成功的录入和查询节点。若任意一对节点满足录入的 `sequence` 小于查询的 `sequence`，返回分数 `1`、判定理由和这两个节点的 `span_id`。找不到这样的组合时返回分数 `0`。代码每次从当前输入取证据 ID，因此换一条 Trace 也能使用。

```python
def exec_evaluation(trace):
    submissions = [span for span in trace["spans"]
                   if span.get("operation_type") == "tool"
                   and span.get("name") == "submit_application"
                   and span.get("status") == "ok"]
    inquiries = [span for span in trace["spans"]
                 if span.get("operation_type") == "tool"
                 and span.get("name") == "credit_inquiry"
                 and span.get("status") == "ok"]
    for submission in submissions:
        for inquiry in inquiries:
            if submission["sequence"] < inquiry["sequence"]:
                return EvalOutput(
                    score=1,
                    reason="已先成功录入申请，再成功查询征信",
                    span_ids=[submission["span_id"], inquiry["span_id"]],
                )
    return EvalOutput(
        score=0,
        reason="未找到成功录入后再成功查询征信的顺序证据",
        span_ids=[],
    )
```

## 2. 自定义新建评估器

1. 打开「评估器 → 规则评估」，点击「新建规则评估器」。
2. 在「评估器模板」窗口点击「自定义创建规则评估器」。
3. 填写名称，建议用「实操案例 · 工作流先录入再查询征信」加上本次练习的唯一后缀。本机已有演示记录使用后缀 `20261125`。描述可填「检查成功录入申请早于成功查询征信，返回对应的两个工具节点作为证据」。
4. 把上面的函数完整替换到左侧「评估代码」。

## 3. 获取样例 Trace

在右侧「Trace 数据」，依次选择 **贷款智能体 · 工作流 · loan-workflow → 无分支记录 → v1 → Trace**。Trace 下拉选项带有样本 ID、时间和 Trace ID。本机演示选取 `workflow-core-low` 对应的 `ec91d36af640467daae1071a14141418`。选中后，右侧「测试数据 JSON」会自动填入历史轨迹的脱敏副本。

## 4. 试运行

点击「试运行」。本次用历史轨迹得到「通过 · 100.0 / 100」，理由为「已先成功录入申请，再成功查询征信」，证据为上表的两个历史 Span ID。规则返回的 `1` 是归一化分数，界面按百分制显示。

## 5. 检查语法

点击「检查语法」，确认出现「静态检查通过」。此步骤校验函数签名、支持的 Python 语法和配置。试运行和语法检查在编辑器里即时返回，读者可用同一个历史 Trace 重做这两步。

## 6. 保存草稿

点击「保存草稿」。界面显示「草稿已保存」，此时可继续修改规则。草稿提交后，服务端为评估器分配固定 ID。本次 ID 为 `4d0814a7-8350-4d39-ac4a-709fa43b1c79`。

## 7. 发布并启用

点击「发布并启用」。首次发布得到 `v1`，启用后可被新任务选中。评估器详情会出现「打开测评配置」。 [本机案例评估器](http://127.0.0.1:5197/agentgate/#/evaluators/4d0814a7-8350-4d39-ac4a-709fa43b1c79)

## 8. 引用评估器并执行

1. 在评估器详情点击「打开测评配置」，系统会预选这个评估器。
2. 选择「单任务」，填写唯一任务名称。被测智能体选「贷款智能体 · 工作流」，版本选 `v1`。
3. 「测评数据」选择「贷款工作流 · 核心专项测评集」`v3`，将「运行范围」改为「指定用例」，只选「01 低风险正常通过」。
4. 在「评估方式」确认只选择刚发布的规则评估器。并发样本数填 `1`，执行超时填 `120` 秒。点击「开始测评」，等待任务状态「运行完成」。

## 9. 查看版本、分数和依据

1. 从「测评任务」点击任务名称。进入「执行结果」，在样本行查看新评估器的得分列。切到「任务快照」可以确认任务使用的评估器版本。
2. 在样本行点击「样本详情」，在「测评结果 → 评估结论与依据」查看评估器名称、版本、分数和检查结果。
3. 展开该评估器卡片的「原始评估记录」。查看 `checks[0].reason` 和 `checks[0].span_ids`。在同页「执行轨迹追踪」展开调用树，可核对工具及顺序。需要对照具体 ID 时，在「完整 Trace JSON」里搜索 Span ID。

### 本机正式任务的落库记录

| 项目 | 实际结果 |
| --- | --- |
| 任务 | 规则评估器实操 · 贷款工作流单样本 · 20261125 |
| 任务和运行 ID | `ca1b1f73-84be-45fd-9a5d-a2f096ff8b03` |
| 完成时间 | 2026-11-25 10:01:20（北京时间） |
| 评估器 | 实操案例 · 工作流先录入再查询征信 · 20261125，`v1` |
| 样本结果 | 1 条样本，`pass`，`100.0 / 100` |
| 规则理由 | 已先成功录入申请，再成功查询征信 |
| 新 Trace ID | `4647d6683711436aa02b3cf56767d95e` |
| 正式证据一 | `submit_application`，序号 `5`，Span `893cc6eb4beb9b8f` |
| 正式证据二 | `credit_inquiry`，序号 `7`，Span `519caec6d0cf0501` |

正式结果的汇总理由是「所有适用检查均通过」。代码返回的具体理由和两个证据 ID 保存在检查项中。正式任务的 Trace ID 和 Span ID 由这次执行产生，读者重跑后可用自己的 ID 对照。 [打开本机正式任务](http://127.0.0.1:5197/agentgate/#/tasks/ca1b1f73-84be-45fd-9a5d-a2f096ff8b03)

## 规则代码如何在测评任务中生效

### 编辑和试运行

编辑器用登录模式查询可见 Trace，通过 `GET /api/evaluators/code/trace-data` 把历史数据填入右侧。试运行把代码配置和当前测试 JSON 发给 `POST /api/evaluators/code/try-run`。语法检查则调用 `POST /api/evaluators/code/validate`，传入配置供静态校验。 [CodeRuleEditor.vue](../../frontend/src/views/evaluation/components/CodeRuleEditor.vue#L196) · [评估器路由](../../src/agentgate/server/routes/evaluators.py#L74) · [Trace 测试副本](../../src/agentgate/application/result_reader.py#L226)

实际保存的配置包含 `implementation_id: code_rule`、实现版本 `1`、`input_format: trace-v1`、可执行的 `source` 和默认通过分数 `pass_threshold: 1`。发布将草稿固化为独立的评估器版本 `v1`，再更新启用状态。评估器版本标识这份用户规则的发布版本，实现版本标识服务端规则解释器的实现契约。 [草稿与发布入口](../../frontend/src/views/evaluation/components/CodeRuleDialog.vue#L110) · [版本发布](../../src/agentgate/application/evaluator_management.py#L436)

### 提交时冻结评估器版本

任务表单将所选评估器 ID 和发布版本放进 `evaluator_refs`。本案例的行外本地目标走 `POST /api/bank-evaluations`。运行管理读取确切的测评集、指定样本和评估器版本，把完整 `EvaluatorSpec`、主评估器 ID 和智能体快照写入 `RunManifest`。后续 Worker 以这个清单的内容执行，因此历史任务可以查询当时生效的规则代码。 [表单构造版本引用](../../frontend/src/views/evaluation/components/EvaluationTaskForm.vue#L578) · [本地提交路由](../../src/agentgate/server/routes/bank_targets.py#L60) · [生成 RunManifest](../../src/agentgate/application/run_management.py#L77)

### 执行时读取新 Trace，保存评分证据

Worker 读取已入库的 Run。样本执行结束后，运行引擎保存这次的新 Trace，再把 Trace 和快照中的评估器交给评估执行器。`code_rule` 配合 `trace-v1` 会按用例执行一次，`CodeRuleEvaluator.evaluate_case()` 将整条 Trace 转为 Python 规则所需的数据。规则解释器在限定的子进程里执行 `exec_evaluation(trace)`，校验分数范围、理由格式，以及每个 Span ID 是否属于当前输入。 [Worker 执行入口](../../src/agentgate/integrations/job_dispatchers/execution.py#L45) · [采集轨迹和保存结果](../../src/agentgate/run/engine.py#L296) · [选择用例级评估](../../src/agentgate/evaluator/executor.py#L385) · [规则实现](../../src/agentgate/evaluator/rule/code.py#L60)

`CodeRuleEvaluator._evaluate_data()` 将返回值与通过分数比较，生成检查项。该检查项的 `turn_id` 为 `null`，表示用例级检查。执行器将版本、归一化分数、判定和检查项组装为 `EvaluationResult`，运行引擎保存它。结果卡片按百分制展示分数，通过「原始评估记录」展示具体的规则理由和证据 ID。 [生成检查项](../../src/agentgate/evaluator/rule/code.py#L121) · [组装 EvaluationResult](../../src/agentgate/evaluator/executor.py#L150) · [结果展示](../../frontend/src/views/evaluation/components/ResultEvaluationCard.vue#L195)
