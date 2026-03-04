# 文件组织规范 (File Structure)

---

## features/ vs components/

**features/** - 领域相关代码（有自己的API、逻辑、多个组件）

```
features/posts/
  api/postApi.ts
  components/PostTable.tsx
  hooks/usePostQueries.ts
  types/index.ts
  index.ts
```

**components/** - 通用组件（3+处使用，无领域逻辑）

```
components/
  SuspenseLoader/SuspenseLoader.tsx
  LoadingOverlay/LoadingOverlay.tsx
  ErrorBoundary/ErrorBoundary.tsx
```

---

## 导入别名（vite.config.ts）

```typescript
// ✅ 使用别名
import { apiClient } from '@/lib/apiClient';
import { SuspenseLoader } from '~components/SuspenseLoader';
import { postApi } from '~features/posts/api/postApi';
import type { User } from '~types/user';

// ❌ 避免深层相对路径
import { apiClient } from '../../../lib/apiClient';
```

| 别名 | 路径 | 用途 |
|------|------|------|
| `@/` | `src/` | lib、hooks、config |
| `~types` | `src/types` | 类型导入 |
| `~components` | `src/components` | 通用组件 |
| `~features` | `src/features` | 功能模块 |

---

## 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 组件 | PascalCase.tsx | `MyComponent.tsx` |
| Hook | camelCase+use.ts | `useMyFeature.ts` |
| API | camelCase+Api.ts | `postApi.ts` |
| 类型 | index.ts | `types/index.ts` |

---

## API服务模式

```typescript
// features/my-feature/api/myFeatureApi.ts
import apiClient from '@/lib/apiClient';

export const myFeatureApi = {
  getItem: async (id: number) => {
    const { data } = await apiClient.get(`/items/${id}`);
    return data;
  },
  createItem: async (payload) => {
    const { data } = await apiClient.post('/items', payload);
    return data;
  },
};
```

---

## 导入顺序

```typescript
// 1. React
import React, { useState, useCallback } from 'react';

// 2. 第三方库
import { Box, Paper } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';

// 3. 别名导入
import { apiClient } from '@/lib/apiClient';
import { SuspenseLoader } from '~components/SuspenseLoader';

// 4. 类型导入
import type { Post } from '~types/post';

// 5. 相对导入
import { MySubComponent } from './MySubComponent';
```

---

## 公共API导出

```typescript
// features/my-feature/index.ts
export { MyFeatureMain } from './components/MyFeatureMain';
export { useMyFeature } from './hooks/useMyFeature';
export { myFeatureApi } from './api/myFeatureApi';
export type { MyFeatureData } from './types';
```
