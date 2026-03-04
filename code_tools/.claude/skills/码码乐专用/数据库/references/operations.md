# 数据库操作指南

## 查询 (GET)

**基础URL**: `GET /api/bases/{base_id}/tables/{table}/records`

> [!IMPORTANT]
> `{base_id}` 是动态变量。禁止在代码中 hardcode，必须在调用前获取。

### 分页参数

- `page`: 页码 (默认 1)
- `pageLimit`: 每页数 (最大 100)

### 筛选与排序 (filters)

条件数组需使用 **base64** 编码：`?filters=encodeFilters([...])`

> [!CAUTION]
> **中文字符必须转换为 Unicode 转义序列再 base64 编码！**
> 直接用 `btoa(JSON.stringify(...))` 会导致中文编码错误。必须使用下方的标准编码函数。

**标准编码函数（必须使用）：**

```javascript
function encodeFilters(filters) {
    let jsonStr = JSON.stringify(filters);
    // 中文字符转 Unicode 转义序列
    jsonStr = jsonStr.replace(/[\u0080-\uFFFF]/g, function(match) {
        return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
    });
    return btoa(jsonStr);
}
```

### 操作符

| 操作符 | 示例 |
|--------|------|
| `=` 等于 | `["where", ["age", "=", 18]]` |
| `!=` 不等于 | `["where", ["age", "!=", 18]]` |
| `>`, `>=`, `<`, `<=` | `["where", ["age", ">", 18]]` |
| `in` 在列表中 | `["where", ["status", "in", ["active", "pending"]]]` |
| `notin` 不在列表中 | `["where", ["status", "notin", ["deleted"]]]` |
| `like` 模糊搜索 | `["where", ["name", "like", "%关键词%"]]` |
| `notlike` 不包含 | `["where", ["name", "notlike", "test"]]` |
| 为空 | `["where", ["description", "=", null]]` |
| 不为空 | `["where", ["description", "!=", null]]` |
| `orWhere` 或条件 | `["orWhere", ["name", "like", "%李%"]]` |
| `orderBy` 排序 | `["orderBy", ["id", "desc"]]` |
| `select` 字段选择 | `["select", ["name", "age"]]` |
| `with` 关联 | `["with", ["posts:id,title"]]` |
| `withCount` 关联聚合 | `["withCount", ["posts"]]` |

> [!WARNING]
> **`like` 搜索必须使用 `%` 通配符！**
>
> - ✅ 正确：`["where", ["title", "like", "%搜索词%"]]`
> - ❌ 错误：`["where", ["title", "like", "搜索词"]]`

### 复合条件示例

```javascript
const filters = [
    ["select", ["id", "title"]],
    ["where", ["status", "=", "active"]],
    ["where", ["vote", ">", 10]],
    ["orderBy", ["votes", "desc"]]
];
const encoded = encodeFilters(filters);
fetch(`/api/bases/${baseId}/tables/posts/records?filters=${encoded}`);
```

---

## 增删改

### 创建 (POST)

- 地址: `/api/bases/{base_id}/tables/{table}/records`
- 规则: 直接传字段值，**不需要 `fields` 包裹**。

```json
{ "name": "测试", "age": 25, "is_active": true }
```

### 更新 (PATCH)

- 地址: `.../records/{record_id}`
- 只传要更新的字段。

### 删除 (DELETE)

- 地址: `.../records/{record_id}`
- ⚠️ 删除操作不可逆。

---

## 返回格式

### 列表查询

```json
{
  "current_page": 1,
  "data": [...],
  "per_page": 15,
  "total": 100,
  "last_page": 1,
  "count": 10
}
```

### 单条查询 / 创建 / 更新 / 删除

```json
{
  "id": "11",
  "name": "test",
  "created_by": "usrXXX",
  "updated_by": "usrXXX",
  "created_at": "2024-11-20T17:30:12.000Z",
  "updated_at": "2024-11-20T17:30:27.000Z",
  "creator": { "id": "usrXXX", "email": "...", "name": "..." },
  "modifier": { "id": "usrXXX", "email": "...", "name": "..." }
}
```

### 字段值返回格式

| 类型 | 格式 |
|------|------|
| 文本/数字/布尔 | `"text"`, `123`, `true` |
| 单选 | `"选项1"` |
| 多选 | `["选项1", "选项2"]` |
| 单关联 | `{ "id": "rec123", "name": "..." }` |
| 多关联 | `[{ "id": "rec123", "name": "..." }, ...]` |

> [!NOTE]
> 获取单条记录使用 `GET .../records/{record_id}`。
> 可通过 `?fields=id,name,created_at` 指定返回字段。
