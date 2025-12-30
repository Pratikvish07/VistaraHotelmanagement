const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  win.focus();

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('print-invoice', (event, data) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const printOptions = {
    silent: false,
    printBackground: true,
    color: false,
    margin: {
      marginType: 'printableArea'
    },
    landscape: false,
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
    header: 'Invoice',
    footer: 'Page Header'
  };
  win.webContents.print(printOptions, (success, errorType) => {
    if (!success) console.log(errorType);
  });
});
