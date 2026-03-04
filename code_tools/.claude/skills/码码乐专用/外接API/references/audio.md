# 语音服务 (Volcengine)

## 音频转文字 (ASR)

### 极速版 (推荐)

- **接口**: `POST api/app/volcengine/audioToTextMy`
- **输入**: `{ content: "URL或base64" }`
- **返回**: `{ content: "转写文本" }`

### 标准版 (异步)

- **提交**: `POST .../audioToTextStandMy`
- **查询**: `GET .../audioToTextStandMy/{taskId}`

---

## 文字转音频 (TTS)

- **提交**: `POST api/app/volcengine/ttsMy`
- **查询**: `GET api/app/volcengine/queryTtsMy/{taskId}?isOss=1`
- **输入**: `{ text: "内容" }`
- **返回**: `{ audioUrl: "..." }`

---

## AI 播客 (Podcast)

- **接口**: `POST api/app/speech/podcast/streamMy`
- **特性**: SSE 流式响应，支持多人对话及背景音乐。
