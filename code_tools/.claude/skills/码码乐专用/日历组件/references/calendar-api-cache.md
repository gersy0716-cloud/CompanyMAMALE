# 节假日 API 获取与缓存机制

## 数据源方案

**API 地址**：`http://timor.tech/api/holiday/year/{year}`

## 缓存与超时控制逻辑

```javascript
/**
 * 24小时本地缓存策略 + 5秒强超时控制
 */
const CACHE_KEY = `holiday_${year}`;
const cached = localStorage.getItem(CACHE_KEY);

if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data; // 有效期内，直接返回
    }
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
    const response = await fetch(url, { signal: controller.signal });
    const result = await response.json();
    // 存储时带上时间戳
    localStorage.setItem(CACHE_KEY, JSON.stringify({ 
        data: result, 
        timestamp: Date.now() 
    }));
    clearTimeout(timeout);
} catch (err) {
    if (err.name === 'AbortError') {
        process.error('节假日 API 获取超时');
    }
}
```

## 业务呈现逻辑

- **状态管理**：首次获取成功后，建议同步至 `APP_STATE` 或模块内部状态对象，减少频繁读取 `localStorage`。
- **视觉规范**：
  - 节假日：使用真假期背景色（通常为红色）。
  - 调休补班：使用特定补班背景色（通常为橙色）。
  - 区分依据：利用 API 返回对象中的 `holiday` 字段。

## 跨年学年加载

当学年（如 2024-2025）跨越两个日历年时，必须并行加载两年的数据：

```javascript
await Promise.all([
    fetchHolidaysForYear(2024),
    fetchHolidaysForYear(2025)
]);
```
