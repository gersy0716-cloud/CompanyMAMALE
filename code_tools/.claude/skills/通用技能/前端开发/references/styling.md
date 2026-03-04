# 样式规范 (Styling)

MUI v7样式规范。

---

## sx prop（主要方式）

```typescript
import { Box, Paper } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

// 内联样式
<Box sx={{ p: 2, display: 'flex', gap: 2 }}>
  <Paper sx={{ p: 3, borderRadius: 2 }}>
    内容
  </Paper>
</Box>

// 主题访问
<Box sx={(theme) => ({
  color: theme.palette.primary.main,
  bgcolor: theme.palette.background.paper,
})}>
```

---

## 样式分离（>100行）

```typescript
// MyComponent.styles.ts
import type { SxProps, Theme } from '@mui/material';

export const styles: Record<string, SxProps<Theme>> = {
  container: {
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  card: {
    p: 3,
    borderRadius: 2,
    boxShadow: 1,
  },
  header: (theme) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,
  }),
};

// MyComponent.tsx
import { styles } from './MyComponent.styles';

<Box sx={styles.container}>
  <Paper sx={styles.card}>
    <Typography sx={styles.header}>标题</Typography>
  </Paper>
</Box>
```

---

## MUI v7 Grid

```typescript
// ✅ v7语法
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>列1</Grid>
  <Grid size={{ xs: 12, md: 6 }}>列2</Grid>
</Grid>

// ❌ 旧语法
<Grid xs={12} md={6}>  // WRONG
```

---

## 常用sx缩写

| 缩写 | 对应属性 |
|------|----------|
| `p` | padding |
| `m` | margin |
| `px` | paddingLeft + paddingRight |
| `mt` | marginTop |
| `display: 'flex'` | flexbox |
| `gap` | flex gap |
