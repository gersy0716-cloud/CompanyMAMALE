# 文件上传

**地址**: `POST /api/fileResouceItem/uploadUnified`
**Content-Type**: `multipart/form-data`

---

## 使用前提（每次调用必须具备）

| 信息 | 来源 | 说明 |
|------|------|------|
| `token` | URL 参数 `token` | 需 `decodeURIComponent` 解码 |
| `type` | URL 参数 `type` | 需 `decodeURIComponent` 解码，用于拼接 BaseURL |
| `file` | 用户选择的文件 | 通过 `<input type="file">` 等方式获取 |

**BaseURL 拼接规则**：

```javascript
const type = decodeURIComponent(urlParams.get('type'));   // 例如: xxx-api
const token = decodeURIComponent(urlParams.get('token'));
const baseURL = `https://${type}.520ai.cc/`;
```

---

## 请求示例

```javascript
const formData = new FormData();
formData.append('formFile', file);  // ⚠️ 字段名必须是 formFile

fetch(`${baseURL}api/fileResouceItem/uploadUnified`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },  // ⚠️ 必须携带
    body: formData
});
```

> [!IMPORTANT]
> - 字段名**必须**是 `formFile`
> - Authorization 格式：`'Bearer ' + token`（Bearer 后有一个空格）
> - 不要手动设置 Content-Type，浏览器会自动添加 multipart boundary

---

## 返回结构

```json
{
    "tenantId": "a75dedae-cf17-8379-d57d-39f368688fc7",
    "name": "720efed7-d368-4192-ac37-2ad33c166e4b.png",
    "url": "https://s.mamale.vip/2026/01/15/47b1f2fa6a118aa216273a1ed17e99ab.png",
    "type": 7,
    "size": 26554,
    "ext": ".png",
    "storageMode": 0,
    "resouceGroup": null,
    "htmlPath": null,
    "htmlUrl": null,
    "extraProperties": {},
    "lastModificationTime": null,
    "lastModifierId": null,
    "creationTime": "2026-01-15 09:42:45",
    "creatorId": "222a1aff-086a-5f12-551a-3a00a0168cae",
    "id": "4c5e2bad-e220-401f-81e1-5612ef49f87b"
}
```

主要使用 `url` 字段获取文件访问地址
