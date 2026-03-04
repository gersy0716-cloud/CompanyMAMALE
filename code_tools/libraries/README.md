# 📦 外部资源库使用指南

> 所有外部仓库统一存放在 `libraries/` 目录，通过 `git pull` 更新。

---

## 🎯 我想要... → 查哪里

| 场景 | 仓库 | 怎么用 |
| :--- | :--- | :--- |
| 查 React 组件的 API 和源码 | `ant-design/` | 进入 `components/Button/` 等目录查看源码 |
| 查另一套 React 组件实现 | `arco-design-react/` | 进入 `components/` 目录浏览 |
| 找 CSS 按钮/卡片/动画灵感 | `galaxy/` | UIverse.io 3000+ 社区元素，按分类浏览 |
| 学习组件文档怎么组织 | `storybook/` | 查看官方 Storybook 示例和架构 |
| 学习 UX 设计最佳实践 | `ux-patterns-for-developers/` | 按场景分类的 UX 参考（表单、导航等） |
| 查设计灵感和参考 | `ui-ux-pro-max-skill/` | 可搜索的 UI/UX 设计知识库 |
| 学习 AI 编程方法论 | `anthropic-skills/` | 16 个官方技能（TDD、调试等） |
| TDD/调试/代码审查 | `superpowers/` | 测试驱动、系统化调试方法论 |
| 参考 AI 编程助手实现 | `claude-code-open/` | Axon (Claude Code 开源版)：Web IDE、多 Agent、37+ 工具、MCP 协议 |
| 查看记忆系统插件 | `claude-mem/` | Claude 持久化上下文管理插件 |

---

## 📋 仓库清单

### 方法论 & 技能

| 仓库 | 来源 | Stars | 说明 |
| :--- | :--- | :--- | :--- |
| `anthropic-skills/` | Anthropic | - | 官方 Claude Skills（16个技能） |
| `superpowers/` | Anthropic | - | TDD、调试、代码审查方法论 |
| `ui-ux-pro-max-skill/` | 社区 | - | UI/UX 设计知识库 |

### 设计系统 & UI 资源

| 仓库 | 来源 | Stars | 说明 |
| :--- | :--- | :--- | :--- |
| `ant-design/` | [ant-design/ant-design](https://github.com/ant-design/ant-design) | 93k+ | React 企业级 UI 组件库 v6 |
| `arco-design-react/` | [arco-design/arco-design-react](https://github.com/arco-design/arco-design-react) | 4.5k+ | 字节跳动 React UI 组件库 |
| `galaxy/` | [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) | 9.7k | 3000+ 社区 CSS/Tailwind UI 元素 |
| `storybook/` | [storybookjs/storybook](https://github.com/storybookjs/storybook) | 85k+ | 组件开发 & 文档工具 |
| `ux-patterns-for-developers/` | [thedaviddias/ux-patterns](https://github.com/thedaviddias/ux-patterns-for-developers) | - | 开发者 UX 设计模式参考 |

### 工具 & AI

| 仓库 | 来源 | Stars | 说明 |
| :--- | :--- | :--- | :--- |
| `claude-code-open/` | [kill136/claude-code-open](https://github.com/kill136/claude-code-open) | 1k+ | Axon：开源 AI 编程平台，Web IDE + 多 Agent + 37+ 工具 + MCP 协议 |
| `claude-mem/` | 社区 | - | Claude 记忆系统插件 |

---

## 🔄 更新所有仓库

```powershell
# 在 code_tools 目录下执行
Get-ChildItem -Path "libraries" -Directory | ForEach-Object {
    Write-Host "Updating $($_.Name)..." -ForegroundColor Cyan
    Set-Location $_.FullName
    git pull
    Set-Location ..
}
```

或单独更新某个仓库：

```powershell
cd libraries/ant-design
git pull
```

---

*最后更新：2026-03-03*
