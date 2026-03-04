# 数据库配置与模型

## 连接信息

| 配置项 | 值 | 说明 |
| -------- | --- | ------ |
| **API地址** | `https://data.520ai.cc/` | 数据库接口地址 |
| **API Key** | `{api_key}` | 访问凭证（**非固定，需确认**） |
| **数据库ID** | `{base_id}` | 数据库唯一标识（**非固定，需确认**） |

> [!IMPORTANT]
> **API Key** 和 **数据库ID** 均为动态变量。
>
> - ❌ 严禁写死具体的值。
> - ✅ 第一次使用前，必须向用户确认当前项目的 `api_key` 和 `base_id`。

---

## 认证方式

Headers 中必须包含：

```http
x-bm-token: {api_key}
```

---

## 字段规范

### 系统字段

由系统自动管理，**每张表自带，不需要手动创建**：

- `id`: Number（自增主键）
- `name`: Single Line Text（记录名称）
- `created_by`: created_by
- `updated_by`: updated_by
- `created_at`: Date Time
- `updated_at`: Date Time

> [!TIP]
> `name` 是每张表自带的第一个字段，可以用它存储每条记录的"主名称"（如用户名、标题等），无需重复创建。

不能修改系统字段的名称，也不能删除系统字段。

### 租户隔离字段

> [!CAUTION]
> **每张表必须创建 `tenantid` 字段（Single Line Text）！**
>
> - 用于多租户数据隔离，防止不同学校/租户的数据混在一起
> - 查询时：必须加 `["where", ["tenantid", "=", tenantId]]` 作为筛选条件
> - 创建时：必须同时写入当前租户的 `tenantid` 值

### 数据类型

| 类型名 | 说明 |
| -------- | ------ |
| **Single Line Text** | 短文本（用户名、标题等） |
| **Long Text** | 长文本（描述、JSON、正文等） |
| **Number** | 数字 |
| **Email** | 邮箱 |
| **URL** | 网址 |
| **Single Select** | 单选（需预设选项） |
| **Multi Select** | 多选 |
| **Date** | 日期 |
| **Date Time** | 日期时间 |
| **Markdown** | Markdown 格式文本 |
| **Switch** | 开关（布尔值） |
| **Image** | 图片 |
| **Relation** | 关联其他表的记录 |

### Single Select / Multi Select 选项配置

创建 Single Select 或 Multi Select 类型字段时，需要在管理界面手动添加 **Options**（选项列表）。

每个选项有两个属性：

| 属性 | 说明 |
| :--- | :--- |
| **Value** | 实际存储在数据库中的值，也是 API 读写时使用的值 |
| **Label** | 前端显示用的别名（可选），留空时默认等于 Value |

> [!TIP]
> 建议开启 **Value = Label** 开关，让 Value 和 Label 保持一致，减少维护成本。只在需要国际化或中英文映射时才单独设置 Label。

API 写入时直接传 Value 值即可，例如：

```json
{ "status": "进行中" }
```
