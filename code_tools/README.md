# Code Tools 工作指南

> **每次新对话必读**：本文件是执行任务的快速导航

---

## 技术栈分析

### 核心项目技术

| 项目 | 技术栈 | 功能说明 |
| :--- | :--- | :--- |
| **playground/** | HTML5, CSS3, JavaScript (原生) | UI/UX 设计展示，包括材质效果、布局系统、动效库和组件样式 |
| **生成漫画/** | HTML5, CSS3, JavaScript (原生) | AI 漫画生成器，集成 DeepSeek 分镜构思与即梦/Chatgptten 多引擎绘图，纯客户端架构 |
| **libraries/ant-design/** | React, TypeScript, Less | 企业级 UI 组件库 v6，提供丰富的 React 组件 |
| **libraries/arco-design-react/** | React, TypeScript | 字节跳动 React UI 组件库，提供现代化 UI 组件 |
| **libraries/galaxy/** | HTML, CSS, Tailwind CSS | 3000+ 社区 UI 元素，提供丰富的 CSS 组件 |
| **libraries/storybook/** | React, TypeScript, Webpack | 组件开发与文档工具，用于构建和测试 UI 组件 |
| **libraries/ux-patterns-for-developers/** | Markdown, HTML | 开发者 UX 设计模式参考，提供设计最佳实践 |
| **libraries/anthropic-skills/** | Markdown | 官方 Claude Skills，提供 16 个 AI 编程技能 |
| **libraries/superpowers/** | Markdown | TDD、调试、代码审查方法论 |
| **libraries/ui-ux-pro-max-skill/** | TypeScript, Node.js | 可搜索的 UI/UX 设计知识库 |
| **libraries/claude-code-open/** | TypeScript, Node.js, Express, React | Axon (Claude Code 开源版)：Web IDE + 多 Agent + 37+ 工具 + MCP 协议 |
| **libraries/claude-mem/** | TypeScript, Node.js | Claude 记忆系统插件，持久化上下文管理 |

### 依赖管理

本项目采用 **npm workspaces** 统一管理所有 Node.js 项目的依赖：

| 特性 | 说明 |
| :--- | :--- |
| **统一依赖** | 所有项目的依赖集中管理在根目录 `node_modules/` |
| **节省空间** | 避免重复安装相同的依赖包 |
| **简化维护** | 只需在根目录运行一次 `npm install` |
| **自动去重** | npm 自动处理依赖版本冲突和去重 |

**使用方法**：

```bash
# 在根目录安装所有依赖
npm install

# 为特定项目添加依赖
npm install <package> -w <project-name>

# 查看所有已安装的包
npm run list:packages
```

> 详细配置说明：[NODE_WORKSPACES配置说明.md](../NODE_WORKSPACES配置说明.md)

### 技术特点

- **前端技术**：HTML5, CSS3, JavaScript (原生), React, TypeScript, Less, Tailwind CSS, SVG
- **构建工具**：Webpack, Babel, TypeScript Compiler, Vite
- **文档工具**：Storybook, Markdown
- **设计系统**：Ant Design, Arco Design, 自定义 CSS 效果, SVG 动画
- **AI 工具**：Claude Skills, 第三方 AI 服务集成
- **依赖管理**：npm workspaces (Monorepo)

---

## 快速入口

| 如果你需要... | 查阅 | 核心价值 |
| :--- | :--- | :--- |
| **项目记忆系统** | [memory/](./memory/) | **项目核心记忆系统**：解耦业务规则与通用开发经验 |
| **调用业务接口** | [码码乐专用/API接口/](./.claude/skills/码码乐专用/API接口/SKILL.md) | **标准数据链路**：班级、学生、教师全量接口速查 |
| **操作数据库** | [码码乐专用/数据库/](./.claude/skills/码码乐专用/数据库/SKILL.md) | **持久化规范**：Prisma CRUD 模式与表结构定义 |
| **接入 AI 能力** | [码码乐专用/外接API/](./.claude/skills/码码乐专用/外接API/SKILL.md) | **智能增强**：第三方 AI 服务（DeepSeek/即梦等）集成 |
| **UI 自查表** | [checksheet.md](./libraries/ui-ux-pro-max-skill/src/ui-ux-pro-max/checksheet.md) | **质量红线**：UI/UX 发布前的全方位自测清单 |
| **需求模板 (PRP)** | [docs/PRP_TEMPLATE.md](./docs/PRP_TEMPLATE.md) | **需求提示词模板**：引导 AI 产出高质量代码的基石 |
| **设计高颜值 UI** | [通用技能/UI设计/](./.claude/skills/通用技能/UI设计/SKILL.md) | **视觉设计语言**：Bento 布局、毛玻璃效果、微动效规范 |
| **找 UI 组件灵感** | [libraries/](./libraries/README.md) | **三方资源中心**：精选 UI 组件库与开发方法论源码 |
| **码码乐记忆** | [memory/码码乐.md](./memory/码码乐.md) | **业务避坑红宝书**：历史决策细节与特定业务逻辑记忆 |
| **通用开发经验** | [memory/通用.md](./memory/通用.md) | **全局开发公约**：通用技术坑点、AI 交互规则与偏好 |
| **码码乐工具** | [关于码码乐的一些自用工具/](./关于码码乐的一些自用工具/) | **生产力工具集**：内部业务辅助脚本与爬虫工具 |

---

## 🧠 上下文分层系统

本项目采用三层上下文设计，确保 AI 助手高效获取正确信息：

| 层级 | 位置 | 内容 | 加载策略 |
| :--- | :--- | :--- | :--- |
| **Rules** | `.claude/rules/` | AI 必遵守的规范和偏好 | 每次自动加载 |
| **Knowledge** | `.claude/skills/`, `docs/` | API文档、技术参考 | 按需加载 |
| **Memory** | `memory/` | 踩坑记录与经验教训 | 相关时加载 |
| **Planning** | 项目根目录 | `task_plan.md` 等任务追踪文件 | 活跃任务时强制使用 |

### 记忆文件

| 文件 | 内容 |
| :--- | :--- |
| [UI设计.md](./memory/UI设计.md) | UI/UX 审美偏好、玻璃拟态规范、交互细节 |
| [码码乐.md](./memory/码码乐.md) | 码码乐项目踩坑记录、数据表ID速查、API坑点 |
| [通用.md](./memory/通用.md) | 通用环境踩坑、代码陷阱、设计模式参考 |

> [!TIP]
> **维护规则**：Memory 只记录 AI 无法从代码推断的经验教训。规范性内容应放在 `rules/`，架构性内容应放在 `docs/PLANNING.md`。

---

## 📦 资源总览

### 技能库 (.claude/skills/)

| 分类 | 数量 | 说明 |
| :--- | :--- | :--- |
| [通用技能/](./.claude/skills/通用技能/) | 8 板块 | UI/UX/前后端/开发工具等 |
| [码码乐专用/](./.claude/skills/码码乐专用/) | 6 板块 | API/数据库/外接服务等 |
| [完整索引 →](./.claude/skills/SKILLS_INDEX.md) | | 所有技能一览 |

### 外部仓库 (libraries/)

| 分类 | 仓库 | 说明 |
| :--- | :--- | :--- |
| 方法论 | [anthropic-skills/](./libraries/anthropic-skills/) | 官方技能库（16个） |
| 方法论 | [superpowers/](./libraries/superpowers/) | TDD/调试/代码审查 |
| 设计系统 | [ant-design/](./libraries/ant-design/) | Ant Design v6 源码 |
| 设计系统 | [arco-design-react/](./libraries/arco-design-react/) | Arco Design 源码 |
| UI 元素 | [galaxy/](./libraries/galaxy/) | UIverse 3000+ CSS 元素 |
| 工具 | [storybook/](./libraries/storybook/) | 组件开发 & 文档工具 |
| AI 平台 | [claude-code-open/](./libraries/claude-code-open/) | Axon：开源 AI 编程平台（Web IDE + 多 Agent） |
| 工具 | [claude-mem/](./libraries/claude-mem/) | Claude 记忆系统插件 |
| UX | [ux-patterns-for-developers/](./libraries/ux-patterns-for-developers/) | 开发者 UX 设计模式 |
| 设计库 | [ui-ux-pro-max-skill/](./libraries/ui-ux-pro-max-skill/) | 可搜索设计库 |

> 详细使用指南：[libraries/README.md](./libraries/README.md)

---

## 📖 规范指引

| 规范 | 说明 |
| :--- | :--- |
| [development-flow.md](./.claude/rules/development-flow.md) | 四阶段开发流程：需求→规划→审核→编码 |
| [coding-standards.md](./.claude/rules/coding-standards.md) | 代码质量：注释、异常处理、分步迭代 |
| [project-structure.md](./.claude/rules/project-structure.md) | 项目结构：单HTML + 3级目录 |

---

## 🔍 关键词定位

- **学生/班级/教师** → `码码乐专用/API接口/`
- **保存/查询/CRUD** → `码码乐专用/数据库/`
- **对话/识别/生图** → `码码乐专用/外接API/`
- **圆角/阴影/间距** → `通用技能/UI设计/`
- **避坑/经验** → `码码乐专用/经验教训/`
- **按钮/卡片/CSS灵感** → `libraries/galaxy/`

---

## 文档更新规则

| 场景 | 更新位置 |
| :--- | :--- |
| 纠正 UI 审美偏好 | `memory/UI设计.md` |
| 遇到通用 Bug/踩坑 | `memory/通用.md` |
| 遇到码码乐业务 Bug | `memory/码码乐.md` |
| 用户纠正行为规则 | `.claude/rules/coding-standards.md` |
| 新增 API/技能 | `码码乐专用/API接口/` 或 `外接API/` |
| 项目架构/规则变更 | `docs/PLANNING.md` |
| 任务状态追踪 | `docs/TASK.md` |

---

## ⚠️ AI 工具限制与规范

> [!IMPORTANT]
> AI 工具 (Antigravity / Claude 等) **无法自行执行终端命令**，所有终端操作（如启动本地服务器、安装依赖、运行构建等）需要**用户手动在终端中执行**。AI 只负责代码编写与审查。

> [!NOTE]
> **语言规范**：AI 必须使用**中文**进行所有回复、代码注释和文档编写。

---

*最后更新：2026-03-04*
