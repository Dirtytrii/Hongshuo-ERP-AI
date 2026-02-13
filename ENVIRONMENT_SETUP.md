# 环境配置指南

## ✅ 好消息：H2 数据库不需要单独安装！

H2 是**嵌入式内存数据库**，会作为 Maven 依赖自动下载。启动 Spring Boot 应用时，H2 会自动运行在内存中。

---

## 📋 必需环境清单

### 1. **Java JDK 17+** ✅ (必需)
- **当前状态**：您有 Java 16，需要升级到 17+
- **下载**：https://adoptium.net/zh-CN/temurin/releases/
- **推荐版本**：Java 17 LTS 或 Java 21 LTS
- **验证**：`java -version`

### 2. **Maven** ✅ (必需)
- **当前状态**：IntelliJ IDEA 内置了 Maven，通常不需要单独安装
- **如果 IDEA 中没有**：下载 https://maven.apache.org/download.cgi
- **验证**：在 IDEA 的 Terminal 中运行 `mvn -version`（如果配置了 PATH）

### 3. **Node.js 18+** ✅ (必需)
- **当前状态**：您有 Node.js 14，需要升级到 18+
- **下载**：https://nodejs.org/
- **推荐版本**：Node.js 20 LTS
- **验证**：`node --version` 和 `npm --version`

### 4. **Gemini API Key** ⚠️ (可选，AI 功能需要)
- **用途**：AI 决策分析功能需要
- **获取方式**：
  1. 访问：https://aistudio.google.com/apikey
  2. 创建 API Key
  3. 在项目根目录创建 `.env` 文件（见下方配置）

---

## 🔧 环境变量配置

### 创建 `.env` 文件（项目根目录）

在项目根目录创建 `.env` 文件：

```env
GEMINI_API_KEY=your_api_key_here
```

**注意**：
- `.env` 文件应该添加到 `.gitignore` 中（不要提交到 Git）
- 如果没有 API Key，AI 分析功能会失败，但其他功能正常

---

## 🚀 启动检查清单

### 后端启动前检查：
- [ ] Java 17+ 已安装并配置到 IDEA
- [ ] Maven 依赖已下载（`mvn install` 成功）
- [ ] 端口 8080 未被占用

### 前端启动前检查：
- [ ] Node.js 18+ 已安装
- [ ] npm 依赖已安装（`npm install` 成功）
- [ ] `.env` 文件已创建（如果使用 AI 功能）
- [ ] 端口 3000 未被占用

---

## 📝 数据库说明

### H2 数据库（自动运行）
- **类型**：内存数据库（重启后数据会丢失）
- **访问**：http://localhost:8080/h2-console
- **JDBC URL**：`jdbc:h2:mem:hongshuo_erp`
- **用户名**：`sa`
- **密码**：（空）

### 数据持久化（可选）
如果需要数据持久化，可以修改 `application.properties`：

```properties
# 改为文件数据库（数据会保存到文件）
spring.datasource.url=jdbc:h2:file:./data/hongshuo_erp
```

---

## ⚠️ 常见问题

### Q: H2 数据库需要单独安装吗？
**A: 不需要！** H2 会通过 Maven 自动下载和运行。

### Q: 没有 Gemini API Key 可以运行吗？
**A: 可以！** 除了 AI 分析功能，其他功能都正常。AI 功能会显示错误提示。

### Q: 数据会丢失吗？
**A: 当前配置下，重启应用后数据会丢失**（因为是内存数据库）。如需持久化，参考上面的配置。

### Q: 端口冲突怎么办？
**A: 修改端口**：
- 后端：修改 `application.properties` 中的 `server.port=8080`
- 前端：修改 `vite.config.ts` 中的 `port: 3000`

---

## ✅ 快速验证

### 验证后端环境：
```powershell
java -version  # 应该显示 17 或更高
cd F:\JavaStuff\JavaData\Hongshuo-ERP-AI
mvn clean install  # 应该成功编译
```

### 验证前端环境：
```powershell
node --version  # 应该显示 18 或更高
npm --version
cd F:\JavaStuff\JavaData\Hongshuo-ERP-AI
npm install  # 应该成功安装依赖
```

---

## 🎯 总结

**您当前需要做的：**
1. ✅ 升级 Java 到 17+（最重要）
2. ✅ 升级 Node.js 到 18+（已完成？）
3. ⚠️ 创建 `.env` 文件配置 Gemini API Key（可选）

**不需要做的：**
- ❌ 安装 H2 数据库（自动包含）
- ❌ 安装 MySQL/PostgreSQL（当前不需要）
- ❌ 安装其他数据库（H2 已足够）

