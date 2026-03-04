# 手机端模块索引

> 快速定位手机端功能文件

## 📁 文件列表

| 文件名 | 功能说明 | 主要函数 |
|:---|:---|:---|
| `app-mobile.js` | 手机端入口 | `initMobile()`, `handlePhotoUpload()`, `handleEssayUpload()` |

## 📁 功能模块（待实现）

| 目录 | 功能 | 状态 |
|:---|:---|:---|
| `photo-upload/` | 成长时刻上传 | ⏳ 集成在 app-mobile.js |
| `essay-upload/` | 作文上传+OCR | ⏳ 集成在 app-mobile.js |
| `voice-prompt/` | 语音提示词 | 🔜 待实现 |

## 🔗 调用关系

```
app-mobile.js
├── handlePhotoUpload() → uploadFile() → db.createRecord()
├── handleEssayUpload() → uploadFile() → callOCR() → showOCRResultModal()
└── handleVoicePrompt() → (待实现)
```
