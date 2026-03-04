# 路由导航 (Routing)

TanStack Router 文件夹路由规范。

---

## 核心结构

```
routes/
  __root.tsx          # 根布局
  index.tsx           # 首页 /
  my-route/
    index.tsx         # /my-route
    $id/              # 动态路由 /my-route/:id
```

---

## 导航方式

### Link组件 (声明式)

```tsx
<Link to="/my-route" params={{ id: '123' }}>跳转</Link>
```

### useNavigate (编程式)

```tsx
const navigate = useNavigate();
navigate({ to: '/my-route/$id', params: { id: '123' } });
```

---

## 面包屑与数据加载

在 `createFileRoute` 的 `loader` 中定义：

```typescript
loader: () => ({ crumb: '页面标题' })
```
