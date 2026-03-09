# 班级接口 (class)

## 查询操作

| 操作 | URL | 说明 |
|------|-----|------|
| 班级列表 | `GET /api/app/class` | 返回数组或 `{items, totalCount}` |
| 单个班级 | `GET /api/app/class/{id}` | |
| 竞赛班级 | `GET /api/app/class/contest` | 默认竞赛班级 |
| 公开竞赛 | `GET /api/app/class/publicContest` | |
| 公开班级 | `GET /api/app/class/public` | |

**关键字段**：`id`、`name`、`grade`、`studentCount`

---

## 学生绑定

| 操作 | URL | Body |
|------|-----|------|
| 添加学生 | `POST /api/app/class/bindStudent` | `{ classId, studentId }` |
| 移除学生 | `POST /api/app/class/noBindStudent` | `{ classId, studentId }` |

> ⚠️ 批量接口 `/bindStudents`、`/noBindStudents` 有问题，建议循环调用单个接口

---

## 教师绑定

| 操作 | URL | Body |
|------|-----|------|
| 绑定教师 | `POST /bindTeacher` | `{ classId, teacherId }` |
| 解绑教师 | `POST /noBindTeacher` | `{ classId, teacherId }` |

---

## 课程目录

> 此部分接口待补充文档

---

## 班级画布 (Canva)

- **我的画布**: `GET https://{type}.mamale.vip/api/app/classCanva/my`
- **共享画布**: `GET https://{type}.mamale.vip/api/app/classCanva/myWithShare`

### 说明

- **请求方式**: GET，支持分页和排序。
- **参数**: `Sorting` (例如 `id desc`)，`PageIndex` (当前页)，`PageSize` (每页个数)。
- **返回结构**:

  ```json
  {
    "totalCount": 2,
    "items": [
      {
        "canvaData": "https://...",
        "creationTime": "2025-10-24 15:38:27",
        "creatorId": "...",
        "id": "...",
        "isShare": false,
        "user": {
           "userName": "lickies",
           "email": "lickies@qq.com"
        }
      }
    ]
  }
  ```
