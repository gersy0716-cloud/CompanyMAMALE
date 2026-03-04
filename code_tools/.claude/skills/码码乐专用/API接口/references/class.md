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
