# AI 备课工具 - API 配置说明

## 项目概述

本项目是一个 AI 驱动的教学课件生成工具，可以自动将教案内容转换为精美的 PPT 演示文稿。

## 当前 API 配置

### 文本生成 API（大纲生成）

使用第三方 OpenAI 兼容接口：

- **API 地址**: https://dalu.chatgptten.com/v1
- **模型名称**: gemini-3-pro-preview
- **API Key**: sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r

### 图片生成 API（幻灯片图片）

使用自定义图片生成接口：

- **API 地址**: https://3w-api.mamale.vip/api/app/chatgptten/myImage
- **模型名称**: nano-banana-2-4k-vip（4K 高质量版本）
- **认证方式**: Bearer Token
- **Token**: eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0...（完整 token 已配置）

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **AI SDK**: OpenAI SDK (兼容格式)
- **UI 组件**: Lucide React (图标)
- **拖拽功能**: @hello-pangea/dnd
- **PDF 导出**: jsPDF

## 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 访问地址

- **本地**: http://localhost:5000/
- **网络**: http://192.168.1.102:5000/

**注意**: 端口已固定为 5000，如果被占用会报错而不会自动切换。

## 功能特性

1. **智能大纲生成**
   - 自动分析教案内容
   - 生成结构化的 PPT 大纲
   - 支持自定义页数（3-50 页）

2. **多种风格选择**
   - 童趣卡通（低年级）
   - 黑板手绘（通用）
   - 清新自然（文科/科学）
   - 纸张笔记（理科/高年级）

3. **内容侧重调整**
   - 概括摘要
   - 详细内容
   - 视觉为主

4. **大纲编辑**
   - 拖拽排序
   - 实时编辑标题和内容
   - 自定义视觉提示词
   - 添加/删除页面

5. **AI 图片生成**
   - 使用 nano-banana-2-4k-vip 模型生成 4K 高质量图片
   - 16:9 宽高比
   - 自定义 API 接口调用
   - 单页生成或批量生成
   - 直接返回图片 URL（无需 base64 转换）

6. **PDF 导出**
   - 一键导出完整 PPT
   - 保持原始图片质量

## 环境变量配置

在 `.env.local` 文件中配置：

```env
# 第三方 OpenAI 兼容 API 配置（文本生成）
OPENAI_API_KEY=sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r
OPENAI_BASE_URL=https://dalu.chatgptten.com/v1

# 自定义图片生成 API 配置
IMAGE_API_URL=https://3w-api.mamale.vip/api/app/chatgptten/myImage
IMAGE_API_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6...（完整 token）
```

## 修改记录

### 2025-12-17 (第四次更新)
- 将开发服务器端口固定为 5000
- 添加 strictPort 配置，确保端口不会自动切换

### 2025-12-17 (第三次更新)
- 将图片模型从 nano-banana-2-hd 升级为 nano-banana-2-4k-vip
- 支持 4K 超高清图片生成，提升课件质量

### 2025-12-17 (第二次更新)
- 将图片生成接口更换为自定义 API
- 使用 nano-banana 系列模型
- 采用 Bearer Token 认证方式
- 直接返回图片 URL，优化性能
- 更新环境变量，添加 IMAGE_API_URL 和 IMAGE_API_TOKEN
- 修改 geminiService.ts 中的 generateSlideImage 函数使用 fetch 调用

### 2025-12-17 (首次更新)
- 将 Google Gemini API 替换为第三方 OpenAI 兼容接口
- 移除 @google/genai 依赖
- 安装 openai SDK
- 更新 geminiService.ts 以使用 OpenAI Chat Completions API
- 更新环境变量配置
- 更新 UI 文案，移除 Gemini 品牌相关内容

## 注意事项

1. **API 密钥安全**: 请勿将 API 密钥提交到公共代码仓库
2. **费用控制**: 图片生成可能产生较高费用，建议合理使用
3. **浏览器支持**: 建议使用 Chrome、Edge 等现代浏览器
4. **网络要求**: 需要稳定的网络连接以访问 API 服务

## 疑难解答

### 端口被占用
如果 3000 端口被占用，Vite 会自动尝试其他端口（如 3001）。

### API 调用失败
- 检查网络连接
- 确认 API 密钥是否正确
- 检查 API 服务是否可用
- 查看浏览器控制台错误信息

### 图片生成失败
- 确认模型名称配置正确
- 检查视觉提示词是否合理
- 验证 API 配额是否充足

## 联系支持

如有问题，请联系项目管理员。
