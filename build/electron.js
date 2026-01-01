const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load React build
  win.loadFile(path.join(__dirname, "../build/index.html"));
}

app.whenReady().then(createWindow);

ipcMain.on("print-invoice", (event, data) => {
  console.log("Invoice data received:", data);
});
