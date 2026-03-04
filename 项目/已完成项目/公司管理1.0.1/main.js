const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Notification = electron.Notification;
const ipcMain = electron.ipcMain;
const Tray = electron.Tray;
const Menu = electron.Menu;

// 防御检查：IDE 终端可能设置 ELECTRON_RUN_AS_NODE=1 导致 app 为 undefined
if (!app) {
  console.error('[Main] 致命错误: electron.app 未定义');
  process.exit(1);
}

// Windows 通知必须尽早设置 ID
if (process.platform === 'win32') {
  app.setAppUserModelId('com.mamale.company-management');
}

const path = require('path');

// === 单实例锁：防止启动多个应用实例产生多个托盘图标 ===
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // 已有实例在运行，直接退出
  app.quit();
} else {
  app.on('second-instance', () => {
    // 第二个实例尝试启动时，聚焦已有窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 保持窗口对象的全局引用，防止被垃圾回收
let mainWindow;
let tray = null;

function createWindow() {
  console.log('Creating window...');

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: true, // 确保窗口可见
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 生产模式：禁用开发者工具
      devTools: false
    },
    // 窗口标题
    title: '码码乐 - 内部协作管理平台'
  });

  // 加载应用的index.html
  console.log('Loading index.html...');
  mainWindow.loadFile('index.html');

  // 生产模式：不再自动打开 DevTools
  // mainWindow.webContents.openDevTools();


  // 窗口关闭时触发
  mainWindow.on('closed', function () {
    console.log('Window closed');
    // 取消引用窗口对象
    mainWindow = null;
  });

  // 最小化到托盘而不是关闭
  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // 监听加载错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // 监听控制台消息
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Console:', message);
  });
}

// 创建系统托盘（销毁旧实例，防止重复图标）
function createTray() {
  try {
    // 如果已有托盘实例，先销毁
    if (tray && !tray.isDestroyed()) {
      tray.destroy();
      tray = null;
    }
    // 托盘图标路径
    const fs = require('fs');
    const nativeImage = electron.nativeImage;
    const iconPath = path.join(__dirname, 'build/tray-icon.png');

    let trayIcon;
    if (fs.existsSync(iconPath)) {
      trayIcon = iconPath;
      console.log('[托盘] 使用图标:', iconPath);
    } else {
      console.log('[托盘] 图标文件不存在，生成默认占位图标');
      const size = 16;
      const buf = Buffer.alloc(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        buf[i * 4] = 64;      // R
        buf[i * 4 + 1] = 128; // G
        buf[i * 4 + 2] = 255; // B
        buf[i * 4 + 3] = 255; // A
      }
      trayIcon = nativeImage.createFromBuffer(buf, { width: size, height: size });
    }

    tray = new Tray(trayIcon);

    // 托盘菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: '消息中心',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // 通知渲染进程切换到消息页面
            mainWindow.webContents.send('navigate-to', 'messages');
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('码码乐 - 内部协作管理平台');
    tray.setContextMenu(contextMenu);

    // 双击托盘图标显示窗口
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // 单击托盘图标也显示窗口（Windows 习惯）
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    console.log('[托盘] 系统托盘创建成功');
  } catch (err) {
    console.error('[托盘] 创建失败:', err);
  }
}

// Electron完成初始化后创建窗口
app.whenReady().then(() => {
  createWindow();
  createTray();
});

// 应用退出前清理托盘
app.on('before-quit', () => {
  app.isQuiting = true;
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
});

// 关闭所有窗口时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，应用和菜单栏通常保持活动状态
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // 在macOS上，点击dock图标重新创建窗口
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC处理程序，用于处理渲染进程的通知请求
ipcMain.on('show-notification', (event, notificationData) => {
  const { title, body, icon } = notificationData;

  if (!Notification.isSupported()) {
    console.error('[Main] 系统层面不支持通知');
    return;
  }
  try {
    const notification = new Notification({
      title: title || '码码乐',
      body: body || '',
      icon: icon || path.join(__dirname, 'build/tray-icon.png')
    });

    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('navigate-to', 'messages');
      }
    });

    notification.show();
  } catch (err) {
    console.error('[Main] 抛出异常 - 发送通知失败:', err);
  }
});

// 更新托盘图标角标（未读消息数量）
ipcMain.on('update-badge', (event, count) => {
  if (tray) {
    if (count > 0) {
      tray.setToolTip(`码码乐 - ${count} 条未读消息`);
    } else {
      tray.setToolTip('码码乐 - 内部协作管理平台');
    }
  }
});

// 打开外部链接（用于版本更新下载）
ipcMain.on('open-external', (event, url) => {
  const { shell } = require('electron');
  if (url) shell.openExternal(url);
});

// === 静默更新：后台下载安装包 → 静默安装 → 重启 ===
ipcMain.on('download-and-install-update', (event, downloadUrl) => {
  const https = require('https');
  const http = require('http');
  const fs = require('fs');
  const os = require('os');
  const { spawn } = require('child_process');

  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, '码码乐_update_setup.exe');

  console.log('[更新] 开始下载:', downloadUrl);
  console.log('[更新] 保存路径:', filePath);

  // 选择 http/https 模块
  const client = downloadUrl.startsWith('https') ? https : http;

  // 支持重定向的下载函数
  function download(url, redirectCount = 0) {
    if (redirectCount > 5) {
      event.reply('update-download-error', '下载重定向次数过多');
      return;
    }

    client.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
        const redirectUrl = response.headers.location;
        console.log('[更新] 重定向到:', redirectUrl);
        download(redirectUrl, redirectCount + 1);
        return;
      }

      if (response.statusCode !== 200) {
        event.reply('update-download-error', `下载失败: HTTP ${response.statusCode}`);
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
      let downloadedBytes = 0;

      const fileStream = fs.createWriteStream(filePath);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = Math.round((downloadedBytes / totalBytes) * 100);
          event.reply('update-download-progress', progress);
        }
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('[更新] 下载完成，准备静默安装...');
        event.reply('update-download-progress', 100);

        // 延迟 1 秒后启动安装程序并退出应用
        setTimeout(() => {
          try {
            // /S = NSIS 静默安装标志
            const installer = spawn(filePath, ['/S'], {
              detached: true,
              stdio: 'ignore'
            });
            installer.unref();

            console.log('[更新] 安装程序已启动，退出应用...');
            app.isQuiting = true;
            app.quit();
          } catch (err) {
            console.error('[更新] 启动安装程序失败:', err);
            event.reply('update-download-error', '启动安装程序失败: ' + err.message);
          }
        }, 1000);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => { });
        console.error('[更新] 写入文件失败:', err);
        event.reply('update-download-error', '写入文件失败: ' + err.message);
      });
    }).on('error', (err) => {
      console.error('[更新] 下载失败:', err);
      event.reply('update-download-error', '网络错误: ' + err.message);
    });
  }

  download(downloadUrl);
});

// === Claude Code 配置直接读写 ===
ipcMain.handle('read-claude-settings', async () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const configPath = path.join(os.homedir(), '.claude', 'settings.json');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('[Claude] 读取配置失败:', err);
      return null;
    }
  }
  return null;
});

ipcMain.handle('write-claude-settings', async (event, config) => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const claudeDir = path.join(os.homedir(), '.claude');
  const configPath = path.join(claudeDir, 'settings.json');

  try {
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('[Claude] 配置已更新:', configPath);
    return { success: true };
  } catch (err) {
    console.error('[Claude] 写入配置失败:', err);
    return { success: false, error: err.message };
  }
});
