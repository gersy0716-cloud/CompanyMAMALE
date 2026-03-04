# 项目架构文档 (PLANNING.md)

> 本文档描述项目的架构、目标、风格和约束。
> AI 助手在新对话开始时应阅读此文档。

---

## 🎯 项目目标

AI 编程助手的通用工具集与知识库，包含：

- 通用开发规范与技能文档体系（UI/UX/前后端等）
- 外部设计系统源码参考（Ant Design、Arco、UIverse 等）
- 业务专用技能（如码码乐专用模块）
- **项目记忆系统**（踩坑记录，业务与通用分离）
- 码码乐业务爬虫工具、UI 实验场

---

## 🏗️ 架构概览

```text
code_tools/
├── memory/             # 🧠 经验记忆（记录 Bug 与踩坑教训）
├── .claude/            # Claude 配置
│   ├── rules/          # 静态规则（AI 必遵守的最高宪法）
│   └── skills/         # 长效知识（API & 技能文档，采用扁平化索引）
├── .agent/workflows/   # Gemini 工作流
├── docs/               # 项目文档与哲学
│   ├── philosophy.md   # 核心哲学：Context Engineering + Planning
│   ├── commands/       # 自定义命令（PRP 工作流）
│   ├── PLANNING.md     # 架构说明（本文件）
│   ├── TASK.md         # 任务追踪
│   └── INITIAL.md      # 功能请求模板
├── libraries/          # 📦 外部第三方仓库
├── playground/         # UI 实验场
├── 关于码码乐的一些自用工具/  # 业务辅助工具
└── README.md           # 项目入口
```

### 上下文分层设计

| 层级 | 位置 | 内容 | 加载策略 |
| :--- | :--- | :--- | :--- |
| **Rules** | `.claude/rules/` | AI 行为规范、审美红线 | 每次自动加载 |
| **Knowledge** | `.claude/skills/` | API 文档、技能指南 | **关键词触发 (Context Pruning)** |
| **Memory** | `memory/` | 历史踩坑、教训 | 相关时加载 |
| **Planning** | 项目根目录 | `task_plan.md` 等活跃状态 | 复杂任务活跃时强制维护 |

---

## 📐 设计原则

1. **模块化** — 单文件不超过 500 行
2. **可测试** — 每个功能都有测试覆盖
3. **可维护** — 清晰的注释和文档
4. **一致性** — 遵循统一的代码风格

---

## 📦 技术栈

### code_tools 本身

- **文档格式**：Markdown（SKILL.md + references/）
- **外部仓库**：Git submodule 式管理
- **UI 实验场**：HTML + CSS + JS（playground/）

### 码码乐业务项目

| 层 | 技术 |
| :--- | :--- |
| 前端 | 原生 JavaScript、CSS3（清透果冻系 UI）、HTML5 |
| 桌面端 | Electron（EXE 打包） |
| 后端 | Node.js / Express |
| 数据库 | BaseMulti（类 Airtable），端点 `https://data.520ai.cc/` |
| AI 服务 | 多服务商对话、AI即梦/兔子Sora视频、火山引擎语音、OCR、图像生成 |

---

## 🎯 码码乐架构决策

1. **单 HTML 入口** — 便于维护，减少重复代码
2. **3 级目录结构** — 按资源类型 → 端/角色 → 功能模块划分
3. **无 shared 文件夹** — 公共代码放在根目录
4. **原生 JavaScript** — 避免框架依赖
5. **BaseMulti 数据库** — 快速开发，无需后端
6. **动态子域名** — 支持多租户
7. **多端应用** — 教师端+学生端、手机端+屏幕端

---

## 📂 分离原则

- 通用技能（`通用技能/`）与码码乐业务（`码码乐专用/`）必须完全分开
- 通用区域不得出现"码码乐"字样
- Memory 只记录踩坑，不重复 rules/ 中的规范内容

---

## 📝 命名约定

- **文件名**：小写 + 连字符（`my-component.js`）
- **函数名**：驼峰命名（`getUserData`）
- **常量**：大写 + 下划线（`MAX_RETRIES`）
- **CSS 类**：BEM 或语义化命名

---

## 🚫 约束与限制

- 通用技能与业务专用技能必须严格分离
- Skills 统一使用 `SKILL.md + references/` 模式
- 业务特有踩坑记录在 `memory/码码乐.md`

---

## 🔗 相关文档

- [README.md](../README.md) — 快速导航入口
- [memory/UI设计.md](../memory/UI设计.md) — UI/UX 审美偏好
- [memory/通用.md](../memory/通用.md) — 通用踩坑记录
- [memory/码码乐.md](../memory/码码乐.md) — 业务踩坑与速查
- [libraries/README.md](../libraries/README.md) — 外部资源库使用指南
