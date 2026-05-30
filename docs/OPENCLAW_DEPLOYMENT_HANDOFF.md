# 交付 openclaw 的部署手册（无域名 / 丢包即可部署）

本文档用于你把**部署文档 + 交付包**发给 openclaw（或其他 Agent）时直接照做。

## 0. 结论：前端怎么部署？只丢 jar 行不行？

- **不行（当前仓库形态）**：`pom.xml` 未配置把前端 `dist/` 打进 Spring Boot jar 的静态资源目录，因此 **jar 只包含后端**。
- **推荐方案**：前端 `dist/` 用 **Nginx 托管**，并把 `/api/` 反代到后端（后端只监听本机端口）。
- **交付包两种选择**：
  - **A. 你本地构建后交付**：给 openclaw 一个压缩包，里面包含 `target/*.jar` + `dist/`（最省事）。
  - **B. 只交付源码 + 让 agent 构建**：openclaw 在服务器上执行 `npm ci && npm run build && mvn clean package -DskipTests`（对服务器环境要求更高）。

> 如果你后续想做到“只丢 jar 就能跑（前后端一体）”，需要改构建流程：把 `dist/` 复制到 `src/main/resources/static/`（或打包时注入到 jar）。本手册先按当前最稳的“前端静态 + Nginx”执行。

## 0.1 前端 API 请求地址（重要）

- **推荐做法**：前端 API 基地址使用同域相对路径 **`/api`**（默认推荐）。
- **Nginx 负责反代**：将 `/api/` 转发到后端 `http://127.0.0.1:<后端端口>/api/`。
- **避免写死端口**：不要让前端固定请求 `:8080` 之类端口，否则会迫使运维额外开端口或做“8080 → 后端端口”的临时兜底。

如需覆盖前端 API 基地址，可在构建时设置环境变量：

```bash
VITE_API_BASE_URL=/api npm run build
```

## 1. 部署目标与约束（必须遵守）

- **无域名**：对外通过 `http://<公网IP>:<端口>` 访问。
- **后端不对公网开放**：只监听 `127.0.0.1`。
- **推荐端口**（如冲突可改，但要同步改 Nginx/systemd/防火墙）：
  - 前端公网端口：`18080`
  - 后端本机端口：`18081`
- **正式运行用户**：`hongshuo`（不要长期跑在 `/root`）。
- **数据持久化**：H2 文件库，必须落到持久目录，且启动时禁止重置数据。

最终访问示例：

```text
http://<服务器公网IP>:18080
```

## 2. 你交付给 openclaw 的文件清单（推荐 A 方案）

请在本地构建后，把下面内容打包成一个压缩包（zip/tar.gz 均可）：

- `target/erp-0.0.1-SNAPSHOT.jar`
- `dist/`（前端静态产物目录）
- 可选：`data/`（如果你希望连演示数据一起交付；正式环境通常不建议覆盖已有数据）
- 本文档：`docs/OPENCLAW_DEPLOYMENT_HANDOFF.md`

本地构建命令（在仓库根目录）：

```bash
npm ci
npm run build
mvn clean package -DskipTests
```

### 前端构建的 Node 版本要求（重要）

前端依赖链里（Vite / React 插件 / ESLint 相关依赖）对 Node 版本有硬性要求，**建议使用**：

- Node `20.19.0+`（推荐）或 Node `22.12.0+`

如果 Node 版本过低，常见现象是 `vite build` 报：

- `Error: The service was stopped`
- `The service is no longer running`

在服务器上构建时，请先检查版本：

```bash
node -v
npm -v
```

## 3. 服务器目录规划（推荐）

```text
/home/hongshuo/apps/hongshuo-erp/
├─ current/                 # 当前版本（代码/发布物）
├─ shared/
│  ├─ data/                 # H2 数据文件（必须持久）
│  └─ logs/                 # 后端日志
└─ releases/                # 可选：历史版本归档
```

## 4. 部署步骤（openclaw 执行）

### 4.1 准备目录与权限（root 执行一次）

```bash
mkdir -p /home/hongshuo/apps/hongshuo-erp/current
mkdir -p /home/hongshuo/apps/hongshuo-erp/shared/data
mkdir -p /home/hongshuo/apps/hongshuo-erp/shared/logs
chown -R hongshuo:hongshuo /home/hongshuo/apps/hongshuo-erp
```

### 4.2 上传交付包并解压到 `current/`

把压缩包上传到服务器，然后解压到：

```text
/home/hongshuo/apps/hongshuo-erp/current
```

要求解压后至少包含：

```text
/home/hongshuo/apps/hongshuo-erp/current/target/erp-0.0.1-SNAPSHOT.jar
/home/hongshuo/apps/hongshuo-erp/current/dist/
```

### 4.3 挂接持久化数据目录（避免升级覆盖）

```bash
rm -rf /home/hongshuo/apps/hongshuo-erp/current/data
ln -sfn /home/hongshuo/apps/hongshuo-erp/shared/data /home/hongshuo/apps/hongshuo-erp/current/data
chown -h hongshuo:hongshuo /home/hongshuo/apps/hongshuo-erp/current/data
```

### 4.4 配置 systemd（后端服务）

创建文件：

```text
/etc/systemd/system/hongshuo-erp.service
```

内容（按需替换 `DEEPSEEK_API_KEY`）：

```ini
[Unit]
Description=Hongshuo ERP Backend
After=network.target

[Service]
User=hongshuo
Group=hongshuo
WorkingDirectory=/home/hongshuo/apps/hongshuo-erp/current
ExecStart=/usr/bin/java -Xms256m -Xmx768m -jar /home/hongshuo/apps/hongshuo-erp/current/target/erp-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=5

# 生产覆盖：端口与安全开关（非常重要）
Environment=SERVER_PORT=18081
Environment=APP_DATA_RESET_ON_STARTUP=false
Environment=APP_SECURITY_BOOTSTRAP_DEFAULT_PASSWORD=replace_with_one_time_initial_password
Environment=SPRING_H2_CONSOLE_ENABLED=false

# H2 文件库（相对路径依赖 WorkingDirectory）
Environment=SPRING_DATASOURCE_URL=jdbc:h2:file:./data/hongshuo_erp
Environment=SPRING_DATASOURCE_USERNAME=sa
Environment=SPRING_DATASOURCE_PASSWORD=

# AI（可选：不配置则 AI 降级/隐藏）
Environment=DEEPSEEK_API_KEY=sk-79ba234316a84d74b67e2f51a3a8c979

StandardOutput=append:/home/hongshuo/apps/hongshuo-erp/shared/logs/backend.out.log
StandardError=append:/home/hongshuo/apps/hongshuo-erp/shared/logs/backend.err.log

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
systemctl daemon-reload
systemctl enable hongshuo-erp
systemctl restart hongshuo-erp
systemctl status hongshuo-erp --no-pager
```

### 4.5 配置 Nginx（前端静态 + /api 反代）

创建文件：

```text
/etc/nginx/conf.d/hongshuo-erp.conf
```

内容：

```nginx
server {
    listen 18080;
    server_name _;

    root /home/hongshuo/apps/hongshuo-erp/current/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:18081/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

检查并重载：

```bash
nginx -t
systemctl reload nginx
```

### 4.6 放通防火墙/安全组

仅放通前端端口（示例 `firewalld`）：

```bash
firewall-cmd --permanent --add-port=18080/tcp
firewall-cmd --reload
```

**不要**对外放通 `18081`。

## 5. 验证清单（部署完成必须跑一遍）

后端本机探活：

```bash
curl -i http://127.0.0.1:18081/api/projects
```

未带 `Authorization` 时应返回 `401`；如果历史环境仍存在 `admin / 123456` 等默认密码，先轮换账号密码再继续公网验证。

前端本机探活：

```bash
curl -I http://127.0.0.1:18080
```

外网访问：

```text
http://<服务器公网IP>:18080
```

## 6. agent 必须“额外处理/明确告知”的点（无域名场景）

- **访问方式**：最终 URL 是 `http://<公网IP>:18080`（没有域名，没有 HTTPS）。
- **端口冲突处理**：如 `18080/18081` 被占用，换高位端口，但要同步修改：
  - systemd：`SERVER_PORT`
  - Nginx：`listen`、`proxy_pass`
  - 防火墙/安全组放行端口
- **数据保护**：必须确保
  - `APP_DATA_RESET_ON_STARTUP=false`（否则可能启动即清库重置）
  - `shared/data` 可写且不被覆盖
- **安全项**：必须确保
  - `SPRING_H2_CONSOLE_ENABLED=false`（避免暴露 H2 Console）
  - 首次空库部署必须设置一次性 `APP_SECURITY_BOOTSTRAP_DEFAULT_PASSWORD`，禁止沿用开发默认口令
