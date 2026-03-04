# 学生信息管理系统

一个现代化的学生信息管理系统，支持通过URL参数传递认证信息，并从API获取学生数据进行展示。

## ✨ 功能特性

- 🔐 **URL参数授权**: 通过URL参数传递认证信息
- 🎯 **Tab分类显示**: 支持全部学生、活跃学生、非活跃学生三种视图
- 🔍 **搜索功能**: 实时搜索学生姓名和学号
- 📊 **统计展示**: 显示学生总数、活跃数、非活跃数
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- 🎨 **现代UI设计**: 深色主题 + 玻璃态效果 + 流畅动画

## 📋 URL参数说明

系统通过以下URL参数接收认证和用户信息：

| 参数名 | 说明 | 是否必需 |
|--------|------|----------|
| `type` | 租户英文名称 | 是 |
| `tenant` | 租户ID | 是 |
| `author` | 用户中文名 | 是 |
| `userid` | 用户在该租户下的ID | 是 |
| `username` | 用户的中文名字 | 是 |
| `token` | 学生Token | 是 |
| `teachertoken` | 教师Token（仅教师有） | 是 |

### URL示例

```
index.html?type=jj4x-api&tenant=c1863285-25d1-44fe-805c-5ddf611f83d3&author=官方&userid=c45eda39-6b24-5b82-0646-3a1e90ad2a1c&username=罗文彬&token=eyJhbGci...&teachertoken=teacher_token_123
```

## 🚀 快速开始

### 方法1: 使用测试启动器

1. 在浏览器中打开 `test-launcher.html`
2. 填写所有必需参数（已预填示例数据）
3. 点击"启动系统"按钮

### 方法2: 直接访问带参数的URL

直接访问包含所有必需参数的URL：

```
index.html?type=jj4x-api&tenant=[你的租户ID]&author=[作者名]&userid=[用户ID]&username=[用户名]&token=[你的token]&teachertoken=[教师token]
```

## 🔒 授权机制

- 系统启动时会检查 `teachertoken` 参数
- 如果 `teachertoken` 不存在或为空，系统会显示"访问未授权"页面
- 只有提供有效的 `teachertoken` 才能访问系统

## 🌐 API配置

系统调用以下API获取学生数据：

- **API地址**: `https://jj4x-api.mamale.vip/api/app/student`
- **请求方法**: GET
- **认证方式**: Bearer Token (使用URL参数中的 `token`)
- **请求头**:

  ```javascript
  {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
  ```

## 📁 项目结构

```
连接2/
├── index.html           # 主页面
├── script.js           # JavaScript逻辑
├── styles.css          # 样式文件
├── test-launcher.html  # 测试启动器
└── README.md          # 项目文档
```

## 🎯 核心功能说明

### 1. 参数存储

页面加载时自动解析URL参数并存储到全局变量 `globalParams` 中：

```javascript
const globalParams = {
    type: '',
    tenant: '',
    author: '',
    userid: '',
    username: '',
    token: '',
    teachertoken: ''
};
```

### 2. 授权检查

通过检查 `teachertoken` 来验证用户权限：

```javascript
if (!globalParams.teachertoken || globalParams.teachertoken === 'null') {
    // 显示未授权页面
}
```

### 3. 数据获取

使用 Fetch API 获取学生数据：

```javascript
fetch('https://jj4x-api.mamale.vip/api/app/student', {
    headers: {
        'Authorization': `Bearer ${globalParams.token}`
    }
})
```

### 4. Tab分类

支持三种视图模式：

- **全部学生**: 显示所有学生
- **活跃学生**: 筛选 `status === 'active'` 或 `isActive === true` 的学生
- **非活跃学生**: 筛选其他学生

### 5. 搜索功能

实时搜索学生姓名和学号，支持模糊匹配。

## 🎨 设计特色

- **深色主题**: 舒适的深色配色方案
- **玻璃态效果**: 现代化的半透明背景
- **渐变色彩**: 丰富的渐变色应用
- **流畅动画**: 各种交互动画效果
- **响应式布局**: 适配手机、平板、桌面

## 📝 API数据格式

系统支持以下API返回格式：

```javascript
// 格式1: 直接返回数组
[
    {
        id: "1",
        studentId: "S001",
        name: "张三",
        class: "一年级1班",
        grade: "一年级",
        status: "active",
        phone: "13800138000",
        email: "zhangsan@example.com"
    },
    // ...
]

// 格式2: 包含items属性
{
    items: [...],
    totalCount: 100
}

// 格式3: 包含data属性
{
    data: [...],
    total: 100
}
```

## 🔧 自定义配置

### 修改API地址

编辑 `script.js` 中的 `API_CONFIG` 对象：

```javascript
const API_CONFIG = {
    baseURL: 'https://your-api-domain.com/api/app/student',
    headers: {
        'Content-Type': 'application/json'
    }
};
```

### 修改字段映射

如果API返回的字段名与系统不同，可在 `renderStudentTable()` 函数中修改字段映射。

## 🐛 调试

系统在控制台输出关键信息：

- URL参数加载情况
- API请求和响应数据
- 错误信息

打开浏览器开发者工具的控制台查看这些信息。

## ⚠️ 注意事项

1. **CORS问题**: 如果遇到跨域问题，需要确保API服务器配置了正确的CORS头
2. **Token有效性**: 确保提供的token有效且未过期
3. **参数编码**: URL参数会自动进行URL编码/解码处理
4. **API数据结构**: 系统已适配多种常见的API返回格式，如需其他格式请修改代码

## 📱 浏览器兼容性

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ⚠️ IE 11 (部分功能可能不支持)

## 📧 技术支持

如有问题，请检查：

1. URL参数是否完整且正确
2. Token是否有效
3. API地址是否可访问
4. 浏览器控制台是否有错误信息

---

**开发时间**: 2026-01-05  
**版本**: 1.0.0
