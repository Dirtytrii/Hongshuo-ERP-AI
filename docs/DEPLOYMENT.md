# 部署文档

## 构建

```bash
# 前端
npm run build
# 产物在 dist/

# 后端
mvn clean package -DskipTests
# 产物在 target/*.jar
```

## 运行后端

```bash
java -jar target/erp-0.0.1-SNAPSHOT.jar
```

可配置环境变量或 `application.properties`：

- `server.port` 端口（默认 8080）
- `spring.datasource.url` 数据库 URL（生产可改为 MySQL/PostgreSQL）

## 前端静态资源

将 `dist/` 内容部署到 Nginx 或其他 Web 服务器，并配置反向代理将 `/api` 转发到后端地址。

示例 Nginx：

```nginx
location /api {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
location / {
    root /path/to/dist;
    try_files $uri $uri/ /index.html;
}
```

## Docker（可选）

项目提供两个 Dockerfile：

- **Dockerfile.backend**：多阶段构建，产出 Spring Boot 可执行 jar，暴露 8080，数据卷 `/app/data` 可挂载 H2 数据。
- **Dockerfile.frontend**：多阶段构建（Node 构建 + Nginx 托管），构建参数 `VITE_API_BASE` 可指定后端地址，默认 `http://localhost:8080`。

可基于上述 Dockerfile 将后端与前端分别打成镜像，按需组合部署。

## 生产注意

- 使用外部数据库并做好备份。
- 配置 CORS、HTTPS 与密钥（如 `DEEPSEEK_API_KEY`）环境变量，勿提交到仓库。
