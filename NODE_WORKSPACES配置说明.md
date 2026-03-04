# Node.js 统一工作区配置说明

## 概述

已成功配置npm workspaces，将所有项目的Node.js依赖统一管理在根目录的`node_modules`中，避免每个项目都维护独立的依赖文件夹。

## 目录结构

```
d:\编程\work_for_mamale/
├── node_modules/          # 统一的依赖管理（所有项目共享）
├── package.json           # 根目录工作区配置
├── 项目/
│   ├── 已完成项目/
│   │   ├── ai备课工具/
│   │   ├── 公司管理1.0.1/
│   │   ├── 公司管理1.0.2/
│   │   └── 班级值日表-1.0/
│   └── 待完成项目/
│       ├── 公司管理1.0.3/
│       └── 生成漫画/
```

## 主要优势

1. **节省磁盘空间** - 避免重复安装相同的依赖包
2. **统一版本管理** - 所有项目共享相同版本的依赖
3. **简化维护** - 只需在根目录进行一次依赖更新
4. **提升安装速度** - 减少重复下载和安装时间
5. **更好的依赖管理** - 清晰的依赖关系和版本控制

## 使用方法

### 1. 安装依赖

在根目录运行一次安装命令即可：

```bash
npm install
```

这会自动为所有workspace中的项目安装依赖。

### 2. 添加新依赖

#### 为根目录添加依赖（所有项目可用）：
```bash
npm install <package-name> --save
```

#### 为特定项目添加依赖：
```bash
npm install <package-name> -w <项目名称>
```

例如：
```bash
npm install axios -w gemini-ppt-workbench
```

### 3. 运行项目脚本

在根目录运行特定项目的脚本：
```bash
npm run <script-name> -w <项目名称>
```

例如：
```bash
npm run dev -w gemini-ppt-workbench
```

或者直接进入项目目录运行：
```bash
cd 项目/已完成项目/ai备课工具
npm run dev
```

### 4. 更新依赖

更新所有项目的依赖：
```bash
npm update
```

更新特定项目的依赖：
```bash
npm update -w <项目名称>
```

### 5. 清理依赖

清理所有项目的node_modules并重新安装：
```bash
npm run clean:node_modules
```

### 6. 查看已安装的包

查看根目录安装的包：
```bash
npm run list:packages
```

## 可用的npm脚本

根目录`package.json`中提供了以下便捷脚本：

- `npm run install:all` - 安装所有依赖
- `npm run clean:node_modules` - 清理所有node_modules并重新安装
- `npm run clean:node_modules:projects` - 仅清理项目下的node_modules
- `npm run update:all` - 更新所有依赖
- `npm run audit:all` - 检查所有依赖的安全漏洞
- `npm run list:packages` - 列出所有已安装的包

## 当前工作区项目

以下项目已包含在workspaces中：

1. **gemini-ppt-workbench** (ai备课工具)
   - 路径: `项目/已完成项目/ai备课工具`
   - 主要依赖: React, Vite, OpenAI, TailwindCSS

2. **mamale-desktop-v1.0.1** (公司管理1.0.1)
   - 路径: `项目/已完成项目/公司管理1.0.1`
   - 主要依赖: Electron, Electron Builder

3. **mamale-desktop-v1.0.2** (公司管理1.0.2)
   - 路径: `项目/已完成项目/公司管理1.0.2`
   - 主要依赖: Electron, Electron Builder

4. **mamale-desktop-v1.0.3** (公司管理1.0.3)
   - 路径: `项目/待完成项目/公司管理1.0.3`
   - 主要依赖: Electron, Electron Builder

5. **class-duty-schedule** (班级值日表-1.0)
   - 路径: `项目/已完成项目/班级值日表-1.0`
   - 主要依赖: Vite

## 依赖去重

npm workspaces会自动去重相同的依赖。例如：
- `vite`、`typescript`、`tailwindcss`等公共依赖只在根目录安装一次
- 各项目可以共享这些依赖，无需重复安装

## 注意事项

1. **不要手动删除根目录的node_modules** - 这会影响所有项目
2. **各项目的node_modules已被忽略** - 通过.gitignore配置，不会提交到Git
3. **项目名称必须唯一** - 已为重复命名的项目添加版本后缀
4. **Node.js版本要求** - Node.js >= 18.0.0, npm >= 9.0.0

## 故障排除

### 问题：找不到模块
```bash
# 重新安装依赖
npm install
```

### 问题：依赖冲突
```bash
# 清理并重新安装
npm run clean:node_modules
```

### 问题：workspaces不生效
```bash
# 检查package.json中的workspaces配置
cat package.json
```

## 迁移说明

如果您有新项目要添加到workspaces：

1. 将项目放入`项目/`目录下的适当子目录
2. 确保项目有自己的`package.json`
3. 确保项目名称唯一
4. 在根目录运行`npm install`

## 总结

通过npm workspaces统一管理Node.js依赖，我们实现了：
- ✅ 集中的依赖管理
- ✅ 节省磁盘空间
- ✅ 简化的维护流程
- ✅ 更好的版本控制
- ✅ 统一的依赖更新

所有项目的Node.js环境现在都通过根目录的`package.json`统一管理，无需在每个项目中维护独立的`node_modules`文件夹。