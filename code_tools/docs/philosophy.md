# 内存与上下文哲学 (Memory Architecture Philosophy)

本项目融合了当前 AI 编程领域最前沿的两大实践，构建了一套完整的「闭环上下文工程」。

## 1. 双核驱动 (Dual Integration)

| 核心组件 | 角色 | 解决的问题 | 类比 |
| :--- | :--- | :--- | :--- |
| **Context Engineering** | **前置准备 (Input)** | 解决"懂不懂"的问题。通过 PRP 确保 AI 掌握全局视角、规范与示例，不闭门造车。 | 电影剧本与样片 |
| **Planning with Files** | **过程管理 (Process)** | 解决"忘不忘"的问题。通过 3-File 模式将 RAM 转化为 Disk，防止目标漂移。 | 工作日记与清单 |

## 2. 四层上下文架构 (4-Layer Context)

本项目强制执行以下分层逻辑，以实现最高的 Token 效率与执行稳定性：

### A. Rules (静态约束)

- **位置**：`.claude/rules/`
- **内容**：AI 必须遵守的准则、UI 审美红线。
- **策略**：每次自动加载，字字千金。

### B. Knowledge (长效知识)

- **位置**：`.claude/skills/`, `docs/`
- **内容**：API 文档、技术栈参考。
- **策略**：**扁平化索引 (Context Pruning)**。只有触发关键词时才读取深层 link。

### C. Memory (历史教训)

- **位置**：`memory/`
- **内容**：业务踩坑记录、Bug 教训。
- **策略**：仅在相关任务时加载，防止重复犯错。

### D. Planning (活跃记忆)

- **位置**：项目根目录 (`task_plan.md` 等)
- **内容**：当前任务的进度、发现与日志。
- **策略**：跨 Session 持久化。即使 Context 被清理，也能瞬间「找回状态」。

## 3. 对比总结 (The Comparison)

> 💡 **Context Engineering** 侧重于“任务开始前的完美准备（输入）”，而 **Planning with Files** 侧侧重于“任务执行中的记忆与状态管理（过程）”。

两者结合，即为本项目的高效运行内核。
