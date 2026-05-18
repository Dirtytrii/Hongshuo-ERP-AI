# 宏硕 ERP Agent 协作工作计划

> 总控口径：本文档用于承接后续开发 agent 的任务分派、执行记录与验收口径。每个开发 agent 开工前先读本文件，完工后补充执行结果、验证命令与遗留问题。

## 1. 当前项目快照

- 项目定位：面向建筑/工程公司的轻量 ERP，核心闭环为项目、物料、财务、审批、合同、报表与 AI 决策室。
- 技术栈：
  - 前端：React 19 + TypeScript + Vite，侧边栏 Tab 单页应用。
  - 后端：Spring Boot 3.2 + JPA + H2，Java 17 为目标版本。
  - 测试：Vitest + React Testing Library、JUnit/MockMvc、Playwright。
- 当前进度：README 的唯一进度矩阵显示 Phase 1 至 Phase 4 已完成，Phase 5 进行中。
- Phase 5 主线：应用壳层、消息中心、预警聚合与共享页面骨架的结构收口，不新增业务模块，不改动后端 API。

## 2. 已确认的代码现状

- `App.tsx` 仍是主要复杂度集中点，当前约 3011 行，继续承载大量状态、数据加载、表单、页面渲染与业务编排。
- Phase 5 已落地部分：
  - `app/layout/*`：`AppShell`、页面视口、加载态、无权限态。
  - `app/shell/*`：`AppHeader`、`AppSidebar`、`MessageCenterPopover`。
  - `app/navigation/*`：Tab 注册源、侧栏分组与权限显隐。
  - `modules/dashboard/services/alertSummary.ts`：消息中心预警聚合规则。
  - `shared/ui/*`：部分共享 UI。
- `modules/` 目前只有 `approval`、`dashboard`、`finance` 的初步骨架，除 dashboard 预警聚合外，多数仍是空出口或待迁移状态。
- 后端目前仍以传统 `controller/service/repository/model` 分层为主，`docs/ARCHITECTURE_REDESIGN.md` 中的后端 `modules/*` 分包尚未实际大规模落地。

## 3. 2026-05-15 基线验证结果

本次摸底使用本机环境：

- `node -v`：v25.9.0
- `npm -v`：11.12.1
- `java -version`：OpenJDK 21.0.11
- `mvn -version`：Maven 3.9.15，Maven 当前使用 Java 25.0.2

验证结果：

| 命令               | 结果           | 说明                                                                                                 |
| ------------------ | -------------- | ---------------------------------------------------------------------------------------------------- |
| `npm ci`           | 通过           | 安装 577 个包；`npm audit` 报 15 个漏洞（8 moderate、6 high、1 critical），暂未处理。                |
| `npm run build`    | 通过           | 产物生成成功；主包约 1.27 MB，Vite 提示 chunk 超过 500 kB，后续可作为性能优化项。                    |
| `npm run lint`     | 通过但有警告   | 0 errors，69 warnings，主要集中在 `App.tsx` 未使用 imports、`any`、hook deps 与少量 JSX 文本转义。   |
| `npm run test:run` | 失败           | 12 个测试文件中 10 个通过、2 个失败；50 个测试中 40 个通过、10 个失败。                              |
| `mvn -q test`      | 未进入代码测试 | Maven Central TLS 握手中断，Spring Boot 依赖 BOM 拉取失败；先按环境/网络阻塞记录，不归因为代码失败。 |

前端测试失败集中点：

- `services/apiService.test.ts` 6 个失败：`localStorage.getItem is not a function`，触发点在 `services/apiService.ts:getStoredToken()`。
- `services/deepseekService.test.ts` 4 个失败：
  - 测试期望导出 `resolveChatCompletionsUrl`，但当前实现未导出。
  - 测试期望支持 `OPENROUTER_BASE_URL` / `OPENROUTER_API_KEY` 等 OpenAI-compatible 配置，但当前实现只读取 `DEEPSEEK_API_KEY` 并固定请求 DeepSeek URL。
- `components/ProjectDetail/ProjectDetail.test.tsx` 当前通过，但输出 React `act(...)` warning，后续清理测试噪音时处理。

## 4. 工作推进原则

- 总控 agent 负责维护本文档、拆任务、收验收结果；开发 agent 负责按单个闭环实现并提交。
- 开发任务优先顺序：先恢复质量门禁，再继续 Phase 5 结构收口，然后才做新功能或性能优化。
- 单个开发 agent 的任务应尽量小而闭合：明确文件范围、验证命令、提交信息和回填文档位置。
- 改动代码后必须及时提交，提交信息用中文，信息要具体但不堆砌无效描述。
- 如任务改变架构或公共 API，必须同步更新相关文档与测试。

## 5. 第一轮开发任务：恢复前端测试基线

### 目标

让前端单测恢复为绿色，并保持构建可用。该任务不新增业务功能，不推进大规模重构，只修复当前测试/实现契约不一致与测试环境问题。

### 建议文件范围

- `tests/setup.ts`
- `services/apiService.test.ts`
- `services/deepseekService.ts`
- `services/deepseekService.test.ts`
- 必要时可小范围触碰 `services/apiService.ts`，但不要改变现有业务 API 行为。
- 完成后更新本文件“执行记录”。

### 任务拆解

1. 修复 `apiService` 测试中的 `localStorage` 问题。
   - 优先判断是测试环境 mock 缺失，还是测试中 stub 污染了 jsdom 的 `localStorage`。
   - 若需要 mock，请在 `tests/setup.ts` 或测试内提供完整的 `getItem/setItem/removeItem/clear` 行为。
   - 不要为了测试通过删除认证 header 逻辑。

2. 对齐 `deepseekService` 的 OpenAI-compatible 配置契约。
   - 导出并测试 `resolveChatCompletionsUrl()`。
   - 支持默认 DeepSeek URL：`https://api.deepseek.com/v1/chat/completions`。
   - 支持 `OPENROUTER_BASE_URL` / `OPENROUTER_FANS_BASE_URL` / `OPENAI_COMPAT_BASE_URL` 一类 base URL 归一化为 `/v1/chat/completions`。
   - 支持 `OPENROUTER_API_KEY`；没有 OpenRouter key 时再回退 `DEEPSEEK_API_KEY`。
   - 同步普通请求与流式请求，不要出现两个路径规则。

3. 回归验证。
   - 必跑：`npm run test:run`
   - 必跑：`npm run build`
   - 建议跑：`npm run lint`，若仍只有 warnings，可在执行记录中说明。
   - 可尝试：`mvn -q test`，若仍是 Maven Central TLS 问题，记录为环境阻塞。

4. 提交。
   - 建议提交信息：`修复前端测试基线与 AI 接口配置`
   - 提交前确认 `git status --short` 只包含本任务相关文件。

### 验收标准

- `npm run test:run` 通过。
- `npm run build` 通过。
- 不引入真实 API 调用依赖，测试必须稳定离线运行。
- AI 决策室现有 DeepSeek 默认行为仍可用。
- 本文档执行记录中写清楚验证结果与剩余风险。

## 6. 第二轮开发任务：恢复后端 Maven 基线

### 目标

让 `mvn -q test` 至少通过编译并进入测试执行阶段，优先恢复后端质量门禁。该任务不要推进业务功能，也不要为绕开 Lombok 问题而批量手写 getter/setter。

### 当前失败形态

2026-05-15 复跑结果：

- `npm run test:run`：通过，12 个测试文件、54 个测试全部通过。
- `mvn -q test`：失败，已不是 Maven Central TLS 问题，而是后端编译/检查问题。

关键错误归类：

- Lombok 注解疑似未生效：
  - `ContractController` 的 `final ContractService contractService` 未由 `@RequiredArgsConstructor` 生成构造器。
  - `Contract`、`ChangeOrder`、`ProjectDocument`、`PaymentPlanItem`、`Project` 等模型上的 `@Data` 未生成 getter/setter。
  - `DingTalkIntegrationService`、`WorkflowNotifyService` 的 `@Slf4j` 未生成 `log` 字段。
- 本机 Maven 当前使用 Java 25.0.2，项目目标 Java 版本为 17；现有 Lombok 版本/注解处理配置可能与当前 JDK 不兼容。
- Checkstyle 同时报告 `DataInitializer.run` 方法 161 行超过 80 行；当前 `failOnViolation=false`，优先级低于编译失败，但如果开发 agent 使其阻断，应一并拆分初始化逻辑。

### 建议文件范围

- `pom.xml`
- 必要时 `checkstyle.xml`
- 必要时少量 Java 文件用于验证真实编译错误，但不要批量手写 Lombok 应生成的方法。
- 完成后更新本文件“执行记录”。

### 任务拆解

1. 先确认 Lombok 根因。
   - 复跑 `mvn -q test`，保留核心错误。
   - 检查 Maven 使用的 JDK 与 Lombok 版本。
   - 优先考虑在 `pom.xml` 中固定兼容当前 JDK 的 Lombok 版本，并配置 `maven-compiler-plugin` 的 `release=17` 与 annotation processor paths。

2. 修复后端编译基线。
   - 目标是让 Lombok 注解处理稳定生效，恢复 `@Data`、`@RequiredArgsConstructor`、`@Slf4j` 等生成能力。
   - 不要把所有模型改成手写 getter/setter，这会扩大维护成本。
   - 如果 Maven 仍跑在 Java 25，也要确保项目按 Java 17 目标编译。

3. 回归验证。
   - 必跑：`mvn -q test`
   - 必跑：`npm run test:run`
   - 建议跑：`npm run build`
   - 若 Maven 编译通过后出现真实后端测试失败，再按失败用例小范围修复。

4. 提交。
   - 建议提交信息：`修复后端 Maven 编译基线`
   - 提交前确认 `git status --short` 只包含本任务相关文件。

### 验收标准

- `mvn -q test` 不再因 Lombok getter/setter、构造器或 `log` 字段缺失而编译失败。
- 如果 `mvn -q test` 仍失败，必须在执行记录中证明已进入更后面的真实测试失败，并列出下一步阻塞。
- 前端测试仍保持绿色。
- 本文档执行记录中写清楚验证命令、结果和剩余风险。

## 7. 第三轮开发任务：接入项目管理页面组件

### 目标

继续 Phase 5 结构收口：把 `App.tsx` 内联的项目管理页面 JSX 迁移到已有的 `components/Projects/ProjectManagementPage.tsx`，让 `App.tsx` 只负责状态、权限与回调装配。该任务是结构重构，不新增业务模块，不改动后端 API。

### 当前观察

2026-05-15 复核结果：

- `mvn -q test`：通过。
- `npm run test:run`：通过，12 个测试文件、54 个测试全部通过。
- `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
- `App.tsx` 仍约 3011 行。
- `components/Projects/ProjectManagementPage.tsx` 已存在，但当前未被 `App.tsx` 使用。
- `App.tsx` 当前仍直接渲染项目管理页，包含详情页、列表/看板切换、导出、导入、新建、查看、编辑、删除、里程碑刷新等编排。

### 建议文件范围

- `App.tsx`
- `components/Projects/ProjectManagementPage.tsx`
- 新增或补充 `components/Projects/ProjectManagementPage.test.tsx`
- 必要时小范围调整 `utils/export.ts` 或相关测试 mock，但不要扩大到其他业务页。
- 完成后更新本文件“执行记录”。

### 任务拆解

1. 接入已有项目管理组件。
   - 在 `App.tsx` 中引入并使用 `ProjectManagementPage`。
   - 删除 `App.tsx` 中 `activeTab === 'projects'` 下的重复内联项目管理 JSX。
   - 保留现有行为：详情页关闭/编辑/删除、里程碑刷新、列表/看板切换、导出 Excel、导入 Excel、新建项目、权限显隐。
   - 注意 `ProjectManagementPage.tsx` 目前有“下载模板”按钮；接入时默认保持当前 `App.tsx` 的用户可见行为，不要无意新增按钮。若决定保留模板下载按钮，必须在执行记录中说明原因并补测试。

2. 清理由接入带来的冗余。
   - 移除 `App.tsx` 中不再需要的 `ProjectDetail`、`ProjectKanban`、项目页专用图标或工具函数 import。
   - 保持 `openProjectModal`、`handleDeleteProject`、`selectedProjectId`、`selectedProjectDetail`、`projectViewMode` 等状态/回调仍由 `App.tsx` 管理，避免一次性迁太多。

3. 补测试。
   - 为 `ProjectManagementPage` 补组件测试，至少覆盖：
     - 列表模式渲染项目、点击“查看”回调项目 id。
     - 切换到看板模式调用 `onChangeViewMode('kanban')`。
     - 权限控制：无创建/编辑/删除权限时不显示对应按钮。
     - 详情模式下点击返回/编辑/删除会调用正确回调。
   - 如需 mock `ProjectDetail` 或导出函数，保持测试离线稳定。

4. 回归验证。
   - 必跑：`npm run test:run`
   - 必跑：`npm run build`
   - 必跑：`mvn -q test`
   - 建议跑：`npm run lint`，记录 warning 数量变化。

5. 提交。
   - 建议提交信息：`接入项目管理页面组件`
   - 提交前确认 `git status --short` 只包含本任务相关文件。

### 验收标准

- `App.tsx` 项目管理页不再保留大段重复 JSX，而是通过 `ProjectManagementPage` 组件装配。
- 项目管理列表/看板/详情/权限/导入导出/新建编辑删除行为不回退。
- 新增的 `ProjectManagementPage` 测试通过。
- `npm run test:run`、`npm run build`、`mvn -q test` 通过。
- 本文档执行记录中写清楚验证命令、结果和剩余风险。

## 8. 第四轮开发任务：接入操作日志页面组件

### 目标

继续 Phase 5 结构收口：把 `App.tsx` 内联的操作日志页面 JSX 接入已有的 `components/History/OperationLogPage.tsx`，让 `App.tsx` 只负责日志筛选状态、数据刷新、删除回调与权限装配。该任务不新增业务功能，不改动后端 API。

### 当前观察

2026-05-15 复核结果：

- 第三轮已完成，`App.tsx` 当前约 2840 行。
- `mvn -q test`、`npm run test:run`、`npm run build` 均已通过。
- `npm run lint` 仍通过但有 66 个 warnings，主要是既有 `App.tsx` 未使用 import、`any` 与 hook deps。
- `components/History/OperationLogPage.tsx` 已存在，但当前未被 `App.tsx` 使用。
- `App.tsx` 当前仍直接渲染 `activeTab === 'history'` 下的操作日志页，包含筛选控件、表格、空态、按权限显示删除按钮，以及删除后按当前筛选条件刷新列表。

### 建议文件范围

- `App.tsx`
- `components/History/OperationLogPage.tsx`
- 新增 `components/History/OperationLogPage.test.tsx`
- 完成后更新本文件“执行记录”。

### 任务拆解

1. 接入已有操作日志组件。
   - 在 `App.tsx` 中引入并使用 `OperationLogPage`。
   - 删除 `App.tsx` 中 `activeTab === 'history'` 下的重复内联操作日志 JSX。
   - 保留现有行为：操作人筛选、操作类型筛选、默认按时间倒序、无数据空态、`log.delete` 权限控制删除列和删除按钮。

2. 收口删除逻辑。
   - 将 `App.tsx` 内联删除日志流程抽成 `handleDeleteLog(log: SystemLog)`，传给 `OperationLogPage`。
   - 保留旧行为：删除前 `confirm`，删除成功后刷新 `systemLogs`；若当前存在筛选条件，则按当前筛选条件刷新 `historyFilteredLogs`，否则置空使用全量列表；失败时展示 toast。
   - 不要改变后端接口调用顺序，除非同时补测试说明原因。

3. 清理由接入带来的冗余。
   - 移除 `App.tsx` 中不再需要的 `History` 图标 import。
   - 只清理与本任务直接相关的 import，不顺手改 AI、用户、权限等其他区域。

4. 补测试。
   - 为 `OperationLogPage` 补组件测试，至少覆盖：
     - 按时间倒序渲染日志。
     - 操作人筛选和操作类型筛选会调用对应回调。
     - `canDelete=false` 时不显示删除列/删除按钮。
     - `canDelete=true` 时点击删除按钮调用 `onDeleteLog`。
     - 空数据时显示“暂无操作日志”。
   - 如需 mock `SearchableSelect`，保持测试语义清晰，不依赖真实下拉交互细节。

5. 回归验证。
   - 必跑：`npm run test:run`
   - 必跑：`npm run build`
   - 必跑：`mvn -q test`
   - 建议跑：`npm run lint`，记录 warning 数量变化。

6. 提交。
   - 建议提交信息：`接入操作日志页面组件`
   - 提交前确认 `git status --short` 只包含本任务相关文件。

### 验收标准

- `App.tsx` 操作日志页不再保留大段重复 JSX，而是通过 `OperationLogPage` 组件装配。
- 操作日志筛选、排序、删除权限、删除刷新行为不回退。
- 新增的 `OperationLogPage` 测试通过。
- `npm run test:run`、`npm run build`、`mvn -q test` 通过。
- 本文档执行记录中写清楚验证命令、结果和剩余风险。

## 9. 第五轮开发任务：接入用户管理页面组件

### 目标

继续 Phase 5 结构收口：把 `App.tsx` 内联的用户管理页面 JSX 接入已有 `components/Users/UserManagementPage.tsx`。该任务不新增用户业务能力，不改动后端 API，只迁移页面渲染边界，让 `App.tsx` 继续负责用户列表状态、弹窗、增删改回调、toast 与权限入口。

### 当前依据

2026-05-15 复核结果：

- 第四轮已完成并提交 `757be30 接入操作日志页面组件并完成并行任务`。
- `components/Users/UserManagementPage.tsx` 已存在。
- `components/Users/UserManagementPage.test.tsx` 已在第四轮并行任务中补齐，覆盖列表、角色标签、启用状态、搜索、新建/编辑/删除回调和空态。
- `App.tsx` 当前仍直接渲染 `activeTab === 'users'` 下的用户管理页，包含搜索输入、新建按钮、表格、空态、编辑与删除按钮。
- 用户管理页当前只在 `currentUser.id === 'admin'` 时显示；本轮必须保留该入口条件。

### 建议写入范围

- `App.tsx`
- `components/Users/UserManagementPage.tsx`
- `components/Users/UserManagementPage.test.tsx`
- `docs/AGENT_WORK_PLAN.md`

### 具体要求

1. 接入已有用户管理组件。
   - 在 `App.tsx` 中引入并使用 `UserManagementPage`。
   - 删除 `App.tsx` 中 `activeTab === 'users'` 下重复的用户管理内联 JSX。
   - 保留 `!isLoading && activeTab === 'users' && currentUser.id === 'admin'` 的入口条件。

2. 保留现有行为。
   - 搜索框仍使用 `userSearch` / `setUserSearch`。
   - 新建用户仍调用 `openUserModal()`。
   - 编辑用户仍调用 `openUserModal(user)`。
   - 删除用户仍调用 `handleDeleteUser(user)`，保留“不能删除当前登录用户”、`confirm`、删除成功刷新列表与 toast。
   - 角色标签仍按 `ROLES[role]?.label ?? role` 的口径展示；搜索仍同时匹配用户名和角色中文标签。
   - 空数据时显示“暂无用户”。

3. 清理 `App.tsx` 中本轮迁移后不再需要的 import。
   - 重点关注用户页专用的 `User`、`Plus`、`Settings`、`Trash2` 是否还被其他区域使用。
   - 不要顺手处理 hook deps、`any` 或其他页面 lint warning。

4. 组件测试跟随接入结果调整。
   - 现有 `UserManagementPage` 组件测试应继续通过。
   - 如果为类型或回调适配调整了组件 props，需要同步调整测试。

### 验收命令

- `npm run test:run`
- `npm run build`
- `mvn -q test`
- 建议 `npm run lint`，记录 warning 数量；本轮预期不消灭全部 warning。

### 完成标准

- `App.tsx` 用户管理页不再保留大段重复 JSX，而是通过 `UserManagementPage` 装配。
- 用户搜索、新建、编辑、删除、角色标签、启用状态、空态与管理员入口条件不回退。
- 前端测试、构建、后端测试通过。
- 本文档执行记录中写清楚验证命令、结果和剩余风险。
- 及时提交，提交信息使用中文；建议提交信息：`接入用户管理页面组件`。

## 10. 第六轮开发任务：清理 App.tsx 明显未使用引用

### 目标

继续 Phase 5 结构收口后的卫生清理：只删除 `App.tsx` 中 ESLint 明确报告的未使用 lucide 图标 import 和未使用常量 `ROLE_OPTIONS`。该任务不迁移页面、不改业务逻辑、不处理 `any`、hook deps 或 JSX 文本转义。

### 当前依据

2026-05-16 复跑 `npm run lint` 结果：通过，0 errors、66 warnings，其中 `App.tsx` 有 16 个可安全收敛的未使用引用：

- 未使用 lucide 图标 import：`LayoutDashboard`、`TrendingUp`、`AlertTriangle`、`ChevronRight`、`CheckSquare`、`Search`、`Filter`、`ChevronDown`、`BarChart2`、`Truck`、`FileEdit`、`FileText`、`Receipt`、`HandCoins`、`Smartphone`。
- 未使用常量：`ROLE_OPTIONS`。

### 建议写入范围

- `App.tsx`
- `docs/AGENT_WORK_PLAN.md`

### 具体要求

1. 删除明确未使用的引用。
   - 从 `App.tsx` 的 `lucide-react` import 中移除上述 15 个未使用图标。
   - 删除 `const ROLE_OPTIONS = Object.values(ROLES);`。

2. 不扩大范围。
   - 不处理 `any` warning。
   - 不处理 `react-hooks/exhaustive-deps` warning。
   - 不处理 `react/no-unescaped-entities` warning。
   - 不修改 `services/apiService.ts`、`utils/import.ts`、`components/Users/RoleManagement.tsx` 等其他文件的 lint warning。
   - 不做页面抽离、功能调整或样式重构。

3. 验证 warning 数量。
   - 预期 `npm run lint` 从 66 warnings 降到约 50 warnings。
   - 如果 warning 数量未按预期下降，先复核是否有图标仍被使用，不能为了追数改其他类别 warning。

### 验收命令

- `npm run lint`
- `npm run test:run`
- `npm run build`

### 完成标准

- `App.tsx` 不再报告上述未使用 import / 常量。
- `npm run lint` 仍为 0 errors，warning 数量下降。
- 前端测试与构建通过。
- 本文档执行记录中写清楚删除了哪些引用、lint warning 数量变化、验证命令和剩余风险。
- 及时提交，提交信息使用中文；建议提交信息：`清理应用入口未使用引用`。

## 11. 第七轮开发任务：抽出库存出入库弹窗组件

### 目标

继续 Phase 5 结构收口：把 `App.tsx` 中 `isStockModalOpen` 下的库存入库/出库弹窗 JSX 抽成 `components/Inventory/StockMovementModal.tsx`。该任务不改变库存业务流程，不改后端 API，只迁移弹窗展示和表单输入边界，让 `App.tsx` 继续负责弹窗开关、库存提交、数据刷新、toast 与权限入口。

### 当前依据

2026-05-16 复核结果：

- 第六轮已完成并提交 `ca9da26 清理应用入口未使用引用`。
- `App.tsx` 当前仍直接渲染 `isStockModalOpen` 下的库存出入库弹窗。
- 弹窗依赖状态包括：`stockModalType`、`selectedItemId`、`stockAmount`、`targetProjectId`、`stockSupplierId`、`inventory`、`projects`、`suppliers`。
- 提交流程集中在 `handleStockSubmit`：校验数量和物料、调用 `apiService.createStockLog`、`reloadCoreData`、按入库/出库和管理员身份展示 toast、关闭弹窗并重置数量与供应商。
- 当前没有现成 `StockMovementModal` 组件，需要本轮新建组件和测试。

### 建议写入范围

- `App.tsx`
- `components/Inventory/StockMovementModal.tsx`
- `components/Inventory/StockMovementModal.test.tsx`
- `docs/AGENT_WORK_PLAN.md`

### 具体要求

1. 新建库存出入库弹窗组件。
   - 组件命名建议：`StockMovementModal`。
   - 组件负责渲染遮罩、标题、物料选择、出库项目选择、入库供应商选择、数量输入、取消和确认按钮。
   - 继续复用 `components/ui/SearchableSelect`，不要改 `SearchableSelect` 本身。

2. `App.tsx` 接入组件。
   - 删除 `App.tsx` 中 `isStockModalOpen` 下的大段内联弹窗 JSX。
   - 保留 `isStockModalOpen && <StockMovementModal ... />` 的装配。
   - `App.tsx` 继续持有 `stockModalType`、`selectedItemId`、`stockAmount`、`targetProjectId`、`stockSupplierId` 等状态。
   - `App.tsx` 继续持有并调用 `handleStockSubmit`，不要把 API 调用移动进组件。

3. 保留现有行为。
   - 入库标题仍为“物料入库登记”，绿色头部，确认按钮为“确认入库”。
   - 出库标题仍为“物料出库申请”，蓝色头部，确认按钮为“确认出库”。
   - 物料选项仍显示 `${name} (${spec})`。
   - 出库时显示“关联项目”，入库时显示“供应商（可选）”。
   - 数量标签仍显示当前物料单位。
   - 关闭按钮和取消按钮仍只关闭弹窗，不重置其他状态。
   - 确认按钮仍调用 `handleStockSubmit`。

4. 测试要求。
   - 新增 `components/Inventory/StockMovementModal.test.tsx`。
   - 至少覆盖：入库模式标题/供应商/确认入库、出库模式标题/项目/确认出库、物料选择回调、数量输入回调、取消和关闭回调。
   - 如果 `SearchableSelect` 在测试里交互复杂，可以用可观察文本和关键回调做最小有效覆盖，但不要只做快照。

5. 清理 import。
   - `App.tsx` 中如果 `Plus`、`ArrowRightLeft` 不再被其他区域使用，应删除。
   - `X`、`Package`、`Wallet` 等图标仍可能被其他弹窗使用，删除前必须确认。

### 验收命令

- `npm run test:run -- components/Inventory/StockMovementModal.test.tsx`
- `npm run test:run`
- `npm run build`
- 建议 `npm run lint`，记录 warning 数量。

### 完成标准

- `App.tsx` 不再保留库存出入库弹窗的大段 JSX。
- 库存入库/出库弹窗用户可见文案、条件字段、按钮行为不回退。
- 新组件测试覆盖关键渲染与回调。
- 前端测试与构建通过。
- 本文档执行记录中写清楚验证命令、结果和剩余风险。
- 及时提交，提交信息使用中文；建议提交信息：`抽出库存出入库弹窗组件`。

## 12. 第八轮开发任务：抽出财务记录弹窗组件

### 目标

继续 Phase 5 结构收口：把 `App.tsx` 中 `isFinanceModalOpen` 下的新增财务记录弹窗 JSX 抽成 `components/Finance/FinanceRecordModal.tsx`。该任务不改变财务创建业务流程，不改后端 API，只迁移弹窗展示和表单输入边界，让 `App.tsx` 继续负责弹窗开关、表单状态、分类/回款节点加载、提交、数据刷新和 toast。

### 当前依据

2026-05-16 复核结果：

- 第七轮已完成并提交 `ed236cd 抽出库存出入库弹窗组件`。
- `App.tsx` 当前仍直接渲染 `isFinanceModalOpen` 下的“新增财务记录”弹窗。
- 财务弹窗依赖状态包括：`financeForm`、`financeCategories`、`paymentPlanOptionsForFinance`、`projects`、`departments`、`suppliers`。
- `App.tsx` 已有 `openFinanceModal`、`handleSaveFinance`，并通过 effect 在弹窗打开时加载财务分类、在收入且选择项目时加载回款计划节点。
- 当前没有现成 `FinanceRecordModal` 组件，需要本轮新建组件和测试。

### 建议写入范围

- `App.tsx`
- `components/Finance/FinanceRecordModal.tsx`
- `components/Finance/FinanceRecordModal.test.tsx`
- `docs/AGENT_WORK_PLAN.md`

### 具体要求

1. 新建财务记录弹窗组件。
   - 组件命名建议：`FinanceRecordModal`。
   - 组件负责渲染遮罩、标题、类型、类别、金额、关联项目、关联部门、回款计划节点、供应商、备注、取消和创建按钮。
   - 继续复用 `components/ui/SearchableSelect`，不要改 `SearchableSelect` 本身。

2. `App.tsx` 接入组件。
   - 删除 `App.tsx` 中 `isFinanceModalOpen` 下的大段内联弹窗 JSX。
   - 保留 `isFinanceModalOpen && <FinanceRecordModal ... />` 的装配。
   - `App.tsx` 继续持有 `financeForm` 和 `setFinanceForm`，继续持有 `handleSaveFinance`。
   - 不要把 `apiService.createFinanceRecord`、`reloadCoreData`、`getFinanceCategories`、`getPaymentPlansByProject` 移动进组件。

3. 保留现有行为。
   - 标题仍为“新增财务记录”，绿色头部。
   - 类型选项仍为“收入 / 支出”。
   - 类型切换时仍同步设置默认类别：收入为“项目收款”，支出为“材料采购”。
   - 收入类别选项仍固定为“项目收款”；支出类别仍来自 `financeCategories`。
   - 关联项目选择为空时 `projectId` 为 `null`，且切换项目时清空 `paymentPlanItemId`。
   - 关联部门、回款计划节点、供应商选择为空时分别写回 `null`。
   - 仅当 `financeForm.type === 'income' && financeForm.projectId != null` 时显示“计入回款计划节点（可选）”。
   - 取消和关闭按钮仍只关闭弹窗。
   - 创建按钮仍调用 `handleSaveFinance`。

4. 测试要求。
   - 新增 `components/Finance/FinanceRecordModal.test.tsx`。
   - 至少覆盖：默认支出模式标题/类别/创建，切换收入时类别回调，收入且有关联项目时显示回款计划节点，项目选择会清空回款节点，供应商/部门空值回写 `null`，取消和关闭回调。
   - 如果 `SearchableSelect` 交互复杂，可以用可观察文本和关键回调做最小有效覆盖，但不要只做快照。

5. 清理 import。
   - `App.tsx` 中如果 `Wallet` 不再被其他区域使用，应删除。
   - `X` 仍可能被其他弹窗使用，删除前必须确认。

### 验收命令

- `npm run test:run -- components/Finance/FinanceRecordModal.test.tsx`
- `npm run test:run`
- `npm run build`
- 建议 `npm run lint`，记录 warning 数量。

### 完成标准

- `App.tsx` 不再保留新增财务记录弹窗的大段 JSX。
- 财务记录弹窗用户可见文案、条件字段、字段写回和创建按钮行为不回退。
- 新组件测试覆盖关键渲染与回调。
- 前端测试与构建通过。
- 本文档执行记录中写清楚验证命令、结果和剩余风险。
- 及时提交，提交信息使用中文；建议提交信息：`抽出财务记录弹窗组件`。

## 13. 第九轮批量任务池：权限弹窗主线 + 并行前置清理

### 目标

第九轮开始多 agent 推进，但继续遵守“同一时间最多一个 agent 改 `App.tsx`”的边界。本轮安排 3 个可并行任务：

- Agent H：主线任务，抽出权限管理弹窗组件，会触碰 `App.tsx`。
- Agent I：前置任务，新建物料管理弹窗组件和测试，不接入 `App.tsx`。
- Agent J：清理低风险 lint warning，只改 `utils/import.ts`。

### 当前依据

2026-05-17 复核结果：

- 第八轮已完成并提交 `dc5fb89 抽出财务记录弹窗组件`。
- `npm run lint` 仍通过，0 errors、50 warnings。
- `App.tsx` 当前仍直接渲染 `isPermissionsModalOpen` 下的权限管理弹窗。
- `App.tsx` 当前仍直接渲染 `isInventoryModalOpen` 下的物料管理弹窗。
- `utils/import.ts` 当前有 5 个低风险未使用变量 warning：`e`、`_oldId`、`_m`、`_oldId`、`e`。

### Agent H：抽出权限管理弹窗组件

#### 建议写入范围

- `App.tsx`
- `components/Settings/PermissionsConfigModal.tsx`
- `components/Settings/PermissionsConfigModal.test.tsx`
- `docs/AGENT_WORK_PLAN.md`

#### 具体要求

1. 新建 `PermissionsConfigModal`。
   - 组件负责渲染遮罩、标题“权限管理”、说明文案、页面访问权限、功能操作权限、系统配置、取消按钮和保存按钮。
   - 组件接收 `permissionsConfig`、`permissions`、`roleLabelMap`、`configForm`、权限变更回调、配置表单变更回调、关闭回调、保存回调。

2. `App.tsx` 接入组件。
   - 删除 `App.tsx` 中 `isPermissionsModalOpen` 下的大段权限管理内联 JSX。
   - 保留 `isPermissionsModalOpen && <PermissionsConfigModal ... />` 的装配。
   - `App.tsx` 继续负责 `permissions`、`configForm` 状态，以及 `handlePermissionChange`、`handleSavePermissions`、`handleSaveConfig`。
   - 保存按钮仍需要依次调用 `handleSavePermissions()` 和 `handleSaveConfig()`。

3. 保留现有行为。
   - 页面级权限仍按 `permission.endsWith('.view')` 分组。
   - 功能权限仍按非 `.view` 分组。
   - 权限中文标签保持现有映射。
   - 勾选框仍以 `(permissions[permission] || []).includes(role.id)` 判定。
   - 取消仍关闭弹窗并 `setConfigForm(config)` 重置表单。
   - 保存仍显示“保存所有配置”。

4. 测试要求。
   - 新增 `components/Settings/PermissionsConfigModal.test.tsx`。
   - 至少覆盖：页面权限分组、功能权限分组、角色勾选状态、勾选回调、配置输入回调、取消回调、保存回调。

#### 验收命令

- `npm run test:run -- components/Settings/PermissionsConfigModal.test.tsx`
- `npm run test:run`
- `npm run build`
- 建议 `npm run lint`，记录 warning 数量。

#### 完成标准

- `App.tsx` 不再保留权限管理弹窗的大段 JSX。
- 权限分组、勾选、配置输入、取消和保存行为不回退。
- 新组件测试覆盖关键渲染与回调。
- 及时提交，提交信息建议：`抽出权限管理弹窗组件`。

### Agent I：新建物料管理弹窗组件测试前置

#### 建议写入范围

- `components/Inventory/InventoryItemModal.tsx`
- `components/Inventory/InventoryItemModal.test.tsx`
- `docs/AGENT_WORK_PLAN.md`

#### 具体要求

- 只新建组件和测试，不接入 `App.tsx`，避免和 Agent H 冲突。
- 组件从当前 `App.tsx` 的 `isInventoryModalOpen` 内联物料管理弹窗抽象而来。
- 组件负责渲染标题“新建物料/编辑物料”、物料名称、规格参数、单位、参考单价、初始库存数量、低库存预警阈值、取消和保存按钮。
- 组件接收 `inventoryForm`、`editingInventoryItem`、`onInventoryFormChange`、`onClose`、`onSubmit`。
- 测试至少覆盖：新建/编辑标题、字段显示与输入回调、阈值单位联动、取消回调、保存回调。

#### 验收命令

- `npm run test:run -- components/Inventory/InventoryItemModal.test.tsx`
- `npm run test:run`
- `npm run build`

#### 完成标准

- 新组件和测试可独立通过。
- 不修改 `App.tsx`。
- 及时提交，提交信息建议：`补充物料管理弹窗组件`

### Agent J：清理 utils/import.ts 低风险未使用变量

#### 建议写入范围

- `utils/import.ts`
- `docs/AGENT_WORK_PLAN.md`

#### 具体要求

- 只处理 `utils/import.ts` 中 ESLint 明确报告的未使用变量 warning。
- 当前目标为：第 26 行 `e`、第 56 行 `_oldId`、第 56 行 `_m`、第 62 行 `_oldId`、第 116 行 `e`。
- 对 catch 参数如果未使用，优先改成无参数 `catch {}`。
- 对解构出的未使用字段，优先调整解构或删除无用绑定，不改变导入解析语义。
- 不处理 `App.tsx`、`apiService.ts`、`RoleManagement.tsx` 的 warning。

#### 验收命令

- `npm run lint`
- `npm run test:run`
- `npm run build`

#### 完成标准

- `utils/import.ts` 不再报告上述 5 个未使用变量 warning。
- `npm run lint` 仍为 0 errors，warning 数量预期从 50 降到约 45。
- 及时提交，提交信息建议：`清理导入工具未使用变量`

### 并行边界

- Agent H 是本轮唯一允许修改 `App.tsx` 的任务。
- Agent I 不接入 `App.tsx`，只做组件和测试前置。
- Agent J 只改 `utils/import.ts`。
- 三个任务都完成后，再安排 Agent K 接入 `InventoryItemModal`。

## 14. 后续候选任务

第九轮批量任务完成并提交后，再安排以下任务，暂不同时开工：

1. 继续按页面域切分 `App.tsx`。
   - 优先接入 `InventoryItemModal`，再评估项目编辑弹窗、驳回备注弹窗等高噪声区域。
   - 每次只迁移一个页面域，迁移前后补或保留测试。

2. 清理 lint warnings。
   - 继续按小批次清理明显 `any` 或未使用变量。
   - hook deps 需要谨慎处理，避免引入重复加载或无限循环。

3. 性能与包体优化。
   - 继续 lazy load 大页面和报表/Excel/AI 相关依赖。
   - 以 `npm run build` 的 chunk 结果作为验收依据。

4. Maven/JDK 基线整理。
   - 统一本地 Java 版本到 17 或至少验证 Java 21/25 下的兼容性。
   - 处理 Maven Central 拉取失败的环境问题后再评价后端测试真实状态。

## 15. 批量任务池与并行安排

> 这组任务用于多开发 agent 同时推进。原则：同一时间最多一个 agent 改 `App.tsx`，其余 agent 只做不重叠文件，避免冲突。

### 可立即并行

#### 任务 A：第四轮主线，接入操作日志页面组件

- 状态：已完成。
- 写入范围：`App.tsx`、`components/History/OperationLogPage.tsx`、`components/History/OperationLogPage.test.tsx`、`docs/AGENT_WORK_PLAN.md`。
- 冲突提醒：此任务会改 `App.tsx`，执行期间不要让其他 agent 同时做用户管理页接入、AI 页拆分或权限页拆分。
- 验收：`npm run test:run`、`npm run build`、`mvn -q test`，建议 `npm run lint`。

#### 任务 B：拆分 DataInitializer，清理后端 Checkstyle 噪音

- 状态：已完成。
- 写入范围：`src/main/java/com/hongshuo/erp/config/DataInitializer.java`，必要时补少量后端测试或文档记录。
- 目标：把 `run` 方法从 161 行拆成多个私有初始化方法，消除 `MethodLength` 报告；不改变种子数据内容、不改业务逻辑、不改生产配置。
- 验收：`mvn -q test`，并确认 Maven 输出不再出现 `DataInitializer.run` 超 80 行的 Checkstyle 报告；建议顺手跑 `npm run test:run`。
- 建议提交信息：`拆分数据初始化逻辑`

#### 任务 C：补 UserManagementPage 组件测试

- 状态：已完成。
- 写入范围：新增 `components/Users/UserManagementPage.test.tsx`，必要时小范围调整 `components/Users/UserManagementPage.tsx` 的可测试性。
- 目标：先为已有 `UserManagementPage` 建好组件测试，为后续接入 `App.tsx` 铺路。
- 覆盖点：
  - 渲染用户列表、角色标签、启用/禁用状态。
  - 搜索用户名和角色标签。
  - 点击新建、编辑、删除回调。
  - 空列表显示“暂无用户”。
- 验收：`npm run test:run`、`npm run build`。
- 建议提交信息：`补充用户管理页面组件测试`

### 串行排队

#### 任务 D：接入用户管理页面组件

- 状态：已完成。
- 建议写入范围：`App.tsx`、`components/Users/UserManagementPage.tsx`、`components/Users/UserManagementPage.test.tsx`、`docs/AGENT_WORK_PLAN.md`。
- 目标：把 `App.tsx` 内联的 `activeTab === 'users'` 用户管理 JSX 接入已有 `UserManagementPage`，保留搜索、新建、编辑、删除、角色标签与启用状态行为。
- 验收：`npm run test:run`、`npm run build`、`mvn -q test`，建议 `npm run lint`。
- 建议提交信息：`接入用户管理页面组件`

#### 任务 E：清理 App.tsx 明显未使用 import

- 状态：已完成。
- 写入范围：`App.tsx`。
- 目标：只清理 ESLint 明确提示的未使用 import / 常量，如页面拆分后遗留的图标和 `ROLE_OPTIONS`；不要处理 hook deps 或 `any`，避免引入行为变化。
- 验收：`npm run lint` warning 数量应下降，且 `npm run test:run`、`npm run build` 通过。
- 建议提交信息：`清理应用入口未使用引用`

#### 任务 F：继续拆库存或财务弹窗编排

- 状态：库存出入库弹窗与财务记录弹窗均已完成。
- 建议方向：从 `App.tsx` 抽 `FinanceRecordModal`，保持 `App.tsx` 负责财务表单状态、分类加载、回款节点加载和提交。
- 要求：先写小组件测试，再接入；每次只拆一个弹窗。

#### 任务 H：抽出权限管理弹窗组件

- 状态：已完成；这是第九轮唯一修改 `App.tsx` 的任务。
- 建议写入范围：`App.tsx`、`components/Settings/PermissionsConfigModal.tsx`、`components/Settings/PermissionsConfigModal.test.tsx`、`docs/AGENT_WORK_PLAN.md`。
- 目标：把 `App.tsx` 内联的 `isPermissionsModalOpen` 权限管理弹窗抽出为组件，保留权限分组、角色勾选、系统配置、取消重置和保存行为。
- 验收：`npm run test:run -- components/Settings/PermissionsConfigModal.test.tsx`、`npm run test:run`、`npm run build`，建议 `npm run lint`。
- 建议提交信息：`抽出权限管理弹窗组件`

#### 任务 I：新建物料管理弹窗组件测试前置

- 状态：已完成；未修改 `App.tsx`。
- 建议写入范围：`components/Inventory/InventoryItemModal.tsx`、`components/Inventory/InventoryItemModal.test.tsx`、`docs/AGENT_WORK_PLAN.md`。
- 目标：先把物料管理弹窗组件和测试准备好，给后续接入 `App.tsx` 铺路。
- 验收：`npm run test:run -- components/Inventory/InventoryItemModal.test.tsx`、`npm run test:run`、`npm run build`。
- 建议提交信息：`补充物料管理弹窗组件`

#### 任务 J：清理 utils/import.ts 低风险未使用变量

- 状态：已完成；只修改 `utils/import.ts` 和计划文档。
- 建议写入范围：`utils/import.ts`、`docs/AGENT_WORK_PLAN.md`。
- 目标：清理 `utils/import.ts` 中 5 个 ESLint 未使用变量 warning，不碰 `App.tsx`、`apiService.ts`、`RoleManagement.tsx`。
- 验收：`npm run lint` warning 数量预期从 50 降到约 45，且 `npm run test:run`、`npm run build` 通过。
- 建议提交信息：`清理导入工具未使用变量`

#### 任务 K：接入物料管理弹窗组件

- 状态：已完成；这是第九轮之后的串行 `App.tsx` 接入任务。
- 建议写入范围：`App.tsx`、`docs/AGENT_WORK_PLAN.md`。
- 目标：将 `App.tsx` 中 `isInventoryModalOpen` 下的物料管理弹窗内联 JSX 替换为已准备好的 `InventoryItemModal` 装配，保留物料表单状态、编辑对象、提交、刷新和 toast 流程。
- 验收：`npm run test:run -- components/Inventory/InventoryItemModal.test.tsx`、`npm run test:run`、`npm run build`，建议 `npm run lint`。
- 建议提交信息：`接入物料管理弹窗组件`

### 给并行开发 agent 的简短分派

```text
第九轮 3 个开发 agent 已完成：

Agent H：已完成“抽出权限管理弹窗组件”。这是第九轮唯一修改 App.tsx 的任务。

Agent I：已完成“新建物料管理弹窗组件测试前置”。只新建组件和测试，未接入 App.tsx。

Agent J：已完成“清理 utils/import.ts 低风险未使用变量”。只改 utils/import.ts 和计划文档。

下一轮可安排 Agent K 接入 InventoryItemModal，仍需遵守同一时间最多一个任务修改 App.tsx。
```

## 16. 执行记录

### 2026-05-15 总控摸底

- 已完成项目结构、文档、测试脚本、Phase 5 落点和基线命令检查。
- 已确认当前最适合交给第一个开发 agent 的任务是“恢复前端测试基线”。
- 后端测试当前受 Maven 依赖下载 TLS 握手失败影响，暂不作为代码质量结论。

### 2026-05-15 第一轮开发：恢复前端测试基线

- 已修复 `services/apiService.test.ts` 的测试环境问题：在 `tests/setup.ts` 提供可清理的内存版 `localStorage`，保留 `apiService.ts` 现有认证 header 语义不变。
- 已对齐 AI 决策室 OpenAI-compatible 配置契约：`services/deepseekService.ts` 导出 `resolveChatCompletionsUrl()`，支持默认 DeepSeek URL，并按 `OPENROUTER_BASE_URL`、`OPENROUTER_FANS_BASE_URL`、`OPENAI_COMPAT_BASE_URL` 归一化到 `/v1/chat/completions`；API Key 优先使用 `OPENROUTER_API_KEY`，再回退 `DEEPSEEK_API_KEY`；普通请求与流式请求共用同一套 URL/key 解析。
- 已补充 `services/deepseekService.test.ts` 覆盖默认 DeepSeek、OpenRouter base URL、`OPENROUTER_FANS_BASE_URL`、通用 OpenAI-compatible base URL、base URL 优先级、OpenRouter key 优先级，以及流式请求路径。
- 已更新 `vite.config.ts` 注入新增 OpenRouter/OpenAI-compatible 环境变量，避免生产构建后浏览器端访问未定义的 `process.env` 字段。
- 验证结果：
  - `npm run test:run`：通过，12 个测试文件、54 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `npm run lint`：通过，0 errors、66 warnings；warnings 主要仍集中在 `App.tsx`、`services/apiService.ts`、`utils/import.ts` 等既有 `any`、未使用变量与 hook deps。
  - `mvn -q test`：已按要求重试两次，均未再卡在 Maven Central TLS；当前失败为后端编译/检查问题，包括 `DataInitializer.run` 方法长度、`ContractController` final 字段构造器初始化、多个 model getter/setter 符号缺失以及 `log` 字段缺失等，属于后端基线遗留风险，本轮未修复。
- 剩余风险：前端测试基线已恢复；后端 Maven 基线当前不是环境网络阻塞，而是代码编译失败，需要后续单独拆任务处理。

### 2026-05-15 总控安排：第二轮任务

- 已复跑 `npm run test:run`，确认前端单测 54 个全部通过。
- 已复跑 `mvn -q test`，确认当前阻塞为后端编译失败，错误集中在 Lombok 注解未生成构造器、getter/setter 与 `log` 字段。
- 第二轮开发任务确定为“恢复后端 Maven 基线”，优先修 `pom.xml` / Lombok / compiler plugin 配置，暂缓继续拆 `App.tsx`。

### 2026-05-15 第二轮开发：恢复后端 Maven 基线

- 已在 `pom.xml` 固定并显式配置 Maven 后端质量门禁所需版本：
  - `lombok.version=1.18.46`，并将 Lombok 声明为 `provided`。
  - `maven-compiler-plugin` 明确 `release=17`，并通过 `annotationProcessorPaths` 使用同一 Lombok 版本，恢复 `@Data`、`@RequiredArgsConstructor`、`@Slf4j` 等注解处理。
  - 覆盖 `mockito.version=5.23.0` 与 `byte-buddy.version=1.18.8`，解决 Maven 当前运行在 Java 25.0.2 时旧 Byte Buddy 不支持 Java 25 class file 版本导致的 Mockito inline mock 失败。
- 验证结果：
  - `mvn -q test`：通过；Surefire 报告显示 20 个后端测试套件、110 个测试，0 failures、0 errors。
  - `npm run test:run`：通过，12 个测试文件、54 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
- 剩余风险：
  - Checkstyle 仍输出 `DataInitializer.run` 方法 161 行超过 80 行，但当前 `failOnViolation=false`，不阻断 Maven。
  - Maven 在 Java 25 下仍输出 Lombok `sun.misc.Unsafe`、Mockito self-attaching、Tomcat native access 等兼容性 warning；建议后续按项目目标统一本地 Maven JDK 到 Java 17 或 Java 21，以减少未来 JDK 收紧带来的噪音。

### 2026-05-15 总控安排：第三轮任务

- 已复跑 `mvn -q test`，确认后端测试通过。
- 已复跑 `npm run test:run`，确认前端单测 54 个全部通过。
- 已复跑 `npm run build`，确认前端构建通过，仍有 chunk 超过 500 kB 的既有提示。
- 已确认 `components/Projects/ProjectManagementPage.tsx` 已存在但未接入 `App.tsx`，第三轮任务确定为“接入项目管理页面组件”，继续 Phase 5 结构收口。

### 2026-05-15 第三轮开发：接入项目管理页面组件

- 已将 `App.tsx` 中 `activeTab === 'projects'` 下的大段项目管理内联 JSX 替换为 `ProjectManagementPage` 装配；`App.tsx` 继续负责项目状态、权限、详情加载、里程碑刷新、导入触发、弹窗与删除回调。
- 已清理 `App.tsx` 中项目页不再需要的 `ProjectDetail`、`ProjectKanban`、`exportProjectsToExcel`、`STATUS_COLORS` 以及项目页专用图标 import；`App.tsx` 当前约 2840 行。
- 已调整 `ProjectManagementPage`：新增 `showImportTemplateButton` 可选开关，默认 `false`；本轮接入不显示“下载模板”，保持旧 `App.tsx` 项目页用户可见行为不变。
- 已新增 `components/Projects/ProjectManagementPage.test.tsx`，覆盖列表渲染与查看回调、看板切换回调、创建/编辑/删除权限显隐、详情模式返回/编辑/删除回调。
- 验证结果：
  - `npm run test:run`：通过，13 个测试文件、58 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `mvn -q test`：通过；Surefire 报告仍为 20 个后端测试套件、110 个测试，0 failures、0 errors。
  - `npm run lint`：通过，0 errors、66 warnings；warning 数量未增加。
- 剩余风险：详情页删除仍保持旧行为，调用删除后立即关闭详情；若用户取消 confirm 或删除失败，也可能先离开详情页。该行为本轮未改动，后续可单独做交互收口。

### 2026-05-15 总控安排：第四轮任务

- 已确认第三轮提交 `7ebeac1 接入项目管理页面组件` 已落地，`App.tsx` 当前约 2840 行。
- 已复核 `mvn -q test`、`npm run test:run`、`npm run build` 通过。
- 已复跑 `npm run lint`，仍为 0 errors、66 warnings。
- 已确认 `components/History/OperationLogPage.tsx` 已存在但未接入 `App.tsx`，第四轮任务确定为“接入操作日志页面组件”。

### 2026-05-15 总控安排：批量任务池

- 已新增多 agent 任务池：A 操作日志页接入、B 拆分 `DataInitializer`、C 补 `UserManagementPage` 组件测试可并行。
- 已明确串行队列：D 用户管理页接入、E 清理 `App.tsx` 未使用 import、F 继续拆库存或财务弹窗。
- 并行边界：同一时间只允许任务 A/D/E/F 中一个触碰 `App.tsx`；任务 B/C 不触碰 `App.tsx`，可并行执行。

### 2026-05-15 第四轮开发：接入操作日志页面组件与并行任务池

- 已将 `App.tsx` 中 `activeTab === 'history'` 下的大段操作日志内联 JSX 替换为 `OperationLogPage` 装配；`App.tsx` 继续负责筛选状态、权限判断、删除确认、日志刷新与 toast。
- 已抽出 `handleDeleteLog(log: SystemLog)`，保留旧删除流程：先 `confirm`，再调用 `apiService.deleteLog(Number(log.id))`，随后刷新 `systemLogs`；存在筛选条件时按当前筛选重新加载 `historyFilteredLogs`，否则置空回到全量列表。
- 已清理 `App.tsx` 中本轮不再需要的 `History` 图标 import，未顺手改其他页面。
- 已新增 `components/History/OperationLogPage.test.tsx`，覆盖时间倒序、操作人/操作类型筛选回调、`canDelete=false` 隐藏删除入口、`canDelete=true` 删除回调和空态。
- 并行任务 B 已完成：`DataInitializer.run` 已拆成重置、种子数据入口、项目、里程碑、库存、财务、库存日志、系统日志等私有方法；种子数据内容、创建顺序和生产配置保持不变，`mvn -q test` 未再出现 `DataInitializer.run` 方法长度报告。
- 并行任务 C 已完成：新增 `components/Users/UserManagementPage.test.tsx`，覆盖用户列表、角色标签、启用/禁用状态、搜索回调、用户名/角色标签过滤、新建/编辑/删除回调和空列表。
- 验证结果：
  - `npm run test:run -- components/History/OperationLogPage.test.tsx components/Users/UserManagementPage.test.tsx`：通过，2 个测试文件、10 个测试全部通过。
  - `npm run test:run`：通过，15 个测试文件、68 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `mvn -q test`：通过。
  - `npm run lint`：通过，0 errors、66 warnings；warning 数量未增加，仍为既有 `App.tsx` 未使用 import、`any`、hook deps 等问题。
- 剩余风险：本轮未处理既有 lint warnings 和 Vite 大 chunk 提示；任务 D“接入用户管理页面组件”已具备前置组件测试，可作为下一轮串行任务开工。

### 2026-05-15 总控安排：第五轮任务

- 已确认第四轮提交 `757be30 接入操作日志页面组件并完成并行任务` 已落地，当前分支领先远端 9 个提交。
- 已确认 `components/Users/UserManagementPage.tsx` 与 `components/Users/UserManagementPage.test.tsx` 均已存在，用户管理组件具备接入前置测试。
- 已复核 `App.tsx` 中 `activeTab === 'users'` 仍保留内联用户管理页 JSX，第五轮任务确定为“接入用户管理页面组件”。
- 本轮仍按串行执行：只允许该开发 agent 触碰 `App.tsx`；不要同时推进清理 import 或库存/财务弹窗拆分。

### 2026-05-16 第五轮开发：接入用户管理页面组件

- 已将 `App.tsx` 中 `activeTab === 'users'` 下的大段用户管理内联 JSX 替换为 `UserManagementPage` 装配；入口条件仍为 `!isLoading && activeTab === 'users' && currentUser.id === 'admin'`。
- `App.tsx` 继续负责 `users`、`userSearch`、弹窗打开、删除确认、删除当前用户保护、删除后刷新用户列表和 toast；`UserManagementPage` 只负责列表渲染、搜索输入和按钮回调。
- 已移除 `App.tsx` 中本轮不再需要的 `User` 图标 import，未处理其他既有 lint warning。
- 为保持旧行为，`UserManagementPage` 新增可选 `getSearchRoleLabel`：页面展示仍按 `ROLES[role]?.label ?? role`，搜索仍可按 `roleLabelMap` 中的角色中文标签匹配；已补对应组件测试。
- 验证结果：
  - `npm run test:run -- components/Users/UserManagementPage.test.tsx`：通过，1 个测试文件、6 个测试全部通过。
  - `npm run test:run`：通过，15 个测试文件、69 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `mvn -q test`：通过。
  - `npm run lint`：通过，0 errors、66 warnings；warning 数量未增加，仍为既有 `App.tsx` 未使用 import、`any`、hook deps 等问题。
- 剩余风险：本轮未处理既有 lint warnings、Vite 大 chunk 提示和 Maven 在 Java 25 下的运行期 warning；任务 E“清理 App.tsx 明显未使用 import”可作为下一轮串行任务。

### 2026-05-16 总控安排：第六轮任务

- 已确认第五轮提交 `6b97e5b 接入用户管理页面组件` 已落地，当前分支领先远端 11 个提交。
- 已复跑 `npm run lint`，确认当前仍为 0 errors、66 warnings。
- 已定位第六轮可安全处理的 `App.tsx` 未使用引用：15 个 lucide 图标 import 和 `ROLE_OPTIONS` 常量。
- 第六轮任务确定为“清理 App.tsx 明显未使用引用”；本轮只做 lint 卫生清理，不处理 `any`、hook deps、文本转义或其他文件 warning。

### 2026-05-16 第六轮开发：清理 App.tsx 明显未使用引用

- 已从 `App.tsx` 的 `lucide-react` import 中移除 15 个 ESLint 明确报告未使用的图标：`LayoutDashboard`、`TrendingUp`、`AlertTriangle`、`ChevronRight`、`CheckSquare`、`Search`、`Filter`、`ChevronDown`、`BarChart2`、`Truck`、`FileEdit`、`FileText`、`Receipt`、`HandCoins`、`Smartphone`。
- 已删除未使用常量 `ROLE_OPTIONS`。
- 未处理 `any`、hook deps、JSX 文本转义或其他文件的 lint warning，未迁移页面或改动业务逻辑。
- 验证结果：
  - `npm run lint`：通过，0 errors、50 warnings；warning 数量从 66 降到 50。
  - `npm run test:run`：通过，15 个测试文件、69 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
- 剩余风险：仍有 50 个既有 lint warnings，主要为 `any`、hook deps、JSX 文本转义、未使用异常变量以及其他文件中的类型清理项；本轮按范围未处理。

### 2026-05-16 总控安排：第七轮任务

- 已确认第六轮提交 `ca9da26 清理应用入口未使用引用` 已落地，当前分支领先远端 13 个提交。
- 已复核 `App.tsx` 中 `isStockModalOpen` 下仍保留库存入库/出库弹窗内联 JSX。
- 已确认当前没有现成 `StockMovementModal` 组件，第七轮任务确定为“抽出库存出入库弹窗组件”。
- 本轮仍按串行执行：只允许该开发 agent 触碰 `App.tsx`；不要同时推进财务弹窗、权限弹窗或其他页面抽离。

### 2026-05-16 第七轮开发：抽出库存出入库弹窗组件

- 已新增 `components/Inventory/StockMovementModal.tsx`，负责库存入库/出库弹窗的遮罩、标题、物料选择、出库项目选择、入库供应商选择、数量输入、取消和确认按钮。
- 已将 `App.tsx` 中 `isStockModalOpen` 下的大段内联 JSX 替换为 `StockMovementModal` 装配；`App.tsx` 继续负责 `stockModalType`、`selectedItemId`、`stockAmount`、`targetProjectId`、`stockSupplierId` 状态，以及 `handleStockSubmit`、刷新、toast 和弹窗开关。
- 已清理 `App.tsx` 中迁移后不再使用的 `Plus`、`ArrowRightLeft` 图标 import；`X`、`Package`、`Wallet` 等仍被其他区域使用，未删除。
- 已新增 `components/Inventory/StockMovementModal.test.tsx`，覆盖入库模式标题/供应商/确认入库、出库模式标题/项目/确认出库、物料选择回调、数量输入回调、取消和关闭回调。
- 验证结果：
  - `npm run test:run -- components/Inventory/StockMovementModal.test.tsx`：通过，1 个测试文件、4 个测试全部通过。
  - `npm run test:run`：通过，16 个测试文件、73 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `npm run lint`：通过，0 errors、50 warnings；warning 数量未增加，仍为既有 `any`、hook deps、JSX 文本转义等问题。
- 剩余风险：库存提交业务流程未迁入组件，本轮未改动后端 API；后续若继续 Phase 5 结构收口，可再评估财务弹窗或权限弹窗拆分。

### 2026-05-17 总控安排：第八轮任务

- 已确认第七轮提交 `ed236cd 抽出库存出入库弹窗组件` 已落地，当前分支领先远端 1 个提交。
- 已复核 `App.tsx` 中 `isFinanceModalOpen` 下仍保留新增财务记录弹窗内联 JSX。
- 已确认当前没有现成 `FinanceRecordModal` 组件，第八轮任务确定为“抽出财务记录弹窗组件”。
- 本轮仍按串行执行：只允许该开发 agent 触碰 `App.tsx`；不要同时推进权限弹窗、物料弹窗或其他页面抽离。

### 2026-05-17 第八轮开发：抽出财务记录弹窗组件

- 已新增 `components/Finance/FinanceRecordModal.tsx`，负责新增财务记录弹窗的遮罩、标题、类型、类别、金额、关联项目、关联部门、回款计划节点、供应商、备注、取消和创建按钮。
- 已将 `App.tsx` 中 `isFinanceModalOpen` 下的大段内联 JSX 替换为 `FinanceRecordModal` 装配；`App.tsx` 继续负责 `financeForm` / `setFinanceForm`、分类加载、回款节点加载、`handleSaveFinance`、刷新、toast 和弹窗开关。
- 已清理 `App.tsx` 中迁移后不再使用的 `Wallet` 图标 import；`X` 仍被其他弹窗使用，未删除。
- 已新增 `components/Finance/FinanceRecordModal.test.tsx`，覆盖默认支出模式标题/类别/创建、切换收入默认类别、收入关联项目显示回款节点、项目切换清空回款节点、供应商/部门空值写回 `null`、取消和关闭回调。
- 验证结果：
  - `npm run test:run -- components/Finance/FinanceRecordModal.test.tsx`：通过，1 个测试文件、6 个测试全部通过。
  - `npm run test:run`：通过，17 个测试文件、79 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `npm run lint`：通过，0 errors、50 warnings；warning 数量未增加，仍为既有 `any`、hook deps、JSX 文本转义等问题。
- 剩余风险：财务提交业务流程未迁入组件，本轮未改动后端 API；后续可继续评估权限弹窗、物料弹窗或项目编辑弹窗拆分。

### 2026-05-18 总控安排：第九轮批量任务池

- 已确认第八轮提交 `dc5fb89 抽出财务记录弹窗组件` 已落地，当前分支领先远端 2 个提交。
- 已复核 `App.tsx` 中 `isPermissionsModalOpen` 下仍保留权限管理弹窗内联 JSX，适合作为第九轮唯一触碰 `App.tsx` 的主线任务。
- 已复核 `App.tsx` 中 `isInventoryModalOpen` 下仍保留物料管理弹窗内联 JSX；本轮只安排组件和测试前置，不接入 `App.tsx`，避免冲突。
- 已复跑 `npm run lint`，确认当前仍为 0 errors、50 warnings；`utils/import.ts` 有 5 个低风险未使用变量 warning，可独立并行清理。
- 第九轮安排 3 个开发 agent 并行：Agent H 抽权限管理弹窗、Agent I 新建物料管理弹窗组件测试前置、Agent J 清理 `utils/import.ts` 未使用变量。
- 并行边界：Agent H 是唯一允许修改 `App.tsx` 的任务；Agent I 不接入 `App.tsx`；Agent J 只改 `utils/import.ts`。

### 2026-05-18 第九轮 Agent H：抽出权限管理弹窗组件

- 已新增 `components/Settings/PermissionsConfigModal.tsx`，负责权限管理弹窗的遮罩、标题、说明文案、页面访问权限、功能操作权限、系统配置、取消按钮和保存按钮。
- 已将 `App.tsx` 中 `isPermissionsModalOpen` 下的大段内联 JSX 替换为 `PermissionsConfigModal` 装配；`App.tsx` 继续负责 `permissions`、`configForm`、`handlePermissionChange`、`handleSavePermissions` 和 `handleSaveConfig`。
- 已保留原有行为：页面权限仍按 `.view` 分组，功能权限仍按非 `.view` 分组，角色勾选仍按 `(permissions[permission] || []).includes(role.id)` 判定，取消仍关闭弹窗并 `setConfigForm(config)` 重置表单，保存仍依次调用权限保存和系统配置保存。
- 已清理 `App.tsx` 中迁移后不再使用的 `Settings` 图标 import；`X` 仍被其他弹窗和 toast 使用，未删除。
- 已新增 `components/Settings/PermissionsConfigModal.test.tsx`，覆盖页面权限分组、功能权限分组、角色勾选状态、勾选回调、配置输入回调、取消/关闭/保存回调。
- 验证结果：
  - `npm run test:run -- components/Settings/PermissionsConfigModal.test.tsx`：通过，1 个测试文件、5 个测试全部通过。
  - `npm run test:run`：通过，19 个测试文件、89 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `npm run lint`：通过，0 errors、45 warnings；warning 数量保持 Agent J 清理后的 45 个，未新增警告。
- 剩余风险：权限保存和系统配置保存仍由 `App.tsx` 串行编排，本轮未改动后端 API；后续可继续安排 Agent K 接入已准备好的 `InventoryItemModal`。

### 2026-05-18 第九轮 Agent I：新建物料管理弹窗组件测试前置

- 已新增 `components/Inventory/InventoryItemModal.tsx`，从现有物料管理内联弹窗抽象出受控组件，覆盖新建/编辑标题、物料名称、规格参数、单位、参考单价、初始库存数量、低库存预警阈值、取消和提交按钮。
- 已新增 `components/Inventory/InventoryItemModal.test.tsx`，覆盖新建/编辑标题、字段显示与输入回调、阈值单位联动、取消/关闭回调、保存提交回调。
- 本轮未接入 `App.tsx`，后续 Agent K 可直接用该组件替换 `isInventoryModalOpen` 下的内联 JSX。
- 验证结果：
  - `npm run test:run -- components/Inventory/InventoryItemModal.test.tsx`：通过，1 个测试文件、5 个测试全部通过。
  - `npm run test:run`：通过，18 个测试文件、84 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
- 剩余风险：新物料管理弹窗组件尚未接入运行时页面，这是第九轮刻意保留给后续 Agent K 的串行任务。

### 2026-05-18 第九轮 Agent J：清理 utils/import.ts 低风险未使用变量

- 已将 `utils/import.ts` 中未使用的 JSON / Excel 解析异常参数改为无参数 `catch {}`。
- 已调整备份恢复中的项目、物料旧 ID 解构：使用 `oldProjectId`、`oldItemId` 参与 ID 映射，不再保留 `_oldId`、`_m` 等无用绑定；项目创建时仍强制传入空 `milestones`，不改变导入恢复语义。
- 未修改 `App.tsx`、`services/apiService.ts`、`components/Users/RoleManagement.tsx` 或其他 lint warning。
- 验证结果：
  - `npm run lint`：通过，0 errors、45 warnings；warning 数量从 50 降到 45，`utils/import.ts` 不再报告未使用变量 warning。
  - `npm run test:run`：通过，17 个测试文件、79 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
- 剩余风险：本轮只清理低风险未使用变量，剩余 45 个 lint warnings 仍集中在 `App.tsx`、`services/apiService.ts`、`components/Users/RoleManagement.tsx` 的既有 `any`、hook deps、未使用异常变量和 JSX 文本转义等问题，按任务范围未处理。

### 2026-05-18 第九轮批量任务汇总

- Agent H / I / J 均已完成并分别提交。
- 最新整体验收以 Agent H 完成后的工作区为准：
  - `npm run test:run`：通过，19 个测试文件、89 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `npm run lint`：通过，0 errors、45 warnings。
- 后续建议：Agent K 已接入 `InventoryItemModal`；后续继续拆弹窗时仍需遵守同一时间最多一个任务修改 `App.tsx` 的边界。

### 2026-05-18 Agent K：接入物料管理弹窗组件

- 已在 `App.tsx` 中引入 `components/Inventory/InventoryItemModal.tsx`，并将 `isInventoryModalOpen` 下的大段物料管理内联 JSX 替换为 `InventoryItemModal` 装配。
- `App.tsx` 继续负责 `inventoryForm` / `setInventoryForm`、`editingInventoryItem`、`handleSaveInventoryItem`、创建/更新后的库存刷新、toast 和弹窗开关；未改动后端 API 或物料提交流程。
- 已保留原有行为：新建/编辑标题、物料名称、规格参数、单位、参考单价、初始库存数量、低库存预警阈值、阈值单位联动、取消关闭、创建/更新按钮文案和提交回调。
- 已清理 `App.tsx` 中迁移后不再使用的 `Package` 图标 import；`X` 仍被其他弹窗和 toast 使用，未删除。
- 验证结果：
  - `npm run test:run -- components/Inventory/InventoryItemModal.test.tsx`：通过，1 个测试文件、5 个测试全部通过。
  - `npm run test:run`：通过，19 个测试文件、89 个测试全部通过。
  - `npm run build`：通过；仍有 Vite chunk 超过 500 kB 的既有提示。
  - `npm run lint`：通过，0 errors、45 warnings；warning 数量未增加。
- 剩余风险：物料提交业务流程仍由 `App.tsx` 负责，本轮仅接入既有组件；后续可继续评估项目编辑弹窗、驳回备注弹窗等高噪声区域。

## 17. 给开发 agent 的提示词

### 第一轮提示词（已完成）

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第一轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第一轮开发任务：恢复前端测试基线”。

目标：让前端单测恢复绿色，并保持构建通过。不要新增业务功能，不做大规模重构。

当前已知失败：
1. npm run test:run 失败，services/apiService.test.ts 有 6 个 localStorage.getItem is not a function 相关失败，触发点在 services/apiService.ts:getStoredToken()。
2. services/deepseekService.test.ts 有 4 个失败：测试期望导出 resolveChatCompletionsUrl，并支持 OPENROUTER_BASE_URL / OPENROUTER_API_KEY 等 OpenAI-compatible 配置；当前实现只读 DEEPSEEK_API_KEY 且固定 DeepSeek URL。

建议范围：
- tests/setup.ts
- services/apiService.test.ts
- services/deepseekService.ts
- services/deepseekService.test.ts
- 必要时小范围触碰 services/apiService.ts，但不要改变现有认证 header 语义。

验收命令：
- npm run test:run
- npm run build
- npm run lint
- 可尝试 mvn -q test；若仍是 Maven Central TLS 握手失败，只记录阻塞，不把它当代码失败。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：修复前端测试基线与 AI 接口配置。
```

### 第二轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第二轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第二轮开发任务：恢复后端 Maven 基线”。

目标：让 mvn -q test 至少通过编译并进入测试执行阶段，优先恢复后端质量门禁。不要新增业务功能，不要推进 App.tsx 拆分，不要为了绕开问题批量手写 Lombok 本应生成的 getter/setter。

当前已知情况：
1. npm run test:run 已通过，12 个测试文件、54 个测试全部通过。
2. mvn -q test 当前失败，核心错误集中在 Lombok 注解疑似未生效：
   - ContractController 的 @RequiredArgsConstructor 没生成构造器，final contractService 未初始化。
   - Contract、ChangeOrder、ProjectDocument、PaymentPlanItem、Project 等 @Data 没生成 getter/setter。
   - DingTalkIntegrationService、WorkflowNotifyService 的 @Slf4j 没生成 log 字段。
3. 本机 Maven 当前使用 Java 25.0.2，项目 pom.xml 目标 java.version 为 17；优先怀疑 Lombok 版本或 maven-compiler-plugin 注解处理配置与当前 JDK 不兼容。
4. Checkstyle 还报告 DataInitializer.run 方法 161 行超过 80 行，但当前 failOnViolation=false；除非它阻断构建，否则先不要扩大范围。

建议范围：
- pom.xml
- 必要时 checkstyle.xml
- 必要时少量 Java 文件用于处理编译通过后暴露出的真实错误；不要批量手写 getter/setter。

建议做法：
- 在 pom.xml 固定兼容当前 JDK 的 Lombok 版本。
- 配置 maven-compiler-plugin，明确 release=17，并配置 annotationProcessorPaths 使用同一 Lombok 版本。
- 复跑 mvn -q test；如果 Lombok 问题消失但出现真实测试失败，再小范围修复失败用例对应代码。

验收命令：
- mvn -q test
- npm run test:run
- npm run build

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有剩余后端风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：修复后端 Maven 编译基线。
```

### 第三轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第三轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第三轮开发任务：接入项目管理页面组件”。

目标：继续 Phase 5 结构收口，把 App.tsx 内联的项目管理页面 JSX 接入已有 components/Projects/ProjectManagementPage.tsx，让 App.tsx 只负责状态、权限与回调装配。不要新增业务模块，不改动后端 API。

当前已知情况：
1. mvn -q test 已通过。
2. npm run test:run 已通过，12 个测试文件、54 个测试全部通过。
3. npm run build 已通过，仍有 Vite chunk 超过 500 kB 的既有提示。
4. App.tsx 仍约 3011 行，activeTab === 'projects' 下仍手写项目管理页。
5. components/Projects/ProjectManagementPage.tsx 已存在，但当前没有被 App.tsx 使用。

建议范围：
- App.tsx
- components/Projects/ProjectManagementPage.tsx
- 新增或补充 components/Projects/ProjectManagementPage.test.tsx
- 必要时小范围调整测试 mock；不要扩大到其他业务页。

具体要求：
- 在 App.tsx 中引入并使用 ProjectManagementPage。
- 删除 App.tsx 中 activeTab === 'projects' 下重复的项目管理内联 JSX。
- 保留现有行为：详情页关闭/编辑/删除、里程碑刷新、列表/看板切换、导出 Excel、导入 Excel、新建项目、权限显隐。
- 注意 ProjectManagementPage.tsx 目前有“下载模板”按钮；接入时默认保持当前 App.tsx 的用户可见行为，不要无意新增按钮。若决定保留模板下载按钮，必须在执行记录中说明并补测试。
- 清理 App.tsx 中不再需要的 ProjectDetail、ProjectKanban、项目页专用图标或导出工具 import。
- 为 ProjectManagementPage 补组件测试，至少覆盖列表渲染和查看回调、看板切换回调、权限按钮显隐、详情模式返回/编辑/删除回调。

验收命令：
- npm run test:run
- npm run build
- mvn -q test
- 建议 npm run lint，并记录 warning 数量。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有剩余风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：接入项目管理页面组件。
```

### 第四轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第四轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第四轮开发任务：接入操作日志页面组件”。

目标：继续 Phase 5 结构收口，把 App.tsx 内联的操作日志页面 JSX 接入已有 components/History/OperationLogPage.tsx，让 App.tsx 只负责日志筛选状态、数据刷新、删除回调与权限装配。不要新增业务功能，不改动后端 API。

当前已知情况：
1. 第三轮已完成，App.tsx 当前约 2840 行。
2. mvn -q test 已通过。
3. npm run test:run 已通过，13 个测试文件、58 个测试全部通过。
4. npm run build 已通过，仍有 Vite chunk 超过 500 kB 的既有提示。
5. npm run lint 通过，0 errors、66 warnings。
6. components/History/OperationLogPage.tsx 已存在，但当前没有被 App.tsx 使用。

建议范围：
- App.tsx
- components/History/OperationLogPage.tsx
- 新增 components/History/OperationLogPage.test.tsx

具体要求：
- 在 App.tsx 中引入并使用 OperationLogPage。
- 删除 App.tsx 中 activeTab === 'history' 下重复的操作日志内联 JSX。
- 保留现有行为：操作人筛选、操作类型筛选、默认按时间倒序、无数据空态、log.delete 权限控制删除列和删除按钮。
- 将 App.tsx 内联删除日志流程抽成 handleDeleteLog(log: SystemLog)，传给 OperationLogPage。
- 保留旧删除行为：删除前 confirm，删除成功后刷新 systemLogs；若当前存在筛选条件，则按当前筛选条件刷新 historyFilteredLogs，否则置空使用全量列表；失败时展示 toast。
- 移除 App.tsx 中不再需要的 History 图标 import；不要顺手改其他页面。
- 为 OperationLogPage 补组件测试，至少覆盖时间倒序渲染、筛选回调、canDelete=false 隐藏删除入口、canDelete=true 删除回调、空态。

验收命令：
- npm run test:run
- npm run build
- mvn -q test
- 建议 npm run lint，并记录 warning 数量。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有剩余风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：接入操作日志页面组件。
```

### 第五轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第五轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第五轮开发任务：接入用户管理页面组件”。

目标：继续 Phase 5 结构收口，把 App.tsx 内联的用户管理页面 JSX 接入已有 components/Users/UserManagementPage.tsx，让 App.tsx 只负责用户列表状态、弹窗、增删改回调、toast 与权限入口。不要新增业务功能，不改动后端 API。

当前已知情况：
1. 第四轮已完成，最新提交为 757be30 接入操作日志页面组件并完成并行任务。
2. mvn -q test 已通过。
3. npm run test:run 已通过，15 个测试文件、68 个测试全部通过。
4. npm run build 已通过，仍有 Vite chunk 超过 500 kB 的既有提示。
5. npm run lint 通过，0 errors、66 warnings。
6. components/Users/UserManagementPage.tsx 已存在，并且 components/Users/UserManagementPage.test.tsx 已覆盖列表、角色标签、启用/禁用状态、搜索、新建/编辑/删除回调和空态。
7. App.tsx 当前仍直接渲染 activeTab === 'users' 下的用户管理页 JSX。

建议范围：
- App.tsx
- components/Users/UserManagementPage.tsx
- components/Users/UserManagementPage.test.tsx
- docs/AGENT_WORK_PLAN.md

具体要求：
- 在 App.tsx 中引入并使用 UserManagementPage。
- 删除 App.tsx 中 activeTab === 'users' 下重复的用户管理内联 JSX。
- 保留入口条件：!isLoading && activeTab === 'users' && currentUser.id === 'admin'。
- 保留现有行为：搜索框继续使用 userSearch / setUserSearch；新建调用 openUserModal()；编辑调用 openUserModal(user)；删除调用 handleDeleteUser(user)。
- 删除用户流程不能回退：禁止删除当前登录用户、删除前 confirm、删除成功刷新 users、失败展示 toast。
- 角色标签展示和搜索口径保持一致：ROLES[role]?.label ?? role；搜索同时匹配用户名和角色中文标签。
- 空列表继续显示“暂无用户”。
- 清理 App.tsx 中本轮迁移后不再需要的用户页专用 import，例如 User、Plus、Settings、Trash2；但先确认这些图标没有被其他页面继续使用。
- 不要顺手处理 hook deps、any 或其他页面的 lint warning。
- 如果为类型或回调适配调整 UserManagementPage props，必须同步调整 components/Users/UserManagementPage.test.tsx。

验收命令：
- npm run test:run
- npm run build
- mvn -q test
- 建议 npm run lint，并记录 warning 数量。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有剩余风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：接入用户管理页面组件。
```

### 第六轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第六轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第六轮开发任务：清理 App.tsx 明显未使用引用”。

目标：只清理 App.tsx 中 ESLint 明确报告的未使用 lucide 图标 import 和未使用常量 ROLE_OPTIONS。不要迁移页面，不改业务逻辑，不处理 any、hook deps、JSX 文本转义或其他文件的 lint warning。

当前已知情况：
1. 第五轮已完成，最新提交为 6b97e5b 接入用户管理页面组件。
2. npm run lint 当前通过，0 errors、66 warnings。
3. App.tsx 当前有 16 个可安全删除的未使用引用：
   - LayoutDashboard
   - TrendingUp
   - AlertTriangle
   - ChevronRight
   - CheckSquare
   - Search
   - Filter
   - ChevronDown
   - BarChart2
   - Truck
   - FileEdit
   - FileText
   - Receipt
   - HandCoins
   - Smartphone
   - ROLE_OPTIONS

建议范围：
- App.tsx
- docs/AGENT_WORK_PLAN.md

具体要求：
- 从 App.tsx 的 lucide-react import 中移除上述 15 个未使用图标。
- 删除 const ROLE_OPTIONS = Object.values(ROLES);。
- 不要处理 App.tsx 中的 any warning。
- 不要处理 react-hooks/exhaustive-deps warning。
- 不要处理 react/no-unescaped-entities warning。
- 不要修改 services/apiService.ts、utils/import.ts、components/Users/RoleManagement.tsx 等其他文件。
- 不要顺手做库存/财务弹窗拆分或其他页面抽离。

验收命令：
- npm run lint
- npm run test:run
- npm run build

预期结果：
- npm run lint 仍为 0 errors。
- warning 数量应从 66 降到约 50。
- 如果 warning 数量没有下降到预期附近，先复核是否误留了未使用引用；不要为了追 warning 数量扩大处理范围。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明删除了哪些引用、lint warning 数量变化、验证命令结果和剩余风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：清理应用入口未使用引用。
```

### 第七轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第七轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第七轮开发任务：抽出库存出入库弹窗组件”。

目标：继续 Phase 5 结构收口，把 App.tsx 中 isStockModalOpen 下的库存入库/出库弹窗 JSX 抽成 components/Inventory/StockMovementModal.tsx。不要改变库存业务流程，不改后端 API，只迁移弹窗展示和表单输入边界；App.tsx 继续负责弹窗开关、库存提交、数据刷新、toast 与权限入口。

当前已知情况：
1. 第六轮已完成，最新提交为 ca9da26 清理应用入口未使用引用。
2. npm run lint 已通过，0 errors、50 warnings。
3. npm run test:run 已通过，15 个测试文件、69 个测试全部通过。
4. npm run build 已通过，仍有 Vite chunk 超过 500 kB 的既有提示。
5. App.tsx 当前仍直接渲染 isStockModalOpen 下的库存出入库弹窗。
6. 当前没有现成 StockMovementModal 组件，需要新建组件和测试。

建议范围：
- App.tsx
- components/Inventory/StockMovementModal.tsx
- components/Inventory/StockMovementModal.test.tsx
- docs/AGENT_WORK_PLAN.md

具体要求：
- 新建 StockMovementModal 组件，负责渲染遮罩、标题、物料选择、出库项目选择、入库供应商选择、数量输入、取消和确认按钮。
- 继续复用 components/ui/SearchableSelect，不要改 SearchableSelect 本身。
- 在 App.tsx 中引入并使用 StockMovementModal。
- 删除 App.tsx 中 isStockModalOpen 下重复的库存出入库弹窗内联 JSX。
- App.tsx 继续持有 stockModalType、selectedItemId、stockAmount、targetProjectId、stockSupplierId 等状态。
- App.tsx 继续持有并调用 handleStockSubmit，不要把 apiService.createStockLog 或 reloadCoreData 移动进组件。
- 保留现有行为：入库标题“物料入库登记”、绿色头部、“确认入库”；出库标题“物料出库申请”、蓝色头部、“确认出库”。
- 物料选项仍显示 `${name} (${spec})`。
- 出库时显示“关联项目”，入库时显示“供应商（可选）”。
- 数量标签仍显示当前物料单位。
- 关闭按钮和取消按钮仍只关闭弹窗，不重置其他状态。
- 确认按钮仍调用 handleStockSubmit。
- App.tsx 中如果 Plus、ArrowRightLeft 不再被其他区域使用，应删除；X、Package、Wallet 等图标仍可能被其他弹窗使用，删除前必须确认。

测试要求：
- 新增 components/Inventory/StockMovementModal.test.tsx。
- 至少覆盖：入库模式标题/供应商/确认入库、出库模式标题/项目/确认出库、物料选择回调、数量输入回调、取消和关闭回调。
- 如果 SearchableSelect 在测试里交互复杂，可以用可观察文本和关键回调做最小有效覆盖，但不要只做快照。

验收命令：
- npm run test:run -- components/Inventory/StockMovementModal.test.tsx
- npm run test:run
- npm run build
- 建议 npm run lint，并记录 warning 数量。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有剩余风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：抽出库存出入库弹窗组件。
```

### 第八轮提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第八轮开发任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第八轮开发任务：抽出财务记录弹窗组件”。

目标：继续 Phase 5 结构收口，把 App.tsx 中 isFinanceModalOpen 下的新增财务记录弹窗 JSX 抽成 components/Finance/FinanceRecordModal.tsx。不要改变财务创建业务流程，不改后端 API；App.tsx 继续负责弹窗开关、financeForm 状态、分类/回款节点加载、提交、数据刷新和 toast。

当前已知情况：
1. 第七轮已完成，最新提交为 ed236cd 抽出库存出入库弹窗组件。
2. npm run lint 已通过，0 errors、50 warnings。
3. npm run test:run 已通过，16 个测试文件、73 个测试全部通过。
4. npm run build 已通过，仍有 Vite chunk 超过 500 kB 的既有提示。
5. App.tsx 当前仍直接渲染 isFinanceModalOpen 下的“新增财务记录”弹窗。
6. 当前没有现成 FinanceRecordModal 组件，需要新建组件和测试。

建议范围：
- App.tsx
- components/Finance/FinanceRecordModal.tsx
- components/Finance/FinanceRecordModal.test.tsx
- docs/AGENT_WORK_PLAN.md

具体要求：
- 新建 FinanceRecordModal 组件，负责渲染遮罩、标题、类型、类别、金额、关联项目、关联部门、回款计划节点、供应商、备注、取消和创建按钮。
- 继续复用 components/ui/SearchableSelect，不要改 SearchableSelect 本身。
- 在 App.tsx 中引入并使用 FinanceRecordModal。
- 删除 App.tsx 中 isFinanceModalOpen 下重复的新增财务记录弹窗内联 JSX。
- App.tsx 继续持有 financeForm / setFinanceForm，继续持有 handleSaveFinance。
- 不要把 apiService.createFinanceRecord、reloadCoreData、getFinanceCategories、getPaymentPlansByProject 移动进组件。
- 标题仍为“新增财务记录”，绿色头部。
- 类型选项仍为“收入 / 支出”。
- 类型切换时仍同步设置默认类别：收入为“项目收款”，支出为“材料采购”。
- 收入类别选项仍固定为“项目收款”；支出类别仍来自 financeCategories。
- 关联项目选择为空时 projectId 为 null，且切换项目时清空 paymentPlanItemId。
- 关联部门、回款计划节点、供应商选择为空时分别写回 null。
- 仅当 financeForm.type === 'income' && financeForm.projectId != null 时显示“计入回款计划节点（可选）”。
- 取消和关闭按钮仍只关闭弹窗。
- 创建按钮仍调用 handleSaveFinance。
- App.tsx 中如果 Wallet 不再被其他区域使用，应删除；X 仍可能被其他弹窗使用，删除前必须确认。

测试要求：
- 新增 components/Finance/FinanceRecordModal.test.tsx。
- 至少覆盖：默认支出模式标题/类别/创建，切换收入时类别回调，收入且有关联项目时显示回款计划节点，项目选择会清空回款节点，供应商/部门空值回写 null，取消和关闭回调。
- 如果 SearchableSelect 交互复杂，可以用可观察文本和关键回调做最小有效覆盖，但不要只做快照。

验收命令：
- npm run test:run -- components/Finance/FinanceRecordModal.test.tsx
- npm run test:run
- npm run build
- 建议 npm run lint，并记录 warning 数量。

完成要求：
- 更新 docs/AGENT_WORK_PLAN.md 的“执行记录”，写明改了什么、跑了哪些命令、结果如何、是否还有剩余风险。
- git status --short 确认只包含本任务相关改动。
- 及时提交，提交信息使用中文，建议为：抽出财务记录弹窗组件。
```

### 第九轮批量提示词

```text
你现在接手 /Users/cloudjiang/Projects/personal/Hongshuo-ERP-AI 的第九轮批量任务。请先阅读 docs/AGENT_WORK_PLAN.md，重点执行其中“第九轮批量任务池：权限弹窗主线 + 并行前置清理”。

本轮可以同时开 3 个开发 agent，但必须遵守边界：
- Agent H 是唯一允许修改 App.tsx 的任务。
- Agent I 不接入 App.tsx，只新建物料管理弹窗组件和测试。
- Agent J 只改 utils/import.ts 和 docs/AGENT_WORK_PLAN.md。
- 三者完成后，再安排 Agent K 接入 InventoryItemModal。不要让 K 和 H 同时进行。

Agent H：抽出权限管理弹窗组件
目标：把 App.tsx 中 isPermissionsModalOpen 下的权限管理弹窗 JSX 抽成 components/Settings/PermissionsConfigModal.tsx。App.tsx 继续负责 permissions、configForm、handlePermissionChange、handleSavePermissions、handleSaveConfig。
建议范围：
- App.tsx
- components/Settings/PermissionsConfigModal.tsx
- components/Settings/PermissionsConfigModal.test.tsx
- docs/AGENT_WORK_PLAN.md
保留行为：
- 页面级权限仍按 permission.endsWith('.view') 分组。
- 功能权限仍按非 .view 分组。
- 权限中文标签保持现有映射。
- 勾选框仍以 (permissions[permission] || []).includes(role.id) 判定。
- 取消仍关闭弹窗并 setConfigForm(config) 重置表单。
- 保存按钮仍显示“保存所有配置”，并依次调用 handleSavePermissions() 和 handleSaveConfig()。
验收：
- npm run test:run -- components/Settings/PermissionsConfigModal.test.tsx
- npm run test:run
- npm run build
- 建议 npm run lint
提交信息建议：抽出权限管理弹窗组件

Agent I：新建物料管理弹窗组件测试前置
目标：新建 components/Inventory/InventoryItemModal.tsx 和 components/Inventory/InventoryItemModal.test.tsx，但不要接入 App.tsx。
建议范围：
- components/Inventory/InventoryItemModal.tsx
- components/Inventory/InventoryItemModal.test.tsx
- docs/AGENT_WORK_PLAN.md
组件要求：
- 从当前 App.tsx 的 isInventoryModalOpen 内联物料管理弹窗抽象而来。
- 渲染标题“新建物料/编辑物料”、物料名称、规格参数、单位、参考单价、初始库存数量、低库存预警阈值、取消和保存按钮。
- 接收 inventoryForm、editingInventoryItem、onInventoryFormChange、onClose、onSubmit。
测试至少覆盖：
- 新建/编辑标题。
- 字段显示与输入回调。
- 阈值单位联动。
- 取消回调。
- 保存回调。
验收：
- npm run test:run -- components/Inventory/InventoryItemModal.test.tsx
- npm run test:run
- npm run build
提交信息建议：补充物料管理弹窗组件

Agent J：清理 utils/import.ts 低风险未使用变量
目标：只处理 utils/import.ts 中 ESLint 明确报告的未使用变量 warning，不处理其他文件。
建议范围：
- utils/import.ts
- docs/AGENT_WORK_PLAN.md
当前目标：
- 第 26 行 e
- 第 56 行 _oldId
- 第 56 行 _m
- 第 62 行 _oldId
- 第 116 行 e
要求：
- catch 参数如果未使用，优先改成无参数 catch {}。
- 对解构出的未使用字段，优先调整解构或删除无用绑定，不改变导入解析语义。
- 不处理 App.tsx、apiService.ts、RoleManagement.tsx 的 warning。
验收：
- npm run lint
- npm run test:run
- npm run build
预期：npm run lint 仍为 0 errors，warning 数量从 50 降到约 45。
提交信息建议：清理导入工具未使用变量
```
