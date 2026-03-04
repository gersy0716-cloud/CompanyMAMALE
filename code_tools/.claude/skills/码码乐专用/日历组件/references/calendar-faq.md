# 日历组件开发常见问题 (FAQ)

## 1. 全局函数命名冲突

多模块共存时，简单的全局函数名极其容易发生覆盖。

- **❌ 风险**：`isHoliday()` 在 `calendar.js` 和 `duty-calendar.js` 中同时定义。
- **✅ 方案**：使用具体的模块前缀。
  - `configIsHoliday()` (配置日历)
  - `dutyIsHoliday()` (值日日历)

## 2. 日期格式解析一致性

避免 API 返回的简写（如 `"1-1"`）与代码内部格式（如 `"01-01"`）不一致导致的查找失败。

- **✅ 规范**：全站统一使用 `"MM-DD"`。
- **工具代码**：

  ```javascript
  const formatKey = (dateStr) => {
      const [m, d] = dateStr.split('-');
      return `${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };
  ```

## 3. 跨模块状态干扰

不同组件（如基础日历与排班日历）应严格使用独立的状态对象（State Objects），严禁在同名全局变量上读写。

## 4. Date 构造函数的 "null" 陷阱

`new Date(null, 8, 1)` 会意外回退到 **1900年9月1日**。

- **✅ 修复**：在实例化 Date 前必须进行显式的年份合法性检查。

## 5. 极速渲染技巧

日历涉及大量 DOM 节点（如 365+ 天）。

- **✅ 方案**：使用 `DocumentFragment` 批量离线构建 DOM。
- **效果**：将 365 次 DOM 插入减少为 1 次，大幅提升初始化性能。
