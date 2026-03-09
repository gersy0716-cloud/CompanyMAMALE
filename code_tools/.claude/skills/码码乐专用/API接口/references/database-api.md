# 在线数据库API信息 (BaseMulti)

**地址**: `https://data.520ai.cc`
**API Key (Token)**: 需要根据具体项目替换 (如 `Llr...`)
**数据库 ID (Base ID)**: 需要根据具体项目替换 (如 `bset...`)
**数据表 ID (Table ID)**: 需要根据具体项目替换 (如 `syOD...`)

---

## 获取信息列表 API

**接口说明**: 获取表格中的记录列表，支持分页、排序和筛选。
**请求方法**: `GET /api/bases/{base_id}/tables/{table_name}/records`

### 请求头

- `x-bm-token`: your_api_token

### 路径参数

- `base_id` (string): 数据库 ID
- `table_name` (string): 表格名称

### 查询参数

- `page` (number): 页码，默认为 1
- `pageLimit` (number): 每页记录数，默认为 15
- `filters` (string): 筛选条件 (Base64编码后的JSON数组)

### 筛选条件 (filters)

筛选条件是一段把条件数组使用 `base64` 编码后的字符串。 每个条件包含两个元素：操作符和操作对象。

**操作符**:

- `where`: 添加筛选条件
- `orderBy`: 添加排序条件
- `select`: 添加字段选择
- `with`: 添加关联字段
- `withCount`: 添加关联聚合

**操作对象 (where)**:

- `"="` 等于 `["where", ["age", "=", 18]]`
- `"!="` 不等于 `["where", ["age", "!=", 18]]`
- `">"` 大于 `["where", ["age", ">", 18]]`
- `">="` 大于等于 `["where", ["age", ">=", 18]]`
- `"<"` 小于 `["where", ["age", "<", 18]]`
- `"<="` 小于等于 `["where", ["age", "<=", 18]]`
- `"in"` 在列表中 `["where", ["status", "in", ["active", "pending"]]]`
- `"notin"` 不在列表中 `["where", ["status", "notin", ["deleted"]]]`
- `"like"` 包含 `["where", ["name", "like", "%test%"]]`
- `"notlike"` 不包含 `["where", ["name", "notlike", "test"]]`
- `"isNull"` 为空 `["where", ["description", "=", null]]`
- `"isNotNull"` 不为空 `["where", ["description", "!=", null]]`

> [!IMPORTANT]
> **Like 模糊搜索规则**
>
> 1. 使用 `like` 操作符进行模糊搜索时，**必须**在搜索值前后添加 `%` 通配符。
>    ✅ 正确：`filters.push(['where', ['title', 'like', \`%${params.searchName}%\`]])`
>    ❌ 错误：`filters.push(['where', ['title', 'like', params.searchName]])`
>
> **中文字符编码规则**
> 2. 所有传递给 BaseMulti API、包含中文字符的 `filters` 数据，**必须**先转换为 Unicode 转义序列，再进行 Base64 编码。
> 必须使用以下标准编码函数处理 filters：
>
> ```javascript
> export const encodeFilters = (filters) => {
>   let jsonStr = JSON.stringify(filters)
>   jsonStr = jsonStr.replace(/[\u0080-\uFFFF]/g, function(match) {
>     return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4)
>   })
>   return btoa(jsonStr)
> }
>    ```

---

## 创建数据 API

**接口说明**: 在指定表格中创建一条新记录。
**请求方法**: `POST /api/bases/{base_id}/tables/{table_name}/records`

### 请求头

- `x-bm-token`: your_api_token
- `Content-Type`: application/json

### 请求体 (JSON)

直接传递字段和值的主键值对，不需要嵌套在 `fields` 或 `data` 对象中 (除非具体平台有特殊嵌套要求)。

```json
{
  "field_name1": "value1",
  "field_name2": 123
}
```

---

## 更新数据 API

**接口说明**: 更新表格中指定记录的字段值。
**请求方法**: `PATCH /api/bases/{base_id}/tables/{table_name}/records/{record_id}`

### 请求头

同上

### 请求体 (JSON)

需要更新的字段和值。

```json
{
  "field_name1": "new_value1"
}
```

---

## 最佳实践与避坑指南

1. **字段类型**: 创建字段的时候要注意选类型，创建成功后再去进行改类型是没有生效的，只能删除字段进行重新建。
2. **数字类型**: 排序、有关数量的必须使用 `Number` 类型，否则后期排序无效。
3. **字段长度限制**:
   - 短文本字段（如名称）：使用 `Single Line Text`
   - 中文本字段（如简介）：使用 `Long Text`
   - 长文本字段（如文章内容）：建议上传文件到平台接口，然后将返回的 URL 存储到字段中。
4. **字段名检查**: 创建字段名时，注意检查前方是否有空格。
5. **多租户数据分离**: 在数据表增加 `type` 字段（全局变量），并在所有 `where` 筛选和创建数据时带上该 `type` 值。
6. **管理后台权限**:
   - 如果用固定密码，不同租户密码统一但数据分离，缺点是所有人都能看到入口。
   - 建立管理账号表（`userid`, `tenantid`），点击入口时调用 API 校验是否有权限。
7. **CORS 跨域配置**: 开发时使用 Chrome 插件 "Allow CORS"，将 `data.520ai.cc` 加入白名单，允许 `PUT, GET, HEAD, POST, DELETE, OPTIONS, PATCH` 方法。
