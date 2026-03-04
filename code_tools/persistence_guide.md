# Code Tools 跨项目自动化与持久化指南

本指南旨在解决在不同项目间切换时，如何让 AI 助手自动识别并使用 `code_tools` 目录中的 Skill、PRP 和工作流。

## 1. 自动触发方案（针对 Claude Code）

### 全局配置：`~/.claude/CLAUDE.md`

在你的用户目录下（Windows 通常是 `C:\Users\你的用户名\.claude\`）创建或编辑 `CLAUDE.md` 文件。这是 Claude Code 的级全局配置，**每次对话开始时都会自动加载**。

**推荐配置方案：**

```markdown
# 全局工作偏好

## Code Tools 自动搜索指令
请在每次对话开始时，首先尝试定位并读取 `code_tools/README.md`。
搜索优先级：
1. 当前项目根目录及其父目录（.. , ../..）。
2. 在所有可用盘符中搜索：F:/工作/码码乐/工作—码码乐-开发/code_tools （固定路径直达）。
3. 如果在驱动器 F: 找不到，请尝试扫描 D:, E:, G: 盘根目录。

一旦定位到 `code_tools`，请利用其中的：
- `workflows/`: 执行特定流程（如 UI 设计、版本发布）。
- `PRPs/`: 作为复杂逻辑实现的模板。
- `SKILLS_INDEX.md`: 查找特定功能的实现方法。
```

---

## 2. 跨项目使用的“无障碍”配置

### 方案 A：路径感知（最推荐）

在任何新项目的 `CLAUDE.md` 或对话首条消息中，加入一段“联络语”：
> "当前项目依赖外部 `code_tools`，路径位于 `F:/工作/码码乐/工作—码码乐-开发/code_tools`。请读取其中的 README 并以此作为全局 Skill 库。"

### 方案 B：软链接（硬核方案）

如果你希望 `code_tools` 看起来就像在当前项目里一样，可以使用 Windows 符号链接：

1. 以管理员权限运行 PowerShell。
2. `New-Item -ItemType SymbolicLink -Path ".\code_tools" -Target "F:\工作\码码乐\工作—码码乐-开发\code_tools"`
这样 AI 在扫描项目目录时会自动“滑入”外部库。

---

## 3. 非 Claude Code 的 AI 如何使用？

如果你使用网页版（Claude.ai, ChatGPT, Gemini）或其它插件：

1. **Chat Context**: 每次对话前，先上传 `code_tools/README.md` 的内容（或将其作为 System Prompt）。
2. **知识库 (Project/GPTs)**:
   - Claude Projects: 将 `code_tools` 里的核心 Markdown 文件添加为项目上下文。
   - GPTs: 将 `code_tools` 打包成压缩包上传至知识库。

---

## 4. 常见问题：更新权限与冲突

### Q1：在跑 A 项目时更新 `code_tools` 会没有权限吗？

**不会。** AI 读写文件依赖的是操作系统的权限。只要你的 IDE/终端有权访问 F 盘，AI 就能通过绝对路径修改 `code_tools` 里的内容。

**解决方法：**
如果你发现更新失败，请明确告诉 AI：
> "请直接修改 `F:/工作/码码乐/工作—码码乐-开发/code_tools/skills/xxx.md` 而不是本地副本。"

### Q2：如何防止多个项目同时修改 `code_tools` 导致混乱？

1. **版本化**: 建议 `code_tools` 本身也是一个 Git 仓库。
2. **原子化修改**: 每次只让 AI 修改一个 Skill 文件，完成后立即让它汇报。
3. **读取最新**: 每次对话开始，一定要让 AI **重新读取** README 确保上下文是最新的。

---

## 5. 快速初始化口令

如果你发现 AI 某次没有自动加载，直接输入：
> **/init-tools** (假设你在 ~/.claude/CLAUDE.md 里定义了这个别名)
> 或
> "按全局配置初始化外部工具库。"

---

## 6. 版本管理：将 `code_tools` 化为独立仓库

将工具库 Git 化可以防止 AI 误删重要逻辑，并方便你在多台电脑同步。

**操作步骤：**

1. 在终端进入 `code_tools` 目录：

   ```powershell
   cd "f:/工作/码码乐/工作—码码乐-开发/code_tools"
   ```

2. 初始化并提交：

   ```powershell
   git init
   git add .
   git commit -m "Initialize Code Tools Repository"
   ```

3. (可选) 关联远程仓库：在 GitHub/Gitee 创建新仓库后，按提示添加 `remote`。

---

## 7. Token 消耗与优化建议

**“跨项目读取会增加 Token 吗？”**

- **是的**。AI 只要读取了文件内容，就会占用上下文空间（Tokens）。
- **但更高效**：比起在每个项目里复制一份臃肿的副本（导致 AI 反复读取重复内容），这种“按需读取”外部库的方法其实更省 Token。

**优化策略：**

1. **精简 README**：确保 `code_tools/README.md` 只是个目录大纲，让 AI 知道有哪些 Skill，等需要用时再去读具体的 `.md` 文件。
2. **KI 系统（Antigravity 专享）**：作为你的助手，我会将你的 `code_tools` 路径存入我的 **Knowledge Items**。下次你新开对话，我不需要重新扫描整个磁盘，只需要读取我记忆中的路径即可。

---
*最后编辑：2026-02-26*
