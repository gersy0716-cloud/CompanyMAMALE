# 视频生成

## 接口对比

| 服务 | 类型 | 创建接口 | 查询接口 |
|------|------|---------|---------|
| **AI 即梦** | 文生/图生 | `POST myTextToVideo` | `GET myQuery/{id}` |
| **兔子 Sora** | Sora-2 | `POST asyncDataCreateMy` | `GET asyncDataQueryMy/{id}` |

---

## AI 即梦 (火山引擎)

- **接口**: `POST api/app/aiJimeng3/myTextToVideo`
- **参数**:
  - `model`: `doubao-seedance-1-0-pro-250528`
  - `duration`: 5 / 10s
  - `size`: 16:9, 1:1, 9:16
- **限制**: 10个视频/人/天

---

## 兔子 Sora-2

- **接口**: `POST api/app/tuZi/asyncDataCreateMy`
- **模型**: `sora-2`
- **查询**: 状态包括 `running` (含 progress) 和 `completed`。

> [!WARNING]
> 视频生成为异步任务，需轮询查询接口知道返回视频地址。
