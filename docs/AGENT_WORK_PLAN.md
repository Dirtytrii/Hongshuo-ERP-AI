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

## 8. 后续候选任务

第三轮完成并提交后，再安排以下任务，暂不同时开工：

1. 继续按页面域切分 `App.tsx`。
   - 优先抽离库存弹窗编排、财务弹窗编排、用户/权限管理等高噪声区域。
   - 每次只迁移一个页面域，迁移前后补或保留测试。

2. 清理 lint warnings。
   - 先清理 `App.tsx` 未使用 imports 与明显 `any`。
   - hook deps 需要谨慎处理，避免引入重复加载或无限循环。

3. 性能与包体优化。
   - 继续 lazy load 大页面和报表/Excel/AI 相关依赖。
   - 以 `npm run build` 的 chunk 结果作为验收依据。

4. Maven/JDK 基线整理。
   - 统一本地 Java 版本到 17 或至少验证 Java 21/25 下的兼容性。
   - 处理 Maven Central 拉取失败的环境问题后再评价后端测试真实状态。

## 9. 执行记录

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

## 10. 给开发 agent 的提示词

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
