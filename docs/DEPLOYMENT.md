# 部署手册（详细版）

本文档用于指导宏硕 ERP 在测试/生产环境部署，包含：

- **手动部署（Jar + Nginx）**
- **Docker Compose 一键部署**
- **四阶段集成配置（钉钉/移动端）**
- **升级、回滚、备份、巡检**

---

## 一、部署架构建议

### 1. 标准分层

- **前端**：Nginx 托管 `dist/` 静态资源
- **后端**：Spring Boot（Java 17）
- **数据库**：
  - 小规模可使用 H2 文件库（默认）
  - 生产建议迁移到 MySQL/PostgreSQL

### 2. 端口规划（默认）

- 前端：`3000`（容器）或 `80/443`（Nginx）
- 后端：`8080`
- H2 Console（仅开发建议开启）：`/h2-console`

---

## 二、部署前检查清单

1. 环境版本

```bash
java -version
mvn -v
node -v
npm -v
docker -v
docker compose version
```

2. 必要目录

- 日志目录（建议）：`/opt/hongshuo/logs`
- 数据目录（H2 时必须）：`/opt/hongshuo/data`
- 配置目录（可选）：`/opt/hongshuo/config`

3. 配置项确认

- `data/config.properties`（业务阈值、四阶段集成开关）
- `data/permissions.properties`（页面/按钮权限）

---

## 三、手动部署（Jar + Nginx）

### 1. 构建制品

```bash
# 前端
npm ci
npm run build

# 后端
mvn clean package -DskipTests
```

产物：

- 前端：`dist/`
- 后端：`target/*.jar`

### 2. 启动后端

```bash
java -jar target/erp-0.0.1-SNAPSHOT.jar
```

推荐 systemd（示例）：

```ini
[Unit]
Description=Hongshuo ERP Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/hongshuo/backend
ExecStart=/usr/bin/java -jar /opt/hongshuo/backend/app.jar
Restart=always
RestartSec=5
Environment=SPRING_DATASOURCE_URL=jdbc:h2:file:./data/hongshuo_erp
Environment=SPRING_DATASOURCE_USERNAME=sa
Environment=SPRING_DATASOURCE_PASSWORD=

[Install]
WantedBy=multi-user.target
```

### 3. 部署前端到 Nginx

将 `dist/` 上传到 Nginx 目录（例如 `/var/www/hongshuo/dist`）。

Nginx 参考配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/hongshuo/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 四、Docker Compose 部署（推荐）

仓库已提供：

- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker-compose.yml`

### 1. 启动

```bash
docker compose build
docker compose up -d
```

### 2. 验证

```bash
docker compose ps
curl -I http://localhost:3000
curl -I http://localhost:8080/api/projects
```

### 3. 查看日志

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### 4. 停止与重启

```bash
docker compose down
docker compose up -d
```

> 注意：当前 compose 默认挂载 `./data:/app/data`，请确保宿主机 `data/` 目录已纳入备份策略。

---

## 五、四阶段集成配置（部署必看）

配置文件：`data/config.properties`

关键配置项：

- `integration.dingtalk.enabled`：是否启用钉钉通知
- `integration.dingtalk.webhook`：钉钉机器人 webhook
- `integration.mobile.enabled`：是否启用移动端接口
- `integration.web.base-url`：钉钉消息中的回跳前端地址（例如 `https://erp.xxx.com`）
- `integration.notify.template.submitted`：提交通知模板（5 个 `%s` 占位）
- `integration.notify.template.result`：结果通知模板（5 个 `%s` 占位）

可通过两种方式维护：

1. Web 端「集成中心」
2. `POST /api/config`

---

## 六、生产参数建议

### 1. 安全

- 强制 HTTPS（Nginx + 证书）
- 限制 H2 Console 在生产暴露
- API 网关或 Nginx 做 IP 白名单（管理端）
- 密钥（如 `DEEPSEEK_API_KEY`）使用环境变量，不入库

### 2. 性能

- JVM 建议：`-Xms512m -Xmx1024m` 起步，按负载调整
- Nginx 开启 gzip / brotli（可选）
- 前端大包建议后续做 chunk 分包优化

### 3. 数据

- 生产建议使用 MySQL/PostgreSQL
- 每日备份数据库与 `data/config.properties`、`data/permissions.properties`

---

## 七、升级与回滚

### 1. 升级步骤

1. 拉取代码并构建新版本
2. 备份数据库与 `data/`
3. 替换后端 Jar / 重建 Docker 镜像
4. 灰度验证（登录、项目、财务、审批、集成中心）
5. 全量切换

### 2. 回滚步骤

1. 停止当前服务
2. 切回上一个 Jar 或镜像 tag
3. 恢复备份数据（必要时）
4. 再次健康检查

---

## 八、上线后巡检清单

- [ ] 前端首页可访问
- [ ] `/api/projects`、`/api/dashboard/operation` 正常
- [ ] 审批中心 `/api/approval-center/todos` 正常
- [ ] 移动端 `/api/mobile/overview` 正常（若启用）
- [ ] 钉钉测试消息可发送（若启用）
- [ ] `data/config.properties` 与权限文件已落盘

---

## 九、常见问题

1. **前端空白页**
   - 检查 Nginx `try_files` 是否回退到 `index.html`

2. **接口 404**
   - 检查反向代理是否保留 `/api` 前缀

3. **钉钉不推送**
   - 检查：
     - `integration.dingtalk.enabled=true`
     - webhook 是否可访问
     - 模板占位符数量是否正确（5 个 `%s`）

4. **移动端接口返回 403**
   - 检查 `integration.mobile.enabled=true`
