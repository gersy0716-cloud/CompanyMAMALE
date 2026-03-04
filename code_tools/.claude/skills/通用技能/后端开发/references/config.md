# 配置规范 (Configuration)

## 🚫 禁用 process.env

禁止在业务代码中直接读取 `process.env`，这会导致配置来源不明且类型缺失。

---

## ⚙️ UnifiedConfig 设计

所有配置必须经过 `internal/.shared/config/unifiedConfig.ts` 处理。

```typescript
// ✅ 正确示例
import { config } from '../../../../internal/.shared/config/unifiedConfig';

const port = config.app.port;
const sentryDsn = config.monitoring.sentry.dsn;
```

---

## 📁 .env 规范

环境变量仅用于存储敏感信息（Secrets）或环境差异值：

- `PORT=3000`
- `DATABASE_URL=...`
- `SENTRY_DSN=...`

---

## 🛠️ 配置结构建议

```typescript
export const config = {
  app: {
    env: process.env.NODE_ENV,
    port: parseInt(process.env.PORT || '3000'),
    version: '1.0.0',
  },
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    }
  },
  database: {
    url: process.env.DATABASE_URL
  }
};
```
