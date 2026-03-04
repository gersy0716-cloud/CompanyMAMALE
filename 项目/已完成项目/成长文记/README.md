# 成长文记

> 五年级上册第一单元习作《那一刻，我长大了》作文教学辅助工具

---

## 🚀 快速启动

```bash
cd "F:\工作\码码乐\工作—码码乐-开发\待完成项目\成长文记"
anywhere -p 8000
```

**访问地址**（需要URL参数）：

```
http://localhost:8000/?type=xxx&token=xxx&userid=xxx&username=xxx
```

---

## 📂 目录结构

```
成长文记/
├── index.html          # 入口页面（自动识别设备）
├── README.md           # 本文件
├── 项目说明.md          # 📖 完整项目文档
├── 数据库设计.md        # 🗄️ 数据库设计
│
├── js/                 # JavaScript
│   ├── config.js       # 配置文件
│   ├── database.js     # 数据库封装
│   ├── app.js          # 主入口
│   ├── mobile/         # 手机端模块
│   └── screen/         # 屏幕端模块
│
└── css/                # 样式文件
    ├── common.css      # 通用样式
    ├── mobile.css      # 手机端样式
    └── screen.css      # 屏幕端样式
```

---

## 🔍 快速查找

| 需要修改... | 查看文件 |
|:---|:---|
| 手机端功能 | `js/mobile/app-mobile.js` |
| 屏幕端功能 | `js/screen/app-screen.js` |
| API配置 | `js/config.js` |
| 数据库操作 | `js/database.js` |
| 完整需求 | [项目说明.md](项目说明.md) |
| 数据库表 | [数据库设计.md](数据库设计.md) |

---

## ✅ 功能概览

**手机端**：

- 📷 成长时刻上传
- 📝 作文上传（OCR识别）
- 🎤 语音提示词录制

**屏幕端**：

- 🖼️ 成长时刻轮播展示
- ✍️ 作文润色（AI流式输出）
