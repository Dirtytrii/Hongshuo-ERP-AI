# 启动指南（前端 / 后端 / 小程序）

本文档汇总宏硕建设 ERP 项目的本地启动方式，包括 **后端 Spring Boot**、**前端 Web 应用** 与 **微信小程序端**。

---

## 一、前置环境

- **Java 17+**（推荐 Temurin 发行版）
- **Maven 3.6+**
- **Node.js 18+，npm 9+**
- **微信开发者工具**（如需启动小程序端）

可在项目根目录执行：

```bash
java -version
mvn -v
node -v
npm -v
```

---

## 二、后端（Spring Boot）

后端位于 `src/main/java/com/hongshuo/erp`，使用 Spring Boot 3.2 + JPA + H2。

### 1. 本地运行

在项目根目录执行：

```bash
mvn spring-boot:run
```

默认配置：

- API 基础地址：`http://localhost:8080/api`
- H2 内存数据库（开发用）
- Swagger UI：`http://localhost:8080/swagger-ui.html`

如需打包可执行 Jar：

```bash
mvn clean package -DskipTests
java -jar target/erp-0.0.1-SNAPSHOT.jar
```

### 2. 常见问题

- 如前端提示「后端连接失败」，请确认 8080 端口未被占用且上述命令已成功启动。
- 如需改用外部数据库（MySQL/PostgreSQL），请在 `application.properties` 中调整 `spring.datasource.*` 配置。

---

## 三、前端（React + Vite）

前端为 React 19 + TypeScript + Vite 单页应用，入口为 `index.tsx` / `App.tsx`，主要代码在 `components/`、`services/`、`utils/`。

### 1. 安装依赖

在项目根目录执行（首次或依赖更新后）：

```bash
npm install
```

### 2. 本地开发启动

```bash
npm run dev
```

启动后访问：

- 前端地址：`http://localhost:3000`

Playwright E2E 测试也会以此地址为 baseURL。

### 3. 环境变量（AI 决策室）

AI 决策室使用 DeepSeek API，需在项目根目录配置 `.env`（或 `.env.local`）：

```env
DEEPSEEK_API_KEY=你的_DeepSeek_API_Key
```

`vite.config.ts` 会将该变量注入到前端运行环境，`services/deepseekService.ts` 会从 `process.env.DEEPSEEK_API_KEY` 读取。

### 4. 构建产物

```bash
npm run build
```

构建后静态文件位于 `dist/`，可配合 Nginx 或 Docker（见 `docs/DEPLOYMENT.md` 与 `Dockerfile.frontend`）进行部署。

---

## 四、微信小程序端（miniprogram）

小程序目录：`miniprogram/`，面向项目经理与管理层，提供项目摘要与预警仪表盘。

### 1. 使用前配置

1. **申请小程序**
   - 在微信公众平台注册小程序，获取 **AppID**。

2. **修改 `project.config.json`**
   - 将 `"appid": "请填写小程序 AppID"` 修改为你自己的 AppID。

3. **配置后端地址**
   - 编辑 `miniprogram/utils/config.js`，将 `BASE_URL` 改为实际后端 API 地址（生产环境需为 HTTPS，如 `https://api.xxx.com`）。
   - 在微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名，将该后端域名加入 **request 合法域名**。

4. **保证后端已运行**
   - 本地联调时，需确保第「二、后端」中提到的 Spring Boot 服务已启动，并能通过配置的 `BASE_URL` 访问到 `/api` 接口。

### 2. 在微信开发者工具中运行

1. 打开「微信开发者工具」。
2. 选择「导入项目」，将项目目录指向本仓库中的 `miniprogram` 目录。
3. 填写刚才配置的 AppID。
4. 导入后即可：
   - 在模拟器中预览功能；
   - 点击「预览」扫码在真机上体验。

### 3. 接口与登录

- 小程序与 Web 前端共用后端接口，认证方式为：

  ```http
  Authorization: Bearer <token>
  ```

- 登录接口：`POST /api/auth/login`，使用与 Web 端一致的账号密码。
- 其他接口依赖见 `miniprogram/README.md` 中的「接口依赖」说明。

---

## 五、推荐启动组合（本地联调）

开发或联调时，推荐按以下顺序启动：

1. **启动后端**
   - 终端 A：在项目根目录运行 `mvn spring-boot:run`。
2. **启动前端**
   - 终端 B：在项目根目录运行 `npm run dev`，浏览器访问 `http://localhost:3000`。
3. **启动小程序端（可选）**
   - 打开微信开发者工具，导入 `miniprogram` 目录，确保 `BASE_URL` 指向可访问的后端地址。

如需更详细的业务与模块说明，可结合以下文档阅读：

- `docs/DEVELOPMENT.md`：开发架构与目录说明
- `docs/DEPLOYMENT.md`：部署与 Docker 说明
- `docs/USER_GUIDE.md`：用户操作指南
- `docs/红字冲销业务规则与验收标准.md`：红字冲销业务规则与验收标准
