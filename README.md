# 宏硕建设 ERP 系统 (Hongshuo Construction ERP)

<div align="center">

一个基于 React + Spring Boot 的现代化建筑行业 ERP 管理系统，集成 Google Gemini AI 智能分析功能。

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)

</div>

## 📋 项目简介

宏硕建设 ERP 系统是一个专为建筑行业设计的全功能企业资源规划系统，集成了项目管理、物料管理、财务管理、操作日志等核心功能，并创新性地引入了 AI 智能决策分析功能，帮助管理者做出更明智的业务决策。

### 核心特性

- 🏗️ **项目管理** - 完整的项目生命周期管理，包括进度跟踪、里程碑管理、成本核算
- 📦 **物料仓库** - 实时库存管理、出入库审批流程、低库存预警
- 💰 **财务管理** - 收支记录、成本分析、财务审批流程
- 🤖 **AI 决策室** - 基于 Google Gemini 3 Pro 的智能数据分析，支持深度思考和策略建议
- 🔐 **权限管理** - 细粒度的角色权限控制，支持多角色协作
- 📊 **数据可视化** - 丰富的图表展示，直观了解业务状况
- 📝 **操作日志** - 完整的操作审计追踪

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
│   ├── Dashboard/                # 仪表盘组件
│   ├── ProjectDetail/            # 项目详情组件
│   └── Reports/                  # 报表组件
├── services/                     # 前端服务
│   ├── apiService.ts             # API 调用服务
│   └── geminiService.ts          # AI 分析服务
├── data/                         # 数据文件
│   ├── hongshuo_erp.mv.db        # H2 数据库文件
│   └── config.properties         # 配置文件
├── App.tsx                       # 主应用组件
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

## 👥 用户角色与权限

系统内置四种角色，每种角色拥有不同的权限：

### 管理员 (Admin)
- ✅ 所有页面访问权限
- ✅ 所有操作权限
- ✅ 数据重置权限
- ✅ 权限管理权限

### 项目经理 (PM)
- ✅ 项目管理（创建、编辑）
- ✅ 物料查看和审批
- ✅ 财务查看
- ✅ AI 决策室访问

### 财务 (Finance)
- ✅ 财务记录创建和审批
- ✅ 物料查看
- ✅ AI 决策室访问

### 录入员 (Clerk)
- ✅ 物料创建和出库申请
- ✅ 物料查看
- ✅ AI 决策室访问

## 🤖 AI 决策室功能

AI 决策室集成了 Google Gemini 3 Pro 模型，支持深度思考模式，能够：

- 📊 **数据分析** - 分析库存、财务、项目等数据
- 🔍 **智能查询** - 回答业务相关问题
- 💡 **策略建议** - 提供业务优化建议
- ⚠️ **预警分析** - 识别潜在风险和问题

### 使用示例

- "目前哪些物料需要立刻补货？"
- "分析上月的物料损耗情况"
- "库存预警分析"
- "成本异常检测"
- "补货策略建议"
- "出库频率分析"

## 📡 API 接口

### 项目管理
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建项目
- `PUT /api/projects/{id}` - 更新项目
- `DELETE /api/projects/{id}` - 删除项目

### 物料管理
- `GET /api/inventory` - 获取库存列表
- `POST /api/inventory` - 创建物料
- `PUT /api/inventory/{id}` - 更新物料
- `DELETE /api/inventory/{id}` - 删除物料

### 库存操作
- `POST /api/stock/in` - 物料入库
- `POST /api/stock/out` - 物料出库
- `POST /api/stock/approve/{id}` - 审批出库申请

### 财务管理
- `GET /api/finance` - 获取财务记录
- `POST /api/finance` - 创建财务记录
- `DELETE /api/finance/{id}` - 删除财务记录

### 系统日志
- `GET /api/logs` - 获取操作日志
- `DELETE /api/logs/{id}` - 删除日志

### 配置管理
- `GET /api/config/permissions` - 获取权限配置
- `PUT /api/config/permissions` - 更新权限配置

## 🗄️ 数据库

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

## 🧪 开发说明

### 前端开发

- 使用 Vite 作为开发服务器，支持热模块替换 (HMR)
- TypeScript 严格模式，确保类型安全
- 使用 Tailwind CSS 进行样式开发

### 后端开发

- 使用 Spring Boot DevTools 支持热重载
- JPA 自动建表，无需手动管理数据库结构
- 支持 CORS，方便前后端分离开发

## 📝 功能模块

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
- 收入记录
- 支出记录
- 审批流程
- 财务报表

### 操作日志
- 操作记录查询
- 日志导出
- 日志删除（管理员）

### AI 决策室
- 智能数据分析
- 业务问题咨询
- 策略建议生成
- 实时数据同步

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
