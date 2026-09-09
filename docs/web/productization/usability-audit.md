# A–I 全站可用性整改台账 WEB-UX-GOAL-001

> 由 usability-audit.json 生成；运行 node web/scripts/update-usability-ledger.mjs，禁止手工编辑此文件。

冻结539条实例已收口，待整改0；PL-01～06经F集中修复验证。31条既有产品需求的真实接入工作项单独列出，不扩张冻结审计。JSON为唯一编辑源，MD只由脚本生成。

## 授权与已拍板变更

- 用户显式 Goal：逐模式设计、实施、验证与本地提交，无逐文件确认；不 push/PR/合并，不联系旧评审任务。

- RC-01：货币成本全部移除，改为输入/输出/总 Token 与耗时；历史文档未决项由本决定覆盖。

- RC-02：自动生成测评集本轮延后；只保留手工/导入，场景 A 第2步按新口径。

- 真实页面只连接真实 API；缺口登记联合工作项并做用户侧降级。

- RC-03：2026-09-09 起冻结539条；按文件批量收口；JSON唯一台账源；类内定向、类末一次完整回归；F只报例外并采集最终对照截图。

## 模式统计

冻结 539 条；当前剩余 0 条。新发现进入 parking lot，F 集中处理。

|模式类|实例数|剩余|
|---|---|---|
|B-META|214|0|
|G-COPY|50|0|
|D-CONTROL|41|0|
|G-EMPTY|57|0|
|A-INPUT|33|0|
|A-FORM|6|0|
|I-FEEDBACK|25|0|
|RC-TOKEN|56|0|
|H-TERMS|12|0|
|C-CONTEXT|41|0|
|E-ROLE|1|0|
|RC-GENERATION|1|0|
|D-SYSTEM|1|0|
|F-PAGES|1|0|

## 缺陷明细

|ID|文件:原始行|规则|模式类|严重度|问题|状态与证据|
|---|---|---|---|---|---|---|
|UX-0001|web/src/components/AppSidebar.vue:81|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0002|web/src/components/AppSidebar.vue:81|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0003|web/src/components/dataset/CaseEditor.vue:78|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0004|web/src/components/dataset/CaseEditor.vue:85|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0005|web/src/components/dataset/CaseEditor.vue:138|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0006|web/src/components/dataset/CaseEditor.vue:144|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0007|web/src/components/dataset/CaseEditor.vue:156|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0008|web/src/components/dataset/CaseEditor.vue:161|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0009|web/src/components/dataset/CaseEditor.vue:68|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0010|web/src/components/dataset/CaseTable.vue:44|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0011|web/src/components/dataset/CaseTable.vue:67|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0012|web/src/components/dataset/CaseTable.vue:68|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0013|web/src/components/dataset/CaseTable.vue:71|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0014|web/src/components/dataset/CaseTable.vue:76|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0015|web/src/components/dataset/CaseTable.vue:84|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0016|web/src/components/dataset/CaseTable.vue:90|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0017|web/src/components/dataset/CaseTable.vue:91|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0018|web/src/components/dataset/CaseTable.vue:91|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0019|web/src/components/dataset/CaseTable.vue:94|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0020|web/src/components/dataset/DatasetList.vue:38|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0021|web/src/components/dataset/DatasetList.vue:59|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0022|web/src/components/dataset/DatasetList.vue:60|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0023|web/src/components/dataset/DatasetList.vue:64|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0024|web/src/components/dataset/DatasetList.vue:67|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0025|web/src/components/dataset/DatasetList.vue:69|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0026|web/src/components/dataset/ExpectationEditor.vue:88|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0027|web/src/components/dataset/ExpectationEditor.vue:101|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0028|web/src/components/dataset/ExpectationEditor.vue:106|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0029|web/src/components/dataset/ExpectationEditor.vue:131|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0030|web/src/components/dataset/ExpectationEditor.vue:146|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0031|web/src/components/dataset/VersionSelector.vue:37|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0032|web/src/components/dataset/VersionSelector.vue:40|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0033|web/src/components/dataset/VersionSelector.vue:43|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0034|web/src/components/dataset/VersionSelector.vue:49|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0035|web/src/components/dataset/VersionSelector.vue:59|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0036|web/src/components/dataset/VersionSelector.vue:65|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0037|web/src/layouts/AppLayout.vue:128|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0038|web/src/pages/CaseResultPage.vue:117|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0039|web/src/pages/CaseResultPage.vue:118|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0040|web/src/pages/CaseResultPage.vue:139|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0041|web/src/pages/CaseResultPage.vue:172|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0042|web/src/pages/CaseResultPage.vue:195|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0043|web/src/pages/CaseResultPage.vue:223|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0044|web/src/pages/CaseResultPage.vue:234|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0045|web/src/pages/CaseResultPage.vue:249|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0046|web/src/pages/CaseResultPage.vue:263|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0047|web/src/pages/CaseResultPage.vue:267|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0048|web/src/pages/CaseResultPage.vue:301|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0049|web/src/pages/CaseResultPage.vue:303|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0050|web/src/pages/CaseResultPage.vue:309|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0051|web/src/pages/CaseResultPage.vue:327|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0052|web/src/pages/CaseResultPage.vue:328|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0053|web/src/pages/CaseResultPage.vue:332|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0054|web/src/pages/CaseResultPage.vue:263|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0055|web/src/pages/DatasetWorkspace.vue:542|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0056|web/src/pages/DatasetWorkspace.vue:576|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0057|web/src/pages/DatasetWorkspace.vue:612|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0058|web/src/pages/DatasetWorkspace.vue:618|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0059|web/src/pages/DatasetWorkspace.vue:646|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0060|web/src/pages/DatasetWorkspace.vue:675|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|非缺陷：仅为导入按钮触发的隐藏文件选择机制（display:none），不是可见原生表单；真实JSON/Excel导入回归通过。|
|UX-0061|web/src/pages/EvaluatorWorkspacePage.vue:42|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0062|web/src/pages/EvaluatorWorkspacePage.vue:42|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0063|web/src/pages/EvaluatorWorkspacePage.vue:43|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0064|web/src/pages/EvaluatorWorkspacePage.vue:45|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0065|web/src/pages/EvaluatorWorkspacePage.vue:50|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0066|web/src/pages/EvaluatorWorkspacePage.vue:57|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0067|web/src/pages/EvaluatorWorkspacePage.vue:60|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0068|web/src/pages/EvaluatorWorkspacePage.vue:69|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0069|web/src/pages/EvaluatorWorkspacePage.vue:71|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0070|web/src/pages/EvaluatorWorkspacePage.vue:85|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0071|web/src/pages/EvaluatorWorkspacePage.vue:88|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0072|web/src/pages/EvaluatorWorkspacePage.vue:89|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0073|web/src/pages/LineagePage.vue:190|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0074|web/src/pages/LineagePage.vue:207|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0075|web/src/pages/LineagePage.vue:216|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0076|web/src/pages/LineagePage.vue:220|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0077|web/src/pages/LineagePage.vue:228|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0078|web/src/pages/LineagePage.vue:239|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0079|web/src/pages/LineagePage.vue:270|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0080|web/src/pages/LineagePage.vue:277|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0081|web/src/pages/LineagePage.vue:323|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0082|web/src/pages/OverviewPage.vue:49|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0083|web/src/pages/OverviewPage.vue:58|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0084|web/src/pages/OverviewPage.vue:100|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0085|web/src/pages/OverviewPage.vue:101|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0086|web/src/pages/OverviewPage.vue:124|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0087|web/src/pages/OverviewPage.vue:141|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0088|web/src/pages/OverviewPage.vue:141|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0089|web/src/pages/RunComparisonPage.vue:224|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0090|web/src/pages/RunComparisonPage.vue:235|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0091|web/src/pages/RunComparisonPage.vue:263|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0092|web/src/pages/RunComparisonPage.vue:297|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0093|web/src/pages/RunComparisonPage.vue:301|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0094|web/src/pages/RunComparisonPage.vue:318|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0095|web/src/pages/RunComparisonPage.vue:328|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0096|web/src/pages/RunComparisonPage.vue:402|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0097|web/src/pages/RunComparisonPage.vue:410|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0098|web/src/pages/RunComparisonPage.vue:439|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0099|web/src/pages/RunComparisonPage.vue:450|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0100|web/src/pages/RunComparisonPage.vue:460|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0101|web/src/pages/RunComparisonPage.vue:463|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0102|web/src/pages/RunComparisonPage.vue:470|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0103|web/src/pages/RunCreatePage.vue:202|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0104|web/src/pages/RunCreatePage.vue:204|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0105|web/src/pages/RunCreatePage.vue:213|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0106|web/src/pages/RunCreatePage.vue:216|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0107|web/src/pages/RunCreatePage.vue:220|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0108|web/src/pages/RunCreatePage.vue:227|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0109|web/src/pages/RunCreatePage.vue:237|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0110|web/src/pages/RunCreatePage.vue:270|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|非缺陷；批次 I-01|
|UX-0111|web/src/pages/RunCreatePage.vue:292|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0112|web/src/pages/RunCreatePage.vue:295|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0113|web/src/pages/RunCreatePage.vue:296|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0114|web/src/pages/RunCreatePage.vue:308|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0115|web/src/pages/RunCreatePage.vue:316|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0116|web/src/pages/RunCreatePage.vue:325|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0117|web/src/pages/RunCreatePage.vue:308|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0118|web/src/pages/RunDetailPage.vue:141|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0119|web/src/pages/RunDetailPage.vue:187|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0120|web/src/pages/RunDetailPage.vue:221|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0121|web/src/pages/RunDetailPage.vue:224|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0122|web/src/pages/RunDetailPage.vue:239|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0123|web/src/pages/RunDetailPage.vue:268|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0124|web/src/pages/RunDetailPage.vue:323|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0125|web/src/pages/RunDetailPage.vue:329|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0126|web/src/pages/RunDetailPage.vue:336|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0127|web/src/pages/RunDetailPage.vue:343|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0128|web/src/pages/RunDetailPage.vue:370|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0129|web/src/pages/RunDetailPage.vue:387|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0130|web/src/pages/RunDetailPage.vue:426|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0131|web/src/pages/RunDetailPage.vue:423|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0132|web/src/pages/RunListPage.vue:104|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0133|web/src/pages/RunListPage.vue:109|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0134|web/src/pages/RunListPage.vue:116|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0135|web/src/pages/RunListPage.vue:121|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0136|web/src/pages/RunListPage.vue:122|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0137|web/src/pages/RunListPage.vue:130|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0138|web/src/pages/RunListPage.vue:147|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0139|web/src/pages/RunWorkspacePage.vue:125|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0140|web/src/pages/RunWorkspacePage.vue:132|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0141|web/src/pages/RunWorkspacePage.vue:139|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0142|web/src/pages/RunWorkspacePage.vue:146|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0143|web/src/pages/RunWorkspacePage.vue:177|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0144|web/src/pages/TargetListPage.vue:34|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0145|web/src/pages/TargetListPage.vue:40|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0146|web/src/preview/comparison.ts:22|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0147|web/src/preview/comparison.ts:123|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0148|web/src/preview/comparison.ts:124|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0149|web/src/preview/comparison.ts:228|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0150|web/src/preview/comparison.ts:263|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0151|web/src/preview/comparison.ts:272|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0152|web/src/preview/comparison.ts:399|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0153|web/src/preview/comparison.ts:442|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0154|web/src/preview/comparison.ts:443|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0155|web/src/preview/components/AnalysisStatic.vue:89|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0156|web/src/preview/components/AnalysisStatic.vue:128|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0157|web/src/preview/components/AnalysisStatic.vue:129|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0158|web/src/preview/components/AnalysisStatic.vue:136|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0159|web/src/preview/components/AnalysisStatic.vue:169|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0160|web/src/preview/components/AnalysisStatic.vue:177|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0161|web/src/preview/components/AnalysisStatic.vue:179|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0162|web/src/preview/components/AnalysisStatic.vue:182|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0163|web/src/preview/components/AnalysisStatic.vue:182|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0164|web/src/preview/components/AnalysisSuggestion.vue:296|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0165|web/src/preview/components/AnalysisSuggestion.vue:305|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0166|web/src/preview/components/AnalysisSuggestion.vue:310|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0167|web/src/preview/components/AnalysisSuggestion.vue:317|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0168|web/src/preview/components/AnalysisSuggestion.vue:320|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0169|web/src/preview/components/AnalysisSuggestion.vue:372|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0170|web/src/preview/components/AnalysisSuggestion.vue:385|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0171|web/src/preview/components/AnalysisSuggestion.vue:396|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0172|web/src/preview/components/AnalysisSuggestion.vue:410|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0173|web/src/preview/components/AnalysisSuggestion.vue:415|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0174|web/src/preview/components/AnalysisSuggestion.vue:421|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0175|web/src/preview/components/AnalysisSuggestion.vue:395|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0176|web/src/preview/components/AnalysisSuggestion.vue:396|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0177|web/src/preview/components/CompareCreate.vue:265|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0178|web/src/preview/components/CompareCreate.vue:276|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0179|web/src/preview/components/CompareCreate.vue:284|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0180|web/src/preview/components/CompareCreate.vue:328|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0181|web/src/preview/components/CompareCreate.vue:392|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0182|web/src/preview/components/CompareCreate.vue:415|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0183|web/src/preview/components/CompareCreate.vue:436|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0184|web/src/preview/components/CompareCreate.vue:456|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0185|web/src/preview/components/CompareCreate.vue:240|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0186|web/src/preview/components/CompareCreate.vue:42|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0187|web/src/preview/components/CompareCreate.vue:362|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0188|web/src/preview/components/CompareCreate.vue:373|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0189|web/src/preview/components/CompareCreate.vue:405|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0190|web/src/preview/components/CompareCreate.vue:406|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0191|web/src/preview/components/CompareEvidence.vue:12|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0192|web/src/preview/components/CompareEvidence.vue:15|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0193|web/src/preview/components/CompareEvidence.vue:21|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0194|web/src/preview/components/CompareEvidence.vue:24|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0195|web/src/preview/components/CompareEvidence.vue:31|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0196|web/src/preview/components/CompareEvidence.vue:32|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0197|web/src/preview/components/CompareEvidence.vue:36|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0198|web/src/preview/components/CompareEvidence.vue:45|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0199|web/src/preview/components/CompareEvidence.vue:32|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0200|web/src/preview/components/CompareLineage.vue:54|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0201|web/src/preview/components/CompareLineage.vue:79|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0202|web/src/preview/components/CompareLineage.vue:83|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0203|web/src/preview/components/CompareLineage.vue:86|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0204|web/src/preview/components/ComparePreflight.vue:96|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0205|web/src/preview/components/ComparePreflight.vue:31|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0206|web/src/preview/components/ComparePreflight.vue:37|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0207|web/src/preview/components/PrepCaseEditor.vue:152|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0208|web/src/preview/components/PrepCaseEditor.vue:157|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0209|web/src/preview/components/PrepCaseEditor.vue:162|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0210|web/src/preview/components/PrepCaseEditor.vue:164|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0211|web/src/preview/components/PrepCaseEditor.vue:168|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0212|web/src/preview/components/PrepCaseEditor.vue:184|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0213|web/src/preview/components/PrepCaseEditor.vue:186|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0214|web/src/preview/components/PrepCaseEditor.vue:192|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0215|web/src/preview/components/PrepCaseEditor.vue:204|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0216|web/src/preview/components/PrepCaseEditor.vue:228|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0217|web/src/preview/components/PrepCaseEditor.vue:129|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0218|web/src/preview/components/PrepDatasetPrepare.vue:529|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0219|web/src/preview/components/PrepDatasetPrepare.vue:552|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|后续范围：自动生成向导在本轮隐藏；旧链接进入手工创建。用户已拍板延后，本轮不整改隐藏的生成说明。|
|UX-0220|web/src/preview/components/PrepDatasetPrepare.vue:559|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|后续范围：用户已拍板延后自动生成；入口隐藏，旧链接只展示手工创建。preparation.spec.ts 桌面/手机验证通过。|
|UX-0221|web/src/preview/components/PrepDatasetPrepare.vue:561|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|后续范围：用户已拍板延后自动生成；入口隐藏，旧链接只展示手工创建。preparation.spec.ts 桌面/手机验证通过。|
|UX-0222|web/src/preview/components/PrepDatasetPrepare.vue:614|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0223|web/src/preview/components/PrepDatasetPrepare.vue:621|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0224|web/src/preview/components/PrepDatasetPrepare.vue:622|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0225|web/src/preview/components/PrepDatasetPrepare.vue:660|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0226|web/src/preview/components/PrepEvaluatorEditor.vue:78|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0227|web/src/preview/components/PrepEvaluatorEditor.vue:107|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0228|web/src/preview/components/PrepEvaluatorEditor.vue:142|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0229|web/src/preview/components/PrepEvaluatorEditor.vue:153|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0230|web/src/preview/components/PrepEvaluatorEditor.vue:56|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0231|web/src/preview/components/PrepJsonImport.vue:159|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0232|web/src/preview/components/PrepJsonImport.vue:175|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0233|web/src/preview/components/PrepTrial.vue:56|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0234|web/src/preview/components/PrepTrial.vue:77|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0235|web/src/preview/components/PrepTrial.vue:80|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0236|web/src/preview/components/PrepTrial.vue:86|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0237|web/src/preview/components/PrepTrial.vue:90|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0238|web/src/preview/components/RunProgress.vue:68|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0239|web/src/preview/components/RunProgress.vue:78|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0240|web/src/preview/components/RunProgress.vue:81|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0241|web/src/preview/components/RunSupport.ts:101|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0242|web/src/preview/components/RunSupport.ts:224|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0243|web/src/preview/components/RunSupport.ts:235|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0244|web/src/preview/components/RunSupport.ts:236|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0245|web/src/preview/execution.ts:41|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0246|web/src/preview/execution.ts:138|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0247|web/src/preview/execution.ts:148|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0248|web/src/preview/execution.ts:235|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0249|web/src/preview/execution.ts:256|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0250|web/src/preview/pages/AnalysisPage.vue:253|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0251|web/src/preview/pages/AnalysisPage.vue:256|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0252|web/src/preview/pages/AnalysisPage.vue:257|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0253|web/src/preview/pages/AnalysisPage.vue:263|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0254|web/src/preview/pages/AnalysisPage.vue:267|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0255|web/src/preview/pages/AnalysisPage.vue:291|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0256|web/src/preview/pages/AnalysisPage.vue:292|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0257|web/src/preview/pages/AnalysisPage.vue:300|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0258|web/src/preview/pages/AnalysisPage.vue:311|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0259|web/src/preview/pages/AnalysisPage.vue:341|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0260|web/src/preview/pages/AnalysisPage.vue:355|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0261|web/src/preview/pages/AnalysisPage.vue:356|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0262|web/src/preview/pages/AnalysisPage.vue:375|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0263|web/src/preview/pages/AnalysisPage.vue:395|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0264|web/src/preview/pages/AnalysisPage.vue:396|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0265|web/src/preview/pages/AnalysisPage.vue:406|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0266|web/src/preview/pages/AnalysisPage.vue:425|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0267|web/src/preview/pages/AnalysisPage.vue:434|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0268|web/src/preview/pages/AnalysisPage.vue:435|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0269|web/src/preview/pages/AnalysisPage.vue:388|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：中文子串误命中“生成本次”，不是货币成本。|
|UX-0270|web/src/preview/pages/CasePage.vue:349|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0271|web/src/preview/pages/CasePage.vue:351|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0272|web/src/preview/pages/CasePage.vue:356|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0273|web/src/preview/pages/CasePage.vue:358|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0274|web/src/preview/pages/CasePage.vue:361|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0275|web/src/preview/pages/CasePage.vue:374|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0276|web/src/preview/pages/CasePage.vue:389|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0277|web/src/preview/pages/CasePage.vue:392|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0278|web/src/preview/pages/CasePage.vue:398|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0279|web/src/preview/pages/CasePage.vue:410|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0280|web/src/preview/pages/CasePage.vue:412|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0281|web/src/preview/pages/CasePage.vue:415|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0282|web/src/preview/pages/CasePage.vue:418|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0283|web/src/preview/pages/CasePage.vue:487|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0284|web/src/preview/pages/CasePage.vue:509|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0285|web/src/preview/pages/CasePage.vue:510|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0286|web/src/preview/pages/CasePage.vue:517|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0287|web/src/preview/pages/CasePage.vue:532|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0288|web/src/preview/pages/CasePage.vue:534|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0289|web/src/preview/pages/CasePage.vue:540|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0290|web/src/preview/pages/CasePage.vue:589|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0291|web/src/preview/pages/CasePage.vue:591|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0292|web/src/preview/pages/CasePage.vue:594|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0293|web/src/preview/pages/CasePage.vue:597|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0294|web/src/preview/pages/CasePage.vue:392|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0295|web/src/preview/pages/ComparisonPage.vue:240|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0296|web/src/preview/pages/ComparisonPage.vue:241|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0297|web/src/preview/pages/ComparisonPage.vue:250|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0298|web/src/preview/pages/ComparisonPage.vue:252|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0299|web/src/preview/pages/ComparisonPage.vue:265|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0300|web/src/preview/pages/ComparisonPage.vue:273|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0301|web/src/preview/pages/ComparisonPage.vue:276|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0302|web/src/preview/pages/ComparisonPage.vue:277|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0303|web/src/preview/pages/ComparisonPage.vue:289|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0304|web/src/preview/pages/ComparisonPage.vue:292|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0305|web/src/preview/pages/ComparisonPage.vue:298|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0306|web/src/preview/pages/ComparisonPage.vue:301|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0307|web/src/preview/pages/ComparisonPage.vue:325|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0308|web/src/preview/pages/ComparisonPage.vue:332|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|非缺陷：人工核对为解释比较限制的叙述句，列举输入、评分、资源差异，不是异质元数据值的拼接；中文术语优化随H执行。|
|UX-0309|web/src/preview/pages/ComparisonPage.vue:337|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0310|web/src/preview/pages/ComparisonPage.vue:353|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0311|web/src/preview/pages/ComparisonPage.vue:432|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0312|web/src/preview/pages/ComparisonPage.vue:445|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0313|web/src/preview/pages/ComparisonPage.vue:472|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0314|web/src/preview/pages/ComparisonPage.vue:480|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0315|web/src/preview/pages/ComparisonPage.vue:485|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0316|web/src/preview/pages/ComparisonPage.vue:500|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0317|web/src/preview/pages/ComparisonPage.vue:511|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0318|web/src/preview/pages/ComparisonPage.vue:518|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0319|web/src/preview/pages/ComparisonsPage.vue:82|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0320|web/src/preview/pages/ComparisonsPage.vue:94|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0321|web/src/preview/pages/ComparisonsPage.vue:98|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0322|web/src/preview/pages/ComparisonsPage.vue:102|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0323|web/src/preview/pages/ComparisonsPage.vue:110|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0324|web/src/preview/pages/DatasetsPage.vue:320|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0325|web/src/preview/pages/DatasetsPage.vue:332|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0326|web/src/preview/pages/DatasetsPage.vue:337|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0327|web/src/preview/pages/DatasetsPage.vue:381|C1/C2/C3|C-CONTEXT|P1|工作流下钻应复用抽屉并支持按当前过滤顺序前后查看|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0328|web/src/preview/pages/DatasetsPage.vue:386|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0329|web/src/preview/pages/DatasetsPage.vue:404|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0330|web/src/preview/pages/DatasetsPage.vue:405|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0331|web/src/preview/pages/DatasetsPage.vue:410|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0332|web/src/preview/pages/DatasetsPage.vue:413|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0333|web/src/preview/pages/DatasetsPage.vue:416|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0334|web/src/preview/pages/DatasetsPage.vue:427|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0335|web/src/preview/pages/DatasetsPage.vue:430|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0336|web/src/preview/pages/DatasetsPage.vue:442|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0337|web/src/preview/pages/DatasetsPage.vue:445|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0338|web/src/preview/pages/DatasetsPage.vue:487|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0339|web/src/preview/pages/DatasetsPage.vue:506|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0340|web/src/preview/pages/DatasetsPage.vue:507|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0341|web/src/preview/pages/EvaluatorsPage.vue:257|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0342|web/src/preview/pages/EvaluatorsPage.vue:266|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0343|web/src/preview/pages/EvaluatorsPage.vue:309|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0344|web/src/preview/pages/EvaluatorsPage.vue:313|I1/I2/I3/I4/I5|I-FEEDBACK|P2|危险动作确认、行内错误、操作反馈与可取消性统一检查|已验证；批次 I-01|
|UX-0345|web/src/preview/pages/EvaluatorsPage.vue:357|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0346|web/src/preview/pages/EvaluatorsPage.vue:358|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0347|web/src/preview/pages/EvaluatorsPage.vue:366|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0348|web/src/preview/pages/EvaluatorsPage.vue:367|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0349|web/src/preview/pages/OverviewPage.vue:54|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0350|web/src/preview/pages/OverviewPage.vue:91|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0351|web/src/preview/pages/OverviewPage.vue:96|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0352|web/src/preview/pages/OverviewPage.vue:101|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0353|web/src/preview/pages/OverviewPage.vue:164|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0354|web/src/preview/pages/OverviewPage.vue:167|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0355|web/src/preview/pages/OverviewPage.vue:174|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0356|web/src/preview/pages/OverviewPage.vue:177|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0357|web/src/preview/pages/OverviewPage.vue:19|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0358|web/src/preview/pages/ResourcesPage.vue:212|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0359|web/src/preview/pages/ResourcesPage.vue:220|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0360|web/src/preview/pages/ResourcesPage.vue:103|E1/E2|E-ROLE|P1|普通用户只读摘要，管理入口复用RoleGate|已验证；批次 E-01|
|UX-0361|web/src/preview/pages/ResourcesPage.vue:12|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0362|web/src/preview/pages/ResourcesPage.vue:89|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0363|web/src/preview/pages/RunCreatePage.vue:346|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0364|web/src/preview/pages/RunCreatePage.vue:354|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0365|web/src/preview/pages/RunCreatePage.vue:358|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0366|web/src/preview/pages/RunCreatePage.vue:392|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0367|web/src/preview/pages/RunCreatePage.vue:416|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0368|web/src/preview/pages/RunCreatePage.vue:423|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0369|web/src/preview/pages/RunCreatePage.vue:454|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0370|web/src/preview/pages/RunCreatePage.vue:463|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0371|web/src/preview/pages/RunCreatePage.vue:489|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0372|web/src/preview/pages/RunCreatePage.vue:525|D1/D2/D3|D-CONTROL|P2|统一控件与尺寸、可访问名称和焦点|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0373|web/src/preview/pages/RunCreatePage.vue:542|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0374|web/src/preview/pages/RunCreatePage.vue:543|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0375|web/src/preview/pages/RunCreatePage.vue:546|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0376|web/src/preview/pages/RunCreatePage.vue:296|A3|A-FORM|P1|必填/可选及高级分区需要收敛|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0377|web/src/preview/pages/RunCreatePage.vue:38|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0378|web/src/preview/pages/RunCreatePage.vue:103|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0379|web/src/preview/pages/RunCreatePage.vue:481|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0380|web/src/preview/pages/RunCreatePage.vue:489|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0381|web/src/preview/pages/RunCreatePage.vue:495|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|非缺陷：原始扫描 currency 子串误命中 concurrency（并发数）；并发数是执行参数，不是货币成本，保留。|
|UX-0382|web/src/preview/pages/RunCreatePage.vue:520|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0383|web/src/preview/pages/RunPage.vue:315|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0384|web/src/preview/pages/RunPage.vue:317|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0385|web/src/preview/pages/RunPage.vue:324|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0386|web/src/preview/pages/RunPage.vue:327|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0387|web/src/preview/pages/RunPage.vue:364|H1/H2/H3|H-TERMS|P2|统一业务词汇与状态含义，源码标识不改业务合同|已验证；批次 H-01|
|UX-0388|web/src/preview/pages/RunPage.vue:380|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0389|web/src/preview/pages/RunPage.vue:395|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0390|web/src/preview/pages/RunPage.vue:403|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0391|web/src/preview/pages/RunPage.vue:407|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0392|web/src/preview/pages/RunPage.vue:412|G1/G3/G4|G-COPY|P1|开发/实现说明改为用户任务语言，能力说明集中到能力页|已验证：改为任务文案与结构化校验提示，能力说明集中到能力清单；真实20项、体验72项回归通过。|
|UX-0393|web/src/preview/pages/RunPage.vue:450|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0394|web/src/preview/pages/RunPage.vue:487|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0395|web/src/preview/pages/RunPage.vue:560|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0396|web/src/preview/pages/RunPage.vue:561|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0397|web/src/preview/pages/RunPage.vue:579|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0398|web/src/preview/pages/RunPage.vue:584|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0399|web/src/preview/pages/RunPage.vue:680|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0400|web/src/preview/pages/RunPage.vue:691|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0401|web/src/preview/pages/RunPage.vue:703|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0402|web/src/preview/pages/RunPage.vue:712|A1/A4|A-INPUT|P1|默认输入或证据展示使用原始结构，改为结构化模式并保留高级入口|已验证：复用共享输入/规则/可读展示/高级折叠；typecheck、build、准备流程16项、结构化值4项通过。真实发布修订2项、六类预期保留2项、证据与Judge4项验证通过；阶段截图 checkpoint-a。其他规则的同页缺陷仍分别保留。|
|UX-0403|web/src/preview/pages/RunPage.vue:729|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0404|web/src/preview/pages/RunPage.vue:734|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0405|web/src/preview/pages/RunPage.vue:313|A3|A-FORM|P1|必填/可选及高级分区需要收敛|非缺陷：人工核实为报告六个并列筛选控件，不是需填写的创建表单；不应按字段数量强行折叠。筛选保留，D 类另行核对一致性。|
|UX-0406|web/src/preview/pages/RunPage.vue:379|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0407|web/src/preview/pages/RunPage.vue:380|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0408|web/src/preview/pages/RunPage.vue:411|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0409|web/src/preview/pages/RunPage.vue:412|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0410|web/src/preview/pages/RunPage.vue:572|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0411|web/src/preview/pages/RunPage.vue:605|需求变更(已拍板)|RC-TOKEN|P1|去除货币成本，以Token输入/输出/总量及耗时表达|已验证：货币字段与计算移除，使用 TokenUsage 和 Token 指标；15项对比规则、真实Judge缺失/零值验证通过。Mock格式v2，旧存储保留。|
|UX-0412|web/src/preview/pages/RunsPage.vue:168|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0413|web/src/preview/pages/RunsPage.vue:169|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0414|web/src/preview/pages/RunsPage.vue:176|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0415|web/src/preview/pages/RunsPage.vue:204|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0416|web/src/preview/pages/RunsPage.vue:210|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0417|web/src/preview/pages/RunsPage.vue:212|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0418|web/src/preview/pages/RunsPage.vue:219|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0419|web/src/preview/pages/TargetsPage.vue:66|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
|UX-0420|web/src/preview/pages/TargetsPage.vue:81|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0421|web/src/preview/pages/TargetsPage.vue:135|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0422|web/src/preview/pages/TargetsPage.vue:155|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0423|web/src/preview/pages/TargetsPage.vue:180|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0424|web/src/preview/pages/TargetsPage.vue:184|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0425|web/src/preview/pages/TargetsPage.vue:190|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0426|web/src/preview/pages/TargetsPage.vue:207|G5/I3|G-EMPTY|P2|核对空态说明、可行下一步及统一模式|已验证：改为共享空状态或有上下文引导的状态说明；真实20项、体验72项桌面/手机回归通过。逐页最终走查仍单独执行。|
|UX-0427|web/src/preview/pages/TargetsPage.vue:210|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0428|web/src/preview/pages/TargetsPage.vue:216|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0429|web/src/preview/PreviewWorkspace.vue:25|A2/B1/B2|B-META|P2|实体或异质元数据需带维度标签并统一实体引用|已验证：复用A/G/C已完成的成本移除、用户文案或上下文整改；本轮逐项核对原位置，无旧拼接呈现。默认110/110及补改46/46通过。|
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
|UX-0440|web/src/App.vue:1|D1/D3|D-SYSTEM|P1|全局ConfigProvider、状态对比度/键盘/减弱动效统一核验|已验证：共享ConfigProvider统一40px；可见表单复用Element Plus，移除small覆盖并复用A中已迁移组件。tokens统一浅色底文字、弹层和状态色，键盘/减少动效/控件名称与尺寸已核对。默认114/114及最后悬停色补改4/4通过，24个可达页面默认文字扫描无候选。|
|UX-0441|docs/web/productization/usability-page-checklist.md:1|F1/F2/F3|F-PAGES|P1|25页面的19项检查和场景A–G走查|已验证；批次 F-01|
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
|UX-0489|web/src/pages/CaseResultPage.vue:144|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0490|web/src/pages/CaseResultPage.vue:208|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0491|web/src/pages/DatasetWorkspace.vue:659|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0492|web/src/pages/EvaluatorWorkspacePage.vue:77|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0493|web/src/pages/RunComparisonPage.vue:441|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0494|web/src/pages/RunComparisonPage.vue:452|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0495|web/src/pages/RunDetailPage.vue:156|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0496|web/src/pages/RunDetailPage.vue:169|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0497|web/src/preview/components/AnalysisStatic.vue:159|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0498|web/src/preview/components/CompareLineage.vue:47|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0499|web/src/preview/components/CompareLineage.vue:55|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0500|web/src/preview/components/CompareLineage.vue:64|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0501|web/src/preview/components/PrepEvaluatorEditor.vue:138|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0502|web/src/preview/pages/CasePage.vue:481|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0503|web/src/preview/pages/DatasetsPage.vue:334|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0504|web/src/preview/pages/DatasetsPage.vue:493|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0505|web/src/preview/pages/DatasetsPage.vue:512|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0506|web/src/preview/pages/EvaluatorsPage.vue:322|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0507|web/src/preview/pages/EvaluatorsPage.vue:362|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0508|web/src/preview/pages/EvaluatorsPage.vue:370|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0509|web/src/preview/pages/RunPage.vue:578|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0510|web/src/preview/pages/RunPage.vue:603|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0511|web/src/preview/pages/RunPage.vue:644|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0512|web/src/preview/pages/RunPage.vue:656|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0513|web/src/preview/pages/RunPage.vue:668|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0514|web/src/preview/pages/TargetsPage.vue:149|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0515|web/src/preview/pages/TargetsPage.vue:184|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0516|web/src/preview/pages/TargetsPage.vue:212|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0517|web/src/preview/pages/TargetsPage.vue:219|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：复用 DetailDrawer、DetailNavigation 与共享引用入口；当前同类筛选顺序切换，父页面保留，关闭/切换保护未保存输入；独立深链返回恢复来源与选择。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0518|web/src/preview/pages/CasePage.vue:71|C3/I5|C-CONTEXT|P1|补查：证据全页的返回固定指向报告，丢失分析或对比来源。|已验证：使用校验后的来源路径返回，外部地址退回原报告；context.spec.ts 来源返回测试桌面/手机2项通过。|
|UX-0519|web/src/router/index.ts:4|C3/I5|C-CONTEXT|P1|补查：点击返回链接按新导航回到顶部，异步报告恢复时丢失阅读位置。|已验证：会话内保留最近50个路径滚动位置，等待异步内容撑开页面再恢复；用户滚动或新导航中断恢复。context.spec.ts 滚动返回桌面/手机2项通过。|
|UX-0520|web/src/pages/LineagePage.vue:281|C1/C2/C3|C-CONTEXT|P1|补查：版本或证据下钻以整页导航为默认，父列表/报告与当前顺序不能保留。|已验证：DatasetVersionLink 在关联抽屉中只读展示真实精确版本，复用 CaseEditor；单用例边界、焦点及父报告保持通过。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0521|web/src/pages/RunCreatePage.vue:184|C3/I5|C-CONTEXT|P1|补查：从资产或历史报告进入创建任务后，返回入口固定去任务列表，未保留实际来源。|已验证：共享 TaskBackLink 恢复站内来源；创建/编辑沿用前端草稿，保留对象、评分标准、版本、用例及列表视图。真实与体验往返测试通过。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0522|web/src/preview/pages/RunCreatePage.vue:299|C3/I5|C-CONTEXT|P1|补查：体验创建任务的返回固定去任务列表，未表达原资产或报告来源。|已验证：共享 TaskBackLink 恢复站内来源；创建/编辑沿用前端草稿，保留对象、评分标准、版本、用例及列表视图。真实与体验往返测试通过。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0523|web/src/pages/DatasetWorkspace.vue:59|C3/I5|C-CONTEXT|P1|补查：测评集工作区进入创建任务时未携带当前用例位置；创建页编辑往返的用户配置保留仍需补齐。|已验证：共享 TaskBackLink 恢复站内来源；创建/编辑沿用前端草稿，保留对象、评分标准、版本、用例及列表视图。真实与体验往返测试通过。 C类 typecheck/build、默认108项桌面/手机E2E通过；最终逐页与场景验收另行执行。|
|UX-0524|web/src/preview/components/ComparePreflight.vue:19|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0525|web/src/preview/components/ComparePreflight.vue:21|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0526|web/src/preview/components/ComparePreflight.vue:24|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0527|web/src/preview/components/ComparePreflight.vue:33|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0528|web/src/preview/components/ComparePreflight.vue:39|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0529|web/src/preview/components/ComparePreflight.vue:44|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0530|web/src/preview/components/PrepLineage.vue:17|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0531|web/src/preview/components/PrepLineage.vue:22|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0532|web/src/preview/components/PrepLineage.vue:26|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0533|web/src/preview/components/PrepDatasetPrepare.vue:79|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0534|web/src/preview/components/PrepEvaluatorEditor.vue:22|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0535|web/src/preview/pages/ResourcesPage.vue:137|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0536|web/src/preview/pages/ComparisonPage.vue:368|A2/B1/B2|B-META|P2|B类残留复查新增：实体与异质信息需共享组件和维度标签|已验证：实体复用EntityRef按类型/名称/版本呈现，内部编号按需展开；异质属性复用MetadataGroup分维度标注，标题/数量改为有标签的语义表达。核对原实例对应代码，默认110/110及补改46/46通过。|
|UX-0537|web/src/preview/components/PrepLineage.vue:34|C1/C2/C3|C-CONTEXT|P2|来源测评集与对象应保留父页面并显示固定版本|已验证：PrepLineage复用EntityLink/DetailDrawer保留固定来源版本、父页和同类切换；新增桌面/手机2项通过并纳入110/110完整回归。|
|UX-0538|web/src/pages/RunDetailPage.vue:169|B4|B-META|P1|结论优先、固定输入按需展开，减少首屏重复信息|已验证：报告结论优先，对象与固定输入按需展开；真实报告桌面/手机截图已查看，补改46/46通过。|
|UX-0539|web/src/preview/pages/RunPage.vue:335|B4|B-META|P1|结论优先、固定输入按需展开，减少首屏重复信息|已验证：报告结论优先，对象与固定输入按需展开；真实报告桌面/手机截图已查看，补改46/46通过。|

## 批量收口记录

|批次|模式类|提交|文件|处理与验证|
|---|---|---|---|---|
|E-01|E-ROLE|d6dc813|web/src/preview/pages/ResourcesPage.vue|复用RoleGate按角色显示管理操作，普通用户只读资源状态；未知身份不放行；异步操作完成前重新核对角色。真实应用没有Mock权限入口。 typecheck/build通过；默认完整回归116/116（10.2分钟），含桌面/手机角色切换。|
|H-01|H-TERMS|de2e33d|web/src/pages/EvaluatorWorkspacePage.vue、web/src/pages/OverviewPage.vue、web/src/preview/components/AnalysisStatic.vue、web/src/preview/components/CompareLineage.vue、web/src/preview/pages/CasePage.vue、web/src/preview/pages/RunPage.vue|人工复核选择、最新结论和历史记录复用RunSupport集中词表；概览与来源统一测评任务；沿用A/G已完成的业务表述；人工汇总改用中文且保留原证据。 人工复核定向2/2、typecheck/build及完整116/116（8.5分钟）通过；按冻结文件核对旧称谓均已清除。|
|I-01|I-FEEDBACK|c0a4f77|web/src/components/dataset/CaseTable.vue、web/src/components/dataset/VersionSelector.vue、web/src/pages/CaseResultPage.vue、web/src/pages/EvaluatorWorkspacePage.vue、web/src/pages/LineagePage.vue、web/src/pages/OverviewPage.vue、web/src/pages/RunComparisonPage.vue、web/src/pages/RunCreatePage.vue、web/src/pages/RunDetailPage.vue、web/src/pages/RunListPage.vue、web/src/pages/TargetListPage.vue、web/src/preview/components/AnalysisSuggestion.vue、web/src/preview/components/CompareCreate.vue、web/src/preview/components/PrepCaseEditor.vue、web/src/preview/components/PrepDatasetPrepare.vue、web/src/preview/components/PrepEvaluatorEditor.vue、web/src/preview/components/PrepTrial.vue、web/src/preview/pages/ComparisonPage.vue、web/src/preview/pages/DatasetsPage.vue、web/src/preview/pages/EvaluatorsPage.vue|复用ElMessageBox/ElPopconfirm保护发布及移除；确认说明影响，取消保留输入，提交后有反馈。既有输入错误、服务错误复用InlineError/StatusNotice并保留数据和恢复入口；UX-0110为可恢复选择清空，核实非缺陷。 定向18/18、typecheck/build及完整116/116（10.1分钟）通过，涵盖发布取消、移除取消/确认、六类预期保留与历史报告不变。|
|F-01|F-PAGES + parking lot A/B/D/G/H/I|4e23e36|web/src/preview/pages/ResourcesPage.vue、web/src/resultLabels.ts、web/src/preview/pages/AnalysisPage.vue、web/src/preview/pages/CasePage.vue、web/src/preview/pages/RunPage.vue、web/src/components/ValueView.vue、web/src/components/dataset/CaseEditor.vue、web/src/pages/RunDetailPage.vue、web/src/pages/RunCreatePage.vue、web/src/data/capabilities.ts、web/src/styles/base.css、web/src/preview/components/AnalysisSuggestion.vue、web/src/pages/CaseResultPage.vue、docs/web/productization/usability-page-checklist.md|按文件集中关闭PL-01～06：复用实体/元数据资源摘要、共享结果词/业务显示、真实轮次确认、报告首屏对象、面向用户的创建说明与正确能力状态、主题标签对比度；补动态选择可访问名称和固定技能名称。完成25源页面/24可达页的规则与A–G例外核查，31条真实接入项明确降级；最终图含P10可信基线补拍。详见usability-final-report.md。 F定向8/8、共享对比度/键盘/弹层2/2；冻结后typecheck/build及完整116/116（10.5分钟）通过。最终24页对比度候选0/整页溢出0，10张最终图已审阅；D导出/历史回溯实走。JSON只读生成幂等与冻结拒写验证通过。|

## Parking lot（F 处理）

|编号|位置|问题|状态|处理|
|---|---|---|---|---|
|PL-01|web/src/preview/pages/ResourcesPage.vue|手机端普通用户需要横向滚动表格才能看到资源状态；F改用现有EntityRef/MetadataGroup摘要。|已验证|批次 F-01|
|PL-02|web/src/resultLabels.ts; web/src/preview/pages/AnalysisPage.vue; web/src/preview/pages/CasePage.vue; web/src/preview/pages/RunPage.vue; web/src/components/ValueView.vue|现有H台账之外仍有结果词/无分数表达差异，以及Case、Trace和业务状态英文显示；F按候选词表集中核对，保留外部原文及契约字段。|已验证|批次 F-01|
|PL-03|web/src/components/dataset/CaseEditor.vue|真实用例编辑移除轮次也需确认，属于冻结后发现的I同类实例。|已验证|批次 F-01|
|PL-04|web/src/pages/RunDetailPage.vue|报告默认标题为通用测评报告，对象身份在折叠区；F检查首屏能否辨识所评对象。|已验证|批次 F-01|
|PL-05|web/src/pages/RunCreatePage.vue; web/src/data/capabilities.ts|F视觉/能力走查发现创建页演示接入文案和能力清单将已有版本API列缺失；改为用户接入条件，并按当前服务路由区分已有API与Web联合接入。|已验证|批次 F-01|
|PL-06|web/src/styles/base.css|F扫描发现能力页33个标签在组件CSS按需加载后回到浅色文字，根因为主题覆盖选择器低于Element Plus；提高共享样式优先级，沿用既有语义tokens。|已验证|批次 F-01|

## 前后端联合工作项（F 接入快照）

|编号/需求|用户故事/场景|当前能力与缺口|用户影响与降级|接口方向与验收|
|---|---|---|---|---|
|JW-FR-5.1 Agent / Skill 与多种执行形态；前后端联合工作项|US-01.1～01.3、05.1～05.2；A1、B4–5、D1|已有：HTTP 目录仍为内置 LoanAgent 两版本；内部已有固定 TargetDescriptor 存储/解析和版本内容指纹，不能据此宣称通用目录已开放。 缺口：外部对象目录、授权版本快照和云虾/单智能体/工作流/Skill 执行适配。|开发者无法选择实际业务对象验证，只能运行内置样例。 降级：真实对象仅展示可执行的内置版本；对象/创建页给接入要求入口。静态分析服务已有，外部目录、定义授权及真实Web接入未就绪时隐藏入口。|拟议方向（非已实现合同）：GET /api/targets；GET /api/targets/{id}/versions/{version}；字段：target_type、form、executable、capabilities、snapshot。 验收：授权目录、失效版本、固定快照与四类对象真实执行均通过。|
|JW-FR-5.2 组合 Skill 测评集；前后端联合工作项|US-05.9～05.10；A2、B1–3、E2、G6|已有：真实数据集可编辑发布。 缺口：关联 Skill 集、固定来源版本、去重、冲突处理、任务专用输入和来源血缘。|总控开发者无法直接复用 Skill 单元测试验证端到端效果。 降级：真实手工/导入、编辑草稿、发布和修订可用；组合来源/丰富元数据只在Mock体验。自动生成延后，不计交付缺陷；复制、归档及模板不借用删除等不同合同。|拟议方向（非已实现合同）：POST /api/input-preparations/merge；GET /api/input-preparations/{id}；字段：source_refs、conflicts、selection、reusable。 验收：预览原始/去重数量，冲突显式解决；预约与历史运行固定最终输入。|
|JW-FR-5.3 手工创建和导入测评输入（自动生成后续提供）；前后端联合工作项|US-03.1～03.4、03.7；A2、B1–3、E2、G6|已有：真实单/多轮编辑、JSON/Excel 导入导出已接入；Excel 导入产生草稿。 缺口：本轮核对导入字段映射、逐行校验与优先级；自动生成已决定延后，不纳入本轮验收。|通过手工创建或导入保存 Dataset v1；自动补充覆盖属于后续范围。 降级：真实手工/导入、编辑草稿、发布和修订可用；组合来源/丰富元数据只在Mock体验。自动生成延后，不计交付缺陷；复制、归档及模板不借用删除等不同合同。|拟议方向（非已实现合同）：POST /api/datasets/import-preview；字段：mapping、row_errors、priority。自动生成接口作为后续工作保留。 验收：手工创建或导入后可审阅并发布 v1；错误逐行定位，无静默丢行。|
|JW-FR-5.4 固定外部版本独立测评；前后端联合工作项|US-01.2、05.1、06.5、07.1；A1、B4–5、D1|已有：内置版本可以固定并运行。 缺口：真实 Agent/Skill 版本执行与工具、节点 Trace 适配。|开发者不能确认实际外部历史版本的行为，无法定位工作流节点。 降级：真实对象仅展示可执行的内置版本；对象/创建页给接入要求入口。静态分析服务已有，外部目录、定义授权及真实Web接入未就绪时隐藏入口。|拟议方向（非已实现合同）：GET /api/targets/{id}/versions/{version}；POST /api/evaluations 扩展 target_ref、snapshot。 验收：源平台更新或删除后旧报告仍读获准快照；失效版本不自动换新。|
|JW-FR-5.5 统一任务执行；前后端联合工作项|US-05.1、05.6；A4–5、C1–4|已有：四字段提交、Redis/Celery 执行和完成报告可用。 缺口：通用目标、完整配置清单、部分结果与跨适配器一致进度。|各业务对象无法通过统一产品流程批量执行。 降级：真实仅提交已支持配置，显示服务返回进度/报告；不显示没有真实合同的预约、资源管理、取消/恢复控制。普通用户资源摘要在Mock按RoleGate展示，不作为真实授权依据。|拟议方向（非已实现合同）：POST /api/evaluations 扩展固定 manifest；GET /api/runs/{id}/activity。 验收：所有支持对象同入口执行，运行完成与质量达标分开。|
|JW-FR-5.6 并发、超时、抽样和恢复；前后端联合工作项|US-05.3、05.7～05.8；A4–5、C1–4|已有：当前提交未开放这些配置。 缺口：执行参数、实际样本范围、重试尝试记录、取消终止及恢复命令。|无法控制大批量 Token 用量与故障恢复范围，容易重复执行已完成样本。 降级：真实仅提交已支持配置，显示服务返回进度/报告；不显示没有真实合同的预约、资源管理、取消/恢复控制。普通用户资源摘要在Mock按RoleGate展示，不作为真实授权依据。|拟议方向（非已实现合同）：POST /api/runs/{id}/cancel\|terminate\|retry；字段：concurrency、timeout、retry_limit、case_ids、retry_scope、attempt。 验收：固定样本与顺序；恢复仅未完成；新记录回链原任务，旧结果保留。|
|JW-FR-5.7 公共、私有及混合模型资源；前后端联合工作项|US-05.4、11.1；A4–5、C1–4|已有：生产 Web 尚未开放凭据管理。 缺口：密钥加密保管、按用途授权引用、执行与评分资源分别配置。|用户无法用专用资源减少公共排队，也无法区分不同阶段调用来源。 降级：真实仅提交已支持配置，显示服务返回进度/报告；不显示没有真实合同的预约、资源管理、取消/恢复控制。普通用户资源摘要在Mock按RoleGate展示，不作为真实授权依据。|拟议方向（非已实现合同）：POST /api/credentials；POST /api/credentials/{id}/test；任务字段 execution_resource_ref、scoring_resource_ref。 验收：密钥不回传不导出；私有执行/公共评分组合按阶段应用限额。|
|JW-FR-5.8 指标分布与关系可视化；前后端联合工作项|US-06.1～06.2、10.1；A5、E4、G1–7|已有：真实总分、评估器结果、维度筛选与证据可读；已接 Run 正向和资产反向固定版本关系表、关联任务导航。 缺口：Case 通过率正式口径、得分/失败/标签分布图、实验/生成来源、权限脱敏，以及反向查询总量/分页与含时间状态的任务摘要。|可查看当前版本依赖与使用记录，但业务负责人仍缺统一口径的场景分布和完整历史范围。 降级：总览和血缘仅显示已有范围并提供任务/来源定位；大规模统计不作全量或容量承诺。无身份接口不展示真实管理入口；生产分页、审计、并发冲突及全面无障碍验收单列联合项。|拟议方向（非已实现合同）：已有 /api/runs/{id}/lineage 及五类资产版本 lineage；待扩展分布汇总 unit/applicable_count/missing_count、任务 summary、total/truncated/cursor。 验收：分母/NA/error 说明清楚；图与表均能进入固定版本，权限一致。|
|JW-FR-5.9 可复用评估器管理；前后端联合工作项|US-04.1～04.5；A3、E5|已有：基线 9686d59 已提供持久化评估器目录、新建、元信息修改、启停、草稿与版本发布；真实 Web 已读取已发布版本及准确校验值。 缺口：前后端联合工作项：真实身份与管理权限边界、Web 管理表单接入；复制及归档语义需按已有目录契约核对，不能等同启停或删除。|测评人员可选择已发布评分标准执行；管理入口隐藏，需管理员维护标准后刷新目录。 降级：真实评估器只读目录、固定版本详情与选择现有标准；隐藏管理/试评。已有创建、草稿、发布和精确版本API，不再列为后端缺失；身份授权及Web接入、独立试评/指定历史版本新运行仍为联合项。|拟议方向（非已实现合同）：已有：POST /api/evaluators；PATCH /api/evaluators/{id}；POST /api/evaluators/{id}/drafts；PUT /api/evaluators/{id}/drafts/current；POST /api/evaluators/{id}/drafts/publish。待联合接入：真实身份及管理授权。 验收：草稿校验、发布和历史引用不可变；归档影响提示。|
|JW-FR-5.10 规则、LLM 和复合评分；前后端联合工作项|US-04.1～04.3；A3、E5|已有：后端已有 Rule、可选 LLM Judge、Hybrid 执行能力及 OpenAI-compatible 传输；Web 读取当前目录并显示 Judge 调用记录。 缺口：真实 Web 配置与发布表单、独立试评流程、持久化凭据与授权选择；配置与发布后端 API 已有，不再列为后端缺失。|已配置的标准可执行；业务用户仍不能自行配置并发布复杂标准，不能把内部 Hybrid 实现当作管理页面已接通。 降级：真实评估器只读目录、固定版本详情与选择现有标准；隐藏管理/试评。已有创建、草稿、发布和精确版本API，不再列为后端缺失；身份授权及Web接入、独立试评/指定历史版本新运行仍为联合项。|拟议方向（非已实现合同）：已有版本字段：kind、config、implementation_id、implementation_version、children、combination；子项引用 evaluator_id/evaluator_version/weight。独立试评与凭据授权为联合工作项，不额外发明版本字段。 验收：规则类型、提示词变量、子项权重/循环引用均校验；子项证据可读。|
|JW-FR-5.11 分数、原因与适用性；前后端联合工作项|US-04.4、04.6、06.3；A3、E5|已有：真实结果含固定 evaluator_version/hash、score/reason/outcome、Judge 请求与用量、结构化执行错误；NA/error 不补零。 缺口：独立试评流程及真实管理身份、权限和Web配置接入；可配置标准的创建、草稿和发布API已具备。短路执行已被上游明确推迟，Mock条件终止仅为未来交互样例。|评分错误可定位到类别与请求，但配置试验仍需真实 Run；不能依赖 Mock 跳过行为推断生产执行。 降级：真实评估器只读目录、固定版本详情与选择现有标准；隐藏管理/试评。已有创建、草稿、发布和精确版本API，不再列为后端缺失；身份授权及Web接入、独立试评/指定历史版本新运行仍为联合项。|拟议方向（非已实现合同）：POST /api/evaluator-trials；结果字段 evaluator_ref、dimension、outcome、score、reason、skip_reason。 验收：试评不形成正式报告；pass/fail/review/NA/error/跳过均有原因。|
|JW-FR-5.12 评分标准固定版本；前后端联合工作项|US-04.5、10.2；A3、E5|已有：真实 Run 已保存不可变 EvaluatorSpec、固定子项及内容哈希；历史结果保存对应版本/哈希，支持反查关联运行。HTTP 新建仍只收当前目录 evaluator_ids。 缺口：按历史精确版本创建新任务及真实Web版本管理流程；版本目录、精确版本读取、草稿和发布API已具备。|能证明历史使用哪一版，但历史标准下线或变更后，不能从 Web 强制指定旧版再次执行。 降级：真实评估器只读目录、固定版本详情与选择现有标准；隐藏管理/试评。已有创建、草稿、发布和精确版本API，不再列为后端缺失；身份授权及Web接入、独立试评/指定历史版本新运行仍为联合项。|拟议方向（非已实现合同）：已有：GET /api/evaluators/{id}/versions/{version}。待联合接入：任务 evaluator_refs:[{id,version}] 与真实Web版本管理。 验收：升级不改旧结果；复合子项不随最新版漂移。|
|JW-FR-5.13 预约与公共队列；前后端联合工作项|US-05.5、11.2～11.3；A4–5、C1–4|已有：真实任务可异步排队，无公开限额/ETA 合同。 缺口：预约调度、公共阶段限额、本人队列位置及估算时效。|用户无法判断何时开始，也不能预约低峰执行。 降级：真实仅提交已支持配置，显示服务返回进度/报告；不显示没有真实合同的预约、资源管理、取消/恢复控制。普通用户资源摘要在Mock按RoleGate展示，不作为真实授权依据。|拟议方向（非已实现合同）：GET /api/queue/me；PATCH /api/resources/public/limits；任务 scheduled_at、timezone、position、eta、estimate_at。 验收：取消预约生效；私有任务仍可能等待执行节点；ETA 缺失明确，队列不泄露别人数据。|
|JW-FR-5.14 创建受控实验或对比已有结果；前后端联合工作项|US-07.1～07.2、07.9～07.10；D3–6、E3/5、F1–5、G5|已有：GET /api/run-comparisons 已接入两个已完成兼容运行，返回指标和 Case×主标准差异及两侧 Gate；不同输入内容返回409。 缺口：持久化实验、双/多运行编排、完整执行参数/资源/模型一致性检查和跨输入描述性比较。|可直接复用同输入历史结果找差异，但不能据接口成功声称受控 A/B 或上线许可。 降级：真实已有结果对比只显示服务端返回的指标差异/门槛及双方证据；不伪造显著性、完整受控实验或上线判定。评分调用Token不冒充对象总Token，未知不变成0。|拟议方向（非已实现合同）：POST /api/comparisons/preflight；POST /api/experiments；POST /api/comparisons/from-runs。 验收：同一资产；核对输入/标准/参数/资源；不可比项和仅单边样本显式显示。|
|JW-FR-5.15 多版本执行和性能证据；前后端联合工作项|US-07.3、07.5～07.6；D3–6、E3/5、F1–5、G5|已有：单次真实运行有输出与 Trace；已执行的 LLM Judge 返回可选 Token/耗时，仅代表评分调用，不是 Agent 总用量。 缺口：实验子运行编排、统一采样及对象执行的完整Token/耗时汇总；评分调用已可返回实际用量，不能当作对象总用量。|用户需手工协调各版本，无法判断优化代价。 降级：真实已有结果对比只显示服务端返回的指标差异/门槛及双方证据；不伪造显著性、完整受控实验或上线判定。评分调用Token不冒充对象总Token，未知不变成0。|拟议方向（非已实现合同）：GET /api/experiments/{id}/runs；CaseResult 输入/输出/总 Token 用量、latency。 验收：子运行可追溯，部分失败不伪装完整；缺用量/Trace 不填零。|
|JW-FR-5.16 对比报告与统计证据；前后端联合工作项|US-07.4～07.6、07.8；D3–6、E3/5、F1–5、G5|已有：真实结果对比可读取总体/指标差值、适用/失败/复核/NA/error 数量和逐条变化，支持双侧证据深链；无统计显著性。 缺口：配对统计、差值分布、置信区间、适用检验与报告导出。|负责人无法判断改善幅度和证据强弱。 降级：真实已有结果对比只显示服务端返回的指标差异/门槛及双方证据；不伪造显著性、完整受控实验或上线判定。评分调用Token不冒充对象总Token，未知不变成0。|拟议方向（非已实现合同）：GET /api/comparisons/{id}/report；字段 metric_direction、pair_buckets、n、delta、ci、p_value、method、evidence_status。 验收：生产统计方法经确认并验证；小样本/缺失不判通过；可下钻到回归样本。|
|JW-FR-5.17 多维上线判定；前后端联合工作项|US-07.7；D3–6、E3/5、F1–5、G5|已有：真实运行有当前固定 Gate 结果。 缺口：实验级固定多维规则、场景阈值和证据不足状态。|无法按业务质量、稳定性、性能和 Token 用量共同审查版本。 降级：真实已有结果对比只显示服务端返回的指标差异/门槛及双方证据；不伪造显著性、完整受控实验或上线判定。评分调用Token不冒充对象总Token，未知不变成0。|拟议方向（非已实现合同）：实验 manifest.gate_rules；报告 gate_evaluations:{rule,observed,status,evidence}。 验收：逐项实测值/阈值/未通过原因；证据不足不等于通过，修改规则不覆盖历史。|
|JW-FR-5.18 可复现的实验清单；前后端联合工作项|US-07.8、10.2、10.4；D3–6、E3/5、F1–5、G5|已有：真实任务可查看并复制当前四字段配置。 缺口：完整实验清单、快照、资源身份、判定规则与新实验复跑。|历史结论难以复查，失效资源可能导致配置漂移。 降级：真实已有结果对比只显示服务端返回的指标差异/门槛及双方证据；不伪造显著性、完整受控实验或上线判定。评分调用Token不冒充对象总Token，未知不变成0。|拟议方向（非已实现合同）：GET /api/experiments/{id}/manifest；POST /api/experiments/{id}/rerun。 验收：原记录只读，新运行回链；明确复用配置不保证非确定性输出完全一致。|
|JW-FR-5.19 Badcase 聚类与路由混淆；前后端联合工作项|US-08.1～08.2；D1–6、E1/3、G7|已有：真实报告可筛失败样本。 缺口：持久化聚类任务、类别、代表样本及路由矩阵汇总。|测评人员仍需逐条归类，难以找到最值得修复的问题。 降级：真实证据只读，修订引导至新测评集版本；隐藏无真实写入合同的人工复核、建议采纳及回归按钮。完整交互留在明确标识的Mock工作区，不改原始机器结论。|拟议方向（非已实现合同）：POST /api/analyses；GET /api/analyses/{id}；字段 scope、clusters、confusion_matrix、unknown_count。 验收：矩阵预期/实际轴明确，点击格子定位同范围样本；未知路由单列。|
|JW-FR-5.20 根因假设与证据；前后端联合工作项|US-08.3；D1–6、E1/3、G7|已有：真实用例可查 Trace，不推断根因。 缺口：有证据链接的诊断服务与证据不足标识。|开发者需要自行判断 Prompt、Skill、工具或数据哪里出错。 降级：真实证据只读，修订引导至新测评集版本；隐藏无真实写入合同的人工复核、建议采纳及回归按钮。完整交互留在明确标识的Mock工作区，不改原始机器结论。|拟议方向（非已实现合同）：GET /api/analyses/{id}/hypotheses；字段 hypothesis、evidence_refs、limitations。 验收：假设与事实分开，Trace 不足不能伪造节点结论。|
|JW-FR-5.21 可执行优化建议；前后端联合工作项|US-08.4；D1–6、E1/3、G7|已有：尚无建议管理。 缺口：覆盖 Prompt/Skill/工具/节点/用例的建议及优先级依据。|团队缺少与问题样本对应的修改清单。 降级：真实证据只读，修订引导至新测评集版本；隐藏无真实写入合同的人工复核、建议采纳及回归按钮。完整交互留在明确标识的Mock工作区，不改原始机器结论。|拟议方向（非已实现合同）：GET /api/suggestions；字段 target_ref、kind、priority、evidence、proposed_change。 验收：建议指向实际修改对象、原版本和代表证据，不将静态风险算实际失败。|
|JW-FR-5.22 采纳、外部修改和回归验证；前后端联合工作项|US-08.5、09.1～09.4；D1–6、E1/3、G7|已有：真实可修订测评集再执行；无建议闭环服务。 缺口：建议决定、候选版本关联、回归实验回链和改善判定。|点击采纳无法证明已修改或已验证，改进效果不可追溯。 降级：真实证据只读，修订引导至新测评集版本；隐藏无真实写入合同的人工复核、建议采纳及回归按钮。完整交互留在明确标识的Mock工作区，不改原始机器结论。|拟议方向（非已实现合同）：PATCH /api/suggestions/{id}/decision；POST /api/suggestions/{id}/version-links；POST /api/suggestions/{id}/regressions。 验收：等待外部修改可恢复；用例纠正不强迫改对象；一版本可关联多建议，回归区分改善/无改善/不可比。|
|JW-FR-5.23 测评集发布与历史修订；前后端联合工作项|US-03.8～03.9、05.10、09.2；A2、B1–3、E2、G6|已有：真实草稿、不可变发布版本、复制/归档与历史定位可用。 缺口：丰富元数据版本化、差异摘要、任务专用输入与草稿并发修订号。|优先级和来源不能完整保存，多人编辑可能覆盖，差异需手工核对。 降级：真实手工/导入、编辑草稿、发布和修订可用；组合来源/丰富元数据只在Mock体验。自动生成延后，不计交付缺陷；复制、归档及模板不借用删除等不同合同。|拟议方向（非已实现合同）：DatasetVersion 扩展 metadata/source_refs；草稿 If-Match/ETag；GET /api/datasets/{id}/diff。 验收：修订不改历史；脏表单保护、同实体冲突提示、增删改计数准确。|
|JW-FR-5.24 版本血缘图谱；前后端联合工作项|US-10.1～10.2；A5、E4、G1–7|已有：已接入 Run 正向和 DatasetVersion/Case/Target/Skill/Evaluator 反向 lineage GET；按固定版本/内容hash展示实际节点、关系与关联任务。 缺口：实验→运行、组合/生成输入来源、Prompt/模型版本、权限脱敏，以及反向结果 total/truncated/cursor。|可追溯当前运行依赖并查找使用记录；尚不能证明返回的是全部历史，或追溯未提供的实验/生成来源。 降级：总览和血缘仅显示已有范围并提供任务/来源定位；大规模统计不作全量或容量承诺。无身份接口不展示真实管理入口；生产分页、审计、并发冲突及全面无障碍验收单列联合项。|拟议方向（非已实现合同）：已有六类版本 lineage 端点；待扩展 total/truncated/cursor、authorization、generation_sources、experiment_refs。 验收：可点击一跳图及关系表；历史固定版本；无权节点脱敏。|
|JW-PRD-OVERVIEW 范围明确的总览；前后端联合工作项|US-01.4；A5、E4、G1–7|已有：真实概况和近期任务，失败可重试。 缺口：按对象/固定配置聚合的通过率趋势和 Top 失败类型。|混合不同对象分数会误导质量判断。 降级：总览和血缘仅显示已有范围并提供任务/来源定位；大规模统计不作全量或容量承诺。无身份接口不展示真实管理入口；生产分页、审计、并发冲突及全面无障碍验收单列联合项。|拟议方向（非已实现合同）：GET /api/overview?target_id=&configuration_group=&range=；返回统计范围/口径。 验收：对象筛选影响同一范围的趋势和问题入口，空态可创建任务。|
|JW-PRD-STATIC 独立静态 Skill 分析；前后端联合工作项|US-02.1～02.3；A1、B4–5、D1|已有：基线 9686d59 已有固定目标定义的 Skill 静态分析、报告查询和发现项复核接口。 缺口：前后端联合工作项：真实外部对象目录、定义授权、分析执行环境与真实 Web 入口；风险自动生成用例已延后，本轮可手工补充用例。|真实 Web 隐藏分析执行入口；可先从已有测评报告核对证据，再手工补充测评用例。体验区可走查模拟定义风险。 降级：真实对象仅展示可执行的内置版本；对象/创建页给接入要求入口。静态分析服务已有，外部目录、定义授权及真实Web接入未就绪时隐藏入口。|拟议方向（非已实现合同）：已有：POST /api/skill-analysis/reports（target_descriptor_sha256）；GET /api/skill-analysis/reports；GET /api/skill-analysis/reports/{id}；PUT /api/skill-analysis/reports/{id}/findings/{finding_id}/review（decision、reviewer_id、comment）。真实身份与对象授权待联合接入。 验收：对象详情/配置/分析可进入；风险仅是定义证据，可补用例但不等同运行失败。|
|JW-PRD-REVIEW 逐条复核与人工纠正；前后端联合工作项|US-06.6、10.3；D1–6、E1/3、G7|已有：真实 review 是机器结果，尚无人工写入。 缺口：人工决定、评分、理由、原机器引用、操作人时间及聚合口径。|业务人员无法纠正误判，机器需复核与人工确认容易混淆。 降级：真实证据只读，修订引导至新测评集版本；隐藏无真实写入合同的人工复核、建议采纳及回归按钮。完整交互留在明确标识的Mock工作区，不改原始机器结论。|拟议方向（非已实现合同）：POST /api/runs/{id}/cases/{caseId}/reviews；字段 decision、score、reason、original_ref、revision。 验收：保存后刷新可读；原判保留，报表原始/复核口径显式选择。|
|JW-PRD-REGRESSION 单条复验和加入回归集；前后端联合工作项|US-06.7、09.2；D1–6、E1/3、G7|已有：真实报告→修订新版本→新任务已贯通。 缺口：单条/失败子集重跑、回归集加入和来源留痕。|复验一个问题仍需整批运行，有价值样本不便积累。 降级：真实证据只读，修订引导至新测评集版本；隐藏无真实写入合同的人工复核、建议采纳及回归按钮。完整交互留在明确标识的Mock工作区，不改原始机器结论。|拟议方向（非已实现合同）：POST /api/runs/{id}/retry；POST /api/datasets/{id}/draft/cases/from-results。 验收：新结果与原结果分开；加入草稿后显式发布，保留来源。|
|JW-C-TEMPLATES 优先级与常用配置模板；前后端联合工作项|US-03.1、05.8；A2、B1–3、E2、G6|已有：真实可复制历史配置，尚无模板资产。 缺口：用例优先级、模板持久化与失效依赖校验。|常见回归需重复配置，无法按业务优先级选择场景。 降级：真实手工/导入、编辑草稿、发布和修订可用；组合来源/丰富元数据只在Mock体验。自动生成延后，不计交付缺陷；复制、归档及模板不借用删除等不同合同。|拟议方向（非已实现合同）：GET/POST /api/evaluation-templates；字段 fixed_refs、execution、case_scope；Case.priority。 验收：模板与复制历史分别可用；失效版本或凭据阻断，不自动改用最新。|
|JW-C-AUDIT 操作留痕与权限一致性；前后端联合工作项|US-10.3、11.4；A5、E4、G1–7|已有：当前本地服务不提供生产权限隔离保证。 缺口：服务端认证授权、实体权限、脱敏导出和可查询审计。|多用户部署不能安全隔离对象、凭据、结果与文件。 降级：总览和血缘仅显示已有范围并提供任务/来源定位；大规模统计不作全量或容量承诺。无身份接口不展示真实管理入口；生产分页、审计、并发冲突及全面无障碍验收单列联合项。|拟议方向（非已实现合同）：GET /api/me/permissions；GET /api/audit?subject=；所有业务端点服务端鉴权。 验收：直链/API/导出/图谱同权限；浏览器角色切换仅体验，不能作为安全验收。|
|JW-C-NONFUNCTIONAL 规模、稳定性与可访问性；前后端联合工作项|US-03.9、05.6、10.1；A5、E4、G1–7|已有：桌面/手机核心真实旅程已测，具备路由深链、键盘和错误反馈。 缺口：生产分页/大集查询、并发压测、运行环境性能与全面无障碍审计。|千级用例/万级任务可能变慢，失效依赖影响操作连续性。 降级：总览和血缘仅显示已有范围并提供任务/来源定位；大规模统计不作全量或容量承诺。无身份接口不展示真实管理入口；生产分页、审计、并发冲突及全面无障碍验收单列联合项。|拟议方向（非已实现合同）：GET /api/runs?cursor=&query=；列表分页/总量合同；对象级 revision/幂等键。 验收：目标环境压测与无障碍审计通过；不能用小样例尺寸检查替代性能验收。|

## 当前 assumptions 与联合工作项

- AS-01：不适用/执行错误保持无分数，不将待复核计作已人工复核；真实判定只使用服务返回。

- AS-02：预约按最早入队时间；私有凭据不占公共队列但可等待执行容量；仅在Mock里演示缺失接口。

- AS-03：合并结果仍保存并发布真实测评集版本，不新增临时领域契约。

- AS-04：真实应用未提供角色身份接口；不得从localStorage伪造管理员权限。管理写操作默认隐藏，现有测评业务操作按现有合同保留。

- AS-05：旧的保存视图/快捷键/三范围批量选择等不实现。已有报告/用例全页深链只作可选大空间入口。

- J-01：已完成新评估器摘要/精确版本读取适配；管理与试评的剩余边界见JW-FR-5.9～5.12。

- J-02：外部执行、资源调度、分析回写及规模能力已按现有路由核对，逐项影响/降级见jointWorkItems；Mock不计真实交付。

- AS-06：Token Mock 默认门槛为平均单例2000 Token，仍是可编辑体验规则，不代表生产政策。真实门禁合同不新增用量条件。

- AS-07：Mock 格式升级为 v2，使用独立浏览器存储键；旧v1原样保留，不迁移、不删除、不把旧货币字段带入新模型。真实数据库不受影响。

- AS-08：业务输入里的贷款申请金额属于被测业务字段，与平台调用成本不同，保留原输入与预期。

- AS-09：新验证环境使用 Web15473/API18473、Redis19379数据库2、独立 `usability-ui.db`，源码来自当前工作树；旧进程、旧数据库保留。截图 before 来自变更前环境，阶段/最终验证使用新环境。

- AS-10：只在当前浏览器标签页保存界面位置与引用选择。草稿仍由既有页面拥有并执行离开保护；后台结果始终重新读取，不把缓存的引用当作结果或权限判断。

- AS-11：保留规范原始辅助色#6B7280；在浅灰/浅绿底采用更深#626977，因原色在这些底色实测仅4.39/4.34:1。品牌绿保留，主按钮用深字；输入边界采用可辨识的深辅助色。依据UI审计D-02与AA强制优先，不新增品牌体系。

- AS-12：仅翻译已知目录名称、操作类型及明确业务字段里的状态/风险值；未知外部内容保留原文，完整执行记录仍可查看，不将显示翻译写回契约或当作判定。

## 复用与改动保护

复用当前Vue/Element Plus/router/tokens与既有API边界。goal/p1-demo的单体App仅保留输入/结果行为参照；integration/p1-new的轻根组件/路由布局思想已在本分支落地；不复制旧snapshot合同、不增兼容层或并行前端。原始源码、状态与截图存任务产物 usability-goal/baseline。AGENTS.md、原始规则与其他未认领文档修改保留在工作树，不纳入模式提交。
