---
name: mamale-database
description: 码码乐通用数据库 (BaseMulti) 操作规范。涵盖增删改查 API 语法、Token 配置及错误处理。注意：本项目特定表 ID 应查阅项目 docs。当用户询问"数据库操作"、"修改数据记录"或"配置 BaseMulti"时触发。
---

# 码码乐 数据库 (BaseMulti)

针对码码乐项目的通用数据库操作规范。

---

## 快速配置

| 配置 | 说明 |
|------|------|
| API地址 | `https://data.520ai.cc/` |
| Token | `{api_key}` (需向用户确认) |
| 数据库ID | `{base_id}` (需向用户确认) |

> [!CAUTION]
> **Skill 文件只记录通用知识，严禁写入项目特定数据。**
>
> - ❌ 不要在 Skill 中写入具体的表 ID、API Key、表字段设计、项目专属的表清单
> - ✅ 项目的表设计、表 ID 等信息应写在该项目自己的 `docs/` 目录下
> - ✅ Skill 只记录：通用的 API 用法、字段类型规范、操作语法、错误处理

---

## 核心参考

| 文件 | 内容 |
|------|------|
| [config-schema.md](references/config-schema.md) | 表清单、字段类型、系统字段、认证配置 |
| [operations.md](references/operations.md) | 增删改查详情、分页、Filters 编码规则 |
| [error-handling.md](references/error-handling.md) | 状态码处理、调试技巧、最实实践 |

---

## 查询 (GET)

**基础URL**: `GET /api/bases/{base_id}/tables/{table}/records`

> [!IMPORTANT]
> `{base_id}` 为动态变量，由用户提供。

---

## 常用操作速查

- **创建**: `POST .../records` (直接传字段)
- **更新**: `PATCH .../records/{id}`
- **删除**: `DELETE .../records/{id}`

> ⚠️ 每个请求头必须包含 `x-bm-token`。
