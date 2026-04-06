# 宏硕 ERP 代码结构重构方案（Phase 5 架构版）

> 目标：在不推翻现有业务能力的前提下，重构前后端代码结构，降低模块耦合，提升可维护性、可测试性与后续迭代速度。

---

## 1. 现状问题（结构层面）

### 前端

- `App.tsx` 体量过大，承担路由、权限、数据加载、状态管理、业务编排、UI 逻辑等多重职责。
- 组件按页面目录组织为主，但缺少统一的「领域模块」边界（如 finance/project/inventory）。
- API 调用、类型、业务规则分散，跨模块复用成本高。

### 后端

- Controller / Service / Repository 分层清晰，但跨域业务（审批、预警、成本口径）存在隐式耦合。
- 缺少显式的领域边界（如 Contract、Finance、Project 的跨域规则聚合）。
- 缺少统一应用层（UseCase / Application Service）承接复杂流程，Service 容易膨胀。

---

## 2. 重构目标

1. **领域化模块组织**：按业务域分包（project、finance、inventory、approval...），而不是按技术类型散落。
2. **分层职责明确**：页面层不直接拼业务规则；规则集中到 domain/application 层。
3. **可测试优先**：将可纯函数化逻辑提取为可测模块（如预警聚合、预算校验、状态流转）。
4. **渐进式迁移**：保证线上功能稳定，采用「双轨过渡 + 分阶段迁移」。

---

## 3. 目标代码结构（建议）

## 3.1 前端（React + TS）

```text
frontend/
  src/
    app/                       # 应用壳层：路由、全局 Provider、权限网关、布局
      router/
      providers/
      guards/
    shared/                    # 跨域复用：UI 基础组件、hooks、工具、类型
      ui/
      hooks/
      utils/
      constants/
    modules/                   # 领域模块（核心）
      project/
        pages/
        components/
        api/
        model/                 # 类型、mapper、schema
        services/              # 领域逻辑（纯函数优先）
        store/                 # 模块状态（如 zustand/reducer）
        __tests__/
      finance/
      inventory/
      approval/
      contract/
      dashboard/
    legacy/                    # 迁移过渡区（旧组件/旧页面）
```

### 前端关键约束

- `app` 不写领域规则，只负责装配。
- `modules/*/api` 只做 IO；业务判断放 `services`。
- `shared` 不依赖任何 `modules`，只允许单向依赖：`app -> modules -> shared`。
- 新增功能优先写在 `modules`，旧代码逐步从 `legacy` 迁出。

---

## 3.2 后端（Spring Boot）

```text
src/main/java/com/hongshuo/erp/
  common/                      # 通用：异常、响应封装、安全、审计、工具
  modules/
    project/
      api/                     # Controller
      application/             # UseCase / ApplicationService
      domain/                  # Entity、DomainService、Policy
      infrastructure/          # Repository实现、外部集成
    finance/
    inventory/
    approval/
    contract/
    dashboard/
```

### 后端关键约束

- `api` 仅做协议转换与鉴权，不写核心业务。
- 跨域流程放 `application` 编排（如审批通过后的多实体联动）。
- 规则沉淀到 `domain`（如预算阈值、成本口径、状态机）。
- 外部系统（钉钉、AI）统一走 `infrastructure/integration`。

---

## 4. 迁移路线（4 个迭代）

## Iteration 1（1~2 周）：切壳不切肉

- 前端拆分 `App.tsx`：抽离路由、菜单、权限、数据加载到 `app/*`。
- 后端建立 `modules/*` 包骨架，新代码按新结构落位。
- 引入依赖约束（ESLint import rules + ArchUnit 可选）。

## Iteration 2（2~3 周）：高频域先迁移

- 先迁移 `dashboard + finance + approval`（高耦合、变化快）。
- 抽离预警、审批状态流转等规则为可测服务。
- 补齐模块级测试（unit + integration）。

## Iteration 3（2~3 周）：项目与库存域迁移

- 迁移 `project + inventory + contract`。
- 清理 legacy 调用链，统一 API Client 与 DTO 映射。
- 建立模块公开接口（barrel exports）。

## Iteration 4（1~2 周）：收口与治理

- 删除 legacy 目录中的废弃实现。
- 完成结构文档、编码规范、脚手架模板。
- 设立 CI 质量门禁（覆盖率阈值、循环依赖检查、lint/typecheck）。

---

## 5. 第一批落地清单（建议立即执行）

1. 新增 `app/router` 与 `modules/dashboard`，把仪表盘相关从 `App.tsx` 迁移出去。
2. 为每个 `modules/*` 建立统一目录模板与 `index.ts` 出口。
3. 把「预警聚合、预算校验、审批状态转换」统一进入模块 `services` 并补齐测试。
4. 在 PR 模板增加架构检查项：是否新增跨模块反向依赖。

---

## 6. 验收标准（结构重构）

- 新功能代码 **100% 落在 `modules/*`**，不再新增 `App.tsx` 业务逻辑。
- 每个模块至少包含 `api + model + services + tests` 四类目录。
- 核心规则具备独立单测，不依赖 React 组件渲染。
- CI 可以阻止跨层违规依赖（如 shared 反向依赖 modules）。

---

## 7. 风险与规避

- **风险：** 迁移期出现双实现并存，行为偏差。  
  **规避：** 关键流程启用对照测试（旧逻辑 vs 新逻辑输出一致）。

- **风险：** 团队短期开发效率下降。  
  **规避：** 先迁移高收益模块，保留 legacy 兜底，分批切换。

- **风险：** 架构约束落地不彻底。  
  **规避：** 以 lint/CI 规则强制执行，避免仅靠约定。

---

该方案可作为 Phase 5 的结构主线：先把“能跑”升级为“能持续演进”。
