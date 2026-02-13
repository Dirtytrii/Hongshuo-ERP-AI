# Java JDK 升级指南

## 当前问题
- 系统 JDK: Java 16
- 项目要求: Java 17+ (Spring Boot 3.2.0 需要)

## 推荐方案：升级到 Java 17 或 21

### 步骤 1: 下载 JDK
1. 访问：https://adoptium.net/zh-CN/temurin/releases/
2. 选择：
   - **Java 17 LTS** (推荐，长期支持)
   - 或 **Java 21 LTS** (最新 LTS)
3. 下载 Windows x64 安装包（.msi）

### 步骤 2: 安装 JDK
1. 运行下载的 .msi 文件
2. 选择安装路径（建议：`F:\JavaStuff\.jdks\JDK17` 或 `JDK21`）
3. 完成安装

### 步骤 3: 在 IntelliJ IDEA 中配置
1. **File → Project Structure** (Ctrl+Alt+Shift+S)
2. **Platform Settings → SDKs**
   - 点击 `+` → **Add SDK → Download JDK**
   - 选择版本 17 或 21
   - 选择供应商：Eclipse Temurin
   - 点击 **Download**
   
   或者手动添加：
   - 点击 `+` → **Add SDK → JDK**
   - 选择已安装的 JDK 目录（如 `F:\JavaStuff\.jdks\JDK17`）

3. **Project Settings → Project**
   - **SDK**: 选择 Java 17 或 21
   - **Language level**: 选择对应的版本

4. **Project Settings → Modules**
   - 确保所有模块的 **Language level** 都设置为 17 或 21

### 步骤 4: 验证配置
在 IntelliJ IDEA 的 Terminal 中运行：
```powershell
java -version
```

应该显示 Java 17 或 21。

### 步骤 5: 重新编译
在 IntelliJ IDEA 中：
1. **Maven** 工具窗口 → **Reload All Maven Projects**
2. 运行 **Lifecycle → install**

---

## 临时方案：降级 Spring Boot（不推荐）

如果暂时无法升级 Java，可以降级到 Spring Boot 2.7.x（支持 Java 11+），但需要修改代码中的 `jakarta.*` 包为 `javax.*`。

**注意**：此方案需要大量代码修改，不推荐使用。

