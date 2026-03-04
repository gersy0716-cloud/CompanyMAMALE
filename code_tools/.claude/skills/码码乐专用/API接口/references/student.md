# 学生接口 (student)

## 接口列表

| 操作 | URL | 方法 |
|------|-----|------|
| 学生列表 | `/api/app/student` | GET |
| 按班级查 | `/api/app/student/byClssId?ClassId={id}` | GET |
| 学生详情 | `/api/app/student/studentInfo` | GET |
| 添加学生 | `/api/app/student` | POST |
| 修改学生 | `/api/app/student/{id}` | PUT |

> ⚠️ 班级字段是 `classs`（3个s）

---

## 使用流程

1. 调用 `/api/app/class` 获取班级列表
2. 提取班级 `id`
3. 用 `id` 调用 `/api/app/student/byClssId?ClassId={id}`

---

## 课时管理

> 此部分接口待补充文档

---

## 勋章管理

> 此部分接口待补充文档
