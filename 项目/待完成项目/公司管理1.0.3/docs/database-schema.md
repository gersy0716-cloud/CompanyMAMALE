# 公司管理系统 — 数据库表设计（基于代码全量审计）

## 核心设计理念

- **增量优化**：在各业务表添加 `user_id` (SingleLineText) 字段，存储 `users.name`。
- **完全兼容**：不删除任何系统自带字段。
- **身份映射**：`业务表.user_id` → 匹配 `users.name` → 显示 `users.real_name`。
- **文档即真理**：文档应定期根据代码逻辑进行“洗一遍”（同步更新），作为后期开发和匹配的权威参考。

---

## 系统字段（每张表自带）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | Number | 自增主键 |
| `name` | SingleLineText | 记录名称 |
| `created_by` | — | 创建者（系统加密 ID） |
| `created_at` | DateTime | 创建时间 |

---

## 表 1：`users`（系统 ID: `injhuCnRig`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 登录名（唯一标识，如 `luowenbin`） |
| `password` | SingleLineText | 登录密码 |
| `real_name` | SingleLineText | 真实姓名（如 `罗文彬`） |
| `avatar_color` | SingleLineText | 头像颜色代码 |
| `role` | SingleLineText | 角色（admin / staff） |
| `[SPECIAL]` | — | **admin**: 内置管理员账号 (密码 `123456`)，拥有版本发布特权。 |

---

## 表 2：`tasks`（系统 ID: `SxqN1eraUE`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 任务标题 |
| `user_id` | SingleLineText | 创建者用户名 |
| `task_type` | SingleSelect | 全局属性：主线 / 支线 |
| `priority` | SingleSelect | 高 / 中 / 低 |
| `status` | SingleSelect | 待接取 / 进行中 / 待验收 / 已完成 |
| `deadline` | Date | 截止日期 |
| `description` | LongText | 详细需求 |
| `remarks` | LongText | 备注 |
| `assignees` | LongText | 执行人列表（JSON 数组：`[{user_id, user_name, ...}]`） |
| `progress` | SingleLineText | 进度百分比 |
| `files` | LongText | 附件列表（JSON） |
| `parent_task_id` | SingleLineText | 父任务 ID（用于无限层级嵌套） |
| `creator_id` | SingleLineText | 冗余字段：记录原始创建人 ID |

---

## 表 3：`accounts`（系统 ID: `uVB1tBArMg`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 服务/网站名称 |
| `url` | SingleLineText | 访问网址 |
| `username` | SingleLineText | 登录账号 |
| `password` | SingleLineText | 登录密码 |
| `category` | SingleLineText | 分类名称 |
| `notes` | LongText | 备注信息 |

---

## 表 4：`announcements`（公告，系统 ID: `jYb1wcKsHy`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 公告标题 |
| `user_id` | SingleLineText | 发布者用户名 |
| `content` | LongText | 公告正文 |
| `is_pinned` | SingleLineText | 是否置顶（0/1） |
| `files` | LongText | 附件信息（JSON） |

---

## 表 5：`discussions`（讨论，系统 ID: `gpu3NbzIg9`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 讨论标题 |
| `user_id` | SingleLineText | 作者用户名 |
| `content` | LongText | 讨论内容 |
| `is_pinned` | SingleLineText | 是否置顶（0/1） |
| `files` | LongText | 附件信息（JSON） |
| `replies` | LongText | 回复列表（JSON） |
| `last_reply_at` | DateTime | 最后回复时间 |

---

## 表 6：`skills`（系统 ID: `BCHmZn1YSZ`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | Skill 名称 |
| `user_id` | SingleLineText | 上传者用户名 |
| `summary` | LongText | 简要描述 |
| `detail` | LongText | 详细内容（Markdown） |
| `tags` | LongText | 标签列表（JSON） |
| `files` | LongText | 附件列表（JSON） |

---

## 表 7：`github`（GitHub 项目分享，系统 ID: `rkZxw28qNd`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 项目显示名称 |
| `user_id` | SingleLineText | 分享者用户名 |
| `repo_url` | SingleLineText | GitHub 仓库地址 |
| `share_reason` | LongText | 分享理由 |
| `usage_guide` | LongText | 使用指南 |
| `files` | LongText | 截图（JSON） |

---

## 表 8：`claudes`（Claude Code 账号，系统 ID: `N6bAU62sbd`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 账号名称 |
| `base_url` | SingleLineText | API Base URL |
| `auth_token` | SingleLineText | API Key |
| `query_url` | SingleLineText | 用量查询网址 |
| `remark` | SingleLineText | 当前签到用户列表（逗号分隔，如 `罗文彬, 张三`） |
| `is_active` | SingleLineText | 是否启用（true/false） |

---

## 表 9：`messages`（站内消息，系统 ID: `messages`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | SingleLineText | 消息标题 |
| `msg_type` | SingleLineText | 消息类型 (task_assigned/discussion_reply/announcement/skill_shared/github_shared) |
| `content` | LongText | 消息内容 |
| `recipient_id` | SingleLineText | 接收者用户名/ID |
| `is_read` | SingleLineText | 是否已读（0/1） |
| `ref_type` | SingleLineText | 关联类型（task/announcement 等） |
| `ref_id` | SingleLineText | 关联记录 ID |

---

## 表 10：`versions`（系统版本，系统 ID: `versions`）

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `version` | SingleLineText | 版本号 (如 `v1.0.1`) |
| `download_url` | SingleLineText | 安装包直链地址 |
| `user_id` | SingleLineText | 发布人用户名 |
| `changelog` | LongText | **已隐藏**：旧版更新说明，现简化流程中不再展示。 |
| `created_at` | DateTime | 发布时间 |
