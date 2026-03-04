---
name: mamale-external-api
description: 指导集成码码乐外接 AI 服务（DeepSeek 对话、TextIn OCR、即梦绘画/视频、火山引擎语音）。提供流式输出及任务轮询规范。当用户询问"AI 对话"、"文字识别"、"生成图片"或"语音转文字"时触发。
---

# 码码乐 外接 AI 服务

集成了常用的 AI 服务，包括对话、视觉、音频和视频处理。

---

## 快速导航

| 服务 | 入口接口 | 备注 |
|------|----------|------|
| **AI 对话** | `zjAi/myUnifiedOpenAiStream` | 支持 DeepSeek/GPT/Claude |
| **OCR 识别** | `aiTextin/myPdfToDoMarkdown` | TextIn 强力驱动 |
| **绘画生成** | `aiJimeng3/myTextToImage` | 火山引擎即梦 |
| **视频生成** | `aiJimeng3/myTextToVideo` | 异步轮询任务 |
| **语音服务** | `volcengine/audioToTextMy` | ASR/TTS |

---

## 详细模型与文档

| 文档 | 包含内容 |
|------|------|
| [ai-chat.md](references/ai-chat.md) | 统一流式接口、DeepSeek选型、SSE规范 |
| [vision.md](references/vision.md) | OCR识别、即梦绘画、图像解析、抠图 |
| [audio.md](references/audio.md) | 语音转文字(极速/标准)、TTS、AI播客 |
| [video.md](references/video.md) | 文生视频、图生视频、Sora-2接口 |
