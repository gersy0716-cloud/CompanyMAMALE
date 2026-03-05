# 码码乐统一工作区 (Mamale Unified Workspace)

本项目采用了 **Node.js Workspaces** 架构，旨在集中管理码码乐旗下的所有子项目。通过统一的依赖管理，显著减少了磁盘占用并简化了跨项目的开发流程。

## 📋 基本信息

- **项目主路径**: `e:\worklwb`
- **GitHub 仓库**: [CompanyMAMALE](https://github.com/gersy0716-cloud/CompanyMAMALE)
- **技术栈**: React, Vite, Electron, TypeScript, TailwindCSS

---

## � 项目结构

工作区下包含多个核心模块，分别存放在 `项目/` 目录下：

### 1. 公司管理 (Company Management)

- **路径**: `项目/已完成项目/公司管理*`
- **说明**: 基于 Electron 开发的内部协作管理平台。
- **状态**: 已完成安全加固，运行在 Electron 40+ 的安全环境下。

### 2. AI 备课工具 (AI PPT Workbench)

- **路径**: `项目/已完成项目/ai备课工具`
- **说明**: 集成 Gemini AI 能力的 PPT 辅助设计系统，支持 PDF 导出。
- **状态**: 稳定运行中。

### 3. 班级值日表 (Class Duty Schedule)

- **路径**: `项目/已完成项目/班级值日表-1.0`
- **说明**: 班级自动值日排班系统。

---

## 🛡️ 安全与依赖管理

为了确保项目的长期稳定性，我们对依赖项进行了深度审计和加固：

- **依赖对齐**: 所有子项目的 `node_modules` 均汇聚在根目录下。
- **安全审计**: 已解决 2026 年 3 月发现的 major 级安全漏洞，包括：
  - 更新至 `electron@40.7.0` (修复 tar 漏洞)
  - 更新至 `vite@6.2.0` (修复 esbuild 漏洞)
  - 锁定 `jspdf@2.5.2` (优化 dompurify 安全链)

---

## 🚀 常用开发命令

在根目录下运行：

```powershell
# 1. 安装/同步所有项目依赖
npm install

# 2. 运行安全审计
npm audit

# 3. 清理所有子项目的 node_modules 并重新安装
npm run clean:node_modules
```

### Git 同步规范

```powershell
# 提交并推送到 GitHub
git add .
git commit -m "描述你的更改"
git push origin main
```

---
*Last updated: 2026-03-05* | *Created by Antigravity*
