const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  printInvoice: (data) => ipcRenderer.send('print-invoice', data)
});
