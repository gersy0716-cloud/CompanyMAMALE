# 视觉识别与图像生成

## OCR 文字识别 (TextIn)

### 常用接口

- **快速提取**: `POST api/app/aiTextin/myPdfToDoMarkdown` (返回 Markdown)
- **完整识别**: `POST api/app/aiTextin/aiTextinMy` (含位置、结构信息)

### 认证信息

- **AppID**: `8bf0c00e5ecfa09bd341956bcf730077`
- **Secret**: `320543241f22e099055e63b9c5eef12e`

---

## 图像生成 (Text to Image)

### AI 即梦 (火山引擎) ⭐ 推荐

- **接口**: `POST api/app/aiJimeng/myTextToImage` (图片生成)
- **参数示例**:

  ```json
  {
    "prompt": "超现实风格，治愈系傍晚夜幕降临...",
    "seed": -1,
    "size": "288*512",
    "isHd": true
  }
  ```

- **限制**: 20张/人/天
- **其他**:
  - **Chatgptten**: 使用模型 `nano-banana-2-hd`。

---

## 图像处理

### 图片理解接口

- **接口**: `POST api/app/aiJimeng3/myImageToDesc`
- **参数示例**:

  ```json
  {
    "items": [
      {
        "type": "text",
        "value": "图片主要讲了什么?"
      },
      {
        "type": "image",
        "value": "https://..."
      }
    ],
    "model": "doubao-seed-1-6-250615",
    "role": "user"
  }
  ```

### 其他图像处理

- **阿里云抠图**: `POST api/app/aliyun/aliyunImageSegmentCommonMy`
  - 参数: `{ imageUrl: "..." }`
