---
name: calendar-dev
description: 码码乐日历与排班组件开发指南。涵盖 API 获取、节假日缓存策略、性能优化（DocumentFragment）、及开发常见问题（命名冲突、日期格式一致性）。当用户要求"修改日历"、"开发排班功能"、"优化日历性能"或"处理节假日数据"时触发。
---

# 日历组件开发指南 (Knowledge Base)

> 📅 日历渲染 | 🏝️ 节假日同步 | 🧠 状态隔离 | ⚡ 性能优化

本技能沉淀了码码乐项目中日历与教师值日排班组件的核心开发经验，旨在解决多模块共存下的命名冲突与跨年数据同步难题。

## 🎯 核心规范

- **统一格式**：全站日期 Key 必须使用 `MM-DD` 格式。
- **离线优先**：节假日数据必须具备 24 小时 `localStorage` 缓存能力。
- **渲染基准**：超过 100 个日期节点的渲染必须使用 `DocumentFragment`。
- **状态安全**：不同业务日历（如基础 vs 排班）必须使用独立命名空间的状态对象。

## 📚 详细参考 (References)

| 分类 | 内容描述 | 详细参考 |
|------|----------|---------|
| **缓存机制** | 节假日 API 数据源、24h 缓存逻辑与跨年加载 | [calendar-api-cache.md](references/calendar-api-cache.md) |
| **开发 FAQ** | 解决命名冲突、null 年份陷阱与日期格式不匹配 | [calendar-faq.md](references/calendar-faq.md) |

## 🔗 相关链接

- **API 规范**: [../../码码乐专用/API接口/SKILL.md](../../码码乐专用/API接口/SKILL.md)
