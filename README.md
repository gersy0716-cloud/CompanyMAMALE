# CompanyMAMALE 项目使用说明

本项目的本地目录与 GitHub 仓库已成功关联。本案档旨在说明如何进行日常的代码管理和同步。

## 📋 基本信息

- **本地路径**: `e:\worklwb`
- **GitHub 仓库**: [CompanyMAMALE](https://github.com/gersy0716-cloud/CompanyMAMALE)
- **主分支**: `main`

## 🚀 常用操作流程

### 1. 修改代码并上传 (Push)

当你在本地 `e:\worklwb` 中修改或新增了文件，请执行以下命令：

```powershell
# 1. 查看修改状态
git status

# 2. 将所有修改添加到暂存区
git add .

# 3. 提交修改并添加备注
git commit -m "这里写你的修改描述"

# 4. 推送到 GitHub
git push origin main
```

### 2. 获取远程更新 (Pull)

如果你在其他地方修改了代码，或者想要同步远程仓库的最新改动：

```powershell
git pull origin main
```

### 3. 查看版本记录

```powershell
git log --oneline
```

## ⚠️ 注意事项

- **身份验证**: 第一次推送时，Git 会弹出浏览器要求你登录 GitHub。请按提示操作完成认证。
- **忽略文件**: 如果有不需要上传的文件（如 `node_modules`、环境变量等），请确保它们记录在 `.gitignore` 文件中。
- **冲突处理**: 如果多人同时修改了同一个文件，`git pull` 时可能会产生冲突。如有需要，我可以协助你处理冲突。

---
*Created by Antigravity*
