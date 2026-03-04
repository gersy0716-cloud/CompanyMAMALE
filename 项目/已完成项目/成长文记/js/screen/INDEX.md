# 屏幕端模块索引

> 快速定位屏幕端功能文件

## 📁 文件列表

| 文件名 | 功能说明 | 主要函数 |
|:---|:---|:---|
| `app-screen.js` | 屏幕端入口 | `initScreen()`, `startSlideshow()`, `polishEssay()` |

## 📁 功能模块（待拆分）

| 目录 | 功能 | 状态 |
|:---|:---|:---|
| `growth-moment/` | 成长时刻轮播 | ⏳ 集成在 app-screen.js |
| `essay-polish/` | 作文润色 | ⏳ 集成在 app-screen.js |

## 🔗 调用关系

```
app-screen.js
├── 成长时刻TAB
│   ├── loadGrowthMoments() → db.getRecords()
│   ├── startSlideshow() → setInterval()
│   └── stopSlideshow() → clearInterval()
│
└── 作文润色TAB
    ├── loadEssayList() → db.getRecords()
    ├── selectEssay() → showEssayPreview()
    └── polishEssay() → SSE流式请求 → db.updateRecord()
```
