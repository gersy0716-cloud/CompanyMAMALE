# 性能优化 (Performance)

---

## 渲染优化

### useMemo & useCallback

- **useMemo**: 缓存昂贵的计算结果。
- **useCallback**: 缓存稳定函数引用，防止子组件无谓重渲染。

```typescript
const memoizedValue = useMemo(() => compute(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a), [a]);
```

### React.memo

缓存组件，仅在 Props 变化时重新渲染。

---

## 防抖与节流

使用 `use-debounce` 处理输入建议、搜索等高频事件。

---

## 内存清理

必须在 `useEffect` 返回函数中清理：

- `setInterval` / `setTimeout`
- `window.addEventListener`
- `AbortController`

---

## 懒加载 (Code Splitting)

使用 `React.lazy()` 或 `import()` 动态加载大型库（如 jsPDF, XLSX）。
