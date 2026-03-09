# 语音服务

## 百度语音

### 语音识别

- **接口**: `GET /api/app/baidu/ocrAudios`
- **说明**: 能够把语音识别成文字。

### 语音播放

- **接口**: `GET /api/app/baidu/text2audio?tex=hello`
- **说明**: 能够把文字转换成语音地址（直接在地址栏带参数 `tex={内容}` 即可调用）。

---

## Volcengine (火山引擎)

### 音频转文字 (ASR)

- **极速版 (推荐)**: `POST api/app/volcengine/audioToTextMy`
  - **输入**: `{ content: "URL或base64" }`
  - **返回**: `{ content: "转写文本" }`
- **标准版 (异步)**:
  - **提交**: `POST .../audioToTextStandMy`
  - **查询**: `GET .../audioToTextStandMy/{taskId}`

### 文字转音频 (TTS)

- **提交**: `POST api/app/volcengine/ttsMy`
- **查询**: `GET api/app/volcengine/queryTtsMy/{taskId}?isOss=1`
  - **输入**: `{ text: "内容" }`
  - **返回**: `{ audioUrl: "..." }`

---

## AI 播客 (Podcast)

- **接口**: `POST api/app/speech/podcast/streamMy`
- **特性**: SSE 流式响应，支持多人对话及背景音乐。
