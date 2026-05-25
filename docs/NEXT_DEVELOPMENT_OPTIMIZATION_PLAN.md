# 下一阶段开发优化方向（Plan + Goal 模式）

记录日期：2026-05-25

本文只做后续开发安排与验收口径，不直接实现业务功能。开发 agent 开工前应先阅读 `docs/AGENT_WORK_PLAN.md` 的最近执行记录，再按本文拆分目标。

## 1. 当前基线

- 当前分支相对远端 `origin/main` 领先多个本地提交，最近一轮已完成项目编辑弹窗抽取、驳回原因弹窗组件前置、角色管理错误类型清理。
- `App.tsx` 仍约 2080 行，是前端主要编排文件；同一时间仍只能安排一个 agent 修改 `App.tsx`。
- `components/ApprovalCenter/RejectNoteModal.tsx` 与测试已存在，但 `App.tsx` 仍保留 `isRejectNoteModalOpen` 下的内联驳回原因弹窗。
- `App.tsx` 当前仍通过 `(window as any).__pendingRejectIsFinance` 记录驳回目标类型，这是下一轮最明确的低风险收口点。
- 最近记录的质量基线：`npm run lint` 为 0 errors / 43 warnings，`npm run test:run` 为 21 files / 101 tests，`npm run build` 通过但仍有 Vite 大 chunk 提示，`mvn -q test` 通过但有常规 JDK/Spring warning。
- `vite.config.ts` 目前没有 `manualChunks` 或其它构建分包配置；主包体积优化可作为独立目标推进。
- `services/apiService.ts` 仍有项目、里程碑、库存、财务等接口参数使用 `any`，适合按业务切片逐步类型化。

## 2. 优先级判断

### P0：接入 RejectNoteModal，并清掉 window 临时状态

这是下一轮最应该先做的任务。组件和测试已经前置完成，剩余工作主要是把 `App.tsx` 内联 JSX 替换成组件装配，同时把 `window.__pendingRejectIsFinance` 改成受控 React state。

建议边界：

- 允许修改：`App.tsx`，必要时微调 `components/ApprovalCenter/RejectNoteModal.tsx` / 测试，更新 `docs/AGENT_WORK_PLAN.md`。
- 不做：新增审批业务功能，不改审批接口，不顺手处理其它弹窗。
- 目标状态：`App.tsx` 不再出现 `window.__pendingRejectIsFinance`，驳回原因弹窗由 `RejectNoteModal` 渲染。
- 验收命令：`npm run test:run -- components/ApprovalCenter/RejectNoteModal.test.tsx`、`npm run test:run`、`npm run build`、`npm run lint`。

### P1：前端构建分包与首包体积优化

当前构建已通过，但仍有 Vite chunk 超过 500 kB 的提示。这个方向不直接改变业务行为，但能改善后续维护和加载体验。

建议边界：

- 第一阶段优先只做构建分包配置或明确的 lazy import，不做 UI 改版。
- 优先检查 `recharts`、`xlsx`、AI provider SDK、Dashboard/报表相关模块是否被主入口同步拉入。
- 如果只改 `vite.config.ts` 的 `build.rollupOptions.output.manualChunks`，可和非 `App.tsx` 任务并行；如果需要改入口懒加载，则必须避免与 P0 同时修改 `App.tsx`。
- 验收必须记录 `npm run build` 前后主要 asset 体积变化，并说明是否消除了大 chunk warning。

### P1：API Service 类型化切片

`services/apiService.ts` 仍有较多 `any`，但不建议一次性全量类型化。应按业务切片推进，避免把接口契约、页面状态和测试快照一起搅动。

建议切片顺序：

1. 项目与里程碑：`createProject`、`updateProject`、`addMilestone`、`updateMilestone`。
2. 库存物料：`createInventoryItem`、`updateInventoryItem`。
3. 财务/报销/借款/库存流水等剩余高频写接口。

建议边界：

- 优先复用 `types.ts` 中已有类型；如需新增 DTO 类型，命名应区分前端展示模型和 API payload。
- 每轮只处理一个业务切片，并同步调整对应测试。
- 不要为了消除 `any` 改后端接口语义。

### P2：低风险 lint warning 分批清理

剩余 warning 不建议混在业务/结构任务里处理。可以按 warning 类型分批清理，每批保持小范围、可回滚。

建议顺序：

- 未使用异常变量、简单 `catch unknown`、明显无用 import。
- 小范围 `no-explicit-any`，仅处理上下文已经能确定类型的变量。
- React hook deps 放最后，必须逐个确认闭包语义，不能机械套自动修复。
- JSX 文本转义 warning 可作为独立小任务处理，不与交互逻辑混改。

### P2：后端工具链与 JDK 口径收敛

后端测试当前可通过，优先级低于前端结构收口和构建优化。后续可单独确认团队标准 JDK 版本，并把本地开发口径写入 `docs/DEVELOPMENT.md` 或部署文档。

## 3. 建议的下一轮多 agent 安排

如果希望多安排一点活，建议下一轮拆成 4 个目标，但严格控制 `App.tsx` 写入者。

| Agent   | 优先级 | 是否可并行                        | 目标                                                           | 允许写入范围                                         |
| ------- | ------ | --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Agent O | P0     | 独占 `App.tsx`                    | 接入 `RejectNoteModal`，移除 `window.__pendingRejectIsFinance` | `App.tsx`、必要的弹窗测试、`docs/AGENT_WORK_PLAN.md` |
| Agent P | P1     | 可与 O 并行，前提是不改 `App.tsx` | 构建分包测量与 `vite.config.ts` 级优化                         | `vite.config.ts`、必要文档                           |
| Agent Q | P1     | 可并行                            | 项目/里程碑 API payload 类型化                                 | `services/apiService.ts`、`types.ts`、相关测试、文档 |
| Agent R | P2     | 可并行                            | 低风险 lint warning 清理第一批                                 | 非 `App.tsx` 文件优先，文档                          |

并行约束：

- Agent O 是唯一允许修改 `App.tsx` 的任务。
- Agent P 如果发现必须改 `App.tsx` 才能继续，应暂停并回报，不要和 Agent O 抢同一文件。
- Agent Q 不应修改页面 UI；只做 API 类型契约和测试。
- Agent R 不应改 hook deps，不应做大规模自动修复。
- 每个 agent 完成后都要更新 `docs/AGENT_WORK_PLAN.md` 的执行记录、验证命令和剩余风险。

## 4. Plan + Goal 模式执行规则

每个开发 agent 开工时建议按以下节奏：

1. Plan 阶段先读 `docs/AGENT_WORK_PLAN.md` 最近两轮记录和本文对应目标。
2. Plan 阶段输出 3 到 6 条执行计划，明确写入文件、禁止触碰文件、验收命令和回滚风险。
3. Goal 阶段只围绕一个目标执行，不扩展到相邻优化。
4. 修改完成后先跑目标测试，再跑全量前端测试和构建；涉及后端再跑 `mvn -q test`。
5. 验证结果和未处理 warning 必须写回 `docs/AGENT_WORK_PLAN.md`。
6. 提交信息使用中文，描述本轮真实改动，不写空泛总结。

## 5. 可直接转发的开发 agent 提示词

### Agent O：接入驳回原因弹窗

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的下一轮开发任务，请使用 Plan + Goal 模式执行。

先读 docs/AGENT_WORK_PLAN.md 最近两轮记录和 docs/NEXT_DEVELOPMENT_OPTIMIZATION_PLAN.md 的 P0 部分，然后只执行 Agent O 目标。

目标：
1. 将 App.tsx 中 isRejectNoteModalOpen 下的内联驳回原因弹窗替换为 components/ApprovalCenter/RejectNoteModal.tsx。
2. 移除 App.tsx 中的 (window as any).__pendingRejectIsFinance，改为受控 React state 表示当前驳回目标类型。
3. 保持原有驳回审批/财务确认流程、按钮文案、取消重置行为和 rejectNote 状态语义不变。
4. 更新 docs/AGENT_WORK_PLAN.md 执行记录。

边界：
- 你是本轮唯一允许修改 App.tsx 的 agent。
- 不新增审批业务功能，不改后端接口，不处理其它弹窗，不顺手清理无关 warning。
- 如发现 RejectNoteModal 组件 props 不够用，只做最小必要调整并补充/更新组件测试。

验收命令：
- npm run test:run -- components/ApprovalCenter/RejectNoteModal.test.tsx
- npm run test:run
- npm run build
- npm run lint

完成后提交，提交信息使用中文，并在回复里列出验证结果、warning 数量变化和剩余风险。
```

### Agent P：构建分包优化

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的构建优化任务，请使用 Plan + Goal 模式执行。

先读 docs/NEXT_DEVELOPMENT_OPTIMIZATION_PLAN.md 的 P1“前端构建分包与首包体积优化”部分，再开始。

目标：
1. 基于当前 npm run build 输出记录主要 chunk 体积和大 chunk warning。
2. 优先通过 vite.config.ts 的 build.rollupOptions.output.manualChunks 或等价低风险配置优化依赖分包。
3. 如必须修改 App.tsx 或页面入口才能继续，先停止并回报，不要与 Agent O 并行抢 App.tsx。
4. 更新 docs/AGENT_WORK_PLAN.md，记录优化前后 build 输出里的关键 asset 体积变化。

边界：
- 不改业务 UI，不新增依赖，除非说明必要性并保持最小范围。
- 不把 chunkSizeWarningLimit 单纯调大当作优化完成。
- 不处理 lint warning 和 API 类型化。

验收命令：
- npm run build
- npm run test:run
- npm run lint

完成后提交，提交信息使用中文，并说明是否消除或降低了 Vite 大 chunk warning。
```

### Agent Q：项目/里程碑 API 类型化

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的 API 类型化任务，请使用 Plan + Goal 模式执行。

先读 docs/NEXT_DEVELOPMENT_OPTIMIZATION_PLAN.md 的 P1“API Service 类型化切片”部分，再开始。

目标：
1. 仅处理 projects/milestones 相关 API payload 类型，优先覆盖 createProject、updateProject、addMilestone、updateMilestone。
2. 复用 types.ts 既有类型；如新增 DTO 类型，要区分前端展示模型和 API payload。
3. 保持请求 URL、HTTP method、body 字段语义不变。
4. 更新相关测试和 docs/AGENT_WORK_PLAN.md 执行记录。

边界：
- 不修改 App.tsx。
- 不改后端接口，不改页面交互，不顺手类型化其它业务切片。
- 不用宽泛 unknown/as any 掩盖类型问题。

验收命令：
- npm run test:run -- services/apiService.test.ts
- npm run test:run
- npm run build
- npm run lint

完成后提交，提交信息使用中文，并说明本轮减少了哪些 any 或保留了哪些暂不处理的 any。
```

### Agent R：低风险 lint warning 清理

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的低风险 lint 清理任务，请使用 Plan + Goal 模式执行。

先读 docs/NEXT_DEVELOPMENT_OPTIMIZATION_PLAN.md 的 P2“低风险 lint warning 分批清理”部分，再开始。

目标：
1. 只清理非 App.tsx 文件中的低风险 warning，例如未使用变量、未使用 import、可明确改为 unknown 的 catch。
2. 每个修改都必须保持运行时语义不变。
3. 更新 docs/AGENT_WORK_PLAN.md，记录清理前后 warning 数量。

边界：
- 不修改 App.tsx。
- 不处理 React hook deps。
- 不做大规模自动修复，不重排格式，不处理业务逻辑。

验收命令：
- npm run lint
- npm run test:run
- npm run build

完成后提交，提交信息使用中文，并列出 warning 数量变化。
```

## 6. 2026-05-25 执行结果

本计划中的 O/P/Q/R 已执行完成：

- P0 Agent O：`App.tsx` 已接入 `RejectNoteModal`，并移除 `(window as any).__pendingRejectIsFinance`。
- P1 Agent P：`vite.config.ts` 已通过 `manualChunks` 做依赖分包，`npm run build` 不再出现 Vite 大 chunk warning。
- P1 Agent Q：项目/里程碑 API payload 已类型化，`services/apiService.ts` 中对应 4 个目标 `any` 已移除。
- P2 Agent R：已确认当前可改范围内无低风险 warning；剩余 warning 均位于本轮禁改或后续切片文件。

最新验证结果：

- `npm run test:run -- components/ApprovalCenter/RejectNoteModal.test.tsx`：通过，4 tests。
- `npm run test:run -- services/apiService.test.ts`：通过，9 tests。
- `npm run lint`：通过，0 errors、37 warnings。
- `npm run test:run`：通过，21 files、104 tests。
- `npm run build`：通过，主入口 chunk 降至 276.30 kB / gzip 55.23 kB，无大 chunk warning。
- `mvn -q test`：沙箱内因 Mockito/Byte Buddy self-attach 受限失败；沙箱外复跑通过。

后续建议：

- API 类型化可继续按库存、财务、报销、借款/还款、库存流水切片推进。
- `App.tsx` 剩余 warning 仍需单独任务处理，尤其是 hook deps 不应机械自动修复。
- Excel 相关 `vendor-spreadsheet` 仍为 424.41 kB，可在后续性能任务中评估按需动态导入。
