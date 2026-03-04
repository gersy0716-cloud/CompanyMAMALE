# Bento UI 便当布局

> 源于日式便当盒的现代网格布局设计模式，用于在有限空间内清晰展示多样化内容。

---

## 核心理念

| 原则 | 说明 |
|------|------|
| **分区展示** | 将不同内容放入独立格子 |
| **视觉平衡** | 大小不一的卡片创造层次 |
| **信息密度** | 单屏展示丰富功能 |
| **响应式友好** | 天然适配 CSS Grid |

---

## CSS Grid 核心实现

### 基础容器

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
}
```

### 跨列跨行

```css
.bento-item--large { grid-column: span 2; grid-row: span 2; }
.bento-item--wide  { grid-column: span 2; }
.bento-item--tall  { grid-row: span 2; }
```

### 命名区域布局

```css
.bento-grid {
  grid-template-areas:
    "hero hero    feature1 feature2"
    "hero hero    feature3 feature3"
    "stat1 stat2  feature4 feature5";
}

.hero     { grid-area: hero; }
.feature1 { grid-area: feature1; }
```

---

## 响应式设计

```css
/* 移动端: 单列 */
@media (max-width: 640px) {
  .bento-grid { grid-template-columns: 1fr; }
}

/* 平板: 2列 */
@media (min-width: 641px) and (max-width: 1024px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
}

/* 桌面: 4列 */
@media (min-width: 1025px) {
  .bento-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 单卡片样式

```css
.bento-item {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.bento-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

---

## 卡片内容类型

| 类型 | 尺寸 | 内容 |
|------|------|------|
| Hero | 2x2 | 核心功能/产品展示 |
| Feature | 1x1 | 单个特性 |
| Wide | 2x1 | 数据图表/代码预览 |
| Tall | 1x2 | 纵向列表/时间线 |
| Stat | 1x1 | 关键数据指标 |

---

## 最佳实践

1. **层次分明** - Hero 卡片最大，引导视线
2. **内容精炼** - 每卡片只传达一个核心信息
3. **视觉呼吸** - 保持 16-24px 统一间距
4. **交互反馈** - 悬浮时有微妙变化
5. **移动优先** - 确保单列下也能良好阅读

---

## 参考资源

- [bentogrids.com](https://bentogrids.com) - 灵感画廊
- Tailwind UI、Framer Templates
