# 一句话生一张PPT 数据库及 API 设计方案

## 1. 数据库设计

根据现有的 BaaS 平台通用历史记录表结构，我们将“一句话生一张PPT”的生成任务记录存储在以下表中。

- **数据库 ID**: `bsekddalnVrgIAiZYmM`
- **表 ID / 表名**: `history_records`

### 1.1 字段映射方案

| 字段名 | 类型 | 说明 | 映射到 PPT 业务 |
| :--- | :--- | :--- | :--- |
| `id` | String/UUID | 记录的唯一标识符 | 自动生成 |
| `name` | String | 记录名称 | 存储用户的**“一句话描述”**（Prompt），用于列表展示。 |
| `created_by` | String | 创建者 | 自动记录 |
| `updated_by` | String | 更新者 | 自动记录 |
| `created_at` | DateTime | 创建时间 | 自动记录 |
| `updated_at` | DateTime | 更新时间 | 自动记录 |
| `module_type` | String | 模块类型 | 固定值为 `one_sentence_ppt`，用于区分其他功能模块。 |
| `tenant` | String | 租户 ID | 关联对应的租户空间。 |
| `user_id` | String | 用户 ID | 关联生成此 PPT 的用户。 |
| `result` | JSON/String | 生成结果 | **核心字段**，存储完整的 PPT 生成数据，JSON 格式，结构见下文。 |

### 1.2 `result` 字段 JSON 结构定义

`result` 字段用于存储 AI 生成的结构化内容以及图片信息，建议采用以下 JSON 结构：

```json
{
  "prompt": "用户输入的一句话（与 name 字段相同）",
  "style": "科技风", // 用户选择的 PPT 风格
  "title": "AI 生成的 PPT 主标题",
  "content_layout": "title_and_bullets", // 内容排版类型（预留）
  "bullet_points": [
    "AI 生成的要点 1",
    "AI 生成的要点 2",
    "AI 生成的要点 3"
  ],
  "bg_image_prompt": "由 AI 生成的用于 Stable Diffusion 的背景图提示词",
  "bg_image_url": "https://example.com/path/to/generated/image.png", // 生成的背景图片 URL (或附件 ID)
  "bg_image_id": "file_id_xxxxx", // 如果存在系统文件服务中，保存文件 ID
  "status": "success", // 生成状态: pending, generating, success, failed
  "error_message": "" // 失败时的错误信息
}
```

## 2. API 链路验证计划 (后端/API 优先策略 - 选项B)

在正式开发前端界面前，我们优先验证核心的 AI API 链路，确保数据的流转和存储是通畅的。

### 2.1 链路验证步骤

1. **AI 文本生成 (OpenAI)**:
    - 构造特定的 Prompt，要求大模型根据“一句话描述”和“风格”，输出 JSON 格式的结果（包含标题、要点列表和背景图提示词）。
    - **验证目标**: 测试大模型结构化输出的稳定性和质量。

2. **AI 图像生成 (Stable Diffusion)**:
    - 将上一步生成的 `bg_image_prompt` 传递给 SD 接口（或其他兼容接口）。
    - **验证目标**: 测试生图接口的连通性、生成质量以及图片上传/存储机制（获取图片的公网 URL 或内部文件 ID）。

3. **数据落库 (BaaS Platform)**:
    - 将上述步骤获得的所有数据组装为符合 `history_records` 表结构的 Payload。
    - 调用 BaaS 的数据插入接口，测试数据能否成功保存。
    - **验证目标**: 测试数据库写入权限和字段格式是否匹配。

### 2.2 下一步开发计划

完成 API 链路验证后，我们再进入前端功能开发（选项 A）。

1. **编写测试脚本**: 在 Node.js 环境下编写一个简单的测试脚本来运行上述 3 个步骤。
2. **前端项目初始化**: 基于 Electron + Vite + React 搭建项目骨架。
3. **核心组件开发**: 输入面板、生成 loading 状态、结果预览与编辑区。
4. **接口联调**: 将前端组件与验证过的 API 链路对接。
