---
name: dev-mode
description: 码码乐复杂任务持久化管理规范。通过 Plan、Context、Tasks 三文件结构应对会话重置，确保研发过程的可追踪性。当用户要求"开始长期任务"、"同步进度"或"防止上下文丢失"时触发。
---

# 开发模式 (Dev Docs Pattern)

为了应对 Claude **上下文重置 (Context Reset)** 导致的信息丢失问题，所有复杂任务必须采用持久化文档管理。

---

## ⚡ Quick Start: 三文件结构

所有复杂任务应在 `dev/active/[task-name]/` 下维护：

1. **[task-name]-plan.md**：战略计划与实施阶段
2. **[task-name]-context.md**：**核心文件**，实时更新会话进度
3. **[task-name]-tasks.md**：细化的任务检查清单

---

## 🔄 核心工作流

### 1. 启动任务

分析需求后，立即创建 `dev/active/` 目录并初始化上述三个文件。

### 2. 开发中更新

**必须频繁更新** `context.md` 中的 `SESSION PROGRESS` 部分。

### 3. 上下文复位后恢复
>
> "请读取 `dev/active/[task-name]/` 下的所有文档以同步当前任务状态。"

---

## 📚 参考资料

| 资源 | 内容 |
|------|------|
| [templates.md](references/templates.md) | Plan, Context, Tasks 的 Markdown 模板 |
| [superpowers/](../../superpowers/) | 官方 Superpowers 方法论（TDD/调试/头脑风暴） |

---

## 🎯 最佳实践

- **频繁同步**：每个里程碑完成后立即更新 `context.md`
- **任务粒度**：`tasks.md` 中的任务应可量化且具备明确验收标准
- **存活保障**：确保这些文件不被 `.gitignore` 排除
