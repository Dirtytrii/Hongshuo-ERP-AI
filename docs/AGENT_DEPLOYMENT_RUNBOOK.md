# Agent 部署手册

本文档面向后续接手部署的 Agent 或运维执行者，目标是让部署动作在当前服务器约束下可重复、可回滚、可交接。

## 1. 当前约束

- Agent 启动目录：`/root`
- 正式运行用户：`hongshuo`
- 服务器规格：`4C4G`
- 同机已有其他项目在运行
- 当前没有域名，只能通过裸 IP + 端口提供 Web 访问

因此本项目的部署原则是：

- Agent 可以从 `/root` 拉代码和执行命令
- 但正式运行文件必须归 `hongshuo` 所有
- 前端只对外开放一个高位端口
- 后端仅监听 `127.0.0.1`

## 2. 本次推荐口径

- 代码工作目录：`/home/hongshuo/apps/hongshuo-erp/current`
- 数据目录：`/home/hongshuo/apps/hongshuo-erp/shared/data`
- 日志目录：`/home/hongshuo/apps/hongshuo-erp/shared/logs`
- 前端公网端口：`18080`
- 后端本机端口：`18081`

外部访问地址：

```text
http://<服务器公网IP>:18080
```

## 3. Agent 执行时的基本原则

### 原则一：不要把正式服务跑在 `/root`

`/root` 只作为 Agent 操作入口，不作为正式服务目录。

### 原则二：所有正式构建和运行动作尽量以 `hongshuo` 用户执行

如果 Agent 当前是 root，统一使用：

```bash
sudo -u hongshuo -H bash -lc '<command>'
```

如果服务器没有 `sudo`，则改用：

```bash
su - hongshuo -c '<command>'
```

### 原则三：先覆盖生产参数，再启动服务

尤其要保证：

```text
APP_DATA_RESET_ON_STARTUP=false
SPRING_H2_CONSOLE_ENABLED=false
```

## 4. 推荐执行流程

### 第一步：准备目录

```bash
mkdir -p /home/hongshuo/apps/hongshuo-erp/current
mkdir -p /home/hongshuo/apps/hongshuo-erp/shared/data
mkdir -p /home/hongshuo/apps/hongshuo-erp/shared/logs
chown -R hongshuo:hongshuo /home/hongshuo/apps/hongshuo-erp
```

### 第二步：把代码同步到正式目录

如果仓库已经在 `/root/Hongshuo-ERP-AI`，可以这样同步：

```bash
rsync -av --delete /root/Hongshuo-ERP-AI/ /home/hongshuo/apps/hongshuo-erp/current/
chown -R hongshuo:hongshuo /home/hongshuo/apps/hongshuo-erp/current
```

如果是首次部署，也可以直接在 `hongshuo` 用户下 clone。

### 第三步：挂接数据目录

```bash
rm -rf /home/hongshuo/apps/hongshuo-erp/current/data
ln -sfn /home/hongshuo/apps/hongshuo-erp/shared/data /home/hongshuo/apps/hongshuo-erp/current/data
chown -h hongshuo:hongshuo /home/hongshuo/apps/hongshuo-erp/current/data
```

### 第四步：构建

```bash
sudo -u hongshuo -H bash -lc 'cd /home/hongshuo/apps/hongshuo-erp/current && npm ci && npm run build && mvn clean package -DskipTests'
```

如果需要上线前做一次快速质量确认，可改为：

```bash
sudo -u hongshuo -H bash -lc "cd /home/hongshuo/apps/hongshuo-erp/current && npm ci && npm run test:run && npm run build && mvn clean package -DskipTests"
```

## 5. systemd 服务模板

文件：

```text
/etc/systemd/system/hongshuo-erp.service
```

内容：

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
Environment=SERVER_PORT=18081
Environment=SPRING_DATASOURCE_URL=jdbc:h2:file:./data/hongshuo_erp
Environment=SPRING_DATASOURCE_USERNAME=sa
Environment=SPRING_DATASOURCE_PASSWORD=
Environment=APP_DATA_RESET_ON_STARTUP=false
Environment=APP_SECURITY_BOOTSTRAP_DEFAULT_PASSWORD=replace_with_one_time_initial_password
Environment=SPRING_H2_CONSOLE_ENABLED=false
Environment=DEEPSEEK_API_KEY=your_deepseek_api_key
StandardOutput=append:/home/hongshuo/apps/hongshuo-erp/shared/logs/backend.out.log
StandardError=append:/home/hongshuo/apps/hongshuo-erp/shared/logs/backend.err.log

[Install]
WantedBy=multi-user.target
```

启用：

```bash
systemctl daemon-reload
systemctl enable hongshuo-erp
systemctl restart hongshuo-erp
systemctl status hongshuo-erp --no-pager
```

## 6. Nginx 模板

文件：

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

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

检查：

```bash
nginx -t
systemctl reload nginx
```

## 7. 上线后检查

### 服务检查

```bash
systemctl status hongshuo-erp --no-pager
tail -n 100 /home/hongshuo/apps/hongshuo-erp/shared/logs/backend.err.log
```

### 接口检查

```bash
curl -i http://127.0.0.1:18081/api/projects
```

未带 `Authorization` 时应返回 `401`；如果历史环境仍存在 `admin / 123456` 等默认密码，先轮换账号密码再放公网流量。

### 页面检查

浏览器打开：

```text
http://<服务器公网IP>:18080
```

至少确认：

- 登录页可打开
- 登录后仪表盘可加载
- 消息中心可显示经营预警
- 审批中心可显示待办
- 集成中心可保存配置

## 8. 常见故障排查

### 页面能打开但接口报错

优先检查：

- `hongshuo-erp` 服务是否运行
- Nginx 的 `/api/` 代理是否保留了 `/api` 前缀
- 后端是否只监听了本机 `18081`

### 重启后数据丢失

优先检查：

- 是否忘记把 `APP_DATA_RESET_ON_STARTUP` 改成 `false`
- `current/data` 是否正确链接到了 `shared/data`
- `shared/data` 是否有 `hongshuo` 写权限

### 端口冲突

如果 `18080` 或 `18081` 已被占用，改成其他未占用高位端口即可，但要同时修改：

- systemd 中的 `SERVER_PORT`
- Nginx 中的 `listen`
- Nginx 中的 `proxy_pass`
- 防火墙放行端口

## 9. 回滚流程

建议每次发布前保留上一个版本目录或备份：

- `dist/`
- `target/*.jar`
- `shared/data`

回滚步骤：

1. 停止 `hongshuo-erp`
2. 回退 `dist/` 和 jar
3. 必要时恢复 H2 数据文件
4. 重启 systemd
5. 检查 Nginx 与页面访问

## 10. 交接说明

Agent 在交接时至少要明确告诉下一位执行者：

- 当前公网访问地址
- 当前前后端端口
- systemd 服务名
- Nginx 配置文件位置
- 数据目录位置
- 是否配置了 `DEEPSEEK_API_KEY`

如果以上五项没有写清楚，后续接手成本会很高。
