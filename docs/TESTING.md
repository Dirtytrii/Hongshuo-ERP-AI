# 自动化测试与修复流程

本文档说明宏硕 ERP 项目的自动化测试结构及“先测后修”的缺陷修复流程。**AI 决策室模块不纳入自动化测试范围。**

## 测试分层

- **后端**：JUnit 5 + Spring Boot Test + MockMvc（Controller）、Mockito（Service）
- **前端**：Vitest + React Testing Library
- **E2E**：Playwright（Chromium）

## 本地运行测试

```bash
# 后端单元/集成测试
mvn test

# 前端单元/组件测试
npm run test:run

# E2E（需先启动后端：`mvn spring-boot:run`；Playwright 会通过 webServer 自动启动前端并访问 http://localhost:3000）
npm run test:e2e
```

### 前端单元测试（Vitest）

- 使用 **Vitest + React Testing Library** 运行前端单元/组件测试，命令为：`npm run test:run`
- 当前重点覆盖模块：
  - 仪表盘（Dashboard）：核心统计卡片渲染、项目进度图点击回调、财务卡片点击回调
  - 报表组件：`FinanceReport` / `InventoryReport` 的筛选逻辑与导出 Excel 按钮调用
  - 项目详情：`ProjectDetail` 的基础信息展示与返回/编辑/删除等关键交互回调
  - 前端服务层：`apiService` 主要接口在成功与错误场景下的行为

## 缺陷修复流程（先测后修）

1. **定位**：根据失败用例或报错日志，确定涉及的 Controller / Service / 组件。
2. **补充或调整测试**：为问题编写或修改测试，**先重现缺陷**（在未修复时代码下测试应失败）。
3. **修复代码**：修改实现，确保不破坏 AI 决策室等未覆盖模块。
4. **回归**：本地执行 `mvn test`、`npm run test:run`，必要时再跑 `npm run test:e2e`；CI 全部通过后再合并。

## CI

PR 会触发 GitHub Actions：`backend-tests`、`frontend-tests`、`e2e-tests`。三者均通过后才可合并。

## 覆盖范围

- 项目管理（含里程碑）、物料与库存、财务收支、操作日志的接口与核心业务逻辑；前端仪表盘、项目详情、导航与权限。
- E2E 覆盖主导航、项目管理/项目列表/详情入口、物料仓库与财务收支页面可访问性。

### 财务审批 → 项目成本/收入回写链路

- **后端集成测试类**
  - `FinanceProjectIntegrationTest`（Service 级）
    - `approveExpense_shouldIncreaseProjectMaterialCost`：验证审批通过「支出 + costType=material」时，项目 `materialCost` 是否按金额累加。
    - `approveIncome_shouldIncreaseProjectReceivedAmount`：验证审批通过「收入」时，项目 `receivedAmount` 是否按金额累加。
  - `FinanceProjectHttpIntegrationTest`（HTTP 级，MockMvc + H2）
    - 通过真实 HTTP 调用 `/api/finance/{id}/approve`，配合 H2 + JPA，验证审批后项目成本/已收款的最终落库值。

- **本地/CI 运行方式**
  - 本地仅跑该链路相关后端测试：
    ```bash
    mvn test -Dtest=FinanceProjectIntegrationTest,FinanceProjectHttpIntegrationTest
    ```
  - CI 中会在 `backend-tests` Job 里执行 `mvn test`，上述两个类会随全量测试一起运行，用于回归「财务审批 → 项目成本/收入回写」的关键业务路径。
