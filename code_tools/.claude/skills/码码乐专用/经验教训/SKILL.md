---
name: lessons-learned
description: 码码乐项目开发实战经验与避坑指南。涵盖 Electron 打包分发（NSIS、分片上传）、URL 参数鉴权逻辑、容错性设计及极致性能优化（DOM 批量操作、Set 查找）。当用户询问"如何打包"、"处理性能瓶颈"、"设计容错逻辑"或"解析 URL"时触发。
---

# 开发经验与教训 (Knowledge Base)

> 🚀 打包分发 | 🛡️ 容错设计 | ⚡ 性能极限 | 🔗 参数规范

本技能记录了码码乐项目从 Web 端到 Electron 桌面端迁移过程中的所有核心坑点与优化实践，是保证项目稳定性的关键知识库。

## 📚 实战参考 (References)

| 分类 | 内容描述 | 详细参考 |
|------|----------|---------|
| **打包分发** | Electron NSIS 配置、国内镜像避坑与大文件分片上传 | [lessons-electron-packaging.md](references/lessons-electron-packaging.md) |
| **参数与权限** | 动态 token 读取、teachertoken 模式切换与 URL 规范 | [lessons-url-params.md](references/lessons-url-params.md) |
| **容错设计** | 数据一致性防御、Fallback UI 处理与逻辑删除 | [lessons-fault-tolerance.md](references/lessons-fault-tolerance.md) |
| **性能优化** | 三级缓存策略、Promise.all 并发与 DOM 渲染瓶颈 | [lessons-performance-optimization.md](references/lessons-performance-optimization.md) |

## 🔗 相关链接

- **项目管理**: [../../通用技能/开发模式/SKILL.md](../../通用技能/开发模式/SKILL.md)
- **API 规范**: [../API接口/SKILL.md](../API接口/SKILL.md)
