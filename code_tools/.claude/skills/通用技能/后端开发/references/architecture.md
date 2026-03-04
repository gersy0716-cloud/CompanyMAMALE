# 后端架构概览

采用分层架构（Layered Architecture）以确保代码的可维护性与可扩展性。

---

## 🏗️ 分层模型

```text
HTTP Request
    ↓
Routes (仅路由分发)
    ↓
Controllers (请求解析、响应格式化)
    ↓
Services (业务逻辑、工作流控制)
    ↓
Repositories (数据库访问封装 - 可选)
    ↓
Database (Prisma Client)
```

---

## ⚖️ 职责边界

### 1. Routes (路由层)

- **职责**：将 URL 路径映射到 Controller 方法。
- **禁忌**：禁止包含任何业务逻辑。

### 2. Controllers (控制器层)

- **职责**：解析请求参数 (body, query, params)、调用 Service、调用 `BaseController` 的成功/失败方法。
- **关联文件**：[routing.md](routing.md)

### 3. Services (服务层)

- **职责**：核心业务逻辑、权限检查、多数据源组合、触发通知等。
- **特点**：这一层不感知 HTTP 请求/响应（不使用 `req`, `res`）。

### 4. Repositories (仓储层)

- **职责**：封装底层的 Prisma 查询。当查询逻辑变得复杂（如多表关联、大量原生 SQL）时使用。
- **关联文件**：[database.md](database.md)

---

## 🔄 请求生命周期

1. **进入**：路由转发 -> Middleware (Auth, Logger)。
2. **校验**：Controller 使用 Zod 校验输入。
3. **执行**：Service 执行业务逻辑。
4. **响应**：Controller 捕获异常 -> Sentry 上报 -> 统一格式输出。
