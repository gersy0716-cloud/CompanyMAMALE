---
name: navigation-testing
description: 码码乐 路由与 UI 自动化测试指南。涵盖 Cookie-JWT 模式的 API 测试及 browser-use 视觉化测试规范（必须配合 --browser real）。当用户询问"接口测试"、"JWT 验证"、"browser-use"或"验证界面跳转"时触发。
---

# 路由测试 (API Testing)

## 🎯 目的

提供测试已认证路由的标准模式（基于 Cookie-JWT 模式）。

---

## 🛠️ 测试方法

### 方法 1：自动化脚本 (推荐)

使用项目内置的 `test-auth-route.js` 处理身份验证。

```bash
# GET 请求
node scripts/test-auth-route.js http://localhost:3000/api/endpoint

# POST 请求
node scripts/test-auth-route.js \
    http://localhost:3000/api/submit \
    POST \
    '{"key": "value"}'
```

### 方法 2：手动 Curl

从自动化脚本输出中获取 `refresh_token` 并进行测试：

```bash
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -b "refresh_token=<TOKEN>" \
  -d '{"data": "test"}'
```

### 方法 3：Mock 认证 (仅限开发环境)

在 `.env` 中设置 `MOCK_AUTH=true`。

```bash
curl -H "X-Mock-Auth: true" \
     -H "X-Mock-User: test-user" \
     http://localhost:3002/api/protected
```

---

### 方法 4：Agentic 浏览器自动化 (browser-use)

在使用 `browser-use` 等 Agentic 浏览器工具执行视觉化任务或复杂跳转测试时，请务必调用：

```bash
# 必须显式指定使用真实浏览器，以防环境不兼容或被反爬拦截
--browser real
```

---

## 📋 常用场景测试

- **表单提交**: `node scripts/test-auth-route.js [URL] POST [JSON]`
- **文件上传**: 使用 `curl -F "file=@path"`。
- **工作流启动**: 检查 response 中的 `instanceId`。

---

## 🔍 验证数据库变更

测试完成后，应手动检查数据库以确认数据一致性：

```bash
docker exec -i local-mysql mysql -u root -ppassword1 db_name
mysql> SELECT * FROM TableName WHERE id = 123;
```

---

## ⚡ 端口速查表

- **Users**: 3000
- **Projects**: 3001
- **Form**: 3002
- **Email**: 3003
- **Uploads**: 5000
