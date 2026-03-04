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

- **接口**: `POST api/app/aiJimeng3/myTextToImage`
- **限制**: 20张/人/天
- **参数**: `prompt`, `size` (1024*1024), `image` (参考图)

### 其他

- **Chatgptten**: 使用模型 `nano-banana-2-hd`。

---

## 图像处理

- **图片解析 (豆包)**: `POST api/app/aiJimeng3/myImageToDesc`
- **阿里云抠图**: `POST api/app/aliyun/aliyunImageSegmentCommonMy`
  - 参数: `{ imageUrl: "..." }`
