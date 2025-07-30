const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Print functionality
  printReceipt: (receiptData) => ipcRenderer.invoke('print-receipt', receiptData),
  
  // App info
  getAppVersion: () => process.versions.electron,
  
  // Platform info
  getPlatform: () => process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Listen for events from main process
  onPrintComplete: (callback) => {
    ipcRenderer.on('print-complete', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 