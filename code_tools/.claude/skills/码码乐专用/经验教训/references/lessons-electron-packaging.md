# Electron 应用打包与分发经验

## 🚀 核心方案：NSIS 完整安装包

**场景**：公司内部分发，无需自动更新服务器，直接分发 .exe。

### package.json 关键配置

```json
{
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }]
  },
  "electronDownload": {
    "mirror": "https://npmmirror.com/mirrors/electron/"
  },
  "publish": null
}
```

## 🛠️ 国内环境避坑指南

### 1. Electron 镜像问题 (Timeout)

默认从 GitHub 下载极慢且易超时。务必在 `build` 配置和 `.npmrc` 中手动指定国内镜像。

### 2. NSIS 语言配置报错

报错 `Language name is unknown for simpchinese` 时，通常是因为 `installerLanguages` 字段命名不规范。

- **建议**：除非有特殊多语言需求，否则直接删除该字段，让其回退到默认设置。

### 3. 可执行文件分发误区

用户不能直接运行 `win-unpacked` 目录下的 .exe。必须分发 `nsis` 脚本生成的 Setup 安装包。

## 📦 大文件上传与分发 (413 错误处理)

公司 API 通常存在 `413 Request Entity Too Large` 限制。

**方案 A：服务器端修改**
`client_max_body_size 100m;` (需权限)

**方案 B：客户端分片上传 (推荐)**
使用 `upload-release.js` 将 70MB+ 的安装包切成 10MB 的分片顺序上传，规避限制。

## 📑 常用脚本参考

| 脚本 | 功能 |
|:---|:---|
| `upload-release.js` | 安装包分片上传至公司服务器 |
| `merge-chunks.js` | (备用) 分片合包逻辑 |
| `upload-to-oss.js` | 外部 OSS 存储上传方案 |
