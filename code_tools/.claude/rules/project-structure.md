# 项目结构规范

> 模块化文件结构，便于维护和减少 AI 辅助开发时的 token 消耗

---

## 单HTML + 3级目录结构（推荐）

**适用场景**：多端应用（如手机端+屏幕端、学生端+教师端）

```
项目名/
├── index.html                    # 📌 唯一HTML入口（动态切换视图）
├── README.md                     # 📌 项目快速索引
├── 项目说明.md                   # 功能需求文档
├── 数据库设计.md                 # 数据库表设计
│
├── js/                           # 第1级：JS根目录
│   ├── INDEX.md                  # 📌 JS索引
│   ├── config.js                 # 配置文件
│   ├── database.js               # 数据库操作封装
│   ├── app.js                    # 主入口 ≤200行
│   │
│   ├── mobile/                   # 第2级：手机端模块
│   │   ├── INDEX.md
│   │   ├── app-mobile.js
│   │   └── photo-upload/         # 第3级：功能模块
│   │
│   └── screen/                   # 第2级：屏幕端模块
│       ├── INDEX.md
│       └── app-screen.js
│
└── css/                          # 第1级：CSS根目录
    ├── INDEX.md
    ├── common.css
    ├── mobile.css
    └── screen.css
```

**层级说明**：

| 层级 | 示例 | 划分依据 |
|:---|:---|:---|
| 第1级 | `js/`、`css/` | 资源类型 |
| 第2级 | `mobile/`、`screen/` | 端/角色 |
| 第3级 | `photo-upload/` | 功能模块 |

---

## 核心原则

1. **单HTML入口**：所有端共用一个 `index.html`，通过设备检测动态切换视图
2. **无shared文件夹**：公共代码放在 `js/` 根目录
3. **按功能划分文件**：每个功能模块独立成文件夹，单个文件不超过 300 行
4. **📌 强制索引文档**：每个目录必须包含 `INDEX.md` 快速索引文件
5. **🚫 业务与通用严格分离 (Mandatory)**：通用技能（`通用技能/`）与业务专用技能（`码码乐专用/`）必须完全分离。通用文档中严禁出现特定业务逻辑或名称。
6. **🧠 记忆系统分级**：`memory/通用.md` (通用技术踩坑)、`memory/码码乐.md` (业务踩坑) 和 `memory/UI设计.md` (审美偏好)。Memory 只记录踩坑与偏好积累，不重复 rules/ 中的规范。

---

## 文档去重规范

**避免在多个文档中重复相同内容**：

- 数据库设计：只保留一份 `数据库设计.md`，其他文档引用它
- API配置：只在 `config.js` 定义
- 业务规则：只在 `项目说明.md` 定义

---

## 索引文档规范（INDEX.md）

**每个包含多个文件的目录必须创建 `INDEX.md`**：

```markdown
# 模块名称索引

> 快速定位功能文件

## 📁 文件列表

| 文件名 | 功能说明 | 主要函数 | 依赖 |
|:---|:---|:---|:---|
| `login.js` | 登录功能 | `handleLogin()` | api.js |
| `list.js` | 列表展示 | `loadList()` | api.js |

## 🔗 模块关系

login.js → state.js → list.js
```

**索引文档的作用**：

- ✅ AI 可以快速定位需要修改的文件
- ✅ 减少 token 消耗
- ✅ 明确模块间依赖关系

---

## 视图切换示例

```javascript
// app.js - 根据设备类型切换视图
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;

if (isMobile) {
    showMobileView();
    loadScript('js/mobile/app-mobile.js');
} else {
    showScreenView();
    loadScript('js/screen/app-screen.js');
}
```
