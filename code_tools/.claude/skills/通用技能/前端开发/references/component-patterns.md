# 组件模式 (Component Patterns)

---

## 标准组件结构

```typescript
// 1. 导入
import React, { useState, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { FeatureData } from '~types/feature';

// 2. Props接口
interface MyComponentProps {
  id: number;
  onAction?: () => void;
}

// 3. 组件定义
export const MyComponent: React.FC<MyComponentProps> = ({ id, onAction }) => {
  // Hooks
  const [state, setState] = useState<string>('');
  const { data } = useSuspenseQuery({
    queryKey: ['feature', id],
    queryFn: () => api.getFeature(id),
  });

  // Handlers
  const handleClick = useCallback(() => {
    setState('updated');
    onAction?.();
  }, [onAction]);

  // Render
  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>{/* Content */}</Paper>
    </Box>
  );
};

// 4. 默认导出
export default MyComponent;
```

---

## 懒加载重型组件

```typescript
// 路由/页面级懒加载
const MyPage = React.lazy(() => import('@/features/my-feature/MyPage'));

// 使用时包裹SuspenseLoader
<SuspenseLoader>
  <MyPage />
</SuspenseLoader>
```

**何时懒加载**：

- DataGrid、图表、富文本编辑器
- 路由页面组件
- 弹窗内的复杂表单

---

## 组件分类

| 类型 | 位置 | 特点 |
|------|------|------|
| 页面组件 | `routes/` | 路由级，懒加载 |
| 功能组件 | `features/{name}/components/` | 领域相关 |
| 通用组件 | `components/` | 3+处复用 |
