# 520AI网站爬虫工具集

## 项目简介

本工具集包含了针对520AI网站的多个爬虫脚本，用于获取网站上的各类AI应用和模型信息。

## 📁 目录结构

```
crawlers/
├── app_agents/          # 应用智能体爬虫
│   ├── crawl_520ai.py
│   ├── crawl_api.py
│   ├── analyze_network.py
│   └── check_api_response.py
├── chat_agents/         # 对话智能体爬虫
│   ├── crawl_ai_names.py
│   └── analyze_new_page.py
├── api_data/            # 共享API数据目录
├── count_lines.py       # 通用工具
└── README.md
```

---

## 🤖 应用智能体爬虫 (app_agents)

### 1. `crawl_520ai.py`
**用途**：爬取520AI网站上的AI应用信息
**目标网站**：`https://www.520ai.cc/ai/#/composite/app`
**功能**：
- 使用Playwright自动化浏览器
- 模拟点击"更多"按钮加载所有内容
- 提取每个应用的标题(`content`)和作者(`author`)
- 将结果保存为CSV文件

### 2. `crawl_api.py`
**用途**：直接调用API获取AI应用信息
**目标API**：`https://3w-api.mamale.vip/api/app/aiApplication/public`
**功能**：
- 绕过浏览器直接调用后端API
- 支持分页获取所有数据
- 高效获取1400+条应用信息
- 将结果保存为CSV文件

### 3. `analyze_network.py`
**用途**：分析应用页面网络请求，发现API接口
**功能**：
- 使用Playwright监听网站网络请求
- 识别关键API接口和请求参数
- 分析请求和响应数据结构
- 帮助开发更高效的爬虫脚本

### 4. `check_api_response.py`
**用途**：检查应用API响应数据结构
**功能**：
- 发送API请求并查看完整响应
- 保存API响应到JSON文件（根目录`api_data`）
- 分析数据结构和字段含义
- 验证数据完整性

---

## 💬 对话智能体爬虫 (chat_agents)

### 1. `crawl_ai_names.py`
**用途**：爬取AI分类和模型信息，生成带层级的名称
**目标API**：`https://3w-api.mamale.vip/api/app/aiSetCategory/public`
**功能**：
- 获取AI分类和模型的`name`字段
- 生成`fullName`字段，如"对话-国内大模型"
- 支持多级分类层级
- 将结果保存为CSV文件

### 2. `analyze_new_page.py`
**用途**：分析对话页面结构和API
**目标网站**：`https://www.520ai.cc/ai/#/ai-set/process`
**功能**：
- 模拟用户登录过程
- 监听登录后的网络请求
- 提取API响应数据
- 分析页面数据加载机制

---

## 🛠️ 通用工具

### `count_lines.py`
**用途**：验证CSV文件行数
**功能**：
- 计算CSV文件的总行数
- 验证数据完整性
- 检查记录数是否符合预期

### `api_data/` 目录
**用途**：存放两个板块共享的API调试数据
**内容**：
- API接口响应数据
- 网络请求记录
- 页面加载过程中的各类数据
- 用于调试和数据分析

## 安装依赖

### 基础依赖
```bash
pip install requests csv
```

### Playwright依赖（仅`crawl_520ai.py`需要）
```bash
pip install playwright
playwright install
```

## 使用方法

### 运行单个脚本
```bash
cd crawlers
python crawl_ai_names.py
```

### 脚本输出
- 所有脚本都会在当前目录生成CSV文件
- CSV文件使用UTF-8编码，包含BOM头(utf-8-sig)
- 文件包含详细的数据字段和表头

## 数据格式

### `crawl_520ai.py`和`crawl_api.py`输出格式
```csv
title,author
第一章第三节地球的运动-地球公转运动模拟演示,官方
...
```

### `crawl_ai_names.py`输出格式
```csv
name,fullName
国内大模型,对话-国内大模型
文心一言大模型,对话-国内大模型-文心一言大模型
...
```

## 注意事项

1. 请遵守网站的爬虫规则，不要频繁请求
2. API可能会随时更改，如有问题请检查API响应格式
3. 如需修改爬取参数，请在脚本中查找相关配置项
4. 建议使用虚拟环境运行脚本

## 版本历史

- v1.0: 初始版本，包含基础爬虫功能
- v1.1: 增加API直接调用功能，提高爬取效率
- v1.2: 增加带层级的name和fullName字段支持