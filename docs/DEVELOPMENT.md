# 开发文档

## 项目架构

- **前端**: React 19 + TypeScript + Vite，单页应用，侧边栏 Tab 切换（仪表盘、项目管理、物料仓库、物料管理、财务收支、供应商管理、变更/签证单、报表、操作日志、AI 决策室、用户管理、角色管理、权限管理）。
- **后端**: Spring Boot 3.2，REST API，JPA + H2。
- **AI**: 前端调用 DeepSeek API（AI 决策室，见 `services/deepseekService.ts`）。

## 开发环境

- Node.js >= 18，npm >= 9
- Java 17，Maven 3.6+

## 本地运行

```bash
# 后端
mvn spring-boot:run

# 前端（新终端）
npm install && npm run dev
```

- 前端: http://localhost:3000
- 后端 API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html

## 代码规范

- 前端: `npm run lint` / `npm run format`，提交前执行 `lint-staged`（见 [CODE_QUALITY.md](./CODE_QUALITY.md)）。
- 后端: `mvn checkstyle:check` 或 `mvn validate`（已配置 checkstyle.xml），单元测试 `mvn test`。

## 测试

- 前端: `npm run test` 或 `npm run test:run`
- 后端: `mvn test`

## 目录说明

- `components/` 前端组件（Dashboard、ProjectDetail、Reports、Login、Users、Suppliers、ChangeOrders、ui 等）
- `services/` 前端 API 与 AI 服务（apiService、deepseekService 等）
- `utils/` 工具（导出、导入、AI 历史等）
- `src/main/java/com/hongshuo/erp/` 后端包（controller / service / repository / model / config）
