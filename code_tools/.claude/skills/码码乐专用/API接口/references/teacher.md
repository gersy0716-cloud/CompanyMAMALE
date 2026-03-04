# 教师接口 (teacher)

**URL**: `GET /api/app/teacher`

---

## 返回结构

```json
{
  "totalCount": 3,
  "items": [{
    "id": "uuid",
    "name": "教师姓名",
    "tel": "联系电话",
    "schoolSubjectNames": "任教科目",
    "classDtos": [{"name": "班级名"}],
    "status": 1
  }]
}
```

---

## 字段说明

| 字段 | 说明 |
|------|------|
| id | 教师UUID |
| name | 姓名 |
| tel | 电话 |
| schoolSubjectNames | 科目 |
| classDtos | 任教班级 |
| status | 1启用/0禁用 |
