---
name: error-tracking
description: 码码乐异常追踪规范（Sentry 集成）。定义了控制器异常补获、Cron 任务监控及错误分级上报基准。当用户询问"Sentry 集成"、"捕获异常"、"上报错误"或"监控 Job 状态"时触发。
---

# 错误追踪 (Sentry 集成)

## 🎯 核心规则

> [!IMPORTANT]
> **所有错误必须上报至 Sentry**。禁止仅使用 `console.error`。

---

## 🛠️ 集成模式

### 1. 控制器错误处理 (Controller)

若项目存在 `BaseController`，应统一调用其错误处理方法：

```typescript
try {
  // ... 业务逻辑
} catch (error) {
  this.handleError(error, 'methodName'); // 自动发送至 Sentry
}
```

### 2. 路由/手动错误处理

```typescript
import * as Sentry from '@sentry/node';

try {
  // ... 代逻辑
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'auth', action: 'login' },
    extra: { userId: user.id }
  });
}
```

### 3. Cron Job 模式 (强制)

脚本第一行必须导入初始化文件，并使用 `startSpan` 监控。

```typescript
import '../instrument'; // 必须第一行
import * as Sentry from '@sentry/node';

async function main() {
  return await Sentry.startSpan({ name: 'job.name', op: 'cron' }, async () => {
    try {
      // 执行任务
    } catch (error) {
      Sentry.captureException(error);
    }
  });
}
```

---

## 🚦 错误等级

- **fatal**: 系统不可用（数据库宕机）。
- **error**: 操作失败，需立即关注。
- **warning**: 可恢复的异常或性能下降。
- **info/debug**: 仅用于开发调试。

---

## ✅ 验证清单

- [ ] 是否所有 `try/catch` 均包含 Sentry 上报？
- [ ] 是否添加了必要的上下文（userId, tags）？
- [ ] 是否使用了正确的错误等级？
- [ ] 异步操作是否添加了性能追踪（Spans）？
