# AI 备课工具 - API 配置说明

本项目是一个 AI 驱动的教学课件生成工具，集成了大纲预测、多模态媒体生成、文档解析及云端同步功能。

## 1. 核心 AI 配置

### 文本生成 API (OpenAI 兼容)

用于生成 PPT 大纲、口播文稿、Markdown 清理等逻辑。

- **提供商**: Dalu (第三方)
- **API 地址**: `https://dalu.chatgptten.com/v1`
- **模型名称**: `gemini-3-pro-preview`
- **环境变量**: `OPENAI_API_KEY`, `OPENAI_BASE_URL`

### 图像生成 API (同步/异步)

用于根据视觉提示词渲染 PPT 页面背景或完整页面。

- **API 地址**: `https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream`
- **支持通道 (Provider)**: `TuZi` (同步), `TuZiAsync` (异步), `Chatgptten` (格谷)
- **全量模型列表 (含最新 Banana 系列)**:
  - **新通道推荐**:
    - `gemini-3.1-flash-image-preview`: **新的 Banana 2** (极速高质量，当前最佳推荐)
  - **兔子通道 (TuZi)**:
    - `nano-banana-2`: Nano Banana 2 普通版（默认）
    - `nano-banana-2-2k`: Nano Banana 2 2K 分辨率
    - `nano-banana-2-4k`: Nano Banana 2 4K 分辨率
    - `nano-banana-2-hd`: Nano Banana 2 高清版
    - `nano-banana-2-vip`: Nano Banana 2 VIP 增强版
    - `gemini-3-pro-image-preview-2k`: Gemini 3 Pro 2K
  - **兔子异步通道 (TuZiAsync)**:
    - `gemini-3-pro-image-preview-async`: 异步生成默认模型
    - `gemini-3-pro-image-preview-2k-async`: 2K 异步模型
    - `gemini-3-pro-image-preview-4k-async`: 4K 异步模型
  - **格谷通道 (Chatgptten)**:
    - `nano-banana-2-4k-vip`: Nano Banana 2 4K VIP
    - `nano-banana-2-2k-vip`: Nano Banana 2 2K VIP
    - `nano-banana-2-hd`: Nano Banana 2 高清版
    - `nano-banana-2-vip`: Nano Banana 2 VIP 增强版
  - **其他通用**: `dalle-3`, `midjourney` (需后端通道支持)
- **环境变量**: `IMAGE_API_URL`, `IMAGE_API_TOKEN`

---

## 2. 多媒体与扩展服务

### 语音合成 (TTS)

使用火山引擎 (Volcengine) 接口生成口播语音。

- **任务提交**: `/app/volcengine/ttsMy`
- **状态查询**: `/app/volcengine/queryTtsMy/{taskId}?isOss=1`
- **音色支持**: 默认色及自定义音色 (如 BV123_streaming)

### 视频生成 (Digital Human / Sora)

将 PPT 页面与指令转换为动态视频。

- **创建任务**: `/app/tuZi/asyncDataCreateMy` (Model: `sora-2`)
- **状态查询**: `/app/tuZi/asyncDataQueryMy/{taskId}`

### 图片 URL 转换 (阿里云中转)

为解决外部图片链接跨域或有效期问题，系统会将图片转换为阿里云地址。

- **接口地址**: `/app/zjAi/myConvertUrl`
- **逻辑**: 将外部 URL 提交，返回 `https://s.mamale.vip` 开头的稳定链接。

---

## 3. 文档处理与基础架构

### 统一文件上传 (Unified Upload)

支持图片、视频、JSON、PDF 的统一上传。

- **接口地址**: `/fileResouceItem/uploadUnified`
- **参数**: `formfile` (Multipart/form-data)

### PDF 解析服务

将上传的 PDF 教案自动解析为 Markdown。

- **接口地址**: `/app/aiTextin/myPdfToDoMarkdown`
- **逻辑**: 接收 PDF URL，返回原始 Markdown 文本。

---

## 4. 云端同步与分类

### 分类管理

用于将生成的课件归类存储。

- **获取分类**: `/app/aiApplicationCategory/public?Sorting=id%20desc&PageIndex=1&PageSize=100`

### 课件保存

持久化保存演示文稿数据到云端。

- **保存接口**: `/app/aiPPTX/my`
- **数据结构**: 包含 `aiApplicationCategoryId`, `converImg`, `pptData` (JSON) 等。

---

## 5. 环境变量与全局逻辑

### 基础 URL 动态构建

系统通过 `globalConfig.ts` 动态构建 API 地址：

- **模式**: `https://${type}.mamale.vip/api`
- **参数**: 通过 URL 参数 `type` 指定（默认为 `3w-api`）。

### 身份验证 (Authorization)

- **方式**: 所有内部 API 均需携带 `Bearer Token`。
- **令牌来源**: 优先从 URL 参数 `token` 中提取。

---

## 修改记录

### 2026-03-05 (最新补全)

- 补全了 TTS (火山引擎) 与视频生成 (Sora-2) 的 API 详情。
- 添加了 URL 转换 (Aliyun) 服务文档。
- 详细说明了 PDF 解析与 Markdown 智能清理流程。
- 增加了云端分类与课件保存接口的说明。
- 明确了 `globalConfig` 的动态地址构建逻辑。
