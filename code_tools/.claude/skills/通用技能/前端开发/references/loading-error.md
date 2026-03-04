# 加载与错误状态 (Loading & Error States)

---

## ⚠️ 关键规则：禁止早期Return

**问题**：早期return导致布局偏移(CLS)、滚动位置丢失。

```typescript
// ❌ 禁止 - 导致布局偏移
const Component = () => {
  const { isLoading } = useQuery();
  if (isLoading) return <Spinner />;  // WRONG!
  return <Content />;
};
```

---

## 方案1：SuspenseLoader（推荐）

```typescript
import { SuspenseLoader } from '~components/SuspenseLoader';
import { useSuspenseQuery } from '@tanstack/react-query';

const Inner: React.FC = () => {
  const { data } = useSuspenseQuery({ ... });
  return <Display data={data} />;
};

export const Outer: React.FC = () => (
  <SuspenseLoader>
    <Inner />
  </SuspenseLoader>
);
```

---

## 错误提示：useMuiSnackbar

**必须使用MUI Snackbar，禁用第三方toast库。**

```typescript
import { useMuiSnackbar } from '@/hooks/useMuiSnackbar';

const { showSuccess, showError } = useMuiSnackbar();
```

---

## 错误边界 (ErrorBoundary)

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <SuspenseLoader>
    <MyComponent />
  </SuspenseLoader>
</ErrorBoundary>
```
