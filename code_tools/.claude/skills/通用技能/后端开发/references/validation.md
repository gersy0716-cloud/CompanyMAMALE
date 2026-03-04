# 数据校验 (Validation)

所有外部输入（Request Body, Query, Params）都必须在 Controller 层进行校验。

---

## 🛠️ Zod Schema 定义

推荐将 Schema 定义在 `types/` 或功能模块的 `schemas/` 目录下。

```typescript
import { z } from 'zod';

// 1. 创建 Schema
export const CreateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
  role: z.enum(['admin', 'user']).optional().default('user'),
});

// 2. 推导类型
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

---

## 🕹️ 在 Controller 中使用

```typescript
async createUser(req: Request, res: Response): Promise<void> {
  try {
    // 校验数据，若失败会抛出 ZodError
    const data = CreateUserSchema.parse(req.body);
    
    // 使用已校验的数据
    const newUser = await userService.create(data);
    this.handleCreated(res, newUser);
  } catch (error) {
    this.handleError(error, res, 'createUser');
  }
}
```

---

## 💡 常用校验技巧

- **字符串处理**：`z.string().trim().min(1)` (非空且去除首尾空格)。
- **数字转换**：`z.coerce.number()` (自动将 query 中的字符串转为数字)。
- **数组**：`z.array(z.string())`。
- **日期**：`z.string().datetime()`。
