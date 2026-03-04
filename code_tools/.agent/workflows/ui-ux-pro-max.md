---
description: 极速设计专家工作流：将项目视觉与交互体验推向 Pro Max 巅峰
---

# 🚀 UI-UX-Pro-Max 执行流程

本工作流旨在强制执行 `uidesign.tips` 沉淀的高阶设计规范。

## 1. 结构与排版自检

// turbo
1. 检查所有文本容器的 `max-width`。
   - 若超过 `700px`，自动应用 `.pro-max-container` 或设置 `max-width: 65ch`。
2. 验证圆角嵌套。
   - 搜索具有嵌套结构的元素（如 Card > Image）。
   - 确保 `OuterRadius = InnerRadius * 2`。

## 2. 交互逻辑优化

3. 识别所有“危险”操作（删除、重置）。
   - 强制使用红色组件。
   - 检查确认文案，必须包含具体对象（如“删除项目”而非“确定”）。
4. 扫描首屏 (Above the Fold)。
   - 确保至少存在一个具有 `primary` 类的主 CTA 按钮。
   - 移除首屏内重复的二级主按钮。

## 3. 心理学引导增强

5. 检查登录/注册表单。
   - 若未提供社交登录，建议添加。
   - 在按钮上方添加“Value Preview”提示（如“30秒完成”）。
6. Pricing/Selection 页面。
   - 对“推荐项”应用 `.pro-max-elevation` 效果。

## 4. 自动化工具调用

// turbo
7. 运行设计校验脚本（若可用）。
8. 自动替换通用组件为 `code tools/.shared/ui-ux-pro-max/` 中的 Pro 模板结构。
