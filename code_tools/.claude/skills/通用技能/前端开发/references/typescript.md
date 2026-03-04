# TypeScript规范

---

## 严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

**禁止`any`**，使用`unknown`替代

---

## 类型导入

```typescript
// ✅ 使用type关键字
import type { User, Post } from '~types';
import type { SxProps, Theme } from '@mui/material';

// 混合导入
import React, { useState } from 'react';
import type { FC, ReactNode } from 'react';
```

---

## Props接口

```typescript
/** 用户卡片组件 */
interface UserCardProps {
  /** 用户ID */
  userId: number;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 点击回调 */
  onClick?: (id: number) => void;
  /** 子元素 */
  children?: ReactNode;
}

export const UserCard: React.FC<UserCardProps> = ({
  userId,
  showAvatar = true,
  onClick,
  children,
}) => { /* ... */ };
```

---

## 类型定义位置

```
features/my-feature/
  types/
    index.ts        # 导出所有类型
    feature.ts      # Feature相关类型
    dto.ts          # DTO类型
```

```typescript
// types/index.ts
export type { Feature, FeatureDetail } from './feature';
export type { CreateFeatureDto, UpdateFeatureDto } from './dto';
```

---

## API响应类型

```typescript
// 泛型响应
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// 分页响应
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 常用工具类型

```typescript
// 部分属性可选
type UpdateDto = Partial<CreateDto>;

// 选取部分属性
type Summary = Pick<Feature, 'id' | 'name'>;

// 排除属性
type PublicUser = Omit<User, 'password'>;
```
