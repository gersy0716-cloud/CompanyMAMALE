const { contextBridge, ipcRenderer } = require('electron');

// 在渲染进程中暴露安全的API
contextBridge.exposeInMainWorld('electron', {
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', {
      title: title,
      body: body
    });
  },
  updateBadge: (count) => {
    ipcRenderer.send('update-badge', count);
  },
  onNavigateTo: (callback) => {
    ipcRenderer.on('navigate-to', (event, page) => callback(page));
  },
  speakText: (text) => {
    // TTS 使用渲染进程的 Web SpeechSynthesis API（Electron 内置 Chromium 支持）
    if (typeof speechSynthesis !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.1;
      speechSynthesis.speak(utterance);
    }
  },
  openExternal: (url) => {
    ipcRenderer.send('open-external', url);
  },
  // === 静默更新 API ===
  downloadAndInstallUpdate: (downloadUrl) => {
    ipcRenderer.send('download-and-install-update', downloadUrl);
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-download-error', (event, errorMsg) => callback(errorMsg));
  },
  // === Claude Code 配置读写 ===
  readClaudeSettings: () => ipcRenderer.invoke('read-claude-settings'),
  writeClaudeSettings: (config) => ipcRenderer.invoke('write-claude-settings', config)
});