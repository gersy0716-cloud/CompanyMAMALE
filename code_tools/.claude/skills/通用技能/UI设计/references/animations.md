# 交互动画规范

---

## 悬浮动画

| 类型 | 效果 | 用途 |
|------|------|------|
| 微浮 | `translateY(-3px)` | 普通卡片 |
| 中浮 | `translateY(-4px)` | 小组卡片 |
| 高浮 | `translateY(-6px)` | 玻璃卡片 |

---

## 缩放动画

| 元素 | 效果 | 触发 |
|------|------|------|
| 标签 | `scale(1.08)` | 悬浮放大 |
| 按钮 | `scale(0.98)` | 按下缩小 |

---

## 旋转动画

- **小组卡片**: `rotate(1deg)` - 悬浮轻微旋转

---

## 过渡时间

| 速度 | 时间 | 用途 |
|------|------|------|
| 快速 | 0.2s | 按钮按下 |
| 标准 | 0.3s | 悬浮效果 |
| 缓慢 | 0.4s | 玻璃卡片 |

---

## CSS 示例

```css
/* 卡片悬浮 */
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* 按钮按下 */
.button:active {
  transform: scale(0.98);
  transition: transform 0.2s ease;
}
```
