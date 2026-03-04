# AI 对话服务

## 统一 API 接口

| 接口类型 | URL |
|------|------|
| **统一流式对话** | `POST api/app/zjAi/myUnifiedOpenAiStream` |
| **ChatGPT 直接调用** | `POST api/app/chatGpt/prompt` |

---

## 服务商与模型

### CoresHub (推荐通用场景)

- **DeepSeek-V3**: 极速对话，实时交互。
- **DeepSeek-R1**: 深度推理，复杂逻辑。

### TuZi (GPT 系列)

- **模型**: `chatgpt-4o-latest`, `gpt-4-turbo`, `claude-3-opus`

---

## 大模型配置信息

### 文心一言大模型
- **Application ID**: `4c51566a-6507-40cd-bc88-1f6444de8e9a`
- **Provider**: Dify
- **API Key**: `app-mgNVAwyIszGoJptrPD9xmJJs`
- **API URL**: `http://dify.zonejoin.cn`

### 豆包大模型
- **Application ID**: `d2d4a4f0-7a4e-8521-a694-3a176c5466a2`
- **Provider**: Dify
- **API Key**: `app-d8qY7cPQ1RdorwgafOetdg1W`

### Doubao-Seed-1.6
- **Application ID**: `e5712ef5-10f2-2cd7-fb40-3a1c2a128b08`
- **Provider**: OpenAI 兼容
- **API Key**: `fd9c821c-560d-4c53-8745-0f7b4d1ec01a`
- **API URL**: `http://ark.cn-beijing.volces.com/api/v3/`
- **Model**: `doubao-seed-1-6-250615`

### kimi-K2
- **Application ID**: `466c16af-f0b9-3a59-5953-3a1c1cedce47`
- **Provider**: OpenAI 兼容
- **API Key**: `sk-79311c101d3838bf1d91ac15d453606c8eaaeed32df5ccf5fefdd447d00a6554`
- **API URL**: `https://api.aiionly.com/v1/`
- **Model**: `Kimi-K2`

### DeepSeek V3 (基石)
- **Application ID**: `4e3ae48b-6385-9ed9-652c-3a182b5c029e`
- **Provider**: OpenAI 兼容
- **API Key**: `sk-MVzhVjsbFdSk988fNb8HQAdFXcTJEyZnjsaJvBA0hspqGSX0`
- **API URL**: `https://openapi.coreshub.cn/v1`
- **Model**: `DeepSeek-V3`

### DeepSeek R1 满血基石版
- **Application ID**: `94658ee0-3689-81f9-d5a4-3a17f85fc149`
- **Provider**: OpenAI 兼容
- **API Key**: `sk-MVzhVjsbFdSk988fNb8HQAdFXcTJEyZnjsaJvBA0hspqGSX0`
- **API URL**: `https://openapi.coreshub.cn/v1`
- **Model**: `DeepSeek-R1`

### DeepSeek 官方
- **Application ID**: `2c0ba0de-f910-1e6b-ef5b-3a18de29f5b5`
- **Provider**: OpenAI 兼容
- **API Key**: `sk-4899d06c45d64fc5a3e01c4c1b503eab`
- **API URL**: `https://api.deepseek.com/v1`
- **Model**: `deepseek-reasoner`

---

## 使用示例

### SSE 响应解析

```javascript
data: {"choices":[{"delta":{"content":"..."}}]}
data: [DONE]
```

> [!TIP]
> DeepSeek-R1 响应中包含额外的 `reasoning_content` 字段。

### 场景模板

- **作文批改**: 使用 `DeepSeek-R1`，设置 System Prompt 从 4 维度评分。
- **代码审查**: 关注质量、性能、安全性和可维护性。
