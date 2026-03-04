# 认证与配置

## OAuth服务器

- **地址**: `https://oauth.mamale.vip`
- **作用**: 颁发和验证访问令牌（Token）

---

## 通用请求Headers

```javascript
{
    'Authorization': 'Bearer {token}',
    'Content-Type': 'application/json'
}
```

---

## 基础URL格式

```
https://{type}.mamale.vip/api/app/{endpoint}
```

其中 `{type}` 来自URL参数中的 `type` 值

---

## URL参数配置

> [!IMPORTANT]
>
> - ❌ 不能在代码中默认设置URL参数
> - ✅ URL参数必须由用户在地址栏中提供
> - ⚠️ 没有URL参数则无权限访问

| 参数名 | 说明 | 格式 |
|:-------|:-----|:-----|
| `type` | 租户英文名称 | 例如：jj4x-api |
| `tenant` | 租户ID | UUID格式 |
| `author` | 用户中文名 | URL编码 |
| `userid` | 用户在该租户下的ID | UUID格式 |
| `username` | 用户的中文名字 | URL编码 |
| `token` | 学生访问令牌 | JWT格式 |
| `teachertoken` | 教师令牌 | 可选，JWT格式 |

**使用示例**:

```
file:///path/to/index.html?type=3w-api&tenant=xxx&token=xxx
```

---

## 响应格式

API响应可能有两种格式：

### 格式1：直接返回数组

```javascript
[
    { id: 1, name: "数据1" },
    { id: 2, name: "数据2" }
]
```

### 格式2：包装在对象中

```javascript
{
    "totalCount": 10,
    "items": [
        { id: 1, name: "数据1" },
        { id: 2, name: "数据2" }
    ]
}
```

### 兼容处理

```javascript
const data = Array.isArray(response) ? response : response.items;
```
