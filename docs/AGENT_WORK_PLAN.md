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

## 6. 第二轮候选任务

第一轮完成并提交后，再安排以下任务，暂不同时开工：

1. Phase 5 继续切分 `App.tsx`。
   - 优先抽离项目列表/详情路由编排、库存弹窗编排、财务弹窗编排等高噪声区域。
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

## 7. 执行记录

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

## 8. 给开发 agent 的首轮提示词

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
