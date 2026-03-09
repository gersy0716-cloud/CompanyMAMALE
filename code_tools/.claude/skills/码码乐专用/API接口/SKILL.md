---
name: mamale-api
description: 码码乐业务 API 接口调用指南。提供班级、学生、教师信息的查询规范、鉴权 Headers 配置及文件上传接口。当用户询问"调用 API"、"获取学生列表"、"查询班级"或"上传文件"时触发。
---

# 码码乐 API接口

外部API (`https://{type}.mamale.vip`) 的认证和配置规范。

---

## 快速参考

| 项目 | 值 |
|------|-----|
| OAuth服务器 | `https://oauth.mamale.vip` |
| API基础URL | `https://{type}.mamale.vip/api/app/{endpoint}` |
| Headers | `Authorization: Bearer {token}` |
| URL参数 | 必须由用户提供，不能默认设置 |

---

## 常用接口速查

| 接口 | URL | 方法 |
|------|-----|------|
| 班级列表 | `/api/app/class` | GET |
| 学生列表 | `/api/app/student` | GET |
| 按班级查学生 | `/api/app/student/byClssId?ClassId={id}` | GET |
| 教师列表 | `/api/app/teacher` | GET |
| 文件上传 | `/api/fileResouceItem/uploadUnified` | POST |

---

## 详细文档

| 文件 | 内容 |
|------|------|
| [auth-config.md](references/auth-config.md) | 认证配置、URL参数、响应格式 |
| [class.md](references/class.md) | 班级查询、学生绑定、教师绑定 |
| [student.md](references/student.md) | 学生查询、课时、勋章 |
| [teacher.md](references/teacher.md) | 教师接口 |
| [file-upload.md](references/file-upload.md) | 文件上传 |
| [database-api.md](references/database-api.md) | 在线数据库 (BaseMulti) 交互规范与查询格式 |
