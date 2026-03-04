---
name: 工作流程图生成
description: 根据项目架构和代码自动生成标准化 Mermaid 工作流程图文档
---

# 工作流程图生成技能

> 为项目生成完整的 Mermaid 工作流程图文档，输出到项目的 `docs/工作流程图.md`。

---

## 输出规范

每个工作流程图文档应包含以下 **7 类图表**（按需取用，至少包含前 3 类）：

### 1. 主流程图 (flowchart TD)

**必选**。展示应用从启动到各功能模块的完整导航路径。

```mermaid
flowchart TD
    Start([启动]) --> Step1[第一步]
    Step1 --> Decision{判断}
    Decision --> |条件A| ModuleA[模块A]
    Decision --> |条件B| ModuleB[模块B]

    ModuleA --> SubA1[子功能1]
    ModuleA --> SubA2[子功能2]

    style Start fill:#e1f5e1
    style ModuleA fill:#e1f5ff
    style ModuleB fill:#f5e1ff
```

**要求**：

- 从应用入口开始，覆盖所有主要功能模块
- 使用圆角矩形 `([...])` 标记起止点
- 使用菱形 `{...}` 标记分支判断
- 每个关键节点用 `style` 着色区分
- 模块名称使用 emoji 前缀增强可读性

### 2. 核心流程详细图 (flowchart TD)

**必选**。选取 1-3 个核心业务流程，展开详细步骤。

```mermaid
flowchart TD
    Start([开始]) --> Input[用户输入]
    Input --> Validate{校验}
    Validate --> |通过| Process[处理]
    Validate --> |失败| Error[错误提示]
    Process --> API[调用API]
    API --> Save[保存数据]
    Save --> Refresh[刷新页面]
    Refresh --> End([完成])

    style Start fill:#e1f5e1
    style End fill:#e1e5ff
    style Error fill:#ffe1e1
```

**要求**：

- 包含用户操作、系统处理、API 调用、错误处理各环节
- 使用 `<br/>` 在节点内换行补充说明

### 3. 数据库表关系图 (erDiagram)

**必选**（有数据库时）。展示所有数据表的字段和关联关系。

```mermaid
erDiagram
    TableA ||--o{ TableB : "关联"
    TableA {
        string id PK
        string name "名称"
        string field FK "外键字段"
    }
    TableB {
        string id PK
        text content "内容"
    }
```

**要求**：

- 列出每张表的关键字段（类型 + 名称 + 备注）
- 标注 PK/FK 关系
- 使用 `||--o{`、`}o--o{` 等标记一对多、多对多

### 4. API 调用时序图 (sequenceDiagram)

**推荐**。展示前后端、第三方服务之间的调用时序。

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant API as 后端API
    participant DB as 数据库

    U->>F: 用户操作
    F->>API: 发送请求
    API->>DB: 查询/写入
    DB-->>API: 返回结果
    API-->>F: 返回响应
    F->>F: 更新UI
```

**要求**：

- 使用 `Note over` 分隔不同业务场景
- 使用 `alt/loop` 展示条件/循环逻辑
- 标注关键的 HTTP 方法和路径

### 5. 状态机图 (stateDiagram-v2)

**推荐**。展示应用或业务实体的状态流转。

```mermaid
stateDiagram-v2
    [*] --> 初始状态
    初始状态 --> 状态A: 触发条件
    状态A --> 状态B: 操作
    状态B --> [*]: 完成

    note right of 状态A
        补充说明
    end note
```

### 6. 架构图 (flowchart LR)

**推荐**。展示系统分层架构和模块依赖。

```mermaid
flowchart LR
    subgraph Layer1["表现层"]
        UI[界面组件]
    end
    subgraph Layer2["业务层"]
        Logic[业务逻辑]
    end
    subgraph Layer3["数据层"]
        DB[(数据库)]
    end
    UI --> Logic --> DB

    style Layer1 fill:#e1f5ff
    style Layer2 fill:#fff4e1
    style Layer3 fill:#f5e1ff
```

### 7. 特定模块详细流程

**可选**。针对复杂模块单独画详细流程。

---

## 配色规范

| 用途 | 颜色 | 示例 |
| :--- | :--- | :--- |
| 起始节点 | `#e1f5e1` | 浅绿 |
| 结束节点 | `#ffe1e1` | 浅红 |
| 主要模块 | `#e1e5ff` | 浅蓝紫 |
| 输入/表单 | `#fff4e1` | 浅橙 |
| 处理/逻辑 | `#e1f5ff` | 浅天蓝 |
| 存储/数据 | `#f5e1ff` | 浅紫 |
| 成功状态 | `#e1ffe1` | 浅绿 |
| 通用模块 | `#e1ffe5` | 浅薄荷 |

## 生成步骤

1. **读取项目架构文档**（如 `docs/architecture.md`、`README.md`）
2. **扫描代码结构**（路由、模块、数据库表定义）
3. **识别核心业务流程**（登录、CRUD、文件上传等）
4. **按 7 类图表逐一生成**，确保与代码逻辑一致
5. **输出到 `docs/工作流程图.md`**

## 参考示例

- [AI备课工具 工作流程图](../../../已完成项目/ai备课工具/工作流程图.md)
- [公司管理 工作流程图](../../../待完成项目/公司管理1.0.3/docs/工作流程图.md)
