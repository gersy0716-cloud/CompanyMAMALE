# 图标库规范 (Icon Libraries)

本模块集成了推荐使用的两大图标库：IconPark (字节跳动)、Lucide Animated。

---

## 1. IconPark 图标库 (ByteDance)

高质量开源图标库，支持 2400+ 矢量图标，具备极强的自定义能力。

🔗 **官网**: [iconpark.oceanengine.com](https://iconpark.oceanengine.com/official/)

### ⚡ 调用示例 (React)

```jsx
import { Home } from '@icon-park/react';

// 基本用法
<Home theme="outline" size="24" fill="#333" strokeWidth={4}/>

// 多色模式
<Home theme="multi-color" size="24" fill={['#333' ,'#2F88FF' ,'#FFF' ,'#43CCF8']}/>
```

### 🎯 设计规范

- **线宽一致性**: 推荐所有图标 `strokeWidth` 保持为 `4`。
- **主题契合**: 侧边栏/导航栏使用 `outline`；激活状态使用 `filled` 或 `multi-color`。

---

## 2. Lucide Animated 图标库

基于 Motion + Lucide 的微动效图标。

🔗 **官网**: [lucide-animated.com](https://lucide-animated.com/)

### 🎯 常用图标速查

- **用户操作**: `check`, `plus`, `download`, `search`, `settings`, `copy`
- **导航交互**: `menu`, `chevron-right`, `home`, `undo`, `logout`
- **状态反馈**: `loader-pinwheel`, `bell`, `heart`, `sparkles`

### 💎 微动效建议

- **时长**: 建议 `200ms - 300ms`。
- **缓动**: 优先使用 `spring` 参数模拟物理惯性，提升高级感。
