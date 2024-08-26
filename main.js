const {app, BrowserWindow, dialog, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs').promises;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: true
    }
  });

  mainWindow.loadFile('index.html');
}


//bullshit mac stuff
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// open file dialog
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }
        ]
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

// open folder
ipcMain.handle('dialog:openFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});


// IPC handler to read file contents
ipcMain.handle('readFile', async (event, filePath) => {
    try {
        console.log("do you get even here?");
        const data = await fs.readFile(filePath);
        return data;  // Return the raw buffer
    } catch (error) {
        console.error(`Failed to read file: ${error.message}`);
        throw new Error(`Failed to read file: ${error.message}`);
    }
});

ipcMain.handle('readDirectory', async (event, dirPath) => {
    try {
        const files = await fs.readdir(dirPath);
        return files;
    } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
    }
});


app.whenReady().then(createWindow);
