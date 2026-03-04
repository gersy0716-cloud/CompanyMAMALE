# JS 目录索引

> 快速定位功能文件，方便查找和修改

## 📁 文件列表

| 文件名 | 功能说明 | 主要函数/类 |
|:---|:---|:---|
| `config.js` | 配置文件（API端点、常量） | `CONFIG`, `getURLParams()` |
| `database.js` | 数据库操作封装 | `Database` 类 |
| `app.js` | 主入口（路由、初始化） | `isMobileDevice()`, `showMobileView()`, `showScreenView()` |

## 📁 子目录

| 目录 | 说明 | 索引 |
|:---|:---|:---|
| `mobile/` | 手机端模块 | [INDEX.md](mobile/INDEX.md) |
| `screen/` | 屏幕端模块 | [INDEX.md](screen/INDEX.md) |

## 🔗 模块关系

```
app.js
├── config.js (配置)
├── database.js (数据库)
├── 检测设备 → mobile/app-mobile.js 或 screen/app-screen.js
```
