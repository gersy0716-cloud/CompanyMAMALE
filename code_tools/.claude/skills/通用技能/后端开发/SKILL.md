---
name: backend-dev
description: 码码乐后端开发规范（Node.js + Prisma）。采用 Controller-Service-Repository 分层架构，强调 Zod 强类型校验与统一错误上报。当用户询问"Node.js 后端"、"创建 Service"、"编写 Prisma 查询"或"配置路由控制器"时触发。
---

# 后端开发规范

基于 Node.js + TypeScript + Prisma 的分层架构规范。

---

## ⚡ Quick Start

### 新后端功能检查清单

- [ ] **Route**: 定义简洁，直接委托给 Controller。
- [ ] **Controller**: 继承 `BaseController`，处理请求/响应。
- [ ] **Service**: 处理业务逻辑，支持依赖注入。
- [ ] **Repository**: 封装复杂的数据库访问（Prisma）。
- [ ] **Validation**: 使用 Zod 进行输入验证。
- [ ] **Sentry**: 关键路径包含错误捕捉。
- [ ] **Tests**: 包含单元测试或集成测试。

---

## 🎯 核心原则

1. **Routes 仅路由，Controllers 控制**：禁止在 Routes 中写业务逻辑。
2. **继承 BaseController**：规范成功的响应与统一的错误处理。
3. **分层原则**：每一层（Service, Repository）职责单一。
4. **Zod 数据校验**：所有外部输入（body, query, params）必须校验。
5. **禁用 process.env**：统一使用 `unifiedConfig`。
6. **Sentry 全覆盖**：所有捕获的异常必须上报。
7. **测试先行**：关键逻辑必须有测试覆盖。

---

## 📚 详细文档

| 模块 | 内容 |
|------|------|
| [architecture.md](references/architecture.md) | 架构概览、分层模型、职责边界 |
| [routing.md](references/routing.md) | 路由委托、BaseController、响应方法 |
| [validation.md](references/validation.md) | Zod Schema、数据校验、DTO 模式 |
| [database.md](references/database.md) | Prisma Service、Repository、事务、优化 |
| [config.md](references/config.md) | UnifiedConfig、环境变量、配置结构 |

---

## 📋 常用导入速查

```typescript
// Express & Routing
import { Router, Request, Response } from 'express';

// Controller Base
import { BaseController } from '../controllers/BaseController';

// Validation
import { z } from 'zod';

// Error Tracking
import * as Sentry from '@sentry/node';

// Database
import { PrismaClient } from '@prisma/client';

// Config
// 建议：统一从架构定义的 config 模块导入
import { config } from '@/config/unifiedConfig';
```
