---
name: ui-design
description: 指导高颜值 UI 界面设计。涵盖视觉审美（Bento、毛玻璃、质感、阴影）、动效规范、ReactBits 动效库、及原子级组件规范（按钮、卡片、表单）。当用户要求"设计界面"、"美化 UI"、"实现动画"或"创建组件"时触发。
---

# UI 设计规范 (Knowledge Base)

> 🎨 视觉审美 | 🧱 原子组件 | ✨ 创意动效 | 🧪 质感研究

本技能提供从视觉哲学到具体组件实现的全方位指导，旨在打造精致、灵动且具备生产级质感的前端界面。

## 🎯 核心设计准则

- **2x 圆角法则**：外层圆角 = 内层圆角 * 2，Padding 应与圆角差值匹配。
- **Whitespace 优先**：通过负空间（Margin/Padding）区分区域，严禁滥用生硬分割线。
- **环境色阴影**：避免纯黑阴影，使用 `rgba(主色, 0.12)` 营造通透感。
- **Gutenberg 原则**：将核心 CTA 放置在用户视觉流的终点（右下角）。

## 📚 详细设计指南 (References)

| 分类 | 内容描述 | 详细参考 |
|------|----------|---------|
| **视觉基调** | 玻璃拟态、质感、阴影、间距与排版 | [visual-style.md](references/visual-style.md) |
| **色彩体系** | 品牌色、功能色与语义配色方案 | [colors.md](references/colors.md) |
| **前端美学** | 避免 AI 通用味，打造独特界面 | [ui-frontend-design.md](references/ui-frontend-design.md) |
| **画布设计** | 视觉哲学、海报级排版与设计宣言 | [ui-canvas-design.md](references/ui-canvas-design.md) |
| **布局系统** | Bento (便当网格) 布局实战指南 | [bento-layout.md](references/bento-layout.md) |

## 🧱 原子组件规范 (Component Specs)

| 组件 | 交互与逻辑规范参考 |
|------|-------------------|
| **按钮** | [ui-component-buttons.md](references/ui-component-buttons.md) |
| **卡片** | [ui-component-cards.md](references/ui-component-cards.md) |
| **表单** | [ui-component-forms.md](references/ui-component-forms.md) |
| **交互控件** | [ui-component-interaction.md](references/ui-component-interaction.md) |
| **图标标签** | [ui-component-tags-icons.md](references/ui-component-tags-icons.md) |

## ✨ 创意动效库 (ReactBits)

集成 [ReactBits](https://reactbits.dev/) 110+ 动效组件：

- **选型概览**: [ui-react-bits-overview.md](references/ui-react-bits-overview.md)
- **文字动画**: [react-bits-text.md](references/react-bits-text.md)
- **交互动画**: [react-bits-interaction.md](references/react-bits-interaction.md)
- **UI 组件**: [react-bits-ui.md](references/react-bits-ui.md)
- **背景效果**: [react-bits-backgrounds.md](references/react-bits-backgrounds.md)

## 🔗 相关链接

- **用户体验**: [../UX设计/SKILL.md](../UX设计/SKILL.md)
- **配色方案**: [../../码码乐专用/配色方案/SKILL.md](../../码码乐专用/配色方案/SKILL.md)
