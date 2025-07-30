const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;
let backendProcess = null;

// Function to start backend server
function startBackendServer() {
  if (isDev) return; // Backend already running in dev mode
  
  // In production, the backend files are bundled with the app
  const backendPath = path.join(__dirname, '../backend/index.js');
  console.log('Starting backend server from:', backendPath);
  
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, '../backend'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('Backend stdout:', data.toString());
  });

  backendProcess.stderr.on('data', (data) => {
    console.log('Backend stderr:', data.toString());
  });

  backendProcess.on('close', (code) => {
    console.log('Backend process exited with code:', code);
  });

  // Wait a bit for backend to start
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

// Function to find the correct Vite dev server port
async function findVitePort() {
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          if (res.statusCode === 200) {
            resolve(port);
          } else {
            reject(new Error(`Port ${port} returned status ${res.statusCode}`));
          }
        });
        
        req.on('error', () => reject(new Error(`Port ${port} not available`)));
        req.setTimeout(1000, () => reject(new Error(`Port ${port} timeout`)));
      });
      return port;
    } catch (error) {
      continue;
    }
  }
  throw new Error('No Vite dev server found');
}

async function createWindow() {
  // Start backend server first
  await startBackendServer();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/logo.png'),
    title: 'Tea वृक्ष POS System',
    show: false, // Don't show until ready
    autoHideMenuBar: true // Hide menu bar for cleaner look
  });

  // Load the app
  if (isDev) {
    // In development, find and load from Vite dev server
    findVitePort()
      .then(port => {
        console.log(`Loading from Vite dev server on port ${port}`);
        mainWindow.loadURL(`http://localhost:${port}`);
        // Open DevTools in development
        mainWindow.webContents.openDevTools();
      })
      .catch(error => {
        console.error('Failed to find Vite dev server:', error.message);
        mainWindow.loadURL('http://localhost:5173'); // Fallback
      });
  } else {
    // In production, load the built app
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production app from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up backend process when app quits
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Handle print requests from renderer
ipcMain.handle('print-receipt', async (event, receiptData) => {
  try {
    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Load receipt HTML
    await printWindow.loadURL(`data:text/html,${encodeURIComponent(receiptData)}`);
    
    // Print and close
    const data = await printWindow.webContents.print({ silent: false });
    printWindow.close();
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu); 