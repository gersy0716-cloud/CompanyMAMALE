# 生成图片

根据用户提供的提示词，调用 nanobanana API 生成图片。支持交互式选择通道和模型。

## 使用方法

### 方式1: 交互式选择（推荐）
直接输入 `/generate-image`，会逐步弹出对话让你选择：
1. 选择通道（兔子/格谷）
2. 选择模型
3. 输入提示词

### 方式2: 直接指定参数
```
/generate-image --provider=通道名 --model=模型名 [提示词]
```

## 执行流程

### 步骤1: 检查用户输入

用户输入: $ARGUMENTS

- 如果用户**没有提供任何参数**或**参数不完整**，进入**交互式选择流程**
- 如果用户提供了完整的 `--provider`、`--model` 和提示词，直接执行生成

### 步骤2: 交互式选择流程

**第一步：选择通道**

使用 AskUserQuestion 工具询问用户：

问题: "请选择图片生成通道"
选项:
- TuZi (兔子) - 默认通道，模型丰富
- Chatgptten (格谷) - 备用通道，支持 Pro 系列

**第二步：根据通道显示模型选项**

如果选择了 **兔子通道 (TuZi)**，询问模型：

问题: "请选择模型"
选项:
- nano-banana-2-vip - Nano Banana 2 VIP (推荐)
- nano-banana-2-4k-vip - Nano Banana 2 4K VIP (高清)
- gpt-image-1.5 - GPT Image 1.5
- gemini-3-pro-image-preview-2k-vip - Gemini 3 Pro 2K VIP

如果选择了 **格谷通道 (Chatgptten)**，询问模型：

问题: "请选择模型"
选项:
- nano-banana-2-2k-vip - Nano Banana 2 2K VIP (推荐)
- nano-banana-2-4k-vip - Nano Banana 2 4K VIP (高清)
- nano-banana-pro_4k - Nano Banana Pro 4K
- gemini-3-pro-image-preview-2k-vip - Gemini 3 Pro 2K VIP

**第三步：输入提示词**

问题: "请输入图片描述/提示词"
说明: "描述你想要生成的图片风格、内容、颜色等"

### 步骤3: 构建请求并生成图片

1. 构建完整的图片生成提示词：

```
设计一张专业的演示文稿幻灯片 (PPT Slide)。

设计指令:
{用户提供的提示词}

重要要求:
- 图片看起来必须像一张完成度极高的PPT页面
- 保持高分辨率，专业排版
- 宽高比: 16:9
- 确保设计风格与描述严格一致
```

2. 调用 API 生成图片：

```
API 地址: https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream
请求方式: POST
Content-Type: application/json
Authorization: Bearer {从环境变量 IMAGE_API_TOKEN 获取}
```

3. 请求体格式：

```json
{
  "provideName": "{选择的通道}",
  "model": "{选择的模型}",
  "messages": [
    {
      "role": "user",
      "content": "{完整的图片生成提示词}"
    }
  ]
}
```

4. 解析 SSE 流式响应，提取图片 URL

### 步骤4: 返回结果

```
## 生成的图片

**使用配置:**
- 通道: {通道名称}
- 模型: {模型名称}

![生成的图片]({图片URL})

图片地址: {图片URL}
```

---

## 完整通道和模型参考

### 兔子通道 (TuZi) 全部模型

| 模型值 | 名称 |
|--------|------|
| nano-banana-2-vip | Nano Banana 2 VIP (默认) |
| nano-banana-2-2k-vip | Nano Banana 2 2K VIP |
| nano-banana-2-4k-vip | Nano Banana 2 4K VIP |
| nano-banana-2-hd | Nano Banana 2 HD |
| gpt-image-1.5 | GPT Image 1.5 |
| gpt-4o-image | GPT-4o Image |
| gpt-4o-image-async | GPT-4o Image Async |
| gpt-4o-image-vip | GPT-4o Image VIP |
| gpt-4o-image-vip-async | GPT-4o Image VIP Async |
| gemini-3-pro-image-preview | Gemini 3 Pro |
| gemini-3-pro-image-preview-2k-vip | Gemini 3 Pro 2K VIP |
| gemini-3-pro-image-preview-4k-vip | Gemini 3 Pro 4K VIP |
| gemini-3-pro-image-preview-vip | Gemini 3 Pro VIP |
| gemini-3-pro-image-preview-hd | Gemini 3 Pro HD |

### 格谷通道 (Chatgptten) 全部模型

| 模型值 | 名称 |
|--------|------|
| nano-banana-2-2k-vip | Nano Banana 2 2K VIP |
| nano-banana-2-4k-vip | Nano Banana 2 4K VIP |
| nano-banana-2-hd | Nano Banana 2 HD |
| nano-banana-2-vip | Nano Banana 2 VIP |
| nano-banana-pro_2k | Nano Banana Pro 2K |
| nano-banana-pro_4k | Nano Banana Pro 4K |
| gemini-3-pro-image-preview | Gemini 3 Pro |
| gemini-3-pro-image-preview-2k | Gemini 3 Pro 2K |
| gemini-3-pro-image-preview-2k-vip | Gemini 3 Pro 2K VIP |
| gemini-3-pro-image-preview-4k | Gemini 3 Pro 4K |
| gemini-3-pro-image-preview-4k-vip | Gemini 3 Pro 4K VIP |
| gemini-3-pro-image-preview-hd | Gemini 3 Pro HD |
| gemini-3-pro-image-preview-vip | Gemini 3 Pro VIP |

## 快捷用法示例

```bash
# 交互式选择（推荐新手）
/generate-image

# 直接生成（熟练后使用）
/generate-image -p TuZi -m nano-banana-2-vip 童趣卡通风格，主题是数学
```
