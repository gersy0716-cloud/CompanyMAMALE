# 码码乐内部协作管理平台 (V1.0.1)

> **移交必读**：本文件是项目的开发流程、打包规范及核心逻辑指南。

---

## 🚀 快速入口

| 如果你需要... | 查阅 | 核心价值 |
| :--- | :--- | :--- |
| **项目整体架构** | [docs/architecture.md](./docs/architecture.md) | **系统全貌**：文件结构、IPC 桥接、单页面路由设计 |
| **数据库表定义** | [docs/database-schema.md](./docs/database-schema.md) | **数据底座**：REST API 规范、表 ID 对齐、admin 特权说明 |
| **配置 API & Token** | [js/config.js](./js/config.js) | **环境控制**：数据库 ID、双 Token 架构、当前版本号控制 |
| **打包发布设置** | [package.json](./package.json) | **上线规范**：NSIS 安装器配置、图标关联、打包文件名定义 |
| **Claude Code 同步** | [js/claude-code/claude-code.js](./js/claude-code/claude-code.js) | **本地同步**：实现 Web 端与本地 `~/.claude/settings.json` 的物理同步 |

---

## 🛠️ 开发与打包指南

### 1. 开发模式 (Electron Dev)

项目采用原生 JS + Electron 架构，无需 Webpack/Vite 编译。

```powershell
# 1. 安装依赖 (移交后必做)
npm install

# 2. 运行开发版 (开启 DevTools)
npm run dev
```

### 2. 生产打包 (V1.0.1+)

打包过程由 `electron-builder` 驱动，输出文件为 `Mamale_Management_V1.0.1_Setup.exe`。

```powershell
# 运行打包指令 (生成物在 dist/ 目录下)
npm run build
```

> [!IMPORTANT]
> **生产模式规范**：
>
> - 必须确保 `main.js` 中的 `devTools` 设置为 `false`。
> - 图标资源存储在 `build/` 文件夹，打包时不可删除该文件夹。

---

## 🧠 核心逻辑避坑与记忆

### 👤 身份与权限

- **内置 Admin**：账号 `admin`，密码 `123456`。该账号登录后会**强制隐藏**业务侧边栏，仅保留“版本更新”管理界面。
- **角色区分**：通过 `auth.js` 判断 `role === 'admin'`，前端 CSS 通过 `body.is-admin` 控制显示隐藏。

### 🔄 版本更新流 (V1.0.1 改版)

- **静默更新**：普通用户登录后，系统在后台开启静默下载（无通知、无干扰）。下载完成后，用户下次启动或点击安装时会自动覆盖，追求“无感升级”。
- **手动发布**：仅 `admin` 可在版本控制台提交新直链。

### ⌨️ Claude Code 一键切换

1. 应用通过 `IPC` 桥接直接连接本地文件系统。
2. 切换账号时，物理写入 `~/.claude/settings.json`。
3. **强制刷新**：切换或签到后会自动触发 `loadAccounts(true)`，解决 UI 状态不同步的问题。

---

## 📦 移交文件建议 (清理冗余)

移交源码时，请**剔除**以下内容以保持整洁：

- `node_modules/` (依赖库，巨大)
- `dist/` (打包产物)
- `*.exe` (旧的安装包)

### 必须保留

`js/`, `css/`, `docs/`, `build/`, `index.html`, `main.js`, `preload.js`, `package.json`。

---

## 🛠️ 覆盖安装与静默更新逻辑

项目实现了“一次安装，永久找回”的更新逻辑，方便同事进行日常维护和版本迭代：

### 1. 物理定位逻辑 (Registry)

系统通过 `package.json` 中的 `appId` (`com.mamale.desktop`) 在注册表中标记软件身份。
- **手动覆盖安装**：新版本安装程序由于开启了 `oneClick: false`，会自动识别旧版本的安装路径并将其设为默认。用户只需点击“安装”，程序就会直接覆盖旧文件夹，避免多副本冗余。
- **静默后台更新**：`main.js` 调用 `/S` 参数执行静默安装时，NSIS 会自动读取注册表中的 `InstallLocation`。即使同事将软件装在了非默认盘（如 D 盘），静默更新也会准确地**装回原位**。

### 2. 维护红线 (不可随意修改)

为保证覆盖安装逻辑不失效，后续维护请**严禁**随意修改以下核心项：

1. **`appId`**：注册表的唯一索引。一旦更改，系统会将其视为全新的软件，导致覆盖安装失效。
2. **`productName`**：文件夹命名的基础。
3. **`perMachine: true`**：必须保持全机安装模式，以确保注册表读写权限的一致性。

---

*最后更新：2026-02-26*
