# 错误处理与调试

## CORS 跨域问题

> [!CAUTION]
> BaseMulti API 的 CORS 策略**不允许 PATCH 方法**，直接在浏览器中发起 PATCH 请求会被拦截。

### 解决方案：Allow CORS 浏览器扩展

1. 安装 Chrome 扩展 **Allow CORS**
2. 右键图标 → 选项 → Open options page
3. 配置 `Access-Control-Allow-Methods`：填入 `PUT, GET, HEAD, POST, DELETE, OPTIONS, PATCH`
4. 在 "Allow CORS whitelisted domain(s)" 中填入 `data.520ai.cc`

> [!IMPORTANT]
> 代码中直接使用 `PATCH` 方法即可（`database.js` 中的 `update()` 方法），CORS 问题由扩展处理。

---

## 字段创建常见陷阱

> [!WARNING]
> 以下是已验证的数据库字段创建规则，违反会导致难以排查的 Bug。

### 1. 字段类型创建后不可更改

字段类型在**创建时确定**，创建成功后修改类型**不会生效**。如需更改类型，必须**删除字段后重新创建**。

### 2. 排序/数量相关字段必须用 Number

涉及排序、计数、数量的字段必须选择 **Number** 类型。使用 Single Line Text 存数字会导致排序失效（按字符串排序而非数值排序）。

### 3. 文本长度选型

| 场景 | 推荐类型 |
| :--- | :--- |
| 短文本（名称、标题） | **Single Line Text** |
| 中文本（简介、描述） | **Long Text** |
| 长文本（文章、富文本） | 上传文件到平台接口，**存储返回的 URL** |

### 4. 字段名前方不能有空格

复制字段名时**务必检查前方有没有多余空格**，否则 API 查询会匹配不到字段。

---

## HTTP 错误处理

### 状态码参考

| 码 | 含义 | 处理 |
|---|------|------|
| 401 | 认证失败 | 检查 x-bm-token |
| 404 | 不存在 | 检查表名或记录ID |
| 400 | 参数错误 | 检查 filters 编码或请求体 |
| 500 | 服务器错误 | 稍后重试 |

### 统一检查逻辑

```javascript
if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
}
```

---

## 调试技巧

### 标准日志

- 📥 `[Database] 查询 - 表: {table}`
- ✅ `[Database] 成功 - 共 {count} 条`
- ❌ `[Database] 失败: {error}`

### 常用辅助函数

- **字段过滤**: `delete data.id; delete data.created_at;` (更新前必做)
- **响应验证**: 检查 `response.data` 是否存在。
- **连接测试**: 调用小型表（如 configs）验证 API Key 有效性。

---

## 最佳实践清单

1. [ ] 必须检查 `response.ok`。
2. [ ] 必须使用 `try-catch` 包裹 API 调用。
3. [ ] 更新前必须移除系统自动生成的字段（id, created_at 等）。
4. [ ] 复杂查询务必检查 `filters` 的 base64 编码逻辑。
5. [ ] 实现简单的重试机制（指数退避）。
6. [ ] 开发环境需安装 Allow CORS 扩展并配置白名单。
