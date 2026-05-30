# 公网 API 暴露收口执行单

日期：2026-05-30

## 当前状态

- `https://hongshuo-erp-ai.pages.dev/api/projects` 已由 Pages Function 拦截，未登录返回 `401`。
- `https://hongshuo-erp-ai.pages.dev/api/auth/login` 已拦截历史默认口令 `admin / 123456`，返回 `401`。
- `http://api-hongshuo.dingai.site/api/projects` 仍可未登录返回 `200`。
- `http://8.163.60.63:9101/api/projects` 仍可未登录返回 `200`。
- `http://api-hongshuo.dingai.site/api/auth/login` 与 `http://8.163.60.63:9101/api/auth/login` 仍可使用历史默认口令取得管理员 token。

因此：Pages 公网入口已兜底，但后端主机仍需部署最新 jar 并封禁直连端口，目标才算真正完成。

## 必须上线的提交

后端主机必须部署到至少包含以下两个提交的版本：

- `55743aa`：后端 `/api/**` 默认鉴权、角色限制、安全头与 CORS 收口。
- `4e67b90`：Pages 代理层兜底、历史默认口令拦截、生产初始化口令配置收口。

在服务器上先确认：

```bash
cd /home/hongshuo/apps/hongshuo-erp/current
git fetch origin main
git merge-base --is-ancestor 4e67b90 origin/main
git checkout main
git pull --ff-only origin main
git rev-parse --short HEAD
```

`git merge-base` 必须退出码为 `0`，`HEAD` 必须等于或晚于 `4e67b90`。

## 后端部署

确保数据目录不是代码目录里的普通文件夹：

```bash
mkdir -p /home/hongshuo/apps/hongshuo-erp/shared/data
rm -rf /home/hongshuo/apps/hongshuo-erp/current/data
ln -sfn /home/hongshuo/apps/hongshuo-erp/shared/data /home/hongshuo/apps/hongshuo-erp/current/data
chown -h hongshuo:hongshuo /home/hongshuo/apps/hongshuo-erp/current/data
```

构建并重启：

```bash
sudo -u hongshuo -H bash -lc 'cd /home/hongshuo/apps/hongshuo-erp/current && npm ci && npm run build && mvn clean package -DskipTests'
systemctl daemon-reload
systemctl restart hongshuo-erp
systemctl status hongshuo-erp --no-pager
```

`hongshuo-erp.service` 必须包含：

```ini
Environment=APP_DATA_RESET_ON_STARTUP=false
Environment=APP_SECURITY_ALLOW_INSECURE_DEFAULT_PASSWORD=false
Environment=SPRING_H2_CONSOLE_ENABLED=false
```

如果生产库是空库，临时增加一次性强密码：

```ini
Environment=APP_SECURITY_BOOTSTRAP_DEFAULT_PASSWORD=replace_with_one_time_initial_password
```

上线后立即修改或禁用所有历史默认口令用户，禁止保留 `admin / 123456`、`pm / 123456`、`finance / 123456`、`clerk / 123456`。

## 端口封禁

后端只允许本机反代或 Cloudflare Tunnel 访问，不允许公网直连 `9101`、`18081` 或其他后端端口。

如果使用 `firewalld`：

```bash
firewall-cmd --permanent --remove-port=9101/tcp || true
firewall-cmd --permanent --remove-port=18081/tcp || true
firewall-cmd --permanent --add-port=18080/tcp
firewall-cmd --reload
firewall-cmd --list-ports
```

如果使用安全组，移除公网入方向 `9101/tcp`，只保留前端入口端口或 Cloudflare Tunnel 所需出站连接。

## 验证门槛

在服务器本机：

```bash
curl -i http://127.0.0.1:9101/api/projects
curl -i http://127.0.0.1:18081/api/projects
```

实际在用的后端端口未带 token 必须返回 `401`，不用的端口应拒绝连接。

从公网执行：

```bash
./scripts/security/verify-public-api-closed.sh
```

通过标准：

- Pages `/api/projects` 返回 `401`。
- Pages 默认口令登录返回 `401` 且无 token。
- Pages `/api/v3/api-docs` 返回 `404`。
- `api-hongshuo.dingai.site/api/projects` 不得返回 `200`。
- `8.163.60.63:9101/api/projects` 不得返回 `200`。
- `api-hongshuo.dingai.site` 与 `8.163.60.63:9101` 的默认口令登录不得返回 token。

任一项不满足，都不能宣布本次安全修复完成。
