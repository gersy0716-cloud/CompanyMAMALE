# 数据获取 (Data Fetching)

TanStack Query数据获取规范。

---

## 主模式：useSuspenseQuery

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { featureApi } from '../api/featureApi';

const MyComponent: React.FC<{ id: number }> = ({ id }) => {
  // data一定有值，无需判断loading
  const { data } = useSuspenseQuery({
    queryKey: ['feature', id],
    queryFn: () => featureApi.getById(id),
  });

  return <Display data={data} />;
};

// 外层包裹SuspenseLoader
<SuspenseLoader>
  <MyComponent id={123} />
</SuspenseLoader>
```

---

## API服务层

```typescript
// features/my-feature/api/myFeatureApi.ts
import apiClient from '@/lib/apiClient';
import type { Feature, CreateFeatureDto } from '../types';

export const myFeatureApi = {
  getAll: async (): Promise<Feature[]> => {
    const { data } = await apiClient.get('/features');
    return data;
  },
  
  getById: async (id: number): Promise<Feature> => {
    const { data } = await apiClient.get(`/features/${id}`);
    return data;
  },
  
  create: async (dto: CreateFeatureDto): Promise<Feature> => {
    const { data } = await apiClient.post('/features', dto);
    return data;
  },
};
```

---

## Mutation模式

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMuiSnackbar } from '@/hooks/useMuiSnackbar';

const useCreateFeature = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useMuiSnackbar();

  return useMutation({
    mutationFn: myFeatureApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      showSuccess('创建成功');
    },
    onError: () => showError('创建失败'),
  });
};
```

---

## 路由格式

```typescript
// ✅ 正确：/form/route
apiClient.get('/form/route');

// ❌ 错误：/api/form/route
apiClient.get('/api/form/route');
```
