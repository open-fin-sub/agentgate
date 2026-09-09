# A–I 全站可用性整改台账 WEB-UX-GOAL-001

基线 9686d59。先完成静态全站定位，再逐实例核对上下文并整改；每个定位是一个可追踪实例，同一行可能同时违反多条独立模式。非缺陷须写明依据，不能因正则不再匹配而自动关闭。原始行号与原始计数保持不变，当前状态存于同名 JSON。

## 授权与已拍板变更

- 用户显式 Goal：逐模式设计、实施、验证与本地提交，无逐文件确认；不 push/PR/合并，不联系旧评审任务。
- RC-01：货币成本全部移除，改为输入/输出/总 Token 与耗时；历史文档未决项由本决定覆盖。
- RC-02：自动生成测评集本轮延后；只保留手工/导入，场景 A 第2步按新口径。
- 真实页面只连接真实 API；缺口登记联合工作项并做用户侧降级。

## 模式统计（改前）

|模式类|实例数|剩余|
|---|---:|---:|
|B-META|199|199|
|G-COPY|50|0|
|D-CONTROL|41|41|
|G-EMPTY|57|0|
|A-INPUT|33|0|
|A-FORM|6|0|
|I-FEEDBACK|25|25|
|RC-TOKEN|56|0|
|H-TERMS|12|12|
|C-CONTEXT|5|5|
|E-ROLE|1|1|
|RC-GENERATION|1|0|
|D-SYSTEM|1|1|
|F-PAGES|1|1|

## 缺陷明细

|ID|文件:原始行|规则|模式类|严重度|问题|状态与证据|
|---|---|---|---|---|---|---|
|UX-0001|web/src/components/AppSidebar.vue:81|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0002|web/src/components/AppSidebar.vue:81|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0003|web/src/components/dataset/CaseEditor.vue:78|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0004|web/src/components/dataset/CaseEditor.vue:85|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0005|web/src/components/dataset/CaseEditor.vue:138|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0006|web/src/components/dataset/CaseEditor.vue:144|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0007|web/src/components/dataset/CaseEditor.vue:156|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0008|web/src/components/dataset/CaseEditor.vue:161|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0009|web/src/components/dataset/CaseEditor.vue:68|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0010|web/src/components/dataset/CaseTable.vue:44|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0011|web/src/components/dataset/CaseTable.vue:67|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0012|web/src/components/dataset/CaseTable.vue:68|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0013|web/src/components/dataset/CaseTable.vue:71|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0014|web/src/components/dataset/CaseTable.vue:76|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0015|web/src/components/dataset/CaseTable.vue:84|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0016|web/src/components/dataset/CaseTable.vue:90|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0017|web/src/components/dataset/CaseTable.vue:91|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0018|web/src/components/dataset/CaseTable.vue:91|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0019|web/src/components/dataset/CaseTable.vue:94|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0020|web/src/components/dataset/DatasetList.vue:38|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0021|web/src/components/dataset/DatasetList.vue:59|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0022|web/src/components/dataset/DatasetList.vue:60|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0023|web/src/components/dataset/DatasetList.vue:64|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0024|web/src/components/dataset/DatasetList.vue:67|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0025|web/src/components/dataset/DatasetList.vue:69|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0026|web/src/components/dataset/ExpectationEditor.vue:88|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0027|web/src/components/dataset/ExpectationEditor.vue:101|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0028|web/src/components/dataset/ExpectationEditor.vue:106|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0029|web/src/components/dataset/ExpectationEditor.vue:131|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0030|web/src/components/dataset/ExpectationEditor.vue:146|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0031|web/src/components/dataset/VersionSelector.vue:37|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0032|web/src/components/dataset/VersionSelector.vue:40|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0033|web/src/components/dataset/VersionSelector.vue:43|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0034|web/src/components/dataset/VersionSelector.vue:49|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0035|web/src/components/dataset/VersionSelector.vue:59|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0036|web/src/components/dataset/VersionSelector.vue:65|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0037|web/src/layouts/AppLayout.vue:128|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0038|web/src/pages/CaseResultPage.vue:117|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0039|web/src/pages/CaseResultPage.vue:118|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0040|web/src/pages/CaseResultPage.vue:139|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0041|web/src/pages/CaseResultPage.vue:172|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0042|web/src/pages/CaseResultPage.vue:195|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0043|web/src/pages/CaseResultPage.vue:223|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0044|web/src/pages/CaseResultPage.vue:234|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0045|web/src/pages/CaseResultPage.vue:249|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0046|web/src/pages/CaseResultPage.vue:263|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0047|web/src/pages/CaseResultPage.vue:267|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0048|web/src/pages/CaseResultPage.vue:301|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0049|web/src/pages/CaseResultPage.vue:303|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0050|web/src/pages/CaseResultPage.vue:309|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0051|web/src/pages/CaseResultPage.vue:327|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0052|web/src/pages/CaseResultPage.vue:328|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0053|web/src/pages/CaseResultPage.vue:332|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0054|web/src/pages/CaseResultPage.vue:263|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0055|web/src/pages/DatasetWorkspace.vue:542|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0056|web/src/pages/DatasetWorkspace.vue:576|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0057|web/src/pages/DatasetWorkspace.vue:612|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0058|web/src/pages/DatasetWorkspace.vue:618|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0059|web/src/pages/DatasetWorkspace.vue:646|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0060|web/src/pages/DatasetWorkspace.vue:675|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0061|web/src/pages/EvaluatorWorkspacePage.vue:42|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0062|web/src/pages/EvaluatorWorkspacePage.vue:42|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0063|web/src/pages/EvaluatorWorkspacePage.vue:43|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0064|web/src/pages/EvaluatorWorkspacePage.vue:45|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0065|web/src/pages/EvaluatorWorkspacePage.vue:50|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0066|web/src/pages/EvaluatorWorkspacePage.vue:57|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0067|web/src/pages/EvaluatorWorkspacePage.vue:60|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0068|web/src/pages/EvaluatorWorkspacePage.vue:69|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0069|web/src/pages/EvaluatorWorkspacePage.vue:71|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0070|web/src/pages/EvaluatorWorkspacePage.vue:85|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0071|web/src/pages/EvaluatorWorkspacePage.vue:88|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0072|web/src/pages/EvaluatorWorkspacePage.vue:89|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0073|web/src/pages/LineagePage.vue:190|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0074|web/src/pages/LineagePage.vue:207|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0075|web/src/pages/LineagePage.vue:216|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0076|web/src/pages/LineagePage.vue:220|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0077|web/src/pages/LineagePage.vue:228|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0078|web/src/pages/LineagePage.vue:239|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0079|web/src/pages/LineagePage.vue:270|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0080|web/src/pages/LineagePage.vue:277|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0081|web/src/pages/LineagePage.vue:323|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0082|web/src/pages/OverviewPage.vue:49|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0083|web/src/pages/OverviewPage.vue:58|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0084|web/src/pages/OverviewPage.vue:100|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0085|web/src/pages/OverviewPage.vue:101|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0086|web/src/pages/OverviewPage.vue:124|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0087|web/src/pages/OverviewPage.vue:141|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0088|web/src/pages/OverviewPage.vue:141|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0089|web/src/pages/RunComparisonPage.vue:224|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0090|web/src/pages/RunComparisonPage.vue:235|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0091|web/src/pages/RunComparisonPage.vue:263|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0092|web/src/pages/RunComparisonPage.vue:297|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0093|web/src/pages/RunComparisonPage.vue:301|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0094|web/src/pages/RunComparisonPage.vue:318|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0095|web/src/pages/RunComparisonPage.vue:328|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0096|web/src/pages/RunComparisonPage.vue:402|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0097|web/src/pages/RunComparisonPage.vue:410|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0098|web/src/pages/RunComparisonPage.vue:439|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0099|web/src/pages/RunComparisonPage.vue:450|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0100|web/src/pages/RunComparisonPage.vue:460|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0101|web/src/pages/RunComparisonPage.vue:463|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0102|web/src/pages/RunComparisonPage.vue:470|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0103|web/src/pages/RunCreatePage.vue:202|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0104|web/src/pages/RunCreatePage.vue:204|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0105|web/src/pages/RunCreatePage.vue:213|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0106|web/src/pages/RunCreatePage.vue:216|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0107|web/src/pages/RunCreatePage.vue:220|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0108|web/src/pages/RunCreatePage.vue:227|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0109|web/src/pages/RunCreatePage.vue:237|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0110|web/src/pages/RunCreatePage.vue:270|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0111|web/src/pages/RunCreatePage.vue:292|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0112|web/src/pages/RunCreatePage.vue:295|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0113|web/src/pages/RunCreatePage.vue:296|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0114|web/src/pages/RunCreatePage.vue:308|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0115|web/src/pages/RunCreatePage.vue:316|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0116|web/src/pages/RunCreatePage.vue:325|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0117|web/src/pages/RunCreatePage.vue:308|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0118|web/src/pages/RunDetailPage.vue:141|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0119|web/src/pages/RunDetailPage.vue:187|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0120|web/src/pages/RunDetailPage.vue:221|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0121|web/src/pages/RunDetailPage.vue:224|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0122|web/src/pages/RunDetailPage.vue:239|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0123|web/src/pages/RunDetailPage.vue:268|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0124|web/src/pages/RunDetailPage.vue:323|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0125|web/src/pages/RunDetailPage.vue:329|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0126|web/src/pages/RunDetailPage.vue:336|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0127|web/src/pages/RunDetailPage.vue:343|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0128|web/src/pages/RunDetailPage.vue:370|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|待整改|
|UX-0129|web/src/pages/RunDetailPage.vue:387|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0130|web/src/pages/RunDetailPage.vue:426|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0131|web/src/pages/RunDetailPage.vue:423|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0132|web/src/pages/RunListPage.vue:104|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0133|web/src/pages/RunListPage.vue:109|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0134|web/src/pages/RunListPage.vue:116|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0135|web/src/pages/RunListPage.vue:121|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0136|web/src/pages/RunListPage.vue:122|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0137|web/src/pages/RunListPage.vue:130|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0138|web/src/pages/RunListPage.vue:147|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0139|web/src/pages/RunWorkspacePage.vue:125|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0140|web/src/pages/RunWorkspacePage.vue:132|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0141|web/src/pages/RunWorkspacePage.vue:139|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0142|web/src/pages/RunWorkspacePage.vue:146|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0143|web/src/pages/RunWorkspacePage.vue:177|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0144|web/src/pages/TargetListPage.vue:34|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0145|web/src/pages/TargetListPage.vue:40|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0146|web/src/preview/comparison.ts:22|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0147|web/src/preview/comparison.ts:123|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0148|web/src/preview/comparison.ts:124|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0149|web/src/preview/comparison.ts:228|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0150|web/src/preview/comparison.ts:263|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0151|web/src/preview/comparison.ts:272|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0152|web/src/preview/comparison.ts:399|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0153|web/src/preview/comparison.ts:442|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0154|web/src/preview/comparison.ts:443|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0155|web/src/preview/components/AnalysisStatic.vue:89|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0156|web/src/preview/components/AnalysisStatic.vue:128|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0157|web/src/preview/components/AnalysisStatic.vue:129|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0158|web/src/preview/components/AnalysisStatic.vue:136|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0159|web/src/preview/components/AnalysisStatic.vue:169|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0160|web/src/preview/components/AnalysisStatic.vue:177|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0161|web/src/preview/components/AnalysisStatic.vue:179|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0162|web/src/preview/components/AnalysisStatic.vue:182|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0163|web/src/preview/components/AnalysisStatic.vue:182|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0164|web/src/preview/components/AnalysisSuggestion.vue:296|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0165|web/src/preview/components/AnalysisSuggestion.vue:305|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0166|web/src/preview/components/AnalysisSuggestion.vue:310|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0167|web/src/preview/components/AnalysisSuggestion.vue:317|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|待整改|
|UX-0168|web/src/preview/components/AnalysisSuggestion.vue:320|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0169|web/src/preview/components/AnalysisSuggestion.vue:372|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0170|web/src/preview/components/AnalysisSuggestion.vue:385|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0171|web/src/preview/components/AnalysisSuggestion.vue:396|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0172|web/src/preview/components/AnalysisSuggestion.vue:410|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0173|web/src/preview/components/AnalysisSuggestion.vue:415|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0174|web/src/preview/components/AnalysisSuggestion.vue:421|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0175|web/src/preview/components/AnalysisSuggestion.vue:395|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0176|web/src/preview/components/AnalysisSuggestion.vue:396|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0177|web/src/preview/components/CompareCreate.vue:265|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0178|web/src/preview/components/CompareCreate.vue:276|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0179|web/src/preview/components/CompareCreate.vue:284|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0180|web/src/preview/components/CompareCreate.vue:328|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0181|web/src/preview/components/CompareCreate.vue:392|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0182|web/src/preview/components/CompareCreate.vue:415|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0183|web/src/preview/components/CompareCreate.vue:436|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0184|web/src/preview/components/CompareCreate.vue:456|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0185|web/src/preview/components/CompareCreate.vue:240|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0186|web/src/preview/components/CompareCreate.vue:42|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0187|web/src/preview/components/CompareCreate.vue:362|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0188|web/src/preview/components/CompareCreate.vue:373|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0189|web/src/preview/components/CompareCreate.vue:405|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0190|web/src/preview/components/CompareCreate.vue:406|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0191|web/src/preview/components/CompareEvidence.vue:12|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0192|web/src/preview/components/CompareEvidence.vue:15|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0193|web/src/preview/components/CompareEvidence.vue:21|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0194|web/src/preview/components/CompareEvidence.vue:24|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0195|web/src/preview/components/CompareEvidence.vue:31|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0196|web/src/preview/components/CompareEvidence.vue:32|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0197|web/src/preview/components/CompareEvidence.vue:36|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|待整改|
|UX-0198|web/src/preview/components/CompareEvidence.vue:45|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0199|web/src/preview/components/CompareEvidence.vue:32|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0200|web/src/preview/components/CompareLineage.vue:54|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0201|web/src/preview/components/CompareLineage.vue:79|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0202|web/src/preview/components/CompareLineage.vue:83|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0203|web/src/preview/components/CompareLineage.vue:86|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0204|web/src/preview/components/ComparePreflight.vue:96|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0205|web/src/preview/components/ComparePreflight.vue:31|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0206|web/src/preview/components/ComparePreflight.vue:37|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0207|web/src/preview/components/PrepCaseEditor.vue:152|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0208|web/src/preview/components/PrepCaseEditor.vue:157|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0209|web/src/preview/components/PrepCaseEditor.vue:162|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0210|web/src/preview/components/PrepCaseEditor.vue:164|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0211|web/src/preview/components/PrepCaseEditor.vue:168|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0212|web/src/preview/components/PrepCaseEditor.vue:184|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0213|web/src/preview/components/PrepCaseEditor.vue:186|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0214|web/src/preview/components/PrepCaseEditor.vue:192|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0215|web/src/preview/components/PrepCaseEditor.vue:204|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0216|web/src/preview/components/PrepCaseEditor.vue:228|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0217|web/src/preview/components/PrepCaseEditor.vue:129|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0218|web/src/preview/components/PrepDatasetPrepare.vue:529|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0219|web/src/preview/components/PrepDatasetPrepare.vue:552|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|后续范围：自动生成向导在本轮隐藏；旧链接进入手工创建。用户已拍板延后，本轮不整改隐藏的生成说明。|
|UX-0220|web/src/preview/components/PrepDatasetPrepare.vue:559|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|后续范围：用户已拍板延后自动生成；入口隐藏，旧链接只展示手工创建。preparation.spec.ts 桌面/手机验证通过。|
|UX-0221|web/src/preview/components/PrepDatasetPrepare.vue:561|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|后续范围：用户已拍板延后自动生成；入口隐藏，旧链接只展示手工创建。preparation.spec.ts 桌面/手机验证通过。|
|UX-0222|web/src/preview/components/PrepDatasetPrepare.vue:614|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0223|web/src/preview/components/PrepDatasetPrepare.vue:621|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0224|web/src/preview/components/PrepDatasetPrepare.vue:622|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0225|web/src/preview/components/PrepDatasetPrepare.vue:660|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0226|web/src/preview/components/PrepEvaluatorEditor.vue:78|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0227|web/src/preview/components/PrepEvaluatorEditor.vue:107|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0228|web/src/preview/components/PrepEvaluatorEditor.vue:142|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0229|web/src/preview/components/PrepEvaluatorEditor.vue:153|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0230|web/src/preview/components/PrepEvaluatorEditor.vue:56|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0231|web/src/preview/components/PrepJsonImport.vue:159|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0232|web/src/preview/components/PrepJsonImport.vue:175|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0233|web/src/preview/components/PrepTrial.vue:56|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0234|web/src/preview/components/PrepTrial.vue:77|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0235|web/src/preview/components/PrepTrial.vue:80|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0236|web/src/preview/components/PrepTrial.vue:86|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0237|web/src/preview/components/PrepTrial.vue:90|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0238|web/src/preview/components/RunProgress.vue:68|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0239|web/src/preview/components/RunProgress.vue:78|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0240|web/src/preview/components/RunProgress.vue:81|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0241|web/src/preview/components/RunSupport.ts:101|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0242|web/src/preview/components/RunSupport.ts:224|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0243|web/src/preview/components/RunSupport.ts:235|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0244|web/src/preview/components/RunSupport.ts:236|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0245|web/src/preview/execution.ts:41|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0246|web/src/preview/execution.ts:138|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0247|web/src/preview/execution.ts:148|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0248|web/src/preview/execution.ts:235|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0249|web/src/preview/execution.ts:256|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0250|web/src/preview/pages/AnalysisPage.vue:253|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0251|web/src/preview/pages/AnalysisPage.vue:256|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0252|web/src/preview/pages/AnalysisPage.vue:257|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0253|web/src/preview/pages/AnalysisPage.vue:263|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0254|web/src/preview/pages/AnalysisPage.vue:267|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0255|web/src/preview/pages/AnalysisPage.vue:291|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0256|web/src/preview/pages/AnalysisPage.vue:292|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0257|web/src/preview/pages/AnalysisPage.vue:300|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0258|web/src/preview/pages/AnalysisPage.vue:311|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0259|web/src/preview/pages/AnalysisPage.vue:341|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0260|web/src/preview/pages/AnalysisPage.vue:355|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0261|web/src/preview/pages/AnalysisPage.vue:356|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0262|web/src/preview/pages/AnalysisPage.vue:375|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|待整改|
|UX-0263|web/src/preview/pages/AnalysisPage.vue:395|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0264|web/src/preview/pages/AnalysisPage.vue:396|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0265|web/src/preview/pages/AnalysisPage.vue:406|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0266|web/src/preview/pages/AnalysisPage.vue:425|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0267|web/src/preview/pages/AnalysisPage.vue:434|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0268|web/src/preview/pages/AnalysisPage.vue:435|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0269|web/src/preview/pages/AnalysisPage.vue:388|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：中文子串误命中“生成本次”，不是货币成本。|
|UX-0270|web/src/preview/pages/CasePage.vue:349|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0271|web/src/preview/pages/CasePage.vue:351|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0272|web/src/preview/pages/CasePage.vue:356|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0273|web/src/preview/pages/CasePage.vue:358|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0274|web/src/preview/pages/CasePage.vue:361|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0275|web/src/preview/pages/CasePage.vue:374|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0276|web/src/preview/pages/CasePage.vue:389|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0277|web/src/preview/pages/CasePage.vue:392|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0278|web/src/preview/pages/CasePage.vue:398|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0279|web/src/preview/pages/CasePage.vue:410|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0280|web/src/preview/pages/CasePage.vue:412|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0281|web/src/preview/pages/CasePage.vue:415|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0282|web/src/preview/pages/CasePage.vue:418|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0283|web/src/preview/pages/CasePage.vue:487|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0284|web/src/preview/pages/CasePage.vue:509|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0285|web/src/preview/pages/CasePage.vue:510|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0286|web/src/preview/pages/CasePage.vue:517|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0287|web/src/preview/pages/CasePage.vue:532|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0288|web/src/preview/pages/CasePage.vue:534|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0289|web/src/preview/pages/CasePage.vue:540|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0290|web/src/preview/pages/CasePage.vue:589|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0291|web/src/preview/pages/CasePage.vue:591|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0292|web/src/preview/pages/CasePage.vue:594|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0293|web/src/preview/pages/CasePage.vue:597|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0294|web/src/preview/pages/CasePage.vue:392|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0295|web/src/preview/pages/ComparisonPage.vue:240|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0296|web/src/preview/pages/ComparisonPage.vue:241|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0297|web/src/preview/pages/ComparisonPage.vue:250|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0298|web/src/preview/pages/ComparisonPage.vue:252|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0299|web/src/preview/pages/ComparisonPage.vue:265|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0300|web/src/preview/pages/ComparisonPage.vue:273|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0301|web/src/preview/pages/ComparisonPage.vue:276|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0302|web/src/preview/pages/ComparisonPage.vue:277|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0303|web/src/preview/pages/ComparisonPage.vue:289|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0304|web/src/preview/pages/ComparisonPage.vue:292|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0305|web/src/preview/pages/ComparisonPage.vue:298|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0306|web/src/preview/pages/ComparisonPage.vue:301|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0307|web/src/preview/pages/ComparisonPage.vue:325|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0308|web/src/preview/pages/ComparisonPage.vue:332|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0309|web/src/preview/pages/ComparisonPage.vue:337|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0310|web/src/preview/pages/ComparisonPage.vue:353|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0311|web/src/preview/pages/ComparisonPage.vue:432|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0312|web/src/preview/pages/ComparisonPage.vue:445|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0313|web/src/preview/pages/ComparisonPage.vue:472|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0314|web/src/preview/pages/ComparisonPage.vue:480|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0315|web/src/preview/pages/ComparisonPage.vue:485|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0316|web/src/preview/pages/ComparisonPage.vue:500|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0317|web/src/preview/pages/ComparisonPage.vue:511|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0318|web/src/preview/pages/ComparisonPage.vue:518|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0319|web/src/preview/pages/ComparisonsPage.vue:82|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0320|web/src/preview/pages/ComparisonsPage.vue:94|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0321|web/src/preview/pages/ComparisonsPage.vue:98|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0322|web/src/preview/pages/ComparisonsPage.vue:102|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0323|web/src/preview/pages/ComparisonsPage.vue:110|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0324|web/src/preview/pages/DatasetsPage.vue:320|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0325|web/src/preview/pages/DatasetsPage.vue:332|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0326|web/src/preview/pages/DatasetsPage.vue:337|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0327|web/src/preview/pages/DatasetsPage.vue:381|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|待整改|
|UX-0328|web/src/preview/pages/DatasetsPage.vue:386|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0329|web/src/preview/pages/DatasetsPage.vue:404|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0330|web/src/preview/pages/DatasetsPage.vue:405|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0331|web/src/preview/pages/DatasetsPage.vue:410|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0332|web/src/preview/pages/DatasetsPage.vue:413|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0333|web/src/preview/pages/DatasetsPage.vue:416|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0334|web/src/preview/pages/DatasetsPage.vue:427|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0335|web/src/preview/pages/DatasetsPage.vue:430|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0336|web/src/preview/pages/DatasetsPage.vue:442|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0337|web/src/preview/pages/DatasetsPage.vue:445|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0338|web/src/preview/pages/DatasetsPage.vue:487|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0339|web/src/preview/pages/DatasetsPage.vue:506|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0340|web/src/preview/pages/DatasetsPage.vue:507|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0341|web/src/preview/pages/EvaluatorsPage.vue:257|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0342|web/src/preview/pages/EvaluatorsPage.vue:266|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0343|web/src/preview/pages/EvaluatorsPage.vue:309|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0344|web/src/preview/pages/EvaluatorsPage.vue:313|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|待整改|
|UX-0345|web/src/preview/pages/EvaluatorsPage.vue:357|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0346|web/src/preview/pages/EvaluatorsPage.vue:358|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0347|web/src/preview/pages/EvaluatorsPage.vue:366|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0348|web/src/preview/pages/EvaluatorsPage.vue:367|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0349|web/src/preview/pages/OverviewPage.vue:54|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0350|web/src/preview/pages/OverviewPage.vue:91|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0351|web/src/preview/pages/OverviewPage.vue:96|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0352|web/src/preview/pages/OverviewPage.vue:101|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0353|web/src/preview/pages/OverviewPage.vue:164|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0354|web/src/preview/pages/OverviewPage.vue:167|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0355|web/src/preview/pages/OverviewPage.vue:174|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0356|web/src/preview/pages/OverviewPage.vue:177|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0357|web/src/preview/pages/OverviewPage.vue:19|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0358|web/src/preview/pages/ResourcesPage.vue:212|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0359|web/src/preview/pages/ResourcesPage.vue:220|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0360|web/src/preview/pages/ResourcesPage.vue:103|E1/E2|E-ROLE|P1|普通用户只读摘要，管理入口复用RoleGate|待整改|
|UX-0361|web/src/preview/pages/ResourcesPage.vue:12|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0362|web/src/preview/pages/ResourcesPage.vue:89|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0363|web/src/preview/pages/RunCreatePage.vue:346|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0364|web/src/preview/pages/RunCreatePage.vue:354|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0365|web/src/preview/pages/RunCreatePage.vue:358|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0366|web/src/preview/pages/RunCreatePage.vue:392|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0367|web/src/preview/pages/RunCreatePage.vue:416|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0368|web/src/preview/pages/RunCreatePage.vue:423|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0369|web/src/preview/pages/RunCreatePage.vue:454|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0370|web/src/preview/pages/RunCreatePage.vue:463|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0371|web/src/preview/pages/RunCreatePage.vue:489|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0372|web/src/preview/pages/RunCreatePage.vue:525|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|待整改|
|UX-0373|web/src/preview/pages/RunCreatePage.vue:542|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0374|web/src/preview/pages/RunCreatePage.vue:543|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0375|web/src/preview/pages/RunCreatePage.vue:546|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0376|web/src/preview/pages/RunCreatePage.vue:296|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0377|web/src/preview/pages/RunCreatePage.vue:38|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0378|web/src/preview/pages/RunCreatePage.vue:103|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0379|web/src/preview/pages/RunCreatePage.vue:481|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0380|web/src/preview/pages/RunCreatePage.vue:489|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0381|web/src/preview/pages/RunCreatePage.vue:495|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0382|web/src/preview/pages/RunCreatePage.vue:520|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0383|web/src/preview/pages/RunPage.vue:315|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0384|web/src/preview/pages/RunPage.vue:317|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0385|web/src/preview/pages/RunPage.vue:324|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0386|web/src/preview/pages/RunPage.vue:327|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0387|web/src/preview/pages/RunPage.vue:364|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|待整改|
|UX-0388|web/src/preview/pages/RunPage.vue:380|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0389|web/src/preview/pages/RunPage.vue:395|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0390|web/src/preview/pages/RunPage.vue:403|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0391|web/src/preview/pages/RunPage.vue:407|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0392|web/src/preview/pages/RunPage.vue:412|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0393|web/src/preview/pages/RunPage.vue:450|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0394|web/src/preview/pages/RunPage.vue:487|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0395|web/src/preview/pages/RunPage.vue:560|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0396|web/src/preview/pages/RunPage.vue:561|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0397|web/src/preview/pages/RunPage.vue:579|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0398|web/src/preview/pages/RunPage.vue:584|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0399|web/src/preview/pages/RunPage.vue:680|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0400|web/src/preview/pages/RunPage.vue:691|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0401|web/src/preview/pages/RunPage.vue:703|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0402|web/src/preview/pages/RunPage.vue:712|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0403|web/src/preview/pages/RunPage.vue:729|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0404|web/src/preview/pages/RunPage.vue:734|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0405|web/src/preview/pages/RunPage.vue:313|A3|A-FORM|P1|必填/可选及高级分区需要收敛|非缺陷：人工核实为报告六个并列筛选控件，不是需填写的创建表单；不应按字段数量强行折叠。筛选保留，D 类另行核对一致性。|
|UX-0406|web/src/preview/pages/RunPage.vue:379|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0407|web/src/preview/pages/RunPage.vue:380|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0408|web/src/preview/pages/RunPage.vue:411|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0409|web/src/preview/pages/RunPage.vue:412|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0410|web/src/preview/pages/RunPage.vue:572|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0411|web/src/preview/pages/RunPage.vue:605|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0412|web/src/preview/pages/RunsPage.vue:168|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0413|web/src/preview/pages/RunsPage.vue:169|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0414|web/src/preview/pages/RunsPage.vue:176|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0415|web/src/preview/pages/RunsPage.vue:204|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0416|web/src/preview/pages/RunsPage.vue:210|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0417|web/src/preview/pages/RunsPage.vue:212|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0418|web/src/preview/pages/RunsPage.vue:219|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0419|web/src/preview/pages/TargetsPage.vue:66|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0420|web/src/preview/pages/TargetsPage.vue:81|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0421|web/src/preview/pages/TargetsPage.vue:135|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0422|web/src/preview/pages/TargetsPage.vue:155|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0423|web/src/preview/pages/TargetsPage.vue:180|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0424|web/src/preview/pages/TargetsPage.vue:184|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0425|web/src/preview/pages/TargetsPage.vue:190|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0426|web/src/preview/pages/TargetsPage.vue:207|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0427|web/src/preview/pages/TargetsPage.vue:210|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0428|web/src/preview/pages/TargetsPage.vue:216|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0429|web/src/preview/PreviewWorkspace.vue:25|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|待整改|
|UX-0430|web/src/preview/PreviewWorkspace.vue:25|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0431|web/src/preview/seed.ts:319|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0432|web/src/preview/seed.ts:331|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0433|web/src/preview/seed.ts:431|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0434|web/src/preview/types.ts:88|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0435|web/src/preview/types.ts:99|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0436|web/src/preview/types.ts:120|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0437|web/src/preview/types.ts:169|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0438|web/src/preview/types.ts:244|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0439|web/src/preview/components/PrepDatasetPrepare.vue:1|需求变更(已拍板)|RC-GENERATION|P1|自动生成本轮延后；隐藏入口及向导，场景A改手工/导入|已验证：自动生成入口撤下，旧链接降级手工创建；源向导保留为后续范围。手工多轮发布 v1、旧入口降级在桌面/手机通过。|
|UX-0440|web/src/App.vue:1|D1/D3|D-SYSTEM|P1|全局ConfigProvider、状态对比度/键盘/减弱动效统一核验|待整改|
|UX-0441|docs/web/productization/usability-page-checklist.md:1|F1/F2/F3|F-PAGES|P1|25页面的19项检查和场景A–G走查|待整改|
|UX-0442|web/src/pages/CaseResultPage.vue:169|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0443|web/src/pages/CaseResultPage.vue:173|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0444|web/src/pages/CaseResultPage.vue:177|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0445|web/src/pages/CaseResultPage.vue:182|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0446|web/src/pages/CaseResultPage.vue:285|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0447|web/src/pages/CaseResultPage.vue:290|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0448|web/src/pages/CaseResultPage.vue:330|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0449|web/src/pages/CaseResultPage.vue:337|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0450|web/src/pages/CaseResultPage.vue:271|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0451|web/src/preview/pages/TargetsPage.vue:137|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0452|web/src/preview/pages/TargetsPage.vue:166|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0453|web/src/preview/pages/TargetsPage.vue:139|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0454|web/src/preview/pages/TargetsPage.vue:168|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0455|web/src/preview/pages/CasePage.vue:432|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0456|web/src/preview/pages/CasePage.vue:514|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0457|web/src/preview/components/AnalysisStatic.vue:214|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0458|web/src/preview/components/PrepTrial.vue:63|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0459|web/src/preview/components/PrepJsonImport.vue:163|A1/A4|A-INPUT|P1|人工补查：展示辅助函数或多行模板中的原始结构未被首轮扫描捕获|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0460|web/src/preview/components/PrepEvaluation.ts:62|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0461|web/src/preview/components/PrepEvaluation.ts:64|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0462|web/src/preview/components/PrepEvaluation.ts:75|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0463|web/src/preview/components/PrepEvaluation.ts:78|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0464|web/src/preview/components/PrepEvaluation.ts:80|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0465|web/src/preview/components/PrepEvaluation.ts:83|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0466|web/src/preview/components/PrepEvaluation.ts:86|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0467|web/src/preview/components/PrepEvaluation.ts:88|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0468|web/src/preview/components/PrepEvaluation.ts:89|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0469|web/src/preview/components/PrepEvaluation.ts:91|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0470|web/src/preview/components/PrepEvaluation.ts:94|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0471|web/src/preview/components/PrepEvaluation.ts:99|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0472|web/src/preview/components/PrepEvaluation.ts:101|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0473|web/src/preview/components/PrepEvaluation.ts:103|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0474|web/src/preview/components/PrepEvaluation.ts:106|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0475|web/src/preview/components/PrepEvaluation.ts:115|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0476|web/src/preview/components/PrepEvaluation.ts:145|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0477|web/src/preview/components/PrepEvaluation.ts:310|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0478|web/src/preview/components/PrepEvaluation.ts:332|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0479|web/src/preview/components/PrepEvaluation.ts:340|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0480|web/src/preview/components/PrepCases.ts:30|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0481|web/src/preview/components/PrepCases.ts:32|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0482|web/src/preview/components/PrepJsonImport.vue:85|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0483|web/src/preview/components/PrepJsonImport.vue:106|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0484|web/src/preview/components/PrepJsonImport.vue:111|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0485|web/src/preview/pages/ResourcesPage.vue:123|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0486|web/src/preview/pages/ResourcesPage.vue:251|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0487|web/src/preview/pages/AnalysisPage.vue:278|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0488|web/src/preview/pages/ComparisonPage.vue:443|G1/I3|G-COPY|P2|补查：校验或状态文案暴露字段结构、实现细节，缺少用户任务语言。|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|

## 当前 assumptions 与联合工作项

- AS-01：不适用/执行错误保持无分数，不将待复核计作已人工复核；真实判定只使用服务返回。
- AS-02：预约按最早入队时间；私有凭据不占公共队列但可等待执行容量；仅在Mock里演示缺失接口。
- AS-03：合并结果仍保存并发布真实测评集版本，不新增临时领域契约。
- AS-04：真实应用未提供角色身份接口；不得从localStorage伪造管理员权限。管理写操作默认隐藏，现有测评业务操作按现有合同保留。
- AS-05：旧的保存视图/快捷键/三范围批量选择等不实现。已有报告/用例全页深链只作可选大空间入口。
- J-01：评估器目录已变更，须适配新摘要与精确版本读取；真实管理/试评是否可用按实际已有HTTP边界。
- J-02：外部执行、资源凭据、调度恢复、分析回写等需各页核对实际路由与降级，不以Mock代替。

## 复用与改动保护

复用当前Vue/Element Plus/router/tokens与既有API边界。goal/p1-demo的单体App仅保留输入/结果行为参照；integration/p1-new的轻根组件/路由布局思想已在本分支落地；不复制旧snapshot合同、不增兼容层或并行前端。原始源码、状态与截图存任务产物 usability-goal/baseline。AGENTS.md、原始规则与其他未认领文档修改保留在工作树，不纳入模式提交。
