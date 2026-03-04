---
name: mamale-color-scheme
description: 码码乐 AI 主平台官方配色规范。定义了品牌强调色（#9281FF）、背景色、文字层级色及 CSS 变量使用规范。当用户询问"配色方案"、"品牌色"、"按钮颜色"或"设计系统配色"时触发。
---

# 码码乐AI主平台配色方案

> 官方配色规范 | 适用于所有码码乐平台前端界面

---

## 🎨 主配色方案

### 核心颜色

| 颜色名称 | 色值 | 用途 | 示例 |
|:---|:---|:---|:---|
| **主强调色** | `#9281FF` | 紫色按钮、标签、主要交互元素 | 按钮、选中状态、链接 |
| **辅助色** | `#F5F5F5` | 导航非选中标签背景、次要区域 | 未选中标签、卡片背景 |
| **背景色** | `#FFFFFF` | 页面主背景 | 页面底色 |
| **文字主色** | `#333333` | 标题、工具名、主要文字 | 标题、按钮文字 |
| **文字辅助色** | `#666666` | 次要说明、描述文字 | 说明文字、提示信息 |

---

## 📐 使用规范

### CSS 变量定义

```css
:root {
    /* 主色系 */
    --primary-color: #9281FF;           /* 主强调色 */
    --secondary-color: #F5F5F5;         /* 辅助色 */

    /* 背景色 */
    --bg-primary: #FFFFFF;              /* 主背景 */
    --bg-secondary: #F5F5F5;            /* 次要背景 */

    /* 文字颜色 */
    --text-primary: #333333;            /* 主文字 */
    --text-secondary: #666666;          /* 辅助文字 */

    /* 交互状态 */
    --primary-hover: #7B6AE6;           /* 主色悬停（主色加深10%）*/
    --primary-active: #6A59D9;          /* 主色按下（主色加深20%）*/
    --primary-light: rgba(146, 129, 255, 0.1);  /* 主色浅色背景 */
}
```

### 使用场景

#### 1. 按钮

```css
/* 主要按钮 */
.btn-primary {
    background: var(--primary-color);
    color: #FFFFFF;
}

.btn-primary:hover {
    background: var(--primary-hover);
}

/* 次要按钮 */
.btn-secondary {
    background: var(--secondary-color);
    color: var(--text-primary);
}
```

#### 2. 标签/徽章

```css
.tag {
    background: var(--primary-light);
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
}
```

#### 3. 导航栏

```css
/* 选中状态 */
.nav-item.active {
    background: var(--primary-color);
    color: #FFFFFF;
}

/* 未选中状态 */
.nav-item {
    background: var(--secondary-color);
    color: var(--text-primary);
}
```

#### 4. 文字层级

```css
/* 标题 */
h1, h2, h3 {
    color: var(--text-primary);
}

/* 正文 */
p {
    color: var(--text-primary);
}

/* 说明文字 */
.description, .hint {
    color: var(--text-secondary);
}
```

---

## 🎯 设计原则

1. **主强调色使用克制**：仅用于主要交互元素（按钮、选中状态、重要链接）
2. **保持高对比度**：确保文字在背景上清晰可读
3. **一致性**：所有页面使用相同的配色方案
4. **可访问性**：确保色盲用户也能区分不同状态

---

## 🚫 禁止事项

- ❌ 不要随意修改主强调色色值
- ❌ 不要在大面积区域使用主强调色作为背景
- ❌ 不要使用低对比度的文字颜色组合
- ❌ 不要混用其他紫色系色值

---

## 📝 扩展色值（可选）

如需要更多状态颜色，可使用以下扩展色值：

```css
:root {
    /* 状态色 */
    --success-color: #52C41A;           /* 成功 */
    --warning-color: #FAAD14;           /* 警告 */
    --error-color: #F5222D;             /* 错误 */
    --info-color: #1890FF;              /* 信息 */

    /* 边框色 */
    --border-color: #E8E8E8;            /* 默认边框 */
    --border-light: #F0F0F0;            /* 浅色边框 */

    /* 阴影 */
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

---

## 📅 更新日志

- **2026-01-26**：创建码码乐AI主平台配色方案
