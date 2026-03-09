# 视频生成

## 接口对比

| 服务 | 类型 | 创建接口 | 查询接口 |
|------|------|---------|---------|
| **AI 即梦** | 文生/图生 | `POST myTextToVideo` / `myImageToVideo` | `GET myQuery/{id}` |
| **兔子 Sora** | Sora-2 | `POST asyncDataCreateMy` | `GET asyncDataQueryMy/{id}` |

---

## AI 即梦 (火山引擎)

- **文生视频接口**: `POST api/app/aiJimeng/myTextToVideo`
  - **示例参数**:

    ```json
    {
      "prompt": "蓝色毛绒玩具在超市里拖地...",
      "seed": -1,
      "size": "9:16"
    }
    ```

- **图生视频接口**: `POST api/app/aiJimeng/myImageToVideo`
  - **示例参数**:

    ```json
    {
      "prompt": "桌子上的食物热腾腾的...",
      "seed": -1,
      "size": "3:4",
      "imageUrls": [
        "https://..."
      ]
    }
    ```

- **返回任务视频**: `GET api/app/aiJimeng/myQuery/【视频任务Id】`

> [!WARNING]
> 视频生成为异步任务，需轮询查询接口获取任务状态及视频地址。

---

## 兔子 Sora-2

- **接口**: `POST api/app/tuZi/asyncDataCreateMy`
- **模型**: `sora-2`
- **查询**: 状态包括 `running` (含 progress) 和 `completed`。
