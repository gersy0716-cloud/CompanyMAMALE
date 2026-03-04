# 数据库模式 (Database)

采用 Prisma 作为核心 ORM。

---

## 💉 Prisma Service

应通过统一的 `prismaService` 访问数据库，以确保连接管理和中间件逻辑。

```typescript
import { prismaService } from '../lib/prismaService';

// 基本查询
const users = await prismaService.user.findMany({
  where: { active: true },
  take: 10
});
```

---

## 📦 Repository 模式

当查询包含复杂的 `include`, `select` 或原生 SQL 时，必须封装进 Repository 层。

```typescript
// repositories/userRepository.ts
export const userRepository = {
  findActiveWithProfile: async (id: string) => {
    return await prismaService.user.findUnique({
      where: { id },
      include: {
        profile: true,
        settings: { select: { theme: true } }
      }
    });
  }
};
```

---

## ⛓️ 事务处理 (Transactions)

多表更新必须使用事务：

```typescript
await prismaService.$transaction(async (tx) => {
  const account = await tx.account.decrement(id, balance);
  const log = await tx.auditLog.create({ data: { ... } });
  return account;
});
```

---

## ⚡ 性能优化

- **只选择需要的列**：使用 `select` 而非 `include` 整个对象。
- **分页控制**：必须使用 `take` (limit) 和 `skip` (offset)。
- **监控慢查询**：复杂查询应使用 `Sentry.startSpan` 包裹。
