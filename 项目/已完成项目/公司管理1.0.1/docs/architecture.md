# 公司管理系统 — 架构与文件说明

> Electron 桌面应用，原生 JS + BaseMulti 数据库，无前端框架。
>
> **测试公约**：在开发过程中，所有“功能测试”及“打开测试页面”指令均指代在 **Electron 环境**（`npm run dev`）下进行，以确保与最终 EXE 环境行为一致。

---

## 项目结构

```
公司管理/
├── main.js              # Electron 主进程入口（窗口创建、生命周期）
├── preload.js           # Electron 预加载脚本（IPC 桥接）
├── start.bat            # 启动脚本（必须用此启动，清除 ELECTRON_RUN_AS_NODE）
├── index.html           # 单页面入口（所有模块的 HTML 结构）
├── package.json         # 依赖：electron, electron-builder
│
├── js/                  # 核心 JavaScript
│   ├── config.js        # 全局配置（API 地址、Token、租户信息）
│   ├── database.js      # BaseMulti 数据库封装（CRUD + 文件上传）
│   ├── auth.js          # 登录认证（账号密码 → 数据库校验）
│   ├── app.js           # 路由 & 导航（Tab 切换、模态框、Toast）
│   │
│   ├── components/      # 通用组件
│   │   └── image-lightbox.js  # 图片大图预览（全屏 Lightbox）
│   │
│   ├── tasks/           # 任务管理模块
│   │   ├── task-global.js     # 任务列表（全局视图、CRUD、文件上传）
│   │   ├── task-personal.js   # 个人任务视图（我的任务筛选）
│   │   └── task-detail.js     # 任务详情弹窗（附件预览、下载）
│   │
│   ├── accounts/        # 账号管理模块
│   │   └── accounts.js        # 分类卡片 → 账号列表 → 详情/复制
│   │
│   ├── announcements/   # 公告模块
│   │   └── announcements.js   # 公告发布与展示
│   │
│   ├── skills/          # 知识库模块
│   │   ├── skill-store.js     # 知识库浏览与搜索
│   │   └── skill-guide.js     # 知识库详情与引导
│   │
│   ├── discussions/     # 讨论模块
│   │   └── discussions.js     # 项目讨论（发帖、回复、删除）
│   │
│   ├── claude-code/     # Claude Code 模块
│   │   └── claude-code.js     # Claude Code 集成
│   │
│   ├── github/          # GitHub 模块
│   │   └── github-projects.js # GitHub 项目分享与浏览
│   │
│   └── versions/        # 版本更新模块
│       └── versions.js      # 自动更新检查 & 管理员发布界面
│
├── css/                 # 样式文件（每个模块独立 CSS）
│   ├── common.css       # 全局样式（变量、布局、Modal、Toast）
│   ├── auth.css         # 登录页样式
│   ├── tasks.css        # 任务模块样式（列表、详情、附件卡片）
│   ├── lightbox.css     # 图片预览 Lightbox 样式
│   ├── accounts.css     # 账号管理样式
│   ├── announcements.css# 公告样式
│   ├── skills.css       # 知识库样式
│   ├── discussions.css  # 讨论样式
│   └── claude-code.css  # Claude Code 样式
│
└── docs/                # 项目文档
    ├── architecture.md  # ← 本文档（项目结构与文件说明）
    └── database-schema.md  # 数据库表结构定义
```

---

## 核心架构

### 单页面应用（SPA）

- **入口**：`index.html` 包含所有模块的 HTML 结构
- **路由**：`app.js` 通过 Tab 点击切换 `display: none/block` 实现视图切换
- **模态框**：全局 `Modal` 组件（`app.js`），所有模块共用

### 数据层

- **数据库**：BaseMulti（类 Airtable SaaS），通过 REST API 访问
- **封装**：`database.js` 提供 `DB.query()`, `DB.create()`, `DB.update()`, `DB.remove()`
- **文件上传**：`DB.uploadFile()` → `https://${type}.520ai.cc/api/fileResouceItem/uploadUnified`

### 双 Token 架构

| Token | 用途 | Header |
|:---|:---|:---|
| `DB_TOKEN` | BaseMulti 数据库 CRUD | `x-bm-token` |
| `AUTH_TOKEN` | 文件上传等业务 API | `Authorization: Bearer` |

> ⚠️ 两者严禁混用。当前为 EXE 环境，两个 Token 均硬编码在 `config.js` 中。

### Electron 运行环境

- **启动**：必须通过 `start.bat`（清除 `ELECTRON_RUN_AS_NODE` 环境变量）
- **原因**：VS Code / Cursor 等 IDE 终端会设置 `ELECTRON_RUN_AS_NODE=1`，导致 `electron.exe` 以 Node.js 模式运行

---

## IPC 桥接 (Core Events)

`preload.js` 暴露了以下核心安全接口：

| 接口名 | 用途 | 触发 JS | 对应 Main 逻辑 |
|:---|:---|:---|:---|
| `writeClaudeSettings` | 同步 Claude 配置 | `claude-code.js` | 物理写入 `~/.claude/settings.json` |
| `readClaudeSettings` | 读取现状识别账号 | `claude-code.js` | 读取并解析 `settings.json` |
| `downloadAndInstallUpdate` | 静默下载并安装 | `versions.js` | 后台下载并执行 `/S` 静默安装 |

---

## 生产发布规范

1. **DevTools 禁用**：
   - 生产环境必须在 `main.js` 中设置 `devTools: false`。
   - 禁止在 `mainWindow` 上调用 `openDevTools()`。
2. **打包命名**：
   - 通过 `package.json` 的 `artifactName` 统一格式为：`Mamale_Management_V${version}_Setup.exe`。
3. **数据保留**：
   - 配置了 `deleteAppDataOnUninstall: false`，确保卸载或覆盖安装时不会丢失用户的登录信息和本地设置。

## 已实现功能

| 模块 | 功能 |
|:---|:---|
| 任务管理 | 任务 CRUD、父子任务树、执行人分配、文件上传/下载/预览、主线/支线分类 |
| 账号管理 | 分类卡片视图、账号详情、密码掩码、一键复制 |
| 公告 | 公告发布与展示 |
| 知识库 | Skill 浏览、搜索、文件上传 |
| 讨论 | 项目讨论、回复、删除 |
| Claude Code | Claude Code 功能集 |
| GitHub | GitHub 项目分享与浏览 |
| 版本更新 | **管理员**：发布新版本；**普通用户**：静默后台更新（无感、无通知） |
| 图片预览 | 点击附件图片 → 全屏 Lightbox（ESC / 点击关闭）|

---

## UI 风格

- **设计语言**：清透果冻系（渐变背景、弥散光效、微交互动画）
- **优先级标签**：Soft Tag（浅色背景 + 深色文字）— 红/橙/绿三级
- **父子任务**：树形连线（`├─` `└─`）+ 背景色区分
- **交互偏好**：精简文案（双字词）、零冗余原则
- **管理员视图**：当 `admin` 登录时，侧边栏精简，直达版本发布控制台
