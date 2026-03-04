# 路由与控制器 (Routing & Controllers)

## 🛣️ 路由委托模式

为了保持路由文件的整洁，禁止在路由定义中包含逻辑。

```typescript
// ✅ 正确示例 (src/routes/userRoutes.ts)
import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

router.get('/:id', (req, res) => userController.getUser(req, res));
router.post('/', (req, res) => userController.createUser(req, res));

export default router;
```

---

## 🏗️ BaseController 规范

所有 Controller 类都必须继承 `BaseController`，以使用标准化的响应方法。

```typescript
import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { userService } from '../services/userService';

// 1. 类定义与继承
export class UserController extends BaseController {
  
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      // 2. 调用服务层
      const user = await userService.findById(req.params.id);
      
      // 3. 成功响应 (handleSuccess 自动按规范格式化)
      this.handleSuccess(res, user);
    } catch (error) {
      // 4. 异常处理 (handleError 自动上报 Sentry)
      this.handleError(error, res, 'getUser');
    }
  }
}

export const userController = new UserController();
```

---

## 🧪 常用响应方法

- `this.handleSuccess(res, data)`：返回 200 OK。
- `this.handleCreated(res, data)`：返回 201 Created。
- `this.handleError(error, res, methodName)`：统一处理并上报错误。
