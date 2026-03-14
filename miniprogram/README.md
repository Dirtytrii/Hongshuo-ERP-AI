# 宏硕建设 ERP - 微信小程序

本目录为宏硕 ERP 的微信小程序端，面向项目经理与管理层，提供仪表盘（待催款、超期里程碑、预算预警）、项目列表与项目详情摘要。

## 使用前配置

1. **申请小程序**  
   在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序，获取 AppID。

2. **修改 `project.config.json`**  
   将 `"appid": "请填写小程序 AppID"` 改为你的 AppID。

3. **配置后端地址**  
   编辑 `utils/config.js`，将 `BASE_URL` 改为实际后端 API 地址（需 HTTPS）。  
   在微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名中，将上述域名加入 **request 合法域名**。

4. **用微信开发者工具打开**  
   选择本目录（`miniprogram`）作为项目目录，即可预览与调试。真机预览需在开发者工具中点击「预览」并扫码。

## 功能说明

- **登录**：使用与 PC 端一致的账号密码，调用 `POST /api/auth/login`，登录成功后 Token 存于本地。
- **仪表盘**：拉取近期待催款（`/api/payment-plans/upcoming`）、里程碑超期预警（`/api/milestones/overdue`）、项目列表及预算预警。
- **项目列表**：展示项目名称、编号、进度、合同金额，点击进入详情。
- **项目详情**：展示合同金额、已收款、进度、预算及预警状态。

## 接口依赖

与现有 Spring Boot 后端共用接口，认证方式为请求头 `Authorization: Bearer <token>`。需保证后端 CORS 或小程序 request 域名已配置正确。
