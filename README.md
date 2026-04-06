# 宏硕建设 ERP 系统 (Hongshuo Construction ERP)

<div align="center">

一个基于 React + Spring Boot 的现代化建筑行业 ERP 管理系统，集成 Google Gemini AI 智能分析功能。

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)

</div>

## 📋 项目简介

宏硕建设 ERP 系统是一个专为建筑/工程公司设计的轻量级 ERP 管理系统，覆盖「项目-物料-财务」的完整闭环，并引入 AI 智能决策分析，帮助管理层从数据视角看项目进度、成本和风险。

### 核心特性（当前版本）

- 🏗️ **项目管理**
  - 以项目为中心管理合同金额、已收款、材料/人工/其他成本、净利润、利润率
  - 里程碑驱动进度：进度按「已完成里程碑数 / 总里程碑数」自动计算
  - 项目详情联动财务与出库记录，展示出库材料金额与成本分析

- 📦 **物料与库存**
  - 实时库存、入库登记、出库申请与审批
  - 低库存预警与消息中心提醒
  - 项目详情中按项目展示物料使用明细（名称、规格、数量、单位）

- 💰 **财务收支与成本闭环**
  - 财务记录按类别与成本类型（材料/人工/其他）分类
  - 审批通过后自动回写到项目材料/人工/其他成本与已收款
  - 仪表盘与报表中统一口径的收入/支出/净收益与趋势

- 📊 **仪表盘与报表**
  - 仪表盘侧重「当下」：在建项目数、出库量、库存预警、待审批、项目进度柱状图、财务趋势图等
  - 报表侧重「分析」：财务报表、库存报表、项目成本利润表，支持按项目/时间/成本类型筛选与导出

- 👤 **用户与角色管理**
  - 登录认证（基于 Token 的简单会话管理）
  - 用户管理：创建/编辑/禁用用户，分配角色
  - 角色管理：支持自定义角色，内置 `admin / pm / finance / clerk`，并与权限配置联动
  - 权限管理：通过 UI 编辑「权限键 → 角色」映射，精细控制页面与按钮可见性

- 🤖 **AI 决策室（可选）**
  - 集成 Google Gemini，用于对项目、库存、财务数据进行自然语言分析与策略建议
  - 支持常见场景：库存预警分析、成本异常提示、项目进度与成本对比等

- 📝 **操作日志与备份**
  - 系统操作日志查询与导出，关键操作留痕
  - 一键导出/恢复应用状态，方便演示和测试数据重置

## 🛠️ 技术栈

### 前端

- **React 19.2.0** - UI 框架
- **TypeScript 5.8.2** - 类型安全
- **Vite 6.2.0** - 构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **Recharts** - 图表库
- **Google Gemini AI** - AI 分析引擎

### 后端

- **Spring Boot 3.2.0** - Java 框架
- **Spring Data JPA** - 数据持久化
- **H2 Database** - 嵌入式数据库
- **Lombok** - 代码简化
- **Java 17** - 编程语言

## 📁 项目结构

```
Hongshuo-ERP-AI/
├── src/                          # 前端源代码
│   ├── main/
│   │   └── java/                 # Java 后端代码
│   │       └── com/hongshuo/erp/
│   │           ├── controller/   # REST API 控制器
│   │           ├── model/        # 数据模型
│   │           ├── repository/   # 数据访问层
│   │           ├── service/      # 业务逻辑层
│   │           └── config/       # 配置类
│   └── resources/
│       └── application.properties # 应用配置
├── components/                   # React 组件
│   ├── Dashboard/                # 仪表盘与图表
│   ├── ProjectDetail/            # 项目详情与里程碑、成本分析
│   ├── Reports/                  # 财务/库存/项目报表
│   ├── Login/                    # 登录页面
│   └── Users/                    # 用户管理、角色管理
├── services/                     # 前端服务
│   ├── apiService.ts             # API 调用与认证
│   └── geminiService.ts          # AI 分析服务（如启用）
├── data/                         # 数据与权限配置
│   ├── hongshuo_erp.mv.db        # H2 数据库文件
│   └── permissions.properties    # 角色-权限配置（运行时可编辑）
├── App.tsx                       # 前端主应用组件
├── types.ts                      # TypeScript 类型定义
├── package.json                  # 前端依赖配置
├── pom.xml                       # Maven 配置
└── vite.config.ts               # Vite 配置
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Java** >= 17
- **Maven** >= 3.6

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd Hongshuo-ERP-AI
```

#### 2. 配置环境变量

在项目根目录创建 `.env` 文件（或 `.env.local`）：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> 💡 **获取 API Key**: 访问 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取 Gemini API Key

#### 3. 安装前端依赖

```bash
npm install
```

#### 4. 编译后端项目

```bash
mvn clean install
```

#### 5. 启动后端服务

```bash
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

#### 6. 启动前端开发服务器

```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

### 访问应用

打开浏览器访问：`http://localhost:3000`

## ⚙️ 配置说明

### 后端配置 (`application.properties`)

```properties
# 服务器端口
server.port=8080

# 数据库配置
spring.datasource.url=jdbc:h2:file:./data/hongshuo_erp
spring.datasource.username=sa
spring.datasource.password=

# 数据初始化配置
# true: 每次启动都重置数据
# false: 只在数据库为空时初始化
app.data.reset-on-startup=false

# H2 控制台（开发环境）
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

### 前端配置 (`vite.config.ts`)

- 开发服务器端口：`3000`
- 服务器地址：`0.0.0.0`（允许局域网访问）
- API 代理：后端 API 地址为 `http://localhost:8080`

## 👥 用户、角色与权限模型

系统内置四种典型角色，并支持自定义角色。角色与权限的关系为：

> 用户 → 角色（Role.code）→ 权限键（permission key）→ 控制页面/按钮可见性

### 内置角色示例

- **管理员 (admin)**
  - 管理所有业务模块
  - 管理用户、角色与权限配置
  - 数据重置与备份/恢复

- **项目经理 (pm)**
  - 管理项目与里程碑
  - 审批出库申请
  - 查看财务与报表

- **财务 (finance)**
  - 维护财务收支记录
  - 审批财务支出/收入
  - 查看项目成本与财务报表

- **录入员 (clerk)**
  - 维护物料信息与库存
  - 提交出库申请
  - 配合项目与财务完成一线录入工作

### 自定义角色与权限管理

- 可在「角色管理」中新增/编辑/删除非内置角色，并查看每个角色绑定的用户数。
- 可在「权限管理」中为任意角色勾选具体权限键（如 `projects.view`、`inventory.create`、`finance.approve.normal` 等），界面会自动根据当前角色集合动态更新。
- 权限配置会持久化到 `data/permissions.properties`，重启后仍然生效。

## 🤖 AI 决策室功能（可选）

AI 决策室集成了 Google Gemini 3 Pro 模型，支持深度思考模式，能够：

- 📊 **数据分析** - 分析库存、财务、项目等数据
- 🔍 **智能查询** - 回答业务相关问题
- 💡 **策略建议** - 提供业务优化建议
- ⚠️ **预警分析** - 识别潜在风险和问题

### 使用示例

- 「目前哪些物料需要立刻补货？」
- 「分析上月的物料损耗情况」
- 「项目 A 当前成本是否超出预算？」
- 「按项目维度对比最近 6 个月收入与支出」

> 如果你不需要 AI 功能，可以不配置 `GEMINI_API_KEY`，AI 决策室入口将隐藏或以降级模式运行。

## 🗄️ 数据库与数据初始化

系统使用 H2 嵌入式数据库，数据文件存储在 `data/hongshuo_erp.mv.db`。

### 访问 H2 控制台

开发环境下可通过以下地址访问 H2 控制台：

- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/hongshuo_erp`
- 用户名: `sa`
- 密码: (留空)

## 🏗️ 构建与部署

### 构建前端

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 构建后端

```bash
mvn clean package
```

构建产物将输出到 `target/` 目录

### 生产环境部署

1. 构建前端并配置静态资源服务
2. 配置后端环境变量和数据库连接
3. 设置反向代理（如 Nginx）
4. 配置 HTTPS 证书

## 🧪 开发与测试说明

### 前端开发

- 使用 Vite 作为开发服务器，支持热模块替换 (HMR)
- TypeScript 严格模式，确保类型安全
- 使用 Tailwind CSS 进行样式开发

### 后端开发

- 使用 Spring Boot DevTools 支持热重载
- JPA 自动建表与迁移（`ddl-auto=update`），开发阶段无需手动维护表结构
- 简单基于 Token 的登录态管理，后续可替换为 JWT/Redis 等更强方案
- API 文档建议统一使用 OpenAPI/Swagger（如 `/swagger-ui/index.html`），并在提测前执行质量门禁：`npm run quality:gate`

## 📝 功能模块概览

### 仪表盘

- 项目进度概览
- 库存状态统计
- 财务趋势图表
- 关键指标展示

### 项目管理

- 项目列表和详情
- 里程碑管理
- 成本核算
- 进度跟踪

### 物料仓库

- 实时库存查看
- 入库登记
- 出库申请和审批
- 低库存预警

### 物料管理

- 物料信息管理
- 规格参数维护
- 价格管理
- 预警阈值设置

### 财务收支

- 收入/支出记录（与项目关联）
- 审批流程（通过后自动回写项目成本/已收款）
- 财务趋势图与多维度财务报表

### 操作日志

- 操作记录查询
- 日志导出
- 日志删除（管理员）

### AI 决策室

- 智能数据分析与问答
- 项目/库存/财务组合分析
- 简单策略建议生成

## 📌 当前进度对齐（2026-03-28）

为便于产品、研发与实施团队在同一口径下推进，本节给出当前版本的交付状态：

- **已完成（可用）**
  - 项目、里程碑、库存、出入库、财务收支、审批流、报表、用户/角色/权限等核心闭环能力。
  - 仪表盘与项目详情已形成项目经营分析主视图，可支持日常经营跟踪。

- **进行中（持续优化）**
  - 自动化测试覆盖率提升（前端 Vitest / 后端 JUnit）。
  - AI 决策分析提示词与业务口径进一步对齐（减少泛化结论、强化可执行建议）。

- **下一阶段（建议优先级）**
  1. 统一审批与消息中心，补齐超预算、里程碑逾期、库存阈值三类告警。
  2. 完善 Excel 模板导入与批量操作，降低基础数据录入成本。
  3. 增加接口文档与质量门禁（OpenAPI + Lint/Checkstyle + Git Hooks）。

> 建议在每周例会后更新本节日期与状态，作为跨角色协同的单一进度视图。

## 🚀 五期开发启动（Phase 5）

已启动 Phase 5，当前迭代聚焦**消息中心能力沉淀 + 结构拆分**：已将仪表盘预警聚合逻辑迁入 `modules/dashboard/services` 作为领域服务，并扩展到回款节点与里程碑超期信号（低库存、待审批出库、待审批财务、逾期项目、近期待催款、里程碑超期）；同时将侧边栏菜单配置抽离到 `app/navigation`，减少 `App.tsx` 结构负担，为后续消息中心页面、钉钉推送与周报自动化打基础。

## 🔭 计划中的功能与优化方向

> 以下为项目的中长期规划，不一定一次性全部完成，会按实际需求和时间逐步迭代。

- **功能增强**
  - 更多维度的财务/库存/项目报表（按区域、项目类型、分包单位等）
  - 消息中心扩展：审批提醒、超预算预警、即将到期里程碑提醒
  - 数据导入导出优化：支持项目/物料/财务 Excel 模板导入、批量操作

- **质量与运维**
  - 前后端自动化测试（Vitest + JUnit），覆盖关键业务流程
  - 接入 Swagger/OpenAPI，自动生成接口文档（对内使用即可）
  - 代码质量工具与 Git Hooks（ESLint/Prettier/Checkstyle 等）
  - 日志与监控完善：关键 API 耗时、错误告警、业务指标看板

- **性能与体验**
  - 前端路由与模块按需加载，优化首屏加载时间
  - 大列表虚拟化、图表渲染优化
  - 如有需要，逐步探索移动端适配或简化版 H5 视图

## 📚 更多文档

- [`docs/DEVELOPMENT_PLAN_BUSINESS.md`](docs/DEVELOPMENT_PLAN_BUSINESS.md)：业务侧开发计划与阶段划分
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)：开发说明、架构与约定
- [`docs/ARCHITECTURE_REDESIGN.md`](docs/ARCHITECTURE_REDESIGN.md)：Phase 5 代码结构重构方案（前后端）
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)：部署方案与环境配置
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)：面向最终用户的使用指南
- [`docs/CODE_QUALITY.md`](docs/CODE_QUALITY.md)：代码规范、Lint、Git Hooks 配置
- [`docs/TESTING.md`](docs/TESTING.md)：手工测试要点与回归清单（持续迭代中）

## 🔧 故障排查

### 后端连接失败

1. 检查后端服务是否启动（`http://localhost:8080`）
2. 检查防火墙设置
3. 查看浏览器控制台错误信息

### AI 功能无法使用

1. 检查 `.env` 文件中的 `GEMINI_API_KEY` 是否正确设置
2. 确认 API Key 是否有效
3. 检查网络连接是否正常

### 数据库问题

1. 检查 `data/` 目录权限
2. 如数据异常，可删除 `data/hongshuo_erp.mv.db` 重新初始化
3. 或设置 `app.data.reset-on-startup=true` 重置数据

## 📄 许可证

本项目为内部项目，版权归宏硕建设所有。

## 👨‍💻 开发团队

宏硕建设 ERP 开发团队

## 📞 联系方式

如有问题或建议，请联系开发团队。

---

<div align="center">

**Made with ❤️ for Hongshuo Construction**

</div>
