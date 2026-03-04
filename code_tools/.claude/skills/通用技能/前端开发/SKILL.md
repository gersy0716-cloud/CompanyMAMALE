---
name: frontend-dev
description: 码码乐前端开发规范（React + TS + TanStack）。涵盖组件检查清单、懒加载模式、Suspense 加载处理及 features/ 目录结构规范。当用户询问"React 开发"、"前端架构"、"创建新组件"或"配置路由"时触发。
---

# 前端开发规范

React + TypeScript + TanStack项目开发规范

---

## ⚡ Quick Start

### 新组件检查清单

- [ ] 使用 `React.FC<Props>` + TypeScript
- [ ] 重型组件使用 `React.lazy()` 懒加载
- [ ] 用 `<SuspenseLoader>` 包裹，禁止早期return
- [ ] 数据获取使用 `useSuspenseQuery`
- [ ] 使用导入别名：`@/`、`~types`、`~components`
- [ ] 样式：<100行内联，>100行分离

### 新功能检查清单

- [ ] 创建 `features/{name}/` 目录
- [ ] 子目录：`api/`、`components/`、`hooks/`、`types/`
- [ ] 懒加载功能组件
- [ ] 导出公共API到 `index.ts`

---

## 🎯 核心原则

1. **懒加载重型组件** - Routes、DataGrid、图表
2. **Suspense处理加载** - 禁止if(loading)早期return
3. **useSuspenseQuery** - 主要数据获取模式
4. **features/组织** - api/、components/、hooks/子目录
5. **样式按大小分** - <100行内联，>100行分离
6. **导入别名** - @/、~types、~components、~features
7. **useMuiSnackbar** - 用户通知（禁用react-toastify）

---

## 📚 子模块

## 📚 详细文档

| 设计与样式 | 内容 |
|:---|:---|
| [styling.md](references/styling.md) | MUI v7、sx prop、Grid v7、样式分离 |
| [antd.md](references/antd.md) | Ant Design 基础、主题定制、组件分类 |
| [remotion.md](references/remotion.md) | Remotion 视频编程、动画、渲染规范 |

| 模式与架构 | 内容 |
|:---|:---|
| [typescript.md](references/typescript.md) | 严格模式、Props、DTO、工具类型 |
| [component-patterns.md](references/component-patterns.md) | 组件结构、懒加载、Suspense |
| [file-structure.md](references/file-structure.md) | features/ 目录、导入别名、命名规范 |

| 数据与状态 | 内容 |
|:---|:---|
| [data-fetching.md](references/data-fetching.md) | React Query、Suspense、Mutation |
| [loading-error.md](references/loading-error.md) | 各种加载态、Snackbar、ErrorBoundary |
| [routing-nav.md](references/routing-nav.md) | TanStack Router、动态路由、面包屑 |
| [performance.md](references/performance.md) | memo/callback、防抖、内存清理 |

---

## 📋 常用导入速查

```typescript
// React
import React, { useState, useCallback, useMemo } from 'react';
const Heavy = React.lazy(() => import('./Heavy'));

// MUI
import { Box, Paper, Typography, Button } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

// TanStack Query
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';

// TanStack Router  
import { createFileRoute } from '@tanstack/react-router';

// 项目组件
import { SuspenseLoader } from '~components/SuspenseLoader';
import { useMuiSnackbar } from '@/hooks/useMuiSnackbar';
```
