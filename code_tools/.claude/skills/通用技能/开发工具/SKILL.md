---
name: dev-tools
description: 码码乐开发调试工具集。涵盖 anywhere 本地服务器、Eruda 移动端调试、Claude Code 使用规范及发布前检查清单。当用户询问"本地运行"、"手机调试"、"Claude Code"或"启动本地服务器"时触发。
---

# 开发工具与调试技巧

> 🖥️ 本地服务器 | 📱 手机调试 | 🤖 Claude Code | 🔄 CORS 代理

---

## 📚 详细参考

| 模块 | 内容 | 详细参考 |
|------|------|---------|
| **指令规范** | Claude Code 使用风格、任务管理与流程 | [claude-code.md](references/claude-code.md) |

---

## 🖥️ 本地服务器

### anywhere（推荐）

```bash
npm install -g anywhere  # 全局安装
cd "项目根目录"
anywhere -p 8000
```

**优点**：支持URL参数、自动处理MIME类型

**注意**：必须在项目根目录启动，否则404

### VS Code Live Server

- ❌ 不支持URL参数传递
- 端口5500

---

## 📱 手机端调试

### Eruda（手机控制台）

```html
<!-- 添加到 <head>，调试完必须删除 -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

**使用**：右下角出现绿色齿轮 → 点击打开控制台

### 常见问题

| 问题 | 原因 | 解决 |
|:---|:---|:---|
| 相机无法调用 | 需HTTPS | 使用localhost或配置HTTPS |
| 跨域失败 | CORS限制 | 后端配置或使用代理 |
| 权限被拒 | 未授权 | 提示用户授权 |

---

## 🔄 CORS 代理

### 开发时

可临时使用代理绕过跨域：

```javascript
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const url = CORS_PROXY + 'https://api.example.com/data';
```

### ⚠️ 发布前必须清理

```javascript
// ❌ 发布前删除
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
```

```html
<!-- ❌ 发布前删除 -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
```

### 正确解决方案

1. 后端配置 `Access-Control-Allow-Origin`
2. 使用同域代理（Nginx反向代理）

---

## 📋 发布前检查清单

- [ ] 删除 Eruda 调试代码
- [ ] 删除 CORS 代理
- [ ] 删除 console.log 调试日志
- [ ] 确认 API 地址为生产环境
